/**
 * Procedural Web Audio Engine for Cat and Snake
 * 100% synthetic sound generation - zero network requests, zero latency, zero missing assets.
 */

export class AudioManager {
  constructor() {
    this.ctx = null;
    this.masterGain = null;
    this.sfxGain = null;
    this.ambientGain = null;
    this.isMuted = false;
    this.initialized = false;

    // Heartbeat loop state
    this.heartbeatInterval = null;
    this.lastHeartbeatTime = 0;
    this.heartbeatRate = 1.0; // beats per sec

    // Footstep timing
    this.lastStepTime = 0;

    // Ambient loop timer
    this.ambientTimer = null;

    // Load muted state from localStorage
    try {
      this.isMuted = localStorage.getItem('cat_snake_muted') === 'true';
    } catch {
      this.isMuted = false;
    }
  }

  init() {
    if (this.initialized) return;
    try {
      const AudioCtx = window.AudioContext || window.webkitAudioContext;
      if (!AudioCtx) return;
      this.ctx = new AudioCtx();

      this.masterGain = this.ctx.createGain();
      this.masterGain.gain.setValueAtTime(this.isMuted ? 0 : 0.8, this.ctx.currentTime);
      this.masterGain.connect(this.ctx.destination);

      this.sfxGain = this.ctx.createGain();
      this.sfxGain.gain.setValueAtTime(0.7, this.ctx.currentTime);
      this.sfxGain.connect(this.masterGain);

      this.ambientGain = this.ctx.createGain();
      this.ambientGain.gain.setValueAtTime(0.35, this.ctx.currentTime);
      this.ambientGain.connect(this.masterGain);

      this.initialized = true;
      this.startAmbient();
    } catch (e) {
      console.warn('Web Audio API not supported or blocked:', e);
    }
  }

  resume() {
    if (!this.ctx) {
      this.init();
    }
    if (this.ctx && this.ctx.state === 'suspended') {
      this.ctx.resume();
    }
  }

  toggleMute() {
    this.isMuted = !this.isMuted;
    try {
      localStorage.setItem('cat_snake_muted', this.isMuted.toString());
    } catch {}

    if (this.masterGain && this.ctx) {
      this.masterGain.gain.setTargetAtTime(this.isMuted ? 0 : 0.8, this.ctx.currentTime, 0.05);
    }
    return this.isMuted;
  }

  /**
   * Cat galloping footstep: Soft organic thud with light leaf rustle
   */
  playGallopStep(speedFactor = 1.0) {
    if (!this.initialized || this.isMuted || !this.ctx) return;
    const now = this.ctx.currentTime;
    if (now - this.lastStepTime < 0.12 / speedFactor) return;
    this.lastStepTime = now;

    // 1. Low muffled thud (paw striking soft jungle earth)
    const osc = this.ctx.createOscillator();
    const oscGain = this.ctx.createGain();
    osc.type = 'sine';
    const baseFreq = 75 + Math.random() * 20;
    osc.frequency.setValueAtTime(baseFreq, now);
    osc.frequency.exponentialRampToValueAtTime(32, now + 0.06);

    oscGain.gain.setValueAtTime(0.3, now);
    oscGain.gain.exponentialRampToValueAtTime(0.001, now + 0.06);

    osc.connect(oscGain);
    oscGain.connect(this.sfxGain);
    osc.start(now);
    osc.stop(now + 0.065);

    // 2. High dry foliage rustle (paw brushing dried leaves and moss)
    const bufferSize = Math.floor(this.ctx.sampleRate * 0.04);
    const buffer = this.ctx.createBuffer(1, bufferSize, this.ctx.sampleRate);
    const data = buffer.getChannelData(0);
    for (let i = 0; i < bufferSize; i++) {
      data[i] = (Math.random() * 2 - 1) * Math.exp(-i / (bufferSize * 0.4));
    }

    const noise = this.ctx.createBufferSource();
    noise.buffer = buffer;

    const filter = this.ctx.createBiquadFilter();
    filter.type = 'bandpass';
    filter.frequency.setValueAtTime(1400 + Math.random() * 400, now);
    filter.Q.setValueAtTime(1.8, now);

    const noiseGain = this.ctx.createGain();
    noiseGain.gain.setValueAtTime(0.12, now);
    noiseGain.gain.exponentialRampToValueAtTime(0.001, now + 0.04);

    noise.connect(filter);
    filter.connect(noiseGain);
    noiseGain.connect(this.sfxGain);
    noise.start(now);
  }

