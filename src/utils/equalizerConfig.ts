import { EqBandConfig, EqPreset } from '../types/audio';

export const EQ_BANDS: EqBandConfig[] = [
  { frequency: 25, label: '25Hz', type: 'lowshelf' },
  { frequency: 40, label: '40Hz', type: 'peaking' },
  { frequency: 63, label: '63Hz', type: 'peaking' },
  { frequency: 100, label: '100Hz', type: 'peaking' },
  { frequency: 160, label: '160Hz', type: 'peaking' },
  { frequency: 250, label: '250Hz', type: 'peaking' },
  { frequency: 400, label: '400Hz', type: 'peaking' },
  { frequency: 630, label: '630Hz', type: 'peaking' },
  { frequency: 1000, label: '1kHz', type: 'peaking' },
  { frequency: 1600, label: '1.6kHz', type: 'peaking' },
  { frequency: 2500, label: '2.5kHz', type: 'peaking' },
  { frequency: 4000, label: '4kHz', type: 'peaking' },
  { frequency: 6300, label: '6.3kHz', type: 'peaking' },
  { frequency: 10000, label: '10kHz', type: 'peaking' },
  { frequency: 16000, label: '16kHz', type: 'highshelf' },
];

export const DEFAULT_EQ_PRESETS: EqPreset[] = [
  {
    name: 'Bit-Perfect Flat',
    description: 'Unprocessed studio monitor response for reference transparency',
    preamp: 0,
    gains: [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
  },
  {
    name: 'Plasma Audiophile Reference',
    description: 'Subtle acoustic low-end contour with airy high-frequency extension',
    preamp: -0.5,
    gains: [1.5, 1.2, 0.8, 0.4, 0, 0, 0, 0.2, 0.5, 0.8, 1.2, 1.5, 1.8, 2.2, 2.5],
  },
  {
    name: 'Breeze Deep Sub-Bass',
    description: 'Impactful sub-bass extension without muddying mid-range',
    preamp: -2.5,
    gains: [6.0, 5.5, 4.5, 3.0, 1.5, 0.5, 0, 0, 0, 0, 0, 0, 0.5, 1.0, 1.0],
  },
  {
    name: 'Vocal Clarity & Presence',
    description: 'Elevated dialogue, vocals, and speech intelligibility',
    preamp: -1.0,
    gains: [-2.0, -1.5, -1.0, 0, 1.0, 2.0, 3.2, 4.0, 3.5, 2.5, 1.5, 1.0, 0, -0.5, -1.0],
  },
  {
    name: 'KDE Warm Vinyl',
    description: 'Rich analog low-mids and vintage silk warmth',
    preamp: -1.0,
    gains: [3.5, 3.0, 2.5, 2.0, 1.2, 0.8, 0.2, 0.2, 0.5, 1.0, 1.2, 1.0, 0.5, 0, -0.5],
  },
  {
    name: 'Acoustic / Neo-Classical',
    description: 'Natural timbre for wooden instruments, cellos, and acoustic grand piano',
    preamp: -0.5,
    gains: [1.8, 2.0, 2.2, 1.5, 0.8, 0.2, 0, 0.5, 1.2, 1.8, 2.2, 2.5, 2.8, 3.0, 3.0],
  },
  {
    name: 'Electronic / Synthwave',
    description: 'Punchy 40Hz sub-kick with crisp 10kHz synthetic hi-hats',
    preamp: -2.0,
    gains: [5.5, 5.0, 4.0, 2.0, 0, -1.0, -0.5, 0.5, 1.5, 2.2, 2.8, 3.5, 4.0, 4.2, 3.8],
  },
  {
    name: 'Treble Shimmer & Air',
    description: 'Ultra-high frequency extension for soundstage breadth and micro-detail',
    preamp: -1.5,
    gains: [-1.0, -0.5, 0, 0, 0, 0, 0.2, 0.5, 1.0, 1.8, 2.8, 3.8, 4.8, 5.5, 6.0],
  },
  {
    name: 'Night Listening (Soft Dynamics)',
    description: 'Tames harsh peaks and levels bass for late night headphone sessions',
    preamp: 0,
    gains: [-2.0, -1.5, -1.0, 0, 0.5, 0.8, 1.0, 1.0, 0.8, 0.5, 0, -0.8, -1.5, -2.0, -2.5],
  },
];
