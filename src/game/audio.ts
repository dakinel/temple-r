/**
 * Procedural Web Audio API sound generator for Temple Run 3D.
 * Generates all SFX and rhythm drums dynamically with zero external audio assets.
 */

class SoundSystem {
  private ctx: AudioContext | null = null;
  public enabled: boolean = true;
  private musicInterval: number | null = null;
  private beatStep: number = 0;

  private initCtx() {
    if (!this.ctx) {
      const AudioCtx = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
      this.ctx = new AudioCtx();
    }
    if (this.ctx.state === 'suspended') {
      this.ctx.resume();
    }
  }

  // Coin collect sound: high pleasant chiming arpeggio
  public playCoin() {
    if (!this.enabled) return;
    this.initCtx();
    if (!this.ctx) return;

    const t = this.ctx.currentTime;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();

    osc.type = 'triangle';
    osc.frequency.setValueAtTime(987.77, t); // B5
    osc.frequency.exponentialRampToValueAtTime(1318.51, t + 0.08); // E6

    gain.gain.setValueAtTime(0.2, t);
    gain.gain.exponentialRampToValueAtTime(0.001, t + 0.18);

    osc.connect(gain);
    gain.connect(this.ctx.destination);

    osc.start(t);
    osc.stop(t + 0.2);
  }

  // Jump whoosh
  public playJump() {
    if (!this.enabled) return;
    this.initCtx();
    if (!this.ctx) return;

    const t = this.ctx.currentTime;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();

    osc.type = 'sine';
    osc.frequency.setValueAtTime(220, t);
    osc.frequency.exponentialRampToValueAtTime(580, t + 0.15);

    gain.gain.setValueAtTime(0.25, t);
    gain.gain.exponentialRampToValueAtTime(0.001, t + 0.25);

    osc.connect(gain);
    gain.connect(this.ctx.destination);

    osc.start(t);
    osc.stop(t + 0.26);
  }

  // Slide scrape
  public playSlide() {
    if (!this.enabled) return;
    this.initCtx();
    if (!this.ctx) return;

    const t = this.ctx.currentTime;
    const bufferSize = this.ctx.sampleRate * 0.25;
    const buffer = this.ctx.createBuffer(1, bufferSize, this.ctx.sampleRate);
    const data = buffer.getChannelData(0);
    for (let i = 0; i < bufferSize; i++) {
      data[i] = Math.random() * 2 - 1;
    }

    const noise = this.ctx.createBufferSource();
    noise.buffer = buffer;

    const filter = this.ctx.createBiquadFilter();
    filter.type = 'bandpass';
    filter.frequency.setValueAtTime(1200, t);
    filter.frequency.exponentialRampToValueAtTime(600, t + 0.25);
    filter.Q.value = 2.5;

    const gain = this.ctx.createGain();
    gain.gain.setValueAtTime(0.22, t);
    gain.gain.exponentialRampToValueAtTime(0.001, t + 0.25);

    noise.connect(filter);
    filter.connect(gain);
    gain.connect(this.ctx.destination);

    noise.start(t);
    noise.stop(t + 0.26);
  }

  // Quick turn swish
  public playTurn() {
    if (!this.enabled) return;
    this.initCtx();
    if (!this.ctx) return;

    const t = this.ctx.currentTime;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();

    osc.type = 'sine';
    osc.frequency.setValueAtTime(400, t);
    osc.frequency.exponentialRampToValueAtTime(200, t + 0.1);

    gain.gain.setValueAtTime(0.18, t);
    gain.gain.exponentialRampToValueAtTime(0.001, t + 0.12);

    osc.connect(gain);
    gain.connect(this.ctx.destination);

    osc.start(t);
    osc.stop(t + 0.13);
  }

