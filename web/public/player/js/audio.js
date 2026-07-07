/**
 * audio.js — Web Audio API Synthesized Audio System
 * 无需外部音频文件，全部通过 Web Audio API 动态合成。
 * BGM: 5 种题材氛围音乐 | SFX: 6 种交互音效
 */

window.AudioSystem = class AudioSystem {

  constructor() {
    this.ctx = null;
    this._initContext();

    this.SFX_EVENTS = [
      'choice_made', 'stat_increase', 'stat_decrease',
      'chapter_transition', 'interaction', 'notification'
    ];

    this._bgmVolume = 0.25;
    this._sfxVolume = 0.5;
    this.sfxEnabled = true;
    this.bgmEnabled = true;

    this._bgmNodes = [];
    this._bgmInterval = null;
    this._currentGenre = null;
  }

  _initContext() {
    try {
      this.ctx = new (window.AudioContext || window.webkitAudioContext)();
    } catch (e) {
      console.warn('Web Audio API not available');
    }
  }

  _ensureContext() {
    if (!this.ctx) this._initContext();
    if (this.ctx && this.ctx.state === 'suspended') {
      this.ctx.resume();
    }
    return this.ctx;
  }

  /* ================================================================
   * BGM Synthesis — 5 Genres
   * ================================================================ */

  setBGM(genre) {
    this._stopBGM();
    if (!this.bgmEnabled) return;
    this._currentGenre = genre;

    const ctx = this._ensureContext();
    if (!ctx) return;

    switch (genre) {
      case 'xianxia':    this._playXianxiaBGM(ctx);    break;
      case 'horror':     this._playHorrorBGM(ctx);     break;
      case 'mystery':    this._playMysteryBGM(ctx);    break;
      case 'apocalypse': this._playApocalypseBGM(ctx); break;
      case 'palace':     this._playPalaceBGM(ctx);     break;
      default:           this._playAmbientBGM(ctx);    break;
    }
  }

  _stopBGM() {
    if (this._bgmInterval) {
      clearInterval(this._bgmInterval);
      this._bgmInterval = null;
    }
    this._bgmNodes.forEach(n => {
      try { n.stop(); n.disconnect(); } catch (e) {}
    });
    this._bgmNodes = [];
    this._currentGenre = null;
  }

  // 修仙 BGM — 空灵五声音阶，缓慢琶音
  _playXianxiaBGM(ctx) {
    const scale = [261.63, 293.66, 329.63, 392.00, 440.00]; // C D E G A
    const playNote = () => {
      if (!this.bgmEnabled || this._currentGenre !== 'xianxia') return;
      const freq = scale[Math.floor(Math.random() * scale.length)];
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'sine';
      osc.frequency.value = freq;
      gain.gain.setValueAtTime(0, ctx.currentTime);
      gain.gain.linearRampToValueAtTime(this._bgmVolume * 0.4, ctx.currentTime + 1.5);
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 6);
      osc.connect(gain).connect(ctx.destination);
      osc.start();
      osc.stop(ctx.currentTime + 6.5);
      this._bgmNodes.push(osc);
    };
    playNote();
    this._bgmInterval = setInterval(playNote, 3000);
  }

  // 恐怖 BGM — 低频嗡鸣，不规则脉冲
  _playHorrorBGM(ctx) {
    const playPulse = () => {
      if (!this.bgmEnabled || this._currentGenre !== 'horror') return;
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      const lfo = ctx.createOscillator();
      const lfoGain = ctx.createGain();
      osc.type = 'sawtooth';
      osc.frequency.value = 55 + Math.random() * 20;
      lfo.frequency.value = 0.2 + Math.random() * 0.5;
      lfoGain.gain.value = 30;
      lfo.connect(lfoGain).connect(osc.frequency);
      gain.gain.setValueAtTime(0, ctx.currentTime);
      gain.gain.linearRampToValueAtTime(this._bgmVolume * 0.3, ctx.currentTime + 2);
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 5);
      osc.connect(gain).connect(ctx.destination);
      lfo.start();
      osc.start();
      osc.stop(ctx.currentTime + 5.5);
      lfo.stop(ctx.currentTime + 5.5);
      this._bgmNodes.push(osc, lfo);
    };
    playPulse();
    this._bgmInterval = setInterval(playPulse, 4000 + Math.random() * 3000);
  }

  // 悬疑 BGM — 单音脉冲，神秘氛围
  _playMysteryBGM(ctx) {
    const notes = [196.00, 246.94, 293.66, 349.23]; // G B D F
    let idx = 0;
    const playNote = () => {
      if (!this.bgmEnabled || this._currentGenre !== 'mystery') return;
      const freq = notes[idx % notes.length];
      idx++;
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'triangle';
      osc.frequency.value = freq;
      gain.gain.setValueAtTime(0, ctx.currentTime);
      gain.gain.linearRampToValueAtTime(this._bgmVolume * 0.35, ctx.currentTime + 0.3);
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 2.5);
      osc.connect(gain).connect(ctx.destination);
      osc.start();
      osc.stop(ctx.currentTime + 3);
      this._bgmNodes.push(osc);
    };
    playNote();
    this._bgmInterval = setInterval(playNote, 2500);
  }

  // 末世 BGM — 低沉氛围，不和谐音程
  _playApocalypseBGM(ctx) {
    const playDrone = () => {
      if (!this.bgmEnabled || this._currentGenre !== 'apocalypse') return;
      [65.41, 73.42, 82.41].forEach((freq, i) => {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.type = 'square';
        osc.frequency.value = freq;
        gain.gain.setValueAtTime(0, ctx.currentTime);
        gain.gain.linearRampToValueAtTime(this._bgmVolume * 0.15, ctx.currentTime + 3 + i);
        gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 8);
        osc.connect(gain).connect(ctx.destination);
        osc.start();
        osc.stop(ctx.currentTime + 8.5);
        this._bgmNodes.push(osc);
      });
    };
    playDrone();
    this._bgmInterval = setInterval(playDrone, 10000);
  }

  // 宫斗 BGM — 古琴风格旋律
  _playPalaceBGM(ctx) {
    const melody = [261.63, 293.66, 261.63, 329.63, 392.00, 329.63, 293.66, 261.63];
    let idx = 0;
    const playNote = () => {
      if (!this.bgmEnabled || this._currentGenre !== 'palace') return;
      const freq = melody[idx % melody.length];
      idx++;
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'sine';
      osc.frequency.value = freq;
      gain.gain.setValueAtTime(0, ctx.currentTime);
      gain.gain.linearRampToValueAtTime(this._bgmVolume * 0.4, ctx.currentTime + 0.2);
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 1.5);
      osc.connect(gain).connect(ctx.destination);
      osc.start();
      osc.stop(ctx.currentTime + 2);
      this._bgmNodes.push(osc);
    };
    playNote();
    this._bgmInterval = setInterval(playNote, 1800);
  }

  // 通用氛围 BGM
  _playAmbientBGM(ctx) {
    const playPad = () => {
      if (!this.bgmEnabled || this._currentGenre !== null) return;
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'sine';
      osc.frequency.value = 220 + Math.random() * 110;
      gain.gain.setValueAtTime(0, ctx.currentTime);
      gain.gain.linearRampToValueAtTime(this._bgmVolume * 0.2, ctx.currentTime + 2);
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 6);
      osc.connect(gain).connect(ctx.destination);
      osc.start();
      osc.stop(ctx.currentTime + 6.5);
      this._bgmNodes.push(osc);
    };
    playPad();
    this._bgmInterval = setInterval(playPad, 5000);
  }

  /* ================================================================
   * SFX Synthesis
   * ================================================================ */

  playSFX(eventName) {
    if (!this.sfxEnabled) return;
    if (!this.SFX_EVENTS.includes(eventName)) return;

    const ctx = this._ensureContext();
    if (!ctx) return;

    switch (eventName) {
      case 'choice_made':        this._sfxChoice(ctx);        break;
      case 'stat_increase':      this._sfxStatUp(ctx);        break;
      case 'stat_decrease':      this._sfxStatDown(ctx);      break;
      case 'chapter_transition': this._sfxTransition(ctx);    break;
      case 'interaction':        this._sfxInteract(ctx);      break;
      case 'notification':       this._sfxNotify(ctx);        break;
    }
  }

  // 选择音效 — 短促"叮"
  _sfxChoice(ctx) {
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = 'sine';
    osc.frequency.setValueAtTime(880, ctx.currentTime);
    osc.frequency.exponentialRampToValueAtTime(1760, ctx.currentTime + 0.05);
    gain.gain.setValueAtTime(this._sfxVolume * 0.3, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.15);
    osc.connect(gain).connect(ctx.destination);
    osc.start();
    osc.stop(ctx.currentTime + 0.2);
  }

  // 数值上升 — 上升琶音 C-E-G
  _sfxStatUp(ctx) {
    [523.25, 659.25, 783.99].forEach((freq, i) => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'sine';
      osc.frequency.value = freq;
      const t = ctx.currentTime + i * 0.08;
      gain.gain.setValueAtTime(0, t);
      gain.gain.linearRampToValueAtTime(this._sfxVolume * 0.25, t + 0.03);
      gain.gain.exponentialRampToValueAtTime(0.001, t + 0.2);
      osc.connect(gain).connect(ctx.destination);
      osc.start(t);
      osc.stop(t + 0.25);
    });
  }

  // 数值下降 — 下降音调 G-E-C
  _sfxStatDown(ctx) {
    [783.99, 659.25, 523.25].forEach((freq, i) => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'triangle';
      osc.frequency.value = freq;
      const t = ctx.currentTime + i * 0.1;
      gain.gain.setValueAtTime(0, t);
      gain.gain.linearRampToValueAtTime(this._sfxVolume * 0.2, t + 0.03);
      gain.gain.exponentialRampToValueAtTime(0.001, t + 0.25);
      osc.connect(gain).connect(ctx.destination);
      osc.start(t);
      osc.stop(t + 0.3);
    });
  }

  // 章节切换 — 滤波器扫频
  _sfxTransition(ctx) {
    const osc = ctx.createOscillator();
    const filter = ctx.createBiquadFilter();
    const gain = ctx.createGain();
    osc.type = 'sawtooth';
    osc.frequency.value = 200;
    filter.type = 'lowpass';
    filter.frequency.setValueAtTime(200, ctx.currentTime);
    filter.frequency.linearRampToValueAtTime(3000, ctx.currentTime + 0.5);
    filter.frequency.exponentialRampToValueAtTime(200, ctx.currentTime + 1.2);
    gain.gain.setValueAtTime(0, ctx.currentTime);
    gain.gain.linearRampToValueAtTime(this._sfxVolume * 0.2, ctx.currentTime + 0.2);
    gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 1.5);
    osc.connect(filter).connect(gain).connect(ctx.destination);
    osc.start();
    osc.stop(ctx.currentTime + 1.6);
  }

  // 交互音效 — 柔和点击
  _sfxInteract(ctx) {
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = 'square';
    osc.frequency.value = 1200;
    gain.gain.setValueAtTime(this._sfxVolume * 0.1, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.05);
    osc.connect(gain).connect(ctx.destination);
    osc.start();
    osc.stop(ctx.currentTime + 0.06);
  }

  // 通知音效 — 双音提示
  _sfxNotify(ctx) {
    [1000, 1500].forEach((freq, i) => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'sine';
      osc.frequency.value = freq;
      const t = ctx.currentTime + i * 0.1;
      gain.gain.setValueAtTime(this._sfxVolume * 0.2, t);
      gain.gain.exponentialRampToValueAtTime(0.001, t + 0.15);
      osc.connect(gain).connect(ctx.destination);
      osc.start(t);
      osc.stop(t + 0.2);
    });
  }

  /* ================================================================
   * Controls
   * ================================================================ */

  toggleSFX() {
    this.sfxEnabled = !this.sfxEnabled;
    return this.sfxEnabled;
  }

  toggleBGM() {
    this.bgmEnabled = !this.bgmEnabled;
    if (!this.bgmEnabled) {
      this._stopBGM();
    } else if (this._currentGenre) {
      this.setBGM(this._currentGenre);
    }
    return this.bgmEnabled;
  }

  setBGMVolume(vol) {
    this._bgmVolume = Math.max(0, Math.min(1, vol));
  }

  setSFXVolume(vol) {
    this._sfxVolume = Math.max(0, Math.min(1, vol));
  }

  getStatus() {
    return {
      sfxEnabled: this.sfxEnabled,
      bgmEnabled: this.bgmEnabled,
      bgmVolume: this._bgmVolume,
      sfxVolume: this._sfxVolume
    };
  }
};
