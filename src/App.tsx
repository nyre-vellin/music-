import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Track, VisualizerMode, RepeatMode, Playlist, EqPreset } from './types/audio';
import { audioEngine } from './services/audioEngine';
import { createDefaultLosslessTracks } from './utils/audioSynthesizer';
import { parseFlacFile } from './utils/flacParser';
import {
  saveTrackToDb,
  loadCustomTracksFromDb,
  deleteTrackFromDb,
  saveSetting,
  loadSetting,
} from './utils/storage';
import { DEFAULT_EQ_PRESETS } from './utils/equalizerConfig';
import { HeaderBar } from './components/HeaderBar';
import { PlayerControls } from './components/PlayerControls';
import { LibraryView } from './components/LibraryView';
import { NowPlayingView } from './components/NowPlayingView';
import { DspView } from './components/DspView';
import { PlaylistsView } from './components/PlaylistsView';
import { FlacHealthView } from './components/FlacHealthView';
import { EqualizerModal } from './components/EqualizerModal';
import { FlacInspectorModal } from './components/FlacInspectorModal';
import { FlacHealthCheckerModal } from './components/FlacHealthCheckerModal';
import { ShortcutsModal } from './components/ShortcutsModal';
import { QueueDrawer } from './components/QueueDrawer';
import { UploadCloud } from 'lucide-react';