  // Obstacle impact / Crash
  public playCrash() {
    if (!this.enabled) return;
    this.initCtx();
    if (!this.ctx) return;

    const t = this.ctx.currentTime;
    // Low punch
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    osc.type = 'sawtooth';
    osc.frequency.setValueAtTime(150, t);
    osc.frequency.exponentialRampToValueAtTime(30, t + 0.35);

    gain.gain.setValueAtTime(0.4, t);
    gain.gain.exponentialRampToValueAtTime(0.001, t + 0.4);

    osc.connect(gain);
    gain.connect(this.ctx.destination);
    osc.start(t);
    osc.stop(t + 0.42);

    // Noise burst
    const bufferSize = this.ctx.sampleRate * 0.3;
    const buffer = this.ctx.createBuffer(1, bufferSize, this.ctx.sampleRate);
    const data = buffer.getChannelData(0);
    for (let i = 0; i < bufferSize; i++) {
      data[i] = Math.random() * 2 - 1;
    }
    const noise = this.ctx.createBufferSource();
    noise.buffer = buffer;
    const filter = this.ctx.createBiquadFilter();
    filter.type = 'lowpass';
    filter.frequency.setValueAtTime(800, t);
    filter.frequency.linearRampToValueAtTime(100, t + 0.3);

    const noiseGain = this.ctx.createGain();
    noiseGain.gain.setValueAtTime(0.35, t);
    noiseGain.gain.exponentialRampToValueAtTime(0.001, t + 0.35);

    noise.connect(filter);
    filter.connect(noiseGain);
    noiseGain.connect(this.ctx.destination);
    noise.start(t);
    noise.stop(t + 0.35);
  }

  // Heavy robotic foot-plant landing thud + servo absorb
  public playLand() {
    if (!this.enabled) return;
    this.initCtx();
    if (!this.ctx) return;

    const t = this.ctx.currentTime;

    // Low impact thump
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    osc.type = 'sine';
    osc.frequency.setValueAtTime(145, t);
    osc.frequency.exponentialRampToValueAtTime(42, t + 0.14);
    gain.gain.setValueAtTime(0.32, t);
    gain.gain.exponentialRampToValueAtTime(0.001, t + 0.16);
    osc.connect(gain);
    gain.connect(this.ctx.destination);
    osc.start(t);
    osc.stop(t + 0.17);

    // Subtle crisp floor scuff
    const bufferSize = Math.floor(this.ctx.sampleRate * 0.08);
    const buffer = this.ctx.createBuffer(1, bufferSize, this.ctx.sampleRate);
    const data = buffer.getChannelData(0);
    for (let i = 0; i < bufferSize; i++) {
      data[i] = (Math.random() * 2 - 1) * (1 - i / bufferSize);
    }
    const noise = this.ctx.createBufferSource();
    noise.buffer = buffer;
    const filter = this.ctx.createBiquadFilter();
    filter.type = 'bandpass';
    filter.frequency.setValueAtTime(520, t);
    filter.Q.value = 1.4;
    const noiseGain = this.ctx.createGain();
    noiseGain.gain.setValueAtTime(0.16, t);
    noiseGain.gain.exponentialRampToValueAtTime(0.001, t + 0.08);
    noise.connect(filter);
    filter.connect(noiseGain);
    noiseGain.connect(this.ctx.destination);
    noise.start(t);
    noise.stop(t + 0.09);
  }

