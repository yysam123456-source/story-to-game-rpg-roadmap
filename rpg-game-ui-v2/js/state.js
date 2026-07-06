/**
 * state.js — Game State Manager
 * Manages stats, inventory, genre, chapter.
 * Provides get/set methods with UI sync.
 */

window.GameState = class GameState {

  constructor(genre) {
    this.genre = genre;
    this.stats = { ...window.INITIAL_STATS[genre] };
    this.inventory = JSON.parse(JSON.stringify(window.INITIAL_INVENTORY[genre]));
    this.chapter = 0;
    this.chapters = ['第一章', '第二章', '第三章', '第四章', '第五章'];
    this._listeners = [];
  }

  /* ── Stat Accessors ──────────────────── */
  get(key) {
    return this.stats[key] !== undefined ? this.stats[key] : 0;
  }

  set(key, value) {
    const old = this.stats[key] || 0;
    this.stats[key] = value;
    const delta = value - old;
    this._emit('stat-change', { key, old, value, delta });
  }

  getAll() {
    return { ...this.stats };
  }

  /* ── Inventory ───────────────────────── */
  getInventory(category) {
    return this.inventory[category] || [];
  }

  consumeItem(category) {
    const items = this.inventory[category];
    if (!items || items.length === 0) return null;
    const item = items[0];
    item.qty -= 1;
    if (item.qty <= 0) items.shift();
    this._emit('inventory-change', {});
    return item;
  }

  getTotalItemCount() {
    let total = 0;
    for (const cat of Object.values(this.inventory)) {
      for (const item of cat) {
        total += item.qty;
      }
    }
    return total;
  }

  /* ── Chapter ────────────────────────── */
  setChapter(index) {
    if (index >= 0 && index < this.chapters.length) {
      this.chapter = index;
      this._emit('chapter-change', { chapter: index });
    }
  }

  getChapterLabel() {
    return this.chapters[this.chapter] || '';
  }

  /* ── Reset ──────────────────────────── */
  reset(genre) {
    this.genre = genre;
    this.stats = { ...window.INITIAL_STATS[genre] };
    this.inventory = JSON.parse(JSON.stringify(window.INITIAL_INVENTORY[genre]));
    this.chapter = 0;
    this._emit('reset', { genre });
  }

  /* ── Stat Label Lookup ──────────────── */
  getStatLabel(key) {
    const config = window.GENRE_CONFIGS[this.genre];
    if (!config) return key;
    const stat = config.stats.find(s => s.key === key);
    return stat ? stat.label : key;
  }

  /* ── Events ─────────────────────────── */
  on(event, fn) {
    this._listeners.push({ event, fn });
  }

  off(event, fn) {
    this._listeners = this._listeners.filter(l => !(l.event === event && l.fn === fn));
  }

  _emit(event, data) {
    for (const l of this._listeners) {
      if (l.event === event) l.fn(data);
    }
  }
};
