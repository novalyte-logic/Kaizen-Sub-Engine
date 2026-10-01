import React from 'react';
import { Project, MixerPreset, Session, ExportRecord } from '../../types';
import { 
  Play, 
  Sliders, 
  Layers, 
  Bookmark, 
  Sparkles, 
  Plus, 
  Clock, 
  Volume2, 
  Download,
  FolderOpen
} from 'lucide-react';

interface HomeScreenProps {
  activeProject: Project;
  projects: Project[];
  presets: MixerPreset[];
  sessions: Session[];
  exports: ExportRecord[];
  onSelectProject: (proj: Project) => void;
  onNavigateTab: (tab: 'home' | 'build' | 'library' | 'player' | 'settings') => void;
  onApplyPreset: (preset: MixerPreset) => void;
  onStartNewSession: () => void;
  onPlayCurrent: () => void;
  isPlaying: boolean;
  onOpenNewProjectModal: () => void;
}

export const HomeScreen: React.FC<HomeScreenProps> = ({
  activeProject,
  projects,
  presets,
  exports,
  onSelectProject,
  onNavigateTab,
  onApplyPreset,
  onStartNewSession,
  onPlayCurrent,
  isPlaying,
  onOpenNewProjectModal,
}) => {
  const totalAffirmations = activeProject.modules.reduce(
    (sum, m) => sum + m.affirmations.filter((a) => a.enabled).length,
    0
  );

  return (
    <div className="space-y-5 pb-6">
      {/* Top Status Area - Geospatial Telemetry Dashboard */}
      <div className="relative overflow-hidden rounded-2xl bg-[#0c1319] border border-emerald-500/25 p-4 shadow-xl">
        <div className="absolute top-0 right-0 w-32 h-32 radar-sweep pointer-events-none" />

        <div className="flex items-center justify-between border-b border-white/5 pb-2.5 mb-3">
          <div className="flex items-center gap-2">
            <span className="h-2 w-2 rounded-full bg-emerald-400 animate-pulse" />
            <span className="text-[10px] font-mono tracking-widest text-emerald-400 uppercase">
              DSP ENGINE • ACTIVE
            </span>
          </div>
          <span className="text-[10px] font-mono text-zinc-500">
            {activeProject.isDemo ? 'DEMO PROFILE' : 'USER PROFILE'}
          </span>
        </div>

        {/* Project Name and Metrics */}
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0">
            <div className="flex items-center gap-2">
              <h2 className="text-xl font-bold tracking-tight text-white truncate">
                {activeProject.name}
              </h2>
              {activeProject.isDemo && (
                <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-amber-500/20 text-amber-400 border border-amber-500/30">
                  DEMO
                </span>
              )}
            </div>
            <p className="text-xs text-zinc-400 line-clamp-1 mt-0.5">
              {activeProject.description}
            </p>
          </div>

          <button
            onClick={onPlayCurrent}
            className={`flex items-center justify-center h-11 w-11 rounded-xl shrink-0 shadow-lg transition ${
              isPlaying
                ? 'bg-amber-500 text-black shadow-amber-500/20'
                : 'bg-emerald-500 text-black shadow-emerald-500/20 hover:bg-emerald-400'
            }`}
            title={isPlaying ? 'Pause audio' : 'Play active project'}
          >
            <Play size={20} className={isPlaying ? 'animate-pulse' : 'ml-0.5'} />
          </button>
        </div>

        {/* Compact Status Grid */}
        <div className="grid grid-cols-4 gap-2 mt-4 pt-3 border-t border-white/5 text-center">
          <div className="bg-[#080d11] p-2 rounded-lg border border-white/5">
            <div className="text-[10px] font-mono text-zinc-400">MODULES</div>
            <div className="text-sm font-mono font-bold text-white mt-0.5">
              {activeProject.modules.length}
            </div>
          </div>
          <div className="bg-[#080d11] p-2 rounded-lg border border-white/5">
            <div className="text-[10px] font-mono text-zinc-400">TRACKS</div>
            <div className="text-sm font-mono font-bold text-emerald-400 mt-0.5">
              {totalAffirmations}
            </div>
          </div>
          <div className="bg-[#080d11] p-2 rounded-lg border border-white/5">
            <div className="text-[10px] font-mono text-zinc-400">PRESET</div>
            <div className="text-xs font-mono font-bold text-cyan-400 truncate mt-0.5">
              -22 dB
            </div>
          </div>
          <div className="bg-[#080d11] p-2 rounded-lg border border-white/5">
            <div className="text-[10px] font-mono text-zinc-400">AMBIENT</div>
            <div className="text-[11px] font-mono font-bold text-zinc-200 capitalize truncate mt-0.5">
              {activeProject.ambientTrack.type.replace('_', ' ')}
            </div>
          </div>
        </div>
      </div>

      {/* Primary Mobile Action Buttons */}
      <div className="grid grid-cols-3 gap-2.5">
        <button
          onClick={onStartNewSession}
          className="flex flex-col items-center justify-center p-3 rounded-xl bg-gradient-to-b from-[#14232c] to-[#0d161d] border border-cyan-500/30 text-cyan-300 hover:border-cyan-400 transition group active:scale-95"
        >
          <Clock size={20} className="mb-1.5 text-cyan-400 group-hover:scale-110 transition" />
          <span className="text-[11px] font-bold font-mono tracking-wider">NEW SESSION</span>
        </button>

        <button
          onClick={() => onNavigateTab('build')}
          className="flex flex-col items-center justify-center p-3 rounded-xl bg-gradient-to-b from-emerald-950/60 to-[#0c1815] border border-emerald-500/50 text-emerald-300 hover:border-emerald-400 transition group active:scale-95 shadow-[0_0_15px_rgba(16,185,129,0.15)]"
        >
          <Sliders size={20} className="mb-1.5 text-emerald-400 group-hover:scale-110 transition" />
          <span className="text-[11px] font-bold font-mono tracking-wider">BUILD AUDIO</span>
        </button>

        <button
          onClick={() => onNavigateTab('library')}
          className="flex flex-col items-center justify-center p-3 rounded-xl bg-gradient-to-b from-[#141b22] to-[#0c1116] border border-white/10 text-zinc-300 hover:border-white/20 transition group active:scale-95"
        >
          <Layers size={20} className="mb-1.5 text-zinc-400 group-hover:scale-110 transition" />
          <span className="text-[11px] font-bold font-mono tracking-wider">LIBRARY</span>
        </button>
      </div>

      {/* Recent Projects Section */}
      <div className="space-y-2.5">
        <div className="flex items-center justify-between">
          <h3 className="text-xs font-mono uppercase tracking-wider text-zinc-400 flex items-center gap-1.5">
            <FolderOpen size={14} className="text-emerald-400" />
            Projects
          </h3>
          <button
            onClick={onOpenNewProjectModal}
            className="text-xs text-emerald-400 hover:text-emerald-300 font-mono flex items-center gap-1"
          >
            <Plus size={13} />
            <span>Create New</span>
          </button>
        </div>

        <div className="space-y-2">
          {projects.map((proj) => {
            const isCurrent = proj.id === activeProject.id;
            return (
              <div
                key={proj.id}
                onClick={() => onSelectProject(proj)}
                className={`flex items-center justify-between p-3 rounded-xl border cursor-pointer transition active:scale-[0.99] ${
                  isCurrent
                    ? 'border-emerald-500/50 bg-[#0d181c] shadow-sm'
                    : 'border-white/5 bg-[#0a0f14] hover:border-white/15'
                }`}
              >
                <div className="min-w-0 pr-3">
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-semibold text-zinc-100 truncate">
                      {proj.name}
                    </span>
                    {proj.isDemo && (
                      <span className="text-[9px] font-mono px-1 py-0.2 rounded bg-amber-500/10 text-amber-400 border border-amber-500/20">
                        DEMO
                      </span>
                    )}
                    {isCurrent && (
                      <span className="text-[9px] font-mono px-1.5 py-0.5 rounded bg-emerald-500/20 text-emerald-400">
                        ACTIVE
                      </span>
                    )}
                  </div>
                  <div className="text-xs text-zinc-400 mt-0.5 truncate">
                    {proj.modules.length} modules • {proj.ambientTrack.type.replace('_', ' ')}
                  </div>
                </div>

                <div className="shrink-0 text-right font-mono text-[11px] text-zinc-500">
                  {new Date(proj.updatedAt).toLocaleDateString([], {
                    month: 'short',
                    day: 'numeric',
                  })}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Saved Presets Quick Carousel */}
      <div className="space-y-2.5">
        <div className="flex items-center justify-between">
          <h3 className="text-xs font-mono uppercase tracking-wider text-zinc-400 flex items-center gap-1.5">
            <Bookmark size={14} className="text-cyan-400" />
            Saved Presets
          </h3>
          <span className="text-[11px] font-mono text-zinc-500">Instant Audition</span>
        </div>

        <div className="grid grid-cols-2 gap-2">
          {presets.slice(0, 4).map((preset) => (
            <div
              key={preset.id}
              onClick={() => onApplyPreset(preset)}
              className="p-3 rounded-xl bg-[#090e13] border border-white/5 hover:border-cyan-500/40 cursor-pointer transition active:scale-95 space-y-1"
            >
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-zinc-200 truncate">
                  {preset.name.split('(')[0]}
                </span>
                <span className="text-[10px] font-mono text-cyan-400 font-bold">
                  {preset.affirmationVolumeDb} dB
                </span>
              </div>
              <p className="text-[10px] text-zinc-400 line-clamp-1">
                {preset.description}
              </p>
              <div className="flex items-center gap-1 text-[9px] font-mono text-zinc-500 pt-1">
                <Volume2 size={10} className="text-zinc-400" />
                <span>{preset.ambientType.replace('_', ' ')}</span>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Recent Exports Preview */}
      {exports.length > 0 && (
        <div className="space-y-2.5">
          <div className="flex items-center justify-between">
            <h3 className="text-xs font-mono uppercase tracking-wider text-zinc-400 flex items-center gap-1.5">
              <Download size={14} className="text-emerald-400" />
              Recent Rendered Audio
            </h3>
            <span className="text-[10px] font-mono text-emerald-400">16-bit WAV</span>
          </div>
          <div className="space-y-1.5">
            {exports.slice(0, 2).map((exp) => (
              <div
                key={exp.id}
                className="flex items-center justify-between p-2.5 rounded-xl bg-[#0a0f14] border border-white/5 text-xs"
              >
                <div className="min-w-0 pr-2">
                  <div className="font-mono text-zinc-200 truncate text-[11px]">{exp.fileName}</div>
                  <div className="text-[10px] text-zinc-500 font-mono">
                    {exp.durationSeconds}s • {exp.fileSizeKb} KB • Browser WAV
                  </div>
                </div>
                {exp.downloadUrl && (
                  <a
                    href={exp.downloadUrl}
                    download={exp.fileName}
                    className="p-1.5 rounded-lg bg-emerald-500/20 text-emerald-400 hover:bg-emerald-500/30 text-xs shrink-0"
                  >
                    <Download size={14} />
                  </a>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Subtle Audio Engineering Principles Note */}
      <div className="p-3 rounded-xl bg-[#090d11] border border-white/5 text-[11px] text-zinc-400 flex items-start gap-2">
        <Sparkles size={14} className="text-emerald-400 shrink-0 mt-0.5" />
        <p className="leading-relaxed">
          Kaizen uses low-latency Web Audio DSP to layer synchronized affirmations over procedural soundscapes with precise millisecond offsets. Adjust dB gains to match your listening preference.
        </p>
      </div>
    </div>
  );
};