  // Heavy Stone Wall Explosion (sub-bass boom + shattering rock rumble + debris clatter)
  public playStoneExplosion(heavy = true) {
    if (!this.enabled) return;
    this.initCtx();
    if (!this.ctx) return;

    const t = this.ctx.currentTime;
    const duration = heavy ? 0.65 : 0.24;

    // 1. Sub-bass shockwave boom
    const subOsc = this.ctx.createOscillator();
    const subGain = this.ctx.createGain();
    subOsc.type = 'triangle';
    subOsc.frequency.setValueAtTime(heavy ? 115 : 160, t);
    subOsc.frequency.exponentialRampToValueAtTime(22, t + (heavy ? 0.45 : 0.18));
    subGain.gain.setValueAtTime(heavy ? 0.52 : 0.24, t);
    subGain.gain.exponentialRampToValueAtTime(0.001, t + (heavy ? 0.48 : 0.2));
    subOsc.connect(subGain);
    subGain.connect(this.ctx.destination);
    subOsc.start(t);
    subOsc.stop(t + 0.5);

    // 2. Rock shatter roar (lowpass filtered noise)
    const bufferSize = Math.floor(this.ctx.sampleRate * duration);
    const buffer = this.ctx.createBuffer(1, bufferSize, this.ctx.sampleRate);
    const data = buffer.getChannelData(0);
    for (let i = 0; i < bufferSize; i++) {
      const env = Math.pow(1 - i / bufferSize, 1.3);
      // Add crackling rock transients
      const crackle = Math.random() < 0.08 ? 1.8 : 1.0;
      data[i] = (Math.random() * 2 - 1) * env * crackle;
    }

    const noise = this.ctx.createBufferSource();
    noise.buffer = buffer;

    const lowpass = this.ctx.createBiquadFilter();
    lowpass.type = 'lowpass';
    lowpass.frequency.setValueAtTime(heavy ? 1800 : 1200, t);
    lowpass.frequency.exponentialRampToValueAtTime(180, t + duration);

    const roarGain = this.ctx.createGain();
    roarGain.gain.setValueAtTime(heavy ? 0.48 : 0.22, t);
    roarGain.gain.exponentialRampToValueAtTime(0.001, t + duration);

    noise.connect(lowpass);
    lowpass.connect(roarGain);
    roarGain.connect(this.ctx.destination);
    noise.start(t);
    noise.stop(t + duration + 0.02);
  }

  // Cinematic Red Candlestick Crash Cascade (deep bearish gong + staggered heavy bar slams)
  public playCandlestickCrash() {
    if (!this.enabled) return;
    this.initCtx();
    if (!this.ctx) return;

    const t = this.ctx.currentTime;

    // 1. Deep ominous bearish market-crash horn/gong swell
    const gong = this.ctx.createOscillator();
    const gongGain = this.ctx.createGain();
    gong.type = 'sawtooth';
    gong.frequency.setValueAtTime(98, t);
    gong.frequency.exponentialRampToValueAtTime(34, t + 1.15);

    const gongFilter = this.ctx.createBiquadFilter();
    gongFilter.type = 'lowpass';
    gongFilter.frequency.setValueAtTime(420, t);
    gongFilter.frequency.exponentialRampToValueAtTime(90, t + 1.15);

    gongGain.gain.setValueAtTime(0.32, t);
    gongGain.gain.exponentialRampToValueAtTime(0.001, t + 1.2);

    gong.connect(gongFilter);
    gongFilter.connect(gongGain);
    gongGain.connect(this.ctx.destination);
    gong.start(t);
    gong.stop(t + 1.25);

    // 2. Staggered heavy candlestick floor slams (thud + metallic clink)
    const impactTimes = [0.22, 0.36, 0.49, 0.64, 0.82];
    impactTimes.forEach((offset, idx) => {
      if (!this.ctx) return;
      const it = t + offset;
      const slam = this.ctx.createOscillator();
      const slamGain = this.ctx.createGain();
      slam.type = 'triangle';
      slam.frequency.setValueAtTime(140 - idx * 12, it);
      slam.frequency.exponentialRampToValueAtTime(28, it + 0.22);
      slamGain.gain.setValueAtTime(0.28 - idx * 0.03, it);
      slamGain.gain.exponentialRampToValueAtTime(0.001, it + 0.24);
      slam.connect(slamGain);
      slamGain.connect(this.ctx.destination);
      slam.start(it);
      slam.stop(it + 0.25);

      const clink = this.ctx.createOscillator();
      const clinkGain = this.ctx.createGain();
      clink.type = 'square';
      clink.frequency.setValueAtTime(520 + idx * 70, it);
      clink.frequency.exponentialRampToValueAtTime(190, it + 0.09);
      clinkGain.gain.setValueAtTime(0.06, it);
      clinkGain.gain.exponentialRampToValueAtTime(0.001, it + 0.1);
      clink.connect(clinkGain);
      clinkGain.connect(this.ctx.destination);
      clink.start(it);
      clink.stop(it + 0.11);
    });
  }

