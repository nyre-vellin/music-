import React, { useEffect, useRef } from 'react';
import { VisualizerMode } from '../types/audio';
import { audioEngine } from '../services/audioEngine';

interface VisualizerProps {
  mode: VisualizerMode;
  isPlaying: boolean;
  className?: string;
}

export const Visualizer: React.FC<VisualizerProps> = ({ mode, isPlaying, className = '' }) => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const animFrameRef = useRef<number | null>(null);
  const peakHoldRef = useRef<number[]>([]);
  const spectrogramHistoryRef = useRef<Uint8Array[]>([]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let dpr = window.devicePixelRatio || 1;
    const resizeCanvas = () => {
      const rect = canvas.getBoundingClientRect();
      canvas.width = rect.width * dpr;
      canvas.height = rect.height * dpr;
    };
    resizeCanvas();
    window.addEventListener('resize', resizeCanvas);

    const analyser = audioEngine.getAnalyserNode();
    const bufferLength = analyser ? analyser.frequencyBinCount : 256;
    const freqData = new Uint8Array(bufferLength);
    const timeData = new Uint8Array(bufferLength);
    const leftTimeData = new Uint8Array(128);
    const rightTimeData = new Uint8Array(128);

    if (peakHoldRef.current.length !== bufferLength) {
      peakHoldRef.current = new Array(bufferLength).fill(0);
    }

    const render = () => {
      animFrameRef.current = requestAnimationFrame(render);

      const w = canvas.width;
      const h = canvas.height;
      ctx.clearRect(0, 0, w, h);

      if (!isPlaying) {
        // Idle KDE Plasma subtle ambient pulse
        ctx.strokeStyle = 'rgba(61, 174, 233, 0.3)';
        ctx.lineWidth = 1.5 * dpr;
        ctx.beginPath();
        const midY = h / 2;
        ctx.moveTo(0, midY);
        for (let x = 0; x < w; x += 8) {
          const y = midY + Math.sin(x * 0.015 + Date.now() * 0.0015) * (3 * dpr);
          ctx.lineTo(x, y);
        }
        ctx.stroke();

        // Subtle center label
        ctx.fillStyle = 'rgba(255, 255, 255, 0.25)';
        ctx.font = `${10 * dpr}px JetBrains Mono, monospace`;
        ctx.textAlign = 'center';
        ctx.fillText('KDE BREEZE DSP · STANDBY', w / 2, midY + 22 * dpr);
        return;
      }

      audioEngine.getFrequencyData(freqData);
      audioEngine.getTimeDomainData(timeData);
      audioEngine.getStereoTimeData(leftTimeData, rightTimeData);

      // MODE 1: BARS (Plasma Aurora Spectrum)
      if (mode === 'bars') {
        const barCount = 64;
        const step = Math.floor(bufferLength / barCount);
        const barWidth = w / barCount - 1.5 * dpr;

        for (let i = 0; i < barCount; i++) {
          let sum = 0;
          for (let j = 0; j < step; j++) {
            sum += freqData[i * step + j] || 0;
          }
          const val = sum / step;
          const percent = val / 255;
          const barHeight = Math.max(3 * dpr, percent * h * 0.92);

          if (percent > (peakHoldRef.current[i] || 0)) {
            peakHoldRef.current[i] = percent;
          } else {
            peakHoldRef.current[i] = Math.max(0, (peakHoldRef.current[i] || 0) - 0.007);
          }

          const x = i * (barWidth + 1.5 * dpr);
          const y = h - barHeight;

          // KDE Breeze palette gradient: #2980b9 -> #3daee9 -> #27ae60 -> #2ecc71
          const gradient = ctx.createLinearGradient(0, h, 0, y);
          gradient.addColorStop(0, '#1d638a');
          gradient.addColorStop(0.4, '#3daee9');
          gradient.addColorStop(0.85, '#27ae60');
          gradient.addColorStop(1, '#2ecc71');

          ctx.fillStyle = gradient;
          ctx.fillRect(x, y, barWidth, barHeight);

          // Peak dot
          const peakY = h - peakHoldRef.current[i] * h * 0.92 - 2 * dpr;
          ctx.fillStyle = '#ffffff';
          ctx.fillRect(x, peakY, barWidth, 1.8 * dpr);
        }
      }

      // MODE 2: WAVE (Oscilloscope Vector Scope)
      else if (mode === 'wave') {
        ctx.lineWidth = 2.2 * dpr;
        ctx.strokeStyle = '#3daee9';
        ctx.shadowColor = '#3daee9';
        ctx.shadowBlur = 10 * dpr;

        ctx.beginPath();
        const sliceWidth = w / bufferLength;
        let x = 0;

        for (let i = 0; i < bufferLength; i++) {
          const v = timeData[i] / 128.0;
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

        // Subtle center graticule line
        ctx.strokeStyle = 'rgba(255, 255, 255, 0.08)';
        ctx.lineWidth = 1 * dpr;
        ctx.beginPath();
        ctx.moveTo(0, h / 2);
        ctx.lineTo(w, h / 2);
        ctx.stroke();
      }

      // MODE 3: RADIAL (Plasma Circular Vortex)
      else if (mode === 'radial') {
        const centerX = w / 2;
        const centerY = h / 2;
        const baseRadius = Math.min(centerX, centerY) * 0.38;
        const barCount = 72;

        ctx.save();
        ctx.translate(centerX, centerY);

        // Core Hub
        ctx.fillStyle = '#232629';
        ctx.beginPath();
        ctx.arc(0, 0, baseRadius - 6 * dpr, 0, Math.PI * 2);
        ctx.fill();
        ctx.strokeStyle = '#3daee9';
        ctx.lineWidth = 2 * dpr;
        ctx.stroke();

        // Inner glowing ring
        ctx.fillStyle = '#3daee9';
        ctx.font = `${10 * dpr}px JetBrains Mono, monospace`;
        ctx.textAlign = 'center';
        ctx.fillText('PLASMA', 0, 4 * dpr);

        for (let i = 0; i < barCount; i++) {
          const rad = (i / barCount) * Math.PI * 2;
          const dataIdx = Math.floor((i / barCount) * (bufferLength / 2));
          const val = freqData[dataIdx] / 255;
          const length = val * (Math.min(centerX, centerY) * 0.58);

          const x1 = Math.cos(rad) * baseRadius;
          const y1 = Math.sin(rad) * baseRadius;
          const x2 = Math.cos(rad) * (baseRadius + length);
          const y2 = Math.sin(rad) * (baseRadius + length);

          ctx.strokeStyle = `hsl(${195 + val * 45}, 85%, ${55 + val * 25}%)`;
          ctx.lineWidth = 2.5 * dpr;
          ctx.beginPath();
          ctx.moveTo(x1, y1);
          ctx.lineTo(x2, y2);
          ctx.stroke();
        }

        ctx.restore();
      }

      // MODE 4: VU (Calibrated Stereo L/R Meters)
      else if (mode === 'vu') {
        let sumL = 0;
        let sumR = 0;
        for (let i = 0; i < leftTimeData.length; i++) {
          const sampleL = (leftTimeData[i] - 128) / 128;
          const sampleR = (rightTimeData[i] - 128) / 128;
          sumL += sampleL * sampleL;
          sumR += sampleR * sampleR;
        }

        const rmsL = Math.min(1, Math.sqrt(sumL / leftTimeData.length) * 2.2);
        const rmsR = Math.min(1, Math.sqrt(sumR / rightTimeData.length) * 2.2);

        const meterHeight = 18 * dpr;
        const spacing = 14 * dpr;
        const meterW = w - 70 * dpr;
        const startX = 40 * dpr;
        const startY = h / 2 - meterHeight - spacing / 2;

        const drawVuChannel = (y: number, val: number, label: string) => {
          ctx.fillStyle = '#8998a8';
          ctx.font = `${11 * dpr}px JetBrains Mono, monospace`;
          ctx.textAlign = 'left';
          ctx.fillText(label, 12 * dpr, y + meterHeight * 0.72);

          // Track bg
          ctx.fillStyle = '#1b1e20';
          ctx.fillRect(startX, y, meterW, meterHeight);

          // Level fill
          const fillW = val * meterW;
          const grad = ctx.createLinearGradient(startX, 0, startX + meterW, 0);
          grad.addColorStop(0, '#27ae60');
          grad.addColorStop(0.75, '#3daee9');
          grad.addColorStop(0.9, '#f67400');
          grad.addColorStop(0.98, '#da4453');

          ctx.fillStyle = grad;
          ctx.fillRect(startX, y, fillW, meterHeight);

          // dB markers (-48, -24, -12, -6, -3, 0 dB)
          const dbSteps = [
            { label: '-48', pos: 0.1 },
            { label: '-24', pos: 0.35 },
            { label: '-12', pos: 0.6 },
            { label: '-6', pos: 0.8 },
            { label: '0', pos: 0.98 },
          ];

          ctx.strokeStyle = 'rgba(0, 0, 0, 0.4)';
          ctx.lineWidth = 1 * dpr;
          ctx.fillStyle = '#657b83';
          ctx.font = `${9 * dpr}px JetBrains Mono, monospace`;

          dbSteps.forEach((st) => {
            const markX = startX + st.pos * meterW;
            ctx.beginPath();
            ctx.moveTo(markX, y);
            ctx.lineTo(markX, y + meterHeight);
            ctx.stroke();
          });
        };

        drawVuChannel(startY, rmsL, 'CH 1 (L)');
        drawVuChannel(startY + meterHeight + spacing, rmsR, 'CH 2 (R)');
      }

      // MODE 5: SPECTROGRAM (Live Waterfall Heatmap)
      else if (mode === 'spectrogram') {
        // Shift history
        const row = new Uint8Array(bufferLength / 2);
        for (let i = 0; i < row.length; i++) {
          row[i] = freqData[i];
        }
        spectrogramHistoryRef.current.unshift(row);
        if (spectrogramHistoryRef.current.length > 70) {
          spectrogramHistoryRef.current.pop();
        }

        const history = spectrogramHistoryRef.current;
        const rowHeight = h / Math.max(1, history.length);

        for (let r = 0; r < history.length; r++) {
          const rData = history[r];
          const sliceW = w / rData.length;
          const y = r * rowHeight;

          for (let c = 0; c < rData.length; c++) {
            const v = rData[c] / 255;
            if (v < 0.05) continue;

            const hue = 210 - v * 120; // Blue to Cyan to Green
            const lightness = Math.min(85, v * 70);
            ctx.fillStyle = `hsl(${hue}, 90%, ${lightness}%)`;
            ctx.fillRect(c * sliceW, y, sliceW + 0.5, rowHeight + 0.5);
          }
        }

        // Overlay frequency lines (10kHz, 16kHz, 20kHz markers)
        ctx.strokeStyle = 'rgba(255, 255, 255, 0.2)';
        ctx.lineWidth = 1 * dpr;
        ctx.fillStyle = 'rgba(255, 255, 255, 0.5)';
        ctx.font = `${9 * dpr}px JetBrains Mono, monospace`;

        const mark16k = w * (16000 / 22050);
        if (mark16k < w) {
          ctx.beginPath();
          ctx.moveTo(mark16k, 0);
          ctx.lineTo(mark16k, h);
          ctx.stroke();
          ctx.fillText('16kHz (MP3 Cutoff)', mark16k - 95 * dpr, 14 * dpr);
        }

        const mark20k = w * (20000 / 22050);
        if (mark20k < w) {
          ctx.beginPath();
          ctx.moveTo(mark20k, 0);
          ctx.lineTo(mark20k, h);
          ctx.stroke();
          ctx.fillText('20kHz', mark20k - 35 * dpr, 14 * dpr);
        }
      }

      // MODE 6: GONIOMETER (Lissajous Stereo Phase Correlation)
      else if (mode === 'goniometer') {
        const cx = w / 2;
        const cy = h / 2;
        const radius = Math.min(cx, cy) * 0.85;

        // Graticule grid
        ctx.strokeStyle = 'rgba(255, 255, 255, 0.08)';
        ctx.lineWidth = 1 * dpr;
        ctx.beginPath();
        ctx.arc(cx, cy, radius, 0, Math.PI * 2);
        ctx.moveTo(cx - radius, cy);
        ctx.lineTo(cx + radius, cy);
        ctx.moveTo(cx, cy - radius);
        ctx.lineTo(cx, cy + radius);
        ctx.stroke();

        // 45 degree stereo diagonal
        ctx.beginPath();
        ctx.moveTo(cx - radius * 0.7, cy + radius * 0.7);
        ctx.lineTo(cx + radius * 0.7, cy - radius * 0.7);
        ctx.stroke();

        ctx.fillStyle = '#657b83';
        ctx.font = `${9 * dpr}px JetBrains Mono, monospace`;
        ctx.textAlign = 'center';
        ctx.fillText('+S (L)', cx - radius * 0.7, cy - radius * 0.7);
        ctx.fillText('+S (R)', cx + radius * 0.7, cy - radius * 0.7);
        ctx.fillText('M (Center)', cx, cy - radius - 4 * dpr);

        // Draw Lissajous trajectory
        ctx.strokeStyle = '#3daee9';
        ctx.lineWidth = 1.8 * dpr;
        ctx.shadowColor = '#3daee9';
        ctx.shadowBlur = 6 * dpr;
        ctx.beginPath();

        const count = Math.min(leftTimeData.length, rightTimeData.length);
        for (let i = 0; i < count; i++) {
          const l = (leftTimeData[i] - 128) / 128;
          const r = (rightTimeData[i] - 128) / 128;

          // Rotate 45 degrees: X = (L - R) / sqrt(2), Y = (L + R) / sqrt(2)
          const px = cx + ((l - r) * radius * 0.7);
          const py = cy - ((l + r) * radius * 0.7);

          if (i === 0) ctx.moveTo(px, py);
          else ctx.lineTo(px, py);
        }
        ctx.stroke();
        ctx.shadowBlur = 0;
      }
    };

    render();

    return () => {
      if (animFrameRef.current) {
        cancelAnimationFrame(animFrameRef.current);
      }
      window.removeEventListener('resize', resizeCanvas);
    };
  }, [mode, isPlaying]);

  return (
    <div className={`relative overflow-hidden rounded-xl bg-[#1b1e20]/80 border border-white/5 ${className}`}>
      <canvas ref={canvasRef} className="w-full h-full block" />
    </div>
  );
};
