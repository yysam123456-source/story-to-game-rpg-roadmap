/**
 * item-use.js — Item Use System (v2.0)
 * Handles item usage in narrative context.
 */
window.ItemUseSystem = class ItemUseSystem {
  constructor(rpgCore, gameState, storyLoader) {
    this.rpg = rpgCore;
    this.state = gameState;
    this.loader = storyLoader;
  }

  /**
   * Get list of items usable in current context.
   */
  getUsableItems(nodeId) {
    const storyItems = this.loader && this.loader.story ? (this.loader.story.items || {}) : {};
    return this.rpg.findUsableItems(nodeId, this.state, storyItems);
  }

  /**
   * Use an item. Returns { success, text, consumed }.
   */
  useItem(itemId) {
    const storyItems = this.loader.story.items || {};
    const itemDef = storyItems[itemId];
    if (!itemDef || !itemDef.onUse) {
      return { success: false, text: '此物品无法使用。', consumed: false };
    }

    // Consume item first (default behavior)
    const consumed = itemDef.onUse.consume !== false;
    if (consumed) {
      const removed = this.rpg.removeItem(itemId, this.state);
      if (!removed) {
        return { success: false, text: '物品不存在。', consumed: false };
      }
    }

    // Apply effects
    if (itemDef.onUse.changes) {
      for (const [key, val] of Object.entries(itemDef.onUse.changes)) {
        const old = this.state.get(key);
        this.state.set(key, old + val);
      }
    }

    if (itemDef.onUse.flag) {
      this.rpg.setFlag(itemDef.onUse.flag);
    }

    return {
      success: true,
      text: itemDef.onUse.text,
      consumed
    };
  }

  /**
   * Render item use bar in narrative context.
   * Shows usable items as small buttons below the narrative text.
   */
  renderItemUseBar(nodeId, containerId = 'item-use-bar') {
    const container = document.getElementById(containerId);
    if (!container) return;

    const usable = this.getUsableItems(nodeId);
    if (usable.length === 0) {
      container.innerHTML = '';
      return;
    }

    container.innerHTML = `
      <div class="item-use-bar">
        <span class="item-use-bar-label">可使用物品：</span>
        ${usable.map(item => `
          <button class="item-use-bar-btn" data-item-id="${item.itemId}" title="${item.desc}">
            <span class="item-use-icon">${item.icon || '📦'}</span>
            <span class="item-use-name">${item.name}</span>
          </button>
        `).join('')}
      </div>
    `;

    container.querySelectorAll('.item-use-bar-btn').forEach(btn => {
      btn.addEventListener('click', () => {
        const itemId = btn.dataset.itemId;
        const result = this.useItem(itemId);

        // Show result in narrative
        const narrative = document.getElementById('narrative-text');
        if (narrative && result.text) {
          const el = document.createElement('div');
          el.className = 'item-use-result';
          el.textContent = result.text;
          narrative.appendChild(el);
          narrative.scrollTop = narrative.scrollHeight;
        }

        // Disable button
        btn.disabled = true;
        btn.classList.add('item-used');
        btn.innerHTML = `<span class="item-use-icon">✓</span><span class="item-use-name">${this.rpg.removeItem ? '已使用' : btn.querySelector('.item-use-name').textContent}</span>`;

        // Refresh bar (consuming may have removed the item)
        this.renderItemUseBar(nodeId, containerId);
      });
    });
  }
};