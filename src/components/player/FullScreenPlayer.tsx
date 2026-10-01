import React from 'react';
import { Project } from '../../types';
import { AudioVisualizer } from '../visualizer/AudioVisualizer';
import { audioEngine } from '../../services/audioEngine';
import {
  Play,
  Pause,
  RotateCcw,
  SkipBack,
  SkipForward,
  Repeat,
  Volume2,
  Sliders,
  ShieldCheck,
  Radio,
} from 'lucide-react';

interface FullScreenPlayerProps {
  project: Project;
  isPlaying: boolean;
  onTogglePlay: () => void;
  elapsedSeconds: number;
  durationSeconds: number;
  onSeek: (sec: number) => void;
  onOpenMixer: () => void;
}

export const FullScreenPlayer: React.FC<FullScreenPlayerProps> = ({
  project,
  isPlaying,
  onTogglePlay,
  elapsedSeconds,
  durationSeconds,
  onSeek,
  onOpenMixer,
}) => {
  const activeModules = project.modules.filter((m) => m.enabled && !m.isMuted);

  const formatTime = (secs: number) => {
    const mins = Math.floor(secs / 60);
    const remainder = Math.floor(secs % 60);
    return `${mins}:${remainder < 10 ? '0' : ''}${remainder}`;
  };

  const progressPercent = durationSeconds > 0 ? (elapsedSeconds / durationSeconds) * 100 : 0;

  return (
    <div className="space-y-6 pb-12">
      {/* Session Title & Metadata */}
      <div className="text-center space-y-1">
        <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 text-[10px] font-mono tracking-wider">
          <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
          <span>SESSION MASTER OUTPUT</span>
        </div>
        <h2 className="text-2xl font-bold tracking-tight text-white mt-1">
          {project.name}
        </h2>
        <p className="text-xs text-zinc-400 line-clamp-1">
          {project.ambientTrack.type.replace('_', ' ')} • {activeModules.length} Active Layer{activeModules.length !== 1 ? 's' : ''}
        </p>
      </div>

      {/* Central Visualizer Artwork Card */}
      <div className="relative rounded-3xl bg-[#0a0f14] border border-emerald-500/25 p-6 shadow-2xl overflow-hidden aspect-square max-w-[340px] mx-auto flex flex-col items-center justify-center">
        {/* Subtle Radar Background Overlay */}
        <div className="absolute inset-0 radar-sweep opacity-30 pointer-events-none" />

        <div className="relative z-10 w-full flex flex-col items-center space-y-4">
          <div className="relative flex items-center justify-center w-28 h-28 rounded-full border border-emerald-500/30 bg-[#060a0d] shadow-[0_0_30px_rgba(16,185,129,0.15)]">
            <Radio size={36} className={`text-emerald-400 ${isPlaying ? 'animate-pulse' : 'opacity-70'}`} />
          </div>

          <div className="w-full">
            <AudioVisualizer height={65} mode="oscilloscope" showPeakMeter={true} />
          </div>
        </div>
      </div>

      {/* Active Modules Badges */}
      <div className="flex flex-wrap items-center justify-center gap-1.5 max-w-sm mx-auto">
        {activeModules.map((m, idx) => (
          <span
            key={m.id}
            className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-[#121a22] border border-white/10 text-zinc-300"
          >
            L{idx + 1}: {m.name} ({m.volumeDb}dB)
          </span>
        ))}
      </div>

      {/* Progress Bar & Timing Controls */}
      <div className="space-y-1.5 max-w-sm mx-auto">
        <input
          type="range"
          min={0}
          max={durationSeconds}
          value={elapsedSeconds}
          onChange={(e) => onSeek(parseFloat(e.target.value))}
          className="w-full h-2 rounded-lg bg-zinc-800 accent-emerald-500 cursor-pointer"
        />

        <div className="flex items-center justify-between text-xs font-mono text-zinc-400">
          <span>{formatTime(elapsedSeconds)}</span>
          <span className="text-zinc-600">
            {Math.round(progressPercent)}%
          </span>
          <span>-{formatTime(Math.max(0, durationSeconds - elapsedSeconds))}</span>
        </div>
      </div>

      {/* Large Transport Controls */}
      <div className="flex items-center justify-center gap-6 max-w-sm mx-auto">
        <button
          onClick={() => onSeek(Math.max(0, elapsedSeconds - 15))}
          className="p-3 text-zinc-400 hover:text-white transition active:scale-95"
          title="Rewind 15s"
        >
          <SkipBack size={24} />
        </button>

        <button
          onClick={onTogglePlay}
          className={`h-20 w-20 rounded-full flex items-center justify-center transition shadow-2xl active:scale-95 ${
            isPlaying
              ? 'bg-amber-500 text-black shadow-amber-500/20'
              : 'bg-emerald-500 text-black shadow-emerald-500/30 hover:bg-emerald-400'
          }`}
          title={isPlaying ? 'Pause' : 'Play'}
        >
          {isPlaying ? <Pause size={34} /> : <Play size={34} className="ml-1" />}
        </button>

        <button
          onClick={() => onSeek(Math.min(durationSeconds, elapsedSeconds + 15))}
          className="p-3 text-zinc-400 hover:text-white transition active:scale-95"
          title="Forward 15s"
        >
          <SkipForward size={24} />
        </button>
      </div>

      {/* Secondary Controls: Mixer button, Reset, Volume */}
      <div className="flex items-center justify-between max-w-sm mx-auto pt-2 px-4 border-t border-white/5">
        <button
          onClick={() => audioEngine.stop()}
          className="p-2 text-zinc-400 hover:text-white text-xs font-mono flex items-center gap-1.5"
          title="Restart Session"
        >
          <RotateCcw size={15} />
          <span>Reset</span>
        </button>

        <button
          onClick={onOpenMixer}
          className="px-3 py-1.5 rounded-xl bg-zinc-800 text-zinc-200 hover:text-white text-xs font-mono flex items-center gap-1.5 border border-white/5"
        >
          <Sliders size={14} className="text-emerald-400" />
          <span>Live Console</span>
        </button>

        <button
          className="p-2 text-emerald-400 text-xs font-mono flex items-center gap-1.5"
          title="Loop Enabled"
        >
          <Repeat size={15} />
          <span>Loop</span>
        </button>
      </div>

      {/* Master Volume Quick Control */}
      <div className="max-w-sm mx-auto px-4 space-y-1">
        <div className="flex items-center justify-between text-[11px] font-mono text-zinc-400">
          <span className="flex items-center gap-1">
            <Volume2 size={13} />
            Master Output
          </span>
          <span className="text-emerald-400 font-bold">{project.masterVolumeDb} dB</span>
        </div>
        <input
          type="range"
          min={-24}
          max={6}
          step={0.5}
          value={project.masterVolumeDb}
          onChange={(e) => audioEngine.setMasterVolume(parseFloat(e.target.value))}
          className="w-full"
        />
      </div>

      {/* iOS Lock-screen / Background Architecture Notice (Prompt #14 & #31) */}
      <div className="max-w-sm mx-auto p-3 rounded-xl bg-[#090d11] border border-white/5 text-[11px] font-mono text-zinc-500 flex items-start gap-2">
        <ShieldCheck size={14} className="text-cyan-400 shrink-0 mt-0.5" />
        <p className="leading-relaxed">
          Lock-screen & background playback widget requires native iOS build (AVAudioSession). Web Audio playback remains active within mobile Safari tab.
        </p>
      </div>
    </div>
  );
};
