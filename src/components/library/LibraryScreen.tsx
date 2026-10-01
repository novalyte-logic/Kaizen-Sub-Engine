import React, { useState } from 'react';
import { Project, Session, MixerPreset, ExportRecord } from '../../types';
import {
  FolderOpen,
  Layers,
  FileText,
  Mic,
  CloudRain,
  Download,
  Bookmark,
  Search,
  Clock,
  Play,
  Trash2,
  Plus,
} from 'lucide-react';

interface LibraryScreenProps {
  projects: Project[];
  activeProject: Project;
  onSelectProject: (proj: Project) => void;
  onDeleteProject: (id: string) => void;
  presets: MixerPreset[];
  onApplyPreset: (preset: MixerPreset) => void;
  onDeletePreset: (id: string) => void;
  sessions: Session[];
  onDeleteSession: (id: string) => void;
  exports: ExportRecord[];
  onOpenNewProjectModal: () => void;
  onPlayProject: (proj: Project) => void;
}

type LibraryTab =
  | 'projects'
  | 'sessions'
  | 'modules'
  | 'scripts'
  | 'voice'
  | 'ambient'
  | 'exports'
  | 'presets';

export const LibraryScreen: React.FC<LibraryScreenProps> = ({
  projects,
  activeProject,
  onSelectProject,
  onDeleteProject,
  presets,
  onApplyPreset,
  onDeletePreset,
  sessions,
  onDeleteSession,
  exports,
  onOpenNewProjectModal,
  onPlayProject,
}) => {
  const [activeTab, setActiveTab] = useState<LibraryTab>('projects');
  const [searchQuery, setSearchQuery] = useState('');

  const tabs: { id: LibraryTab; label: string; icon: React.ReactNode; count: number }[] = [
    { id: 'projects', label: 'PROJECTS', icon: <FolderOpen size={13} />, count: projects.length },
    { id: 'sessions', label: 'SESSIONS', icon: <Clock size={13} />, count: sessions.length },
    {
      id: 'modules',
      label: 'MODULES',
      icon: <Layers size={13} />,
      count: projects.reduce((acc, p) => acc + p.modules.length, 0),
    },
    {
      id: 'scripts',
      label: 'SCRIPTS',
      icon: <FileText size={13} />,
      count: projects.reduce(
        (acc, p) => acc + p.modules.reduce((mAcc, m) => mAcc + m.affirmations.length, 0),
        0
      ),
    },
    {
      id: 'voice',
      label: 'VOICE RECORDINGS',
      icon: <Mic size={13} />,
      count: projects.reduce(
        (acc, p) =>
          acc + p.modules.filter((m) => m.voiceSettings.source === 'recording').length,
        0
      ),
    },
    { id: 'ambient', label: 'AMBIENT SOUND', icon: <CloudRain size={13} />, count: 9 },
    { id: 'exports', label: 'EXPORTS', icon: <Download size={13} />, count: exports.length },
    { id: 'presets', label: 'PRESETS', icon: <Bookmark size={13} />, count: presets.length },
  ];

  return (
    <div className="space-y-4 pb-12">
      {/* Search Bar */}
      <div className="relative">
        <Search
          size={16}
          className="absolute left-3.5 top-1/2 -translate-y-1/2 text-zinc-500"
        />
        <input
          type="text"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          placeholder="Search library..."
          className="w-full rounded-xl bg-[#090e13] border border-white/10 pl-10 pr-4 py-2.5 text-xs text-zinc-100 placeholder-zinc-500 font-mono focus:outline-none focus:border-emerald-500"
        />
      </div>

      {/* Horizontal Category Tabs */}
      <div className="flex items-center gap-1.5 overflow-x-auto py-1 scrollbar-none text-xs font-mono">
        {tabs.map((tab) => {
          const isSel = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex items-center gap-1.5 px-3 py-2 rounded-xl whitespace-nowrap transition active:scale-95 shrink-0 ${
                isSel
                  ? 'bg-emerald-500 text-black font-bold shadow-md shadow-emerald-500/20'
                  : 'bg-[#0b1015] border border-white/5 text-zinc-400 hover:text-white'
              }`}
            >
              {tab.icon}
              <span>{tab.label}</span>
              <span
                className={`text-[10px] px-1 rounded ${
                  isSel ? 'bg-black/20 text-black' : 'bg-zinc-800 text-zinc-400'
                }`}
              >
                {tab.count}
              </span>
            </button>
          );
        })}
      </div>

      {/* TAB CONTENT */}

      {/* 1. PROJECTS TAB */}
      {activeTab === 'projects' && (
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-xs font-mono text-zinc-400 uppercase">
              All Audio Projects ({projects.length})
            </span>
            <button
              onClick={onOpenNewProjectModal}
              className="flex items-center gap-1 text-xs font-mono text-emerald-400 hover:text-emerald-300"
            >
              <Plus size={13} />
              <span>Create Project</span>
            </button>
          </div>

          <div className="space-y-2">
            {projects
              .filter((p) => p.name.toLowerCase().includes(searchQuery.toLowerCase()))
              .map((proj) => {
                const isCurrent = proj.id === activeProject.id;
                return (
                  <div
                    key={proj.id}
                    className={`p-3.5 rounded-xl border transition ${
                      isCurrent
                        ? 'border-emerald-500/50 bg-[#0c181f]'
                        : 'border-white/5 bg-[#090e13]'
                    }`}
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div
                        onClick={() => onSelectProject(proj)}
                        className="cursor-pointer min-w-0 flex-1"
                      >
                        <div className="flex items-center gap-2">
                          <h4 className="text-sm font-bold text-zinc-100 truncate">
                            {proj.name}
                          </h4>
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
                        <p className="text-xs text-zinc-400 mt-1 line-clamp-1">
                          {proj.description}
                        </p>
                        <div className="text-[10px] font-mono text-zinc-500 mt-2 flex items-center gap-3">
                          <span>{proj.modules.length} Modules</span>
                          <span>•</span>
                          <span className="capitalize">
                            {proj.ambientTrack.type.replace('_', ' ')}
                          </span>
                        </div>
                      </div>

                      <div className="flex items-center gap-1.5 shrink-0">
                        <button
                          onClick={() => onPlayProject(proj)}
                          className="p-2 rounded-lg bg-emerald-500/10 text-emerald-400 hover:bg-emerald-500/20"
                          title="Play Project"
                        >
                          <Play size={14} className="ml-0.5" />
                        </button>
                        {!proj.isDemo && projects.length > 1 && (
                          <button
                            onClick={() => onDeleteProject(proj.id)}
                            className="p-2 rounded-lg bg-red-500/10 text-red-400 hover:bg-red-500/20"
                            title="Delete Project"
                          >
                            <Trash2 size={14} />
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
          </div>
        </div>
      )}

      {/* 2. SESSIONS TAB */}
      {activeTab === 'sessions' && (
        <div className="space-y-3">
          <span className="text-xs font-mono text-zinc-400 uppercase">
            Listening Sessions ({sessions.length})
          </span>
          {sessions.length === 0 ? (
            <div className="p-8 text-center rounded-xl bg-[#090e13] border border-white/5 space-y-2">
              <Clock size={24} className="mx-auto text-zinc-600" />
              <div className="text-xs font-mono text-zinc-400">No sessions scheduled yet.</div>
            </div>
          ) : (
            <div className="space-y-2">
              {sessions.map((sess) => (
                <div
                  key={sess.id}
                  className="p-3 rounded-xl bg-[#090e13] border border-white/5 flex items-center justify-between"
                >
                  <div>
                    <div className="text-xs font-bold text-zinc-100">{sess.name}</div>
                    <div className="text-[10px] font-mono text-zinc-500">
                      {sess.durationMinutes} min • {sess.ambientType.replace('_', ' ')}
                    </div>
                  </div>
                  <button
                    onClick={() => onDeleteSession(sess.id)}
                    className="p-1.5 rounded text-zinc-500 hover:text-red-400"
                  >
                    <Trash2 size={14} />
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* 3. MODULES TAB */}
      {activeTab === 'modules' && (
        <div className="space-y-3">
          <span className="text-xs font-mono text-zinc-400 uppercase">
            All Affirmation Modules
          </span>
          <div className="space-y-2">
            {activeProject.modules.map((mod, idx) => (
              <div
                key={mod.id}
                className="p-3 rounded-xl bg-[#090e13] border border-white/5 space-y-1.5"
              >
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-zinc-200">
                    L{idx + 1}: {mod.name}
                  </span>
                  <span className="text-[10px] font-mono text-emerald-400">
                    {mod.volumeDb} dB
                  </span>
                </div>
                <p className="text-[11px] text-zinc-400">{mod.description}</p>
                <div className="text-[10px] font-mono text-zinc-500 flex gap-2">
                  <span>{mod.affirmations.length} affirmations</span>
                  <span>•</span>
                  <span>{mod.voiceSettings.source.toUpperCase()}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* 4. SCRIPTS TAB */}
      {activeTab === 'scripts' && (
        <div className="space-y-3">
          <span className="text-xs font-mono text-zinc-400 uppercase">
            Affirmation Scripts Repository
          </span>
          <div className="space-y-2">
            {activeProject.modules.flatMap((m) =>
              m.affirmations.map((a) => (
                <div
                  key={a.id}
                  className="p-2.5 rounded-xl bg-[#090e13] border border-white/5 flex items-start justify-between gap-2"
                >
                  <p className="text-xs text-zinc-200">{a.text}</p>
                  <span className="text-[9px] font-mono px-1.5 py-0.5 rounded bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 shrink-0">
                    {a.perspective}
                  </span>
                </div>
              ))
            )}
          </div>
        </div>
      )}

      {/* 5. VOICE RECORDINGS TAB */}
      {activeTab === 'voice' && (
        <div className="space-y-3">
          <span className="text-xs font-mono text-zinc-400 uppercase">
            Custom Microphone Recordings
          </span>
          <div className="p-4 rounded-xl bg-[#090e13] border border-white/5 text-center space-y-2">
            <Mic size={20} className="mx-auto text-emerald-400" />
            <div className="text-xs text-zinc-300">
              Microphone captures are stored securely in local browser IndexedDB.
            </div>
          </div>
        </div>
      )}

      {/* 6. AMBIENT AUDIO TAB */}
      {activeTab === 'ambient' && (
        <div className="space-y-2">
          <span className="text-xs font-mono text-zinc-400 uppercase">
            Ambient Soundscape Synthesizers
          </span>
          <div className="grid grid-cols-2 gap-2 text-xs font-mono">
            {['Heavy Rain', 'Gentle Rain', 'Ocean Surf', 'Brown Noise', 'Pink Noise', 'White Noise', 'Forest Wind', 'Fireplace'].map(
              (name) => (
                <div
                  key={name}
                  className="p-3 rounded-xl bg-[#090e13] border border-white/5 text-zinc-300"
                >
                  <div className="font-bold">{name}</div>
                  <div className="text-[10px] text-emerald-400 mt-0.5">DSP Procedural</div>
                </div>
              )
            )}
          </div>
        </div>
      )}

      {/* 7. EXPORTS TAB */}
      {activeTab === 'exports' && (
        <div className="space-y-3">
          <span className="text-xs font-mono text-zinc-400 uppercase">
            Mastered Rendered Audio ({exports.length})
          </span>
          {exports.length === 0 ? (
            <div className="p-8 text-center rounded-xl bg-[#090e13] border border-white/5 space-y-2">
              <Download size={24} className="mx-auto text-zinc-600" />
              <div className="text-xs font-mono text-zinc-400">
                No audio renders yet. Head to Build Audio &gt; Export.
              </div>
            </div>
          ) : (
            <div className="space-y-2">
              {exports.map((exp) => (
                <div
                  key={exp.id}
                  className="p-3 rounded-xl bg-[#090e13] border border-white/5 flex items-center justify-between"
                >
                  <div className="min-w-0 pr-2">
                    <div className="text-xs font-bold text-zinc-200 truncate">{exp.fileName}</div>
                    <div className="text-[10px] font-mono text-zinc-500">
                      {exp.durationSeconds}s • {exp.fileSizeKb} KB • 16-bit WAV
                    </div>
                  </div>
                  {exp.downloadUrl && (
                    <a
                      href={exp.downloadUrl}
                      download={exp.fileName}
                      className="p-2 rounded-lg bg-emerald-500/20 text-emerald-400 hover:bg-emerald-500/30"
                    >
                      <Download size={14} />
                    </a>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* 8. PRESETS TAB */}
      {activeTab === 'presets' && (
        <div className="space-y-3">
          <span className="text-xs font-mono text-zinc-400 uppercase">
            Saved Console Presets ({presets.length})
          </span>
          <div className="space-y-2">
            {presets.map((p) => (
              <div
                key={p.id}
                className="p-3 rounded-xl bg-[#090e13] border border-white/5 flex items-center justify-between"
              >
                <div>
                  <div className="text-xs font-bold text-zinc-200">{p.name}</div>
                  <div className="text-[10px] text-zinc-400 line-clamp-1">{p.description}</div>
                  <div className="text-[10px] font-mono text-cyan-400 mt-1">
                    Affirmations: {p.affirmationVolumeDb} dB • Ambient: {p.ambientVolumeDb} dB
                  </div>
                </div>

                <div className="flex items-center gap-1.5 shrink-0">
                  <button
                    onClick={() => onApplyPreset(p)}
                    className="px-2.5 py-1 rounded-lg bg-cyan-500/20 text-cyan-300 text-xs font-mono hover:bg-cyan-500/30"
                  >
                    Apply
                  </button>
                  {!p.isBuiltIn && (
                    <button
                      onClick={() => onDeletePreset(p.id)}
                      className="p-1.5 rounded text-zinc-500 hover:text-red-400"
                    >
                      <Trash2 size={14} />
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};