  // Distinct Corner Wall Crash: massive sandstone monolith slam + bronze resonance + crystalline rune shatter
  public playCornerWallCrash() {
    if (!this.enabled) return;
    this.initCtx();
    if (!this.ctx) return;

    const t = this.ctx.currentTime;

    // 1. Massive Sub-Bass Sandstone Wall Slam
    const sub = this.ctx.createOscillator();
    const subGain = this.ctx.createGain();
    sub.type = 'sine';
    sub.frequency.setValueAtTime(135, t);
    sub.frequency.exponentialRampToValueAtTime(24, t + 0.55);
    subGain.gain.setValueAtTime(0.65, t);
    subGain.gain.exponentialRampToValueAtTime(0.001, t + 0.6);
    sub.connect(subGain);
    subGain.connect(this.ctx.destination);
    sub.start(t);
    sub.stop(t + 0.62);

    // 2. Temple Bronze & Sandstone Wall Resonance Boom
    const bronze = this.ctx.createOscillator();
    const bronzeGain = this.ctx.createGain();
    bronze.type = 'triangle';
    bronze.frequency.setValueAtTime(210, t);
    bronze.frequency.exponentialRampToValueAtTime(52, t + 0.72);
    bronzeGain.gain.setValueAtTime(0.32, t);
    bronzeGain.gain.exponentialRampToValueAtTime(0.001, t + 0.75);
    bronze.connect(bronzeGain);
    bronzeGain.connect(this.ctx.destination);
    bronze.start(t);
    bronze.stop(t + 0.78);

    // 3. Crystalline Turquoise Glyph & Stone Shatter Burst
    const bufferSize = Math.floor(this.ctx.sampleRate * 0.65);
    const buffer = this.ctx.createBuffer(1, bufferSize, this.ctx.sampleRate);
    const data = buffer.getChannelData(0);
    for (let i = 0; i < bufferSize; i++) {
      const env = Math.pow(1 - i / bufferSize, 1.45);
      data[i] = (Math.random() * 2 - 1) * env;
    }
    const noise = this.ctx.createBufferSource();
    noise.buffer = buffer;
    const bandpass = this.ctx.createBiquadFilter();
    bandpass.type = 'bandpass';
    bandpass.frequency.setValueAtTime(2400, t);
    bandpass.frequency.exponentialRampToValueAtTime(320, t + 0.6);
    bandpass.Q.value = 1.6;
    const noiseGain = this.ctx.createGain();
    noiseGain.gain.setValueAtTime(0.45, t);
    noiseGain.gain.exponentialRampToValueAtTime(0.001, t + 0.65);
    noise.connect(bandpass);
    bandpass.connect(noiseGain);
    noiseGain.connect(this.ctx.destination);
    noise.start(t);
    noise.stop(t + 0.66);

    // 4. Staggered Turquoise Crystal Rune Shards Chiming on Floor
    [1380, 1740, 2120, 1520].forEach((freq, idx) => {
      if (!this.ctx) return;
      const st = t + 0.08 + idx * 0.065;
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(freq, st);
      osc.frequency.exponentialRampToValueAtTime(freq * 0.65, st + 0.16);
      gain.gain.setValueAtTime(0.11, st);
      gain.gain.exponentialRampToValueAtTime(0.001, st + 0.17);
      osc.connect(gain);
      gain.connect(this.ctx.destination);
      osc.start(st);
      osc.stop(st + 0.18);
    });
  }

  // Falling down abyss scream/whoosh
  public playFall() {
    if (!this.enabled) return;
    this.initCtx();
    if (!this.ctx) return;

    const t = this.ctx.currentTime;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();

    osc.type = 'sawtooth';
    osc.frequency.setValueAtTime(450, t);
    osc.frequency.exponentialRampToValueAtTime(60, t + 0.8);

    gain.gain.setValueAtTime(0.3, t);
    gain.gain.exponentialRampToValueAtTime(0.001, t + 0.8);

    osc.connect(gain);
    gain.connect(this.ctx.destination);

    osc.start(t);
    osc.stop(t + 0.82);
  }

