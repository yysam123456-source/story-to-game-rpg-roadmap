/**
 * dialogue.js — Dialogue System Renderer (v2.0)
 * Renders NPC dialogue with topic selection, item usage in dialogue.
 */
window.DialogueRenderer = class DialogueRenderer {
  constructor(rpgCore, gameState, uiController, storyLoader) {
    this.rpg = rpgCore;
    this.state = gameState;
    this.ui = uiController;
    this.loader = storyLoader;
    this._completedTopics = new Set(); // track completed one-time topics
  }

  renderDialogue(dialogueConfig, containerId = 'dialogue-area') {
    const container = document.getElementById(containerId);
    if (!container || !dialogueConfig) {
      if (container) container.innerHTML = '';
      return;
    }

    // Find NPC info
    const npcInfo = this._getNPCInfo(dialogueConfig.npc);

    // Render dialogue panel
    container.innerHTML = `
      <div class="dialogue-panel">
        <div class="dialogue-header">
          <div class="dialogue-npc-avatar">${npcInfo ? npcInfo.name.charAt(0) : '?'}</div>
          <div class="dialogue-npc-info">
            <span class="dialogue-npc-name">${npcInfo ? npcInfo.name : dialogueConfig.npc}</span>
            ${npcInfo && npcInfo.title ? `<span class="dialogue-npc-title">${npcInfo.title}</span>` : ''}
          </div>
        </div>
        <div class="dialogue-greeting" id="dialogue-greeting"></div>
        <div class="dialogue-topics" id="dialogue-topics"></div>
        <div class="dialogue-response" id="dialogue-response"></div>
        <div class="dialogue-actions">
          <button class="dialogue-end-btn" id="dialogue-end-btn">结束对话</button>
        </div>
      </div>
    `;

    // Show greeting
    const greetingEl = document.getElementById('dialogue-greeting');
    if (greetingEl && dialogueConfig.greeting) {
      greetingEl.textContent = typeof dialogueConfig.greeting === 'string' ? dialogueConfig.greeting : '';
    }

    // Render topics
    this._renderTopics(dialogueConfig.topics);

    // Bind end button
    const endBtn = document.getElementById('dialogue-end-btn');
    if (endBtn) {
      endBtn.addEventListener('click', () => {
        container.innerHTML = '';
        // Signal that dialogue is done — story loader should advance
        if (this.loader && this.loader._onDialogueEnd) {
          this.loader._onDialogueEnd();
        }
      });
    }
  }

  _renderTopics(topics) {
    const topicsEl = document.getElementById('dialogue-topics');
    if (!topicsEl) return;

    // Filter available topics
    const available = topics.filter(t => {
      if (this._completedTopics.has(t.id)) return false;
      if (t.condition) {
        const result = this.rpg.evaluateCondition(t.condition, this.state);
        return result.result;
      }
      return true;
    });

    if (available.length === 0) {
      topicsEl.innerHTML = '<p class="no-topics">没有更多话题了……</p>';
      return;
    }

    topicsEl.innerHTML = available.map(t => `
      <button class="topic-btn" data-topic-id="${t.id}">
        <span class="topic-text">${t.text}</span>
        ${t.hint ? `<span class="topic-hint">${t.hint}</span>` : ''}
      </button>
    `).join('');

    // Bind topic clicks
    topicsEl.querySelectorAll('.topic-btn').forEach(btn => {
      btn.addEventListener('click', () => {
        const topicId = btn.dataset.topicId;
        const topic = available.find(t => t.id === topicId);
        if (topic) this._selectTopic(topic, btn);
      });
    });
  }

  _selectTopic(topic, btnEl) {
    // Show response
    const responseEl = document.getElementById('dialogue-response');
    if (responseEl) {
      const responseText = typeof topic.response === 'string' ? topic.response : (topic.response || []).map(s => typeof s === 'string' ? s : s.text).join('\n');
      responseEl.textContent = responseText;
      responseEl.style.display = 'block';
    }

    // Apply changes
    if (topic.changes) {
      for (const [key, val] of Object.entries(topic.changes)) {
        const old = this.state.get(key);
        this.state.set(key, old + val);
      }
    }

    // Apply affinity changes
    if (topic.affinityChanges) {
      this.rpg.applyAffinityChanges(topic.affinityChanges, this.state);
    }

    // Grant items
    if (topic.grantItems && this.loader.story) {
      const storyItems = this.loader.story.items || {};
      const itemDefs = topic.grantItems.map(id => storyItems[id]).filter(Boolean);
      this.rpg.grantItems(itemDefs, this.state);
    }

    // Set flag/unlock
    if (topic.unlock) {
      this.rpg.setFlag(topic.unlock);
    }

    // Mark topic as completed (one-time)
    this._completedTopics.add(topic.id);
    btnEl.disabled = true;
    btnEl.classList.add('topic-completed');

    // Refresh topics to show newly unlocked ones
    const dialogueConfig = this._getCurrentDialogueConfig();
    if (dialogueConfig) {
      this._renderTopics(dialogueConfig.topics);
    }

    // Show item use option if applicable
    if (topic.canUseItem) {
      this._showItemUseOption();
    }
  }

  _showItemUseOption() {
    // Find usable items for current node
    const currentNodeId = this.loader ? this.loader.currentNodeId : '';
    const storyItems = this.loader && this.loader.story ? (this.loader.story.items || {}) : {};
    const usable = this.rpg.findUsableItems(currentNodeId, this.state, storyItems);

    if (usable.length === 0) return;

    const responseEl = document.getElementById('dialogue-response');
    if (!responseEl) return;

    const itemOptions = usable.map(item =>
      `<button class="item-use-btn" data-item-id="${item.itemId}">使用「${item.name}」</button>`
    ).join('');

    responseEl.innerHTML += `
      <div class="dialogue-item-use">
        <span class="item-use-label">可以使用物品：</span>
        ${itemOptions}
      </div>
    `;

    responseEl.querySelectorAll('.item-use-btn').forEach(btn => {
      btn.addEventListener('click', () => {
        const itemId = btn.dataset.itemId;
        this._useItemInDialogue(itemId, responseEl);
        btn.disabled = true;
        btn.classList.add('item-used');
      });
    });
  }

  _useItemInDialogue(itemId, responseEl) {
    const storyItems = this.loader.story.items || {};
    const itemDef = storyItems[itemId];
    if (!itemDef || !itemDef.onUse) return;

    // Show use text
    const useTextEl = document.createElement('div');
    useTextEl.className = 'item-use-result';
    useTextEl.textContent = itemDef.onUse.text;
    responseEl.appendChild(useTextEl);

    // Apply changes
    if (itemDef.onUse.changes) {
      for (const [key, val] of Object.entries(itemDef.onUse.changes)) {
        const old = this.state.get(key);
        this.state.set(key, old + val);
      }
    }

    // Set flag
    if (itemDef.onUse.flag) {
      this.rpg.setFlag(itemDef.onUse.flag);
    }

    // Consume item if configured
    if (itemDef.onUse.consume !== false) {
      this.rpg.removeItem(itemId, this.state);
    }

    // Refresh dialogue topics (item use may unlock new ones)
    const dialogueConfig = this._getCurrentDialogueConfig();
    if (dialogueConfig) {
      this._renderTopics(dialogueConfig.topics);
    }
  }

  _getNPCInfo(npcId) {
    if (!this.loader || !this.loader.story || !this.loader.story.npcRelations) return null;
    const npcs = Array.isArray(this.loader.story.npcRelations) ? this.loader.story.npcRelations : (this.loader.story.npcRelations.npcs || []);
    return npcs.find(n => n.id === npcId);
  }

  _getCurrentDialogueConfig() {
    if (!this.loader || !this.loader.currentNodeId) return null;
    const node = this.loader.story.nodes.find
      ? this.loader.story.nodes.find(n => n.id === this.loader.currentNodeId)
      : this.loader.story.nodes[this.loader.currentNodeId];
    return node ? node.dialogue : null;
  }
};