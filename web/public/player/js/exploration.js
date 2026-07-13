/**
 * exploration.js — Exploration System Renderer (v2.0)
 * Renders explorable elements in scenes, handles skill checks and item discoveries.
 */
window.ExplorationRenderer = class ExplorationRenderer {
  constructor(rpgCore, gameState, uiController, storyLoader) {
    this.rpg = rpgCore;
    this.state = gameState;
    this.ui = uiController;
    this.loader = storyLoader;
    this._examined = new Set(); // track once-only explorables
  }

  renderExplorables(explorables, containerId = 'exploration-area') {
    const container = document.getElementById(containerId);
    if (!container || !explorables || explorables.length === 0) {
      if (container) container.innerHTML = '';
      return;
    }

    // Filter out already-examined once-only elements
    const available = explorables.filter(exp => {
      if (exp.once && this._examined.has(exp.id)) return false;
      if (exp.condition) {
        const result = this.rpg.evaluateCondition(exp.condition, this.state);
        return result.result;
      }
      return true;
    });

    if (available.length === 0) {
      container.innerHTML = '';
      return;
    }

    container.innerHTML = available.map(exp => `
      <button class="explorable-btn" data-exp-id="${exp.id}" title="${exp.description || ''}">
        <span class="exp-icon">${exp.icon ? '🔍' : '👁'}</span>
        <span class="exp-label">${exp.label}</span>
        ${exp.check ? '<span class="exp-check-hint">需要检定</span>' : ''}
      </button>
    `).join('');

    // Bind events
    container.querySelectorAll('.explorable-btn').forEach(btn => {
      btn.addEventListener('click', () => {
        const expId = btn.dataset.expId;
        const exp = available.find(e => e.id === expId);
        if (exp) this._examine(exp, btn);
      });
    });
  }

  async _examine(exp, btnEl) {
    // Disable button
    btnEl.disabled = true;
    btnEl.classList.add('examining');

    let resultText = '';
    let isSuccess = true;

    if (exp.check) {
      // Has a skill check
      const checkLabel = this.state.getStatLabel ? this.state.getStatLabel(exp.check.skill) : exp.check.skill;
      if (this.ui) this.ui.showNotification(`${checkLabel}检定中...`, 0, 'neutral');

      // Small delay for drama
      await new Promise(r => setTimeout(r, 800));

      const checkResult = this.rpg.rollCheck(exp.check, this.state);
      if (checkResult.blocked) {
        if (this.ui) this.ui.showNotification(checkResult.text, 3000, 'negative');
        btnEl.disabled = false;
        btnEl.classList.remove('examining');
        return;
      }

      // Show check result as notification
      if (this.ui) {
        this.ui.showNotification(checkResult.text, 4000, checkResult.success ? 'positive' : 'negative');
      }

      // Show check result
      resultText = checkResult.text + '\n\n';
      isSuccess = checkResult.success;

      const outcome = isSuccess ? exp.check.onSuccess : exp.check.onFailure;
      resultText += typeof outcome.text === 'string' ? outcome.text : outcome.text.map(s => typeof s === 'string' ? s : s.text).join('\n');

      // Apply changes
      if (outcome.changes) {
        for (const [key, val] of Object.entries(outcome.changes)) {
          const old = this.state.get(key);
          this.state.set(key, old + val);
        }
      }
      if (outcome.affinityChanges) {
        this.rpg.applyAffinityChanges(outcome.affinityChanges, this.state);
      }
      if (outcome.grantItems && this.loader.story) {
        const storyItems = this.loader.story.items || {};
        const itemDefs = outcome.grantItems.map(id => storyItems[id]).filter(Boolean);
        this.rpg.grantItems(itemDefs, this.state);
      }
      if (outcome.unlock) {
        this.rpg.setFlag(outcome.unlock);
      }
      if (outcome.flag) {
        this.rpg.setFlag(outcome.flag);
      }
    } else if (exp.result) {
      // Direct result, no check
      resultText = typeof exp.result.text === 'string' ? exp.result.text : exp.result.text.map(s => typeof s === 'string' ? s : s.text).join('\n');

      if (exp.result.changes) {
        for (const [key, val] of Object.entries(exp.result.changes)) {
          const old = this.state.get(key);
          this.state.set(key, old + val);
        }
      }
      if (exp.result.affinityChanges) {
        this.rpg.applyAffinityChanges(exp.result.affinityChanges, this.state);
      }
      if (exp.result.grantItems && this.loader.story) {
        const storyItems = this.loader.story.items || {};
        const itemDefs = exp.result.grantItems.map(id => storyItems[id]).filter(Boolean);
        this.rpg.grantItems(itemDefs, this.state);
      }
      if (exp.result.flag) {
        this.rpg.setFlag(exp.result.flag);
      }
    }

    // Mark as examined
    if (exp.once) this._examined.add(exp.id);

    // Show result in narrative area
    const narrative = document.getElementById('narrative-text');
    if (narrative && resultText) {
      const resultEl = document.createElement('div');
      resultEl.className = 'exploration-result ' + (isSuccess ? 'exp-success' : 'exp-failure');
      resultEl.textContent = resultText;
      narrative.appendChild(resultEl);
      narrative.scrollTop = narrative.scrollHeight;
    }

    // Update button state
    btnEl.classList.remove('examining');
    btnEl.classList.add('examined');
    btnEl.innerHTML = `<span class="exp-icon">✓</span><span class="exp-label">${exp.label}</span><span class="exp-done">已调查</span>`;
  }
};