/**
 * rpg-story-loader.js — RPG Story Script Loader
 * Loads JSON story scripts (file/URL), initializes RPG state, manages node navigation.
 * Supports both RPG mode (meta.rpg.enabled) and legacy mode (pure literary).
 */

window.RPGStoryLoader = class RPGStoryLoader {

  constructor(rpgCore, gameState, themeEngine, uiController) {
    this.rpg = rpgCore;
    this.state = gameState;
    this.theme = themeEngine;
    this.ui = uiController;
    this.story = null;
    this.currentNodeId = null;
    this.isStoryMode = false; // true = loaded a story script, false = legacy demo mode
  }

  /* ================================================================
   * 1. Load Methods
   * ================================================================ */

  async loadFromUrl(url) {
    try {
      const res = await fetch(url);
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const json = await res.json();
      return this.load(json);
    } catch (err) {
      console.error('Failed to load story:', err);
      return { success: false, error: err.message };
    }
  }

  loadFromFile(file) {
    return new Promise((resolve) => {
      const reader = new FileReader();
      reader.onload = (e) => {
        try {
          const json = JSON.parse(e.target.result);
          const result = this.load(json);
          resolve(result);
        } catch (err) {
          console.error('Failed to parse file:', err);
          resolve({ success: false, error: 'JSON 解析失败: ' + err.message });
        }
      };
      reader.onerror = () => {
        resolve({ success: false, error: '文件读取失败' });
      };
      reader.readAsText(file);
    });
  }

  load(storyJson) {
    if (!storyJson || !storyJson.meta) {
      console.warn('Invalid story JSON');
      return { success: false, error: '无效的剧本文件：缺少 meta 字段' };
    }

    this.story = storyJson;
    this.isStoryMode = true;

    // Initialize RPG core (may or may not be enabled)
    const rpgEnabled = this.rpg.loadStory(storyJson);

    // Apply initial state
    if (storyJson.initialState) {
      for (const [key, val] of Object.entries(storyJson.initialState)) {
        this.state.stats[key] = val;
      }
    }

    // Set genre from meta
    if (storyJson.meta.genre) {
      this.state.genre = storyJson.meta.genre;
      if (this.theme) this.theme.switchGenre(storyJson.meta.genre);
    }

    // Show mode indicator
    this._showModeIndicator(storyJson.meta, rpgEnabled);

    // Find start node
    const startNode = this.story.nodes.find(n => n.id === 'start') || this.story.nodes[0];
    if (startNode) {
      this.navigateTo(startNode.id);
    }

    window.rpgStory = this;

    // Load milestones and endings into achievement/ending systems
    this._loadStoryMeta(storyJson);

    return { success: true, rpgEnabled };
  }

  /* ================================================================
   * 2. Navigation
   * ================================================================ */

  navigateTo(nodeId) {
    if (!this.story) return false;
    const node = this.story.nodes.find(n => n.id === nodeId);
    if (!node) {
      console.warn('Node not found:', nodeId);
      return false;
    }

    this.currentNodeId = nodeId;
    this._renderNode(node);

    // Notify parent (iframe communication)
    this._postToParent('nodeChange', { nodeId, chapter: node.chapter });

    // Check milestones
    this._checkMilestones(node);

    // Check endings
    if (node.type === 'ending' || (node.choices && node.choices.length === 0 && node.candidateEndings)) {
      this._triggerEnding(node);
    }

    return true;
  }

  _renderNode(node) {
    // Update chapter indicator
    const chapterEl = document.getElementById('chapter-indicator-text');
    if (chapterEl && node.chapter) chapterEl.textContent = node.chapter;

    // Update narrative text
    const narrativeEl = document.getElementById('narrative-text');
    if (narrativeEl) {
      narrativeEl.style.opacity = '0';
      setTimeout(() => {
        narrativeEl.textContent = node.text || '';
        narrativeEl.style.opacity = '1';
      }, 150);
    }

    // Render choices via RPGChoiceRenderer or fallback
    if (this.rpg.isEnabled() && window.rpgChoiceRenderer) {
      window.rpgChoiceRenderer.renderChoices(node.choices || []);
    } else if (this.theme) {
      this.theme._renderChoices(node.choices || []);
    }

    // Update status bar
    if (this.rpg.isEnabled() && window.rpgStatusBar) {
      window.rpgStatusBar.render();
    } else if (this.theme) {
      this.theme._renderStats();
    }

    // Bind choice click events for story mode
    this._bindChoiceEvents(node.choices || []);
  }

  _bindChoiceEvents(choices) {
    const container = document.getElementById('choices-area');
    if (!container) return;

    container.querySelectorAll('.choice-btn').forEach((btn) => {
      // Remove old listeners by cloning
      const newBtn = btn.cloneNode(true);
      btn.parentNode.replaceChild(newBtn, btn);

      newBtn.addEventListener('click', () => {
        if (newBtn.disabled) return;
        const index = parseInt(newBtn.dataset.choiceIndex, 10);
        this._handleStoryChoice(index, choices);
      });
    });
  }

  _handleStoryChoice(index, choices) {
    const choice = choices[index];
    if (!choice) return;

    // Play SFX
    if (window.audioSystem) window.audioSystem.playSFX('choice_made');

    // Highlight selected choice
    if (window.rpgChoiceRenderer) {
      window.rpgChoiceRenderer.highlightSelected(index);
    }

    // Apply changes
    if (choice.changes && this.rpg.isEnabled()) {
      const results = this.rpg.applyChanges(choice.changes, this.state);
      if (window.rpgChoiceRenderer && choice.changes.show !== false) {
        window.rpgChoiceRenderer.showChangeFeedback(results, choice.changes.feedback);
      }

      // Update status bar after changes
      if (window.rpgStatusBar) {
        setTimeout(() => window.rpgStatusBar.render(), 300);
      }
    }

    // Set flags from choice
    if (choice.setFlag && this.rpg) {
      this.rpg.setFlag(choice.setFlag);
    }

    // Record interaction
    if (choice.interactionType && this.rpg) {
      this.rpg.recordInteraction(choice.interactionType);
    }

    // Check for delayed changes to queue
    if (choice.delayedChanges) {
      this._queueDelayedChanges(choice.delayedChanges);
    }

    // Navigate with brief delay for visual feedback
    if (choice.next) {
      setTimeout(() => {
        this.navigateTo(choice.next);
      }, 500);
    }
  }

  makeChoice(index) {
    if (!this.story || !this.currentNodeId) return;
    const node = this.currentNode;
    if (!node || !node.choices) return;
    this._handleStoryChoice(index, node.choices);
  }

  /* ================================================================
   * 3. Mode Indicator
   * ================================================================ */

  _showModeIndicator(meta, rpgEnabled) {
    const indicator = document.getElementById('story-mode-indicator');
    const text = document.getElementById('story-mode-text');
    if (!indicator || !text) return;

    const title = meta.title || '未命名剧本';
    text.innerHTML = `${title} ${rpgEnabled ? '<span class="rpg-badge">RPG</span>' : ''}`;
    indicator.style.display = 'flex';
  }

  /* ================================================================
   * 4. Milestones & Endings
   * ================================================================ */

  _checkMilestones(node) {
    if (!this.story || !this.story.milestones) return;

    for (const ms of this.story.milestones) {
      if (ms.once && this.rpg.hasFlag('milestone_' + ms.id)) continue;

      if (ms.condition) {
        const result = this.rpg.evaluateCondition(ms.condition, this.state);
        if (!result.result) continue;
      }

      // Milestone triggered
      this.rpg.setFlag('milestone_' + ms.id);

      // Show celebration (if achievement system exists)
      if (window.achievementSystem) {
        window.achievementSystem.register({ id: ms.id, name: ms.name, desc: ms.desc, category: 'story', rarity: 'common' });
        window.achievementSystem.tryUnlock(ms.id);
      }

      // Show notification
      if (window.uiController) {
        const celebrationLabels = { small: '达成', medium: '重要里程碑', large: '重大里程碑' };
        const label = celebrationLabels[ms.celebration] || '达成';
        window.uiController.showNotification(`${label}：${ms.name}`, 0, 'positive');
      }
    }
  }

  _triggerEnding(node) {
    if (!node.candidateEndings || !this.story || !this.story.endings) return;

    for (const endingId of node.candidateEndings) {
      const ending = this.story.endings.find(e => e.id === endingId);
      if (!ending) continue;

      // Check if ending condition is met (for hidden endings)
      if (ending.condition) {
        const result = this.rpg.evaluateCondition(ending.condition, this.state);
        if (!result.result) continue;
      }

      // Unlock ending
      if (window.endingSystem) {
        window.endingSystem.discover(ending.id);
      }

      // Show ending notification
      if (window.uiController) {
        const typeLabels = { true: '真结局', dark: '暗结局', neutral: '中性结局', romance: '浪漫结局', noble: '崇高结局', hidden: '隐藏结局', failure: '失败结局' };
        window.uiController.showNotification(`达成结局：${ending.name}（${typeLabels[ending.type] || ending.type}）`, 0, 'positive');
      }
    }
  }

  _loadStoryMeta(storyJson) {
    // Pre-load endings into ending system
    if (storyJson.endings && window.endingSystem) {
      for (const ending of storyJson.endings) {
        // Register as locked
        window.endingSystem.register(ending);
      }
    }
  }

  /* ================================================================
   * 5. Delayed Changes Queue
   * ================================================================ */

  _queueDelayedChanges(delayedChanges) {
    if (!Array.isArray(delayedChanges)) delayedChanges = [delayedChanges];
    for (const dc of delayedChanges) {
      this._delayedChangesQueue = this._delayedChangesQueue || [];
      this._delayedChangesQueue.push(dc);
    }
  }

  _applyDelayedChangesForNode(nodeId) {
    if (!this._delayedChangesQueue) return;
    const remaining = [];
    for (const dc of this._delayedChangesQueue) {
      if (dc.triggerNode === nodeId || dc.triggerNode === 'next') {
        if (dc.changes) {
          this.rpg.applyChanges(dc.changes, this.state);
          if (window.uiController) {
            window.uiController.showNotification('延迟后果触发', 0, 'info');
          }
        }
        if (dc.setFlag) {
          this.rpg.setFlag(dc.setFlag);
        }
      } else {
        remaining.push(dc);
      }
    }
    this._delayedChangesQueue = remaining;
  }

  /* ================================================================
   * 6. Import UI Controller
   * ================================================================ */

  static showImportOverlay() {
    const overlay = document.getElementById('story-import-overlay');
    if (overlay) overlay.classList.remove('hidden');
  }

  static hideImportOverlay() {
    const overlay = document.getElementById('story-import-overlay');
    if (overlay) overlay.classList.add('hidden');
  }

  static initImportUI(storyLoader) {
    const overlay = document.getElementById('story-import-overlay');
    const dropZone = document.getElementById('story-drop-zone');
    const fileBtn = document.getElementById('story-file-picker-btn');
    const fileInput = document.getElementById('story-file-input');
    const cancelBtn = document.getElementById('story-import-cancel');
    const statusEl = document.getElementById('story-import-status');
    const changeBtn = document.getElementById('story-change-btn');

    if (!overlay) return;

    // File picker
    if (fileBtn && fileInput) {
      fileBtn.addEventListener('click', () => fileInput.click());
      fileInput.addEventListener('change', (e) => {
        const file = e.target.files[0];
        if (file) storyLoader._handleImportFile(file);
      });
    }

    // Drag and drop
    if (dropZone) {
      dropZone.addEventListener('click', (e) => {
        if (e.target === fileBtn || fileBtn.contains(e.target)) return;
        if (fileInput) fileInput.click();
      });

      dropZone.addEventListener('dragover', (e) => {
        e.preventDefault();
        dropZone.classList.add('drag-over');
      });
      dropZone.addEventListener('dragleave', () => {
        dropZone.classList.remove('drag-over');
      });
      dropZone.addEventListener('drop', (e) => {
        e.preventDefault();
        dropZone.classList.remove('drag-over');
        const file = e.dataTransfer.files[0];
        if (file && file.name.endsWith('.json')) {
          storyLoader._handleImportFile(file);
        } else if (statusEl) {
          statusEl.textContent = '请拖入 .json 文件';
          statusEl.className = 'story-import-status error';
          statusEl.style.display = 'block';
        }
      });
    }

    // Cancel
    if (cancelBtn) {
      cancelBtn.addEventListener('click', () => {
        RPGStoryLoader.hideImportOverlay();
      });
    }

    // Change story button
    if (changeBtn) {
      changeBtn.addEventListener('click', () => {
        RPGStoryLoader.showImportOverlay();
      });
    }
  }

  async _handleImportFile(file) {
    const statusEl = document.getElementById('story-import-status');
    if (statusEl) {
      statusEl.textContent = '正在加载 ' + file.name + ' ...';
      statusEl.className = 'story-import-status';
      statusEl.style.display = 'block';
    }

    const result = await this.loadFromFile(file);

    if (result && result.success !== false) {
      if (statusEl) {
        statusEl.textContent = '加载成功！' + (result.rpgEnabled ? '（RPG 模式已启用）' : '（文学模式）');
        statusEl.className = 'story-import-status success';
      }
      // Close overlay after brief delay
      setTimeout(() => RPGStoryLoader.hideImportOverlay(), 800);
    } else {
      if (statusEl) {
        statusEl.textContent = '加载失败：' + (result.error || '未知错误');
        statusEl.className = 'story-import-status error';
      }
    }
  }

  /* ================================================================
   * 7. Current Node Access
   * ================================================================ */

  get currentNode() {
    if (!this.story || !this.currentNodeId) return null;
    return this.story.nodes.find(n => n.id === this.currentNodeId) || null;
  }

  /* ================================================================
   * 8. Iframe Communication (postMessage)
   * ================================================================ */

  _postToParent(type, data) {
    if (window.parent && window.parent !== window) {
      try {
        window.parent.postMessage({
          source: 'rpg-player',
          type: type,
          data: data
        }, '*');
      } catch (e) {
        // Not in iframe, ignore
      }
    }
  }

  _onParentMessage(event) {
    if (!event.data || event.data.source !== 'platform') return;

    switch (event.data.type) {
      case 'getState':
        this._postToParent('stateResponse', {
          nodeId: this.currentNodeId,
          isStoryMode: this.isStoryMode,
          genre: this.state ? this.state.genre : null,
          chapter: this.state ? this.state.chapter : null,
          stats: this.state ? this.state.getAll() : null
        });
        break;

      case 'navigateTo':
        if (event.data.nodeId) {
          this.navigateTo(event.data.nodeId);
        }
        break;
    }
  }

  // Listen for parent messages
  _initParentListener() {
    window.addEventListener('message', this._onParentMessage.bind(this));
  }
};
