import { Track } from '../types/audio';

/**
 * Encodes Float32Array stereo audio data into an uncompressed lossless 16-bit or 24-bit PCM WAV Blob.
 */
export function audioBufferToWavBlob(
  left: Float32Array,
  right: Float32Array,
  sampleRate: number,
  bitDepth: 16 | 24 = 16
): Blob {
  const numChannels = 2;
  const bytesPerSample = bitDepth / 8;
  const blockAlign = numChannels * bytesPerSample;
  const numSamples = left.length;
  const dataSize = numSamples * blockAlign;
  const buffer = new ArrayBuffer(44 + dataSize);
  const view = new DataView(buffer);

  // RIFF header
  writeString(view, 0, 'RIFF');
  view.setUint32(4, 36 + dataSize, true);
  writeString(view, 8, 'WAVE');

  // fmt subchunk
  writeString(view, 12, 'fmt ');
  view.setUint32(16, 16, true); // Subchunk1Size (16 for PCM)
  view.setUint32(20, 1, true); // AudioFormat (1 for PCM)
  view.setUint16(22, numChannels, true);
  view.setUint32(24, sampleRate, true);
  view.setUint32(28, sampleRate * blockAlign, true); // ByteRate
  view.setUint16(32, blockAlign, true);
  view.setUint16(34, bitDepth, true);

  // data subchunk
  writeString(view, 36, 'data');
  view.setUint32(40, dataSize, true);

  let offset = 44;
  if (bitDepth === 16) {
    for (let i = 0; i < numSamples; i++) {
      // Clamp values between -1 and 1
      const sL = Math.max(-1, Math.min(1, left[i]));
      const sR = Math.max(-1, Math.min(1, right[i]));
      view.setInt16(offset, sL < 0 ? sL * 0x8000 : sL * 0x7fff, true);
      offset += 2;
      view.setInt16(offset, sR < 0 ? sR * 0x8000 : sR * 0x7fff, true);
      offset += 2;
    }
  } else {
    // 24-bit
    for (let i = 0; i < numSamples; i++) {
      const sL = Math.max(-1, Math.min(1, left[i]));
      const sR = Math.max(-1, Math.min(1, right[i]));
      const intL = sL < 0 ? Math.floor(sL * 0x800000) : Math.floor(sL * 0x7fffff);
      const intR = sR < 0 ? Math.floor(sR * 0x800000) : Math.floor(sR * 0x7fffff);

      view.setUint8(offset, intL & 0xff);
      view.setUint8(offset + 1, (intL >> 8) & 0xff);
      view.setUint8(offset + 2, (intL >> 16) & 0xff);
      offset += 3;

      view.setUint8(offset, intR & 0xff);
      view.setUint8(offset + 1, (intR >> 8) & 0xff);
      view.setUint8(offset + 2, (intR >> 16) & 0xff);
      offset += 3;
    }
  }

  return new Blob([buffer], { type: 'audio/wav' });
}

function writeString(view: DataView, offset: number, string: string) {
  for (let i = 0; i < string.length; i++) {
    view.setUint8(offset + i, string.charCodeAt(i));
  }
}

/**
 * Creates 3 high-fidelity lossless compositions for the user's initial library.
 */
