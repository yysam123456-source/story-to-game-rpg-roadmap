/**
 * theme.js — Theme Switch Engine
 * Switches data-genre attribute, triggers VFX, updates all UI.
 */

window.ThemeEngine = class ThemeEngine {

  constructor() {
    this.currentGenre = null;
    this._transitionEls = [];
  }

  /**
   * Switch to a genre — master entry point.
   */
  switchGenre(genre) {
    if (genre === this.currentGenre) return;

    // 0. Trigger chapter transition animation
    this.triggerChapterTransition(genre);

    const root = document.getElementById('game-root');
    if (!root) return;

    // 1. Update data-genre attribute
    root.setAttribute('data-genre', genre);
    this.currentGenre = genre;

    // 2. Reset game state
    if (window.state) {
      window.state.reset(genre);
    }

    // 3. Update all UI sections
    this._updateStatusBar(genre);
    this._updateSceneViewport(genre);
    this._loadDemoStory(genre);
    this._renderInteractions(genre);
    this._renderChapterNav(genre);
    this._renderInventory(genre);

    // 4. Trigger VFX
    if (window.vfxEngine) {
      window.vfxEngine.switchGenre(genre);
    }

    // 5. Switch BGM
    if (window.audioSystem) {
      window.audioSystem.setBGM(genre);
    }

    // 6. Update genre pill buttons
    this._updateGenrePills(genre);
  }

  /* ── Status Bar ──────────────────────── */
  _updateStatusBar(genre) {
    const config = window.GENRE_CONFIGS[genre];
    if (!config) return;

    const titleEl = document.getElementById('status-title');
    if (titleEl) titleEl.textContent = config.statusTitle;

    // Collapse status bar on switch
    const bar = document.getElementById('status-bar');
    if (bar) bar.classList.remove('expanded');

    // If RPG mode is active, use RPGStatusBar
    if (window.rpgStatusBar && window.rpgCore && window.rpgCore.isEnabled()) {
      window.rpgStatusBar.render();
      return;
    }

    // Fallback to legacy stats rendering
    if (window.state) this._renderStats();
  }

  _renderStats() {
    if (!window.state) return;

    // If RPG mode is active, delegate to RPGStatusBar
    if (window.rpgStatusBar && window.rpgCore && window.rpgCore.isEnabled()) {
      window.rpgStatusBar.render();
      return;
    }

    const config = window.GENRE_CONFIGS[window.state.genre];
    if (!config) return;

    // Mini stats (first 3)
    const miniContainer = document.getElementById('status-mini');
    if (miniContainer) {
      const miniStats = config.stats.slice(0, 3);
      miniContainer.innerHTML = miniStats.map(stat => {
        const val = window.state.get(stat.key);
        return `
          <div class="mini-stat">
            <svg class="stat-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5"><use href="#icon-${this._iconId(stat.icon)}"/></svg>
            <span class="stat-label">${stat.label}</span>
            <span class="stat-value">${val}</span>
          </div>`;
      }).join('');
    }

    // Full stats
    const fullContainer = document.getElementById('status-full-content');
    if (fullContainer) {
      fullContainer.innerHTML = config.stats.map(stat => this._buildStatHTML(stat)).join('');
    }
  }

  _buildStatHTML(stat) {
    const val = window.state.get(stat.key);
    if (stat.type === 'gauge' && stat.maxKey) {
      const max = window.state.get(stat.maxKey);
      const pct = Math.max(0, Math.min(100, (val / max) * 100));
      const cbSymbol = pct > 60 ? '&#9650;' : pct > 30 ? '&#9670;' : '&#9660;';
      return `
        <div class="stat-item" data-key="${stat.key}">
          <div class="stat-item-header">
            <svg class="stat-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5"><use href="#icon-${this._iconId(stat.icon)}"/></svg>
            <span class="stat-name">${stat.label}</span>
            <span class="stat-num">${val} / ${max}</span>
            <span class="colorblind-symbol">${cbSymbol}</span>
          </div>
          <div class="stat-bar-track">
            <div class="stat-bar-fill ${pct < 25 ? 'low' : ''}" style="width:${pct}%"></div>
          </div>
        </div>`;
    }
    return `
      <div class="stat-item" data-key="${stat.key}">
        <div class="stat-item-header">
          <svg class="stat-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5"><use href="#icon-${this._iconId(stat.icon)}"/></svg>
          <span class="stat-name">${stat.label}</span>
          <span class="stat-num">${val}</span>
        </div>
      </div>`;
  }

  /* ── Scene Viewport ─────────────────── */
  _updateSceneViewport(genre) {
    const genreTag = document.getElementById('genre-tag');
    if (genreTag) {
      const config = window.GENRE_CONFIGS[genre];
      genreTag.textContent = config ? config.name : '';
    }
    // Scene image would be swapped here when assets exist
    // For now, placeholder remains
  }

  /* ── Demo Story ─────────────────────── */
  _loadDemoStory(genre) {
    const config = window.GENRE_CONFIGS[genre];
    if (!config || !config.story) return;

    const chapterEl = document.getElementById('chapter-indicator-text');
    if (chapterEl) chapterEl.textContent = config.story.chapter;

    const narrativeEl = document.getElementById('narrative-text');
    if (narrativeEl) {
      narrativeEl.textContent = config.story.text;
    }

    this._renderChoices(config.story.choices);
  }

  _renderChoices(choices) {
    const container = document.getElementById('choices-area');
    if (!container) return;

    // If RPG mode is active, use RPGChoiceRenderer
    if (window.rpgChoiceRenderer && window.rpgCore && window.rpgCore.isEnabled()) {
      window.rpgChoiceRenderer.renderChoices(choices, 'choices-area');
      return;
    }

    if (!choices || choices.length === 0) {
      container.innerHTML = '<p class="no-choices">剧情暂时没有可选项……</p>';
      return;
    }

    container.innerHTML = choices.map((choice, idx) => {
      let disabled = false;
      let reason = '';

      if (choice.condition && window.state) {
        const { key, min } = choice.condition;
        if (window.state.get(key) < min) {
          disabled = true;
          reason = `（需要 ${window.state.getStatLabel(key)} >= ${min}）`;
        }
      }

      return `
        <button class="choice-btn ${disabled ? 'choice-disabled' : ''}"
                data-choice-index="${idx}"
                ${disabled ? 'disabled' : ''}
                aria-label="${choice.text}">
          ${choice.text}${reason ? `<span class="choice-reason">${reason}</span>` : ''}
        </button>`;
    }).join('');
  }

  /* ── Interactions ───────────────────── */
  _renderInteractions(genre) {
    const config = window.GENRE_CONFIGS[genre];
    if (!config) return;

    const grid = document.getElementById('interactions-grid');
    if (!grid) return;

    grid.innerHTML = config.interactions.map(inter => `
      <button class="interaction-btn" data-interaction-type="${inter.type}" aria-label="${inter.label}">
        <svg class="btn-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5"><use href="#icon-${this._iconId(inter.icon)}"/></svg>
        <span class="btn-label">${inter.label}</span>
      </button>
    `).join('');
  }

  /* ── Chapter Nav ────────────────────── */
  _renderChapterNav(genre) {
    const nav = document.getElementById('chapter-nav');
    if (!nav || !window.state) return;

    const current = window.state.chapter;
    const total = window.state.chapters.length;

    let html = '';
    for (let i = 0; i < total; i++) {
      if (i > 0) {
        html += `<div class="chapter-connector ${i <= current ? 'completed' : ''}"></div>`;
      }
      const cls = i < current ? 'completed' : i === current ? 'current' : 'upcoming';
      html += `<button class="chapter-dot ${cls}" data-label="${window.state.chapters[i]}" aria-label="${window.state.chapters[i]}"></button>`;
    }
    nav.innerHTML = html;
  }

  /* ── Inventory ──────────────────────── */
  _renderInventory(genre) {
    if (!window.state) return;
    const config = window.GENRE_CONFIGS[genre];
    if (!config) return;

    const container = document.getElementById('inventory-content');
    if (!container) return;

    const inv = window.state.inventory;
    const categories = config.inventoryCategories;

    // Render filter tabs
    const filterContainer = document.getElementById('inv-filter-tabs');
    if (filterContainer) {
      if (!this._currentInvFilter) this._currentInvFilter = 'all';

      let filterHtml = '<button class="inv-filter-tab ' + (this._currentInvFilter === 'all' ? 'active' : '') + '" data-filter="all">全部</button>';
      categories.forEach(cat => {
        filterHtml += '<button class="inv-filter-tab ' + (this._currentInvFilter === cat ? 'active' : '') + '" data-filter="' + cat + '">' + cat + '</button>';
      });
      filterContainer.innerHTML = filterHtml;

      // Bind filter tab events
      filterContainer.querySelectorAll('.inv-filter-tab').forEach(tab => {
        tab.addEventListener('click', () => {
          this._currentInvFilter = tab.dataset.filter;
          this._renderInventory(genre);
        });
      });
    }

    // Filter categories
    const displayCategories = this._currentInvFilter === 'all'
      ? categories
      : categories.filter(cat => cat === this._currentInvFilter);

    let html = '';
    displayCategories.forEach(cat => {
      const items = inv[cat] || [];
      html += `
        <div class="inv-category">
          <div class="inv-category-header">
            <svg class="cat-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5"><use href="#icon-folder"/></svg>
            <span>${cat}</span>
            <span class="cat-count">${items.length}</span>
          </div>
          <div class="inv-items">`;

      if (items.length === 0) {
        html += '<div class="inv-empty">（空）</div>';
      } else {
        items.forEach(item => {
          html += `
            <div class="inv-item" tabindex="0" role="button" aria-label="${item.name} - ${item.desc}" title="${item.desc}">
              <svg class="item-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5"><use href="#icon-box"/></svg>
              <span class="item-name">${item.name}</span>
              <span class="item-qty">x${item.qty}</span>
            </div>`;
        });
      }

      html += '</div></div>';
    });

    container.innerHTML = html;

    // Update badge count
    const badge = document.getElementById('inv-badge');
    if (badge) badge.textContent = window.state.getTotalItemCount();
  }

  /* ── Genre Pills ────────────────────── */
  _updateGenrePills(genre) {
    document.querySelectorAll('.genre-pill').forEach(pill => {
      pill.classList.toggle('active', pill.dataset.genre === genre);
      pill.setAttribute('aria-pressed', pill.dataset.genre === genre ? 'true' : 'false');
    });
  }

  /* ── Icon Name Helper ──────────────── */
  _iconId(iconKey) {
    // "icon-fire" -> "fire" (template adds #icon- prefix)
    return iconKey.replace('icon-', '');
  }

  /* ── Chapter Transition Effect ──────── */
  triggerChapterTransition(genre, chapterTitle) {
    const overlay = document.createElement('div');
    overlay.className = 'chapter-transition-overlay';
    overlay.setAttribute('aria-hidden', 'true');

    // If chapter title provided, show it
    if (chapterTitle) {
      const titleEl = document.createElement('div');
      titleEl.className = 'chapter-title-display';
      titleEl.textContent = chapterTitle;
      overlay.appendChild(titleEl);
    }

    const transitions = {
      xianxia:    { duration: 1500, animation: 'inkSpread 1.5s ease-in-out forwards' },
      horror:     { duration: 1500, animation: 'tearIn 1.5s ease-out forwards' },
      mystery:    { duration: 1500, animation: 'typewriterFlash 1.5s steps(1) forwards' },
      apocalypse: { duration: 1500, animation: 'noiseStatic 1.5s ease-in-out forwards' },
      palace:     { duration: 1500, animation: 'curtainOpen 1.5s ease-in-out forwards' }
    };

    const cfg = transitions[genre] || { duration: 1500, animation: 'vfxFadeIn 1.5s ease forwards' };
    overlay.style.animation = cfg.animation;

    document.body.appendChild(overlay);
    setTimeout(() => { if (overlay.parentNode) overlay.remove(); }, cfg.duration + 500);
  }

  /* ── Test: Chapter Transition ──────── */
  _testChapterTransition() {
    const genre = window.state ? window.state.genre : 'xianxia';
    const genres = ['xianxia', 'horror', 'mystery', 'apocalypse', 'palace'];
    const names = ['修仙·水墨晕开', '恐怖·画面撕裂', '悬疑·打字机', '末日·噪点闪烁', '宫斗·帷幕拉开'];
    const idx = genres.indexOf(genre);
    const title = names[idx];
    this.triggerChapterTransition(genre, title);
  }
};
