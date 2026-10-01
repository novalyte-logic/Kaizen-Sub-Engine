import React from 'react';
import { Volume2, VolumeX, Eye, EyeOff, Radio, AlertTriangle } from 'lucide-react';

interface ChannelStripProps {
  id: string;
  name: string;
  badge?: string;
  volumeDb: number;
  pan: number;
  timingOffsetMs?: number;
  enabled: boolean;
  isMuted: boolean;
  isSolo: boolean;
  onVolumeChange: (val: number) => void;
  onPanChange: (val: number) => void;
  onTimingOffsetChange?: (val: number) => void;
  onToggleMute: () => void;
  onToggleSolo: () => void;
  onToggleEnable: () => void;
  isAmbient?: boolean;
}

export const ChannelStrip: React.FC<ChannelStripProps> = ({
  name,
  badge,
  volumeDb,
  pan,
  timingOffsetMs,
  enabled,
  isMuted,
  isSolo,
  onVolumeChange,
  onPanChange,
  onTimingOffsetChange,
  onToggleMute,
  onToggleSolo,
  onToggleEnable,
  isAmbient = false,
}) => {
  const isNearInaudible = !isAmbient && volumeDb <= -36;
  const isClippingRisk = volumeDb > 0;

  return (
    <div
      className={`relative rounded-xl border p-3 transition-all ${
        !enabled
          ? 'border-white/5 bg-[#0b1015]/60 opacity-60'
          : isSolo
          ? 'border-emerald-500/50 bg-[#0c161d] shadow-[0_0_15px_rgba(16,185,129,0.1)]'
          : 'border-white/10 bg-[#0d1318]'
      }`}
    >
      {/* Top Header Row */}
      <div className="flex items-center justify-between gap-2 mb-2">
        <div className="flex items-center gap-2 min-w-0">
          <button
            onClick={onToggleEnable}
            title={enabled ? 'Disable channel' : 'Enable channel'}
            className={`p-1 rounded text-xs transition ${
              enabled ? 'text-emerald-400 hover:text-emerald-300' : 'text-zinc-600 hover:text-zinc-400'
            }`}
          >
            {enabled ? <Eye size={15} /> : <EyeOff size={15} />}
          </button>
          <span className="font-semibold text-xs tracking-tight text-zinc-100 truncate">
            {name}
          </span>
          {badge && (
            <span className="text-[10px] uppercase font-mono px-1.5 py-0.5 rounded bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 shrink-0">
              {badge}
            </span>
          )}
        </div>

        {/* Solo / Mute Buttons */}
        <div className="flex items-center gap-1.5 shrink-0">
          <button
            onClick={onToggleSolo}
            className={`px-2 py-0.5 rounded text-[11px] font-mono font-bold transition ${
              isSolo
                ? 'bg-amber-500 text-black shadow-sm'
                : 'bg-zinc-800 text-zinc-400 hover:bg-zinc-700 hover:text-zinc-200'
            }`}
          >
            S
          </button>
          <button
            onClick={onToggleMute}
            className={`p-1 rounded text-xs transition ${
              isMuted
                ? 'bg-red-500/20 text-red-400 border border-red-500/30'
                : 'bg-zinc-800 text-zinc-400 hover:bg-zinc-700 hover:text-zinc-200'
            }`}
          >
            {isMuted ? <VolumeX size={13} /> : <Volume2 size={13} />}
          </button>
        </div>
      </div>

      {/* Main Volume Slider & Numerical Level */}
      <div className="space-y-1.5">
        <div className="flex items-center justify-between text-xs font-mono">
          <span className="text-zinc-400 text-[11px]">GAIN LEVEL</span>
          <span
            className={`font-bold ${
              isClippingRisk
                ? 'text-red-400'
                : isNearInaudible
                ? 'text-amber-400'
                : 'text-emerald-400'
            }`}
          >
            {volumeDb > 0 ? `+${volumeDb}` : `${volumeDb}`} dB
          </span>
        </div>

        <input
          type="range"
          min={-42}
          max={6}
          step={0.5}
          value={volumeDb}
          onChange={(e) => onVolumeChange(parseFloat(e.target.value))}
          disabled={!enabled || isMuted}
          className="w-full h-2 rounded-lg bg-zinc-800 accent-emerald-500 cursor-pointer"
        />

        {/* Level Guidance & Warnings */}
        {isNearInaudible && enabled && !isMuted && (
          <div className="flex items-center gap-1 text-[10px] text-amber-400/90 font-mono mt-0.5">
            <AlertTriangle size={11} className="shrink-0" />
            <span>Layer is at minimal audibility threshold.</span>
          </div>
        )}
        {isClippingRisk && enabled && !isMuted && (
          <div className="flex items-center gap-1 text-[10px] text-red-400 font-mono mt-0.5">
            <AlertTriangle size={11} className="shrink-0" />
            <span>Warning: Gain above 0 dB may cause digital distortion.</span>
          </div>
        )}
      </div>

      {/* Secondary Controls: Pan & Stagger Offset */}
      <div className="mt-3 pt-2 border-t border-white/5 grid grid-cols-2 gap-2 text-[11px]">
        {/* Pan Slider */}
        <div className="space-y-1">
          <div className="flex items-center justify-between text-[10px] font-mono text-zinc-400">
            <span>PAN</span>
            <span>{pan === 0 ? 'C' : pan < 0 ? `L${Math.abs(Math.round(pan * 100))}%` : `R${Math.round(pan * 100)}%`}</span>
          </div>
          <input
            type="range"
            min={-1}
            max={1}
            step={0.05}
            value={pan}
            onChange={(e) => onPanChange(parseFloat(e.target.value))}
            disabled={!enabled || isMuted}
            className="w-full h-1.5 rounded-lg bg-zinc-800 cursor-pointer"
          />
        </div>

        {/* Stagger Timing Offset (for voice layers) */}
        {!isAmbient && onTimingOffsetChange && timingOffsetMs !== undefined && (
          <div className="space-y-1">
            <div className="flex items-center justify-between text-[10px] font-mono text-zinc-400">
              <span className="flex items-center gap-1">
                <Radio size={10} className="text-emerald-400" />
                OFFSET
              </span>
              <span className="text-emerald-400">+{timingOffsetMs}ms</span>
            </div>
            <select
              value={timingOffsetMs}
              onChange={(e) => onTimingOffsetChange(parseInt(e.target.value, 10))}
              disabled={!enabled || isMuted}
              className="w-full bg-[#121a22] border border-white/10 rounded px-1.5 py-0.5 text-[10px] font-mono text-zinc-200 focus:outline-none focus:border-emerald-500"
            >
              <option value={0}>0 ms (Sync)</option>
              <option value={150}>+150 ms</option>
              <option value={350}>+350 ms (Default)</option>
              <option value={500}>+500 ms</option>
              <option value={700}>+700 ms</option>
              <option value={1000}>+1000 ms</option>
            </select>
          </div>
        )}
      </div>
    </div>
  );
};
