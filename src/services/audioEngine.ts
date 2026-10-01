/**
 * Real Web Audio API Low-Latency DSP Engine
 * Handles ambient soundscape procedural synthesis, multi-layer affirmation mixing,
 * channel strips (dB, pan, mute, solo), timing offsets, A/B instant comparison,
 * live AnalyserNode FFT metrics, and OfflineAudioContext WAV export.
 */
import { AffirmationModule, AmbientSoundType, AmbientTrack, Project } from '../types';

export interface VisualizerData {
  timeDomainData: Uint8Array;
  frequencyData: Uint8Array;
  currentPeakDb: number;
  isClipping: boolean;
}

export interface MixConfiguration {
  id: 'A' | 'B';
  name: string;
  affirmationVolumeDb: number;
  ambientVolumeDb: number;
}

export type PlaybackStateListener = (state: {
  isPlaying: boolean;
  elapsedSeconds: number;
  durationSeconds: number;
  activeModulesCount: number;
}) => void;

class AudioEngine {
  private ctx: AudioContext | null = null;
  private masterGain: GainNode | null = null;
  private analyser: AnalyserNode | null = null;

  // Ambient sound source
  private ambientGainNode: GainNode | null = null;
  private ambientPannerNode: StereoPannerNode | null = null;
  private ambientSourceNode: AudioNode | null = null;
  private ambientCustomBuffer: AudioBuffer | null = null;
  private ambientLfo: OscillatorNode | null = null;

  // Voice/Affirmation channel nodes mapped by module ID
  private moduleChannels: Map<
    string,
    {
      gainNode: GainNode;
      pannerNode: StereoPannerNode;
      bufferSource?: AudioBufferSourceNode;
      audioBuffer?: AudioBuffer;
      timingOffsetMs: number;
    }
  > = new Map();

  // Recorded custom voice buffers by module ID
  private voiceBuffers: Map<string, AudioBuffer> = new Map();

  // Playback state
  private isPlaying = false;
  private startTime = 0;
  private pausedAt = 0;
  private sessionDurationSeconds = 1800; // 30 min default
  private timerInterval: number | null = null;
  private listeners: Set<PlaybackStateListener> = new Set();

  // A/B Comparison state
  private activeMixMode: 'A' | 'B' = 'A';
  private mixA: MixConfiguration = {
    id: 'A',
    name: 'Mix A (Current)',
    affirmationVolumeDb: -22,
    ambientVolumeDb: 0,
  };
  private mixB: MixConfiguration = {
    id: 'B',
    name: 'Mix B (Alternate)',
    affirmationVolumeDb: -18,
    ambientVolumeDb: -3,
  };

  // Cached project reference
  private currentProject: Project | null = null;

  // Speech synthesis loop state
  private isSpeechLoopActive = false;
  private speechLoopTimeout: number | null = null;
  private speechUtterances: SpeechSynthesisUtterance[] = [];

  constructor() {
    // AudioContext will be initialized on first user interaction to comply with iOS Safari
  }

  // --- AUDIO CONTEXT INITIALIZATION & UNLOCK ---
  public async getOrCreateContext(): Promise<AudioContext> {
    if (!this.ctx) {
      const AudioCtxClass = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
      this.ctx = new AudioCtxClass();

      // Master output and Analyser
      this.masterGain = this.ctx.createGain();
      this.masterGain.gain.setValueAtTime(1.0, this.ctx.currentTime);

      this.analyser = this.ctx.createAnalyser();
      this.analyser.fftSize = 256;
      this.analyser.smoothingTimeConstant = 0.8;

      this.masterGain.connect(this.analyser);
      this.analyser.connect(this.ctx.destination);
    }

    if (this.ctx.state === 'suspended') {
      await this.ctx.resume();
    }

    return this.ctx;
  }

