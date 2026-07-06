/* ================================================
   endings.js — Multi-Ending Indicator System
   Tracks possible endings, discovery progress, reveals
   ================================================ */

class EndingSystem {
  constructor() {
    this.endings = [];
    this.discovered = new Set();
    this.currentEnding = null;
    this.overlay = null;
  }

  init() {
    this.overlay = document.getElementById('ending-overlay');
    this._registerDefaults();

    // Close
    const closeBtn = document.getElementById('ending-close');
    if (closeBtn) closeBtn.addEventListener('click', () => this.close());

    if (this.overlay) {
      this.overlay.addEventListener('click', (e) => {
        if (e.target === this.overlay) this.close();
      });
    }

    // Restore from state
    this._loadFromState();
    this._renderList();
    this._updateMiniTracker();
  }

  open() {
    if (this.overlay) this.overlay.classList.add('open');
    this._renderList();
  }

  close() {
    if (this.overlay) this.overlay.classList.remove('open');
  }

  register(ending) {
    this.endings.push({
      id: ending.id,
      name: ending.name,
      desc: ending.desc,
      type: ending.type || 'normal',
      hidden: ending.hidden === true,
      hint: ending.hint || null,
      genre: ending.genre || 'all'
    });
  }

  discover(endingId) {
    if (this.discovered.has(endingId)) return;
    const ending = this.endings.find(e => e.id === endingId);
    if (!ending) return;

    this.discovered.add(endingId);
    ending.hidden = false;
    this.currentEnding = endingId;
    this._saveToState();
    this._renderList();
    this._updateMiniTracker();

    // Show ending card
    this._showEndingCard(ending);
  }

  setCurrentEnding(endingId) {
    this.currentEnding = endingId;
    this._updateMiniTracker();
  }

  getDiscoveredCount() {
    return this.discovered.size;
  }

  getTotalCount() {
    return this.endings.length;
  }

  isEndingUnlocked(endingId) {
    return this.discovered.has(endingId);
  }

  _registerDefaults() {
    // Xianxia
    this.register({ id: 'x_immortal', name: '飞升成仙', desc: '历经万劫，终成正果，白日飞升', type: 'true', genre: 'xianxia' });
    this.register({ id: 'x_demon', name: '堕入魔道', desc: '走火入魔，成为修仙界最大的威胁', type: 'dark', genre: 'xianxia' });
    this.register({ id: 'x_mortal_love', name: '凡尘情缘', desc: '放弃修仙，与心爱之人隐居山林', type: 'romance', genre: 'xianxia' });
    this.register({ id: 'x_lone_wanderer', name: '孤道独行', desc: '斩断一切牵绊，独步天下', type: 'neutral', genre: 'xianxia' });

    // Horror
    this.register({ id: 'h_survivor', name: '唯一幸存者', desc: '你是唯一活着离开的人', type: 'true', genre: 'horror' });
    this.register({ id: 'h_sacrifice', name: '牺牲救赎', desc: '用自己的生命换取队友的存活', type: 'noble', genre: 'horror' });
    this.register({ id: 'h_corrupted', name: '深渊凝视', desc: '深渊回望了你，你也成为了其中一员', type: 'dark', genre: 'horror' });

    // Mystery
    this.register({ id: 'm_perfect_case', name: '完美破案', desc: '推理无懈可击，真相大白', type: 'true', genre: 'mystery' });
    this.register({ id: 'm_inside_job', name: '局中人', desc: '真相远比想象中更黑暗', type: 'dark', genre: 'mystery' });
    this.register({ id: 'm_unsolved', name: '悬案', desc: '有些真相永远不会被揭开', type: 'neutral', genre: 'mystery' });

    // Apocalypse
    this.register({ id: 'a_new_world', name: '新世界', desc: '在废墟上建立了新的文明', type: 'true', genre: 'apocalypse' });
    this.register({ id: 'a_last_stand', name: '最后抵抗', desc: '战斗到最后一刻', type: 'noble', genre: 'apocalypse' });
    this.register({ id: 'a_fallen', name: '覆灭', desc: '人类文明彻底终结', type: 'dark', genre: 'apocalypse' });

    // Palace
    this.register({ id: 'p_empress', name: '母仪天下', desc: '登上后位，掌控后宫', type: 'true', genre: 'palace' });
    this.register({ id: 'p_exiled', name: '流放之路', desc: '失去一切，远走他乡', type: 'dark', genre: 'palace' });
    this.register({ id: 'p_freedom', name: '离宫', desc: '放弃权力，追求自由', type: 'romance', genre: 'palace' });
    this.register({ id: 'p_consort', name: '太后垂帘', desc: '以太后身份幕后执掌朝政', type: 'hidden', genre: 'palace', hidden: true, hint: '在所有宫斗中保持不败且不成为皇后' });
  }

