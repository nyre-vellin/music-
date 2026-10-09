import React from 'react';
import { X, Command } from 'lucide-react';

interface ShortcutsModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const SHORTCUTS = [
  { keys: ['Space'], desc: 'Play / Pause playback' },
  { keys: ['←', '→'], desc: 'Seek backwards / forwards 5 seconds' },
  { keys: ['Shift', '← / →'], desc: 'Seek backwards / forwards 15 seconds' },
  { keys: ['↑', '↓'], desc: 'Volume up / down by 5%' },
  { keys: ['M'], desc: 'Mute / unmute audio' },
  { keys: ['H'], desc: 'Open FLAC Health, Integrity & Authenticity Checker' },
  { keys: ['E'], desc: 'Open 15-band graphic equalizer' },
  { keys: ['V'], desc: 'Cycle through 6 visualizer modes' },
  { keys: ['I'], desc: 'Inspect FLAC container specs & Vorbis tags' },
  { keys: ['S'], desc: 'Toggle shuffle playback' },
  { keys: ['R'], desc: 'Cycle repeat mode (Off / All / One)' },
  { keys: ['Ctrl', 'O'], desc: 'Open FLAC file picker (Dolphin / KDE)' },
  { keys: ['Esc'], desc: 'Close dialogs, drawers, and overlays' },
];

export const ShortcutsModal: React.FC<ShortcutsModalProps> = ({ isOpen, onClose }) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md">
      <div className="w-full max-w-lg bg-[#232629] border border-white/10 rounded-2xl shadow-2xl overflow-hidden flex flex-col text-[#eff0f1]">
        <div className="flex items-center justify-between px-6 py-4 border-b border-white/5 bg-[#1b1e20]">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-xl bg-[#3daee9]/15 text-[#3daee9] flex items-center justify-center">
              <Command className="w-4 h-4" />
            </div>
            <div>
              <h2 className="text-sm font-semibold text-white">KDE Plasma 6 Shortcuts</h2>
              <div className="text-xs text-neutral-400 mt-0.5">Desktop media navigation</div>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-neutral-400 hover:text-white hover:bg-neutral-800 rounded-lg transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="p-6 divide-y divide-white/5 max-h-[72vh] overflow-y-auto">
          {SHORTCUTS.map((item, idx) => (
            <div key={idx} className="flex items-center justify-between py-2.5 text-xs">
              <span className="text-neutral-300">{item.desc}</span>
              <div className="flex items-center gap-1">
                {item.keys.map((k) => (
                  <kbd
                    key={k}
                    className="px-2 py-1 bg-[#181a1c] border border-white/10 rounded text-[11px] font-mono text-neutral-200 shadow-sm"
                  >
                    {k}
                  </kbd>
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
