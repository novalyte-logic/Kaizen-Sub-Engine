/**
 * IndexedDB Storage Service for Kaizen Subliminal Audio Engine
 * Persists Projects, Modules, Scripts, Presets, Sessions, and Recorded Audio Blobs.
 */
import { AppSettings, MixerPreset, Project, Session, ExportRecord } from '../types';

const DB_NAME = 'kaizen_audio_engine_db';
const DB_VERSION = 1;

class StorageService {
  private dbPromise: Promise<IDBDatabase> | null = null;

  private getDB(): Promise<IDBDatabase> {
    if (this.dbPromise) return this.dbPromise;

    this.dbPromise = new Promise((resolve, reject) => {
      const request = indexedDB.open(DB_NAME, DB_VERSION);

      request.onupgradeneeded = (event) => {
        const db = (event.target as IDBOpenDBRequest).result;

        if (!db.objectStoreNames.contains('projects')) {
          db.createObjectStore('projects', { keyPath: 'id' });
        }
        if (!db.objectStoreNames.contains('presets')) {
          db.createObjectStore('presets', { keyPath: 'id' });
        }
        if (!db.objectStoreNames.contains('sessions')) {
          db.createObjectStore('sessions', { keyPath: 'id' });
        }
        if (!db.objectStoreNames.contains('exports')) {
          db.createObjectStore('exports', { keyPath: 'id' });
        }
        if (!db.objectStoreNames.contains('audio_blobs')) {
          db.createObjectStore('audio_blobs', { keyPath: 'id' });
        }
        if (!db.objectStoreNames.contains('settings')) {
          db.createObjectStore('settings', { keyPath: 'id' });
        }
      };

      request.onsuccess = () => {
        resolve(request.result);
      };

      request.onerror = () => {
        reject(request.error);
      };
    });

    return this.dbPromise;
  }

  // --- PROJECTS ---
  async getProjects(): Promise<Project[]> {
    const db = await this.getDB();
    return new Promise((resolve, reject) => {
      const tx = db.transaction('projects', 'readonly');
      const store = tx.objectStore('projects');
      const req = store.getAll();
      req.onsuccess = () => resolve(req.result || []);
      req.onerror = () => reject(req.error);
    });
  }

  async getProject(id: string): Promise<Project | undefined> {
    const db = await this.getDB();
    return new Promise((resolve, reject) => {
      const tx = db.transaction('projects', 'readonly');
      const store = tx.objectStore('projects');
      const req = store.get(id);
      req.onsuccess = () => resolve(req.result);
      req.onerror = () => reject(req.error);
    });
  }

  async saveProject(project: Project): Promise<void> {
    const db = await this.getDB();
    return new Promise((resolve, reject) => {
      const tx = db.transaction('projects', 'readwrite');
      const store = tx.objectStore('projects');
      const req = store.put({ ...project, updatedAt: Date.now() });
      req.onsuccess = () => resolve();
      req.onerror = () => reject(req.error);
    });
  }

  async deleteProject(id: string): Promise<void> {
    const db = await this.getDB();
    return new Promise((resolve, reject) => {
      const tx = db.transaction('projects', 'readwrite');
      const store = tx.objectStore('projects');
      const req = store.delete(id);
      req.onsuccess = () => resolve();
      req.onerror = () => reject(req.error);
    });
  }

  // --- PRESETS ---
  async getPresets(): Promise<MixerPreset[]> {
    const db = await this.getDB();
    return new Promise((resolve, reject) => {
      const tx = db.transaction('presets', 'readonly');
      const store = tx.objectStore('presets');
      const req = store.getAll();
      req.onsuccess = () => resolve(req.result || []);
      req.onerror = () => reject(req.error);
    });
  }

  async savePreset(preset: MixerPreset): Promise<void> {
    const db = await this.getDB();
    return new Promise((resolve, reject) => {
      const tx = db.transaction('presets', 'readwrite');
      const store = tx.objectStore('presets');
      const req = store.put(preset);
      req.onsuccess = () => resolve();
      req.onerror = () => reject(req.error);
    });
  }

  async deletePreset(id: string): Promise<void> {
    const db = await this.getDB();
    return new Promise((resolve, reject) => {
      const tx = db.transaction('presets', 'readwrite');
      const store = tx.objectStore('presets');
      const req = store.delete(id);
      req.onsuccess = () => resolve();
      req.onerror = () => reject(req.error);
    });
  }

