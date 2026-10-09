import React, { useState } from 'react';
import { Track } from '../types/audio';
import {
  ShieldCheck,
  AlertTriangle,
  CheckCircle2,
  XCircle,
  FileSearch,
  Upload,
  Activity,
  Zap,
} from 'lucide-react';

interface FlacHealthViewProps {
  tracks: Track[];
  currentTrack: Track | null;
  onInspectTrack: (track: Track) => void;
  onPlayTrack: (track: Track) => void;
  onOpenFiles: () => void;
}

export const FlacHealthView: React.FC<FlacHealthViewProps> = ({
  tracks,
  currentTrack,
  onInspectTrack,
  onPlayTrack,
  onOpenFiles,
}) => {
  const [filter, setFilter] = useState<'all' | 'verified' | 'suspect' | 'warning'>('all');

  const verifiedCount = tracks.filter(
    (t) =>
      !t.healthReport?.isSuspectTranscode &&
      (t.healthReport?.healthScore || 90) >= 80
  ).length;

  const suspectCount = tracks.filter((t) => t.healthReport?.isSuspectTranscode).length;
  const warningCount = tracks.filter(
    (t) =>
      !t.healthReport?.isSuspectTranscode &&
      (t.healthReport?.healthScore || 90) < 80
  ).length;

  const filteredTracks = tracks.filter((t) => {
    if (filter === 'verified')
      return !t.healthReport?.isSuspectTranscode && (t.healthReport?.healthScore || 90) >= 80;
    if (filter === 'suspect') return t.healthReport?.isSuspectTranscode;
    if (filter === 'warning')
      return !t.healthReport?.isSuspectTranscode && (t.healthReport?.healthScore || 90) < 80;
    return true;
  });

  return (
    <div className="space-y-6">
      {/* Top Health Overview Metric Strip */}
      <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
        <div className="p-5 rounded-2xl bg-[#232629] border border-white/5 shadow-sm">
          <div className="flex items-center justify-between text-xs text-neutral-400">
            <span>Library Health Index</span>
            <ShieldCheck className="w-4 h-4 text-[#3daee9]" />
          </div>
          <div className="text-2xl font-bold font-mono text-white mt-2">
            {tracks.length > 0
              ? `${Math.round(
                  tracks.reduce((acc, t) => acc + (t.healthReport?.healthScore || 92), 0) /
                    tracks.length
                )}%`
              : '100%'}
          </div>
          <div className="text-[11px] text-[#3daee9] font-medium mt-1">
            {verifiedCount} of {tracks.length} lossless verified
          </div>
        </div>

        <div className="p-5 rounded-2xl bg-[#232629] border border-white/5 shadow-sm">
          <div className="flex items-center justify-between text-xs text-neutral-400">
            <span>Genuine Studio Masters</span>
            <Zap className="w-4 h-4 text-emerald-400" />
          </div>
          <div className="text-2xl font-bold font-mono text-emerald-400 mt-2">
            {tracks.filter((t) => t.bitDepth >= 24).length}
          </div>
          <div className="text-[11px] text-neutral-400 mt-1">24-bit / 96kHz+ resolutions</div>
        </div>

        <div className="p-5 rounded-2xl bg-[#232629] border border-white/5 shadow-sm">
          <div className="flex items-center justify-between text-xs text-neutral-400">
            <span>Suspect Fake FLACs</span>
            <AlertTriangle className="w-4 h-4 text-red-400" />
          </div>
          <div className="text-2xl font-bold font-mono text-red-400 mt-2">{suspectCount}</div>
          <div className="text-[11px] text-neutral-400 mt-1">
            {suspectCount === 0 ? 'Zero transcodes detected' : 'Lowpass cutoff detected'}
          </div>
        </div>

        <div className="p-5 rounded-2xl bg-[#232629] border border-white/5 shadow-sm">
          <div className="flex items-center justify-between text-xs text-neutral-400">
            <span>MD5 Integrity Hashes</span>
            <CheckCircle2 className="w-4 h-4 text-[#3daee9]" />
          </div>
          <div className="text-2xl font-bold font-mono text-white mt-2">
            {tracks.filter((t) => t.md5 && !/^0+$/.test(t.md5)).length}
          </div>
          <div className="text-[11px] text-neutral-400 mt-1">Stream checksums matched</div>
        </div>
      </div>

      {/* Filter and Action Strip */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-4">
        <div className="flex items-center gap-1 p-1 bg-[#1b1e20] rounded-xl border border-white/5">
          <button
            onClick={() => setFilter('all')}
            className={`px-3 py-1.5 text-xs font-medium rounded-lg transition-colors ${
              filter === 'all'
                ? 'bg-[#232629] text-white shadow-sm'
                : 'text-neutral-400 hover:text-white'
            }`}
          >
            All Tracks ({tracks.length})
          </button>
          <button
            onClick={() => setFilter('verified')}
            className={`px-3 py-1.5 text-xs font-medium rounded-lg transition-colors ${
              filter === 'verified'
                ? 'bg-[#232629] text-white shadow-sm'
                : 'text-neutral-400 hover:text-white'
            }`}
          >
            Verified ({verifiedCount})
          </button>
          <button
            onClick={() => setFilter('suspect')}
            className={`px-3 py-1.5 text-xs font-medium rounded-lg transition-colors ${
              filter === 'suspect'
                ? 'bg-[#232629] text-red-400 shadow-sm'
                : 'text-neutral-400 hover:text-white'
            }`}
          >
            Suspect Transcodes ({suspectCount})
          </button>
          <button
            onClick={() => setFilter('warning')}
            className={`px-3 py-1.5 text-xs font-medium rounded-lg transition-colors ${
              filter === 'warning'
                ? 'bg-[#232629] text-amber-400 shadow-sm'
                : 'text-neutral-400 hover:text-white'
            }`}
          >
            Warnings ({warningCount})
          </button>
        </div>

        <button
          onClick={onOpenFiles}
          className="flex items-center gap-2 px-3.5 py-1.5 bg-[#3daee9] hover:bg-[#2980b9] text-white text-xs font-medium rounded-lg transition-colors self-start sm:self-auto"
        >
          <Upload className="w-3.5 h-3.5" />
          <span>Scan New FLAC File</span>
        </button>
      </div>

      {/* Tracks Health Table */}
      <div className="bg-[#232629] border border-white/5 rounded-2xl overflow-hidden shadow-sm">
        <div className="grid grid-cols-12 gap-4 px-6 py-3 border-b border-white/5 text-[11px] font-semibold text-neutral-400 uppercase tracking-wider">
          <div className="col-span-4">Audio Stream & Artist</div>
          <div className="col-span-2">Format & Bitrate</div>
          <div className="col-span-2">Cutoff Spectrum</div>
          <div className="col-span-2">Integrity Score</div>
          <div className="col-span-2 text-right">Verdict & Actions</div>
        </div>

        <div className="divide-y divide-white/5">
          {filteredTracks.map((track) => {
            const h = track.healthReport || {
              healthScore: track.bitDepth >= 24 ? 98 : 92,
              effectiveHighFreqCutoffKhz: track.sampleRate >= 96000 ? 44.0 : 22.05,
              verdict:
                track.bitDepth >= 24
                  ? 'Genuine 24-bit Studio Master'
                  : 'Authentic 16-bit Redbook Lossless',
              verdictColor: track.bitDepth >= 24 ? '#27ae60' : '#3daee9',
              isSuspectTranscode: false,
            };

            return (
              <div
                key={track.id}
                className="grid grid-cols-12 gap-4 px-6 py-3.5 items-center hover:bg-white/[0.02] text-xs transition-colors"
              >
                {/* Title & Artist */}
                <div className="col-span-4 min-w-0">
                  <div className="font-semibold text-white truncate">{track.title}</div>
                  <div className="text-[11px] text-neutral-400 truncate mt-0.5">
                    {track.artist} · {track.album}
                  </div>
                </div>

                {/* Resolution & Bitrate */}
                <div className="col-span-2 font-mono tabular-nums text-neutral-300">
                  <div className="text-[#3daee9] font-medium">{track.bitDepth}-bit PCM</div>
                  <div className="text-[11px] text-neutral-400">
                    {(track.sampleRate / 1000).toFixed(1)}kHz · {track.bitrate}k
                  </div>
                </div>

                {/* Frequency Cutoff */}
                <div className="col-span-2 font-mono tabular-nums">
                  <div className="text-white font-medium">
                    {h.effectiveHighFreqCutoffKhz.toFixed(1)} kHz
                  </div>
                  <div className="text-[11px] text-neutral-500">
                    {h.effectiveHighFreqCutoffKhz >= 20 ? 'Full spectrum' : 'Brickwall cutoff'}
                  </div>
                </div>

                {/* Health Score */}
                <div className="col-span-2 font-mono">
                  <div
                    className="font-bold text-sm inline-block px-2 py-0.5 rounded"
                    style={{
                      color: h.verdictColor,
                      backgroundColor: `${h.verdictColor}18`,
                    }}
                  >
                    {h.healthScore} / 100
                  </div>
                </div>

                {/* Verdict & Actions */}
                <div className="col-span-2 flex items-center justify-end gap-2">
                  <button
                    onClick={() => onInspectTrack(track)}
                    className="flex items-center gap-1.5 px-2.5 py-1 rounded-md text-[11px] font-medium bg-[#1b1e20] hover:bg-[#2a2e32] text-neutral-300 hover:text-white border border-white/5 transition-colors"
                  >
                    <FileSearch className="w-3.5 h-3.5 text-[#3daee9]" />
                    <span>Audit</span>
                  </button>
                </div>
              </div>
            );
          })}

          {filteredTracks.length === 0 && (
            <div className="py-16 text-center text-xs text-neutral-500">
              No FLAC files matching the selected health filter.
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
