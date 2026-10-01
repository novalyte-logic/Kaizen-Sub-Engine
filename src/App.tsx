/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { useState, useEffect, useCallback } from 'react';
import { Project, MixerPreset, Session, ExportRecord, AppSettings } from './types';
import { storageService, DEFAULT_SETTINGS, DEMO_PROJECT } from './services/storage';
import { audioEngine } from './services/audioEngine';
import { MobileShell } from './components/layout/MobileShell';
import { HomeScreen } from './components/home/HomeScreen';
import { BuildEngine } from './components/build/BuildEngine';
import { LibraryScreen } from './components/library/LibraryScreen';
import { FullScreenPlayer } from './components/player/FullScreenPlayer';
import { SettingsScreen } from './components/settings/SettingsScreen';
import { MiniPlayer } from './components/player/MiniPlayer';
import { Sparkles, Plus, X, Radio } from 'lucide-react';

export default function App() {
  const [currentTab, setCurrentTab] = useState<
    'home' | 'build' | 'library' | 'player' | 'settings'
  >('home');
  const [projects, setProjects] = useState<Project[]>([]);
  const [activeProject, setActiveProject] = useState<Project>(DEMO_PROJECT);
  const [presets, setPresets] = useState<MixerPreset[]>([]);
  const [sessions, setSessions] = useState<Session[]>([]);
  const [exportsList, setExportsList] = useState<ExportRecord[]>([]);
  const [settings, setSettings] = useState<AppSettings>(DEFAULT_SETTINGS);

  // Audio Playback state
  const [isPlaying, setIsPlaying] = useState<boolean>(false);
  const [elapsedSeconds, setElapsedSeconds] = useState<number>(0);
  const [sessionDurationSeconds, setSessionDurationSeconds] = useState<number>(1800);

  // Modals
  const [firstRunOpen, setFirstRunOpen] = useState<boolean>(false);
  const [newProjectModalOpen, setNewProjectModalOpen] = useState<boolean>(false);
  const [newProjectName, setNewProjectName] = useState<string>('');
  const [newProjectDesc, setNewProjectDesc] = useState<string>('');

  // 1. Initial Load from IndexedDB
  useEffect(() => {
    async function loadData() {
      try {
        const { project, presets: loadedPresets } = await storageService.initializeDefaults();
        const allProjects = await storageService.getProjects();
        const allSessions = await storageService.getSessions();
        const allExports = await storageService.getExports();
        const appSettings = await storageService.getSettings();

        setProjects(allProjects.length > 0 ? allProjects : [project]);
        setActiveProject(project);
        setPresets(loadedPresets);
        setSessions(allSessions);
        setExportsList(allExports);
        setSettings(appSettings);

        if (!appSettings.firstRunCompleted) {
          setFirstRunOpen(true);
        }
      } catch (err) {
        console.error('Error initializing Kaizen Storage:', err);
      }
    }
    loadData();
  }, []);

  // 2. Audio Engine Listener Subscription
  useEffect(() => {
    const unsubscribe = audioEngine.addListener((state) => {
      setIsPlaying(state.isPlaying);
      setElapsedSeconds(state.elapsedSeconds);
      setSessionDurationSeconds(state.durationSeconds);
    });
    return () => unsubscribe();
  }, []);

  // 3. Update Active Project and persist to IndexedDB
  const handleUpdateProject = useCallback(
    async (updated: Project) => {
      setActiveProject(updated);
      setProjects((prev) => prev.map((p) => (p.id === updated.id ? updated : p)));
      await storageService.saveProject(updated);
      if (audioEngine.getIsPlaying()) {
        await audioEngine.setupProjectRouting(updated);
      }
    },
    []
  );

  // 4. Play / Pause Toggle
  const handleTogglePlay = async () => {
    if (isPlaying) {
      audioEngine.pause();
    } else {
      await audioEngine.play(activeProject, sessionDurationSeconds);
    }
  };

  // 5. Apply Mixer Preset to active project
  const handleApplyPreset = async (preset: MixerPreset) => {
    const updatedModules = activeProject.modules.map((m) => ({
      ...m,
      volumeDb: preset.affirmationVolumeDb,
    }));

    const updatedProject: Project = {
      ...activeProject,
      activePresetName: preset.name,
      ambientTrack: {
        ...activeProject.ambientTrack,
        type: preset.ambientType,
        volumeDb: preset.ambientVolumeDb,
      },
      masterVolumeDb: preset.masterVolumeDb,
      modules: updatedModules,
    };

    await handleUpdateProject(updatedProject);
    if (isPlaying) {
      await audioEngine.startAmbient(updatedProject.ambientTrack);
    }
  };

  // 6. Save new Preset
  const handleSavePreset = async (newPreset: MixerPreset) => {
    setPresets((prev) => [...prev, newPreset]);
    await storageService.savePreset(newPreset);
  };

  const handleDeletePreset = async (id: string) => {
    setPresets((prev) => prev.filter((p) => p.id !== id));
    await storageService.deletePreset(id);
  };

  // 7. Save Export Record
  const handleSaveExportRecord = async (rec: ExportRecord) => {
    setExportsList((prev) => [rec, ...prev]);
    await storageService.saveExport(rec);
  };

  // 8. Create New Project Modal Action
  const handleCreateProject = async () => {
    if (!newProjectName.trim()) return;
    const newProj: Project = {
      id: `proj_${Date.now()}`,
      name: newProjectName.trim(),
      description: newProjectDesc.trim() || 'Custom subliminal audio workspace.',
      isDemo: false,
      createdAt: Date.now(),
      updatedAt: Date.now(),
      masterVolumeDb: 0,
      activePresetName: 'KAIZEN SUBTLE (-22 dB)',
      ambientTrack: {
        id: `amb_${Date.now()}`,
        name: 'Heavy Rain Soundscape',
        type: 'heavy_rain',
        volumeDb: 0,
        pan: 0,
        enabled: true,
        isMuted: false,
      },
      modules: [
        {
          id: `mod_${Date.now()}_1`,
          name: 'Identity & Purpose',
          description: 'First-person baseline affirmations.',
          scriptText:
            'I am in full sovereign control of my focus and execution.\nEvery day I move forward with measured clarity.',
          affirmations: [
            {
              id: `aff_1_${Date.now()}`,
              text: 'I am in full sovereign control of my focus and execution.',
              perspective: 'I',
              enabled: true,
            },
            {
              id: `aff_2_${Date.now()}`,
              text: 'Every day I move forward with measured clarity.',
              perspective: 'I',
              enabled: true,
            },
          ],
          voiceSettings: {
            voiceId: 'default',
            voiceName: 'Neural English (Subconscious)',
            speed: 1.0,
            pitch: 0.92,
            pauseDurationMs: 1400,
            sentenceSpacingMs: 800,
            repetitions: 3,
            source: 'tts',
          },
          volumeDb: -22,
          pan: 0,
          timingOffsetMs: 0,
          enabled: true,
          isMuted: false,
          isSolo: false,
          layerIndex: 1,
        },
      ],
    };

    setProjects((prev) => [newProj, ...prev]);
    setActiveProject(newProj);
    await storageService.saveProject(newProj);
    setNewProjectName('');
    setNewProjectDesc('');
    setNewProjectModalOpen(false);
    setCurrentTab('build');
  };

  // 9. Delete Project
  const handleDeleteProject = async (id: string) => {
    const filtered = projects.filter((p) => p.id !== id);
    setProjects(filtered);
    await storageService.deleteProject(id);
    if (activeProject.id === id && filtered.length > 0) {
      setActiveProject(filtered[0]);
    }
  };

  // 10. Complete First Run Modal
  const handleDismissFirstRun = async (openDemo = false) => {
    setFirstRunOpen(false);
    const updatedSettings = { ...settings, firstRunCompleted: true };
    setSettings(updatedSettings);
    await storageService.saveSettings(updatedSettings);

    if (openDemo) {
      setCurrentTab('build');
    } else {
      setNewProjectModalOpen(true);
    }
  };

  // 11. Data Portability Backup & Restore
  const handleExportAllData = async () => {
    const backupData = {
      projects,
      presets,
      sessions,
      settings,
      timestamp: Date.now(),
      version: '2.4.0',
    };
    const jsonStr = JSON.stringify(backupData, null, 2);
    const blob = new Blob([jsonStr], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `kaizen_backup_${Date.now()}.json`;
    a.click();
  };

  const handleImportData = async (jsonString: string) => {
    const parsed = JSON.parse(jsonString);
    if (parsed.projects && Array.isArray(parsed.projects)) {
      for (const p of parsed.projects) {
        await storageService.saveProject(p);
      }
      setProjects(parsed.projects);
      if (parsed.projects[0]) setActiveProject(parsed.projects[0]);
    }
    if (parsed.presets && Array.isArray(parsed.presets)) {
      for (const pr of parsed.presets) {
        await storageService.savePreset(pr);
      }
      setPresets(parsed.presets);
    }
  };

  return (
    <MobileShell
      currentTab={currentTab}
      onTabChange={setCurrentTab}
      activeProject={activeProject}
      isPlaying={isPlaying}
    >
      {/* Tab Switcher */}
      {currentTab === 'home' && (
        <HomeScreen
          activeProject={activeProject}
          projects={projects}
          presets={presets}
          sessions={sessions}
          exports={exportsList}
          onSelectProject={(proj) => {
            setActiveProject(proj);
            if (isPlaying) {
              audioEngine.play(proj, sessionDurationSeconds);
            }
          }}
          onNavigateTab={setCurrentTab}
          onApplyPreset={handleApplyPreset}
          onStartNewSession={() => setCurrentTab('player')}
          onPlayCurrent={handleTogglePlay}
          isPlaying={isPlaying}
          onOpenNewProjectModal={() => setNewProjectModalOpen(true)}
        />
      )}

      {currentTab === 'build' && (
        <BuildEngine
          project={activeProject}
          onUpdateProject={handleUpdateProject}
          onSavePreset={handleSavePreset}
          onSaveExportRecord={handleSaveExportRecord}
          isPlaying={isPlaying}
          onTogglePlay={handleTogglePlay}
        />
      )}

      {currentTab === 'library' && (
        <LibraryScreen
          projects={projects}
          activeProject={activeProject}
          onSelectProject={(proj) => {
            setActiveProject(proj);
            setCurrentTab('build');
          }}
          onDeleteProject={handleDeleteProject}
          presets={presets}
          onApplyPreset={handleApplyPreset}
          onDeletePreset={handleDeletePreset}
          sessions={sessions}
          onDeleteSession={async (id) => {
            setSessions((prev) => prev.filter((s) => s.id !== id));
            await storageService.deleteSession(id);
          }}
          exports={exportsList}
          onOpenNewProjectModal={() => setNewProjectModalOpen(true)}
          onPlayProject={(proj) => {
            setActiveProject(proj);
            audioEngine.play(proj, sessionDurationSeconds);
            setCurrentTab('player');
          }}
        />
      )}

      {currentTab === 'player' && (
        <FullScreenPlayer
          project={activeProject}
          isPlaying={isPlaying}
          onTogglePlay={handleTogglePlay}
          elapsedSeconds={elapsedSeconds}
          durationSeconds={sessionDurationSeconds}
          onSeek={(sec) => audioEngine.seek(sec)}
          onOpenMixer={() => setCurrentTab('build')}
        />
      )}

      {currentTab === 'settings' && (
        <SettingsScreen
          settings={settings}
          onUpdateSettings={async (updated) => {
            setSettings(updated);
            await storageService.saveSettings(updated);
          }}
          onExportAllData={handleExportAllData}
          onImportData={handleImportData}
        />
      )}

      {/* Persistent Mini-Player (shows when not on player tab) */}
      {currentTab !== 'player' && (
        <MiniPlayer
          project={activeProject}
          isPlaying={isPlaying}
          onTogglePlay={handleTogglePlay}
          onExpandPlayer={() => setCurrentTab('player')}
          elapsedSeconds={elapsedSeconds}
        />
      )}

      {/* First-Run Experience Modal (Prompt #29) */}
      {firstRunOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/85 backdrop-blur-md p-4">
          <div className="w-full max-w-sm rounded-3xl bg-[#0d141b] border border-emerald-500/40 p-6 shadow-2xl space-y-4">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-xl bg-emerald-500/20 border border-emerald-500/40 flex items-center justify-center">
                <Radio size={16} className="text-emerald-400" />
              </div>
              <span className="text-[11px] font-mono text-emerald-400 font-bold tracking-wider">
                KAIZEN AUDIO ENGINE
              </span>
            </div>

            <div className="space-y-1">
              <h3 className="text-xl font-bold text-white tracking-tight">
                Welcome to Kaizen Subliminal Engine
              </h3>
              <p className="text-xs text-zinc-400 leading-relaxed">
                Precision mobile audio workstation for layered affirmations, subconscious timing staggers, and procedural masking soundscapes.
              </p>
            </div>

            <div className="space-y-2.5 pt-2 font-mono">
              <button
                onClick={() => handleDismissFirstRun(false)}
                className="w-full py-3 rounded-xl bg-emerald-500 text-black font-bold text-xs uppercase tracking-wider shadow-lg shadow-emerald-500/20 active:scale-98 transition flex items-center justify-center gap-2"
              >
                <Plus size={15} />
                <span>Create My First Session</span>
              </button>

              <button
                onClick={() => handleDismissFirstRun(true)}
                className="w-full py-2.5 rounded-xl bg-[#090e13] border border-white/10 text-zinc-300 hover:text-white font-semibold text-xs tracking-wider uppercase active:scale-98 transition flex items-center justify-center gap-2"
              >
                <Sparkles size={14} className="text-cyan-400" />
                <span>Explore Demo (Kaizen Master)</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Create New Project Modal */}
      {newProjectModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4">
          <div className="w-full max-w-sm rounded-2xl bg-[#0d141b] border border-emerald-500/30 p-5 shadow-2xl space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-bold text-white font-mono uppercase tracking-wider">
                Create New Project
              </h3>
              <button
                onClick={() => setNewProjectModalOpen(false)}
                className="p-1 text-zinc-400 hover:text-white"
              >
                <X size={16} />
              </button>
            </div>

            <div className="space-y-3 font-mono text-xs">
              <div className="space-y-1">
                <label className="text-zinc-400">PROJECT TITLE</label>
                <input
                  type="text"
                  value={newProjectName}
                  onChange={(e) => setNewProjectName(e.target.value)}
                  placeholder="e.g. Sovereign Authority 2026"
                  className="w-full bg-[#080c10] border border-white/10 rounded-xl px-3 py-2 text-zinc-100 placeholder-zinc-600 focus:outline-none focus:border-emerald-500"
                />
              </div>

              <div className="space-y-1">
                <label className="text-zinc-400">INTENTION / DESCRIPTION</label>
                <textarea
                  rows={2}
                  value={newProjectDesc}
                  onChange={(e) => setNewProjectDesc(e.target.value)}
                  placeholder="Optional brief notes on mindset and goals..."
                  className="w-full bg-[#080c10] border border-white/10 rounded-xl px-3 py-2 text-zinc-100 placeholder-zinc-600 focus:outline-none focus:border-emerald-500"
                />
              </div>
            </div>

            <div className="flex gap-2 font-mono text-xs pt-1">
              <button
                onClick={() => setNewProjectModalOpen(false)}
                className="flex-1 py-2.5 rounded-xl bg-zinc-800 text-zinc-300"
              >
                Cancel
              </button>
              <button
                onClick={handleCreateProject}
                disabled={!newProjectName.trim()}
                className="flex-1 py-2.5 rounded-xl bg-emerald-500 text-black font-bold disabled:opacity-40"
              >
                Create Project
              </button>
            </div>
          </div>
        </div>
      )}
    </MobileShell>
  );
}
