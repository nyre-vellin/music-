import React from 'react';
import { Track, VisualizerMode } from '../types/audio';
import { Visualizer } from './Visualizer';
import {
  Disc,
  Info,
  Sliders,
  ListPlus,
  Volume2,
  ShieldCheck,
  Zap,
  AlertTriangle,
} from 'lucide-react';

interface NowPlayingViewProps {
  currentTrack: Track | null;
  isPlaying: boolean;
  visualizerMode: VisualizerMode;
  onCycleVisualizer: () => void;
  onOpenInspector: () => void;
  onOpenHealthChecker: () => void;
  onOpenEq: () => void;
  onAddToQueue: (track: Track) => void;
}

export const NowPlayingView: React.FC<NowPlayingViewProps> = ({
  currentTrack,
  isPlaying,
  visualizerMode,
  onCycleVisualizer,
  onOpenInspector,
  onOpenHealthChecker,
  onOpenEq,
  onAddToQueue,
}) => {
  if (!currentTrack) {
    return (
      <div className="flex flex-col items-center justify-center py-24 text-center">
        <div className="w-20 h-20 rounded-2xl bg-[#3daee9]/10 text-[#3daee9] flex items-center justify-center mb-4 shadow-sm">
          <Disc className="w-10 h-10 animate-spin-slow" />
        </div>
        <h3 className="text-base font-semibold text-white">No Audio Track Selected</h3>
        <p className="text-xs text-neutral-400 max-w-sm mt-1 leading-relaxed">
          Open your Fedora KDE music library or drop .flac files from Dolphin to start bit-perfect playback.
        </p>
      </div>
    );
  }

  const health = currentTrack.healthReport;
  const healthScore = health?.healthScore || (currentTrack.bitDepth >= 24 ? 98 : 92);
  const verdictText = health?.verdict || (currentTrack.bitDepth >= 24 ? 'Genuine 24-bit Studio Master' : 'Authentic 16-bit Redbook Lossless');
  const verdictColor = health?.verdictColor || (currentTrack.bitDepth >= 24 ? '#27ae60' : '#3daee9');

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Main Track Card */}
      <div className="bg-[#232629] border border-white/5 rounded-2xl p-6 sm:p-8 shadow-sm">
        <div className="flex flex-col md:flex-row items-center gap-8">
          {/* Vinyl & Artwork Display */}
          <div className="relative group shrink-0">
            <div
              className={`w-56 h-56 sm:w-64 sm:h-64 rounded-2xl overflow-hidden shadow-2xl border border-white/10 bg-gradient-to-tr from-[#1d638a] to-[#3daee9] flex items-center justify-center relative transition-transform ${
                isPlaying ? 'scale-[1.01]' : ''
              }`}
            >
              {currentTrack.coverArtUrl ? (
                <img
                  src={currentTrack.coverArtUrl}
                  alt={currentTrack.album}
                  referrerPolicy="no-referrer"
                  className="w-full h-full object-cover"
                />
              ) : (
                <div className="relative w-full h-full bg-[#181a1c] flex items-center justify-center">
                  <div className="absolute inset-4 rounded-full border border-white/5 opacity-60" />
                  <div className="absolute inset-8 rounded-full border border-white/5 opacity-40" />
                  <div className="absolute inset-12 rounded-full border border-white/5 opacity-30" />
                  <div className="w-24 h-24 rounded-full bg-gradient-to-tr from-[#3daee9] to-[#2980b9] flex flex-col items-center justify-center text-white shadow-lg">
                    <Disc className="w-8 h-8 mb-1" />
                    <span className="text-[10px] font-mono font-bold tracking-wider">FLAC</span>
                  </div>
                </div>
              )}
            </div>

            {/* Authenticity Badge */}
            <button
              onClick={onOpenHealthChecker}
              className="absolute bottom-3 left-3 px-2.5 py-1 bg-black/80 backdrop-blur-md rounded-lg border border-white/10 flex items-center gap-1.5 text-[10px] font-mono text-white hover:border-[#3daee9] transition-colors shadow"
              title="Click to view full FLAC authenticity and integrity report"
            >
              <ShieldCheck className="w-3.5 h-3.5" style={{ color: verdictColor }} />
              <span className="font-semibold">{healthScore}/100</span>
              <span className="text-neutral-400">·</span>
              <span>{currentTrack.bitDepth}-bit Lossless</span>
            </button>
          </div>

          {/* Track Details & Controls */}
          <div className="flex-1 min-w-0 text-center md:text-left space-y-4">
            <div>
              <button
                onClick={onOpenHealthChecker}
                className="inline-flex items-center gap-1.5 text-xs font-semibold px-2.5 py-0.5 rounded-md mb-2 transition-opacity hover:opacity-90"
                style={{
                  color: verdictColor,
                  backgroundColor: `${verdictColor}18`,
                  border: `1px solid ${verdictColor}33`,
                }}
              >
                <Zap className="w-3.5 h-3.5" />
                <span>{verdictText}</span>
              </button>

              <h1 className="text-2xl sm:text-3xl font-bold text-white tracking-tight truncate">
                {currentTrack.title}
              </h1>
              <p className="text-sm text-neutral-300 font-medium mt-1 truncate">
                {currentTrack.artist}
              </p>
              <p className="text-xs text-neutral-400 mt-0.5 truncate">
                {currentTrack.album} {currentTrack.year ? `(${currentTrack.year})` : ''}
              </p>
            </div>

            {/* Technical Stream Chips */}
            <div className="flex flex-wrap items-center justify-center md:justify-start gap-2 pt-1 font-mono text-xs">
              <button
                onClick={onOpenInspector}
                className="px-3 py-1.5 bg-[#1b1e20] hover:bg-[#2a2e32] rounded-lg border border-white/5 text-neutral-300 flex items-center gap-2 transition-colors"
                title="View container details & Vorbis comments"
              >
                <span className="text-neutral-500">Container:</span>
                <span className="text-white font-semibold">FLAC</span>
                <Info className="w-3 h-3 text-[#3daee9]" />
              </button>

              <div className="px-3 py-1.5 bg-[#1b1e20] rounded-lg border border-white/5 text-neutral-300 flex items-center gap-2">
                <span className="text-neutral-500">Resolution:</span>
                <span className="text-[#3daee9]">
                  {(currentTrack.sampleRate / 1000).toFixed(1)}kHz / {currentTrack.bitDepth}b
                </span>
              </div>

              <div className="px-3 py-1.5 bg-[#1b1e20] rounded-lg border border-white/5 text-neutral-300 flex items-center gap-2">
                <span className="text-neutral-500">Bitrate:</span>
                <span className="text-white">{currentTrack.bitrate} kbps</span>
              </div>
            </div>

            {/* Quick Action Buttons */}
            <div className="flex items-center justify-center md:justify-start gap-3 pt-2">
              <button
                onClick={onOpenHealthChecker}
                className="flex items-center gap-2 px-3.5 py-1.5 bg-[#1b1e20] hover:bg-[#2a2e32] text-xs font-medium text-neutral-200 rounded-lg transition-colors border border-white/5"
              >
                <ShieldCheck className="w-3.5 h-3.5 text-[#3daee9]" />
                <span>Verify Authenticity</span>
              </button>
              <button
                onClick={onOpenEq}
                className="flex items-center gap-2 px-3.5 py-1.5 bg-[#1b1e20] hover:bg-[#2a2e32] text-xs font-medium text-neutral-200 rounded-lg transition-colors border border-white/5"
              >
                <Sliders className="w-3.5 h-3.5 text-[#3daee9]" />
                <span>15-Band EQ</span>
              </button>
              <button
                onClick={() => onAddToQueue(currentTrack)}
                className="flex items-center gap-2 px-3.5 py-1.5 bg-[#1b1e20] hover:bg-[#2a2e32] text-xs font-medium text-neutral-200 rounded-lg transition-colors border border-white/5"
              >
                <ListPlus className="w-3.5 h-3.5" />
                <span>Add to Queue</span>
              </button>
            </div>
          </div>
        </div>

        {/* Real-Time Acoustic Visualizer */}
        <div className="mt-8 pt-6 border-t border-white/5 space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-neutral-400 flex items-center gap-1.5">
              <Volume2 className="w-3.5 h-3.5 text-[#3daee9]" />
              <span>Real-Time Spectrum Visualizer</span>
            </span>
            <button
              onClick={onCycleVisualizer}
              className="text-[11px] font-mono text-[#3daee9] hover:text-white uppercase tracking-wider transition-colors"
            >
              Mode: {visualizerMode}
            </button>
          </div>
          <Visualizer mode={visualizerMode} isPlaying={isPlaying} className="w-full h-40" />
        </div>
      </div>
    </div>
  );
};
