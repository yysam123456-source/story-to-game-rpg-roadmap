/**
 * vfx.js — VFX Effects Controller
 * Creates/destroys genre-specific particle effects.
 * Respects performance budget: max 10 particles on screen.
 */

window.VFXEngine = class VFXEngine {

  constructor() {
    this.MAX_PARTICLES = 10;
    this._activeParticles = [];
    this._interval = null;
    this._currentGenre = null;
    this._container = null;
  }

  /**
   * Initialize or switch VFX for a genre.
   */
  switchGenre(genre) {
    this.stop();

    this._currentGenre = genre;

    // Ensure VFX layer exists
    let container = document.getElementById('vfx-layer');
    if (!container) {
      container = document.createElement('div');
      container.id = 'vfx-layer';
      container.setAttribute('aria-hidden', 'true');
      document.body.appendChild(container);
    }
    this._container = container;

    // Genre-specific particle configs
    const configs = {
      xianxia:    { cls: 'vfx-qi-particle', color: '#7dd3fc', size: 6, interval: 800,  duration: 4000, drift: 'up' },
      horror:     { cls: 'vfx-blood-drop',  color: '#991b1b', size: 4, interval: 1500, duration: 3500, drift: 'down' },
      palace:     { cls: 'vfx-petal',       color: '#f9a8d4', size: 10, interval: 1200, duration: 5000, drift: 'fall' },
      apocalypse:{ cls: 'vfx-dust-particle', color: '#b4aa8c', size: 2, interval: 1000, duration: 6000, drift: 'drift' }
    };

    const cfg = configs[genre];
    if (!cfg) return;

    // Check settings
    if (window.uiController && !window.uiController.settings.particlesEnabled) return;

    // Start particle loop
    this._interval = setInterval(() => this._spawnParticle(cfg), cfg.interval);
    this._spawnParticle(cfg);

    // Add persistent overlays for certain genres
    this._addGenreOverlays(genre);
  }

  /* ── Spawn Particle ─────────────────── */
  _spawnParticle(cfg) {
    // Performance budget
    while (this._activeParticles.length >= this.MAX_PARTICLES) {
      const oldest = this._activeParticles.shift();
      if (oldest && oldest.parentNode) oldest.remove();
    }

    const p = document.createElement('div');
    p.className = cfg.cls + ' vfx-particle';
    const startX = Math.random() * 100;
    p.style.left = startX + '%';
    p.style.top = cfg.drift === 'up' ? '100%' : '-5%';
    p.style.width = cfg.size + 'px';
    p.style.height = cfg.size + 'px';

    this._container.appendChild(p);
    this._activeParticles.push(p);

    // Animate via rAF
    const startTime = performance.now();
    const duration = cfg.duration;
    const startXVal = startX;

    const animate = (now) => {
      const elapsed = now - startTime;
      const progress = Math.min(elapsed / duration, 1);

      if (cfg.drift === 'up') {
        p.style.top = (100 - progress * 120) + '%';
      } else if (cfg.drift === 'fall') {
        p.style.top = (progress * 120 - 5) + '%';
        p.style.left = (startXVal + Math.sin(progress * Math.PI * 2) * 5) + '%';
        p.style.transform = `rotate(${progress * 216}deg)`;
      } else if (cfg.drift === 'down') {
        p.style.top = (progress * 120 - 5) + '%';
      } else if (cfg.drift === 'drift') {
        p.style.top = (progress * 100) + '%';
        p.style.left = (startXVal - progress * 20) + '%';
        p.style.transform = `rotate(${progress * 180}deg)`;
      }

      p.style.opacity = String(0.7 * (1 - progress * 0.8));

      if (progress < 1) {
        requestAnimationFrame(animate);
      } else {
        if (p.parentNode) p.remove();
        const idx = this._activeParticles.indexOf(p);
        if (idx > -1) this._activeParticles.splice(idx, 1);
      }
    };

    requestAnimationFrame(animate);
  }

  /* ── Genre Overlays ─────────────────── */
  _addGenreOverlays(genre) {
    // Horror scanlines
    if (genre === 'horror') {
      const scanlines = document.createElement('div');
      scanlines.className = 'vfx-scanlines';
      scanlines.setAttribute('aria-hidden', 'true');
      this._container.appendChild(scanlines);
    }

    // Mystery film grain
    if (genre === 'mystery') {
      const grain = document.createElement('div');
      grain.className = 'vfx-film-grain';
      grain.setAttribute('aria-hidden', 'true');
      this._container.appendChild(grain);
    }

    // Apocalypse noise
    if (genre === 'apocalypse') {
      const noise = document.createElement('div');
      noise.className = 'vfx-noise-overlay';
      noise.setAttribute('aria-hidden', 'true');
      this._container.appendChild(noise);

      const flicker = document.createElement('div');
      flicker.className = 'vfx-flicker';
      flicker.setAttribute('aria-hidden', 'true');
      this._container.appendChild(flicker);
    }

    // Palace silk wave
    if (genre === 'palace') {
      const silk = document.createElement('div');
      silk.className = 'vfx-silk-wave';
      silk.setAttribute('aria-hidden', 'true');
      this._container.appendChild(silk);
    }
  }

  /* ── Stop All ───────────────────────── */
  stop() {
    if (this._interval) {
      clearInterval(this._interval);
      this._interval = null;
    }

    this._activeParticles.forEach(p => {
      if (p && p.parentNode) p.remove();
    });
    this._activeParticles = [];

    // Remove VFX layer completely
    const container = document.getElementById('vfx-layer');
    if (container) container.remove();
    this._container = null;
    this._currentGenre = null;
  }

  /* ── Trigger One-Shot Effect ────────── */
  triggerOneShot(genre, effect) {
    if (effect === 'breakthrough' && genre === 'xianxia') {
      const el = document.createElement('div');
      el.className = 'vfx-breakthrough';
      el.setAttribute('aria-hidden', 'true');
      document.body.appendChild(el);
      setTimeout(() => el.remove(), 1600);
    }
    if (effect === 'scare' && genre === 'horror') {
      const el = document.createElement('div');
      el.className = 'vfx-scare-flash';
      el.setAttribute('aria-hidden', 'true');
      document.body.appendChild(el);
      setTimeout(() => el.remove(), 300);
    }
    if (effect === 'clue' && genre === 'mystery') {
      const el = document.createElement('div');
      el.className = 'vfx-clue-flash';
      el.setAttribute('aria-hidden', 'true');
      document.body.appendChild(el);
      setTimeout(() => el.remove(), 900);
    }
    if (effect === 'warning' && genre === 'apocalypse') {
      const el = document.createElement('div');
      el.className = 'vfx-warning-pulse';
      el.setAttribute('aria-hidden', 'true');
      document.body.appendChild(el);
      setTimeout(() => el.remove(), 1600);
    }
  }
};
