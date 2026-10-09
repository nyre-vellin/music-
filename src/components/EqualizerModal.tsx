import React, { useRef, useEffect } from 'react';
import { EQ_BANDS, DEFAULT_EQ_PRESETS } from '../utils/equalizerConfig';
import { EqPreset } from '../types/audio';
import { Sliders, RotateCcw, X, Check, Volume2 } from 'lucide-react';

interface EqualizerModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentPreamp: number;
  currentGains: number[];
  isEqEnabled: boolean;
  selectedPresetName: string;
  onPreampChange: (val: number) => void;
  onGainChange: (index: number, val: number) => void;
  onSelectPreset: (preset: EqPreset) => void;
  onToggleEq: (enabled: boolean) => void;
  onReset: () => void;
}

export const EqualizerModal: React.FC<EqualizerModalProps> = ({
  isOpen,
  onClose,
  currentPreamp,
  currentGains,
  isEqEnabled,
  selectedPresetName,
  onPreampChange,
  onGainChange,
  onSelectPreset,
  onToggleEq,
  onReset,
}) => {
  const curveCanvasRef = useRef<HTMLCanvasElement | null>(null);

  // Draw Spline Frequency Response Curve
  useEffect(() => {
    if (!isOpen) return;
    const canvas = curveCanvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const dpr = window.devicePixelRatio || 1;
    const rect = canvas.getBoundingClientRect();
    canvas.width = rect.width * dpr;
    canvas.height = rect.height * dpr;

    const w = canvas.width;
    const h = canvas.height;
    ctx.clearRect(0, 0, w, h);

    // Grid lines for 0dB, +6dB, -6dB, +12dB, -12dB
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.08)';
    ctx.lineWidth = 1 * dpr;
    const midY = h / 2;

    [-12, -6, 0, 6, 12].forEach((db) => {
      const y = midY - (db / 12) * (h * 0.4);
      ctx.beginPath();
      ctx.moveTo(0, y);
      ctx.lineTo(w, y);
      ctx.stroke();

      ctx.fillStyle = db === 0 ? 'rgba(255, 255, 255, 0.4)' : 'rgba(255, 255, 255, 0.2)';
      ctx.font = `${9 * dpr}px JetBrains Mono, monospace`;
      ctx.fillText(`${db > 0 ? '+' : ''}${db}dB`, 6 * dpr, y - 2 * dpr);
    });

    // Spline curve through EQ points
    const points: { x: number; y: number }[] = [];
    const step = w / (EQ_BANDS.length + 1);

    EQ_BANDS.forEach((_, idx) => {
      const gain = isEqEnabled ? currentGains[idx] || 0 : 0;
      const x = (idx + 1) * step;
      const y = midY - (gain / 12) * (h * 0.4);
      points.push({ x, y });
    });

    // Draw curve
    if (points.length > 0) {
      ctx.beginPath();
      ctx.moveTo(0, points[0].y);
      ctx.lineTo(points[0].x, points[0].y);

      for (let i = 0; i < points.length - 1; i++) {
        const xc = (points[i].x + points[i + 1].x) / 2;
        const yc = (points[i].y + points[i + 1].y) / 2;
        ctx.quadraticCurveTo(points[i].x, points[i].y, xc, yc);
      }
      ctx.lineTo(points[points.length - 1].x, points[points.length - 1].y);
      ctx.lineTo(w, points[points.length - 1].y);

      // Gradient stroke
      const grad = ctx.createLinearGradient(0, 0, w, 0);
      grad.addColorStop(0, '#2980b9');
      grad.addColorStop(0.5, '#3daee9');
      grad.addColorStop(1, '#27ae60');

      ctx.strokeStyle = grad;
      ctx.lineWidth = 2.5 * dpr;
      ctx.shadowColor = '#3daee9';
      ctx.shadowBlur = 8 * dpr;
      ctx.stroke();
      ctx.shadowBlur = 0;

      // Draw dots at band centers
      points.forEach((p) => {
        ctx.fillStyle = '#ffffff';
        ctx.beginPath();
        ctx.arc(p.x, p.y, 2.5 * dpr, 0, Math.PI * 2);
        ctx.fill();
      });
    }
  }, [isOpen, currentGains, isEqEnabled]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md">
      <div className="w-full max-w-4xl bg-[#232629] border border-white/10 rounded-2xl shadow-2xl overflow-hidden flex flex-col text-[#eff0f1]">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-white/5 bg-[#1b1e20]">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-[#3daee9]/15 text-[#3daee9] flex items-center justify-center shadow-inner">
              <Sliders className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-semibold text-white tracking-tight">
                15-Band Studio Equalizer
              </h2>
              <div className="flex items-center gap-2 text-xs text-neutral-400 mt-0.5">
                <span>KDE Plasma 6 Audio Architecture</span>
                <span aria-hidden="true">·</span>
                <span>BiquadFilter DSP</span>
                <span aria-hidden="true">·</span>
                <span className="font-mono text-[#3daee9]">Bit-Transparent</span>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={() => onToggleEq(!isEqEnabled)}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${
                isEqEnabled
                  ? 'bg-[#3daee9] text-white hover:bg-[#2980b9]'
                  : 'bg-neutral-800 text-neutral-400 hover:text-white'
              }`}
            >
              {isEqEnabled ? 'EQ Enabled' : 'Bypassed'}
            </button>
            <button
              onClick={onClose}
              className="p-1.5 text-neutral-400 hover:text-white hover:bg-neutral-800 rounded-lg transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Real-time Frequency Response Spline Curve */}
        <div className="px-6 pt-4 pb-2 bg-[#1b1e20]/60 border-b border-white/5">
          <div className="flex items-center justify-between mb-2">
            <span className="text-[11px] font-semibold text-neutral-400 uppercase tracking-wider">
              Acoustic Frequency Response
            </span>
            <span className="text-[10px] font-mono text-[#3daee9]">
              {selectedPresetName}
            </span>
          </div>
          <div className="relative h-20 w-full rounded-xl bg-[#181a1c] border border-white/5 overflow-hidden">
            <canvas ref={curveCanvasRef} className="w-full h-full block" />
          </div>
        </div>

        {/* Preset Selector */}
        <div className="p-6 pb-2 border-b border-white/5">
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs font-semibold text-neutral-400 uppercase tracking-wider">
              Plasma Audiophile Presets
            </span>
            <button
              onClick={onReset}
              className="flex items-center gap-1.5 text-xs text-neutral-400 hover:text-white transition-colors"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              <span>Reset Flat</span>
            </button>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-2">
            {DEFAULT_EQ_PRESETS.map((preset) => {
              const isActive = selectedPresetName === preset.name;
              return (
                <button
                  key={preset.name}
                  onClick={() => onSelectPreset(preset)}
                  className={`text-left px-3 py-2 rounded-xl text-xs transition-all ${
                    isActive
                      ? 'bg-[#3daee9]/20 border border-[#3daee9] text-white'
                      : 'bg-[#1b1e20] border border-white/5 text-neutral-300 hover:bg-[#2a2e32]'
                  }`}
                >
                  <div className="flex items-center justify-between font-medium">
                    <span className="truncate">{preset.name}</span>
                    {isActive && <Check className="w-3.5 h-3.5 text-[#3daee9] shrink-0" />}
                  </div>
                  <div className="text-[10px] text-neutral-400 truncate mt-0.5">
                    {preset.description}
                  </div>
                </button>
              );
            })}
          </div>
        </div>

        {/* 15 Frequencies + Preamp Sliders */}
        <div className="p-6">
          <div className="grid grid-cols-16 gap-1 items-end bg-[#181a1c] p-4 rounded-xl border border-white/5 overflow-x-auto">
            {/* Preamp Column */}
            <div className="flex flex-col items-center justify-between h-56 border-r border-white/10 pr-2">
              <span className="text-[10px] text-neutral-400 font-mono tabular-nums">
                {currentPreamp > 0 ? `+${currentPreamp.toFixed(1)}` : currentPreamp.toFixed(1)} dB
              </span>
              <div className="relative flex-1 flex items-center justify-center my-2">
                <input
                  type="range"
                  min="-12"
                  max="12"
                  step="0.5"
                  value={currentPreamp}
                  onChange={(e) => onPreampChange(parseFloat(e.target.value))}
                  disabled={!isEqEnabled}
                  className="h-36 -rotate-90 origin-center cursor-pointer w-36 disabled:opacity-40"
                />
              </div>
              <div className="flex flex-col items-center">
                <Volume2 className="w-3.5 h-3.5 text-neutral-400 mb-1" />
                <span className="text-[10px] font-semibold text-neutral-300">Preamp</span>
              </div>
            </div>

            {/* 15 Band Columns */}
            {EQ_BANDS.map((band, idx) => {
              const gain = currentGains[idx] || 0;
              return (
                <div key={band.label} className="flex flex-col items-center justify-between h-56">
                  <span
                    className={`text-[9px] font-mono tabular-nums ${
                      gain !== 0 ? 'text-[#3daee9] font-medium' : 'text-neutral-500'
                    }`}
                  >
                    {gain > 0 ? `+${gain.toFixed(1)}` : gain.toFixed(1)}
                  </span>

                  <div className="relative flex-1 flex items-center justify-center my-2">
                    <input
                      type="range"
                      min="-12"
                      max="12"
                      step="0.5"
                      value={gain}
                      onChange={(e) => onGainChange(idx, parseFloat(e.target.value))}
                      disabled={!isEqEnabled}
                      className="h-36 -rotate-90 origin-center cursor-pointer w-36 disabled:opacity-40"
                    />
                  </div>

                  <span className="text-[10px] font-mono text-neutral-300 mt-1 whitespace-nowrap">
                    {band.label}
                  </span>
                </div>
              );
            })}
          </div>

          <div className="flex items-center justify-between mt-4 text-xs text-neutral-400 font-mono">
            <span>Range: ±12.0 dB</span>
            <span>Zero phase distortion · 64-bit float IIR DSP</span>
          </div>
        </div>
      </div>
    </div>
  );
};
