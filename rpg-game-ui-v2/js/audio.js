/**
 * audio.js — Audio System
 * Placeholder SFX and BGM interface.
 * All audio optional; silently handles missing files.
 */

window.AudioSystem = class AudioSystem {

  constructor() {
    this.SFX_EVENTS = [
      'choice_made', 'stat_increase', 'stat_decrease',
      'chapter_transition', 'interaction', 'notification'
    ];

    this.BGM_URLS = {
      xianxia:    'assets/audio/bgm/xianxia.mp3',
      horror:     'assets/audio/bgm/horror.mp3',
      mystery:    'assets/audio/bgm/mystery.mp3',
      apocalypse: 'assets/audio/bgm/apocalypse.mp3',
      palace:     'assets/audio/bgm/palace.mp3'
    };

    this.SFX_URLS = {
      choice_made:        'assets/audio/sfx/choice.mp3',
      stat_increase:       'assets/audio/sfx/stat_up.mp3',
      stat_decrease:       'assets/audio/sfx/stat_down.mp3',
      chapter_transition:  'assets/audio/sfx/transition.mp3',
      interaction:         'assets/audio/sfx/interact.mp3',
      notification:        'assets/audio/sfx/notify.mp3'
    };

    this._bgmAudio = null;
    this._bgmVolume = 0.4;
    this._sfxVolume = 0.6;
    this.sfxEnabled = true;
    this.bgmEnabled = true;
  }

  toggleSFX() {
    this.sfxEnabled = !this.sfxEnabled;
    return this.sfxEnabled;
  }

  toggleBGM() {
    this.bgmEnabled = !this.bgmEnabled;
    if (!this.bgmEnabled && this._bgmAudio) {
      this._bgmAudio.pause();
    } else if (this.bgmEnabled && this._bgmAudio) {
      this._bgmAudio.play().catch(() => {});
    }
    return this.bgmEnabled;
  }

  playSFX(eventName) {
    if (!this.sfxEnabled) return;
    if (!this.SFX_EVENTS.includes(eventName)) return;

    const url = this.SFX_URLS[eventName];
    if (!url) return;

    try {
      const audio = new Audio(url);
      audio.volume = this._sfxVolume;
      audio.play().catch(() => {});
    } catch (e) {
      // Silent
    }
  }

  setBGM(genre) {
    if (this._bgmAudio) {
      this._bgmAudio.pause();
      this._bgmAudio = null;
    }

    if (!this.bgmEnabled) return;

    const url = this.BGM_URLS[genre];
    if (!url) return;

    try {
      const audio = new Audio(url);
      audio.volume = this._bgmVolume;
      audio.loop = true;
      audio.play().catch(() => {});
      this._bgmAudio = audio;
    } catch (e) {
      // Silent
    }
  }

  setBGMVolume(vol) {
    this._bgmVolume = Math.max(0, Math.min(1, vol));
    if (this._bgmAudio) this._bgmAudio.volume = this._bgmVolume;
  }

  setSFXVolume(vol) {
    this._sfxVolume = Math.max(0, Math.min(1, vol));
  }

  stopBGM() {
    if (this._bgmAudio) {
      this._bgmAudio.pause();
      this._bgmAudio.currentTime = 0;
    }
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
