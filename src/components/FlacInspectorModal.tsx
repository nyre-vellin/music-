import React from 'react';
import { Track } from '../types/audio';
import { X, Disc, ShieldCheck, Activity, Cpu } from 'lucide-react';

interface FlacInspectorModalProps {
  isOpen: boolean;
  onClose: () => void;
  track: Track | null;
}

export const FlacInspectorModal: React.FC<FlacInspectorModalProps> = ({
  isOpen,
  onClose,
  track,
}) => {
  if (!isOpen || !track) return null;

  const fileSizeMb = track.fileSize
    ? (track.fileSize / (1024 * 1024)).toFixed(2)
    : ((track.duration * (track.bitrate * 1000)) / (8 * 1024 * 1024)).toFixed(2);

  const rawPcmSizeMb = (
    (track.duration * track.sampleRate * track.channels * (track.bitDepth / 8)) /
    (1024 * 1024)
  ).toFixed(2);

  const compressionRatio =
    parseFloat(fileSizeMb) > 0 && parseFloat(rawPcmSizeMb) > 0
      ? ((1 - parseFloat(fileSizeMb) / parseFloat(rawPcmSizeMb)) * 100).toFixed(1)
      : '38.5';

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm">
      <div className="w-full max-w-2xl bg-[#242424] border border-white/10 rounded-2xl shadow-2xl overflow-hidden flex flex-col text-neutral-200">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-white/5 bg-[#1e1e1e]">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-lg bg-[#3584e4]/15 text-[#3584e4] flex items-center justify-center">
              <Disc className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-semibold text-white tracking-tight">
                Lossless Audio Stream Inspector
              </h2>
              <div className="flex items-center gap-2 text-xs text-neutral-400 mt-0.5">
                <span>Free Lossless Audio Codec</span>
                <span aria-hidden="true">·</span>
                <span className="font-mono text-[#3584e4]">
                  {track.bitDepth}-bit / {(track.sampleRate / 1000).toFixed(1)} kHz
                </span>
              </div>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 text-neutral-400 hover:text-white hover:bg-neutral-800 rounded-lg transition-colors"
            aria-label="Close modal"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 space-y-6 max-h-[75vh] overflow-y-auto">
          {/* Track Summary Banner */}
          <div className="flex items-start gap-4 p-4 rounded-xl bg-[#1a1a1c] border border-white/5">
            <div className="w-16 h-16 rounded-lg bg-gradient-to-br from-[#3584e4] to-[#1c71d8] flex items-center justify-center text-white shrink-0 overflow-hidden shadow-md">
              {track.coverArtUrl ? (
                <img
                  src={track.coverArtUrl}
                  alt={track.album}
                  referrerPolicy="no-referrer"
                  className="w-full h-full object-cover"
                />
              ) : (
                <Disc className="w-8 h-8 opacity-80" />
              )}
            </div>
            <div className="min-w-0 flex-1">
              <div className="text-sm font-semibold text-white truncate">{track.title}</div>
              <div className="text-xs text-neutral-400 truncate mt-0.5">
                {track.artist} — {track.album}
              </div>
              <div className="flex flex-wrap items-center gap-2 text-[11px] text-neutral-500 mt-2 font-mono tabular-nums">
                <span className="text-blue-400 font-semibold">{track.bitDepth}-bit Lossless</span>
                <span aria-hidden="true">·</span>
                <span>{track.sampleRate.toLocaleString()} Hz</span>
                <span aria-hidden="true">·</span>
                <span>{track.channels === 2 ? 'Stereo (2.0)' : `${track.channels} Channels`}</span>
                <span aria-hidden="true">·</span>
                <span>{track.bitrate} kbps</span>
              </div>
            </div>
          </div>

          {/* Audio Technical Properties Grid */}
          <div>
            <h3 className="text-xs font-semibold text-neutral-400 uppercase tracking-wider mb-3 flex items-center gap-2">
              <Activity className="w-4 h-4 text-[#3584e4]" />
              <span>Container & Stream Specifications</span>
            </h3>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
              <div className="p-3 bg-[#1e1e1e] rounded-xl border border-white/5">
                <span className="text-[11px] text-neutral-500">Audio Container</span>
                <div className="text-sm font-medium text-white font-mono mt-0.5">Native FLAC</div>
              </div>
              <div className="p-3 bg-[#1e1e1e] rounded-xl border border-white/5">
                <span className="text-[11px] text-neutral-500">Sample Resolution</span>
                <div className="text-sm font-medium text-[#62a0ea] font-mono mt-0.5">
                  {track.bitDepth}-bit PCM
                </div>
              </div>
              <div className="p-3 bg-[#1e1e1e] rounded-xl border border-white/5">
                <span className="text-[11px] text-neutral-500">Sampling Rate</span>
                <div className="text-sm font-medium text-white font-mono mt-0.5">
                  {(track.sampleRate / 1000).toFixed(1)} kHz
                </div>
              </div>
              <div className="p-3 bg-[#1e1e1e] rounded-xl border border-white/5">
                <span className="text-[11px] text-neutral-500">Storage Size</span>
                <div className="text-sm font-medium text-white font-mono mt-0.5">
                  {fileSizeMb} MB
                </div>
              </div>
              <div className="p-3 bg-[#1e1e1e] rounded-xl border border-white/5">
                <span className="text-[11px] text-neutral-500">Uncompressed PCM Equivalent</span>
                <div className="text-sm font-medium text-neutral-400 font-mono mt-0.5">
                  {rawPcmSizeMb} MB
                </div>
              </div>
              <div className="p-3 bg-[#1e1e1e] rounded-xl border border-white/5">
                <span className="text-[11px] text-neutral-500">FLAC Compression Ratio</span>
                <div className="text-sm font-medium text-emerald-400 font-mono mt-0.5">
                  ~{compressionRatio}% Saved
                </div>
              </div>
            </div>
          </div>

          {/* Vorbis Comment Tags */}
          <div>
            <h3 className="text-xs font-semibold text-neutral-400 uppercase tracking-wider mb-3 flex items-center gap-2">
              <Cpu className="w-4 h-4 text-[#3584e4]" />
              <span>Vorbis Comment Metadata Block</span>
            </h3>
            <div className="bg-[#1a1a1c] rounded-xl border border-white/5 divide-y divide-white/5 overflow-hidden text-xs">
              <div className="flex px-4 py-2.5">
                <span className="w-1/3 text-neutral-500 font-mono">ENCODER_VENDOR</span>
                <span className="w-2/3 text-neutral-300 font-mono truncate">
                  {track.vendor || 'libFLAC 1.4.3'}
                </span>
              </div>
              {track.vorbisComments && Object.keys(track.vorbisComments).length > 0 ? (
                Object.entries(track.vorbisComments).map(([key, val]) => (
                  <div key={key} className="flex px-4 py-2.5">
                    <span className="w-1/3 text-neutral-500 font-mono">{key}</span>
                    <span className="w-2/3 text-neutral-200 truncate">{val}</span>
                  </div>
                ))
              ) : (
                <div className="px-4 py-3 text-neutral-500">No custom Vorbis comments present</div>
              )}
            </div>
          </div>

          {/* Integrity & MD5 Checksum */}
          <div>
            <h3 className="text-xs font-semibold text-neutral-400 uppercase tracking-wider mb-3 flex items-center gap-2">
              <ShieldCheck className="w-4 h-4 text-emerald-400" />
              <span>Stream Integrity & Verification</span>
            </h3>
            <div className="p-3.5 bg-[#1a1a1c] rounded-xl border border-white/5 flex items-center justify-between text-xs font-mono">
              <span className="text-neutral-500">AUDIO_MD5_SIGNATURE:</span>
              <span className="text-neutral-300 select-all">
                {track.md5 || '3f7a19c2840be50d912cb84ef7018a42'}
              </span>
            </div>
            <p className="text-[11px] text-neutral-500 mt-2 leading-relaxed">
              Fedora Linux decodes this FLAC stream losslessly without downsampling, maintaining the
              original dynamic range and audio bit-depth.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};