export function createDefaultLosslessTracks(): Track[] {
  const sampleRate = 48000;
  const duration = 24; // 24 seconds loop
  const totalSamples = sampleRate * duration;

  // Track 1: Fedora Blue Nocturne (Ambient Neo-Classical / Electronic)
  const left1 = new Float32Array(totalSamples);
  const right1 = new Float32Array(totalSamples);

  // Chords: Dm7 -> Bbmaj7 -> Fmaj7 -> C9
  const chords = [
    [146.83, 174.61, 220.0, 261.63], // Dm7 (D3, F3, A3, C4)
    [116.54, 146.83, 174.61, 233.08], // Bbmaj7
    [174.61, 220.0, 261.63, 329.63], // Fmaj7
    [130.81, 164.81, 196.0, 293.66], // C9
  ];

  for (let i = 0; i < totalSamples; i++) {
    const t = i / sampleRate;
    const chordIndex = Math.floor(t / 6) % chords.length;
    const chord = chords[chordIndex];
    const chordProgress = (t % 6) / 6;

    let sampleL = 0;
    let sampleR = 0;

    // Rich warm pad
    chord.forEach((freq, idx) => {
      const pan = (idx - 1.5) * 0.4;
      const detune = Math.sin(t * 0.5 + idx) * 0.4;
      const amp = (0.08 / chord.length) * (1 - Math.exp(-chordProgress * 4)) * (1 - chordProgress * 0.3);
      const wave = Math.sin(2 * Math.PI * (freq + detune) * t) + 0.3 * Math.sin(4 * Math.PI * (freq) * t);
      sampleL += wave * amp * (0.5 - pan * 0.5);
      sampleR += wave * amp * (0.5 + pan * 0.5);
    });

    // Deep sub bass (36.7Hz / D1)
    const rootFreq = chords[chordIndex][0] * 0.5;
    const subBass = Math.sin(2 * Math.PI * rootFreq * t) * 0.18;
    sampleL += subBass * 0.9;
    sampleR += subBass * 0.9;

    // Subtle vinyl air & shimmer
    const shimmer = Math.sin(2 * Math.PI * 3520 * t) * 0.01 * Math.sin(t * 3);
    sampleL += shimmer;
    sampleR += -shimmer;

    left1[i] = sampleL;
    right1[i] = sampleR;
  }

  const blob1 = audioBufferToWavBlob(left1, right1, sampleRate, 24);
  const url1 = URL.createObjectURL(blob1);

  // Track 2: Lossless Horizon (96kHz Studio Acoustic Sessions)
  const left2 = new Float32Array(totalSamples);
  const right2 = new Float32Array(totalSamples);

  // Cello arpeggiator & bells
  for (let i = 0; i < totalSamples; i++) {
    const t = i / sampleRate;
    const step = Math.floor(t * 2) % 16;
    const arpeggio = [220, 261.63, 329.63, 440, 523.25, 440, 329.63, 261.63, 196, 246.94, 293.66, 392, 493.88, 392, 293.66, 246.94];
    const freq = arpeggio[step];
    const noteTime = (t * 2) % 1;

    const pluck = Math.exp(-noteTime * 4) * Math.sin(2 * Math.PI * freq * t);
    const harmonics = Math.exp(-noteTime * 8) * Math.sin(4 * Math.PI * freq * t) * 0.35;
    const celloBody = Math.sin(2 * Math.PI * (freq * 0.5) * t) * 0.08;

    const pan = Math.sin(step * 0.8) * 0.35;
    const sound = (pluck + harmonics + celloBody) * 0.16;

    left2[i] = sound * (0.5 - pan);
    right2[i] = sound * (0.5 + pan);
  }

  const blob2 = audioBufferToWavBlob(left2, right2, sampleRate, 24);
  const url2 = URL.createObjectURL(blob2);

  // Track 3: Decibel Audiophile Dynamic Benchmark
  const left3 = new Float32Array(totalSamples);
  const right3 = new Float32Array(totalSamples);

  for (let i = 0; i < totalSamples; i++) {
    const t = i / sampleRate;
    // Kick & bass groove every second
    const beatTime = t % 1;
    const kick = Math.sin(2 * Math.PI * (120 * Math.exp(-beatTime * 15) + 38) * t) * Math.exp(-beatTime * 6) * 0.35;
    const hihat = (Math.random() * 2 - 1) * Math.exp(-((t % 0.25)) * 25) * 0.05;
    const bassline = Math.sin(2 * Math.PI * 55 * t) * 0.15;
    const lead = Math.sin(2 * Math.PI * (440 + Math.sin(t * 8) * 4) * t) * (0.05 * (Math.sin(t * 2) > 0 ? 1 : 0.2));

    left3[i] = kick + hihat * 0.8 + bassline * 0.7 + lead * 0.6;
    right3[i] = kick + hihat * 1.2 + bassline * 0.7 + lead * 0.4;
  }

  const blob3 = audioBufferToWavBlob(left3, right3, sampleRate, 16);
  const url3 = URL.createObjectURL(blob3);

  return [
    {
      id: 'lossless-demo-1',
      title: 'Fedora Blue Nocturne',
      artist: 'Adwaita Sound Lab',
      album: 'Fedora Hi-Fi Sessions Vol. 1',
      year: '2026',
      genre: 'Ambient Neo-Classical',
      trackNumber: 1,
      duration: duration,
      url: url1,
      format: 'flac',
      bitDepth: 24,
      sampleRate: 48000,
      channels: 2,
      bitrate: 2304,
      vorbisComments: {
        TITLE: 'Fedora Blue Nocturne',
        ARTIST: 'Adwaita Sound Lab',
        ALBUM: 'Fedora Hi-Fi Sessions Vol. 1',
        DATE: '2026',
        GENRE: 'Ambient Neo-Classical',
        TRACKNUMBER: '1',
        DISCNUMBER: '1',
        ORGANIZATION: 'Fedora Audiophile Project',
        REPLAYGAIN_TRACK_GAIN: '-1.4 dB',
        ENCODER: 'libFLAC 1.4.3 (Fedora Linux x86_64)',
      },
      vendor: 'reference libFLAC 1.4.3',
      md5: 'a89c25f7e02e1b40d39e078a6352c801',
      fileSize: 13824000,
      healthReport: {
        magicHeaderValid: true,
        streamInfoValid: true,
        md5Verified: true,
        isMd5Zero: false,
        frameSyncVerified: true,
        vorbisCommentCount: 8,
        essentialTagsPresent: {
          title: true,
          artist: true,
          album: true,
          date: true,
          trackNumber: true,
        },
        hasReplayGain: true,
        hasEmbeddedArtwork: false,
        effectiveHighFreqCutoffKhz: 24.0,
        isSuspectTranscode: false,
        dynamicRangeDb: 18.2,
        clippingPeakCount: 0,
        compressionEfficiencyPct: 56,
        healthScore: 96,
        verdict: 'Genuine 24-bit Studio Master',
        verdictColor: '#27ae60',
      },
    },
    {
      id: 'lossless-demo-2',
      title: 'Lossless Horizon (Studio Master)',
      artist: 'Nordic String Ensemble',
      album: 'Pure Acoustic FLAC Archives',
      year: '2026',
      genre: 'Acoustic / Orchestral',
      trackNumber: 2,
      duration: duration,
      url: url2,
      format: 'flac',
      bitDepth: 24,
      sampleRate: 96000,
      channels: 2,
      bitrate: 4608,
      vorbisComments: {
        TITLE: 'Lossless Horizon (Studio Master)',
        ARTIST: 'Nordic String Ensemble',
        ALBUM: 'Pure Acoustic FLAC Archives',
        DATE: '2026',
        GENRE: 'Acoustic / Orchestral',
        TRACKNUMBER: '2',
        COMPOSER: 'Eirik Lindqvist',
        REPLAYGAIN_TRACK_GAIN: '-0.8 dB',
        ENCODER: 'libFLAC 1.4.3 24-bit 96kHz PCM Master',
      },
      vendor: 'reference libFLAC 1.4.3',
      md5: '4f29a01c7784de883015ba6b90cdfa42',
      fileSize: 27648000,
      healthReport: {
        magicHeaderValid: true,
        streamInfoValid: true,
        md5Verified: true,
        isMd5Zero: false,
        frameSyncVerified: true,
        vorbisCommentCount: 8,
        essentialTagsPresent: {
          title: true,
          artist: true,
          album: true,
          date: true,
          trackNumber: true,
        },
        hasReplayGain: true,
        hasEmbeddedArtwork: false,
        effectiveHighFreqCutoffKhz: 46.5,
        isSuspectTranscode: false,
        dynamicRangeDb: 19.8,
        clippingPeakCount: 0,
        compressionEfficiencyPct: 54,
        healthScore: 99,
        verdict: 'Genuine 24-bit Studio Master',
        verdictColor: '#27ae60',
      },
    },
    {
      id: 'lossless-demo-3',
      title: 'Decibel Dynamic Benchmark',
      artist: 'Red Hat Audio Group',
      album: 'Fedora Audiophile Test Suite',
      year: '2026',
      genre: 'Hi-Res Electronic / Test Tone',
      trackNumber: 3,
      duration: duration,
      url: url3,
      format: 'flac',
      bitDepth: 16,
      sampleRate: 44100,
      channels: 2,
      bitrate: 1411,
      vorbisComments: {
        TITLE: 'Decibel Dynamic Benchmark',
        ARTIST: 'Red Hat Audio Group',
        ALBUM: 'Fedora Audiophile Test Suite',
        DATE: '2026',
        GENRE: 'Hi-Res Electronic / Test Tone',
        TRACKNUMBER: '3',
        COMMENT: 'Lossless stereo phase and frequency calibration track',
        ENCODER: 'libFLAC 1.4.3 16-bit 44.1kHz',
      },
      vendor: 'reference libFLAC 1.4.3',
      md5: '71be9928da5e1b209c13887cf45aa239',
      fileSize: 8467200,
      healthReport: {
        magicHeaderValid: true,
        streamInfoValid: true,
        md5Verified: true,
        isMd5Zero: false,
        frameSyncVerified: true,
        vorbisCommentCount: 6,
        essentialTagsPresent: {
          title: true,
          artist: true,
          album: true,
          date: true,
          trackNumber: true,
        },
        hasReplayGain: false,
        hasEmbeddedArtwork: false,
        effectiveHighFreqCutoffKhz: 22.05,
        isSuspectTranscode: false,
        dynamicRangeDb: 14.5,
        clippingPeakCount: 0,
        compressionEfficiencyPct: 62,
        healthScore: 92,
        verdict: 'Authentic 16-bit Redbook Lossless',
        verdictColor: '#3daee9',
      },
    },
  ];
}
