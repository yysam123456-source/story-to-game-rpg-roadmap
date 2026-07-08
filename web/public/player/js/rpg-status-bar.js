/**
 * rpg-status-bar.js — RPG Status Bar Renderer
 * Supports text/number/bar types per SCHEMA_v1.
 * Replaces theme.js _renderStats when RPG mode is active.
 */

window.RPGStatusBar = class RPGStatusBar {

  constructor(rpgCore, gameState) {
    this.rpg = rpgCore;
    this.state = gameState;
    this.expanded = false;
    this._detailOpen = false;
    this._initBindings();
  }

  _initBindings() {
    // Double-click status bar to open detail drawer
    const bar = document.getElementById('status-bar');
    if (bar) {
      bar.addEventListener('dblclick', (e) => {
        if (this.rpg && this.rpg.isEnabled()) {
          e.preventDefault();
          this.openDetailDrawer();
        }
      });
    }
  }

  /* ── Main Render ─────────────────────── */
  render() {
    if (!this.rpg || !this.rpg.isEnabled()) return;

    const stats = this.rpg.getVisibleStats();
    const miniStats = stats.slice(0, 5);

    // Mini stats (always visible)
    const miniContainer = document.getElementById('status-mini');
    if (miniContainer) {
      miniContainer.innerHTML = miniStats.map(stat => this._renderMiniStat(stat)).join('');
    }

    // Full stats (expandable)
    const fullContainer = document.getElementById('status-full-content');
    if (fullContainer) {
      fullContainer.innerHTML = stats.map(stat => this._renderFullStat(stat)).join('');
    }

    // Update title
    const titleEl = document.getElementById('status-title');
    if (titleEl) {
      const genre = this.rpg.getGenre();
      const genreNames = {
        xianxia: '修行状态', horror: '生存状态', mystery: '侦探状态',
        apocalypse: '生存状态', palace: '宫廷地位'
      };
      titleEl.textContent = genreNames[genre] || '角色状态';
    }
  }

  /* ── Mini Stat ───────────────────────── */
  _renderMiniStat(stat) {
    const val = this.state.get(stat.key);
    const iconId = this._iconId(stat.icon || 'icon-star');
    return `
      <div class="mini-stat" data-stat-key="${stat.key}">
        <svg class="stat-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5"><use href="#icon-${iconId}"/></svg>
        <span class="stat-label">${stat.label}</span>
        <span class="stat-value">${this._formatValue(stat, val)}</span>
      </div>`;
  }

  /* ── Full Stat (text / number / bar) ─── */
  _renderFullStat(stat) {
    const val = this.state.get(stat.key);
    const iconId = this._iconId(stat.icon || 'icon-star');
    const type = stat.type || 'number';

    if (type === 'bar') {
      return this._renderBarStat(stat, val, iconId);
    }

    // text or number
    return `
      <div class="stat-item" data-stat-key="${stat.key}" data-stat-type="${type}">
        <div class="stat-item-header">
          <svg class="stat-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5"><use href="#icon-${iconId}"/></svg>
          <span class="stat-name">${stat.label}</span>
          <span class="stat-num">${this._formatValue(stat, val)}</span>
        </div>
      </div>`;
  }

  _renderBarStat(stat, val, iconId) {
    let max = 100;
    if (stat.max !== undefined) {
      max = stat.max;
    } else if (stat.maxKey) {
      max = this.state.get(stat.maxKey) || 100;
    }
    const pct = Math.max(0, Math.min(100, (val / max) * 100));
    const lowClass = pct < 25 ? 'low' : '';

    return `
      <div class="stat-item" data-stat-key="${stat.key}" data-stat-type="bar">
        <div class="stat-item-header">
          <svg class="stat-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5"><use href="#icon-${iconId}"/></svg>
          <span class="stat-name">${stat.label}</span>
          <span class="stat-num">${val} / ${max}</span>
        </div>
        <div class="stat-bar-track">
          <div class="stat-bar-fill ${lowClass}" style="width:${pct}%"></div>
        </div>
      </div>`;
  }

  _formatValue(stat, val) {
    if (stat.type === 'text') return val;
    if (typeof val === 'number') return Math.round(val * 10) / 10;
    return val;
  }

  _iconId(iconKey) {
    return (iconKey || '').replace('icon-', '');
  }

  /* ── Detail Drawer ───────────────────── */
  openDetailDrawer() {
    if (this._detailOpen) return;
    this._detailOpen = true;

    let drawer = document.getElementById('rpg-stat-detail-drawer');
    if (!drawer) {
      drawer = document.createElement('div');
      drawer.id = 'rpg-stat-detail-drawer';
      drawer.className = 'rpg-stat-detail-drawer';
      drawer.innerHTML = `
        <div class="rpg-drawer-backdrop"></div>
        <div class="rpg-drawer-panel">
          <div class="rpg-drawer-header">
            <h3>详细状态</h3>
            <button class="rpg-drawer-close" aria-label="关闭">✕</button>
          </div>
          <div class="rpg-drawer-content"></div>
        </div>
      `;
      document.body.appendChild(drawer);

      drawer.querySelector('.rpg-drawer-backdrop').addEventListener('click', () => this.closeDetailDrawer());
      drawer.querySelector('.rpg-drawer-close').addEventListener('click', () => this.closeDetailDrawer());
    }

    drawer.classList.add('open');
    this._renderDetailContent(drawer.querySelector('.rpg-drawer-content'));
  }

  closeDetailDrawer() {
    this._detailOpen = false;
    const drawer = document.getElementById('rpg-stat-detail-drawer');
    if (drawer) drawer.classList.remove('open');
  }

  _renderDetailContent(container) {
    if (!this.rpg || !container) return;
    const allStats = this.rpg.statsConfig;

    container.innerHTML = allStats.map(stat => {
      const val = this.state.get(stat.key);
      const type = stat.type || 'number';
      let extra = '';
      if (type === 'bar') {
        let max = stat.max || (stat.maxKey ? this.state.get(stat.maxKey) : 100);
        const pct = Math.round((val / max) * 100);
        extra = `<span class="rpg-drawer-pct">${pct}%</span>`;
      }
      return `
        <div class="rpg-drawer-stat ${stat.hidden ? 'hidden-stat' : ''}">
          <span class="rpg-drawer-label">${stat.label}</span>
          <span class="rpg-drawer-value">${this._formatValue(stat, val)}${extra}</span>
          ${stat.hidden ? '<span class="rpg-drawer-badge">隐藏</span>' : ''}
        </div>`;
    }).join('');
  }

  /* ── Toggle Expand ───────────────────── */
  toggleExpand() {
    const bar = document.getElementById('status-bar');
    if (!bar) return;
    this.expanded = !this.expanded;
    bar.classList.toggle('expanded', this.expanded);
  }
};
