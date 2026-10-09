export interface FlacStreamInfo {
  minBlockSize: number;
  maxBlockSize: number;
  minFrameSize: number;
  maxFrameSize: number;
  sampleRate: number;
  channels: number;
  bitsPerSample: number;
  totalSamples: number;
  md5: string;
}

export interface FlacHealthReport {
  magicHeaderValid: boolean;
  streamInfoValid: boolean;
  md5Verified: boolean;
  isMd5Zero: boolean;
  frameSyncVerified: boolean;
  vorbisCommentCount: number;
  essentialTagsPresent: {
    title: boolean;
    artist: boolean;
    album: boolean;
    date: boolean;
    trackNumber: boolean;
  };
  hasReplayGain: boolean;
  hasEmbeddedArtwork: boolean;
  effectiveHighFreqCutoffKhz: number;
  isSuspectTranscode: boolean;
  transcodeReason?: string;
  dynamicRangeDb: number;
  clippingPeakCount: number;
  compressionEfficiencyPct: number;
  healthScore: number; // 0 - 100
  verdict:
    | 'Genuine 24-bit Studio Master'
    | 'Authentic 16-bit Redbook Lossless'
    | 'Verified Lossless'
    | 'Minor Metadata Warnings'
    | 'Likely Transcoded / Fake FLAC';
  verdictColor: string;
}

export interface FlacMetadata {
  streamInfo?: FlacStreamInfo;
  vorbisComments: Record<string, string>;
  vendorString: string;
  coverArtBlobUrl?: string;
  healthReport?: FlacHealthReport;
}

export interface Track {
  id: string;
  title: string;
  artist: string;
  album: string;
  year?: string;
  genre?: string;
  trackNumber?: number;
  duration: number; // in seconds
  url: string;
  isCustom?: boolean;
  coverArtUrl?: string;
  fileSize?: number; // bytes
  format: 'flac' | 'wav' | 'alac' | 'other';
  bitDepth: number; // 16, 24, 32
  sampleRate: number; // 44100, 48000, 96000, 192000
  channels: number; // 1, 2, 6
  bitrate: number; // in kbps
  vorbisComments?: Record<string, string>;
  vendor?: string;
  md5?: string;
  healthReport?: FlacHealthReport;
}

export interface EqBandConfig {
  frequency: number;
  label: string;
  type: BiquadFilterType;
}

export interface EqPreset {
  name: string;
  description: string;
  preamp: number; // in dB (-12 to +12)
  gains: number[]; // 15 values for 15 bands
}

export type VisualizerMode =
  | 'bars'
  | 'wave'
  | 'radial'
  | 'vu'
  | 'spectrogram'
  | 'goniometer';

export type RepeatMode = 'off' | 'all' | 'one';

export interface Playlist {
  id: string;
  name: string;
  description?: string;
  createdAt: number;
  trackIds: string[];
}

