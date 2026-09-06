// Synthesized Web Audio Soundscapes (Zero external audio file downloads needed)

export type SoundscapeType = 'rain' | 'night' | 'campfire' | 'waves' | 'brown-noise';

export interface SoundscapeOption {
  id: SoundscapeType;
  name: string;
  emoji: string;
  desc: string;
}

export const SOUNDSCAPES: SoundscapeOption[] = [
  { id: 'rain', name: 'Gentle Rain', emoji: '🌧️', desc: 'Soft soothing rainfall' },
  { id: 'night', name: 'Silent Night & Crickets', emoji: '🌙', desc: 'Evening meadow ambiance' },
  { id: 'campfire', name: 'Warm Hearth & Fire', emoji: '🔥', desc: 'Crackling fireside warmth' },
  { id: 'waves', name: 'Ocean Waves', emoji: '🌊', desc: 'Rhythmic, meditative surf' },
  { id: 'brown-noise', name: 'Deep Brown Noise', emoji: '☕', desc: 'Restful mind-calming hum' },
];

class SoundscapeEngine {
  private ctx: AudioContext | null = null;
  private currentType: SoundscapeType | null = null;
  private masterGain: GainNode | null = null;
  private activeNodes: { stop?: () => void; disconnect?: () => void }[] = [];
  private volume: number = 0.4;
  private timerId: any = null;

  private getAudioContext(): AudioContext {
    if (!this.ctx || this.ctx.state === 'closed') {
      const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
      this.ctx = new AudioCtx();
    }
    if (this.ctx.state === 'suspended') {
      this.ctx.resume();
    }
    return this.ctx;
  }

  public setVolume(val: number) {
    this.volume = Math.max(0, Math.min(1, val));
    if (this.masterGain && this.ctx) {
      this.masterGain.gain.setValueAtTime(this.volume, this.ctx.currentTime);
    }
  }

  public getVolume(): number {
    return this.volume;
  }

  public getCurrent(): SoundscapeType | null {
    return this.currentType;
  }

  public isPlaying(): boolean {
    return this.currentType !== null;
  }

  public stop() {
    if (this.timerId) {
      clearInterval(this.timerId);
      this.timerId = null;
    }
    this.activeNodes.forEach((node) => {
      try {
        if (node.stop) node.stop();
        if (node.disconnect) node.disconnect();
      } catch (e) {}
    });
    this.activeNodes = [];
    this.currentType = null;
  }

  public play(type: SoundscapeType) {
    this.stop();
    const ctx = this.getAudioContext();
    this.currentType = type;

    const master = ctx.createGain();
    master.gain.setValueAtTime(this.volume, ctx.currentTime);
    master.connect(ctx.destination);
    this.masterGain = master;

    if (type === 'rain') {
      this.createRain(ctx, master);
    } else if (type === 'night') {
      this.createNight(ctx, master);
    } else if (type === 'campfire') {
      this.createCampfire(ctx, master);
    } else if (type === 'waves') {
      this.createWaves(ctx, master);
    } else if (type === 'brown-noise') {
      this.createBrownNoise(ctx, master);
    }
  }

  private createNoiseBuffer(ctx: AudioContext, seconds = 5): AudioBuffer {
    const bufferSize = ctx.sampleRate * seconds;
    const buffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
    const data = buffer.getChannelData(0);
    let lastOut = 0.0;
    for (let i = 0; i < bufferSize; i++) {
      const white = Math.random() * 2 - 1;
      // Pinkish/brownish filter
      lastOut = (lastOut + 0.02 * white) / 1.02;
      data[i] = lastOut * 3.5;
    }
    return buffer;
  }

  private createRain(ctx: AudioContext, destination: AudioNode) {
    const noiseBuffer = this.createNoiseBuffer(ctx, 4);
    const noise = ctx.createBufferSource();
    noise.buffer = noiseBuffer;
    noise.loop = true;

    const filter = ctx.createBiquadFilter();
    filter.type = 'lowpass';
    filter.frequency.setValueAtTime(800, ctx.currentTime);

    const rainGain = ctx.createGain();
    rainGain.gain.setValueAtTime(0.5, ctx.currentTime);

    noise.connect(filter);
    filter.connect(rainGain);
    rainGain.connect(destination);

    noise.start();
    this.activeNodes.push(noise);

    // Random raindrops
    this.timerId = setInterval(() => {
      if (this.currentType !== 'rain') return;
      try {
        const drop = ctx.createOscillator();
        const dropGain = ctx.createGain();
        drop.frequency.setValueAtTime(600 + Math.random() * 800, ctx.currentTime);
        dropGain.gain.setValueAtTime(0.04 * Math.random(), ctx.currentTime);
        dropGain.gain.exponentialRampToValueAtTime(0.0001, ctx.currentTime + 0.05);

        drop.connect(dropGain);
        dropGain.connect(destination);
        drop.start();
        drop.stop(ctx.currentTime + 0.06);
      } catch (e) {}
    }, 150);
  }

