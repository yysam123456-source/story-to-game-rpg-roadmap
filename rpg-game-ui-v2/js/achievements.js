/* ================================================
   achievements.js — Achievement System
   Categories, progress tracking, unlock toasts
   ================================================ */

class AchievementSystem {
  constructor() {
    this.achievements = [];
    this.unlocked = new Set();
    this.overlay = null;
    this.currentCategory = 'all';
  }

  init() {
    this.overlay = document.getElementById('achievement-overlay');

    // Register default achievements per genre
    this._registerDefaults();

    // Category tabs
    document.querySelectorAll('.achievement-cat-tab').forEach(tab => {
      tab.addEventListener('click', () => {
        this.currentCategory = tab.dataset.cat;
        document.querySelectorAll('.achievement-cat-tab').forEach(t => t.classList.remove('active'));
        tab.classList.add('active');
        this._renderList();
      });
    });

    // Close
    const closeBtn = document.getElementById('achievement-close');
    if (closeBtn) closeBtn.addEventListener('click', () => this.close());

    if (this.overlay) {
      this.overlay.addEventListener('click', (e) => {
        if (e.target === this.overlay) this.close();
      });
    }

    this._renderList();
  }

  open() {
    if (this.overlay) this.overlay.classList.add('open');
    this._updateHeader();
    this._renderList();
  }

  close() {
    if (this.overlay) this.overlay.classList.remove('open');
  }

  register(achievement) {
    this.achievements.push({
      id: achievement.id,
      name: achievement.name,
      desc: achievement.desc,
      category: achievement.category || 'general',
      rarity: achievement.rarity || 'common',
      icon: achievement.icon || null,
      condition: achievement.condition || null,
      progress: achievement.progress || 0,
      maxProgress: achievement.maxProgress || 1,
      genre: achievement.genre || 'all'
    });
  }

  tryUnlock(achievementId) {
    if (this.unlocked.has(achievementId)) return;
    const ach = this.achievements.find(a => a.id === achievementId);
    if (!ach) return;

    this.unlocked.add(achievementId);
    this._showUnlockToast(ach);

    if (window.uiController) {
      window.uiController.showNotification(`成就解锁: ${ach.name}`, 0, 'positive');
    }
  }

  updateProgress(achievementId, value) {
    const ach = this.achievements.find(a => a.id === achievementId);
    if (!ach) return;

    ach.progress = Math.min(value, ach.maxProgress);

    if (ach.progress >= ach.maxProgress && !this.unlocked.has(achievementId)) {
      this.tryUnlock(achievementId);
    }
  }

  getUnlockedCount() {
    return this.unlocked.size;
  }

  getTotalCount() {
    return this.achievements.length;
  }

  getCompletionPercentage() {
    if (this.achievements.length === 0) return 0;
    return Math.round((this.unlocked.size / this.achievements.length) * 100);
  }

  _registerDefaults() {
    // Xianxia
    this.register({ id: 'x_first_cultivation', name: '初入修途', desc: '完成第一次修炼', category: 'cultivation', rarity: 'common', genre: 'xianxia' });
    this.register({ id: 'x_realm_breakthrough', name: '境界突破', desc: '首次突破境界', category: 'cultivation', rarity: 'rare', genre: 'xianxia' });
    this.register({ id: 'x_sword_master', name: '剑道巅峰', desc: '剑法修炼满级', category: 'combat', rarity: 'legendary', genre: 'xianxia', maxProgress: 10 });
    this.register({ id: 'x_nascent_soul', name: '元婴期', desc: '突破至元婴期', category: 'cultivation', rarity: 'legendary', genre: 'xianxia' });

    // Horror
    this.register({ id: 'h_first_survive', name: '初见恐怖', desc: '在第一场恐怖片中存活', category: 'survival', rarity: 'common', genre: 'horror' });
    this.register({ id: 'h_team_leader', name: '领袖气质', desc: '在5场战斗中带领队伍获胜', category: 'team', rarity: 'rare', genre: 'horror', maxProgress: 5 });
    this.register({ id: 'h_sanity_master', name: '理智至上', desc: '完成一场恐怖片且理智不低于80', category: 'survival', rarity: 'legendary', genre: 'horror' });

    // Mystery
    this.register({ id: 'm_first_case', name: '新手侦探', desc: '破解第一个案件', category: 'detective', rarity: 'common', genre: 'mystery' });
    this.register({ id: 'm_perfect_deduction', name: '完美推理', desc: '不使用提示完成推理', category: 'detective', rarity: 'rare', genre: 'mystery' });
    this.register({ id: 'm_mastermind', name: '幕后黑手', desc: '揭开所有隐藏真相', category: 'detective', rarity: 'legendary', genre: 'mystery', maxProgress: 5 });

    // Apocalypse
    this.register({ id: 'a_first_camp', name: '营地建立', desc: '建立第一个幸存者营地', category: 'survival', rarity: 'common', genre: 'apocalypse' });
    this.register({ id: 'a_resource_king', name: '资源大王', desc: '同时持有3种以上资源各100+', category: 'resource', rarity: 'rare', genre: 'apocalypse', maxProgress: 3 });
    this.register({ id: 'a_last_hope', name: '最后希望', desc: '找到最终避难所', category: 'story', rarity: 'legendary', genre: 'apocalypse' });

    // Palace
    this.register({ id: 'p_first_favor', name: '初获圣宠', desc: '首次获得皇帝好感', category: 'court', rarity: 'common', genre: 'palace' });
    this.register({ id: 'p_empress_path', name: '凤仪天下', desc: '成为皇后', category: 'court', rarity: 'legendary', genre: 'palace' });
    this.register({ id: 'p_schemer', name: '权谋大师', desc: '成功策划3次以上阴谋', category: 'intrigue', rarity: 'rare', genre: 'palace', maxProgress: 3 });

    // Generic
    this.register({ id: 'g_collector', name: '收藏家', desc: '背包中持有20种不同物品', category: 'collection', rarity: 'rare', maxProgress: 20 });
    this.register({ id: 'g_explorer', name: '探索者', desc: '完成所有类型的至少一个章节', category: 'exploration', rarity: 'common', maxProgress: 5 });
    this.register({ id: 'g_speedrunner', name: '速通达人', desc: '在30分钟内完成任意章节', category: 'challenge', rarity: 'legendary' });
  }