  /**
   * Terrifying Snake Hiss: Resonant high-pass noise with undulating breath envelope
   */
  playSnakeHiss(urgency = 0.5) {
    if (!this.initialized || this.isMuted || !this.ctx) return;
    const now = this.ctx.currentTime;
    const duration = 0.45 + Math.random() * 0.3;

    const bufferSize = Math.floor(this.ctx.sampleRate * duration);
    const buffer = this.ctx.createBuffer(1, bufferSize, this.ctx.sampleRate);
    const data = buffer.getChannelData(0);
    for (let i = 0; i < bufferSize; i++) {
      data[i] = Math.random() * 2 - 1;
    }

    const noise = this.ctx.createBufferSource();
    noise.buffer = buffer;

    const filter = this.ctx.createBiquadFilter();
    filter.type = 'bandpass';
    filter.frequency.setValueAtTime(3200 + urgency * 1500, now);
    filter.Q.setValueAtTime(4.0, now);

    const gain = this.ctx.createGain();
    const volume = 0.2 + urgency * 0.4;
    gain.gain.setValueAtTime(0.01, now);
    gain.gain.linearRampToValueAtTime(volume, now + 0.08);
    gain.gain.exponentialRampToValueAtTime(0.001, now + duration);

    noise.connect(filter);
    filter.connect(gain);
    gain.connect(this.sfxGain);
    noise.start(now);
  }

  /**
   * Tension Heartbeat: Double thump (lub-dub) when snake is within danger zone
   */
  triggerHeartbeat(dangerLevel = 0.5) {
    if (!this.initialized || this.isMuted || !this.ctx) return;
    const now = this.ctx.currentTime;
    const interval = Math.max(0.35, 1.1 - dangerLevel * 0.7);

    if (now - this.lastHeartbeatTime < interval) return;
    this.lastHeartbeatTime = now;

    const playThump = (time, pitch, vol) => {
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(pitch, time);
      osc.frequency.exponentialRampToValueAtTime(28, time + 0.12);

      gain.gain.setValueAtTime(vol, time);
      gain.gain.exponentialRampToValueAtTime(0.001, time + 0.12);

      osc.connect(gain);
      gain.connect(this.sfxGain);
      osc.start(time);
      osc.stop(time + 0.13);
    };

    const volume = 0.25 + dangerLevel * 0.35;
    // Lub
    playThump(now, 58 + dangerLevel * 15, volume);
    // Dub
    playThump(now + 0.14, 52 + dangerLevel * 12, volume * 0.85);
  }

  /**
   * Cat leap / jump whoosh
   */
  playJump() {
    if (!this.initialized || this.isMuted || !this.ctx) return;
    const now = this.ctx.currentTime;

    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    osc.type = 'triangle';
    osc.frequency.setValueAtTime(160, now);
    osc.frequency.exponentialRampToValueAtTime(420, now + 0.25);

    gain.gain.setValueAtTime(0.25, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.28);

    osc.connect(gain);
    gain.connect(this.sfxGain);
    osc.start(now);
    osc.stop(now + 0.3);
  }

  /**
   * Cat slide / crouch skid
   */
  playSlide() {
    if (!this.initialized || this.isMuted || !this.ctx) return;
    const now = this.ctx.currentTime;
    const duration = 0.35;

    const bufferSize = Math.floor(this.ctx.sampleRate * duration);
    const buffer = this.ctx.createBuffer(1, bufferSize, this.ctx.sampleRate);
    const data = buffer.getChannelData(0);
    for (let i = 0; i < bufferSize; i++) {
      data[i] = (Math.random() * 2 - 1) * Math.sin((i / bufferSize) * Math.PI);
    }

    const noise = this.ctx.createBufferSource();
    noise.buffer = buffer;

    const filter = this.ctx.createBiquadFilter();
    filter.type = 'lowpass';
    filter.frequency.setValueAtTime(900, now);

    const gain = this.ctx.createGain();
    gain.gain.setValueAtTime(0.35, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + duration);

    noise.connect(filter);
    filter.connect(gain);
    gain.connect(this.sfxGain);
    noise.start(now);
  }

  /**
   * Powerup / Berry / Relic pickup chimes (arpeggiated pentatonic tones)
   */
  playPickup(type = 'sun_berry') {
    if (!this.initialized || this.isMuted || !this.ctx) return;
    const now = this.ctx.currentTime;

    const freqs = type === 'relic' 
      ? [523.25, 659.25, 783.99, 1046.50, 1318.51] // C5 major arpeggio
      : [440, 554.37, 659.25, 880];               // A major shimmer

    freqs.forEach((freq, idx) => {
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      const t = now + idx * 0.055;

      osc.type = 'sine';
      osc.frequency.setValueAtTime(freq, t);

      gain.gain.setValueAtTime(0.2, t);
      gain.gain.exponentialRampToValueAtTime(0.001, t + 0.35);

      osc.connect(gain);
      gain.connect(this.sfxGain);
      osc.start(t);
      osc.stop(t + 0.38);
    });
  }

