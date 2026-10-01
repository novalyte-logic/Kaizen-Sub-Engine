import React, { useState } from 'react';
import { AppSettings, ProviderConnection } from '../../types';
import {
  Settings as SettingsIcon,
  Shield,
  Download,
  Upload,
  Info,
  CheckCircle,
  AlertCircle,
  HelpCircle,
  Lock,
} from 'lucide-react';

interface SettingsScreenProps {
  settings: AppSettings;
  onUpdateSettings: (settings: AppSettings) => void;
  onExportAllData: () => void;
  onImportData: (json: string) => void;
}

export const SettingsScreen: React.FC<SettingsScreenProps> = ({
  settings,
  onUpdateSettings,
  onExportAllData,
  onImportData,
}) => {
  const [activeTab, setActiveTab] = useState<'general' | 'connections' | 'privacy' | 'about'>(
    'general'
  );

  const providerConnections: ProviderConnection[] = [
    {
      id: 'dsp_core',
      name: 'Web Audio Core & DSP Synthesis',
      category: 'audio',
      status: 'CONNECTED',
      description: 'Low-latency browser AudioContext with procedural noise & biquad filtering.',
      isFunctionalInBrowser: true,
    },
    {
      id: 'speech_api',
      name: 'Browser Speech Synthesis Engine',
      category: 'tts',
      status: 'CONNECTED',
      description: 'Local system voices via W3C Web Speech API.',
      isFunctionalInBrowser: true,
    },
    {
      id: 'media_recorder',
      name: 'Microphone Audio Capture',
      category: 'audio',
      status: 'CONNECTED',
      description: 'Direct microphone capture via MediaRecorder decoded to AudioBuffer.',
      isFunctionalInBrowser: true,
    },
    {
      id: 'idb_storage',
      name: 'Local IndexedDB Persistence',
      category: 'storage',
      status: 'CONNECTED',
      description: 'Zero-cloud local database storing projects, scripts, presets, and audio blobs.',
      isFunctionalInBrowser: true,
    },
    {
      id: 'gemini_ai',
      name: 'Gemini AI Script Expansion',
      category: 'ai',
      status: 'DEMO',
      description: 'Cloud LLM generation for affirmation rewriting. Offline user script is authoritative.',
      isFunctionalInBrowser: false,
    },
    {
      id: 'cloud_tts',
      name: 'ElevenLabs / Cloud Neural TTS',
      category: 'tts',
      status: 'NOT CONNECTED',
      description: 'Third-party API key required for external cloud neural voice synthesis.',
      isFunctionalInBrowser: false,
    },
    {
      id: 'cloud_sync',
      name: 'Cloud Backup & Sync',
      category: 'storage',
      status: 'NOT CONNECTED',
      description: 'Remote synchronization across devices. Currently stored 100% locally.',
      isFunctionalInBrowser: false,
    },
    {
      id: 'ios_native_audio',
      name: 'Native iOS Background Audio & Lock-Screen',
      category: 'native',
      status: 'NATIVE iOS REQUIRED',
      description: 'AVAudioSession lock-screen controls and AirPods dynamic volume ducking.',
      isFunctionalInBrowser: false,
    },
  ];

  const handleFileImport = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (event) => {
      const content = event.target?.result as string;
      if (content) {
        try {
          onImportData(content);
          alert('Data successfully imported!');
        } catch {
          alert('Invalid backup JSON file.');
        }
      }
    };
    reader.readAsText(file);
  };

  return (
    <div className="space-y-4 pb-12">
      {/* Top Settings Tabs */}
      <div className="flex items-center gap-1.5 overflow-x-auto py-1 scrollbar-none text-xs font-mono">
        {[
          { id: 'general', label: 'AUDIO & DEFAULTS', icon: <SettingsIcon size={13} /> },
          { id: 'connections', label: 'CONNECTIONS', icon: <Shield size={13} /> },
          { id: 'privacy', label: 'PRIVACY', icon: <Lock size={13} /> },
          { id: 'about', label: 'ABOUT', icon: <Info size={13} /> },
        ].map((tab) => {
          const isSel = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as typeof activeTab)}
              className={`flex items-center gap-1.5 px-3 py-2 rounded-xl whitespace-nowrap transition active:scale-95 shrink-0 ${
                isSel
                  ? 'bg-emerald-500 text-black font-bold shadow-md shadow-emerald-500/20'
                  : 'bg-[#0b1015] border border-white/5 text-zinc-400 hover:text-white'
              }`}
            >
              {tab.icon}
              <span>{tab.label}</span>
            </button>
          );
        })}
      </div>

      {/* 1. GENERAL AUDIO SETTINGS */}
      {activeTab === 'general' && (
        <div className="space-y-4">
          <div className="rounded-2xl bg-[#0c1217] border border-white/10 p-4 space-y-4">
            <h3 className="text-xs font-mono font-bold text-white uppercase tracking-wider">
              Audio Console Defaults
            </h3>

            {/* Default Affirmation dB */}
            <div className="space-y-1.5">
              <div className="flex items-center justify-between text-xs font-mono">
                <span className="text-zinc-300">Default Affirmation Level</span>
                <span className="text-emerald-400 font-bold">
                  {settings.defaultAffirmationDb} dB
                </span>
              </div>
              <input
                type="range"
                min={-36}
                max={-6}
                step={1}
                value={settings.defaultAffirmationDb}
                onChange={(e) =>
                  onUpdateSettings({
                    ...settings,
                    defaultAffirmationDb: parseInt(e.target.value, 10),
                  })
                }
                className="w-full"
              />
            </div>

            {/* Default Ambient dB */}
            <div className="space-y-1.5">
              <div className="flex items-center justify-between text-xs font-mono">
                <span className="text-zinc-300">Default Ambient Soundscape Level</span>
                <span className="text-cyan-400 font-bold">{settings.defaultAmbientDb} dB</span>
              </div>
              <input
                type="range"
                min={-12}
                max={6}
                step={1}
                value={settings.defaultAmbientDb}
                onChange={(e) =>
                  onUpdateSettings({
                    ...settings,
                    defaultAmbientDb: parseInt(e.target.value, 10),
                  })
                }
                className="w-full"
              />
            </div>

            {/* Default Timing Stagger */}
            <div className="space-y-1.5">
              <div className="flex items-center justify-between text-xs font-mono">
                <span className="text-zinc-300">Default Layer Stagger Offset</span>
                <span className="text-emerald-400 font-bold">
                  +{settings.defaultTimingOffsetMs} ms
                </span>
              </div>
              <select
                value={settings.defaultTimingOffsetMs}
                onChange={(e) =>
                  onUpdateSettings({
                    ...settings,
                    defaultTimingOffsetMs: parseInt(e.target.value, 10),
                  })
                }
                className="w-full bg-[#080c10] border border-white/10 rounded-xl px-3 py-2 text-xs font-mono text-zinc-200 focus:outline-none focus:border-emerald-500"
              >
                <option value={0}>0 ms (Synchronous)</option>
                <option value={200}>+200 ms</option>
                <option value={350}>+350 ms (Optimal Subliminal Stagger)</option>
                <option value={500}>+500 ms</option>
                <option value={700}>+700 ms</option>
              </select>
            </div>

            {/* Toggles */}
            <div className="pt-2 border-t border-white/5 space-y-3 text-xs font-mono">
              <label className="flex items-center justify-between cursor-pointer">
                <span className="text-zinc-300">Clipping & Distortion Warnings</span>
                <input
                  type="checkbox"
                  checked={settings.enableClippingWarnings}
                  onChange={(e) =>
                    onUpdateSettings({
                      ...settings,
                      enableClippingWarnings: e.target.checked,
                    })
                  }
                  className="h-4 w-4 rounded border-zinc-700 bg-zinc-900 text-emerald-500 focus:ring-0"
                />
              </label>

              <label className="flex items-center justify-between cursor-pointer">
                <span className="text-zinc-300">Haptic Touch Feedback</span>
                <input
                  type="checkbox"
                  checked={settings.hapticFeedback}
                  onChange={(e) =>
                    onUpdateSettings({
                      ...settings,
                      hapticFeedback: e.target.checked,
                    })
                  }
                  className="h-4 w-4 rounded border-zinc-700 bg-zinc-900 text-emerald-500 focus:ring-0"
                />
              </label>
            </div>
          </div>

          {/* Backup & Restore Data */}
          <div className="rounded-2xl bg-[#0c1217] border border-white/10 p-4 space-y-3">
            <h3 className="text-xs font-mono font-bold text-white uppercase tracking-wider">
              Backup &amp; Data Portability
            </h3>
            <p className="text-xs text-zinc-400">
              Export all your projects, custom scripts, and console presets into a JSON backup file.
            </p>

            <div className="grid grid-cols-2 gap-2 text-xs font-mono">
              <button
                onClick={onExportAllData}
                className="py-2.5 px-3 rounded-xl bg-zinc-800 text-zinc-200 hover:text-white flex items-center justify-center gap-1.5 border border-white/5"
              >
                <Download size={14} className="text-emerald-400" />
                <span>Export JSON</span>
              </button>

              <label className="py-2.5 px-3 rounded-xl bg-zinc-800 text-zinc-200 hover:text-white flex items-center justify-center gap-1.5 border border-white/5 cursor-pointer text-center">
                <Upload size={14} className="text-cyan-400" />
                <span>Import JSON</span>
                <input
                  type="file"
                  accept=".json"
                  className="hidden"
                  onChange={handleFileImport}
                />
              </label>
            </div>
          </div>
        </div>
      )}

      {/* 2. CONNECTIONS TAB (Prompt #21 & #31) */}
      {activeTab === 'connections' && (
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-xs font-mono text-zinc-400 uppercase">
              Provider &amp; Subsystem Status
            </span>
            <span className="text-[10px] font-mono text-zinc-500">Live Telemetry</span>
          </div>

          <div className="space-y-2">
            {providerConnections.map((conn) => {
              let badgeColor = 'bg-zinc-800 text-zinc-400 border-zinc-700';
              let Icon = HelpCircle;

              if (conn.status === 'CONNECTED') {
                badgeColor = 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30';
                Icon = CheckCircle;
              } else if (conn.status === 'DEMO') {
                badgeColor = 'bg-amber-500/10 text-amber-400 border-amber-500/30';
                Icon = AlertCircle;
              } else if (conn.status === 'NATIVE iOS REQUIRED') {
                badgeColor = 'bg-cyan-500/10 text-cyan-400 border-cyan-500/30';
                Icon = AlertCircle;
              } else if (conn.status === 'NOT CONNECTED') {
                badgeColor = 'bg-red-500/10 text-red-400 border-red-500/30';
                Icon = AlertCircle;
              }

              return (
                <div
                  key={conn.id}
                  className="p-3.5 rounded-xl bg-[#090e13] border border-white/5 space-y-1.5"
                >
                  <div className="flex items-center justify-between gap-2">
                    <div className="text-xs font-bold text-zinc-200 truncate">{conn.name}</div>
                    <span
                      className={`text-[9px] font-mono px-2 py-0.5 rounded border uppercase shrink-0 font-bold flex items-center gap-1 ${badgeColor}`}
                    >
                      <Icon size={10} />
                      <span>{conn.status}</span>
                    </span>
                  </div>
                  <p className="text-[11px] text-zinc-400 leading-relaxed">
                    {conn.description}
                  </p>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* 3. PRIVACY TAB (Prompt #30) */}
      {activeTab === 'privacy' && (
        <div className="rounded-2xl bg-[#0c1217] border border-white/10 p-4 space-y-3 text-xs leading-relaxed text-zinc-300">
          <div className="flex items-center gap-2 border-b border-white/5 pb-2">
            <Shield size={16} className="text-emerald-400" />
            <h3 className="font-bold text-white font-mono uppercase">
              Privacy &amp; Data Security Architecture
            </h3>
          </div>

          <p>
            Affirmation scripts, subconscious commands, and personal voice recordings are deeply intimate data.
          </p>

          <div className="space-y-2 pt-1 font-mono text-[11px]">
            <div className="p-3 rounded-xl bg-[#080d11] border border-white/5 space-y-1">
              <span className="text-emerald-400 font-bold">100% Local Storage:</span>
              <p className="text-zinc-400">
                All scripts, recorded voice files, and mixes reside inside your device&apos;s sandboxed browser IndexedDB storage.
              </p>
            </div>

            <div className="p-3 rounded-xl bg-[#080d11] border border-white/5 space-y-1">
              <span className="text-cyan-400 font-bold">Zero Silent Telemetry:</span>
              <p className="text-zinc-400">
                No user affirmations or microphone audio are ever transmitted to third-party tracking services or external databases.
              </p>
            </div>

            <div className="p-3 rounded-xl bg-[#080d11] border border-white/5 space-y-1">
              <span className="text-amber-400 font-bold">Explicit Opt-In for Cloud APIs:</span>
              <p className="text-zinc-400">
                Data only leaves your iPhone if you explicitly connect an external cloud API key.
              </p>
            </div>
          </div>
        </div>
      )}

      {/* 4. ABOUT TAB */}
      {activeTab === 'about' && (
        <div className="rounded-2xl bg-[#0c1217] border border-white/10 p-4 space-y-3 text-xs leading-relaxed text-zinc-400">
          <h3 className="font-bold text-white font-mono uppercase text-sm">
            Kaizen Subliminal Engine — Mobile v2.4
          </h3>
          <p>
            Engineered for high-precision subliminal audio mastering, multi-layer perspective affirmation stacking, and low-latency DSP mixing on iPhone.
          </p>
          <div className="pt-2 border-t border-white/5 font-mono text-[11px] text-zinc-500 space-y-1">
            <div>Framework: React 19 • Vite • Web Audio API • IndexedDB</div>
            <div>Aesthetics: Geospatial Labs Obsidian / Radar Emerald</div>
            <div>Build Target: iPhone Mobile Safari / Progressive Web App</div>
          </div>
        </div>
      )}
    </div>
  );
};
