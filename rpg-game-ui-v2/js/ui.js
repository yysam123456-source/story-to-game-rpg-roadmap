/**
 * ui.js — UI Component Controller
 * Handles inventory, menu, notifications, interactions, choices,
 * keyboard nav, touch gestures, accessibility, settings.
 */

window.UIController = class UIController {

  constructor() {
    this.MAX_NOTIFICATIONS = 3;
    this.settings = {
      particlesEnabled: true,
      animationEnabled: true,
      soundEnabled: true,
      colorblindMode: false,
      fontSize: 14,
      showPerfMonitor: false
    };
  }

  /* ── Initialization ────────────────── */
  init() {
    this._bindMenuToggle();
    this._bindInventoryToggle();
    this._bindStatusBarToggle();
    this._bindInteractionButtons();
    this._bindChoiceButtons();
    this._bindGenrePills();
    this._bindKeyboardNav();
    this._bindTouchGestures();
    this._bindAccessibility();
    this._bindStatListeners();
  }

  /* ── Menu Toggle ─────────────────────── */
  _bindMenuToggle() {
    const toggle = document.getElementById('menu-toggle');
    const overlay = document.getElementById('menu-overlay');
    const closeBtn = document.getElementById('menu-close');

    if (toggle) toggle.addEventListener('click', () => this._toggleMenu());
    if (closeBtn) closeBtn.addEventListener('click', () => this._toggleMenu());
    if (overlay) overlay.addEventListener('click', (e) => {
      if (e.target === overlay) this._closeMenu();
    });
  }

  _toggleMenu() {
    const overlay = document.getElementById('menu-overlay');
    if (!overlay) return;
    const isOpen = overlay.classList.contains('open');
    overlay.classList.toggle('open', !isOpen);
    overlay.setAttribute('aria-hidden', String(isOpen));
  }

  _closeMenu() {
    const overlay = document.getElementById('menu-overlay');
    if (overlay) {
      overlay.classList.remove('open');
      overlay.setAttribute('aria-hidden', 'true');
    }
  }

  /* ── Inventory Toggle ───────────────── */
  _bindInventoryToggle() {
    const toggle = document.getElementById('inventory-toggle');
    const close = document.getElementById('inventory-close');
    const backdrop = document.getElementById('inventory-backdrop');

    if (toggle) toggle.addEventListener('click', () => this._toggleInventory());
    if (close) close.addEventListener('click', () => this._toggleInventory());
    if (backdrop) backdrop.addEventListener('click', () => this._toggleInventory());
  }

  _toggleInventory() {
    const panel = document.getElementById('inventory-panel');
    const backdrop = document.getElementById('inventory-backdrop');
    if (!panel) return;
    const isOpen = panel.classList.contains('open');
    panel.classList.toggle('open', !isOpen);
    if (backdrop) backdrop.classList.toggle('visible', !isOpen);
    panel.setAttribute('aria-hidden', String(isOpen));
  }

  /* ── Status Bar Toggle ──────────────── */
  _bindStatusBarToggle() {
    const toggle = document.getElementById('status-toggle');
    if (toggle) {
      toggle.addEventListener('click', () => {
        const bar = document.getElementById('status-bar');
        if (bar) bar.classList.toggle('expanded');
      });
    }
  }

  /* ── Interaction Buttons ────────────── */
  _bindInteractionButtons() {
    document.addEventListener('click', (e) => {
      const btn = e.target.closest('.interaction-btn');
      if (!btn) return;
      const type = btn.dataset.interactionType;
      if (type) this._doInteraction(type);
    });
  }

  _doInteraction(type) {
    if (!window.state) return;
    const logic = window.INTERACTION_LOGIC[type];
    if (!logic) return;

    // Find the clicked button
    const clickedBtn = document.querySelector(`.interaction-btn[data-interaction-type="${type}"]`);
    if (!clickedBtn) return;

    // Step 1: Show "探索中..." state (disable button, change text)
    const originalLabel = clickedBtn.querySelector('.btn-label');
    const originalText = originalLabel ? originalLabel.textContent : '';
    if (originalLabel) {
      originalLabel.textContent = '探索中...';
      originalLabel.classList.add('exploring');
    }
    clickedBtn.disabled = true;
    clickedBtn.classList.add('exploring');

    // Play SFX
    if (window.audioSystem) window.audioSystem.playSFX('interaction');

    // Step 2: After 2 seconds, show exploration result
    setTimeout(() => {
      // Inventory consumption
      if (logic.consume && logic.consume.cost > 0) {
        const item = window.state.consumeItem(logic.consume.category);
        if (!item) {
          if (originalLabel) originalLabel.textContent = originalText;
          clickedBtn.disabled = false;
          clickedBtn.classList.remove('exploring');
          this.showNotification('物品不足', 0, 'negative');
          return;
        }
      }

      // Apply stat changes
      const changes = logic.changes;
      const changeDetails = [];
      for (const [key, range] of Object.entries(changes)) {
        const [min, max] = range;
        const delta = Math.floor(Math.random() * (max - min + 1)) + min;
        const current = window.state.get(key);
        window.state.set(key, current + delta);
        changeDetails.push({ key, delta, label: window.state.getStatLabel(key) });
      }

      // Re-render inventory
      if (window.themeEngine) window.themeEngine._renderInventory(window.state.genre);

      // Show exploration result in narrative
      const narrativeEl = document.getElementById('narrative-text');
      if (narrativeEl) {
        const resultText = changeDetails
          .map(d => `${d.label} ${d.delta > 0 ? '+' : ''}${d.delta}`)
          .join('，');
        const isNew = Math.random() > 0.5;
        const prefix = isNew ? '✦ 新发现！' : '◆ 深入探索...';
        narrativeEl.textContent += '\n\n' + prefix + ' ' + (originalText || type) + '\n' + resultText;
      }

      // Step 3: Button state update
      if (originalLabel) {
        originalLabel.textContent = originalText;
        originalLabel.classList.remove('exploring');
      }
      clickedBtn.classList.remove('exploring');
      // Button remains enabled for reuse (once=false by default)

      // Trigger VFX
      if (window.vfxEngine && window.state) {
        const genre = window.state.genre;
        if (genre === 'xianxia') {
          const cult = window.state.get('cultivation');
          if (cult > 0 && cult % 20 === 0) window.vfxEngine.triggerOneShot('xianxia', 'breakthrough');
        }
      }
    }, 2000);
  }

  /* ── Choice Buttons ──────────────────── */
  _bindChoiceButtons() {
    document.addEventListener('click', (e) => {
      const btn = e.target.closest('.choice-btn');
      if (!btn || btn.disabled) return;
      const index = parseInt(btn.dataset.choiceIndex, 10);
      if (!isNaN(index)) this._makeChoice(index);
    });
  }

  _makeChoice(index) {
    if (!window.state || !window.themeEngine) return;

    const genre = window.state.genre;
    const config = window.GENRE_CONFIGS[genre];
    const isRPG = window.rpgCore && window.rpgCore.isEnabled();

    // Determine choice source: RPG story script or legacy GENRE_CONFIGS
    let choice;
    if (isRPG && window.rpgStory && window.rpgStory.currentNode && window.rpgStory.currentNode.choices) {
      choice = window.rpgStory.currentNode.choices[index];
    } else if (config && config.story && config.story.choices) {
      choice = config.story.choices[index];
    }
    if (!choice) return;

    // Play SFX
    if (window.audioSystem) window.audioSystem.playSFX('choice_made');

    // Dim other choices
    const allBtns = document.querySelectorAll('.choice-btn');
    allBtns.forEach((btn, i) => {
      if (i !== index) {
        btn.style.transition = 'opacity 0.5s, transform 0.5s';
        btn.style.opacity = '0.3';
        btn.style.transform = 'scale(0.95)';
        btn.disabled = true;
      }
      if (i === index) {
        btn.classList.add('choice-selected');
        btn.style.transition = 'all 0.3s';
        btn.style.transform = 'scale(1.02)';
      }
    });

    // Fade out narrative text
    const narrativeEl = document.getElementById('narrative-text');
    if (narrativeEl) {
      narrativeEl.style.transition = 'opacity 0.3s ease';
      narrativeEl.style.opacity = '0';
    }

    // RPG mode: delegate navigation to RPGStoryLoader
    if (isRPG && window.rpgStoryLoader) {
      setTimeout(() => {
        window.rpgStoryLoader.makeChoice(index);
      }, 500);
      return;
    }

    // Legacy mode below
    // Generate next chapter title
    const nextChapterNum = (window.state.chapter || 0) + 1;
    const chapterNames = ['第一章', '第二章', '第三章', '第四章', '第五章'];
    const nextChapterName = chapterNames[Math.min(nextChapterNum, chapterNames.length - 1)] || '下一章';
    const transitionTitle = nextChapterName + ' · ' + (choice.text.substring(0, 8));

    // Trigger transition with title (1.5s)
    window.themeEngine.triggerChapterTransition(genre, transitionTitle);

    // Apply effects at animation midpoint (750ms)
    setTimeout(() => {
      if (choice.effect) {
        const effects = choice.effect;
        for (const [key, baseDelta] of Object.entries(effects)) {
          const factor = 0.7 + Math.random() * 0.6;
          const delta = Math.round(baseDelta * factor);
          const current = window.state.get(key);
          window.state.set(key, current + delta);
        }
      }

      // Advance chapter
      if (window.state.chapter < window.state.chapters.length - 1) {
        window.state.chapter++;
        const chapterEl = document.getElementById('chapter-indicator-text');
        if (chapterEl) chapterEl.textContent = window.state.chapters[window.state.chapter];
        if (window.themeEngine) window.themeEngine._renderChapterNav(genre);
      }

      // Update narrative at midpoint
      if (narrativeEl) {
        let effectText = '';
        if (choice.effect) {
          effectText = Object.entries(choice.effect)
            .map(([k, v]) => {
              const label = window.state.getStatLabel(k);
              return v > 0 ? `${label} +${v}` : `${label} ${v}`;
            })
            .join('，');
        }
        narrativeEl.textContent = '--- 你的选择：' + choice.text + ' ---\n效果：' + effectText;
        // Fade in after transition completes
        setTimeout(() => {
          narrativeEl.style.opacity = '1';
        }, 800);
      }
    }, 750);
  }

  /* ── Genre Pills ─────────────────────── */
  _bindGenrePills() {
    document.addEventListener('click', (e) => {
      const pill = e.target.closest('.genre-pill');
      if (!pill) return;
      const genre = pill.dataset.genre;
      if (genre && window.themeEngine) {
        window.themeEngine.switchGenre(genre);
      }
    });
  }

  /* ── Notifications ──────────────────── */
  showNotification(label, delta, tone) {
    const container = document.getElementById('notifications');
    if (!container) return;

    // Limit max
    while (container.children.length >= this.MAX_NOTIFICATIONS) {
      container.firstElementChild.remove();
    }

    const el = document.createElement('div');
    el.setAttribute('role', 'status');

    if (delta !== 0) {
      // Stat-change card with icon
      const isPositive = delta > 0;
      const actualTone = isPositive ? 'positive' : 'negative';
      const iconSvg = isPositive
        ? '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><polyline points="7 13 12 18 17 13"/><polyline points="7 6 12 11 17 6"/></svg>'
        : '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><polyline points="7 11 12 6 17 11"/><polyline points="7 18 12 13 17 18"/></svg>';
      const sign = delta > 0 ? '+' : '';

      el.className = 'stat-change-card ' + actualTone;
      el.innerHTML = `
        <span class="stat-change-icon">${iconSvg}</span>
        <span class="stat-change-label">${label}</span>
        <span class="stat-change-delta">${sign}${delta}</span>`;
    } else {
      // Text-only toast with icon
      const toneIcons = {
        positive: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/><polyline points="22 4 12 14.01 9 11.01"/></svg>',
        negative: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><circle cx="12" cy="12" r="10"/><line x1="15" y1="9" x2="9" y2="15"/><line x1="9" y1="9" x2="15" y2="15"/></svg>',
        neutral: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><circle cx="12" cy="12" r="10"/><line x1="12" y1="16" x2="12" y2="12"/><line x1="12" y1="8" x2="12.01" y2="8"/></svg>',
        info:    '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><circle cx="12" cy="12" r="10"/><line x1="12" y1="16" x2="12" y2="12"/><line x1="12" y1="8" x2="12.01" y2="8"/></svg>'
      };
      const effectiveTone = tone || 'neutral';
      const iconSvg = toneIcons[effectiveTone] || toneIcons.neutral;

      el.className = 'notification ' + effectiveTone;
      el.innerHTML = `
        <span class="notification-icon">${iconSvg}</span>
        <span class="notification-content">
          <span class="notification-text">${label}</span>
        </span>`;
    }

    container.appendChild(el);

    // Play SFX
    if (window.audioSystem) window.audioSystem.playSFX('notification');

    // Auto-dismiss
    setTimeout(() => {
      el.classList.add('exiting');
      el.addEventListener('transitionend', () => { if (el.parentNode) el.remove(); });
      setTimeout(() => { if (el.parentNode) el.remove(); }, 500);
    }, 2500);
  }

  /* ── Keyboard Navigation ────────────── */
  _bindKeyboardNav() {
    document.addEventListener('keydown', (e) => {
      const key = e.key;

      // Esc
      if (key === 'Escape') {
        this._closeMenu();
        const inv = document.getElementById('inventory-panel');
        if (inv && inv.classList.contains('open')) this._toggleInventory();
        return;
      }

      // I — inventory
      if ((key === 'i' || key === 'I') && !['INPUT', 'TEXTAREA'].includes(e.target.tagName)) {
        e.preventDefault();
        this._toggleInventory();
        return;
      }

      // Tab — keyboard nav class
      if (key === 'Tab') {
        document.body.classList.add('keyboard-nav');
        clearTimeout(this._kbTimer);
        this._kbTimer = setTimeout(() => document.body.classList.remove('keyboard-nav'), 5000);
      }
    });
  }

  /* ── Touch Gestures ────────────────── */
  _bindTouchGestures() {
    let startX = 0;
    let startY = 0;
    const MIN_SWIPE = 50;

    document.addEventListener('touchstart', (e) => {
      startX = e.touches[0].clientX;
      startY = e.touches[0].clientY;
    }, { passive: true });

    document.addEventListener('touchend', (e) => {
      const dx = e.changedTouches[0].clientX - startX;
      const dy = e.changedTouches[0].clientY - startY;

      if (dx < -MIN_SWIPE && Math.abs(dy) < MIN_SWIPE) {
        this._toggleInventory();
      }
    }, { passive: true });
  }

  /* ── Accessibility ───────────────────── */
  _bindAccessibility() {
    const mq = window.matchMedia('(prefers-reduced-motion: reduce)');
    if (mq.matches) {
      document.body.classList.add('no-animation');
      this.settings.animationEnabled = false;
    }
    mq.addEventListener('change', (e) => {
      document.body.classList.toggle('no-animation', e.matches);
      this.settings.animationEnabled = !e.matches;
    });
  }

  /* ── Stat Change Listener ───────────── */
  _bindStatListeners() {
    // Will be connected after state is created
  }

  connectStateListeners() {
    if (!window.state) return;
    window.state.on('stat-change', (data) => {
      const { key, delta } = data;
      const label = window.state.getStatLabel(key);
      const tone = delta > 0 ? 'positive' : delta < 0 ? 'negative' : 'neutral';
      this.showNotification(label, delta, tone);

      // Re-render stats UI
      if (window.themeEngine) window.themeEngine._renderStats();

      // Special effects
      this._checkSpecialEffects(key, data.value);
    });

    window.state.on('inventory-change', () => {
      if (window.themeEngine) window.themeEngine._renderInventory(window.state.genre);
    });
  }

  _checkSpecialEffects(key, value) {
    if (!window.state) return;
    const genre = window.state.genre;

    if (genre === 'xianxia') {
      // Breakthrough VFX at multiples of 20
      if (key === 'cultivation' && value > 0 && value % 20 === 0) {
        if (window.vfxEngine) window.vfxEngine.triggerOneShot('xianxia', 'breakthrough');
        this.showNotification('突破！修为精进', 0, 'positive');
      }
    }

    if (genre === 'horror') {
      if (key === 'sanity' && value <= 30) {
        if (window.vfxEngine) window.vfxEngine.triggerOneShot('horror', 'scare');
        document.getElementById('game-root').classList.add('low-sanity');
        this.showNotification('理智濒危', 0, 'negative');
      } else if (key === 'sanity' && value > 30) {
        document.getElementById('game-root').classList.remove('low-sanity');
      }
      if (key === 'hp' && value <= 30 && value > 0) {
        if (window.vfxEngine) window.vfxEngine.triggerOneShot('horror', 'scare');
      }
      if (key === 'fear' && value >= 80) {
        document.getElementById('game-root').classList.add('danger-active', 'screen-shake');
        setTimeout(() => document.getElementById('game-root').classList.remove('screen-shake'), 300);
      }
    }

    if (genre === 'mystery') {
      if (key === 'evidence' && value >= 5) {
        if (window.vfxEngine) window.vfxEngine.triggerOneShot('mystery', 'clue');
      }
    }

    if (genre === 'apocalypse') {
      if ((key === 'food' || key === 'water') && value <= 15) {
        if (window.vfxEngine) window.vfxEngine.triggerOneShot('apocalypse', 'warning');
        this.showNotification((key === 'food' ? '食物' : '饮水') + '严重不足！', 0, 'negative');
      }
      if (key === 'morale' && value <= 20) {
        this.showNotification('士气崩溃边缘', 0, 'negative');
      }
    }

    if (genre === 'palace') {
      if (key === 'favour' && (value === 50 || value === 80)) {
        // Trigger gold sparkle effect for favour milestones
        this._triggerPalaceSparkle();
        this.showNotification('圣眷加深', 0, 'positive');
      }
    }
  }

  /* ── Palace Gold Sparkle Burst ──────── */
  _triggerPalaceSparkle() {
    if (!window.vfxEngine || !window.vfxEngine._container) return;
    for (let i = 0; i < 8; i++) {
      setTimeout(() => {
        const sparkle = document.createElement('div');
        sparkle.className = 'vfx-sparkle vfx-particle';
        sparkle.setAttribute('aria-hidden', 'true');
        sparkle.style.left = (20 + Math.random() * 60) + '%';
        sparkle.style.top = (20 + Math.random() * 40) + '%';
        window.vfxEngine._container.appendChild(sparkle);
        setTimeout(() => sparkle.remove(), 3000);
      }, i * 100);
    }
  }

  /* ── Test Functions ────────────────── */
  _testChapterTransition() {
    const genre = window.state ? window.state.genre : 'xianxia';
    const genres = ['xianxia', 'horror', 'mystery', 'apocalypse', 'palace'];
    const names = ['修仙·水墨晕开', '恐怖·画面撕裂', '悬疑·打字机', '末日·噪点闪烁', '宫斗·帷幕拉开'];
    const idx = genres.indexOf(genre);
    const title = names[idx];
    window.themeEngine.triggerChapterTransition(genre, title);
    this.showNotification('转场动画已触发：' + title, 0, 'info');
  }

  _testInteractionFlow() {
    // Find first available interaction button and simulate click
    const btn = document.querySelector('.interaction-btn:not(.exploring):not(:disabled)');
    if (btn) {
      btn.click();
      this.showNotification('交互流程已触发', 0, 'info');
    } else {
      this.showNotification('没有可用的交互按钮', 0, 'negative');
    }
  }

  _testVFX() {
    if (!window.vfxEngine) {
      this.showNotification('VFX引擎未初始化', 0, 'negative');
      return;
    }
    const genre = window.state ? window.state.genre : 'xianxia';
    const vfxMap = {
      xianxia: 'breakthrough',
      horror: 'scare',
      mystery: 'clue',
      apocalypse: 'warning',
      palace: 'sparkle'
    };
    const effect = vfxMap[genre] || 'breakthrough';
    window.vfxEngine.triggerOneShot(genre, effect);
    this.showNotification('VFX特效已触发：' + effect, 0, 'info');
  }

  _testNotifications() {
    // Show all notification types
    this.showNotification('修为 +15', 15, 'positive');
    setTimeout(() => this.showNotification('气血 -10', -10, 'negative'), 300);
    setTimeout(() => this.showNotification('新发现！获得碧水剑', 0, 'info'), 600);
    setTimeout(() => this.showNotification('物品不足', 0, 'negative'), 900);
    setTimeout(() => this.showNotification('突破！修为精进', 0, 'positive'), 1200);
  }
};