  // --- SESSIONS ---
  async getSessions(): Promise<Session[]> {
    const db = await this.getDB();
    return new Promise((resolve, reject) => {
      const tx = db.transaction('sessions', 'readonly');
      const store = tx.objectStore('sessions');
      const req = store.getAll();
      req.onsuccess = () => resolve(req.result || []);
      req.onerror = () => reject(req.error);
    });
  }

  async saveSession(session: Session): Promise<void> {
    const db = await this.getDB();
    return new Promise((resolve, reject) => {
      const tx = db.transaction('sessions', 'readwrite');
      const store = tx.objectStore('sessions');
      const req = store.put(session);
      req.onsuccess = () => resolve();
      req.onerror = () => reject(req.error);
    });
  }

  async deleteSession(id: string): Promise<void> {
    const db = await this.getDB();
    return new Promise((resolve, reject) => {
      const tx = db.transaction('sessions', 'readwrite');
      const store = tx.objectStore('sessions');
      const req = store.delete(id);
      req.onsuccess = () => resolve();
      req.onerror = () => reject(req.error);
    });
  }

  // --- EXPORTS ---
  async getExports(): Promise<ExportRecord[]> {
    const db = await this.getDB();
    return new Promise((resolve, reject) => {
      const tx = db.transaction('exports', 'readonly');
      const store = tx.objectStore('exports');
      const req = store.getAll();
      req.onsuccess = () => resolve(req.result || []);
      req.onerror = () => reject(req.error);
    });
  }

  async saveExport(record: ExportRecord): Promise<void> {
    const db = await this.getDB();
    return new Promise((resolve, reject) => {
      const tx = db.transaction('exports', 'readwrite');
      const store = tx.objectStore('exports');
      const req = store.put(record);
      req.onsuccess = () => resolve();
      req.onerror = () => reject(req.error);
    });
  }

  // --- AUDIO BLOBS (For custom mic recordings & custom ambient sound) ---
  async saveAudioBlob(id: string, blob: Blob): Promise<void> {
    const db = await this.getDB();
    return new Promise((resolve, reject) => {
      const tx = db.transaction('audio_blobs', 'readwrite');
      const store = tx.objectStore('audio_blobs');
      const req = store.put({ id, blob, createdAt: Date.now() });
      req.onsuccess = () => resolve();
      req.onerror = () => reject(req.error);
    });
  }

  async getAudioBlob(id: string): Promise<Blob | undefined> {
    const db = await this.getDB();
    return new Promise((resolve, reject) => {
      const tx = db.transaction('audio_blobs', 'readonly');
      const store = tx.objectStore('audio_blobs');
      const req = store.get(id);
      req.onsuccess = () => resolve(req.result?.blob);
      req.onerror = () => reject(req.error);
    });
  }

  // --- SETTINGS ---
  async getSettings(): Promise<AppSettings> {
    const db = await this.getDB();
    return new Promise((resolve) => {
      const tx = db.transaction('settings', 'readonly');
      const store = tx.objectStore('settings');
      const req = store.get('main');
      req.onsuccess = () => {
        if (req.result && req.result.settings) {
          resolve(req.result.settings);
        } else {
          resolve(DEFAULT_SETTINGS);
        }
      };
      req.onerror = () => resolve(DEFAULT_SETTINGS);
    });
  }

  async saveSettings(settings: AppSettings): Promise<void> {
    const db = await this.getDB();
    return new Promise((resolve, reject) => {
      const tx = db.transaction('settings', 'readwrite');
      const store = tx.objectStore('settings');
      const req = store.put({ id: 'main', settings });
      req.onsuccess = () => resolve();
      req.onerror = () => reject(req.error);
    });
  }

  // --- SEED INITIAL DATA IF FIRST RUN ---
  async initializeDefaults(): Promise<{ project: Project; presets: MixerPreset[] }> {
    const projects = await this.getProjects();
    const presets = await this.getPresets();

    let defaultProject: Project;
    if (projects.length === 0) {
      defaultProject = DEMO_PROJECT;
      await this.saveProject(defaultProject);
    } else {
      defaultProject = projects[0];
    }

    if (presets.length === 0) {
      for (const p of BUILT_IN_PRESETS) {
        await this.savePreset(p);
      }
    }

    const currentPresets = await this.getPresets();
    return { project: defaultProject, presets: currentPresets };
  }
}

export const DEFAULT_SETTINGS: AppSettings = {
  defaultAffirmationDb: -22,
  defaultAmbientDb: 0,
  defaultAmbientType: 'heavy_rain',
  defaultTimingOffsetMs: 350,
  autoPlayOnSelect: false,
  enableClippingWarnings: true,
  hapticFeedback: true,
  theme: 'geospatial-dark',
  firstRunCompleted: false,
};

