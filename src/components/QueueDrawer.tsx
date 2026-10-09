import React from 'react';
import { Track } from '../types/audio';
import { X, Trash2, Play, Disc } from 'lucide-react';

interface QueueDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  queue: Track[];
  currentTrack: Track | null;
  onPlayQueueIndex: (index: number) => void;
  onRemoveFromQueue: (index: number) => void;
  onClearQueue: () => void;
}

export const QueueDrawer: React.FC<QueueDrawerProps> = ({
  isOpen,
  onClose,
  queue,
  currentTrack,
  onPlayQueueIndex,
  onRemoveFromQueue,
  onClearQueue,
}) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-y-0 right-0 z-50 w-full sm:w-96 bg-[#232629] border-l border-white/10 shadow-2xl flex flex-col text-[#eff0f1]">
      {/* Drawer Header */}
      <div className="flex items-center justify-between px-6 py-4 border-b border-white/5 bg-[#1b1e20]">
        <div>
          <h2 className="text-sm font-semibold text-white">Plasma Playback Queue</h2>
          <div className="text-xs text-neutral-400 mt-0.5">
            {queue.length} {queue.length === 1 ? 'track' : 'tracks'} queued
          </div>
        </div>

        <div className="flex items-center gap-2">
          {queue.length > 0 && (
            <button
              onClick={onClearQueue}
              className="px-2.5 py-1 text-xs text-neutral-400 hover:text-red-400 hover:bg-neutral-800 rounded transition-colors"
              title="Clear entire queue"
            >
              Clear
            </button>
          )}
          <button
            onClick={onClose}
            className="p-1.5 text-neutral-400 hover:text-white hover:bg-neutral-800 rounded-lg transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>
      </div>

      {/* Currently Playing Track */}
      {currentTrack && (
        <div className="p-4 border-b border-white/5 bg-[#1b1e20]/60">
          <span className="text-[10px] font-semibold uppercase tracking-wider text-[#3daee9]">
            Now Playing
          </span>
          <div className="flex items-center gap-3 mt-2">
            <div className="w-10 h-10 rounded-xl bg-[#181a1c] shrink-0 overflow-hidden flex items-center justify-center">
              {currentTrack.coverArtUrl ? (
                <img
                  src={currentTrack.coverArtUrl}
                  alt={currentTrack.album}
                  referrerPolicy="no-referrer"
                  className="w-full h-full object-cover"
                />
              ) : (
                <Disc className="w-5 h-5 text-neutral-500" />
              )}
            </div>
            <div className="min-w-0 flex-1">
              <div className="text-xs font-semibold text-white truncate">{currentTrack.title}</div>
              <div className="text-[11px] text-neutral-400 truncate">{currentTrack.artist}</div>
              <div className="text-[10px] text-[#3daee9] font-mono mt-0.5">
                {currentTrack.bitDepth}-bit Lossless
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Up Next List */}
      <div className="flex-1 overflow-y-auto p-4 space-y-2">
        <span className="text-[10px] font-semibold uppercase tracking-wider text-neutral-500 px-2">
          Up Next
        </span>

        {queue.length === 0 ? (
          <div className="py-16 text-center text-xs text-neutral-500">
            Queue is empty. Click + on any track in your library to add it here.
          </div>
        ) : (
          queue.map((track, idx) => (
            <div
              key={`${track.id}-${idx}`}
              className="group flex items-center justify-between p-2 rounded-xl hover:bg-white/[0.04] transition-colors text-xs"
            >
              <div
                className="flex items-center gap-3 min-w-0 flex-1 cursor-pointer"
                onClick={() => onPlayQueueIndex(idx)}
              >
                <div className="w-8 h-8 rounded-lg bg-[#181a1c] shrink-0 flex items-center justify-center text-neutral-400 group-hover:text-white">
                  <Play className="w-3.5 h-3.5 fill-current opacity-0 group-hover:opacity-100" />
                  <span className="group-hover:hidden text-[11px] font-mono text-neutral-500">
                    {idx + 1}
                  </span>
                </div>
                <div className="min-w-0 flex-1">
                  <div className="font-medium text-white truncate">{track.title}</div>
                  <div className="text-[11px] text-neutral-400 truncate">{track.artist}</div>
                </div>
              </div>

              <button
                onClick={() => onRemoveFromQueue(idx)}
                className="opacity-0 group-hover:opacity-100 p-1.5 text-neutral-400 hover:text-red-400 rounded transition-all"
                title="Remove track"
              >
                <Trash2 className="w-3.5 h-3.5" />
              </button>
            </div>
          ))
        )}
      </div>
    </div>
  );
};