  /**
   * Obstacle collision / stumble thud
   */
  playStumble() {
    if (!this.initialized || this.isMuted || !this.ctx) return;
    const now = this.ctx.currentTime;

    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    osc.type = 'sawtooth';
    osc.frequency.setValueAtTime(140, now);
    osc.frequency.exponentialRampToValueAtTime(35, now + 0.22);

    const filter = this.ctx.createBiquadFilter();
    filter.type = 'lowpass';
    filter.frequency.setValueAtTime(380, now);

    gain.gain.setValueAtTime(0.5, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.25);

    osc.connect(filter);
    filter.connect(gain);
    gain.connect(this.sfxGain);
    osc.start(now);
    osc.stop(now + 0.26);

    // Add quick hissed breath
    this.playSnakeHiss(0.9);
  }

  /**
   * Dramatic game over stinger (descending minor chords & resonant snake snap)
   */
  playGameOver() {
    if (!this.initialized || this.isMuted || !this.ctx) return;
    const now = this.ctx.currentTime;

    const notes = [220, 174.61, 130.81, 98.00]; // Am descending
    notes.forEach((freq, idx) => {
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      const t = now + idx * 0.12;

      osc.type = 'sawtooth';
      osc.frequency.setValueAtTime(freq, t);

      const filter = this.ctx.createBiquadFilter();
      filter.type = 'lowpass';
      filter.frequency.setValueAtTime(450, t);

      gain.gain.setValueAtTime(0.35, t);
      gain.gain.exponentialRampToValueAtTime(0.001, t + 0.9);

      osc.connect(filter);
      filter.connect(gain);
      gain.connect(this.sfxGain);
      osc.start(t);
      osc.stop(t + 0.95);
    });

    // Sudden snake lunge snap
    this.playSnakeHiss(1.0);
  }

  /**
   * Generative Jungle Soundscape: Cicada resonance, gentle wind, distant tropical calls
   */
  startAmbient() {
    if (!this.initialized || !this.ctx) return;

    // Ambient wind breeze generator
    const bufferSize = this.ctx.sampleRate * 2;
    const buffer = this.ctx.createBuffer(1, bufferSize, this.ctx.sampleRate);
    const data = buffer.getChannelData(0);
    let lastOut = 0.0;
    for (let i = 0; i < bufferSize; i++) {
      const white = Math.random() * 2 - 1;
      data[i] = (lastOut + 0.02 * white) / 1.02;
      lastOut = data[i];
    }

    const windSource = this.ctx.createBufferSource();
    windSource.buffer = buffer;
    windSource.loop = true;

    const windFilter = this.ctx.createBiquadFilter();
    windFilter.type = 'bandpass';
    windFilter.frequency.setValueAtTime(280, this.ctx.currentTime);
    windFilter.Q.setValueAtTime(1.2, this.ctx.currentTime);

    const windGain = this.ctx.createGain();
    windGain.gain.setValueAtTime(0.18, this.ctx.currentTime);

    windSource.connect(windFilter);
    windFilter.connect(windGain);
    windGain.connect(this.ambientGain);
    windSource.start();

    // Occasional cicada and tree frog chirps
    const scheduleJungleCreature = () => {
      if (!this.initialized || !this.ctx || this.isMuted) {
        this.ambientTimer = setTimeout(scheduleJungleCreature, 3000);
        return;
      }

      const now = this.ctx.currentTime;
      // High pitched double chirps (cicadas)
      const chirpCount = 3 + Math.floor(Math.random() * 4);
      const baseFreq = 4200 + Math.random() * 1200;

      for (let i = 0; i < chirpCount; i++) {
        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();
        const t = now + i * 0.045;

        osc.type = 'triangle';
        osc.frequency.setValueAtTime(baseFreq, t);

        gain.gain.setValueAtTime(0.04, t);
        gain.gain.exponentialRampToValueAtTime(0.001, t + 0.035);

        osc.connect(gain);
        gain.connect(this.ambientGain);
        osc.start(t);
        osc.stop(t + 0.04);
      }

      const nextDelay = 2500 + Math.random() * 5000;
      this.ambientTimer = setTimeout(scheduleJungleCreature, nextDelay);
    };

    scheduleJungleCreature();
  }

  destroy() {
    if (this.ambientTimer) clearTimeout(this.ambientTimer);
    if (this.ctx) {
      this.ctx.close();
      this.ctx = null;
    }
  }
}
