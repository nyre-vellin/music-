import React, { useState } from 'react';
import { Track, VisualizerMode, RepeatMode } from '../types/audio';
import {
  Play,
  Pause,
  SkipBack,
  SkipForward,
  Shuffle,
  Repeat,
  Repeat1,
  Volume2,
  VolumeX,
  Sliders,
  ListMusic,
  Activity,
  Keyboard,
  ShieldCheck,
  Info,
} from 'lucide-react';

interface PlayerControlsProps {
  currentTrack: Track | null;
  isPlaying: boolean;
  currentTime: number;
  duration: number;
  volume: number;
  isMuted: boolean;
  isShuffle: boolean;
  repeatMode: RepeatMode;
  visualizerMode: VisualizerMode;
  isEqEnabled: boolean;
  queueCount: number;
  onTogglePlay: () => void;
  onSeek: (seconds: number) => void;
  onNext: () => void;
  onPrevious: () => void;
  onToggleShuffle: () => void;
  onCycleRepeat: () => void;
  onVolumeChange: (vol: number) => void;
  onToggleMute: () => void;
  onOpenEq: () => void;
  onOpenInspector: () => void;
  onOpenHealthChecker: () => void;
  onToggleQueue: () => void;
  onCycleVisualizer: () => void;
  onOpenShortcuts: () => void;
}

function formatTime(secs: number): string {
  if (isNaN(secs) || secs < 0) return '00:00';
  const m = Math.floor(secs / 60);
  const s = Math.floor(secs % 60);
  return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
}