  // Powerup activation
  public playPowerup() {
    if (!this.enabled) return;
    this.initCtx();
    if (!this.ctx) return;

    const t = this.ctx.currentTime;
    const notes = [440, 554.37, 659.25, 880];
    notes.forEach((freq, idx) => {
      if (!this.ctx) return;
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      const noteTime = t + idx * 0.06;

      osc.type = 'sine';
      osc.frequency.setValueAtTime(freq, noteTime);

      gain.gain.setValueAtTime(0.18, noteTime);
      gain.gain.exponentialRampToValueAtTime(0.001, noteTime + 0.15);

      osc.connect(gain);
      gain.connect(this.ctx.destination);

      osc.start(noteTime);
      osc.stop(noteTime + 0.16);
    });
  }

  // NYSE Trading Bell Opening Chime
  public playTradingBell() {
    if (!this.enabled) return;
    this.initCtx();
    if (!this.ctx) return;

    const t = this.ctx.currentTime;
    [0, 0.14, 0.28, 0.42].forEach((offset) => {
      if (!this.ctx) return;
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      osc.type = 'triangle';
      osc.frequency.setValueAtTime(1244.51, t + offset);
      gain.gain.setValueAtTime(0.25, t + offset);
      gain.gain.exponentialRampToValueAtTime(0.001, t + offset + 0.35);
      osc.connect(gain);
      gain.connect(this.ctx.destination);
      osc.start(t + offset);
      osc.stop(t + offset + 0.36);
    });
  }

  // Procedural jungle rhythm drum beat (plays while running)
  public startJungleDrums() {
    if (this.musicInterval) return;
    this.beatStep = 0;
    this.musicInterval = window.setInterval(() => {
      if (!this.enabled) return;
      this.initCtx();
      if (!this.ctx) return;

      const t = this.ctx.currentTime;
      const step = this.beatStep % 8;
      this.beatStep++;

      // Bass drum on beats 0, 3, 6
      if (step === 0 || step === 3 || step === 6) {
        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();
        osc.frequency.setValueAtTime(110, t);
        osc.frequency.exponentialRampToValueAtTime(38, t + 0.12);
        gain.gain.setValueAtTime(step === 0 ? 0.35 : 0.22, t);
        gain.gain.exponentialRampToValueAtTime(0.001, t + 0.14);
        osc.connect(gain);
        gain.connect(this.ctx.destination);
        osc.start(t);
        osc.stop(t + 0.15);
      }

      // Shaker/snare on steps 2, 4, 7
      if (step === 2 || step === 4 || step === 7) {
        const bufferSize = Math.floor(this.ctx.sampleRate * 0.05);
        const buffer = this.ctx.createBuffer(1, bufferSize, this.ctx.sampleRate);
        const data = buffer.getChannelData(0);
        for (let i = 0; i < bufferSize; i++) {
          data[i] = Math.random() * 2 - 1;
        }
        const noise = this.ctx.createBufferSource();
        noise.buffer = buffer;

        const filter = this.ctx.createBiquadFilter();
        filter.type = 'highpass';
        filter.frequency.setValueAtTime(3500, t);

        const gain = this.ctx.createGain();
        gain.gain.setValueAtTime(step === 4 ? 0.15 : 0.08, t);
        gain.gain.exponentialRampToValueAtTime(0.001, t + 0.06);

        noise.connect(filter);
        filter.connect(gain);
        gain.connect(this.ctx.destination);
        noise.start(t);
        noise.stop(t + 0.07);
      }
    }, 140);
  }

  public stopJungleDrums() {
    if (this.musicInterval) {
      clearInterval(this.musicInterval);
      this.musicInterval = null;
    }
  }

  public toggleMute() {
    this.enabled = !this.enabled;
    if (!this.enabled) {
      this.stopJungleDrums();
    } else {
      this.startJungleDrums();
    }
    return this.enabled;
  }
}

export const sound = new SoundSystem();
