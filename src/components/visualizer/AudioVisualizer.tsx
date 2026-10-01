import React, { useEffect, useRef } from 'react';
import { audioEngine } from '../../services/audioEngine';

interface AudioVisualizerProps {
  mode?: 'frequency' | 'oscilloscope';
  height?: number;
  className?: string;
  showPeakMeter?: boolean;
}

export const AudioVisualizer: React.FC<AudioVisualizerProps> = ({
  mode = 'frequency',
  height = 70,
  className = '',
  showPeakMeter = true,
}) => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const animFrameRef = useRef<number | null>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const render = () => {
      const { timeDomainData, frequencyData, currentPeakDb, isClipping } =
        audioEngine.getVisualizerData();

      const width = canvas.width;
      const h = canvas.height;

      ctx.clearRect(0, 0, width, h);

      // Background telemetry grid
      ctx.strokeStyle = 'rgba(16, 185, 129, 0.08)';
      ctx.lineWidth = 1;
      ctx.beginPath();
      // Horizontal grid lines
      ctx.moveTo(0, h * 0.25);
      ctx.lineTo(width, h * 0.25);
      ctx.moveTo(0, h * 0.5);
      ctx.lineTo(width, h * 0.5);
      ctx.moveTo(0, h * 0.75);
      ctx.lineTo(width, h * 0.75);
      ctx.stroke();

      if (mode === 'oscilloscope') {
        // Real-time oscilloscope wave
        ctx.beginPath();
        ctx.lineWidth = 2;
        ctx.strokeStyle = isClipping ? '#ef4444' : '#10b981';
        ctx.shadowColor = isClipping ? 'rgba(239, 68, 68, 0.8)' : 'rgba(16, 185, 129, 0.6)';
        ctx.shadowBlur = 8;

        const sliceWidth = width / timeDomainData.length;
        let x = 0;

        for (let i = 0; i < timeDomainData.length; i++) {
          const v = timeDomainData[i] / 128.0;
          const y = (v * h) / 2;

          if (i === 0) {
            ctx.moveTo(x, y);
          } else {
            ctx.lineTo(x, y);
          }
          x += sliceWidth;
        }

        ctx.stroke();
        ctx.shadowBlur = 0;
      } else {
        // Frequency bars
        const barWidth = Math.max(2, (width / 48) - 1.5);
        let x = 0;

        for (let i = 0; i < 48; i++) {
          // Take frequency bins
          const val = frequencyData[Math.floor(i * 1.5)] || 0;
          const barHeight = (val / 255) * (h - 10);

          const grad = ctx.createLinearGradient(0, h, 0, 0);
          if (isClipping && i > 38) {
            grad.addColorStop(0, '#ef4444');
            grad.addColorStop(1, '#f87171');
          } else {
            grad.addColorStop(0, '#064e3b');
            grad.addColorStop(0.6, '#10b981');
            grad.addColorStop(1, '#34d399');
          }

          ctx.fillStyle = grad;
          ctx.fillRect(x, h - barHeight, barWidth, barHeight);
          x += barWidth + 1.5;
        }
      }

      // Draw Peak Level text if enabled
      if (showPeakMeter) {
        ctx.font = '10px "JetBrains Mono", monospace';
        ctx.fillStyle = isClipping ? '#ef4444' : '#6ee7b7';
        const text = `${currentPeakDb > -48 ? currentPeakDb : '-∞'} dB ${
          isClipping ? '⚠ CLIP' : ''
        }`;
        ctx.fillText(text, width - 65, 14);
      }

      animFrameRef.current = requestAnimationFrame(render);
    };

    animFrameRef.current = requestAnimationFrame(render);

    return () => {
      if (animFrameRef.current) {
        cancelAnimationFrame(animFrameRef.current);
      }
    };
  }, [mode, showPeakMeter]);

  return (
    <div className={`relative overflow-hidden rounded-xl border border-emerald-500/20 bg-[#060a0d] p-1 ${className}`}>
      <canvas
        ref={canvasRef}
        width={360}
        height={height}
        className="w-full h-full block"
      />
    </div>
  );
};
