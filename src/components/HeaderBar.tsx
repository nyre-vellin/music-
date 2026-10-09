import React from 'react';
import { Upload } from 'lucide-react';

interface HeaderBarProps {
  currentTab: 'player' | 'library' | 'checker' | 'dsp' | 'playlists';
  onSelectTab: (tab: 'player' | 'library' | 'checker' | 'dsp' | 'playlists') => void;
  onOpenImport: () => void;
}

export const HeaderBar: React.FC<HeaderBarProps> = ({
  currentTab,
  onSelectTab,
  onOpenImport,
}) => {
  return (
    <header className="flex items-center justify-between gap-8 px-6 py-3.5 bg-[#1b1e20] border-b border-white/5 shrink-0 select-none">
      {/* Zone 1: Wordmark */}
      <div className="flex items-center gap-2.5 shrink-0">
        <span className="text-base font-bold tracking-tight text-white whitespace-nowrap shrink-0">
          KDE Decibel FLAC
        </span>
      </div>

      {/* Zone 2: Concise single-line navigation links */}
      <nav className="flex items-center gap-6 text-xs font-medium text-neutral-400">
        <button
          onClick={() => onSelectTab('player')}
          className={`whitespace-nowrap shrink-0 transition-colors ${
            currentTab === 'player'
              ? 'text-[#3daee9] font-semibold'
              : 'hover:text-neutral-200'
          }`}
        >
          Now Playing
        </button>
        <button
          onClick={() => onSelectTab('library')}
          className={`whitespace-nowrap shrink-0 transition-colors ${
            currentTab === 'library'
              ? 'text-[#3daee9] font-semibold'
              : 'hover:text-neutral-200'
          }`}
        >
          Audio Library
        </button>
        <button
          onClick={() => onSelectTab('checker')}
          className={`whitespace-nowrap shrink-0 transition-colors ${
            currentTab === 'checker'
              ? 'text-[#3daee9] font-semibold'
              : 'hover:text-neutral-200'
          }`}
        >
          FLAC Health & Checker
        </button>
        <button
          onClick={() => onSelectTab('dsp')}
          className={`whitespace-nowrap shrink-0 transition-colors ${
            currentTab === 'dsp'
              ? 'text-[#3daee9] font-semibold'
              : 'hover:text-neutral-200'
          }`}
        >
          15-Band Studio DSP
        </button>
        <button
          onClick={() => onSelectTab('playlists')}
          className={`whitespace-nowrap shrink-0 transition-colors ${
            currentTab === 'playlists'
              ? 'text-[#3daee9] font-semibold'
              : 'hover:text-neutral-200'
          }`}
        >
          Playlists
        </button>
      </nav>

      {/* Zone 3: 1 primary action */}
      <div className="flex items-center gap-3 shrink-0">
        <button
          onClick={onOpenImport}
          className="flex items-center gap-2 px-3.5 py-1.5 text-xs font-medium text-white bg-[#3daee9] rounded-lg hover:bg-[#2980b9] transition-colors whitespace-nowrap shrink-0 shadow-sm"
        >
          <Upload className="w-3.5 h-3.5" />
          <span>Import FLAC</span>
        </button>
      </div>
    </header>
  );
};