export const BUILT_IN_PRESETS: MixerPreset[] = [
  {
    id: 'preset_subtle_22',
    name: 'KAIZEN SUBTLE (-22 dB)',
    description: 'Classical subliminal ratio. Affirmation layers sit beneath masking rainfall.',
    isBuiltIn: true,
    affirmationVolumeDb: -22,
    ambientVolumeDb: 0,
    ambientType: 'heavy_rain',
    timingOffsets: [0, 350, 700],
    masterVolumeDb: 0,
    fadeDurationSec: 3,
  },
  {
    id: 'preset_balanced_18',
    name: 'KAIZEN BALANCED (-18 dB)',
    description: 'Audible threshold ratio. Cadence is perceptible during focused listening.',
    isBuiltIn: true,
    affirmationVolumeDb: -18,
    ambientVolumeDb: -2,
    ambientType: 'gentle_rain',
    timingOffsets: [0, 250, 500],
    masterVolumeDb: 0,
    fadeDurationSec: 2,
  },
  {
    id: 'preset_audible_12',
    name: 'KAIZEN AUDIBLE (-12 dB)',
    description: 'Semi-masked conscious programming. Spoken words clearly understood.',
    isBuiltIn: true,
    affirmationVolumeDb: -12,
    ambientVolumeDb: -4,
    ambientType: 'ocean',
    timingOffsets: [0, 400, 800],
    masterVolumeDb: 0,
    fadeDurationSec: 2,
  },
  {
    id: 'preset_deep_brown_26',
    name: 'KAIZEN DEEP SLEEP (-26 dB)',
    description: 'Ultralow subliminal blend with resonant Brown Noise for overnight sleep.',
    isBuiltIn: true,
    affirmationVolumeDb: -26,
    ambientVolumeDb: 0,
    ambientType: 'brown_noise',
    timingOffsets: [0, 500, 1000],
    masterVolumeDb: 0,
    fadeDurationSec: 5,
  },
];

