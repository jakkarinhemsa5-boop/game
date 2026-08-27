/**
 * Audio Engine for "Needle in the Ocean"
 * 100% Procedural Web Audio API sound synthesis
 */

class SoundEngine {
  constructor() {
    this.ctx = null;
    this.isMuted = false;
    this.isInitialized = false;

    // Ambient / Continuous audio nodes
    this.engineGain = null;
    this.engineOsc = null;
    this.ambientGain = null;
    this.lowO2Osc = null;
    this.lowO2Gain = null;
    this.isAlarmPlaying = false;
  }

  init() {
    if (this.isInitialized) return;
    try {
      const AudioCtx = window.AudioContext || window.webkitAudioContext;
      this.ctx = new AudioCtx();
      this.setupContinuousAudio();
      this.isInitialized = true;
    } catch (e) {
      console.warn("Web Audio API not supported:", e);
    }
  }

  resume() {
    if (this.ctx && this.ctx.state === 'suspended') {
      this.ctx.resume();
    }
  }

  setupContinuousAudio() {
    if (!this.ctx) return;

    // 1. Submarine Ambient Drone / Ocean Rumble
    const ambientOsc = this.ctx.createOscillator();
    ambientOsc.type = 'sine';
    ambientOsc.frequency.setValueAtTime(55, this.ctx.currentTime); // Low 55Hz rumble

    const ambientFilter = this.ctx.createBiquadFilter();
    ambientFilter.type = 'lowpass';
    ambientFilter.frequency.setValueAtTime(120, this.ctx.currentTime);

    this.ambientGain = this.ctx.createGain();
    this.ambientGain.gain.setValueAtTime(0.08, this.ctx.currentTime);

    ambientOsc.connect(ambientFilter);
    ambientFilter.connect(this.ambientGain);
    this.ambientGain.connect(this.ctx.destination);
    ambientOsc.start();

    // 2. Thruster Engine Hum
    this.engineOsc = this.ctx.createOscillator();
    this.engineOsc.type = 'triangle';
    this.engineOsc.frequency.setValueAtTime(90, this.ctx.currentTime);

    this.engineGain = this.ctx.createGain();
    this.engineGain.gain.setValueAtTime(0.02, this.ctx.currentTime);

    const engineFilter = this.ctx.createBiquadFilter();
    engineFilter.type = 'lowpass';
    engineFilter.frequency.setValueAtTime(220, this.ctx.currentTime);

    this.engineOsc.connect(engineFilter);
    engineFilter.connect(this.engineGain);
    this.engineGain.connect(this.ctx.destination);
    this.engineOsc.start();
  }

  updateEngineSound(speedRatio) {
    if (!this.ctx || this.isMuted || !this.engineGain) return;
    const now = this.ctx.currentTime;
    const targetGain = 0.02 + speedRatio * 0.08;
    const targetFreq = 80 + speedRatio * 85;

    this.engineGain.gain.setTargetAtTime(targetGain, now, 0.1);
    this.engineOsc.frequency.setTargetAtTime(targetFreq, now, 0.1);
  }

  // Sonar Ping: Pitch & Volume scale with proximity
  playSonarPing(closenessRatio, isDecoy = false) {
    if (!this.ctx || this.isMuted) return;
    this.resume();

    const now = this.ctx.currentTime;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();

    // Base pitch shifts from 520Hz (far) up to 1800Hz (extremely close)
    let freq = 520 + closenessRatio * 1300;
    if (isDecoy) {
      freq *= 0.85; // Decoys have lower duller tone
      osc.type = 'sawtooth';
    } else {
      osc.type = 'sine';
    }

    osc.frequency.setValueAtTime(freq, now);
    osc.frequency.exponentialRampToValueAtTime(freq * 0.7, now + 0.18);

    const vol = 0.15 + closenessRatio * 0.25;
    gain.gain.setValueAtTime(vol, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.22);

    osc.connect(gain);
    gain.connect(this.ctx.destination);

    osc.start(now);
    osc.stop(now + 0.25);
  }

  // Sparkle / Glint chime when flashlight shines on the metallic needle
  playGlintChime() {
    if (!this.ctx || this.isMuted) return;
    this.resume();

    const now = this.ctx.currentTime;
    const notes = [2093, 2793, 3520]; // High crystal arpeggio C7, F7, A7

    notes.forEach((freq, idx) => {
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      const noteTime = now + idx * 0.04;

      osc.type = 'sine';
      osc.frequency.setValueAtTime(freq, noteTime);

      gain.gain.setValueAtTime(0.08, noteTime);
      gain.gain.exponentialRampToValueAtTime(0.0001, noteTime + 0.35);

      osc.connect(gain);
      gain.connect(this.ctx.destination);

      osc.start(noteTime);
      osc.stop(noteTime + 0.4);
    });
  }

