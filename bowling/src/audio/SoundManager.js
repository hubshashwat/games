/**
 * Web Audio API Procedural Sound Engine
 * Generates all bowling sound effects synthetically without external assets.
 */

export class SoundManager {
  constructor() {
    this.ctx = null;
    this.masterGain = null;
    this.muted = false;
    this.volume = 0.8;

    // Rolling loop node references
    this.rollSource = null;
    this.rollFilter = null;
    this.rollGain = null;
    this.isRolling = false;

    this.initialized = false;
  }

  init() {
    if (this.initialized) return;
    try {
      const AudioCtx = window.AudioContext || window.webkitAudioContext;
      if (!AudioCtx) return;
      this.ctx = new AudioCtx();
      this.masterGain = this.ctx.createGain();
      this.masterGain.gain.setValueAtTime(this.muted ? 0 : this.volume, this.ctx.currentTime);
      this.masterGain.connect(this.ctx.destination);

      // Pre-create brown noise buffer for ball roll rumble
      this.createRollingLoop();
      this.initialized = true;
    } catch (e) {
      console.warn('Web Audio API not supported or blocked:', e);
    }
  }

  resumeContext() {
    if (this.ctx && this.ctx.state === 'suspended') {
      this.ctx.resume();
    }
  }

  setMuted(muted) {
    this.muted = muted;
    if (this.masterGain && this.ctx) {
      this.masterGain.gain.setTargetAtTime(muted ? 0 : this.volume, this.ctx.currentTime, 0.05);
    }
  }

  setVolume(vol) {
    this.volume = Math.max(0, Math.min(1, vol));
    if (this.masterGain && this.ctx && !this.muted) {
      this.masterGain.gain.setTargetAtTime(this.volume, this.ctx.currentTime, 0.05);
    }
  }

  createRollingLoop() {
    if (!this.ctx) return;
    // Generate 2 seconds of looping brown noise (sub-bass / rumble)
    const bufferSize = this.ctx.sampleRate * 2;
    const noiseBuffer = this.ctx.createBuffer(1, bufferSize, this.ctx.sampleRate);
    const output = noiseBuffer.getChannelData(0);
    let lastOut = 0.0;
    for (let i = 0; i < bufferSize; i++) {
      const white = Math.random() * 2 - 1;
      output[i] = (lastOut + (0.02 * white)) / 1.02;
      lastOut = output[i];
      output[i] *= 3.5; // Gain boost
    }

    this.noiseBuffer = noiseBuffer;
  }

  startRolling() {
    if (!this.ctx || this.isRolling) return;
    this.resumeContext();

    try {
      this.rollSource = this.ctx.createBufferSource();
      this.rollSource.buffer = this.noiseBuffer;
      this.rollSource.loop = true;

      this.rollFilter = this.ctx.createBiquadFilter();
      this.rollFilter.type = 'lowpass';
      this.rollFilter.frequency.setValueAtTime(120, this.ctx.currentTime);

      this.rollGain = this.ctx.createGain();
      this.rollGain.gain.setValueAtTime(0.001, this.ctx.currentTime);

      this.rollSource.connect(this.rollFilter);
      this.rollFilter.connect(this.rollGain);
      this.rollGain.connect(this.masterGain);

      this.rollSource.start(0);
      this.isRolling = true;
    } catch (e) {
      console.warn('Error starting roll sound:', e);
    }
  }

  updateRolling(speed, maxSpeed = 12) {
    if (!this.isRolling || !this.rollGain || !this.rollFilter || !this.ctx) return;
    const ratio = Math.max(0, Math.min(1, speed / maxSpeed));
    const targetFreq = 90 + ratio * 280;
    const targetGain = Math.pow(ratio, 1.2) * 0.45;

    this.rollFilter.frequency.setTargetAtTime(targetFreq, this.ctx.currentTime, 0.08);
    this.rollGain.gain.setTargetAtTime(targetGain, this.ctx.currentTime, 0.08);
  }

  stopRolling() {
    if (!this.isRolling) return;
    if (this.rollGain && this.ctx) {
      this.rollGain.gain.setTargetAtTime(0, this.ctx.currentTime, 0.1);
      setTimeout(() => {
        try {
          if (this.rollSource) {
            this.rollSource.stop();
            this.rollSource.disconnect();
          }
          this.isRolling = false;
        } catch (e) {}
      }, 120);
    } else {
      this.isRolling = false;
    }
  }

