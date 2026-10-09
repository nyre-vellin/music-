import React, { useState } from 'react';
import { Track } from '../types/audio';
import {
  Search,
  Play,
  Pause,
  Plus,
  Info,
  Trash2,
  FolderOpen,
  FileAudio,
  Disc,
  Clock,
  ShieldCheck,
  AlertTriangle,
} from 'lucide-react';

interface LibraryViewProps {
  tracks: Track[];
  currentTrack: Track | null;
  isPlaying: boolean;
  onPlayTrack: (track: Track) => void;
  onAddToQueue: (track: Track) => void;
  onInspectTrack: (track: Track) => void;
  onCheckTrackHealth: (track: Track) => void;
  onDeleteTrack: (trackId: string) => void;
  onOpenFiles: () => void;
  onOpenFolder: () => void;
}

function formatDuration(secs: number): string {
  const m = Math.floor(secs / 60);
  const s = Math.floor(secs % 60);
  return `${m}:${s.toString().padStart(2, '0')}`;
}

export const LibraryView: React.FC<LibraryViewProps> = ({
  tracks,
  currentTrack,
  isPlaying,
  onPlayTrack,
  onAddToQueue,
  onInspectTrack,
  onCheckTrackHealth,
  onDeleteTrack,
  onOpenFiles,
  onOpenFolder,
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [subView, setSubView] = useState<'tracks' | 'albums' | 'artists'>('tracks');

  const filteredTracks = tracks.filter((t) => {
    const q = searchQuery.toLowerCase();
    return (
      t.title.toLowerCase().includes(q) ||
      t.artist.toLowerCase().includes(q) ||
      t.album.toLowerCase().includes(q) ||
      (t.genre && t.genre.toLowerCase().includes(q))
    );
  });

  const albumsMap = new Map<string, Track[]>();
  tracks.forEach((t) => {
    const list = albumsMap.get(t.album) || [];
    list.push(t);
    albumsMap.set(t.album, list);
  });

  const artistsMap = new Map<string, Track[]>();
  tracks.forEach((t) => {
    const list = artistsMap.get(t.artist) || [];
    list.push(t);
    artistsMap.set(t.artist, list);
  });

  return (
    <div className="space-y-6">
      {/* Search & Actions Strip */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-4">
        <div className="relative flex-1 max-w-md">
          <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-neutral-400" />
          <input
            type="text"
            placeholder="Search lossless tracks, artists, albums, tags..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-4 py-2 bg-[#232629] border border-white/5 rounded-xl text-xs text-[#eff0f1] placeholder:text-neutral-500 focus:outline-none focus:border-[#3daee9]"
          />
        </div>

        <div className="flex items-center gap-2">
          {/* Subview Segmented Filter */}
          <div className="flex items-center gap-1 p-1 bg-[#1b1e20] rounded-xl border border-white/5">
            <button
              onClick={() => setSubView('tracks')}
              className={`px-3 py-1.5 text-xs font-medium rounded-lg transition-colors ${
                subView === 'tracks'
                  ? 'bg-[#232629] text-white shadow-sm'
                  : 'text-neutral-400 hover:text-white'
              }`}
            >
              Tracks ({filteredTracks.length})
            </button>
            <button
              onClick={() => setSubView('albums')}
              className={`px-3 py-1.5 text-xs font-medium rounded-lg transition-colors ${
                subView === 'albums'
                  ? 'bg-[#232629] text-white shadow-sm'
                  : 'text-neutral-400 hover:text-white'
              }`}
            >
              Albums ({albumsMap.size})
            </button>
            <button
              onClick={() => setSubView('artists')}
              className={`px-3 py-1.5 text-xs font-medium rounded-lg transition-colors ${
                subView === 'artists'
                  ? 'bg-[#232629] text-white shadow-sm'
                  : 'text-neutral-400 hover:text-white'
              }`}
            >
              Artists ({artistsMap.size})
            </button>
          </div>

          <button
            onClick={onOpenFiles}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-[#232629] hover:bg-[#2e3236] text-[#eff0f1] text-xs font-medium rounded-xl border border-white/5 transition-colors"
            title="Import FLAC audio files"
          >
            <FileAudio className="w-3.5 h-3.5 text-[#3daee9]" />
            <span>Files</span>
          </button>
          <button
            onClick={onOpenFolder}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-[#232629] hover:bg-[#2e3236] text-[#eff0f1] text-xs font-medium rounded-xl border border-white/5 transition-colors"
            title="Import music folder from Dolphin"
          >
            <FolderOpen className="w-3.5 h-3.5 text-[#3daee9]" />
            <span>Folder</span>
          </button>
        </div>
      </div>

      {/* TRACKS LIST VIEW */}
      {subView === 'tracks' && (
        <div className="bg-[#232629] border border-white/5 rounded-2xl overflow-hidden shadow-sm">
          <div className="grid grid-cols-12 gap-4 px-6 py-3 border-b border-white/5 text-[11px] font-semibold text-neutral-400 uppercase tracking-wider">
            <div className="col-span-1 text-center">#</div>
            <div className="col-span-5">Title & Artist</div>
            <div className="col-span-3">Album</div>
            <div className="col-span-2">Resolution & Health</div>
            <div className="col-span-1 text-right flex items-center justify-end gap-1">
              <Clock className="w-3.5 h-3.5" />
            </div>
          </div>

          <div className="divide-y divide-white/5">
            {filteredTracks.map((track, idx) => {
              const isCurrent = currentTrack?.id === track.id;
              const isSuspect = track.healthReport?.isSuspectTranscode;
              const healthScore = track.healthReport?.healthScore || 90;

              return (
                <div
                  key={track.id}
                  className={`grid grid-cols-12 gap-4 px-6 py-3 items-center group text-xs transition-colors hover:bg-white/[0.03] ${
                    isCurrent ? 'bg-[#3daee9]/10 text-white' : 'text-neutral-300'
                  }`}
                >
                  {/* Track Number / Play Trigger */}
                  <div className="col-span-1 flex items-center justify-center">
                    <button
                      onClick={() => onPlayTrack(track)}
                      className="w-7 h-7 rounded-lg flex items-center justify-center text-neutral-400 group-hover:text-white group-hover:bg-[#3daee9] transition-all"
                    >
                      {isCurrent && isPlaying ? (
                        <Pause className="w-3.5 h-3.5 fill-current text-[#3daee9] group-hover:text-white" />
                      ) : (
                        <Play className="w-3.5 h-3.5 fill-current opacity-0 group-hover:opacity-100" />
                      )}
                      {(!isCurrent || !isPlaying) && (
                        <span className="group-hover:hidden font-mono text-neutral-500 tabular-nums">
                          {(track.trackNumber || idx + 1).toString().padStart(2, '0')}
                        </span>
                      )}
                    </button>
                  </div>

                  {/* Title & Artist */}
                  <div className="col-span-5 flex items-center gap-3 min-w-0">
                    <div className="w-8 h-8 rounded-lg bg-[#1b1e20] shrink-0 overflow-hidden flex items-center justify-center">
                      {track.coverArtUrl ? (
                        <img
                          src={track.coverArtUrl}
                          alt={track.album}
                          referrerPolicy="no-referrer"
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <Disc className="w-4 h-4 text-neutral-500" />
                      )}
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="font-medium text-white truncate">{track.title}</div>
                      <div className="text-[11px] text-neutral-400 truncate">{track.artist}</div>
                    </div>
                  </div>

                  {/* Album */}
                  <div className="col-span-3 text-neutral-400 truncate text-xs">
                    {track.album}
                  </div>

                  {/* Fidelity & Health Badge */}
                  <div className="col-span-2 flex items-center gap-2">
                    <button
                      onClick={() => onCheckTrackHealth(track)}
                      className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded text-[11px] font-mono text-[#3daee9] bg-[#3daee9]/10 hover:bg-[#3daee9]/20 transition-colors"
                      title="Inspect FLAC health & integrity"
                    >
                      {isSuspect ? (
                        <AlertTriangle className="w-3 h-3 text-red-400" />
                      ) : (
                        <ShieldCheck className="w-3 h-3 text-emerald-400" />
                      )}
                      <span>
                        {track.bitDepth}b/{(track.sampleRate / 1000).toFixed(0)}k
                      </span>
                    </button>
                  </div>

                  {/* Duration & Actions */}
                  <div className="col-span-1 flex items-center justify-end gap-2 font-mono tabular-nums text-neutral-400">
                    <span className="group-hover:hidden">{formatDuration(track.duration)}</span>
                    <div className="hidden group-hover:flex items-center gap-1">
                      <button
                        onClick={() => onAddToQueue(track)}
                        className="p-1 text-neutral-400 hover:text-white hover:bg-neutral-800 rounded transition-colors"
                        title="Add to Up Next queue"
                      >
                        <Plus className="w-3.5 h-3.5" />
                      </button>
                      <button
                        onClick={() => onInspectTrack(track)}
                        className="p-1 text-neutral-400 hover:text-[#3daee9] hover:bg-neutral-800 rounded transition-colors"
                        title="Inspect Vorbis comments"
                      >
                        <Info className="w-3.5 h-3.5" />
                      </button>
                      {track.isCustom && (
                        <button
                          onClick={() => onDeleteTrack(track.id)}
                          className="p-1 text-neutral-400 hover:text-red-400 hover:bg-neutral-800 rounded transition-colors"
                          title="Remove from library"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}

            {filteredTracks.length === 0 && (
              <div className="py-16 text-center text-neutral-500 text-xs">
                No matching tracks found for "{searchQuery}".
              </div>
            )}
          </div>
        </div>
      )}

      {/* ALBUMS GRID VIEW */}
      {subView === 'albums' && (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
          {Array.from(albumsMap.entries()).map(([albumName, albumTracks]) => {
            const first = albumTracks[0];
            return (
              <div
                key={albumName}
                onClick={() => onPlayTrack(first)}
                className="group p-4 bg-[#232629] border border-white/5 rounded-2xl hover:bg-[#2a2e32] transition-all cursor-pointer shadow-sm"
              >
                <div className="relative aspect-square rounded-xl bg-gradient-to-tr from-[#1d638a] to-[#3daee9] overflow-hidden mb-3.5 flex items-center justify-center">
                  {first.coverArtUrl ? (
                    <img
                      src={first.coverArtUrl}
                      alt={albumName}
                      referrerPolicy="no-referrer"
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <Disc className="w-12 h-12 text-white/70" />
                  )}
                  <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity">
                    <div className="w-10 h-10 rounded-full bg-[#3daee9] text-white flex items-center justify-center shadow-lg">
                      <Play className="w-4 h-4 fill-white translate-x-0.5" />
                    </div>
                  </div>
                </div>

                <div className="font-semibold text-white text-xs truncate">{albumName}</div>
                <div className="text-[11px] text-neutral-400 truncate mt-0.5">{first.artist}</div>
                <div className="flex items-center gap-2 text-[10px] text-neutral-500 mt-2 font-mono">
                  <span>{albumTracks.length} tracks</span>
                  <span aria-hidden="true">·</span>
                  <span>{first.bitDepth}-bit FLAC</span>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* ARTISTS VIEW */}
      {subView === 'artists' && (
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
          {Array.from(artistsMap.entries()).map(([artistName, artistTracks]) => (
            <div
              key={artistName}
              onClick={() => onPlayTrack(artistTracks[0])}
              className="p-4 bg-[#232629] border border-white/5 rounded-2xl hover:bg-[#2a2e32] transition-all cursor-pointer flex items-center gap-4"
            >
              <div className="w-12 h-12 rounded-xl bg-[#3daee9]/15 text-[#3daee9] flex items-center justify-center font-bold text-sm shrink-0">
                {artistName.charAt(0).toUpperCase()}
              </div>
              <div className="min-w-0 flex-1">
                <div className="font-semibold text-white text-xs truncate">{artistName}</div>
                <div className="text-[11px] text-neutral-400 mt-0.5">
                  {artistTracks.length} Lossless {artistTracks.length === 1 ? 'Track' : 'Tracks'}
                </div>
              </div>
              <Play className="w-4 h-4 text-neutral-500 group-hover:text-white shrink-0" />
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
