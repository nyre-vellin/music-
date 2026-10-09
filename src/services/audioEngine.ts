import { EQ_BANDS } from '../utils/equalizerConfig';
import { Track } from '../types/audio';

class AudioEngine {
  private audioCtx: AudioContext | null = null;
  private audioElement: HTMLAudioElement;
  private sourceNode: MediaElementAudioSourceNode | null = null;
  private preampNode: GainNode | null = null;
  private eqFilters: BiquadFilterNode[] = [];
  private pannerNode: StereoPannerNode | null = null;
  private masterGainNode: GainNode | null = null;
  private analyserNode: AnalyserNode | null = null;

  // Dedicated Left & Right analysers for stereo goniometer and true dual VU metering
  private splitterNode: ChannelSplitterNode | null = null;
  private analyserLeft: AnalyserNode | null = null;
  private analyserRight: AnalyserNode | null = null;

  private isInitialized = false;

  private currentTrack: Track | null = null;
  private volume = 0.85;
  private isMuted = false;
  private pan = 0; // -1 to 1

  constructor() {
    this.audioElement = new Audio();
    this.audioElement.preload = 'auto';
    this.audioElement.crossOrigin = 'anonymous';
  }

  public getElement(): HTMLAudioElement {
    return this.audioElement;
  }

  public initContext(): void {
    if (this.isInitialized && this.audioCtx) {
      if (this.audioCtx.state === 'suspended') {
        this.audioCtx.resume();
      }
      return;
    }

    try {
      const AudioCtxClass =
        window.AudioContext ||
        (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
      this.audioCtx = new AudioCtxClass();

      // Preamp gain
      this.preampNode = this.audioCtx.createGain();
      this.preampNode.gain.value = 1.0;

      // Create 15 EQ filters
      this.eqFilters = EQ_BANDS.map((band) => {
        const filter = this.audioCtx!.createBiquadFilter();
        filter.type = band.type;
        filter.frequency.value = band.frequency;
        filter.gain.value = 0;
        filter.Q.value = 1.6;
        return filter;
      });

      // Panner node
      if (this.audioCtx.createStereoPanner) {
        this.pannerNode = this.audioCtx.createStereoPanner();
        this.pannerNode.pan.value = this.pan;
      }

      // Master gain
      this.masterGainNode = this.audioCtx.createGain();
      this.masterGainNode.gain.value = this.isMuted ? 0 : this.volume;

      // Master Analyser node
      this.analyserNode = this.audioCtx.createAnalyser();
      this.analyserNode.fftSize = 512;
      this.analyserNode.smoothingTimeConstant = 0.8;

      // Stereo Splitter and L/R Analysers
      this.splitterNode = this.audioCtx.createChannelSplitter(2);
      this.analyserLeft = this.audioCtx.createAnalyser();
      this.analyserRight = this.audioCtx.createAnalyser();
      this.analyserLeft.fftSize = 256;
      this.analyserRight.fftSize = 256;

      // Connect source to chain
      this.sourceNode = this.audioCtx.createMediaElementSource(this.audioElement);

      let prevNode: AudioNode = this.sourceNode;
      prevNode.connect(this.preampNode);
      prevNode = this.preampNode;

      for (const filter of this.eqFilters) {
        prevNode.connect(filter);
        prevNode = filter;
      }

      if (this.pannerNode) {
        prevNode.connect(this.pannerNode);
        prevNode = this.pannerNode;
      }

      prevNode.connect(this.masterGainNode);
      this.masterGainNode.connect(this.analyserNode);

      // Connect master to L/R splitter
      this.masterGainNode.connect(this.splitterNode);
      this.splitterNode.connect(this.analyserLeft, 0);
      this.splitterNode.connect(this.analyserRight, 1);

      this.analyserNode.connect(this.audioCtx.destination);

      this.isInitialized = true;
    } catch (e) {
      console.warn('Web Audio API initialization note:', e);
    }
  }

  public async loadTrack(track: Track): Promise<void> {
    this.currentTrack = track;
    this.initContext();

    this.audioElement.src = track.url;
    this.audioElement.load();

    this.updateMediaSession(track);
  }

  public async play(): Promise<void> {
    this.initContext();
    if (this.audioCtx && this.audioCtx.state === 'suspended') {
      await this.audioCtx.resume();
    }
    return this.audioElement.play();
  }

  public pause(): void {
    this.audioElement.pause();
  }

  public seek(seconds: number): void {
    if (isFinite(seconds) && this.audioElement.duration) {
      const clamped = Math.max(0, Math.min(seconds, this.audioElement.duration));
      this.audioElement.currentTime = clamped;
    }
  }

  public setVolume(val: number): void {
    this.volume = Math.max(0, Math.min(1, val));
    if (this.masterGainNode && !this.isMuted) {
      this.masterGainNode.gain.setTargetAtTime(this.volume, this.audioCtx?.currentTime || 0, 0.02);
    } else {
      this.audioElement.volume = this.isMuted ? 0 : this.volume;
    }
  }

  public setMute(muted: boolean): void {
    this.isMuted = muted;
    if (this.masterGainNode) {
      const target = muted ? 0 : this.volume;
      this.masterGainNode.gain.setTargetAtTime(target, this.audioCtx?.currentTime || 0, 0.02);
    } else {
      this.audioElement.muted = muted;
    }
  }

  public setPan(panVal: number): void {
    this.pan = Math.max(-1, Math.min(1, panVal));
    if (this.pannerNode && this.audioCtx) {
      this.pannerNode.pan.setTargetAtTime(this.pan, this.audioCtx.currentTime, 0.02);
    }
  }

  public setPlaybackRate(rate: number): void {
    this.audioElement.playbackRate = Math.max(0.5, Math.min(2.0, rate));
  }

  public setPreamp(dbGain: number): void {
    if (this.preampNode && this.audioCtx) {
      const linearGain = Math.pow(10, dbGain / 20);
      this.preampNode.gain.setTargetAtTime(linearGain, this.audioCtx.currentTime, 0.03);
    }
  }

  public setBandGain(bandIndex: number, dbGain: number): void {
    if (this.eqFilters[bandIndex] && this.audioCtx) {
      this.eqFilters[bandIndex].gain.setTargetAtTime(dbGain, this.audioCtx.currentTime, 0.03);
    }
  }

  public applyPresetGains(preampDb: number, gains: number[]): void {
    this.setPreamp(preampDb);
    gains.forEach((gain, idx) => {
      this.setBandGain(idx, gain);
    });
  }

  public getFrequencyData(array: Uint8Array): void {
    if (this.analyserNode) {
      this.analyserNode.getByteFrequencyData(array as unknown as Uint8Array<ArrayBuffer>);
    } else {
      array.fill(0);
    }
  }

  public getTimeDomainData(array: Uint8Array): void {
    if (this.analyserNode) {
      this.analyserNode.getByteTimeDomainData(array as unknown as Uint8Array<ArrayBuffer>);
    } else {
      array.fill(128);
    }
  }

  public getStereoTimeData(left: Uint8Array, right: Uint8Array): void {
    if (this.analyserLeft && this.analyserRight) {
      this.analyserLeft.getByteTimeDomainData(left as unknown as Uint8Array<ArrayBuffer>);
      this.analyserRight.getByteTimeDomainData(right as unknown as Uint8Array<ArrayBuffer>);
    } else {
      left.fill(128);
      right.fill(128);
    }
  }

  public getAnalyserNode(): AnalyserNode | null {
    return this.analyserNode;
  }

  public updateMediaSession(track: Track): void {
    if ('mediaSession' in navigator) {
      try {
        navigator.mediaSession.metadata = new MediaMetadata({
          title: track.title,
          artist: track.artist,
          album: track.album,
          artwork: [
            {
              src: track.coverArtUrl || '/icon.png',
              sizes: '512x512',
              type: 'image/png',
            },
          ],
        });
      } catch (err) {
        console.warn('MediaSession metadata error:', err);
      }
    }
  }
}

export const audioEngine = new AudioEngine();
