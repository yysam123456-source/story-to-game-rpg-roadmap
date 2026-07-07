/**
 * rpg-choice.js — RPG Choice Renderer
 * Handles choice.weight visual differentiation, condition evaluation,
 * conditionDisplay (hide/disabled), weightHint tooltips, and change feedback.
 */

window.RPGChoiceRenderer = class RPGChoiceRenderer {

  constructor(rpgCore, gameState, uiController) {
    this.rpg = rpgCore;
    this.state = gameState;
    this.ui = uiController;
  }

  /* ── Main Render ─────────────────────── */
  renderChoices(choices, containerId = 'choices-area') {
    const container = document.getElementById(containerId);
    if (!container) return;

    if (!choices || choices.length === 0) {
      container.innerHTML = '<p class="no-choices">剧情暂时没有可选项……</p>';
      return;
    }

    // Sort by weight priority
    const sorted = this.rpg ? this.rpg.sortChoicesByWeight(choices) : choices;

    container.innerHTML = sorted.map((choice, idx) => {
      // Use the original index from the unsorted choices array
      // so that rpg-story-loader._bindChoiceEvents can correctly
      // look up the choice by data-choice-index in the original array.
      const originalIdx = choices.indexOf(choice);
      return this._renderChoiceButton(choice, originalIdx);
    }).join('');

    // Bind hover for weightHint
    this._bindWeightHints(container);
  }

  _renderChoiceButton(choice, idx) {
    const evalResult = this.rpg ? this.rpg.evaluateCondition(choice.condition, this.state) : { result: true };
    const isAvailable = evalResult.result;

    // conditionDisplay: hide | disabled
    const displayMode = choice.conditionDisplay || 'disabled';
    if (!isAvailable && displayMode === 'hide') {
      return ''; // Hidden choice produces no HTML
    }

    const isDisabled = !isAvailable;
    const weight = choice.weight || 'minor';
    const weightClass = this.rpg ? this.rpg.getWeightClass(weight) : '';
    const weightLabel = this.rpg ? this.rpg.getWeightLabel(weight) : '';

    // Build hint text
    let hintText = '';
    if (choice.weightHint) {
      hintText = choice.weightHint;
    } else if (choice.weight === 'critical') {
      hintText = '此选择将对剧情产生重大影响';
    } else if (choice.weight === 'branch') {
      hintText = '此选择将改变剧情走向';
    }

    // Condition reason
    let reasonText = '';
    if (isDisabled && evalResult.reason) {
      reasonText = `（${evalResult.reason}）`;
    }

    // Change preview (if changes.show is true)
    let changePreview = '';
    if (choice.changes && choice.changes.show !== false) {
      const preview = this._buildChangePreview(choice.changes);
      if (preview) changePreview = `<span class="choice-change-preview">${preview}</span>`;
    }

    const disabledAttr = isDisabled ? 'disabled' : '';
    const disabledClass = isDisabled ? 'choice-disabled' : '';
    const weightAttr = `data-weight="${weight}"`;
    const hintAttr = hintText ? `data-weight-hint="${hintText}"` : '';

    return `
      <button class="choice-btn ${weightClass} ${disabledClass}"
              data-choice-index="${idx}"
              ${weightAttr}
              ${hintAttr}
              ${disabledAttr}
              aria-label="${choice.text}${reasonText ? ' ' + reasonText : ''}">
        <span class="choice-weight-indicator" aria-hidden="true"></span>
        <span class="choice-text">${choice.text}</span>
        ${changePreview}
        ${reasonText ? `<span class="choice-reason">${reasonText}</span>` : ''}
        ${weightLabel && !isDisabled ? `<span class="choice-weight-tag">${weightLabel}</span>` : ''}
      </button>`;
  }

  _buildChangePreview(changes) {
    if (!changes || typeof changes !== 'object') return '';
    const parts = [];
    for (const [key, delta] of Object.entries(changes)) {
      if (key === 'show' || key === 'feedback' || key === 'flags' || key === 'inventory') continue;
      const label = this.rpg ? this.rpg.getStatLabel(key) : key;
      const sign = delta > 0 ? '+' : '';
      parts.push(`${label}${sign}${delta}`);
    }
    return parts.join('，');
  }

  /* ── Weight Hint Tooltips ────────────── */
  _bindWeightHints(container) {
    if (!container) return;

    container.querySelectorAll('.choice-btn[data-weight-hint]').forEach(btn => {
      const hint = btn.dataset.weightHint;
      if (!hint) return;

      // Hover (desktop)
      btn.addEventListener('mouseenter', (e) => this._showTooltip(e.target, hint));
      btn.addEventListener('mouseleave', () => this._hideTooltip());

      // Long press (mobile)
      let pressTimer;
      btn.addEventListener('touchstart', (e) => {
        pressTimer = setTimeout(() => {
          this._showTooltip(e.target, hint);
        }, 500);
      }, { passive: true });
      btn.addEventListener('touchend', () => {
        clearTimeout(pressTimer);
        setTimeout(() => this._hideTooltip(), 1500);
      });
      btn.addEventListener('touchcancel', () => {
        clearTimeout(pressTimer);
        this._hideTooltip();
      });
    });
  }

  _showTooltip(target, text) {
    this._hideTooltip();

    const tooltip = document.createElement('div');
    tooltip.id = 'rpg-choice-tooltip';
    tooltip.className = 'rpg-choice-tooltip';
    tooltip.textContent = text;
    document.body.appendChild(tooltip);

    const rect = target.getBoundingClientRect();
    const ttRect = tooltip.getBoundingClientRect();

    let left = rect.left + rect.width / 2 - ttRect.width / 2;
    let top = rect.top - ttRect.height - 8;

    // Boundary checks
    if (left < 8) left = 8;
    if (left + ttRect.width > window.innerWidth - 8) left = window.innerWidth - ttRect.width - 8;
    if (top < 8) top = rect.bottom + 8;

    tooltip.style.left = left + 'px';
    tooltip.style.top = top + 'px';
    tooltip.style.opacity = '1';
  }

  _hideTooltip() {
    const existing = document.getElementById('rpg-choice-tooltip');
    if (existing) existing.remove();
  }

  /* ── Change Feedback Toast ───────────── */
  showChangeFeedback(changeResults, feedbackConfig = {}) {
    if (!changeResults || changeResults.length === 0) return;

    const style = feedbackConfig.style || 'toast';
    const duration = feedbackConfig.duration || 2500;

    if (style === 'none') return;

    if (style === 'inline') {
      // Inline feedback shown in narrative area
      this._showInlineFeedback(changeResults);
      return;
    }

    // Toast style (default)
    for (const result of changeResults) {
      if (result.isFlag || result.isItem) continue;
      const tone = result.delta > 0 ? 'positive' : result.delta < 0 ? 'negative' : 'neutral';
      if (this.ui) {
        this.ui.showNotification(result.label, result.delta, tone);
      }
    }
  }

  _showInlineFeedback(changeResults) {
    const narrative = document.getElementById('narrative-text');
    if (!narrative) return;

    const statChanges = changeResults.filter(r => !r.isFlag && !r.isItem);
    if (statChanges.length === 0) return;

    const lines = statChanges.map(r => {
      const sign = r.delta > 0 ? '+' : '';
      return `${r.label} ${sign}${r.delta}`;
    });

    const feedbackEl = document.createElement('div');
    feedbackEl.className = 'rpg-inline-feedback';
    feedbackEl.textContent = '【变化】' + lines.join('，');

    narrative.appendChild(document.createElement('div'));
    narrative.appendChild(feedbackEl);

    setTimeout(() => {
      if (feedbackEl.parentNode) feedbackEl.remove();
    }, 5000);
  }

  /* ── Choice Selection Effect ─────────── */
  highlightSelected(index) {
    const allBtns = document.querySelectorAll('#choices-area .choice-btn');
    allBtns.forEach((btn, i) => {
      if (i === index) {
        btn.classList.add('choice-selected');
      } else {
        btn.style.transition = 'opacity 0.5s, transform 0.5s';
        btn.style.opacity = '0.3';
        btn.style.transform = 'scale(0.95)';
        btn.disabled = true;
      }
    });
  }
};
