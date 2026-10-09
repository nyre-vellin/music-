import React, { useState } from 'react';
import { Playlist, Track } from '../types/audio';
import { ListMusic, Plus, Play, Trash2, Disc, Music, ArrowLeft } from 'lucide-react';

interface PlaylistsViewProps {
  playlists: Playlist[];
  allTracks: Track[];
  onPlayTrack: (track: Track) => void;
  onPlayPlaylist: (playlist: Playlist) => void;
  onCreatePlaylist: (name: string) => void;
  onDeletePlaylist: (id: string) => void;
  onRemoveTrackFromPlaylist: (playlistId: string, trackId: string) => void;
}

export const PlaylistsView: React.FC<PlaylistsViewProps> = ({
  playlists,
  allTracks,
  onPlayTrack,
  onPlayPlaylist,
  onCreatePlaylist,
  onDeletePlaylist,
  onRemoveTrackFromPlaylist,
}) => {
  const [activePlaylistId, setActivePlaylistId] = useState<string | null>(null);
  const [newPlaylistName, setNewPlaylistName] = useState('');
  const [isCreating, setIsCreating] = useState(false);

  const activePlaylist = playlists.find((p) => p.id === activePlaylistId);
  const playlistTracks = activePlaylist
    ? activePlaylist.trackIds
        .map((id) => allTracks.find((t) => t.id === id))
        .filter((t): t is Track => t !== undefined)
    : [];

  const handleCreate = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newPlaylistName.trim()) return;
    onCreatePlaylist(newPlaylistName.trim());
    setNewPlaylistName('');
    setIsCreating(false);
  };

  if (activePlaylist) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <button
            onClick={() => setActivePlaylistId(null)}
            className="flex items-center gap-2 text-xs text-neutral-400 hover:text-white transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Back to All Playlists</span>
          </button>

          <div className="flex items-center gap-2">
            {playlistTracks.length > 0 && (
              <button
                onClick={() => onPlayPlaylist(activePlaylist)}
                className="flex items-center gap-2 px-3.5 py-1.5 text-xs font-medium text-white bg-[#3daee9] rounded-lg hover:bg-[#2980b9] transition-colors"
              >
                <Play className="w-3.5 h-3.5 fill-current" />
                <span>Play Playlist</span>
              </button>
            )}
            <button
              onClick={() => {
                onDeletePlaylist(activePlaylist.id);
                setActivePlaylistId(null);
              }}
              className="p-1.5 text-neutral-400 hover:text-red-400 hover:bg-neutral-800 rounded-lg transition-colors"
              title="Delete Playlist"
            >
              <Trash2 className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Playlist Banner */}
        <div className="p-6 bg-[#232629] border border-white/5 rounded-2xl flex items-center gap-6 shadow-sm">
          <div className="w-24 h-24 rounded-2xl bg-gradient-to-tr from-[#1d638a] to-[#3daee9] flex items-center justify-center text-white shrink-0 shadow-md">
            <ListMusic className="w-10 h-10" />
          </div>
          <div>
            <h2 className="text-xl font-bold text-white tracking-tight">{activePlaylist.name}</h2>
            <div className="flex items-center gap-2 text-xs text-neutral-400 mt-1">
              <span>{playlistTracks.length} tracks</span>
              <span aria-hidden="true">·</span>
              <span>Fedora KDE Plasma FLAC Collection</span>
            </div>
          </div>
        </div>

        {/* Tracks List */}
        <div className="bg-[#232629] border border-white/5 rounded-2xl overflow-hidden shadow-sm">
          {playlistTracks.length === 0 ? (
            <div className="p-12 text-center text-xs text-neutral-500">
              This playlist is empty. Browse the Audio Library and add tracks to "{activePlaylist.name}".
            </div>
          ) : (
            <div className="divide-y divide-white/5">
              {playlistTracks.map((track, idx) => (
                <div
                  key={`${track.id}-${idx}`}
                  className="flex items-center justify-between px-6 py-3 hover:bg-white/[0.02] transition-colors text-xs text-neutral-300 group"
                >
                  <div
                    className="flex items-center gap-4 flex-1 min-w-0 cursor-pointer"
                    onClick={() => onPlayTrack(track)}
                  >
                    <span className="font-mono text-neutral-500 w-4 text-right">
                      {idx + 1}
                    </span>
                    <div className="w-8 h-8 rounded-lg bg-[#1b1e20] shrink-0 flex items-center justify-center overflow-hidden">
                      {track.coverArtUrl ? (
                        <img
                          src={track.coverArtUrl}
                          alt={track.title}
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

                  <div className="flex items-center gap-4">
                    <span className="font-mono text-[11px] text-[#3daee9]">
                      {track.bitDepth}-bit
                    </span>
                    <button
                      onClick={() => onRemoveTrackFromPlaylist(activePlaylist.id, track.id)}
                      className="opacity-0 group-hover:opacity-100 p-1 text-neutral-400 hover:text-red-400 rounded transition-all"
                      title="Remove from playlist"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-base font-bold text-white tracking-tight">Audio Playlists</h2>
          <div className="text-xs text-neutral-400 mt-0.5">Organize your lossless collections</div>
        </div>

        <button
          onClick={() => setIsCreating(true)}
          className="flex items-center gap-1.5 px-3 py-1.5 bg-[#3daee9] hover:bg-[#2980b9] text-white text-xs font-medium rounded-lg transition-colors"
        >
          <Plus className="w-3.5 h-3.5" />
          <span>New Playlist</span>
        </button>
      </div>

      {isCreating && (
        <form
          onSubmit={handleCreate}
          className="p-4 bg-[#232629] border border-[#3daee9]/30 rounded-xl flex items-center gap-3"
        >
          <input
            type="text"
            placeholder="Playlist name..."
            value={newPlaylistName}
            onChange={(e) => setNewPlaylistName(e.target.value)}
            autoFocus
            className="flex-1 bg-[#181a1c] border border-white/10 rounded-lg px-3 py-1.5 text-xs text-white placeholder:text-neutral-500 focus:outline-none focus:border-[#3daee9]"
          />
          <button
            type="submit"
            className="px-3 py-1.5 bg-[#3daee9] text-white text-xs font-medium rounded-lg hover:bg-[#2980b9] transition-colors"
          >
            Create
          </button>
          <button
            type="button"
            onClick={() => setIsCreating(false)}
            className="px-3 py-1.5 text-neutral-400 hover:text-white text-xs transition-colors"
          >
            Cancel
          </button>
        </form>
      )}

      {/* Playlists Grid */}
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
        {playlists.map((playlist) => (
          <div
            key={playlist.id}
            onClick={() => setActivePlaylistId(playlist.id)}
            className="group p-4 bg-[#232629] border border-white/5 rounded-2xl hover:bg-[#2a2e32] transition-all cursor-pointer shadow-sm"
          >
            <div className="aspect-square rounded-xl bg-gradient-to-tr from-[#1d638a] to-[#3daee9] flex items-center justify-center text-white mb-3 shadow-inner">
              <Music className="w-10 h-10 text-white/80" />
            </div>
            <div className="font-semibold text-white text-xs truncate">{playlist.name}</div>
            <div className="text-[11px] text-neutral-400 mt-0.5">
              {playlist.trackIds.length} {playlist.trackIds.length === 1 ? 'track' : 'tracks'}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