export const DEMO_PROJECT: Project = {
  id: 'proj_demo_kaizen_master',
  name: 'KAIZEN MASTER',
  description: 'Foundational multi-perspective identity and sovereign presence system.',
  isDemo: true,
  createdAt: Date.now(),
  updatedAt: Date.now(),
  masterVolumeDb: 0,
  activePresetName: 'KAIZEN SUBTLE (-22 dB)',
  ambientTrack: {
    id: 'amb_default',
    name: 'Heavy Rain Soundscape',
    type: 'heavy_rain',
    volumeDb: 0,
    pan: 0,
    enabled: true,
    isMuted: false,
  },
  modules: [
    {
      id: 'mod_identity',
      name: 'Identity & Self-Concept',
      description: 'First-person declarative affirmations for baseline inner authority.',
      scriptText: `I am grounded in unshakable inner certainty.
I trust my judgment and act with immediate precision.
My self-respect is non-negotiable and radiates in every room.
I am aligned with continuous, compounding evolution.`,
      affirmations: [
        { id: 'aff_1', text: 'I am grounded in unshakable inner certainty.', perspective: 'I', enabled: true },
        { id: 'aff_2', text: 'I trust my judgment and act with immediate precision.', perspective: 'I', enabled: true },
        { id: 'aff_3', text: 'My self-respect is non-negotiable and radiates in every room.', perspective: 'I', enabled: true },
        { id: 'aff_4', text: 'I am aligned with continuous, compounding evolution.', perspective: 'I', enabled: true },
      ],
      voiceSettings: {
        voiceId: 'default',
        voiceName: 'Neural English (Subconscious)',
        speed: 0.95,
        pitch: 0.92,
        pauseDurationMs: 1400,
        sentenceSpacingMs: 800,
        repetitions: 3,
        source: 'tts',
      },
      volumeDb: -22,
      pan: -0.2,
      timingOffsetMs: 0,
      enabled: true,
      isMuted: false,
      isSolo: false,
      layerIndex: 1,
    },
    {
      id: 'mod_confidence',
      name: 'Grounded Confidence',
      description: 'Second-person perspective bypassing egoic resistance.',
      scriptText: `You remain poised and calm in any environment.
Your presence commands respect without unnecessary force.
You hold relaxed, penetrating eye contact naturally.
Your body language reflects effortless sovereignty.`,
      affirmations: [
        { id: 'aff_5', text: 'You remain poised and calm in any environment.', perspective: 'YOU', enabled: true },
        { id: 'aff_6', text: 'Your presence commands respect without unnecessary force.', perspective: 'YOU', enabled: true },
        { id: 'aff_7', text: 'You hold relaxed, penetrating eye contact naturally.', perspective: 'YOU', enabled: true },
        { id: 'aff_8', text: 'Your body language reflects effortless sovereignty.', perspective: 'YOU', enabled: true },
      ],
      voiceSettings: {
        voiceId: 'default',
        voiceName: 'Authoritative Direct',
        speed: 1.0,
        pitch: 0.88,
        pauseDurationMs: 1500,
        sentenceSpacingMs: 900,
        repetitions: 3,
        source: 'tts',
      },
      volumeDb: -23,
      pan: 0.2,
      timingOffsetMs: 350,
      enabled: true,
      isMuted: false,
      isSolo: false,
      layerIndex: 2,
    },
    {
      id: 'mod_command',
      name: 'Subconscious Command Directives',
      description: 'Direct imperative commands locking in neural realignment.',
      scriptText: `Subconscious mind, I command you to lock in permanent emotional stability.
Subconscious mind, eliminate all unhelpful hesitation immediately.
Subconscious mind, anchor unwavering focus and mental clarity now.
Subconscious mind, execute disciplined action without delay.`,
      affirmations: [
        { id: 'aff_9', text: 'Subconscious mind, I command you to lock in permanent emotional stability.', perspective: 'COMMAND', enabled: true },
        { id: 'aff_10', text: 'Subconscious mind, eliminate all unhelpful hesitation immediately.', perspective: 'COMMAND', enabled: true },
        { id: 'aff_11', text: 'Subconscious mind, anchor unwavering focus and mental clarity now.', perspective: 'COMMAND', enabled: true },
        { id: 'aff_12', text: 'Subconscious mind, execute disciplined action without delay.', perspective: 'COMMAND', enabled: true },
      ],
      voiceSettings: {
        voiceId: 'default',
        voiceName: 'Command Direct Frequency',
        speed: 1.02,
        pitch: 0.85,
        pauseDurationMs: 1600,
        sentenceSpacingMs: 1000,
        repetitions: 3,
        source: 'tts',
      },
      volumeDb: -24,
      pan: 0.0,
      timingOffsetMs: 700,
      enabled: true,
      isMuted: false,
      isSolo: false,
      layerIndex: 3,
    },
    {
      id: 'mod_social',
      name: 'Social Presence & Authority',
      description: 'Physical identity, eye contact and vocal resonance.',
      scriptText: `I speak with measured conviction and clarity.
My attention is immovable and deeply focused.
People naturally respect my quiet strength.`,
      affirmations: [
        { id: 'aff_13', text: 'I speak with measured conviction and clarity.', perspective: 'I', enabled: true },
        { id: 'aff_14', text: 'My attention is immovable and deeply focused.', perspective: 'I', enabled: true },
        { id: 'aff_15', text: 'People naturally respect my quiet strength.', perspective: 'I', enabled: true },
      ],
      voiceSettings: {
        voiceId: 'default',
        voiceName: 'Neural English (Resonant)',
        speed: 0.95,
        pitch: 0.90,
        pauseDurationMs: 1500,
        sentenceSpacingMs: 800,
        repetitions: 2,
        source: 'tts',
      },
      volumeDb: -22,
      pan: -0.15,
      timingOffsetMs: 150,
      enabled: true,
      isMuted: false,
      isSolo: false,
      layerIndex: 4,
    },
    {
      id: 'mod_abundance',
      name: 'Abundance & Compounding Wealth',
      description: 'Eliminates scarcity thinking and instills resourcefulness.',
      scriptText: `You effortlessly identify high-value opportunities.
Abundance flows to you as a direct result of the immense value you create.
You build enduring assets with calm, deliberate focus.`,
      affirmations: [
        { id: 'aff_16', text: 'You effortlessly identify high-value opportunities.', perspective: 'YOU', enabled: true },
        { id: 'aff_17', text: 'Abundance flows to you as a direct result of the immense value you create.', perspective: 'YOU', enabled: true },
        { id: 'aff_18', text: 'You build enduring assets with calm, deliberate focus.', perspective: 'YOU', enabled: true },
      ],
      voiceSettings: {
        voiceId: 'default',
        voiceName: 'Neural English (Subconscious)',
        speed: 0.98,
        pitch: 0.94,
        pauseDurationMs: 1400,
        sentenceSpacingMs: 800,
        repetitions: 2,
        source: 'tts',
      },
      volumeDb: -22,
      pan: 0.15,
      timingOffsetMs: 500,
      enabled: true,
      isMuted: false,
      isSolo: false,
      layerIndex: 5,
    },
  ],
};

export const storageService = new StorageService();
