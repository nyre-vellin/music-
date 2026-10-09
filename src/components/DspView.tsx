import React, { useRef, useEffect } from 'react';
import { Visualizer } from './Visualizer';
import { EQ_BANDS, DEFAULT_EQ_PRESETS } from '../utils/equalizerConfig';
import { VisualizerMode, EqPreset } from '../types/audio';
import { Sliders, RotateCcw, Activity } from 'lucide-react';

interface DspViewProps {
  isPlaying: boolean;
  visualizerMode: VisualizerMode;
  onSelectVisualizerMode: (mode: VisualizerMode) => void;
  currentPreamp: number;
  currentGains: number[];
  isEqEnabled: boolean;
  selectedPresetName: string;
  pan: number;
  playbackRate: number;
  onPreampChange: (val: number) => void;
  onGainChange: (index: number, val: number) => void;
  onSelectPreset: (preset: EqPreset) => void;
  onToggleEq: (enabled: boolean) => void;
  onPanChange: (val: number) => void;
  onPlaybackRateChange: (rate: number) => void;
  onReset: () => void;
}

export const DspView: React.FC<DspViewProps> = ({
  isPlaying,
  visualizerMode,
  onSelectVisualizerMode,
  currentPreamp,
  currentGains,
  isEqEnabled,
  selectedPresetName,
  pan,
  playbackRate,
  onPreampChange,
  onGainChange,
  onSelectPreset,
  onToggleEq,
  onPanChange,
  onPlaybackRateChange,
  onReset,
}) => {
  const curveCanvasRef = useRef<HTMLCanvasElement | null>(null);

  // Draw Spline Curve
  useEffect(() => {
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

    const midY = h / 2;

    // Grid lines
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.08)';
    ctx.lineWidth = 1 * dpr;
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

    const points: { x: number; y: number }[] = [];
    const step = w / (EQ_BANDS.length + 1);

    EQ_BANDS.forEach((_, idx) => {
      const gain = isEqEnabled ? currentGains[idx] || 0 : 0;
      const x = (idx + 1) * step;
      const y = midY - (gain / 12) * (h * 0.4);
      points.push({ x, y });
    });

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

      points.forEach((p) => {
        ctx.fillStyle = '#ffffff';
        ctx.beginPath();
        ctx.arc(p.x, p.y, 2.5 * dpr, 0, Math.PI * 2);
        ctx.fill();
      });
    }
  }, [currentGains, isEqEnabled]);

  return (
    <div className="space-y-6">
      {/* Visualizer Card */}
      <div className="bg-[#232629] border border-white/5 rounded-2xl p-6 shadow-sm">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-4">
          <div>
            <h2 className="text-base font-bold text-white tracking-tight flex items-center gap-2">
              <Activity className="w-4 h-4 text-[#3daee9]" />
              <span>Real-Time Acoustic Visualizer & Phase Scope</span>
            </h2>
            <div className="text-xs text-neutral-400 mt-0.5">
              KDE Plasma 6 Audio Architecture · 6 High-Precision Modes
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-1 p-1 bg-[#1b1e20] rounded-xl border border-white/5">
            {(
              [
                'bars',
                'wave',
                'radial',
                'vu',
                'spectrogram',
                'goniometer',
              ] as VisualizerMode[]
            ).map((m) => (
              <button
                key={m}
                onClick={() => onSelectVisualizerMode(m)}
                className={`px-3 py-1.5 text-xs font-mono capitalize rounded-lg transition-colors ${
                  visualizerMode === m
                    ? 'bg-[#3daee9] text-white shadow-sm'
                    : 'text-neutral-400 hover:text-white'
                }`}
              >
                {m}
              </button>
            ))}
          </div>
        </div>

        <Visualizer mode={visualizerMode} isPlaying={isPlaying} className="w-full h-64" />
      </div>

      {/* 15-Band Studio Equalizer Card */}
      <div className="bg-[#232629] border border-white/5 rounded-2xl p-6 shadow-sm space-y-6">
        <div className="flex items-center justify-between border-b border-white/5 pb-4">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-xl bg-[#3daee9]/15 text-[#3daee9] flex items-center justify-center">
              <Sliders className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-sm font-semibold text-white">
                15-Band Studio Graphic Equalizer
              </h3>
              <div className="text-xs text-neutral-400">
                Independent Q-factor IIR Biquad Filters
              </div>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={onReset}
              className="flex items-center gap-1.5 px-3 py-1.5 text-xs text-neutral-400 hover:text-white rounded-lg transition-colors border border-white/5"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              <span>Reset</span>
            </button>
            <button
              onClick={() => onToggleEq(!isEqEnabled)}
              className={`px-3 py-1.5 text-xs font-medium rounded-lg transition-colors ${
                isEqEnabled
                  ? 'bg-[#3daee9] text-white'
                  : 'bg-neutral-800 text-neutral-400'
              }`}
            >
              {isEqEnabled ? 'EQ Enabled' : 'Bypassed'}
            </button>
          </div>
        </div>

        {/* Real-time Frequency Response Spline Preview */}
        <div className="p-4 bg-[#1b1e20] rounded-xl border border-white/5">
          <div className="flex items-center justify-between mb-2">
            <span className="text-[11px] font-semibold text-neutral-400 uppercase tracking-wider">
              Acoustic Response Curve
            </span>
            <span className="text-[10px] font-mono text-[#3daee9]">
              {selectedPresetName}
            </span>
          </div>
          <div className="h-20 w-full rounded-lg bg-[#181a1c] border border-white/5 overflow-hidden">
            <canvas ref={curveCanvasRef} className="w-full h-full block" />
          </div>
        </div>

        {/* Presets Strip */}
        <div className="flex items-center gap-2 overflow-x-auto pb-1">
          {DEFAULT_EQ_PRESETS.map((preset) => {
            const isActive = selectedPresetName === preset.name;
            return (
              <button
                key={preset.name}
                onClick={() => onSelectPreset(preset)}
                className={`px-3 py-1.5 rounded-lg text-xs whitespace-nowrap transition-colors ${
                  isActive
                    ? 'bg-[#3daee9]/20 border border-[#3daee9] text-white font-medium'
                    : 'bg-[#1b1e20] border border-white/5 text-neutral-400 hover:text-white'
                }`}
              >
                {preset.name}
              </button>
            );
          })}
        </div>

        {/* 15 Band Frequencies Sliders */}
        <div className="grid grid-cols-16 gap-1 items-end bg-[#181a1c] p-4 rounded-xl border border-white/5 overflow-x-auto">
          {/* Preamp */}
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
            <span className="text-[10px] font-semibold text-neutral-300">Preamp</span>
          </div>

          {/* 15 Bands */}
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

        {/* Stereo Panner & Playback Rate */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2">
          <div className="p-4 bg-[#1b1e20] rounded-xl border border-white/5 space-y-2">
            <div className="flex items-center justify-between text-xs">
              <span className="text-neutral-400">KDE Stereo Balance</span>
              <span className="font-mono text-neutral-300">
                {pan === 0
                  ? 'Center (0.0)'
                  : pan < 0
                  ? `Left ${(Math.abs(pan) * 100).toFixed(0)}%`
                  : `Right ${(pan * 100).toFixed(0)}%`}
              </span>
            </div>
            <input
              type="range"
              min="-1"
              max="1"
              step="0.05"
              value={pan}
              onChange={(e) => onPanChange(parseFloat(e.target.value))}
              className="w-full cursor-pointer"
            />
          </div>

          <div className="p-4 bg-[#1b1e20] rounded-xl border border-white/5 space-y-2">
            <div className="flex items-center justify-between text-xs">
              <span className="text-neutral-400">Playback Pitch & Speed</span>
              <span className="font-mono text-neutral-300">{playbackRate.toFixed(2)}x</span>
            </div>
            <input
              type="range"
              min="0.5"
              max="2.0"
              step="0.05"
              value={playbackRate}
              onChange={(e) => onPlaybackRateChange(parseFloat(e.target.value))}
              className="w-full cursor-pointer"
            />
          </div>
        </div>
      </div>
    </div>
  );
};
