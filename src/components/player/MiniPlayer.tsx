import React from 'react';
import { Project } from '../../types';
import { Play, Pause, Radio } from 'lucide-react';

interface MiniPlayerProps {
  project: Project;
  isPlaying: boolean;
  onTogglePlay: () => void;
  onExpandPlayer: () => void;
  elapsedSeconds: number;
}

export const MiniPlayer: React.FC<MiniPlayerProps> = ({
  project,
  isPlaying,
  onTogglePlay,
  onExpandPlayer,
  elapsedSeconds,
}) => {
  const activeCount = project.modules.filter((m) => m.enabled && !m.isMuted).length;

  const formatTime = (secs: number) => {
    const mins = Math.floor(secs / 60);
    const remainder = Math.floor(secs % 60);
    return `${mins}:${remainder < 10 ? '0' : ''}${remainder}`;
  };

  return (
    <div className="absolute bottom-[76px] left-3 right-3 z-30 pointer-events-auto">
      <div className="rounded-2xl bg-[#0a1015]/95 border border-emerald-500/30 backdrop-blur-md p-2.5 shadow-2xl flex items-center justify-between gap-3">
        {/* Left Side: Click to expand to full player */}
        <div
          onClick={onExpandPlayer}
          className="flex items-center gap-3 min-w-0 flex-1 cursor-pointer"
        >
          <div className="w-10 h-10 rounded-xl bg-[#060a0d] border border-emerald-500/30 flex items-center justify-center shrink-0">
            <Radio
              size={18}
              className={`text-emerald-400 ${isPlaying ? 'animate-pulse' : 'opacity-60'}`}
            />
          </div>

          <div className="min-w-0">
            <div className="text-xs font-bold text-white truncate">{project.name}</div>
            <div className="text-[10px] font-mono text-zinc-400 flex items-center gap-2 mt-0.5">
              <span className="text-emerald-400">{formatTime(elapsedSeconds)}</span>
              <span>•</span>
              <span className="truncate">{activeCount} Layer{activeCount !== 1 ? 's' : ''}</span>
              <span>•</span>
              <span className="capitalize">{project.ambientTrack.type.replace('_', ' ')}</span>
            </div>
          </div>
        </div>

        {/* Right Side: Quick Play/Pause */}
        <button
          onClick={(e) => {
            e.stopPropagation();
            onTogglePlay();
          }}
          className={`h-9 w-9 rounded-xl flex items-center justify-center shrink-0 transition active:scale-95 ${
            isPlaying
              ? 'bg-amber-500 text-black'
              : 'bg-emerald-500 text-black hover:bg-emerald-400'
          }`}
          title={isPlaying ? 'Pause' : 'Play'}
        >
          {isPlaying ? <Pause size={16} /> : <Play size={16} className="ml-0.5" />}
        </button>
      </div>
    </div>
  );
};