  _showEndingCard(ending) {
    const toast = document.getElementById('achievement-toast');
    if (!toast) return;

    document.getElementById('achievement-toast-name').textContent = ending.name;
    document.getElementById('achievement-toast-desc').textContent = ending.desc;

    const labelEl = toast.querySelector('.achievement-toast-label');
    if (labelEl) labelEl.textContent = '达成结局';

    toast.className = 'achievement-toast';
    requestAnimationFrame(() => toast.classList.add('visible'));
    setTimeout(() => toast.classList.remove('visible'), 4000);
  }

  _renderList() {
    const container = document.getElementById('ending-list');
    if (!container) return;

    const typeLabels = {
      true: '真结局', dark: '暗结局', romance: '感情线',
      neutral: '普通结局', noble: '牺牲结局', hidden: '隐藏结局'
    };
    const typeClassMap = {
      true: 'true-ending', dark: 'dark-ending', romance: 'romance-ending',
      neutral: 'neutral-ending', noble: 'noble-ending', hidden: 'hidden-ending'
    };

    const checkSvg = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><polyline points="20 6 9 17 4 12"/></svg>';
    const lockSvg = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><circle cx="12" cy="12" r="10"/><path d="M4.93 4.93l14.14 14.14"/></svg>';

    // Filter endings by current genre
    const genre = window.state ? window.state.genre : null;
    const filtered = genre ? this.endings.filter(e => e.genre === genre || e.genre === 'all') : this.endings;

    container.innerHTML = filtered.map(ending => {
      const isUnlocked = this.discovered.has(ending.id);
      const isHidden = ending.hidden && !isUnlocked;
      const stateClass = isUnlocked ? 'unlocked' : (isHidden ? 'hidden' : '');
      const isCurrent = this.currentEnding === ending.id;
      const typeClass = typeClassMap[ending.type] || '';

      return `
        <div class="ending-item ${stateClass}">
          <div class="ending-status-dot ${isCurrent ? 'current' : ''}">
            ${isUnlocked ? checkSvg : lockSvg}
          </div>
          <div class="ending-info">
            <div class="ending-name">${isHidden ? '???' : ending.name}</div>
            <div class="ending-desc">${isHidden ? '尚未发现此结局' : ending.desc}</div>
            <div class="ending-tags">
              <span class="ending-tag type ${typeClass}">${typeLabels[ending.type] || ending.type}</span>
              ${isHidden && ending.hint ? '<span class="ending-tag unlock-hint">有线索</span>' : ''}
              ${isUnlocked ? '<span class="ending-tag hidden-tag">已达成</span>' : ''}
            </div>
          </div>
        </div>`;
    }).join('');

    // Update stats
    const statsEl = document.getElementById('ending-stats');
    if (statsEl) {
      statsEl.innerHTML = `已达成 <strong>${this.getDiscoveredCount()}</strong> / ${this.getTotalCount()} 个结局`;
    }
  }

  _updateMiniTracker() {
    const tracker = document.getElementById('ending-mini-tracker');
    if (!tracker) return;

    tracker.innerHTML = this.endings.map(ending => {
      const isUnlocked = this.discovered.has(ending.id);
      const isCurrent = this.currentEnding === ending.id;
      let cls = '';
      if (isUnlocked) cls = 'unlocked';
      else if (isCurrent) cls = 'current';
      return `<span class="ending-mini-dot ${cls}" title="${ending.hidden && !isUnlocked ? '???' : ending.name}"></span>`;
    }).join('');
  }

  _saveToState() {
    if (window.state) {
      window.state.endings = [...this.discovered];
    }
  }

  _loadFromState() {
    if (window.state && window.state.endings) {
      window.state.endings.forEach(id => {
        this.discovered.add(id);
        const ending = this.endings.find(e => e.id === id);
        if (ending) ending.hidden = false;
      });
    }
  }
}

window.EndingSystem = EndingSystem;