  _showUnlockToast(ach) {
    let toast = document.getElementById('achievement-toast');
    if (!toast) {
      toast = document.createElement('div');
      toast.id = 'achievement-toast';
      toast.className = 'achievement-toast';
      toast.innerHTML = `
        <div class="achievement-toast-icon">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><path d="M12 15l-2 5-1-3-3-1 3-1z"/><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/></svg>
        </div>
        <div class="achievement-toast-label">成就解锁</div>
        <div class="achievement-toast-name" id="achievement-toast-name"></div>
        <div class="achievement-toast-desc" id="achievement-toast-desc"></div>`;
      document.body.appendChild(toast);
    }

    document.getElementById('achievement-toast-name').textContent = ach.name;
    document.getElementById('achievement-toast-desc').textContent = ach.desc;
    toast.className = 'achievement-toast';

    requestAnimationFrame(() => toast.classList.add('visible'));

    setTimeout(() => {
      toast.classList.remove('visible');
    }, 3000);
  }

  _updateHeader() {
    const countEl = document.getElementById('achievement-unlocked-count');
    const totalEl = document.getElementById('achievement-total-count');
    const progressEl = document.getElementById('achievement-progress-fill');

    if (countEl) countEl.textContent = this.getUnlockedCount();
    if (totalEl) totalEl.textContent = this.getTotalCount();
    if (progressEl) progressEl.style.width = this.getCompletionPercentage() + '%';
  }

  _renderList() {
    const container = document.getElementById('achievement-list');
    if (!container) return;

    let filtered = this.achievements;
    if (this.currentCategory !== 'all') {
      filtered = filtered.filter(a => a.category === this.currentCategory);
    }

    // Sort: unlocked first, then by rarity (legendary > rare > common)
    const rarityOrder = { legendary: 0, rare: 1, common: 2 };
    filtered.sort((a, b) => {
      const aUnlocked = this.unlocked.has(a.id) ? 0 : 1;
      const bUnlocked = this.unlocked.has(b.id) ? 0 : 1;
      if (aUnlocked !== bUnlocked) return aUnlocked - bUnlocked;
      return (rarityOrder[a.rarity] || 2) - (rarityOrder[b.rarity] || 2);
    });

    const rarityLabels = { common: '普通', rare: '稀有', legendary: '传说' };
    const checkSvg = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><polyline points="20 6 9 17 4 12"/></svg>';
    const lockSvg = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><rect x="3" y="11" width="18" height="11" rx="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/></svg>';
    const starSvg = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/></svg>';

    container.innerHTML = filtered.map(ach => {
      const isUnlocked = this.unlocked.has(ach.id);
      const stateClass = isUnlocked ? 'unlocked ' + ach.rarity : 'locked';
      const progressPct = ach.maxProgress > 1 ? Math.round((ach.progress / ach.maxProgress) * 100) : (isUnlocked ? 100 : 0);

      return `
        <div class="achievement-item ${stateClass}">
          <div class="achievement-icon">
            ${isUnlocked ? starSvg : lockSvg}
          </div>
          <div class="achievement-info">
            <div class="achievement-name">${ach.name}</div>
            <div class="achievement-desc">${ach.desc}</div>
            ${ach.maxProgress > 1 ? `
              <div class="achievement-item-progress">
                <div class="achievement-item-progress-fill" style="width: ${progressPct}%"></div>
              </div>
              <div class="achievement-item-meta">
                <span class="achievement-rarity ${ach.rarity}">${rarityLabels[ach.rarity]}</span>
                <span class="achievement-unlock-time">${ach.progress}/${ach.maxProgress}</span>
              </div>
            ` : `
              <div class="achievement-item-meta">
                <span class="achievement-rarity ${ach.rarity}">${rarityLabels[ach.rarity]}</span>
                ${isUnlocked ? '<span class="achievement-unlock-time">已解锁</span>' : ''}
              </div>
            `}
          </div>
        </div>`;
    }).join('');

    this._updateHeader();
  }
}

window.AchievementSystem = AchievementSystem;