  // --- iOS SAFARI AUDIO & SPEECH PRIMING ---
  public async unlockIOSAudio(): Promise<void> {
    try {
      const ctx = await this.getOrCreateContext();
      if (ctx.state === 'suspended') {
        await ctx.resume();
      }
      // Silent buffer trick for iOS WebKit
      const buffer = ctx.createBuffer(1, 1, 22050);
      const source = ctx.createBufferSource();
      source.buffer = buffer;
      source.connect(ctx.destination);
      source.start(0);

      // Prime SpeechSynthesis on iOS
      if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
        window.speechSynthesis.resume();
        const silentUtter = new SpeechSynthesisUtterance(' ');
        silentUtter.volume = 0.01;
        silentUtter.rate = 2.0;
        window.speechSynthesis.speak(silentUtter);
      }
    } catch {
      // Ignore background gesture failures
    }
  }

  // --- HAPTIC FEEDBACK ---
  public triggerHaptic(type: 'light' | 'medium' | 'heavy' = 'light'): void {
    if (typeof navigator !== 'undefined' && 'vibrate' in navigator) {
      try {
        if (type === 'light') navigator.vibrate(6);
        else if (type === 'medium') navigator.vibrate(14);
        else navigator.vibrate(24);
      } catch {
        // Ignore
      }
    }
  }

  // --- DB TO GAIN CONVERSION (Standard Audio DSP) ---
  public dbToGain(db: number): number {
    if (db <= -48) return 0;
    return Math.pow(10, db / 20);
  }

  public gainToDb(gain: number): number {
    if (gain <= 0.00398) return -48;
    return Math.round(20 * Math.log10(gain));
  }

  // --- AMBIENT SOUND GENERATION (Real procedural Web Audio DSP) ---
  public async startAmbient(track: AmbientTrack): Promise<void> {
    const ctx = await this.getOrCreateContext();

    // Stop existing ambient node
    this.stopAmbient();

    if (!track.enabled || track.isMuted) return;

    // Create gain and panner
    this.ambientGainNode = ctx.createGain();
    const effectiveDb =
      this.activeMixMode === 'B' ? this.mixB.ambientVolumeDb : track.volumeDb;
    this.ambientGainNode.gain.setValueAtTime(this.dbToGain(effectiveDb), ctx.currentTime);

    this.ambientPannerNode = ctx.createStereoPanner();
    this.ambientPannerNode.pan.setValueAtTime(track.pan || 0, ctx.currentTime);

    this.ambientGainNode.connect(this.ambientPannerNode);
    this.ambientPannerNode.connect(this.masterGain!);

    // Synthesize procedural noise or play custom buffer
    if (track.type === 'custom' && this.ambientCustomBuffer) {
      const source = ctx.createBufferSource();
      source.buffer = this.ambientCustomBuffer;
      source.loop = true;
      source.connect(this.ambientGainNode);
      source.start();
      this.ambientSourceNode = source;
    } else {
      this.ambientSourceNode = this.createProceduralAmbient(ctx, track.type, this.ambientGainNode);
    }
  }

  public stopAmbient(): void {
    if (this.ambientSourceNode) {
      try {
        if ('stop' in this.ambientSourceNode && typeof (this.ambientSourceNode as AudioScheduledSourceNode).stop === 'function') {
          (this.ambientSourceNode as AudioScheduledSourceNode).stop();
        }
        this.ambientSourceNode.disconnect();
      } catch {
        // Ignore disconnect errors on already stopped nodes
      }
      this.ambientSourceNode = null;
    }
    if (this.ambientLfo) {
      try {
        this.ambientLfo.stop();
        this.ambientLfo.disconnect();
      } catch {
        // Ignore
      }
      this.ambientLfo = null;
    }
  }

  private createProceduralAmbient(
    ctx: AudioContext,
    type: AmbientSoundType,
    outputNode: AudioNode
  ): AudioNode {
    const bufferSize = ctx.sampleRate * 4; // 4 seconds looping noise
    const noiseBuffer = ctx.createBuffer(2, bufferSize, ctx.sampleRate);
    const leftData = noiseBuffer.getChannelData(0);
    const rightData = noiseBuffer.getChannelData(1);

    // Procedural noise synthesis
    if (type === 'white_noise') {
      for (let i = 0; i < bufferSize; i++) {
        leftData[i] = Math.random() * 2 - 1;
        rightData[i] = Math.random() * 2 - 1;
      }
    } else if (type === 'pink_noise') {
      // Paul Kellet's filter method
      let b0 = 0, b1 = 0, b2 = 0, b3 = 0, b4 = 0, b5 = 0, b6 = 0;
      for (let i = 0; i < bufferSize; i++) {
        const white = Math.random() * 2 - 1;
        b0 = 0.99886 * b0 + white * 0.0555179;
        b1 = 0.99332 * b1 + white * 0.0750759;
        b2 = 0.96900 * b2 + white * 0.1538520;
        b3 = 0.86650 * b3 + white * 0.3104856;
        b4 = 0.55000 * b4 + white * 0.5329522;
        b5 = -0.7616 * b5 - white * 0.0168980;
        leftData[i] = (b0 + b1 + b2 + b3 + b4 + b5 + b6 + white * 0.5362) * 0.11;
        rightData[i] = leftData[i] * (0.95 + Math.random() * 0.1);
        b6 = white * 0.115926;
      }
    } else if (type === 'brown_noise' || type === 'ocean') {
      // Integrated white noise (Brownian / -6dB/oct)
      let lastL = 0;
      let lastR = 0;
      for (let i = 0; i < bufferSize; i++) {
        const whiteL = Math.random() * 2 - 1;
        const whiteR = Math.random() * 2 - 1;
        lastL = (lastL + 0.02 * whiteL) / 1.02;
        lastR = (lastR + 0.02 * whiteR) / 1.02;
        leftData[i] = lastL * 3.5;
        rightData[i] = lastR * 3.5;
      }
    } else {
      // Rain / Forest / Fireplace base noise
      for (let i = 0; i < bufferSize; i++) {
        leftData[i] = Math.random() * 2 - 1;
        rightData[i] = Math.random() * 2 - 1;
      }
    }

    const noiseSource = ctx.createBufferSource();
    noiseSource.buffer = noiseBuffer;
    noiseSource.loop = true;

    // Filter routing tailored for each ambient category
    if (type === 'heavy_rain') {
      // Dual-band filter for rain rumble + droplet patter
      const lowFilter = ctx.createBiquadFilter();
      lowFilter.type = 'lowpass';
      lowFilter.frequency.setValueAtTime(1400, ctx.currentTime);

      const highFilter = ctx.createBiquadFilter();
      highFilter.type = 'highpass';
      highFilter.frequency.setValueAtTime(450, ctx.currentTime);

      noiseSource.connect(lowFilter);
      lowFilter.connect(highFilter);
      highFilter.connect(outputNode);
    } else if (type === 'gentle_rain') {
      const bandpass = ctx.createBiquadFilter();
      bandpass.type = 'bandpass';
      bandpass.frequency.setValueAtTime(1800, ctx.currentTime);
      bandpass.Q.setValueAtTime(0.7, ctx.currentTime);

      noiseSource.connect(bandpass);
      bandpass.connect(outputNode);
    } else if (type === 'ocean') {
      // Bandpass modulated with slow sine LFO (ocean wave rhythm)
      const filter = ctx.createBiquadFilter();
      filter.type = 'lowpass';
      filter.frequency.setValueAtTime(400, ctx.currentTime);

      const lfo = ctx.createOscillator();
      lfo.frequency.setValueAtTime(0.08, ctx.currentTime); // ~12s wave period
      const lfoGain = ctx.createGain();
      lfoGain.gain.setValueAtTime(250, ctx.currentTime);

      lfo.connect(lfoGain);
      lfoGain.connect(filter.frequency);
      lfo.start();
      this.ambientLfo = lfo;

      noiseSource.connect(filter);
      filter.connect(outputNode);
    } else if (type === 'fireplace') {
      const filter = ctx.createBiquadFilter();
      filter.type = 'lowpass';
      filter.frequency.setValueAtTime(650, ctx.currentTime);

      noiseSource.connect(filter);
      filter.connect(outputNode);
    } else if (type === 'forest') {
      const filter = ctx.createBiquadFilter();
      filter.type = 'bandpass';
      filter.frequency.setValueAtTime(1100, ctx.currentTime);
      filter.Q.setValueAtTime(1.2, ctx.currentTime);

      noiseSource.connect(filter);
      filter.connect(outputNode);
    } else {
      // Brown, Pink, White noise default
      noiseSource.connect(outputNode);
    }

    noiseSource.start();
    return noiseSource;
  }

  // --- REGISTER CUSTOM RECORDED AUDIO BUFFERS ---
  public registerVoiceBuffer(moduleId: string, buffer: AudioBuffer): void {
    this.voiceBuffers.set(moduleId, buffer);
  }

  public registerCustomAmbientBuffer(buffer: AudioBuffer): void {
    this.ambientCustomBuffer = buffer;
  }

  // --- MULTI-LAYER AFFIRMATION MIXING & ROUTING ---
  public async setupProjectRouting(project: Project): Promise<void> {
    this.currentProject = project;
    const ctx = await this.getOrCreateContext();

    // Check if any track is soloed
    const anySolo = project.modules.some((m) => m.isSolo && m.enabled);

    // Setup or update channel strips for each module
    for (const mod of project.modules) {
      let channel = this.moduleChannels.get(mod.id);

      if (!channel) {
        const gainNode = ctx.createGain();
        const pannerNode = ctx.createStereoPanner();
        gainNode.connect(pannerNode);
        pannerNode.connect(this.masterGain!);

        channel = {
          gainNode,
          pannerNode,
          timingOffsetMs: mod.timingOffsetMs,
        };
        this.moduleChannels.set(mod.id, channel);
      }

      // Update volume and mute/solo
      channel.timingOffsetMs = mod.timingOffsetMs;
      channel.pannerNode.pan.setValueAtTime(mod.pan, ctx.currentTime);

      let effectiveDb = mod.volumeDb;
      if (this.activeMixMode === 'B') {
        effectiveDb = this.mixB.affirmationVolumeDb;
      }

      const shouldMute =
        !mod.enabled ||
        mod.isMuted ||
        (anySolo && !mod.isSolo);

      const targetGain = shouldMute ? 0 : this.dbToGain(effectiveDb);
      // Smooth parameter ramp to avoid clicks
      channel.gainNode.gain.cancelScheduledValues(ctx.currentTime);
      channel.gainNode.gain.linearRampToValueAtTime(targetGain, ctx.currentTime + 0.05);
    }

    // Set Master volume
    if (this.masterGain) {
      const masterTargetGain = this.dbToGain(project.masterVolumeDb || 0);
      this.masterGain.gain.setValueAtTime(masterTargetGain, ctx.currentTime);
    }
  }

  // --- REAL-TIME VOLUME / PAN ADJUSTMENTS DURING PLAYBACK ---
  public setModuleVolume(moduleId: string, volumeDb: number): void {
    const channel = this.moduleChannels.get(moduleId);
    if (!channel || !this.ctx) return;
    const targetGain = this.dbToGain(volumeDb);
    channel.gainNode.gain.cancelScheduledValues(this.ctx.currentTime);
    channel.gainNode.gain.linearRampToValueAtTime(targetGain, this.ctx.currentTime + 0.04);
  }

  public setModulePan(moduleId: string, pan: number): void {
    const channel = this.moduleChannels.get(moduleId);
    if (!channel || !this.ctx) return;
    channel.pannerNode.pan.setValueAtTime(Math.max(-1, Math.min(1, pan)), this.ctx.currentTime);
  }

  public setAmbientVolume(volumeDb: number): void {
    if (!this.ambientGainNode || !this.ctx) return;
    const targetGain = this.dbToGain(volumeDb);
    this.ambientGainNode.gain.cancelScheduledValues(this.ctx.currentTime);
    this.ambientGainNode.gain.linearRampToValueAtTime(targetGain, this.ctx.currentTime + 0.04);
  }

  public setMasterVolume(volumeDb: number): void {
    if (!this.masterGain || !this.ctx) return;
    const targetGain = this.dbToGain(volumeDb);
    this.masterGain.gain.setValueAtTime(targetGain, this.ctx.currentTime);
  }

  // --- A/B INSTANT MIX COMPARISON ---
  public setMixConfig(mode: 'A' | 'B', config: Partial<MixConfiguration>): void {
    if (mode === 'A') {
      this.mixA = { ...this.mixA, ...config };
    } else {
      this.mixB = { ...this.mixB, ...config };
    }
    if (this.activeMixMode === mode && this.currentProject) {
      this.applyMixConfig(mode);
    }
  }

  public toggleABMix(): 'A' | 'B' {
    this.activeMixMode = this.activeMixMode === 'A' ? 'B' : 'A';
    this.applyMixConfig(this.activeMixMode);
    return this.activeMixMode;
  }

  public getActiveMixMode(): 'A' | 'B' {
    return this.activeMixMode;
  }

  public getMixConfigs(): { mixA: MixConfiguration; mixB: MixConfiguration } {
    return { mixA: this.mixA, mixB: this.mixB };
  }

  private applyMixConfig(mode: 'A' | 'B'): void {
    if (!this.ctx || !this.currentProject) return;
    const config = mode === 'A' ? this.mixA : this.mixB;

    // Apply affirmation gain to all enabled modules
    for (const mod of this.currentProject.modules) {
      if (mod.enabled && !mod.isMuted) {
        this.setModuleVolume(mod.id, config.affirmationVolumeDb);
      }
    }

    // Apply ambient gain
    this.setAmbientVolume(config.ambientVolumeDb);
  }

  // --- PLAYBACK CONTROL (PLAY / PAUSE / STOP) ---
  public async play(project: Project, durationSeconds = 1800): Promise<void> {
    const ctx = await this.getOrCreateContext();
    this.currentProject = project;
    this.sessionDurationSeconds = durationSeconds;

    await this.setupProjectRouting(project);
    await this.startAmbient(project.ambientTrack);

    this.isPlaying = true;
    this.startTime = ctx.currentTime - this.pausedAt;

    // Start affirmations speech engine / voice buffer playback
    this.startAffirmationsPlayback(project);

    // Start timer interval for UI updates
    if (this.timerInterval) clearInterval(this.timerInterval);
    this.timerInterval = window.setInterval(() => {
      this.notifyListeners();
    }, 250);

    this.notifyListeners();
  }

  public pause(): void {
    if (!this.isPlaying) return;
    if (this.ctx) {
      this.pausedAt = this.ctx.currentTime - this.startTime;
    }
    this.isPlaying = false;
    this.stopAmbient();
    this.stopAffirmationsPlayback();

    if (this.timerInterval) {
      clearInterval(this.timerInterval);
      this.timerInterval = null;
    }

    this.notifyListeners();
  }

  public stop(): void {
    this.isPlaying = false;
    this.pausedAt = 0;
    this.stopAmbient();
    this.stopAffirmationsPlayback();

    if (this.timerInterval) {
      clearInterval(this.timerInterval);
      this.timerInterval = null;
    }

    this.notifyListeners();
  }

  public seek(seconds: number): void {
    this.pausedAt = Math.max(0, Math.min(seconds, this.sessionDurationSeconds));
    if (this.ctx && this.isPlaying) {
      this.startTime = this.ctx.currentTime - this.pausedAt;
    }
    this.notifyListeners();
  }

  // --- MULTI-LAYER AFFIRMATION EXECUTION (Microsecond offsets & speech) ---
  private startAffirmationsPlayback(project: Project): void {
    this.isSpeechLoopActive = true;
    this.speechUtterances = [];

    const activeModules = project.modules.filter((m) => m.enabled && !m.isMuted);
    if (activeModules.length === 0) return;

    // Check if Web Speech API is supported
    const hasSpeech = typeof window !== 'undefined' && 'speechSynthesis' in window;

    // Loop through active modules and schedule according to each layer's timing offset
    activeModules.forEach((mod) => {
      const buffer = this.voiceBuffers.get(mod.id);

      if (buffer && this.ctx) {
        // If user recorded their own voice for this module, play from AudioBuffer!
        const scheduleBufferLoop = () => {
          if (!this.isSpeechLoopActive || !this.ctx) return;
          const source = this.ctx.createBufferSource();
          source.buffer = buffer;
          const channel = this.moduleChannels.get(mod.id);
          if (channel) {
            source.connect(channel.gainNode);
          }
          source.onended = () => {
            if (this.isSpeechLoopActive) {
              const delay = mod.voiceSettings.pauseDurationMs || 1000;
              setTimeout(scheduleBufferLoop, delay);
            }
          };
          source.start();
        };

        setTimeout(scheduleBufferLoop, mod.timingOffsetMs);
      } else if (hasSpeech && mod.affirmations.length > 0) {
        // Play via browser SpeechSynthesis with individual speed, pitch, and staggered layer offset
        this.runModuleSpeechLoop(mod, mod.timingOffsetMs);
      }
    });
  }

  private runModuleSpeechLoop(mod: AffirmationModule, initialDelayMs: number): void {
    if (!this.isSpeechLoopActive) return;

    const enabledAffirmations = mod.affirmations.filter((a) => a.enabled);
    if (enabledAffirmations.length === 0) return;

    let currentIndex = 0;

    const speakNext = () => {
      if (!this.isSpeechLoopActive) return;

      const aff = enabledAffirmations[currentIndex];
      const utter = new SpeechSynthesisUtterance(aff.text);

      // Voice settings
      utter.rate = mod.voiceSettings.speed || 1.0;
      utter.pitch = mod.voiceSettings.pitch || 0.9;
      // Speech volume scaled by channel gain
      const effectiveDb =
        this.activeMixMode === 'B' ? this.mixB.affirmationVolumeDb : mod.volumeDb;
      utter.volume = Math.max(0.01, Math.min(1.0, this.dbToGain(effectiveDb)));

      // Select system voice if available
      const voices = window.speechSynthesis.getVoices();
      if (voices.length > 0) {
        const found = voices.find(
          (v) => v.name === mod.voiceSettings.voiceName || v.voiceURI === mod.voiceSettings.voiceId
        );
        if (found) utter.voice = found;
      }

      utter.onend = () => {
        if (!this.isSpeechLoopActive) return;
        currentIndex = (currentIndex + 1) % enabledAffirmations.length;
        const pause = mod.voiceSettings.pauseDurationMs || 1200;
        this.speechLoopTimeout = window.setTimeout(speakNext, pause);
      };

      utter.onerror = () => {
        if (!this.isSpeechLoopActive) return;
        currentIndex = (currentIndex + 1) % enabledAffirmations.length;
        this.speechLoopTimeout = window.setTimeout(speakNext, 1000);
      };

      this.speechUtterances.push(utter);
      window.speechSynthesis.speak(utter);
    };

    setTimeout(speakNext, initialDelayMs);
  }

  private stopAffirmationsPlayback(): void {
    this.isSpeechLoopActive = false;
    if (this.speechLoopTimeout) {
      clearTimeout(this.speechLoopTimeout);
      this.speechLoopTimeout = null;
    }
    if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
      window.speechSynthesis.cancel();
    }
    this.speechUtterances = [];
  }

  // --- REAL-TIME VISUALIZER & PEAK METRICS ---
  public getVisualizerData(): VisualizerData {
    const timeDomainData = new Uint8Array(128);
    const frequencyData = new Uint8Array(128);

    if (this.analyser && this.isPlaying) {
      this.analyser.getByteTimeDomainData(timeDomainData);
      this.analyser.getByteFrequencyData(frequencyData);
    } else {
      // Idle baseline
      timeDomainData.fill(128);
      frequencyData.fill(0);
    }

    // Calculate current peak level in dB
    let maxAmp = 0;
    for (let i = 0; i < timeDomainData.length; i++) {
      const amp = Math.abs(timeDomainData[i] - 128) / 128;
      if (amp > maxAmp) maxAmp = amp;
    }

    const currentPeakDb = maxAmp > 0 ? Math.round(20 * Math.log10(maxAmp)) : -48;
    const isClipping = currentPeakDb >= 0;

    return {
      timeDomainData,
      frequencyData,
      currentPeakDb,
      isClipping,
    };
  }

  // --- STATE LISTENERS ---
  public addListener(listener: PlaybackStateListener): () => void {
    this.listeners.add(listener);
    return () => this.listeners.delete(listener);
  }

  private notifyListeners(): void {
    const elapsed = this.isPlaying && this.ctx ? Math.max(0, this.ctx.currentTime - this.startTime) : this.pausedAt;
    const activeCount = this.currentProject
      ? this.currentProject.modules.filter((m) => m.enabled && !m.isMuted).length
      : 0;

    const state = {
      isPlaying: this.isPlaying,
      elapsedSeconds: Math.floor(elapsed),
      durationSeconds: this.sessionDurationSeconds,
      activeModulesCount: activeCount,
    };

    this.listeners.forEach((listener) => listener(state));
  }

  public getIsPlaying(): boolean {
    return this.isPlaying;
  }

  // --- REAL WAV EXPORT PIPELINE (OfflineAudioContext) ---
  public async exportToWav(
    project: Project,
    durationSeconds = 60
  ): Promise<{ blob: Blob; fileName: string; durationSeconds: number; fileSizeKb: number }> {
    const sampleRate = 44100;
    const length = sampleRate * durationSeconds;
    const offlineCtx = new OfflineAudioContext(2, length, sampleRate);

    // Offline Master Gain
    const offlineMasterGain = offlineCtx.createGain();
    offlineMasterGain.gain.setValueAtTime(this.dbToGain(project.masterVolumeDb || 0), 0);
    offlineMasterGain.connect(offlineCtx.destination);

    // 1. Render Ambient Track
    if (project.ambientTrack.enabled && !project.ambientTrack.isMuted) {
      const ambientGain = offlineCtx.createGain();
      ambientGain.gain.setValueAtTime(this.dbToGain(project.ambientTrack.volumeDb), 0);

      const panner = offlineCtx.createStereoPanner();
      panner.pan.setValueAtTime(project.ambientTrack.pan || 0, 0);

      ambientGain.connect(panner);
      panner.connect(offlineMasterGain);

      // Create ambient buffer inside offline context
      const noiseBuffer = offlineCtx.createBuffer(2, length, sampleRate);
      const l = noiseBuffer.getChannelData(0);
      const r = noiseBuffer.getChannelData(1);

      if (project.ambientTrack.type === 'brown_noise' || project.ambientTrack.type === 'heavy_rain') {
        let lastL = 0;
        let lastR = 0;
        for (let i = 0; i < length; i++) {
          const wL = Math.random() * 2 - 1;
          const wR = Math.random() * 2 - 1;
          lastL = (lastL + 0.02 * wL) / 1.02;
          lastR = (lastR + 0.02 * wR) / 1.02;
          l[i] = lastL * 3.5;
          r[i] = lastR * 3.5;
        }
      } else {
        for (let i = 0; i < length; i++) {
          l[i] = Math.random() * 2 - 1;
          r[i] = Math.random() * 2 - 1;
        }
      }

      const ambientSource = offlineCtx.createBufferSource();
      ambientSource.buffer = noiseBuffer;
      ambientSource.loop = true;

      // Filter for rain
      const filter = offlineCtx.createBiquadFilter();
      filter.type = 'lowpass';
      filter.frequency.setValueAtTime(1400, 0);

      ambientSource.connect(filter);
      filter.connect(ambientGain);
      ambientSource.start(0);
    }

    // 2. Render Recorded Voice Layers if present
    for (const mod of project.modules) {
      if (!mod.enabled || mod.isMuted) continue;

      const voiceBuffer = this.voiceBuffers.get(mod.id);
      if (voiceBuffer) {
        const modGain = offlineCtx.createGain();
        modGain.gain.setValueAtTime(this.dbToGain(mod.volumeDb), 0);

        const modPanner = offlineCtx.createStereoPanner();
        modPanner.pan.setValueAtTime(mod.pan, 0);

        modGain.connect(modPanner);
        modPanner.connect(offlineMasterGain);

        // Schedule buffer repeats across the render duration
        const bufferDuration = voiceBuffer.duration;
        const offsetSec = (mod.timingOffsetMs || 0) / 1000;
        const pauseSec = (mod.voiceSettings.pauseDurationMs || 1000) / 1000;

        let curTime = offsetSec;
        while (curTime < durationSeconds) {
          const voiceSource = offlineCtx.createBufferSource();
          voiceSource.buffer = voiceBuffer;
          voiceSource.connect(modGain);
          voiceSource.start(curTime);
          curTime += bufferDuration + pauseSec;
        }
      }
    }

    // Render Audio
    const renderedBuffer = await offlineCtx.startRendering();
    const wavBlob = this.audioBufferToWav(renderedBuffer);
    const sanitizedProjectName = project.name.toLowerCase().replace(/[^a-z0-9]/g, '_');
    const fileName = `kaizen_${sanitizedProjectName}_${durationSeconds}s.wav`;
    const fileSizeKb = Math.round(wavBlob.size / 1024);

    return {
      blob: wavBlob,
      fileName,
      durationSeconds,
      fileSizeKb,
    };
  }

  // Standard 16-bit PCM WAV Encoder
  private audioBufferToWav(buffer: AudioBuffer): Blob {
    const numChannels = buffer.numberOfChannels;
    const sampleRate = buffer.sampleRate;
    const format = 1; // PCM
    const bitDepth = 16;
    const bytesPerSample = bitDepth / 8;
    const blockAlign = numChannels * bytesPerSample;

    const numSamples = buffer.length;
    const dataByteCount = numSamples * blockAlign;
    const headerByteCount = 44;
    const totalByteCount = headerByteCount + dataByteCount;

    const arrayBuffer = new ArrayBuffer(totalByteCount);
    const view = new DataView(arrayBuffer);

    // RIFF chunk descriptor
    this.writeString(view, 0, 'RIFF');
    view.setUint32(4, 36 + dataByteCount, true);
    this.writeString(view, 8, 'WAVE');

    // fmt sub-chunk
    this.writeString(view, 12, 'fmt ');
    view.setUint32(16, 16, true);
    view.setUint16(20, format, true);
    view.setUint16(22, numChannels, true);
    view.setUint32(24, sampleRate, true);
    view.setUint32(28, sampleRate * blockAlign, true);
    view.setUint16(32, blockAlign, true);
    view.setUint16(34, bitDepth, true);

    // data sub-chunk
    this.writeString(view, 36, 'data');
    view.setUint32(40, dataByteCount, true);

    // Write interleaved 16-bit samples
    const channels: Float32Array[] = [];
    for (let c = 0; c < numChannels; c++) {
      channels.push(buffer.getChannelData(c));
    }

    let offset = 44;
    for (let i = 0; i < numSamples; i++) {
      for (let c = 0; c < numChannels; c++) {
        let sample = channels[c][i];
        // Clip protection
        sample = Math.max(-1, Math.min(1, sample));
        // Convert to 16-bit signed integer
        const intSample = sample < 0 ? sample * 0x8000 : sample * 0x7fff;
        view.setInt16(offset, intSample, true);
        offset += 2;
      }
    }

    return new Blob([view], { type: 'audio/wav' });
  }

  private writeString(view: DataView, offset: number, string: string): void {
    for (let i = 0; i < string.length; i++) {
      view.setUint8(offset + i, string.charCodeAt(i));
    }
  }
}

export const audioEngine = new AudioEngine();
