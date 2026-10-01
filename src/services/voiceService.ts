/**
 * Voice Service: Handles Browser SpeechSynthesis voices,
 * Live Microphone Recording via MediaRecorder to AudioBuffer,
 * and audio file import decoding.
 */
import { audioEngine } from './audioEngine';
import { storageService } from './storage';

export interface AvailableVoice {
  id: string;
  name: string;
  lang: string;
  isDefault: boolean;
}

class VoiceService {
  private mediaRecorder: MediaRecorder | null = null;
  private recordedChunks: Blob[] = [];

  // Get available speech synthesis voices
  public async getAvailableVoices(): Promise<AvailableVoice[]> {
    if (typeof window === 'undefined' || !('speechSynthesis' in window)) {
      return [];
    }

    return new Promise((resolve) => {
      let voices = window.speechSynthesis.getVoices();
      if (voices.length > 0) {
        resolve(
          voices.map((v) => ({
            id: v.voiceURI,
            name: v.name,
            lang: v.lang,
            isDefault: v.default,
          }))
        );
        return;
      }

      window.speechSynthesis.onvoiceschanged = () => {
        voices = window.speechSynthesis.getVoices();
        resolve(
          voices.map((v) => ({
            id: v.voiceURI,
            name: v.name,
            lang: v.lang,
            isDefault: v.default,
          }))
        );
      };

      // Fallback timeout in case voiceschanged does not trigger
      setTimeout(() => {
        voices = window.speechSynthesis.getVoices();
        resolve(
          voices.map((v) => ({
            id: v.voiceURI,
            name: v.name,
            lang: v.lang,
            isDefault: v.default,
          }))
        );
      }, 500);
    });
  }

  // Audition / preview a single affirmation phrase with selected voice settings
  public previewVoice(
    text: string,
    voiceName: string,
    speed: number,
    pitch: number,
    volume = 0.8
  ): void {
    if (typeof window === 'undefined' || !('speechSynthesis' in window)) {
      return;
    }

    window.speechSynthesis.cancel();
    const utter = new SpeechSynthesisUtterance(text || 'I am grounded in unshakable inner certainty.');
    utter.rate = speed || 1.0;
    utter.pitch = pitch || 1.0;
    utter.volume = Math.max(0.1, Math.min(1.0, volume));

    const voices = window.speechSynthesis.getVoices();
    const found = voices.find((v) => v.name === voiceName || v.voiceURI === voiceName);
    if (found) utter.voice = found;

    window.speechSynthesis.speak(utter);
  }

  public stopVoicePreview(): void {
    if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
      window.speechSynthesis.cancel();
    }
  }

  // --- MICROPHONE RECORDING ---
  public async startRecording(): Promise<void> {
    if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
      throw new Error('Microphone capture not supported on this browser/environment.');
    }

    const stream = await navigator.mediaDevices.getUserMedia({
      audio: {
        echoCancellation: true,
        noiseSuppression: true,
        autoGainControl: true,
      },
    });

    this.recordedChunks = [];
    this.mediaRecorder = new MediaRecorder(stream);

    this.mediaRecorder.ondataavailable = (e) => {
      if (e.data.size > 0) {
        this.recordedChunks.push(e.data);
      }
    };

    this.mediaRecorder.start();
  }

  public async stopRecording(moduleId: string): Promise<{ blob: Blob; audioBuffer: AudioBuffer }> {
    return new Promise((resolve, reject) => {
      if (!this.mediaRecorder) {
        reject(new Error('No active recorder'));
        return;
      }

      this.mediaRecorder.onstop = async () => {
        try {
          const blob = new Blob(this.recordedChunks, { type: 'audio/webm' });
          // Stop media tracks
          this.mediaRecorder?.stream.getTracks().forEach((track) => track.stop());

          // Decode into AudioBuffer
          const ctx = await audioEngine.getOrCreateContext();
          const arrayBuffer = await blob.arrayBuffer();
          const audioBuffer = await ctx.decodeAudioData(arrayBuffer);

          // Register in Audio Engine
          audioEngine.registerVoiceBuffer(moduleId, audioBuffer);

          // Persist in IndexedDB
          await storageService.saveAudioBlob(`mod_voice_${moduleId}`, blob);

          resolve({ blob, audioBuffer });
        } catch (err) {
          reject(err);
        }
      };

      this.mediaRecorder.stop();
    });
  }

  // --- AUDIO FILE IMPORT ---
  public async importAudioFile(file: File, moduleId?: string): Promise<{ blob: Blob; audioBuffer: AudioBuffer }> {
    const ctx = await audioEngine.getOrCreateContext();
    const arrayBuffer = await file.arrayBuffer();
    const audioBuffer = await ctx.decodeAudioData(arrayBuffer);

    if (moduleId) {
      audioEngine.registerVoiceBuffer(moduleId, audioBuffer);
      await storageService.saveAudioBlob(`mod_voice_${moduleId}`, file);
    }

    return { blob: file, audioBuffer };
  }

  // Load previously stored voice recordings on project mount
  public async loadStoredVoiceBuffer(moduleId: string): Promise<AudioBuffer | null> {
    try {
      const blob = await storageService.getAudioBlob(`mod_voice_${moduleId}`);
      if (!blob) return null;
      const ctx = await audioEngine.getOrCreateContext();
      const arrayBuffer = await blob.arrayBuffer();
      const audioBuffer = await ctx.decodeAudioData(arrayBuffer);
      audioEngine.registerVoiceBuffer(moduleId, audioBuffer);
      return audioBuffer;
    } catch {
      return null;
    }
  }
}

export const voiceService = new VoiceService();
