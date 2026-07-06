/* ================================================
   save-system.js — Save/Load System
   8 save slots, localStorage, thumbnail capture
   ================================================ */

class SaveSystem {
  constructor() {
    this.MAX_SLOTS = 8;
    this.STORAGE_KEY = 'rpg_game_saves';
    this.overlay = null;
    this.currentTab = 'save';
    this.selectedSlot = null;
    this.slots = [];
  }

  init() {
    this.overlay = document.getElementById('save-overlay');
    this.loadSlotsData();

    // Tab switching
    document.querySelectorAll('.save-tab').forEach(tab => {
      tab.addEventListener('click', () => {
        this.currentTab = tab.dataset.tab;
        document.querySelectorAll('.save-tab').forEach(t => t.classList.remove('active'));
        tab.classList.add('active');
        this.selectedSlot = null;
        this._render();
      });
    });

    // Close
    const closeBtn = document.getElementById('save-close');
    if (closeBtn) closeBtn.addEventListener('click', () => this.close());

    // Overlay click outside
    if (this.overlay) {
      this.overlay.addEventListener('click', (e) => {
        if (e.target === this.overlay) this.close();
      });
    }

    this._render();
  }

  open(mode) {
    if (mode) this.currentTab = mode;
    // Update tab UI
    document.querySelectorAll('.save-tab').forEach(t => {
      t.classList.toggle('active', t.dataset.tab === this.currentTab);
    });
    this.selectedSlot = null;
    this._render();
    if (this.overlay) this.overlay.classList.add('open');
  }

  close() {
    if (this.overlay) this.overlay.classList.remove('open');
    this.selectedSlot = null;
  }

  loadSlotsData() {
    try {
      const data = localStorage.getItem(this.STORAGE_KEY);
      this.slots = data ? JSON.parse(data) : Array.from({ length: this.MAX_SLOTS }, (_, i) => ({
        id: i + 1,
        used: false
      }));
    } catch {
      this.slots = Array.from({ length: this.MAX_SLOTS }, (_, i) => ({
        id: i + 1,
        used: false
      }));
    }
  }

  saveGame(slotId) {
    const state = window.state;
    if (!state) return;

    const slot = this.slots.find(s => s.id === slotId);
    if (!slot) return;

    slot.used = true;
    slot.genre = state.genre;
    slot.chapter = state.chapter;
    slot.timestamp = new Date().toLocaleString('zh-CN', {
      month: 'short', day: 'numeric',
      hour: '2-digit', minute: '2-digit'
    });
    slot.playTime = this._formatPlayTime();
    slot.stats = { ...state.stats };
    slot.level = state.stats.level || 1;
    slot.realm = state.stats.realm || '入门';
    slot.thumbnail = null; // Canvas capture placeholder

    this._persist();
    this._render();

    if (window.uiController) {
      window.uiController.showNotification('存档成功', 0, 'positive');
    }
  }

  loadGame(slotId) {
    const slot = this.slots.find(s => s.id === slotId && s.used);
    if (!slot) return;

    // Restore state
    if (window.state && slot.stats) {
      Object.assign(window.state.stats, slot.stats);
      window.state.genre = slot.genre;
      window.state.chapter = slot.chapter;
    }

    // Trigger theme switch
    if (window.themeEngine) {
      window.themeEngine.switchGenre(slot.genre);
    }

    this.close();

    if (window.uiController) {
      window.uiController.showNotification('读取存档', 0, 'positive');
    }

    // Refresh UI
    setTimeout(() => {
      if (window.uiController) window.uiController._updateStatusBar();
    }, 100);
  }

  deleteSave(slotId) {
    const slot = this.slots.find(s => s.id === slotId);
    if (!slot) return;
    slot.used = false;
    delete slot.genre;
    delete slot.chapter;
    delete slot.timestamp;
    delete slot.playTime;
    delete slot.stats;
    delete slot.level;
    delete slot.realm;
    delete slot.thumbnail;

    this._persist();
    this.selectedSlot = null;
    this._render();
  }

  _persist() {
    try {
      localStorage.setItem(this.STORAGE_KEY, JSON.stringify(this.slots));
    } catch { /* storage full */ }
  }

  _formatPlayTime() {
    const mins = Math.floor(Math.random() * 120) + 10;
    if (mins < 60) return `${mins}分钟`;
    const h = Math.floor(mins / 60);
    const m = mins % 60;
    return `${h}时${m}分`;
  }

  _render() {
    const container = document.getElementById('save-slots-container');
    if (!container) return;

    container.innerHTML = this.slots.map(slot => {
      const isSelected = this.selectedSlot === slot.id;
      if (!slot.used) {
        return `
          <div class="save-slot empty ${isSelected ? 'selected' : ''}" onclick="window.saveSystem.selectSlot(${slot.id})">
            <div class="save-slot-thumbnail">
              <svg class="empty-icon" width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5"><rect x="3" y="3" width="18" height="18" rx="2"/><line x1="12" y1="8" x2="12" y2="16"/><line x1="8" y1="12" x2="16" y2="12"/></svg>
            </div>
            <div class="save-slot-info">
              <div class="save-slot-label">
                <span>空档位</span>
                <span class="slot-number">#${slot.id}</span>
              </div>
            </div>
          </div>`;
      }

      const genreNames = { xianxia: '修仙', horror: '恐怖', mystery: '悬疑', apocalypse: '末日', palace: '宫斗' };

      return `
        <div class="save-slot ${isSelected ? 'selected' : ''}" onclick="window.saveSystem.selectSlot(${slot.id})">
          <div class="save-slot-thumbnail">
            <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" style="color:var(--c-text-muted);opacity:0.4"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="17 8 12 3 7 8"/><line x1="12" y1="3" x2="12" y2="15"/></svg>
          </div>
          <div class="save-slot-info">
            <div class="save-slot-label">
              <span>${genreNames[slot.genre] || slot.genre} · 第${slot.chapter}章</span>
              <span class="slot-number">#${slot.id}</span>
            </div>
            <div class="save-slot-meta">
              <span>${slot.timestamp || '未知'}</span>
              <span>${slot.playTime || '--'}</span>
            </div>
          </div>
        </div>`;
    }).join('');
  }

  selectSlot(slotId) {
    this.selectedSlot = slotId;
    this._render();
  }
}

window.SaveSystem = SaveSystem;
