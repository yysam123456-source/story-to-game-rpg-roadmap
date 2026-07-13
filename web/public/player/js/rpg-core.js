/**
 * rpg-core.js — RPG Core Engine
 * Meta.rpg parser, condition evaluator, change calculator.
 * Bridges JSON story script → UI rendering.
 */

window.RPGCore = class RPGCore {

  constructor() {
    this.meta = null;
    this.statsConfig = [];
    this.flags = new Set();
    this.interactionsDone = new Set();
    this.hiddenStats = {};
    this._changeHistory = [];
  }

  /* ================================================================
   * 1. Meta.rpg Parser
   * ================================================================ */

  loadStory(storyJson) {
    if (!storyJson || !storyJson.meta) {
      this.meta = null;
      this.statsConfig = [];
      return false;
    }

    const rpg = storyJson.meta.rpg;
    if (!rpg || rpg.enabled === false) {
      this.meta = null;
      this.statsConfig = [];
      return false;
    }

    this.meta = {
      enabled: true,
      genre: storyJson.meta.genre || null,
      primaryStats: rpg.primaryStats || [],
      hiddenStats: rpg.hiddenStats || {}
    };

    this.statsConfig = this.meta.primaryStats;
    return true;
  }

  isEnabled() {
    return this.meta && this.meta.enabled;
  }

  getGenre() {
    return this.meta ? this.meta.genre : null;
  }

  getVisibleStats() {
    return this.statsConfig.filter(s => !s.hidden);
  }

  getStatConfig(key) {
    return this.statsConfig.find(s => s.key === key);
  }

  getStatLabel(key) {
    const cfg = this.getStatConfig(key);
    return cfg ? cfg.label : key;
  }

  getStatType(key) {
    const cfg = this.getStatConfig(key);
    return cfg ? cfg.type : 'number';
  }

  /* ================================================================
   * 2. Condition Engine
   * ================================================================ */

  evaluateCondition(condition, state) {
    if (!condition) return { result: true, reason: '' };

    // String condition (backward compatible)
    if (typeof condition === 'string') {
      return this._evalStringCondition(condition, state);
    }

    // Object condition
    if (typeof condition === 'object') {
      return this._evalObjectCondition(condition, state);
    }

    return { result: false, reason: '无效的条件格式' };
  }

  _evalStringCondition(str, state) {
    // Parse patterns like: "cultivation >= 10", "hp > 50", "mind == 100"
    const match = str.match(/^\s*(\w+)\s*(>=|<=|>|<|==|!=)\s*(.+?)\s*$/);
    if (!match) {
      return { result: false, reason: `无法解析条件: ${str}` };
    }

    const [, key, op, valStr] = match;
    const current = state ? state.get(key) : 0;
    const value = parseFloat(valStr);

    if (isNaN(value)) {
      return { result: false, reason: `条件中的值不是数字: ${valStr}` };
    }

    let result = false;
    switch (op) {
      case '>=': result = current >= value; break;
      case '<=': result = current <= value; break;
      case '>':  result = current > value; break;
      case '<':  result = current < value; break;
      case '==': result = current === value; break;
      case '!=': result = current !== value; break;
    }

    const label = this.getStatLabel(key);
    const reason = result ? '' : `需要 ${label} ${op} ${value}`;
    return { result, reason };
  }

  _evalObjectCondition(cond, state) {
    // { not: { ...condition... } } — 取反
    if (cond.not !== undefined) {
      const inner = this._evalObjectCondition(cond.not, state);
      return { result: !inner.result, reason: inner.result ? '' : (inner.reason || '已满足排除条件') };
    }

    // { all: [conditions] }
    if (cond.all && Array.isArray(cond.all)) {
      for (const sub of cond.all) {
        const res = this.evaluateCondition(sub, state);
        if (!res.result) return res;
      }
      return { result: true, reason: '' };
    }

    // { any: [conditions] }
    if (cond.any && Array.isArray(cond.any)) {
      const reasons = [];
      for (const sub of cond.any) {
        const res = this.evaluateCondition(sub, state);
        if (res.result) return { result: true, reason: '' };
        reasons.push(res.reason);
      }
      return { result: false, reason: reasons.join('；') };
    }

    // { var: "key", op: ">=", value: 10 }
    if (cond.var !== undefined) {
      const current = state ? state.get(cond.var) : 0;
      const op = cond.op || '>=';
      const value = parseFloat(cond.value);
      if (isNaN(value)) {
        return { result: false, reason: `变量 ${cond.var} 的比较值无效` };
      }
      let result = false;
      switch (op) {
        case '>=': result = current >= value; break;
        case '<=': result = current <= value; break;
        case '>':  result = current > value; break;
        case '<':  result = current < value; break;
        case '==': result = current === value; break;
        case '!=': result = current !== value; break;
      }
      const label = this.getStatLabel(cond.var);
      return { result, reason: result ? '' : `需要 ${label} ${op} ${value}` };
    }

    // { flag: "flagName" }
    if (cond.flag !== undefined) {
      const result = this.flags.has(cond.flag);
      return { result, reason: result ? '' : `需要先完成: ${cond.flag}` };
    }

    // { item: "itemId", count: 1 }
    if (cond.item !== undefined) {
      const required = cond.count || 1;
      const inv = state ? state.getInventory('all') : [];
      // Flatten all categories
      let total = 0;
      for (const cat of Object.values(inv)) {
        for (const it of cat) {
          if (it.name === cond.item) total += it.qty;
        }
      }
      const result = total >= required;
      return { result, reason: result ? '' : `需要 ${cond.item} x${required}` };
    }

    // { interaction: "interactionType" }
    if (cond.interaction !== undefined) {
      const result = this.interactionsDone.has(cond.interaction);
      return { result, reason: result ? '' : `需要先进行: ${cond.interaction}` };
    }

    // { affinity: { npc: "npcId", op: ">=", value: 10 } }
    if (cond.affinity !== undefined) {
      const aff = cond.affinity;
      const npcId = aff.npc;
      const op = aff.op || '>=';
      const value = parseFloat(aff.value);
      const current = state ? (state.npcAffinities ? state.npcAffinities[npcId] : 0) : 0;
      if (isNaN(value)) {
        return { result: false, reason: `好感度比较值无效` };
      }
      let result = false;
      switch (op) {
        case '>=': result = current >= value; break;
        case '<=': result = current <= value; break;
        case '>':  result = current > value; break;
        case '<':  result = current < value; break;
        case '==': result = current === value; break;
        case '!=': result = current !== value; break;
      }
      return { result, reason: result ? '' : `需要与 ${npcId} 的好感度 ${op} ${value}` };
    }

    // { skill: "ling_shi", min: 15 }
    if (cond.skill !== undefined) {
      const current = state ? state.get(cond.skill) : 0;
      const min = parseFloat(cond.min);
      const result = current >= min;
      const skillLabel = this.getStatLabel(cond.skill);
      return { result, reason: result ? '' : `需要 ${skillLabel} >= ${min}（当前: ${current}）` };
    }

    return { result: false, reason: '未知的条件类型' };
  }

  /* ================================================================
   * 4.5 Auto-Unlock Achievement Detection
   * ================================================================ */

  checkAutoUnlock(achievementId, achievementDef, state) {
    if (!achievementDef || !achievementDef.autoUnlock) return false;
    const cond = achievementDef.autoUnlock;
    const result = this.evaluateCondition(cond, state);
    return result.result;
  }

  /* ================================================================
   * 3. Change Engine
   * ================================================================ */

  applyChanges(changes, state) {
    if (!changes || typeof changes !== 'object') return [];

    const results = [];
    for (const [key, delta] of Object.entries(changes)) {
      if (key === 'show' || key === 'feedback' || key === 'inventory' || key === 'flags' || key.startsWith('_')) continue;

      const current = state.get(key);
      const newValue = current + delta;
      // Direct update to avoid double-triggering stat-change events
      // (RPGChoiceRenderer.showChangeFeedback handles the UI notification)
      state.stats[key] = newValue;

      results.push({
        key,
        label: this.getStatLabel(key),
        delta,
        oldValue: current,
        newValue,
        type: this.getStatType(key)
      });
    }

    // Handle flags
    if (changes.flags && Array.isArray(changes.flags)) {
      for (const flag of changes.flags) {
        this.flags.add(flag);
        results.push({ key: `flag:${flag}`, label: flag, delta: 0, isFlag: true });
      }
    }

    // Handle inventory changes
    if (changes.inventory && state) {
      for (const invChange of changes.inventory) {
        // invChange: { item: "name", category: "cat", qty: 1, desc: "description" }
        const category = invChange.category || 'misc';
        if (!state.inventory) state.inventory = {};
        if (!state.inventory[category]) state.inventory[category] = [];
        
        const existing = state.inventory[category].find(i => i.name === invChange.item);
        if (existing) {
          existing.qty = (existing.qty || 1) + (invChange.qty || 1);
        } else {
          state.inventory[category].push({
            name: invChange.item,
            desc: invChange.desc || invChange.item,
            qty: invChange.qty || 1
          });
        }
        
        results.push({
          key: `item:${invChange.item}`,
          label: invChange.item,
          delta: invChange.qty,
          isItem: true
        });
      }
    }

    // Handle unlockAchievement (single or array)
    const achIds = changes._unlockAchievements || (changes._unlockAchievement ? [changes._unlockAchievement] : []);
    if (achIds.length > 0 && window.achievementSystem) {
      for (const achId of achIds) {
        window.achievementSystem.tryUnlock(achId);
      }
      results.push({ key: 'achievement', label: '成就解锁', delta: 0, isAchievement: true });
    }

    // Handle importantFlag / importantFlags
    const impFlags = changes._importantFlags || (changes._importantFlag ? [changes._importantFlag] : []);
    if (impFlags.length > 0) {
      for (const f of impFlags) {
        if (typeof f === 'object') {
          this.flags.add(f.flag);
          results.push({ key: `flag:${f.flag}`, label: f.label || f.flag, delta: 0, isFlag: true, important: true });
        } else {
          this.flags.add(f);
          results.push({ key: `flag:${f}`, label: f, delta: 0, isFlag: true, important: true });
        }
      }
    }

    // Handle removeFlag
    if (changes._removeFlag) {
      const flagToRemove = changes._removeFlag;
      if (this.flags.has(flagToRemove)) {
        this.flags.delete(flagToRemove);
        results.push({ key: `unflag:${flagToRemove}`, label: `移除标记: ${flagToRemove}`, delta: 0, isUnflag: true });
      }
    }

    // Handle valSet (set variable to absolute value)
    if (changes._valSet) {
      for (const [key, val] of Object.entries(changes._valSet)) {
        const old = state.get(key);
        state.stats[key] = val;
        results.push({ key, label: this.getStatLabel(key), delta: val - old, oldValue: old, newValue: val, type: this.getStatType(key) });
      }
    }

    // Handle feedback text (show narrative feedback)
    if (changes.feedback && typeof changes.feedback === 'string') {
      results.push({ key: '__feedback', label: changes.feedback, delta: 0, isFeedback: true });
    }

    this._changeHistory.push({ timestamp: Date.now(), changes: results });
    return results;
  }

  getChangeHistory() {
    return this._changeHistory;
  }

  /* ================================================================
   * 4. Choice Weight & Condition Display
   * ================================================================ */

  static WEIGHT_CLASSES = {
    critical: 'choice-weight-critical',
    branch:   'choice-weight-branch',
    minor:    'choice-weight-minor',
    cosmetic: 'choice-weight-cosmetic',
    1: 'choice-weight-critical',
    2: 'choice-weight-branch',
    3: 'choice-weight-minor',
    4: 'choice-weight-cosmetic'
  };

  static WEIGHT_LABELS = {
    critical: '关键',
    branch:   '分支',
    minor:    '次要',
    cosmetic: '装饰',
    1: '关键',
    2: '分支',
    3: '次要',
    4: '装饰'
  };

  static WEIGHT_PRIORITY = {
    critical: 0,
    branch: 1,
    major: 2,
    minor: 3,
    cosmetic: 4,
    1: 0,
    2: 1,
    3: 2,
    4: 3
  };

  getWeightClass(weight) {
    return RPGCore.WEIGHT_CLASSES[weight] || '';
  }

  getWeightLabel(weight) {
    return RPGCore.WEIGHT_LABELS[weight] || '';
  }

  sortChoicesByWeight(choices) {
    if (!Array.isArray(choices)) return [];
    return [...choices].sort((a, b) => {
      const pa = RPGCore.WEIGHT_PRIORITY[a.weight] ?? 999;
      const pb = RPGCore.WEIGHT_PRIORITY[b.weight] ?? 999;
      return pa - pb;
    });
  }

  /* ================================================================
   * 5. State Persistence Helpers
   * ================================================================ */

  serialize() {
    return {
      flags: [...this.flags],
      interactionsDone: [...this.interactionsDone],
      hiddenStats: { ...this.hiddenStats }
    };
  }

  deserialize(data) {
    if (data.flags) this.flags = new Set(data.flags);
    if (data.interactionsDone) this.interactionsDone = new Set(data.interactionsDone);
    if (data.hiddenStats) this.hiddenStats = { ...data.hiddenStats };
  }

  /* ================================================================
   * 6. Dice Roll / Skill Check
   * ================================================================ */

  rollCheck(checkDef, state) {
    // checkDef = { skill: "ling_shi", dc: 15, cost: {...} }
    // 公式: skillValue + random(1,12) + random(1,12) - dc
    // 返回 { success: boolean, roll: number, skillValue: number, dc: number, margin: number, text: string }

    const skillValue = state.get(checkDef.skill) || 0;
    const roll1 = Math.floor(Math.random() * 12) + 1;
    const roll2 = Math.floor(Math.random() * 12) + 1;
    const totalRoll = roll1 + roll2;
    const margin = skillValue + totalRoll - checkDef.dc;
    const success = margin >= 0;

    // 扣除cost
    if (checkDef.cost) {
      for (const [key, val] of Object.entries(checkDef.cost)) {
        const current = state.get(key);
        if (current + val < 0) {
          return { success: false, roll: totalRoll, skillValue, dc: checkDef.dc, margin, text: `资源不足，无法进行检定`, blocked: true };
        }
        state.set(key, current + val);
      }
    }

    // 获取技能标签
    const skillLabel = state.getStatLabel ? state.getStatLabel(checkDef.skill) : checkDef.skill;
    const resultText = success ? '成功' : '失败';
    const text = `${skillLabel}检定 (${skillValue} + ${roll1}+${roll2} = ${skillValue + totalRoll} vs DC${checkDef.dc}) — ${resultText}！${success ? `差值+${margin}` : `差值${margin}`}`;

    return { success, roll: totalRoll, skillValue, dc: checkDef.dc, margin, text };
  }

  /* ================================================================
   * 7. Affinity Changes
   * ================================================================ */

  applyAffinityChanges(affinityChanges, state) {
    // affinityChanges = [{ npcId: "du_yan", delta: 5 }]
    if (!affinityChanges || !state.npcAffinities) return [];
    const results = [];
    for (const ac of affinityChanges) {
      const old = state.npcAffinities[ac.npcId] || 0;
      state.npcAffinities[ac.npcId] = old + ac.delta;
      results.push({ npcId: ac.npcId, old, value: old + ac.delta, delta: ac.delta });
    }
    return results;
  }

  /* ================================================================
   * 8. Item Management
   * ================================================================ */

  grantItems(items, state) {
    // items = [{ item: "copper_rust", category: "key_items", qty: 1, desc: "..." }]
    if (!items) return;
    for (const item of items) {
      const cat = item.category || 'misc';
      if (!state.inventory[cat]) state.inventory[cat] = [];
      const existing = state.inventory[cat].find(i => i.name === item.item || i.id === item.item);
      if (existing) {
        existing.qty = (existing.qty || 1) + (item.qty || 1);
      } else {
        state.inventory[cat].push({ id: item.item, name: item.item, desc: item.desc || '', qty: item.qty || 1 });
      }
    }
    state._emit('inventory-change', {});
  }

  removeItem(itemId, state, qty = 1) {
    if (!state.inventory) return false;
    for (const cat of Object.values(state.inventory)) {
      const idx = cat.findIndex(i => (i.id === itemId || i.name === itemId) && i.qty >= qty);
      if (idx >= 0) {
        cat[idx].qty -= qty;
        if (cat[idx].qty <= 0) cat.splice(idx, 1);
        state._emit('inventory-change', {});
        return true;
      }
    }
    return false;
  }

  findUsableItems(nodeId, state, storyItems) {
    // 找出当前场景可以使用的物品
    if (!state.inventory || !storyItems) return [];
    const usable = [];
    for (const [itemId, itemDef] of Object.entries(storyItems)) {
      if (!itemDef.usable) continue;
      // 检查 usableIn 限制
      if (itemDef.usableIn !== null && itemDef.usableIn !== undefined) {
        if (!itemDef.usableIn.includes(nodeId)) continue;
      }
      // 检查背包中是否有
      let hasItem = false;
      for (const cat of Object.values(state.inventory)) {
        if (cat.find(i => (i.id === itemId || i.name === itemId))) {
          hasItem = true;
          break;
        }
      }
      if (hasItem) usable.push({ itemId, ...itemDef });
    }
    return usable;
  }

  recordInteraction(type) {
    this.interactionsDone.add(type);
  }

  setFlag(flag) {
    this.flags.add(flag);
  }

  hasFlag(flag) {
    return this.flags.has(flag);
  }
};