  // Realistic wooden pin impact sound
  playPinHit(impactForce = 1.0) {
    if (!this.ctx || this.muted) return;
    this.resumeContext();

    const t = this.ctx.currentTime;
    const clampedForce = Math.max(0.2, Math.min(2.5, impactForce));
    const vol = Math.min(0.85, 0.35 * clampedForce);

    // Primary resonant wood frequencies of hollow lacquered maple pin (~520Hz, 1080Hz, 1750Hz)
    const freqs = [
      480 + Math.random() * 80,
      1050 + Math.random() * 120,
      1780 + Math.random() * 200,
      2800 + Math.random() * 300
    ];

    freqs.forEach((freq, index) => {
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();

      osc.type = index % 2 === 0 ? 'triangle' : 'sine';
      osc.frequency.setValueAtTime(freq, t);
      osc.frequency.exponentialRampToValueAtTime(freq * 0.75, t + 0.12);

      const amp = vol * (1.0 / (index + 1.2));
      gain.gain.setValueAtTime(amp, t);
      gain.gain.exponentialRampToValueAtTime(0.0001, t + 0.08 + index * 0.04);

      osc.connect(gain);
      gain.connect(this.masterGain);

      osc.start(t);
      osc.stop(t + 0.25);
    });

    // Add wooden click/transient (narrow burst of white noise)
    const clickBuffer = this.ctx.createBuffer(1, this.ctx.sampleRate * 0.02, this.ctx.sampleRate);
    const data = clickBuffer.getChannelData(0);
    for (let i = 0; i < data.length; i++) {
      data[i] = (Math.random() * 2 - 1) * Math.exp(-i / (data.length * 0.25));
    }
    const clickSrc = this.ctx.createBufferSource();
    clickSrc.buffer = clickBuffer;

    const clickFilter = this.ctx.createBiquadFilter();
    clickFilter.type = 'bandpass';
    clickFilter.frequency.setValueAtTime(1400, t);
    clickFilter.Q.setValueAtTime(2.5, t);

    const clickGain = this.ctx.createGain();
    clickGain.gain.setValueAtTime(vol * 0.7, t);

    clickSrc.connect(clickFilter);
    clickFilter.connect(clickGain);
    clickGain.connect(this.masterGain);

    clickSrc.start(t);
  }

  // Pin-on-pin secondary collision (lighter wooden clatter)
  playPinClatter() {
    if (!this.ctx || this.muted) return;
    this.resumeContext();

    const count = 3 + Math.floor(Math.random() * 4);
    for (let i = 0; i < count; i++) {
      const delay = i * (0.03 + Math.random() * 0.04);
      setTimeout(() => {
        this.playPinHit(0.3 + Math.random() * 0.4);
      }, delay * 1000);
    }
  }

  // Gutter ball thud
  playGutterFall() {
    if (!this.ctx || this.muted) return;
    this.resumeContext();

    const t = this.ctx.currentTime;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();

    osc.type = 'sine';
    osc.frequency.setValueAtTime(95, t);
    osc.frequency.exponentialRampToValueAtTime(38, t + 0.18);

    gain.gain.setValueAtTime(0.5, t);
    gain.gain.exponentialRampToValueAtTime(0.001, t + 0.22);

    osc.connect(gain);
    gain.connect(this.masterGain);

    osc.start(t);
    osc.stop(t + 0.25);
  }

  // Bumper bounce
  playBumperBounce() {
    if (!this.ctx || this.muted) return;
    this.resumeContext();

    const t = this.ctx.currentTime;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();

    osc.type = 'triangle';
    osc.frequency.setValueAtTime(260, t);
    osc.frequency.exponentialRampToValueAtTime(120, t + 0.12);

    gain.gain.setValueAtTime(0.35, t);
    gain.gain.exponentialRampToValueAtTime(0.001, t + 0.15);

    osc.connect(gain);
    gain.connect(this.masterGain);

    osc.start(t);
    osc.stop(t + 0.16);
  }

  // Strike celebration fanfare + cheering
  playStrikeFanfare() {
    if (!this.ctx || this.muted) return;
    this.resumeContext();

    const chords = [
      [523.25, 659.25, 783.99],       // C Major
      [587.33, 739.99, 880.00],       // D Major
      [659.25, 830.61, 987.77],       // E Major
      [783.99, 987.77, 1174.66, 1567.98] // G Major octave punch
    ];

    const noteDuration = 0.14;
    chords.forEach((chord, i) => {
      const startTime = this.ctx.currentTime + i * noteDuration;
      chord.forEach(freq => {
        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();

        osc.type = i === chords.length - 1 ? 'triangle' : 'sawtooth';
        osc.frequency.setValueAtTime(freq, startTime);

        const duration = i === chords.length - 1 ? 0.9 : noteDuration * 0.9;
        gain.gain.setValueAtTime(0.12, startTime);
        gain.gain.exponentialRampToValueAtTime(0.001, startTime + duration);

        osc.connect(gain);
        gain.connect(this.masterGain);

        osc.start(startTime);
        osc.stop(startTime + duration);
      });
    });

    // Crowd cheer simulation (bandpassed resonant pink noise with swelling envelope)
    const cheerDuration = 2.2;
    const buffer = this.ctx.createBuffer(1, this.ctx.sampleRate * cheerDuration, this.ctx.sampleRate);
    const cheerData = buffer.getChannelData(0);
    let b0 = 0, b1 = 0, b2 = 0;
    for (let i = 0; i < cheerData.length; i++) {
      const white = Math.random() * 2 - 1;
      b0 = 0.99 * b0 + white * 0.05;
      b1 = 0.95 * b1 + white * 0.1;
      b2 = 0.85 * b2 + white * 0.2;
      cheerData[i] = (b0 + b1 + b2) * 0.4;
    }

    const cheerSrc = this.ctx.createBufferSource();
    cheerSrc.buffer = buffer;

    const cheerFilter = this.ctx.createBiquadFilter();
    cheerFilter.type = 'bandpass';
    cheerFilter.frequency.setValueAtTime(900, this.ctx.currentTime);
    cheerFilter.Q.setValueAtTime(1.2, this.ctx.currentTime);

    const cheerGain = this.ctx.createGain();
    const ct = this.ctx.currentTime + 0.2;
    cheerGain.gain.setValueAtTime(0.01, ct);
    cheerGain.gain.linearRampToValueAtTime(0.4, ct + 0.4);
    cheerGain.gain.exponentialRampToValueAtTime(0.001, ct + cheerDuration);

    cheerSrc.connect(cheerFilter);
    cheerFilter.connect(cheerGain);
    cheerGain.connect(this.masterGain);

    cheerSrc.start(ct);
  }

