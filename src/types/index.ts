export type Perspective = 'I' | 'YOU' | 'ME' | 'COMMAND' | 'CUSTOM';

export interface Affirmation {
  id: string;
  text: string;
  perspective: Perspective;
  enabled: boolean;
}

export type VoiceSource = 'tts' | 'recording' | 'imported';

export interface VoiceSettings {
  voiceId: string;
  voiceName: string;
  speed: number;        // 0.5 to 2.0 (default 1.0)
  pitch: number;        // 0.5 to 1.5 (default 1.0)
  pauseDurationMs: number; // pause between affirmations (e.g. 1200ms)
  sentenceSpacingMs: number;
  repetitions: number;  // 1 to 10
  source: VoiceSource;
  recordedAudioId?: string; // id in IndexedDB
}

export interface AffirmationModule {
  id: string;
  name: string;
  description: string;
  scriptText: string;
  affirmations: Affirmation[];
  voiceSettings: VoiceSettings;
  volumeDb: number;       // e.g. -22 dB
  pan: number;            // -1.0 to 1.0
  timingOffsetMs: number; // e.g. 0, 350, 700 ms
  enabled: boolean;
  isMuted: boolean;
  isSolo: boolean;
  layerIndex: number;
}

export type AmbientSoundType =
  | 'rain'
  | 'heavy_rain'
  | 'gentle_rain'
  | 'ocean'
  | 'brown_noise'
  | 'pink_noise'
  | 'white_noise'
  | 'forest'
  | 'fireplace'
  | 'custom';

export interface AmbientTrack {
  id: string;
  name: string;
  type: AmbientSoundType;
  volumeDb: number; // e.g. 0 dB
  pan: number;
  enabled: boolean;
  isMuted: boolean;
  customBlobId?: string;
  customFileName?: string;
}

export interface Project {
  id: string;
  name: string;
  description: string;
  isDemo?: boolean;
  createdAt: number;
  updatedAt: number;
  modules: AffirmationModule[];
  ambientTrack: AmbientTrack;
  masterVolumeDb: number;
  activePresetName?: string;
}

export interface MixerPreset {
  id: string;
  name: string;
  description: string;
  isBuiltIn?: boolean;
  affirmationVolumeDb: number; // e.g. -22 dB
  ambientVolumeDb: number;      // e.g. 0 dB
  ambientType: AmbientSoundType;
  timingOffsets: number[];     // e.g. [0, 350, 700]
  masterVolumeDb: number;
  fadeDurationSec: number;
}

export interface Session {
  id: string;
  name: string;
  projectId: string;
  durationMinutes: number;
  moduleIds: string[];
  presetId?: string;
  ambientType: AmbientSoundType;
  fadeInSec: number;
  fadeOutSec: number;
  loopBehavior: 'infinite' | 'fixed_duration' | 'repeats';
  createdAt: number;
}

export interface ExportRecord {
  id: string;
  fileName: string;
  format: 'WAV' | 'MP3' | 'M4A';
  durationSeconds: number;
  fileSizeKb: number;
  createdAt: number;
  downloadUrl?: string;
  isRealLocalWav: boolean;
}

export interface AppSettings {
  defaultAffirmationDb: number;
  defaultAmbientDb: number;
  defaultAmbientType: AmbientSoundType;
  defaultTimingOffsetMs: number;
  autoPlayOnSelect: boolean;
  enableClippingWarnings: boolean;
  hapticFeedback: boolean;
  theme: 'geospatial-dark';
  firstRunCompleted: boolean;
}

export interface ProviderConnection {
  id: string;
  name: string;
  category: 'audio' | 'ai' | 'tts' | 'storage' | 'native';
  status: 'CONNECTED' | 'NOT CONNECTED' | 'DEMO' | 'NATIVE iOS REQUIRED';
  description: string;
  isFunctionalInBrowser: boolean;
}