export const PlayerControls: React.FC<PlayerControlsProps> = ({
  currentTrack,
  isPlaying,
  currentTime,
  duration,
  volume,
  isMuted,
  isShuffle,
  repeatMode,
  visualizerMode,
  isEqEnabled,
  queueCount,
  onTogglePlay,
  onSeek,
  onNext,
  onPrevious,
  onToggleShuffle,
  onCycleRepeat,
  onVolumeChange,
  onToggleMute,
  onOpenEq,
  onOpenInspector,
  onOpenHealthChecker,
  onToggleQueue,
  onCycleVisualizer,
  onOpenShortcuts,
}) => {
  const [hoverSeekTime, setHoverSeekTime] = useState<number | null>(null);
  const [hoverPosition, setHoverPosition] = useState<number>(0);

  const progressPercent = duration > 0 ? (currentTime / duration) * 100 : 0;

  const handleSeekHover = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!duration) return;
    const rect = e.currentTarget.getBoundingClientRect();
    const ratio = Math.max(0, Math.min(1, (e.clientX - rect.left) / rect.width));
    setHoverSeekTime(ratio * duration);
    setHoverPosition(e.clientX - rect.left);
  };

  const handleSeekClick = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!duration) return;
    const rect = e.currentTarget.getBoundingClientRect();
    const ratio = Math.max(0, Math.min(1, (e.clientX - rect.left) / rect.width));
    onSeek(ratio * duration);
  };

  return (
    <div className="fixed bottom-0 left-0 right-0 z-40 bg-[#1b1e20] border-t border-white/5 select-none text-[#eff0f1]">
      {/* Top Scrubber Line */}
      <div
        className="group relative w-full h-2 cursor-pointer bg-white/5 hover:h-2.5 transition-all"
        onMouseMove={handleSeekHover}
        onMouseLeave={() => setHoverSeekTime(null)}
        onClick={handleSeekClick}
      >
        <div
          className="absolute top-0 bottom-0 left-0 bg-[#3daee9] group-hover:bg-[#5bc0f8] transition-all"
          style={{ width: `${progressPercent}%` }}
        />
        {hoverSeekTime !== null && (
          <div
            className="absolute -top-7 -translate-x-1/2 px-1.5 py-0.5 bg-[#232629] border border-white/10 rounded text-[10px] font-mono text-neutral-200 pointer-events-none shadow"
            style={{ left: `${hoverPosition}px` }}
          >
            {formatTime(hoverSeekTime)}
          </div>
        )}
      </div>

      <div className="flex items-center justify-between px-6 py-3 gap-6">
        {/* Left: Track Information */}
        <div className="flex items-center gap-3.5 min-w-0 w-1/4">
          <div className="relative w-12 h-12 rounded-xl bg-[#232629] border border-white/10 shrink-0 overflow-hidden flex items-center justify-center shadow-sm">
            {currentTrack?.coverArtUrl ? (
              <img
                src={currentTrack.coverArtUrl}
                alt={currentTrack.album}
                referrerPolicy="no-referrer"
                className="w-full h-full object-cover"
              />
            ) : (
              <div className="w-full h-full bg-gradient-to-tr from-[#1d638a] to-[#3daee9] flex items-center justify-center text-white text-xs font-bold font-mono">
                FLAC
              </div>
            )}
          </div>

          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-2">
              <span className="text-sm font-semibold text-white truncate">
                {currentTrack?.title || 'No audio loaded'}
              </span>
            </div>
            <div className="text-xs text-neutral-400 truncate mt-0.5">
              {currentTrack?.artist || 'Import FLAC files to begin'}
            </div>
            {currentTrack && (
              <div className="flex items-center gap-2 mt-0.5">
                <button
                  onClick={onOpenHealthChecker}
                  className="flex items-center gap-1 text-[10px] text-emerald-400 hover:text-white transition-colors font-mono tabular-nums"
                  title="Check FLAC file health & authenticity"
                >
                  <ShieldCheck className="w-3 h-3 shrink-0" />
                  <span>{currentTrack.bitDepth}-bit Lossless</span>
                </button>
                <span className="text-neutral-600 text-[10px]" aria-hidden="true">
                  ·
                </span>
                <button
                  onClick={onOpenInspector}
                  className="text-[10px] text-neutral-400 hover:text-[#3daee9] transition-colors font-mono"
                  title="Inspect Vorbis comments"
                >
                  {(currentTrack.sampleRate / 1000).toFixed(1)}k
                </button>
              </div>
            )}
          </div>
        </div>

        {/* Center: Playback Controls */}
        <div className="flex flex-col items-center gap-1.5 w-2/4 max-w-xl">
          <div className="flex items-center gap-5">
            <button
              onClick={onToggleShuffle}
              className={`p-1.5 rounded-lg transition-colors ${
                isShuffle ? 'text-[#3daee9]' : 'text-neutral-400 hover:text-white'
              }`}
              title="Shuffle"
            >
              <Shuffle className="w-4 h-4" />
            </button>

            <button
              onClick={onPrevious}
              className="p-1.5 text-neutral-300 hover:text-white transition-colors"
              title="Previous"
            >
              <SkipBack className="w-4 h-4" />
            </button>

            <button
              onClick={onTogglePlay}
              disabled={!currentTrack}
              className="w-10 h-10 rounded-xl bg-[#3daee9] hover:bg-[#2980b9] text-white flex items-center justify-center transition-transform active:scale-95 disabled:opacity-50 shadow-md"
              title={isPlaying ? 'Pause' : 'Play'}
            >
              {isPlaying ? (
                <Pause className="w-4 h-4 fill-white" />
              ) : (
                <Play className="w-4 h-4 fill-white translate-x-0.5" />
              )}
            </button>

            <button
              onClick={onNext}
              className="p-1.5 text-neutral-300 hover:text-white transition-colors"
              title="Next"
            >
              <SkipForward className="w-4 h-4" />
            </button>

            <button
              onClick={onCycleRepeat}
              className={`p-1.5 rounded-lg transition-colors ${
                repeatMode !== 'off' ? 'text-[#3daee9]' : 'text-neutral-400 hover:text-white'
              }`}
              title={`Repeat: ${repeatMode}`}
            >
              {repeatMode === 'one' ? (
                <Repeat1 className="w-4 h-4" />
              ) : (
                <Repeat className="w-4 h-4" />
              )}
            </button>
          </div>

          <div className="flex items-center gap-3 text-xs text-neutral-400 font-mono tabular-nums">
            <span>{formatTime(currentTime)}</span>
            <span className="text-neutral-600">/</span>
            <span>{formatTime(duration)}</span>
          </div>
        </div>

        {/* Right: Controls & Meters */}
        <div className="flex items-center justify-end gap-3 w-1/4">
          {/* Visualizer Mode Button */}
          <button
            onClick={onCycleVisualizer}
            className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs bg-[#232629] hover:bg-[#2e3236] text-neutral-300 hover:text-white border border-white/5 transition-colors"
            title={`Visualizer: ${visualizerMode}`}
          >
            <Activity className="w-3.5 h-3.5 text-[#3daee9]" />
            <span className="capitalize font-mono text-[11px]">{visualizerMode}</span>
          </button>

          {/* Equalizer Button */}
          <button
            onClick={onOpenEq}
            className={`p-2 rounded-lg transition-colors ${
              isEqEnabled
                ? 'bg-[#3daee9]/15 text-[#3daee9] hover:bg-[#3daee9]/25'
                : 'text-neutral-400 hover:text-white hover:bg-[#232629]'
            }`}
            title="15-Band Studio Equalizer"
          >
            <Sliders className="w-4 h-4" />
          </button>

          {/* Queue Button */}
          <button
            onClick={onToggleQueue}
            className="relative p-2 text-neutral-400 hover:text-white hover:bg-[#232629] rounded-lg transition-colors"
            title="Queue"
          >
            <ListMusic className="w-4 h-4" />
            {queueCount > 0 && (
              <span className="absolute top-1 right-1 w-2 h-2 rounded-full bg-[#3daee9]" />
            )}
          </button>

          {/* Shortcuts Info */}
          <button
            onClick={onOpenShortcuts}
            className="p-2 text-neutral-400 hover:text-white hover:bg-[#232629] rounded-lg transition-colors"
            title="KDE Plasma Keyboard Shortcuts"
          >
            <Keyboard className="w-4 h-4" />
          </button>

          {/* Volume Control */}
          <div className="flex items-center gap-2 pl-1 border-l border-white/5">
            <button
              onClick={onToggleMute}
              className="text-neutral-400 hover:text-white transition-colors"
              title={isMuted ? 'Unmute' : 'Mute'}
            >
              {isMuted || volume === 0 ? (
                <VolumeX className="w-4 h-4" />
              ) : (
                <Volume2 className="w-4 h-4" />
              )}
            </button>
            <input
              type="range"
              min="0"
              max="1"
              step="0.01"
              value={isMuted ? 0 : volume}
              onChange={(e) => onVolumeChange(parseFloat(e.target.value))}
              className="w-20 cursor-pointer h-1.5"
              aria-label="Master Volume"
            />
          </div>
        </div>
      </div>
    </div>
  );
};