  // Spare jingle
  playSpareJingle() {
    if (!this.ctx || this.muted) return;
    this.resumeContext();

    const notes = [440, 554.37, 659.25, 880];
    notes.forEach((freq, idx) => {
      const t = this.ctx.currentTime + idx * 0.11;
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();

      osc.type = 'sine';
      osc.frequency.setValueAtTime(freq, t);

      gain.gain.setValueAtTime(0.2, t);
      gain.gain.exponentialRampToValueAtTime(0.001, t + 0.35);

      osc.connect(gain);
      gain.connect(this.masterGain);

      osc.start(t);
      osc.stop(t + 0.4);
    });
  }

  // Mechanical pinsetter sweep sound
  playPinsetterSweep() {
    if (!this.ctx || this.muted) return;
    this.resumeContext();

    const t = this.ctx.currentTime;

    // Motor servo hum
    const motorOsc = this.ctx.createOscillator();
    const motorGain = this.ctx.createGain();
    motorOsc.type = 'sawtooth';
    motorOsc.frequency.setValueAtTime(110, t);
    motorOsc.frequency.linearRampToValueAtTime(140, t + 0.6);
    motorOsc.frequency.linearRampToValueAtTime(95, t + 1.2);

    motorGain.gain.setValueAtTime(0.001, t);
    motorGain.gain.linearRampToValueAtTime(0.12, t + 0.2);
    motorGain.gain.exponentialRampToValueAtTime(0.001, t + 1.2);

    motorOsc.connect(motorGain);
    motorGain.connect(this.masterGain);

    motorOsc.start(t);
    motorOsc.stop(t + 1.25);

    // Brush/rake sweep friction
    const sweepBuffer = this.ctx.createBuffer(1, this.ctx.sampleRate * 1.0, this.ctx.sampleRate);
    const sData = sweepBuffer.getChannelData(0);
    for (let i = 0; i < sData.length; i++) {
      sData[i] = (Math.random() * 2 - 1) * 0.2;
    }
    const sweepSrc = this.ctx.createBufferSource();
    sweepSrc.buffer = sweepBuffer;

    const sweepFilter = this.ctx.createBiquadFilter();
    sweepFilter.type = 'bandpass';
    sweepFilter.frequency.setValueAtTime(650, t + 0.2);

    const sweepGain = this.ctx.createGain();
    sweepGain.gain.setValueAtTime(0.01, t + 0.1);
    sweepGain.gain.linearRampToValueAtTime(0.15, t + 0.4);
    sweepGain.gain.exponentialRampToValueAtTime(0.001, t + 1.1);

    sweepSrc.connect(sweepFilter);
    sweepFilter.connect(sweepGain);
    sweepGain.connect(this.masterGain);

    sweepSrc.start(t + 0.1);
  }

  // Pin rack drop / reset
  playPinsetterDrop() {
    if (!this.ctx || this.muted) return;
    this.resumeContext();

    for (let i = 0; i < 6; i++) {
      const t = this.ctx.currentTime + i * 0.035;
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();

      osc.type = 'triangle';
      osc.frequency.setValueAtTime(220 + Math.random() * 150, t);

      gain.gain.setValueAtTime(0.15, t);
      gain.gain.exponentialRampToValueAtTime(0.001, t + 0.08);

      osc.connect(gain);
      gain.connect(this.masterGain);

      osc.start(t);
      osc.stop(t + 0.1);
    }
  }

  // Light UI click
  playClick() {
    if (!this.ctx || this.muted) return;
    this.resumeContext();

    const t = this.ctx.currentTime;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();

    osc.type = 'sine';
    osc.frequency.setValueAtTime(800, t);
    osc.frequency.exponentialRampToValueAtTime(400, t + 0.04);

    gain.gain.setValueAtTime(0.15, t);
    gain.gain.exponentialRampToValueAtTime(0.001, t + 0.045);

    osc.connect(gain);
    gain.connect(this.masterGain);

    osc.start(t);
    osc.stop(t + 0.05);
  }
}

export const soundManager = new SoundManager();