export default function App() {
  // Navigation
  const [currentTab, setCurrentTab] = useState<
    'player' | 'library' | 'checker' | 'dsp' | 'playlists'
  >('player');

  // Track Collection & Playback
  const [tracks, setTracks] = useState<Track[]>([]);
  const [currentTrack, setCurrentTrack] = useState<Track | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);

  // Playback parameters
  const [volume, setVolume] = useState(0.85);
  const [isMuted, setIsMuted] = useState(false);
  const [isShuffle, setIsShuffle] = useState(false);
  const [repeatMode, setRepeatMode] = useState<RepeatMode>('off');
  const [pan, setPan] = useState(0);
  const [playbackRate, setPlaybackRate] = useState(1.0);

  // DSP & 15-Band Equalizer
  const [isEqEnabled, setIsEqEnabled] = useState(true);
  const [selectedPresetName, setSelectedPresetName] = useState('Bit-Perfect Flat');
  const [preamp, setPreamp] = useState(0);
  const [eqGains, setEqGains] = useState<number[]>([
    0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0,
  ]);
  const [visualizerMode, setVisualizerMode] = useState<VisualizerMode>('bars');

  // Queue & Playlists
  const [queue, setQueue] = useState<Track[]>([]);
  const [playlists, setPlaylists] = useState<Playlist[]>([
    {
      id: 'pl-favorites',
      name: 'KDE Plasma Hi-Fi Favorites',
      createdAt: Date.now(),
      trackIds: ['lossless-demo-1', 'lossless-demo-2'],
    },
  ]);

  // Modals & Drawers
  const [isEqModalOpen, setIsEqModalOpen] = useState(false);
  const [isInspectorOpen, setIsInspectorOpen] = useState(false);
  const [inspectedTrack, setInspectedTrack] = useState<Track | null>(null);
  const [isHealthCheckerOpen, setIsHealthCheckerOpen] = useState(false);
  const [healthCheckTrack, setHealthCheckTrack] = useState<Track | null>(null);
  const [isShortcutsOpen, setIsShortcutsOpen] = useState(false);
  const [isQueueOpen, setIsQueueOpen] = useState(false);

  // Drag and drop state
  const [isDraggingOver, setIsDraggingOver] = useState(false);

  // File Inputs
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const folderInputRef = useRef<HTMLInputElement | null>(null);

  // Initialize Library & Audio Engine
  useEffect(() => {
    const init = async () => {
      const defaultTracks = createDefaultLosslessTracks();
      const customTracks = await loadCustomTracksFromDb();
      const combined = [...customTracks, ...defaultTracks];
      setTracks(combined);

      if (combined.length > 0) {
        const initial = combined[0];
        setCurrentTrack(initial);
        audioEngine.loadTrack(initial);
      }

      // Load saved settings
      const savedVol = await loadSetting<number>('volume', 0.85);
      setVolume(savedVol);
      audioEngine.setVolume(savedVol);

      const savedMode = await loadSetting<VisualizerMode>('visualizerMode', 'bars');
      setVisualizerMode(savedMode);
    };

    init();
  }, []);

  // Hook up audio element events
  useEffect(() => {
    const el = audioEngine.getElement();

    const onTimeUpdate = () => {
      setCurrentTime(el.currentTime);
    };

    const onDurationChange = () => {
      if (el.duration && !isNaN(el.duration)) {
        setDuration(el.duration);
      }
    };

    const onPlay = () => setIsPlaying(true);
    const onPause = () => setIsPlaying(false);

    const onEnded = () => {
      handleTrackEnded();
    };

    el.addEventListener('timeupdate', onTimeUpdate);
    el.addEventListener('durationchange', onDurationChange);
    el.addEventListener('play', onPlay);
    el.addEventListener('pause', onPause);
    el.addEventListener('ended', onEnded);

    return () => {
      el.removeEventListener('timeupdate', onTimeUpdate);
      el.removeEventListener('durationchange', onDurationChange);
      el.removeEventListener('play', onPlay);
      el.removeEventListener('pause', onPause);
      el.removeEventListener('ended', onEnded);
    };
  }, [tracks, queue, repeatMode, isShuffle, currentTrack]);

  const playTrack = useCallback(
    async (track: Track) => {
      setCurrentTrack(track);
      await audioEngine.loadTrack(track);
      try {
        await audioEngine.play();
        setIsPlaying(true);
      } catch (e) {
        console.warn('Playback wait:', e);
      }
    },
    []
  );

  const handleTrackEnded = useCallback(() => {
    if (repeatMode === 'one') {
      audioEngine.seek(0);
      audioEngine.play();
      return;
    }

    if (queue.length > 0) {
      const nextTrack = queue[0];
      setQueue((prev) => prev.slice(1));
      playTrack(nextTrack);
      return;
    }

    if (isShuffle && tracks.length > 1) {
      const remaining = tracks.filter((t) => t.id !== currentTrack?.id);
      const random = remaining[Math.floor(Math.random() * remaining.length)];
      playTrack(random);
      return;
    }

    if (repeatMode === 'all' && tracks.length > 0) {
      const currentIdx = tracks.findIndex((t) => t.id === currentTrack?.id);
      const nextIdx = (currentIdx + 1) % tracks.length;
      playTrack(tracks[nextIdx]);
      return;
    }

    if (tracks.length > 0) {
      const currentIdx = tracks.findIndex((t) => t.id === currentTrack?.id);
      if (currentIdx !== -1 && currentIdx + 1 < tracks.length) {
        playTrack(tracks[currentIdx + 1]);
      } else {
        setIsPlaying(false);
      }
    }
  }, [repeatMode, queue, isShuffle, tracks, currentTrack, playTrack]);

  const handleNext = useCallback(() => {
    if (queue.length > 0) {
      const next = queue[0];
      setQueue((prev) => prev.slice(1));
      playTrack(next);
      return;
    }

    if (tracks.length === 0) return;

    if (isShuffle) {
      const filtered = tracks.filter((t) => t.id !== currentTrack?.id);
      const random = filtered[Math.floor(Math.random() * filtered.length)] || tracks[0];
      playTrack(random);
      return;
    }

    const currentIdx = tracks.findIndex((t) => t.id === currentTrack?.id);
    const nextIdx = (currentIdx + 1) % tracks.length;
    playTrack(tracks[nextIdx]);
  }, [queue, tracks, isShuffle, currentTrack, playTrack]);

  const handlePrevious = useCallback(() => {
    if (audioEngine.getElement().currentTime > 3) {
      audioEngine.seek(0);
      return;
    }

    if (tracks.length === 0) return;
    const currentIdx = tracks.findIndex((t) => t.id === currentTrack?.id);
    const prevIdx = (currentIdx - 1 + tracks.length) % tracks.length;
    playTrack(tracks[prevIdx]);
  }, [tracks, currentTrack, playTrack]);

  const togglePlay = useCallback(async () => {
    if (!currentTrack) {
      if (tracks.length > 0) {
        playTrack(tracks[0]);
      }
      return;
    }

    if (isPlaying) {
      audioEngine.pause();
      setIsPlaying(false);
    } else {
      try {
        await audioEngine.play();
        setIsPlaying(true);
      } catch (e) {
        console.warn('Play error:', e);
      }
    }
  }, [currentTrack, tracks, isPlaying, playTrack]);

  const handleSeek = (time: number) => {
    audioEngine.seek(time);
    setCurrentTime(time);
  };

  const handleVolumeChange = (vol: number) => {
    setVolume(vol);
    audioEngine.setVolume(vol);
    saveSetting('volume', vol);
  };

  const handleToggleMute = () => {
    const nextMute = !isMuted;
    setIsMuted(nextMute);
    audioEngine.setMute(nextMute);
  };

  const handleCycleRepeat = () => {
    setRepeatMode((prev) => (prev === 'off' ? 'all' : prev === 'all' ? 'one' : 'off'));
  };

  const handleCycleVisualizer = () => {
    const modes: VisualizerMode[] = [
      'bars',
      'wave',
      'radial',
      'vu',
      'spectrogram',
      'goniometer',
    ];
    const next = modes[(modes.indexOf(visualizerMode) + 1) % modes.length];
    setVisualizerMode(next);
    saveSetting('visualizerMode', next);
  };

  // Equalizer DSP adjustments
  const handlePreampChange = (val: number) => {
    setPreamp(val);
    audioEngine.setPreamp(val);
  };

  const handleGainChange = (index: number, val: number) => {
    const next = [...eqGains];
    next[index] = val;
    setEqGains(next);
    audioEngine.setBandGain(index, val);
    setSelectedPresetName('Custom');
  };

  const handleSelectPreset = (preset: EqPreset) => {
    setSelectedPresetName(preset.name);
    setPreamp(preset.preamp);
    setEqGains([...preset.gains]);
    audioEngine.applyPresetGains(preset.preamp, preset.gains);
  };

  const handleToggleEq = (enabled: boolean) => {
    setIsEqEnabled(enabled);
    if (!enabled) {
      audioEngine.applyPresetGains(
        0,
        [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0]
      );
    } else {
      audioEngine.applyPresetGains(preamp, eqGains);
    }
  };

  const handleResetEq = () => {
    const flat = DEFAULT_EQ_PRESETS[0];
    handleSelectPreset(flat);
  };

  const handlePanChange = (val: number) => {
    setPan(val);
    audioEngine.setPan(val);
  };

  const handlePlaybackRateChange = (val: number) => {
    setPlaybackRate(val);
    audioEngine.setPlaybackRate(val);
  };

  const openHealthCheckerForTrack = (track: Track) => {
    setHealthCheckTrack(track);
    setIsHealthCheckerOpen(true);
  };

  // Keyboard Shortcuts for KDE Plasma on Fedora
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (
        e.target instanceof HTMLInputElement ||
        e.target instanceof HTMLTextAreaElement ||
        e.target instanceof HTMLSelectElement
      ) {
        return;
      }

      if (e.key === ' ' || e.code === 'Space') {
        e.preventDefault();
        togglePlay();
      } else if (e.key === 'ArrowRight') {
        e.preventDefault();
        const step = e.shiftKey ? 15 : 5;
        handleSeek(audioEngine.getElement().currentTime + step);
      } else if (e.key === 'ArrowLeft') {
        e.preventDefault();
        const step = e.shiftKey ? 15 : 5;
        handleSeek(audioEngine.getElement().currentTime - step);
      } else if (e.key === 'ArrowUp') {
        e.preventDefault();
        handleVolumeChange(Math.min(1, volume + 0.05));
      } else if (e.key === 'ArrowDown') {
        e.preventDefault();
        handleVolumeChange(Math.max(0, volume - 0.05));
      } else if (e.key === 'm' || e.key === 'M') {
        handleToggleMute();
      } else if (e.key === 'h' || e.key === 'H') {
        if (currentTrack) {
          openHealthCheckerForTrack(currentTrack);
        }
      } else if (e.key === 'e' || e.key === 'E') {
        setIsEqModalOpen((prev) => !prev);
      } else if (e.key === 'v' || e.key === 'V') {
        handleCycleVisualizer();
      } else if (e.key === 'i' || e.key === 'I') {
        if (currentTrack) {
          setInspectedTrack(currentTrack);
          setIsInspectorOpen((prev) => !prev);
        }
      } else if (e.key === 's' || e.key === 'S') {
        setIsShuffle((prev) => !prev);
      } else if (e.key === 'r' || e.key === 'R') {
        handleCycleRepeat();
      } else if (e.key === 'Escape') {
        setIsEqModalOpen(false);
        setIsInspectorOpen(false);
        setIsHealthCheckerOpen(false);
        setIsShortcutsOpen(false);
        setIsQueueOpen(false);
      } else if ((e.ctrlKey || e.metaKey) && (e.key === 'o' || e.key === 'O')) {
        e.preventDefault();
        fileInputRef.current?.click();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [togglePlay, volume, currentTrack, visualizerMode]);

  // Import Files Handler with deep FLAC authenticity analysis
  const processImportedFiles = async (files: FileList | File[]) => {
    const newTracks: Track[] = [];

    for (let i = 0; i < files.length; i++) {
      const file = files[i];
      const ext = file.name.split('.').pop()?.toLowerCase();
      if (
        !file.type.includes('audio') &&
        ext !== 'flac' &&
        ext !== 'wav' &&
        ext !== 'ogg' &&
        ext !== 'mp3' &&
        ext !== 'alac'
      ) {
        continue;
      }

      try {
        const metadata = await parseFlacFile(file);
        const url = URL.createObjectURL(file);

        const bitDepth = metadata.streamInfo?.bitsPerSample || 16;
        const sampleRate = metadata.streamInfo?.sampleRate || 44100;
        const channels = metadata.streamInfo?.channels || 2;
        const totalSamples = metadata.streamInfo?.totalSamples || 0;
        const durationSecs =
          totalSamples > 0 && sampleRate > 0 ? totalSamples / sampleRate : 180;
        const bitrateKbps =
          Math.round((file.size * 8) / (durationSecs * 1000)) || 1411;

        const newTrack: Track = {
          id: `custom-${Date.now()}-${i}`,
          title: metadata.vorbisComments['TITLE'] || file.name.replace(/\.[^/.]+$/, ''),
          artist: metadata.vorbisComments['ARTIST'] || 'Unknown Artist',
          album: metadata.vorbisComments['ALBUM'] || 'Fedora KDE Collection',
          year:
            metadata.vorbisComments['DATE'] ||
            metadata.vorbisComments['YEAR'] ||
            undefined,
          genre: metadata.vorbisComments['GENRE'] || undefined,
          trackNumber: metadata.vorbisComments['TRACKNUMBER']
            ? parseInt(metadata.vorbisComments['TRACKNUMBER'], 10)
            : undefined,
          duration: durationSecs,
          url,
          isCustom: true,
          coverArtUrl: metadata.coverArtBlobUrl,
          fileSize: file.size,
          format: 'flac',
          bitDepth,
          sampleRate,
          channels,
          bitrate: bitrateKbps,
          vorbisComments: metadata.vorbisComments,
          vendor: metadata.vendorString,
          md5: metadata.streamInfo?.md5,
          healthReport: metadata.healthReport,
        };

        newTracks.push(newTrack);
        await saveTrackToDb(newTrack, file);
      } catch (err) {
        console.warn('File import error:', file.name, err);
      }
    }

    if (newTracks.length > 0) {
      setTracks((prev) => [...newTracks, ...prev]);
      if (!isPlaying) {
        playTrack(newTracks[0]);
      }
    }
  };

  const handleFilesChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      processImportedFiles(e.target.files);
    }
  };

  const handleFolderChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      processImportedFiles(e.target.files);
    }
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDraggingOver(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDraggingOver(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDraggingOver(false);
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      processImportedFiles(e.dataTransfer.files);
    }
  };

  const handleDeleteTrack = async (trackId: string) => {
    await deleteTrackFromDb(trackId);
    setTracks((prev) => prev.filter((t) => t.id !== trackId));
    setQueue((prev) => prev.filter((t) => t.id !== trackId));
  };

  const handleAddToQueue = (track: Track) => {
    setQueue((prev) => [...prev, track]);
  };

  const handleCreatePlaylist = (name: string) => {
    const pl: Playlist = {
      id: `pl-${Date.now()}`,
      name,
      createdAt: Date.now(),
      trackIds: [],
    };
    setPlaylists((prev) => [...prev, pl]);
  };

  const handleDeletePlaylist = (id: string) => {
    setPlaylists((prev) => prev.filter((p) => p.id !== id));
  };

  const handlePlayPlaylist = (playlist: Playlist) => {
    const pTracks = playlist.trackIds
      .map((id) => tracks.find((t) => t.id === id))
      .filter((t): t is Track => t !== undefined);
    if (pTracks.length > 0) {
      playTrack(pTracks[0]);
      setQueue(pTracks.slice(1));
    }
  };

  const handleRemoveTrackFromPlaylist = (playlistId: string, trackId: string) => {
    setPlaylists((prev) =>
      prev.map((p) =>
        p.id === playlistId
          ? { ...p, trackIds: p.trackIds.filter((id) => id !== trackId) }
          : p
      )
    );
  };

  return (
    <div
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      onDrop={handleDrop}
      className="min-h-screen bg-[#1b1e20] text-[#eff0f1] flex flex-col relative select-none pb-28"
    >
      {/* Hidden File Inputs */}
      <input
        type="file"
        ref={fileInputRef}
        multiple
        accept=".flac,.wav,.ogg,.mp3,audio/*"
        onChange={handleFilesChange}
        className="hidden"
      />
      <input
        type="file"
        ref={folderInputRef}
        // @ts-expect-error webkitdirectory is standard in Linux Chromium and Firefox
        webkitdirectory=""
        directory=""
        multiple
        onChange={handleFolderChange}
        className="hidden"
      />

      {/* Top Header Bar */}
      <HeaderBar
        currentTab={currentTab}
        onSelectTab={setCurrentTab}
        onOpenImport={() => fileInputRef.current?.click()}
      />

      {/* Drag & Drop Overlay */}
      {isDraggingOver && (
        <div className="absolute inset-0 z-50 bg-[#3daee9]/90 backdrop-blur-md flex flex-col items-center justify-center text-white pointer-events-none p-6">
          <UploadCloud className="w-16 h-16 animate-bounce mb-3" />
          <h2 className="text-xl font-bold">Drop FLAC Files Here</h2>
          <p className="text-xs text-blue-100 mt-1">
            KDE Plasma 6 Lossless Audio Engine · Instant Verification & Playback
          </p>
        </div>
      )}

      {/* Main Content Area */}
      <main className="flex-1 max-w-7xl w-full mx-auto p-6">
        {currentTab === 'player' && (
          <NowPlayingView
            currentTrack={currentTrack}
            isPlaying={isPlaying}
            visualizerMode={visualizerMode}
            onCycleVisualizer={handleCycleVisualizer}
            onOpenInspector={() => {
              if (currentTrack) {
                setInspectedTrack(currentTrack);
                setIsInspectorOpen(true);
              }
            }}
            onOpenHealthChecker={() => {
              if (currentTrack) {
                openHealthCheckerForTrack(currentTrack);
              }
            }}
            onOpenEq={() => setIsEqModalOpen(true)}
            onAddToQueue={handleAddToQueue}
          />
        )}

        {currentTab === 'library' && (
          <LibraryView
            tracks={tracks}
            currentTrack={currentTrack}
            isPlaying={isPlaying}
            onPlayTrack={playTrack}
            onAddToQueue={handleAddToQueue}
            onInspectTrack={(track) => {
              setInspectedTrack(track);
              setIsInspectorOpen(true);
            }}
            onCheckTrackHealth={openHealthCheckerForTrack}
            onDeleteTrack={handleDeleteTrack}
            onOpenFiles={() => fileInputRef.current?.click()}
            onOpenFolder={() => folderInputRef.current?.click()}
          />
        )}

        {currentTab === 'checker' && (
          <FlacHealthView
            tracks={tracks}
            currentTrack={currentTrack}
            onInspectTrack={openHealthCheckerForTrack}
            onPlayTrack={playTrack}
            onOpenFiles={() => fileInputRef.current?.click()}
          />
        )}

        {currentTab === 'dsp' && (
          <DspView
            isPlaying={isPlaying}
            visualizerMode={visualizerMode}
            onSelectVisualizerMode={setVisualizerMode}
            currentPreamp={preamp}
            currentGains={eqGains}
            isEqEnabled={isEqEnabled}
            selectedPresetName={selectedPresetName}
            pan={pan}
            playbackRate={playbackRate}
            onPreampChange={handlePreampChange}
            onGainChange={handleGainChange}
            onSelectPreset={handleSelectPreset}
            onToggleEq={handleToggleEq}
            onPanChange={handlePanChange}
            onPlaybackRateChange={handlePlaybackRateChange}
            onReset={handleResetEq}
          />
        )}

        {currentTab === 'playlists' && (
          <PlaylistsView
            playlists={playlists}
            allTracks={tracks}
            onPlayTrack={playTrack}
            onPlayPlaylist={handlePlayPlaylist}
            onCreatePlaylist={handleCreatePlaylist}
            onDeletePlaylist={handleDeletePlaylist}
            onRemoveTrackFromPlaylist={handleRemoveTrackFromPlaylist}
          />
        )}
      </main>

      {/* Bottom Sticky Player Controls Bar */}
      <PlayerControls
        currentTrack={currentTrack}
        isPlaying={isPlaying}
        currentTime={currentTime}
        duration={duration}
        volume={volume}
        isMuted={isMuted}
        isShuffle={isShuffle}
        repeatMode={repeatMode}
        visualizerMode={visualizerMode}
        isEqEnabled={isEqEnabled}
        queueCount={queue.length}
        onTogglePlay={togglePlay}
        onSeek={handleSeek}
        onNext={handleNext}
        onPrevious={handlePrevious}
        onToggleShuffle={() => setIsShuffle((prev) => !prev)}
        onCycleRepeat={handleCycleRepeat}
        onVolumeChange={handleVolumeChange}
        onToggleMute={handleToggleMute}
        onOpenEq={() => setIsEqModalOpen(true)}
        onOpenInspector={() => {
          if (currentTrack) {
            setInspectedTrack(currentTrack);
            setIsInspectorOpen(true);
          }
        }}
        onOpenHealthChecker={() => {
          if (currentTrack) {
            openHealthCheckerForTrack(currentTrack);
          }
        }}
        onToggleQueue={() => setIsQueueOpen((prev) => !prev)}
        onCycleVisualizer={handleCycleVisualizer}
        onOpenShortcuts={() => setIsShortcutsOpen(true)}
      />

      {/* 15-Band Studio Equalizer Modal */}
      <EqualizerModal
        isOpen={isEqModalOpen}
        onClose={() => setIsEqModalOpen(false)}
        currentPreamp={preamp}
        currentGains={eqGains}
        isEqEnabled={isEqEnabled}
        selectedPresetName={selectedPresetName}
        onPreampChange={handlePreampChange}
        onGainChange={handleGainChange}
        onSelectPreset={handleSelectPreset}
        onToggleEq={handleToggleEq}
        onReset={handleResetEq}
      />

      {/* Audiophile FLAC Container Inspector Modal */}
      <FlacInspectorModal
        isOpen={isInspectorOpen}
        onClose={() => setIsInspectorOpen(false)}
        track={inspectedTrack}
      />

      {/* FLAC Health, Integrity & Fake-FLAC Checker Modal */}
      <FlacHealthCheckerModal
        isOpen={isHealthCheckerOpen}
        onClose={() => setIsHealthCheckerOpen(false)}
        track={healthCheckTrack}
      />

      {/* KDE Plasma Shortcuts Modal */}
      <ShortcutsModal isOpen={isShortcutsOpen} onClose={() => setIsShortcutsOpen(false)} />

      {/* Up Next Playback Queue Drawer */}
      <QueueDrawer
        isOpen={isQueueOpen}
        onClose={() => setIsQueueOpen(false)}
        queue={queue}
        currentTrack={currentTrack}
        onPlayQueueIndex={(index) => {
          const target = queue[index];
          setQueue((prev) => prev.filter((_, i) => i !== index));
          playTrack(target);
        }}
        onRemoveFromQueue={(index) => {
          setQueue((prev) => prev.filter((_, i) => i !== index));
        }}
        onClearQueue={() => setQueue([])}
      />
    </div>
  );
}