  private createNight(ctx: AudioContext, destination: AudioNode) {
    // Low calm air
    const noiseBuffer = this.createNoiseBuffer(ctx, 4);
    const noise = ctx.createBufferSource();
    noise.buffer = noiseBuffer;
    noise.loop = true;

    const filter = ctx.createBiquadFilter();
    filter.type = 'lowpass';
    filter.frequency.setValueAtTime(400, ctx.currentTime);

    const airGain = ctx.createGain();
    airGain.gain.setValueAtTime(0.2, ctx.currentTime);

    noise.connect(filter);
    filter.connect(airGain);
    airGain.connect(destination);
    noise.start();
    this.activeNodes.push(noise);

    // Crickets chirp rhythm
    this.timerId = setInterval(() => {
      if (this.currentType !== 'night') return;
      try {
        const osc = ctx.createOscillator();
        const oscGain = ctx.createGain();
        osc.type = 'sine';
        osc.frequency.setValueAtTime(4500 + Math.random() * 200, ctx.currentTime);

        const now = ctx.currentTime;
        oscGain.gain.setValueAtTime(0.0001, now);
        oscGain.gain.linearRampToValueAtTime(0.03, now + 0.03);
        oscGain.gain.linearRampToValueAtTime(0.0001, now + 0.08);

        osc.connect(oscGain);
        oscGain.connect(destination);
        osc.start(now);
        osc.stop(now + 0.09);
      } catch (e) {}
    }, 450);
  }

  private createCampfire(ctx: AudioContext, destination: AudioNode) {
    const noiseBuffer = this.createNoiseBuffer(ctx, 4);
    const noise = ctx.createBufferSource();
    noise.buffer = noiseBuffer;
    noise.loop = true;

    const lowpass = ctx.createBiquadFilter();
    lowpass.type = 'lowpass';
    lowpass.frequency.setValueAtTime(350, ctx.currentTime);

    const fireGain = ctx.createGain();
    fireGain.gain.setValueAtTime(0.35, ctx.currentTime);

    noise.connect(lowpass);
    lowpass.connect(fireGain);
    fireGain.connect(destination);
    noise.start();
    this.activeNodes.push(noise);

    // Crackle snaps
    this.timerId = setInterval(() => {
      if (this.currentType !== 'campfire') return;
      if (Math.random() > 0.4) {
        try {
          const pop = ctx.createBuffer(1, ctx.sampleRate * 0.04, ctx.sampleRate);
          const data = pop.getChannelData(0);
          for (let i = 0; i < data.length; i++) {
            data[i] = (Math.random() * 2 - 1) * Math.exp(-i / 150);
          }
          const popSrc = ctx.createBufferSource();
          popSrc.buffer = pop;
          const popGain = ctx.createGain();
          popGain.gain.setValueAtTime(0.08 * Math.random(), ctx.currentTime);
          popSrc.connect(popGain);
          popGain.connect(destination);
          popSrc.start();
        } catch (e) {}
      }
    }, 180);
  }

  private createWaves(ctx: AudioContext, destination: AudioNode) {
    const noiseBuffer = this.createNoiseBuffer(ctx, 6);
    const noise = ctx.createBufferSource();
    noise.buffer = noiseBuffer;
    noise.loop = true;

    const filter = ctx.createBiquadFilter();
    filter.type = 'lowpass';
    filter.frequency.setValueAtTime(500, ctx.currentTime);

    // Undulating wave LFO
    const waveGain = ctx.createGain();
    waveGain.gain.setValueAtTime(0.1, ctx.currentTime);

    const lfo = ctx.createOscillator();
    lfo.frequency.setValueAtTime(0.15, ctx.currentTime); // one wave every ~6.5 seconds
    const lfoGain = ctx.createGain();
    lfoGain.gain.setValueAtTime(0.35, ctx.currentTime);

    lfo.connect(lfoGain);
    lfoGain.connect(waveGain.gain);

    noise.connect(filter);
    filter.connect(waveGain);
    waveGain.connect(destination);

    lfo.start();
    noise.start();
    this.activeNodes.push(noise, lfo);
  }

  private createBrownNoise(ctx: AudioContext, destination: AudioNode) {
    const bufferSize = ctx.sampleRate * 5;
    const buffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
    const data = buffer.getChannelData(0);
    let last = 0;
    for (let i = 0; i < bufferSize; i++) {
      const white = Math.random() * 2 - 1;
      last = (last + 0.02 * white) / 1.02;
      data[i] = last * 3.5;
    }

    const noise = ctx.createBufferSource();
    noise.buffer = buffer;
    noise.loop = true;

    const filter = ctx.createBiquadFilter();
    filter.type = 'lowpass';
    filter.frequency.setValueAtTime(250, ctx.currentTime);

    const gain = ctx.createGain();
    gain.gain.setValueAtTime(0.45, ctx.currentTime);

    noise.connect(filter);
    filter.connect(gain);
    gain.connect(destination);
    noise.start();
    this.activeNodes.push(noise);
  }
}

export const soundscapeService = new SoundscapeEngine();
