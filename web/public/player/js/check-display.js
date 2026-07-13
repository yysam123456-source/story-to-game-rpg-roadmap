/**
 * check-display.js — Skill Check Display (v2.0)
 * Shows dice roll animation and check result.
 */
window.CheckDisplay = class CheckDisplay {
  constructor(rpgCore, gameState) {
    this.rpg = rpgCore;
    this.state = gameState;
  }

  /**
   * Perform and display a skill check with animation.
   * Returns a promise that resolves to { success, text, changesApplied }.
   */
  async performAndDisplay(checkDef, containerId = 'check-area') {
    const container = document.getElementById(containerId);
    if (!container) return { success: false, text: '', changesApplied: false };

    const skillLabel = this.state.getStatLabel ? this.state.getStatLabel(checkDef.skill) : checkDef.skill;

    // Phase 1: Show "rolling..." animation
    container.innerHTML = `
      <div class="check-panel check-rolling">
        <div class="check-header">
          <span class="check-skill-name">${skillLabel}检定</span>
          <span class="check-dc">DC ${checkDef.dc}</span>
        </div>
        <div class="check-dice-area">
          <div class="check-dice check-dice-1">?</div>
          <span class="check-dice-plus">+</span>
          <div class="check-dice check-dice-2">?</div>
        </div>
        <div class="check-skill-value">${skillLabel}: ${this.state.get(checkDef.skill)}</div>
      </div>
    `;

    // Animate dice
    await this._animateDice(container, 1000);

    // Phase 2: Perform actual roll
    const result = this.rpg.rollCheck(checkDef, this.state);
    if (result.blocked) {
      container.innerHTML = `
        <div class="check-panel check-blocked">
          <span class="check-blocked-text">${result.text}</span>
        </div>
      `;
      return result;
    }

    // Phase 3: Show result
    container.innerHTML = `
      <div class="check-panel check-${result.success ? 'success' : 'failure'}">
        <div class="check-header">
          <span class="check-skill-name">${skillLabel}检定</span>
          <span class="check-dc">DC ${checkDef.dc}</span>
        </div>
        <div class="check-dice-area">
          <div class="check-dice check-dice-1">${Math.floor((result.roll) / 2) + (result.roll % 2)}</div>
          <span class="check-dice-plus">+</span>
          <div class="check-dice check-dice-2">${Math.floor((result.roll + 1) / 2)}</div>
        </div>
        <div class="check-breakdown">
          <span>${this.state.get(checkDef.skill)} + ${result.roll} = ${this.state.get(checkDef.skill) + result.roll} vs DC${checkDef.dc}</span>
        </div>
        <div class="check-result-text">
          ${result.success ? '✦ 检定成功！' : '✧ 检定失败…'}
          ${result.success && result.margin > 0 ? ` (差值+${result.margin})` : result.margin < 0 ? ` (差值${result.margin})` : ''}
        </div>
      </div>
    `;

    return result;
  }

  _animateDice(container, duration) {
    return new Promise(resolve => {
      const dice1 = container.querySelector('.check-dice-1');
      const dice2 = container.querySelector('.check-dice-2');
      if (!dice1 || !dice2) { resolve(); return; }

      const interval = 80;
      const steps = duration / interval;
      let step = 0;

      const timer = setInterval(() => {
        dice1.textContent = Math.floor(Math.random() * 12) + 1;
        dice2.textContent = Math.floor(Math.random() * 12) + 1;
        step++;
        if (step >= steps) {
          clearInterval(timer);
          resolve();
        }
      }, interval);
    });
  }

  /**
   * Show a passive check result (no animation, just indicator).
   */
  showPassiveResult(checkDef, result, containerId = 'check-area') {
    const container = document.getElementById(containerId);
    if (!container) return;

    const skillLabel = this.state.getStatLabel ? this.state.getStatLabel(checkDef.skill) : checkDef.skill;
    container.innerHTML = `
      <div class="check-panel check-passive check-${result.success ? 'success' : 'failure'}">
        <span class="check-passive-label">【${skillLabel}${result.success ? '感知' : '未感知'}】</span>
      </div>
    `;
  }
};