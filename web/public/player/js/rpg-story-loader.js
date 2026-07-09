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
    this._countdownTimer = null;
    this._countdownValue = 0;
    this._countdownWarningShown = false;
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

    // ── Schema v1.1 兼容层 ──
    // 如果 nodes 是字典格式，转换为播放器使用的数组格式
    if (storyJson.nodes && !Array.isArray(storyJson.nodes)) {
      storyJson = this._normalizeV11(storyJson);
    }

    this.story = storyJson;
    this.isStoryMode = true;

    // Initialize RPG core (may or may not be enabled)
    const rpgEnabled = this.rpg.loadStory(storyJson);

    // Reset inventory to empty when loading a story script
    // (unless the story provides initial inventory)
    if (!storyJson.initialInventory) {
      this.state.inventory = {};
    } else {
      this.state.inventory = JSON.parse(JSON.stringify(storyJson.initialInventory));
    }
    this._updateInventoryBadge();

    // Initialize flags (these are not affected by switchGenre reset)
    if (storyJson.flags && Array.isArray(storyJson.flags)) {
      for (const flag of storyJson.flags) {
        this.rpg.setFlag(flag);
      }
    }

    // Initialize NPC affinities (npcRelations is already a flat array after _normalizeV11)
    if (storyJson.npcRelations) {
      this.state.npcAffinities = {};
      const npcList = Array.isArray(storyJson.npcRelations) ? storyJson.npcRelations : [];
      for (const npc of npcList) {
        if (npc && npc.id) {
          this.state.npcAffinities[npc.id] = npc.initialAffinity || npc.defaultAffinity || 0;
        }
      }
    }

    // Initialize time pressure
    if (storyJson.timePressure) {
      this._initTimePressure(storyJson.timePressure);
    }

    // Set genre from meta
    if (storyJson.meta.genre) {
      this.state.genre = storyJson.meta.genre;
      if (this.theme) this.theme.switchGenre(storyJson.meta.genre);
    }

    // Apply initial state AFTER switchGenre (which resets stats from data.js)
    this.state.stats = {};
    const storyVars = storyJson.initialState || storyJson.variables || {};
    for (const [key, val] of Object.entries(storyVars)) {
      this.state.stats[key] = val;
    }

    // Re-apply inventory (switchGenre may have reset it)
    this.state.inventory = {};
    this._updateInventoryBadge();

    // Build chapter list from story nodes (ordered by first appearance)
    const chapterSet = new Set();
    const chapterList = [];
    for (const n of storyJson.nodes) {
      if (n.chapter && !chapterSet.has(n.chapter)) {
        chapterSet.add(n.chapter);
        chapterList.push(n.chapter);
      }
    }
    if (chapterList.length > 0 && window.state) {
      window.state.chapters = chapterList;
      window.state.chapter = 0;
      window.state.maxUnlockedChapter = 0;
    }

    // Show mode indicator
    this._showModeIndicator(storyJson.meta, rpgEnabled);

    // Find start node (v1.1 startNodeId or legacy 'start' id)
    const startId = storyJson.startNodeId || 'start';
    const startNode = this.story.nodes.find(n => n.id === startId) || this.story.nodes[0];

    // Hide legacy interaction area (not used in story mode)
    const interactionsArea = document.getElementById('interactions-area');
    if (interactionsArea) interactionsArea.style.display = 'none';

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

    // Check auto-unlock achievements
    this._checkAutoUnlockAchievements();

    // Check time pressure consequences
    this._checkTimePressure(node);

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

    // Track chapter progress for story mode
    if (node.chapter && window.state && window.state.chapters) {
      const idx = window.state.chapters.indexOf(node.chapter);
      if (idx >= 0) {
        window.state.chapter = idx;
        if (idx > window.state.maxUnlockedChapter) {
          window.state.maxUnlockedChapter = idx;
        }
        if (this.theme) this.theme._renderChapterSelector();
      }
    }

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

    // Immediately disable ALL choice buttons to prevent double-clicks
    const container = document.getElementById('choices-area');
    if (container) {
      container.querySelectorAll('.choice-btn').forEach(btn => {
        btn.disabled = true;
      });
    }

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
    const triggered = [];
    for (const dc of this._delayedChangesQueue) {
      if (dc.triggerNode === nodeId || dc.triggerNode === 'next') {
        triggered.push(dc);
        if (dc.changes) {
          this.rpg.applyChanges(dc.changes, this.state);
        }
        if (dc.setFlag) {
          this.rpg.setFlag(dc.setFlag);
        }
      } else {
        remaining.push(dc);
      }
    }
    this._delayedChangesQueue = remaining;

    // Visual feedback for triggered delayed changes
    if (triggered.length > 0 && window.uiController) {
      const reasons = triggered.map(dc => dc.reason).filter(Boolean);
      const changeList = [];
      for (const dc of triggered) {
        if (dc.changes) {
          if (dc.changes.set) {
            for (const [key, val] of Object.entries(dc.changes.set)) {
              changeList.push({ label: key, value: val });
            }
          }
          if (dc.changes.val !== undefined) {
            changeList.push({ label: '主状态', delta: dc.changes.val });
          }
          if (dc.changes.feedback) {
            for (const fb of dc.changes.feedback) {
              changeList.push({ label: fb.label, delta: fb.delta, tone: fb.tone });
            }
          }
        }
      }
      window.uiController.showDelayedChangeNotification(reasons, changeList);
    }
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

  _updateInventoryBadge() {
    const badge = document.getElementById('inv-badge');
    if (!badge) return;
    const count = this.state ? this.state.getTotalItemCount() : 0;
    badge.textContent = count;
    badge.style.display = count > 0 ? 'flex' : 'none';
  }

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

  /* ================================================================
   * 9. Time Pressure System
   * ================================================================ */

  _initTimePressure(config) {
    if (!config || !config.enabled) return;
    this._timePressureConfig = config;
    this._countdownValue = config.countdown || 0;
    this._countdownWarningShown = false;

    if (this._countdownValue > 0) {
      this._startCountdown();
    }

    // Show initial UI
    if (this.ui) {
      this.ui.showTimePressureUI(config.label || '时间', this._countdownValue, config.countdown);
    }
  }

  _startCountdown() {
    this._stopCountdown();
    this._countdownTimer = setInterval(() => {
      this._countdownValue--;
      if (this.ui) {
        this.ui.updateTimePressureUI(this._countdownValue, this._timePressureConfig.countdown);
      }

      // Warning at 30% remaining
      const warningThreshold = Math.floor(this._timePressureConfig.countdown * 0.3);
      if (this._countdownValue <= warningThreshold && !this._countdownWarningShown) {
        this._countdownWarningShown = true;
        if (this.ui) {
          this.ui.showNotification(this._timePressureConfig.warningMessage || '时间紧迫！', 0, 'negative');
        }
      }

      // Timeout
      if (this._countdownValue <= 0) {
        this._stopCountdown();
        this._handleTimeout();
      }
    }, 1000);
  }

  _stopCountdown() {
    if (this._countdownTimer) {
      clearInterval(this._countdownTimer);
      this._countdownTimer = null;
    }
  }

  _handleTimeout() {
    const config = this._timePressureConfig;
    if (!config) return;

    // Apply timeout consequence
    if (config.timeoutNode) {
      this.navigateTo(config.timeoutNode);
    }
    if (config.timeoutFlag) {
      this.rpg.setFlag(config.timeoutFlag);
    }
    if (this.ui) {
      this.ui.showNotification(config.timeoutMessage || '时间耗尽！', 0, 'negative');
    }
  }

  _checkTimePressure(node) {
    // Apply per-node decay if configured
    const config = this._timePressureConfig;
    if (!config || !config.globalDecay) return;

    const decay = config.globalDecay;
    if (decay.variables) {
      for (const [key, delta] of Object.entries(decay.variables)) {
        if (this.state.stats[key] !== undefined) {
          this.state.stats[key] += delta;
        }
      }
    }
    if (decay.affinity && this.state.npcAffinities) {
      for (const [npcId, delta] of Object.entries(decay.affinity)) {
        if (this.state.npcAffinities[npcId] !== undefined) {
          this.state.npcAffinities[npcId] += delta;
        }
      }
    }

    // Show decay feedback
    if (this.ui && (decay.message || decay.variables)) {
      this.ui.showNotification(decay.message || '时间流逝，状态发生变化...', 0, 'info');
    }
  }

  /* ================================================================
   * 10. Auto-Unlock Achievement Check
   * ================================================================ */

  _checkAutoUnlockAchievements() {
    if (!this.story || !this.story.achievements) return;
    if (!window.achievementSystem) return;

    for (const [id, def] of Object.entries(this.story.achievements)) {
      if (window.achievementSystem.unlocked && window.achievementSystem.unlocked.has(id)) continue;
      if (this.rpg.checkAutoUnlock(id, def, this.state)) {
        window.achievementSystem.register({ id, name: def.title, desc: def.description, category: def.category || 'general', rarity: def.rarity || 'common' });
        window.achievementSystem.tryUnlock(id);
      }
    }
  }

  /* ================================================================
   * 11. NPC Affinity Helpers
   * ================================================================ */

  getNPCAffinity(npcId) {
    return this.state && this.state.npcAffinities ? (this.state.npcAffinities[npcId] || 0) : 0;
  }

  setNPCAffinity(npcId, value) {
    if (!this.state.npcAffinities) this.state.npcAffinities = {};
    const old = this.state.npcAffinities[npcId] || 0;
    this.state.npcAffinities[npcId] = value;
    if (this.ui) {
      const delta = value - old;
      const label = this._getNPCLabel(npcId) || npcId;
      this.ui.showNotification(`${label} 好感度 ${delta > 0 ? '+' : ''}${delta}`, delta, delta >= 0 ? 'positive' : 'negative');
    }
  }

  _getNPCLabel(npcId) {
    if (!this.story || !this.story.npcRelations) return npcId;
    const npcList = this.story.npcRelations.npcs || this.story.npcRelations;
    if (Array.isArray(npcList)) {
      const npc = npcList.find(n => n.id === npcId);
      return npc ? npc.name : npcId;
    }
    return npcId;
  }

  /* ================================================================
   * 12. Schema v1.1 Normalization
   * ================================================================ */

  _normalizeV11(json) {
    // Convert v1.1 dict-nodes to legacy array-nodes
    const nodesDict = json.nodes || {};
    const nodesArray = [];

    for (const [id, node] of Object.entries(nodesDict)) {
      const normalized = {
        id: node.id || id,
        chapter: node.chapterTitle || '',
        text: Array.isArray(node.segments) ? node.segments.join('\n\n') : (node.text || ''),
        type: node.isEnding ? 'ending' : 'narrative',
        candidateEndings: node.isEnding ? Object.keys(json.endings || {}) : undefined,
      };

      // Convert choices
      if (node.choices && node.choices.length > 0) {
        normalized.choices = node.choices.map(ch => {
          const result = {
            id: ch.id,
            text: ch.text,
            next: ch.targetNodeId || ch.next,
          };

          // Convert condition (v1.1 variable/operator/value → var/op/value)
          if (ch.condition) {
            if (ch.condition.variable) {
              result.condition = { var: ch.condition.variable, op: ch.condition.operator, value: ch.condition.value };
            } else if (ch.condition.flag) {
              result.condition = { flag: ch.condition.flag };
            } else if (ch.condition.all || ch.condition.any) {
              result.condition = ch.condition;
            }
            if (ch.conditionDisplay) {
              result.conditionDisplay = ch.conditionDisplay;
            }
          }

          // Convert changes — v1.1 array format → flat object format
          // v1.1: [{ variable, value, addFlag, addFlags }]
          // applyChanges expects: { key: delta, show: true, feedback: {...}, flags: [...], inventory: [...] }
          if (ch.changes && ch.changes.length > 0) {
            result.changes = {};
            const flags = [];
            for (const c of ch.changes) {
              if (c.variable && c.value !== undefined) {
                result.changes[c.variable] = c.value;
              }
              if (c.addFlag) flags.push(c.addFlag);
              if (c.addFlags) flags.push(...c.addFlags);
            }
            if (flags.length > 0) {
              result.changes.flags = flags;
            }
            // Default: show feedback for visible changes
            const hasChanges = Object.keys(result.changes).some(k => k !== 'flags');
            if (hasChanges) {
              result.changes.show = true;
              result.changes.feedback = { style: 'toast', duration: 2500 };
            }
          }

          // weight
          if (ch.weight) result.weight = ch.weight;

          // weightHint
          if (ch.weightHint) result.weightHint = ch.weightHint;

          // affinityChanges
          if (ch.affinityChanges) {
            result.affinityChanges = ch.affinityChanges;
          }

          return result;
        });
      } else {
        normalized.choices = [];
      }

      nodesArray.push(normalized);
    }

    // Convert endings: dict → array (preserve id field)
    const endings = json.endings
      ? Object.entries(json.endings).map(([id, e]) => ({
          id: e.id || id,
          name: e.title || e.name || id,
          desc: e.description || e.desc || '',
          type: e.type || 'neutral',
          closing: e.description || '',
          condition: e.condition,
        }))
      : [];

    // Convert npcRelations: nested → flat array with initialAffinity
    let npcRelations = [];
    if (json.npcRelations) {
      if (Array.isArray(json.npcRelations)) {
        npcRelations = json.npcRelations;
      } else if (json.npcRelations.npcs && Array.isArray(json.npcRelations.npcs)) {
        npcRelations = json.npcRelations.npcs.map(npc => ({
          id: npc.id,
          name: npc.name,
          initialAffinity: npc.defaultAffinity || npc.initialAffinity || 0,
          categories: npc.categories,
          avatar: npc.avatar,
          description: npc.description,
        }));
      }
    }

    // Convert milestones
    const milestones = json.milestones || [];

    return {
      meta: json.meta,
      initialState: json.variables || json.initialState || {},
      nodes: nodesArray,
      milestones,
      endings,
      npcRelations,
      timePressure: json.timePressure,
      achievements: json.achievements,
      startNodeId: json.startNodeId,
    };
  }
};