  // Magnetic grab success & level victory fanfare
  playRecoverySuccess() {
    if (!this.ctx || this.isMuted) return;
    this.resume();

    const now = this.ctx.currentTime;

    // Upward sweep
    const sweepOsc = this.ctx.createOscillator();
    const sweepGain = this.ctx.createGain();
    sweepOsc.type = 'triangle';
    sweepOsc.frequency.setValueAtTime(200, now);
    sweepOsc.frequency.exponentialRampToValueAtTime(1400, now + 0.4);

    sweepGain.gain.setValueAtTime(0.2, now);
    sweepGain.gain.exponentialRampToValueAtTime(0.01, now + 0.5);

    sweepOsc.connect(sweepGain);
    sweepGain.connect(this.ctx.destination);
    sweepOsc.start(now);
    sweepOsc.stop(now + 0.55);

    // Chime chords: E6 -> G#6 -> B6 -> E7
    const chord = [1318.5, 1661.2, 1975.5, 2637.0];
    chord.forEach((freq, i) => {
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      const startTime = now + 0.25 + i * 0.08;

      osc.type = 'sine';
      osc.frequency.setValueAtTime(freq, startTime);

      gain.gain.setValueAtTime(0.18, startTime);
      gain.gain.exponentialRampToValueAtTime(0.001, startTime + 0.8);

      osc.connect(gain);
      gain.connect(this.ctx.destination);

      osc.start(startTime);
      osc.stop(startTime + 0.85);
    });
  }

  // Penalty error buzzer (false scan)
  playPenaltyBuzzer() {
    if (!this.ctx || this.isMuted) return;
    this.resume();

    const now = this.ctx.currentTime;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();

    osc.type = 'sawtooth';
    osc.frequency.setValueAtTime(110, now);
    osc.frequency.setValueAtTime(80, now + 0.1);

    gain.gain.setValueAtTime(0.25, now);
    gain.gain.exponentialRampToValueAtTime(0.01, now + 0.3);

    osc.connect(gain);
    gain.connect(this.ctx.destination);

    osc.start(now);
    osc.stop(now + 0.32);
  }

  // Ocean current change sound
  playCurrentSurge() {
    if (!this.ctx || this.isMuted) return;
    this.resume();

    const now = this.ctx.currentTime;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    const filter = this.ctx.createBiquadFilter();

    osc.type = 'sawtooth';
    osc.frequency.setValueAtTime(60, now);

    filter.type = 'lowpass';
    filter.frequency.setValueAtTime(120, now);
    filter.frequency.linearRampToValueAtTime(450, now + 0.6);
    filter.frequency.linearRampToValueAtTime(100, now + 1.2);

    gain.gain.setValueAtTime(0.01, now);
    gain.gain.linearRampToValueAtTime(0.15, now + 0.6);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 1.25);

    osc.connect(filter);
    filter.connect(gain);
    gain.connect(this.ctx.destination);

    osc.start(now);
    osc.stop(now + 1.3);
  }

  // Low oxygen critical alarm
  setLowOxygenAlarm(active) {
    if (!this.ctx || this.isMuted) return;

    if (active && !this.isAlarmPlaying) {
      this.isAlarmPlaying = true;
      this.alarmInterval = setInterval(() => {
        if (!this.isAlarmPlaying || this.isMuted || !this.ctx) return;
        const now = this.ctx.currentTime;
        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();

        osc.type = 'square';
        osc.frequency.setValueAtTime(880, now);
        osc.frequency.setValueAtTime(660, now + 0.12);

        gain.gain.setValueAtTime(0.1, now);
        gain.gain.exponentialRampToValueAtTime(0.001, now + 0.25);

        osc.connect(gain);
        gain.connect(this.ctx.destination);

        osc.start(now);
        osc.stop(now + 0.28);
      }, 700);
    } else if (!active && this.isAlarmPlaying) {
      this.isAlarmPlaying = false;
      if (this.alarmInterval) clearInterval(this.alarmInterval);
    }
  }

  toggleMute() {
    this.isMuted = !this.isMuted;
    if (this.ctx) {
      if (this.isMuted) {
        if (this.ambientGain) this.ambientGain.gain.setValueAtTime(0, this.ctx.currentTime);
        if (this.engineGain) this.engineGain.gain.setValueAtTime(0, this.ctx.currentTime);
      } else {
        if (this.ambientGain) this.ambientGain.gain.setValueAtTime(0.08, this.ctx.currentTime);
      }
    }
    return !this.isMuted;
  }
}

window.soundEngine = new SoundEngine();
