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

    // v2.0: Register story-specific stat labels for custom primaryStats
    if (storyJson.meta.rpg?.primaryStats && this.state) {
      this.state._storyStatLabels = {};
      for (const stat of storyJson.meta.rpg.primaryStats) {
        this.state._storyStatLabels[stat.key] = stat.label;
      }
    }

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

    // Initialize portrait system from NPC data
    if (storyJson.npcRelations && window.portraitSystem) {
      const npcList = Array.isArray(storyJson.npcRelations)
        ? storyJson.npcRelations
        : (storyJson.npcRelations.npcs || []);
      for (const npc of npcList) {
        if (npc && npc.id) {
          window.portraitSystem.registerCharacter(npc.id, {
            name: npc.name,
            avatar: npc.avatar,
            stand: npc.stand,
            color: npc.color,
          });
        }
      }
    }

    // v2.0: Initialize new systems
    if (window.ExplorationRenderer) {
      window.explorationRenderer = new window.ExplorationRenderer(this.rpg, this.state, window.uiController, this);
    }
    if (window.DialogueRenderer) {
      window.dialogueRenderer = new window.DialogueRenderer(this.rpg, this.state, window.uiController, this);
    }
    if (window.CheckDisplay) {
      window.checkDisplay = new window.CheckDisplay(this.rpg, this.state);
    }
    if (window.ItemUseSystem) {
      window.itemUseSystem = new window.ItemUseSystem(this.rpg, this.state, this);
    }

    // Initialize time pressure
    if (storyJson.timePressure) {
      this._initTimePressure(storyJson.timePressure);
    }

    // Set genre from meta — skip demo story loading (we have our own story)
    if (storyJson.meta.genre) {
      this.state.genre = storyJson.meta.genre;
      if (this.theme) this.theme.switchGenre(storyJson.meta.genre, true);
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
    // Fallback: if node has no chapter field but title matches "第X章" pattern, use it
    const chapterSet = new Set();
    const chapterList = [];
    const _chPat = /^第[\d一二三四五六七八九十百千]+章/;
    for (const n of storyJson.nodes) {
      let ch = n.chapter;
      if (!ch && n.title && _chPat.test(n.title)) ch = n.title;
      if (ch && !chapterSet.has(ch)) {
        chapterSet.add(ch);
        chapterList.push(ch);
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
    this._applyDelayedChangesForNode(nodeId);
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
    // Clear choices area at the start of every node render
    // (each node type will re-render its own controls as needed)
    const choicesContainer = document.getElementById('choices-area');
    if (choicesContainer) choicesContainer.innerHTML = '';

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

    // v2.0: Grant items on node entry
    if (node.grantItems) {
      this.rpg.grantItems(node.grantItems, this.state);
    }

    // Handle scene transition
    if (node.scene) {
      this._handleSceneTransition(node.scene);
    }

    // Check node-level condition guard
    if (node.condition) {
      const condResult = this.rpg.evaluateCondition(node.condition, this.state);
      if (!condResult.result) {
        // Skip this node, auto-advance
        if (node.next) {
          setTimeout(() => this.navigateTo(node.next), 100);
          return;
        }
      }
    }

    // Render scene title if present
    if (node.title) {
      this._renderSceneTitle(node.title);
    }

    // Update narrative text: segments or plain text
    const narrativeEl = document.getElementById('narrative-text');
    if (narrativeEl) {
      narrativeEl.style.opacity = '0';
      setTimeout(() => {
        let html = '';
        if (node.segments && node.segments.length > 0) {
          html = this._renderSegments(node.segments);
        } else if (node.text) {
          html = `<p class="narrative-paragraph">${node.text}</p>`;
        }
        // v2.0: Render conditional segments together with main segments
        if (node.conditionalSegments && node.conditionalSegments.length > 0) {
          for (const cs of node.conditionalSegments) {
            const condResult = this.rpg.evaluateCondition(cs.condition, this.state);
            if (condResult.result && cs.segments) {
              html += this._renderSegments(cs.segments);
            }
          }
        }
        narrativeEl.innerHTML = html;
        narrativeEl.style.opacity = '1';
      }, 150);
    }

    // Render interactions if present
    if (node.interactions && node.interactions.length > 0) {
      this._renderInteractions(node.interactions);
    }

    // v2.0: Render item use bar for current node
    if (window.itemUseSystem) {
      window.itemUseSystem.renderItemUseBar(node.id);
    }

    // v2.0: Node type dispatch
    const nodeType = node.type || this._inferNodeType(node);

    // Clear v2.0 areas
    const explorationArea = document.getElementById('exploration-area');
    const dialogueArea = document.getElementById('dialogue-area');
    const checkArea = document.getElementById('check-area');
    const itemUseBar = document.getElementById('item-use-bar');
    if (explorationArea) explorationArea.innerHTML = '';
    if (dialogueArea) dialogueArea.innerHTML = '';
    if (checkArea) checkArea.innerHTML = '';
    if (itemUseBar) itemUseBar.innerHTML = '';

    if (nodeType === 'exploration' && node.explorables) {
      // Render exploration elements
      if (window.explorationRenderer) {
        window.explorationRenderer.renderExplorables(node.explorables);
      }
      // Exploration nodes may also have a "continue" button
      if (node.next) {
        this._renderContinueButton(node.next);
      }
    } else if (nodeType === 'dialogue' && node.dialogue) {
      // Render dialogue
      if (window.dialogueRenderer) {
        window.dialogueRenderer.renderDialogue(node.dialogue);
      }
      // Store the next target for after dialogue ends
      this._postDialogueNext = node.next || null;
    } else if (nodeType === 'check' && node.check) {
      // Render check — show a placeholder immediately so the user knows a check is happening
      const checkArea = document.getElementById('check-area');
      if (checkArea) {
        checkArea.innerHTML = `<div class="check-panel check-rolling"><div class="check-header"><span class="check-skill-name">检定准备中...</span></div></div>`;
      }
      this._handleCheckNode(node);
    } else {
      // Default: choice/ending/narrative/scene_transition — existing behavior
      // v2.0: Narrative nodes with next but no choices get a continue button
      if (nodeType === 'narrative' && node.next && !(node.choices && node.choices.length > 0)) {
        this._renderContinueButton(node.next);
      }
      // v2.0: Ending nodes get a restart button
      if (nodeType === 'ending') {
        this._renderEndingControls(node);
      }
    }

    // Render choices via RPGChoiceRenderer or fallback
    // v2.0: Skip for exploration/dialogue/check/ending nodes, and narrative nodes that already have a continue button
    const hasContinueBtn = document.getElementById('continue-btn');
    const skipChoiceRender = ['exploration', 'dialogue', 'check', 'ending'].includes(nodeType) || hasContinueBtn;
    if (!skipChoiceRender) {
      if (this.rpg.isEnabled() && window.rpgChoiceRenderer) {
        window.rpgChoiceRenderer.renderChoices(node.choices || []);
      } else if (this.theme) {
        this.theme._renderChoices(node.choices || []);
      }
    }

    // Update status bar
    if (this.rpg.isEnabled() && window.rpgStatusBar) {
      window.rpgStatusBar.render();
    } else if (this.theme) {
      this.theme._renderStats();
    }

    // Bind choice click events for story mode
    this._bindChoiceEvents(node.choices || []);

    // Auto-routes: if no choices or choices are empty, evaluate routes
    const effectiveChoices = (node.choices || []).filter(c => {
      if (!c.condition) return true;
      const evalResult = this.rpg.evaluateCondition(c.condition, this.state);
      return evalResult.result;
    });
    // v2.0: Determine if this node type should auto-advance
    // exploration/dialogue/check/narrative nodes require player interaction before advancing
    const nonAutoAdvanceTypes = ['exploration', 'dialogue', 'check', 'narrative'];
    const shouldAutoAdvance = !nonAutoAdvanceTypes.includes(nodeType);

    if (effectiveChoices.length === 0 && shouldAutoAdvance) {
      if (node.routes && node.routes.length > 0) {
        for (const route of node.routes) {
          if (route.condition === 'default') {
            setTimeout(() => this.navigateTo(route.next), 1200);
            return;
          }
          if (route.condition) {
            const evalResult = this.rpg.evaluateCondition(route.condition, this.state);
            if (evalResult.result) {
              setTimeout(() => this.navigateTo(route.next), 1200);
              return;
            }
          }
        }
      } else if (node.next) {
        // Direct next-node auto-advance
        setTimeout(() => this.navigateTo(node.next), 1200);
      }
    }

  }

  /* ── Segments rendering ─────────────── */
  _renderSegments(segments) {
    return segments.map((seg, i) => {
      const delay = i * 80;
      const effectClass = seg.effect ? `effect-${seg.effect}` : '';
      if (seg.speaker) {
        // Try to show portrait for speaker
        const npcId = this._findNPCBySpeaker(seg.speaker);
        if (npcId && window.portraitSystem) {
          window.portraitSystem.showDialogue(npcId, seg.text);
        }
        return `<div class="dialogue-line ${effectClass}" style="animation-delay:${delay}ms">
          <span class="speaker-name">${seg.speaker}</span>
          <span class="dialogue-text">${seg.text}</span>
        </div>`;
      } else {
        // Hide stand when no speaker
        if (i === 0 && window.portraitSystem) {
          window.portraitSystem.hideStand();
        }
        return `<p class="narrative-paragraph ${effectClass}" style="animation-delay:${delay}ms">${seg.text}</p>`;
      }
    }).join('');
  }

  /* ── v2.0: Node type inference ──────── */
  _inferNodeType(node) {
    if (node.isEnding || node.candidateEndings) return 'ending';
    if (node.dialogue) return 'dialogue';
    if (node.check) return 'check';
    if (node.explorables && node.explorables.length > 0) return 'exploration';
    if (node.choices && node.choices.length > 0) return 'choice';
    return 'narrative';
  }

  /* ── v2.0: Check node handler ───────── */
  async _handleCheckNode(node) {
    try {
      const checkDef = node.check;
      const checkDisplay = window.checkDisplay;

      if (!checkDisplay) {
        this._showCheckFallback(node);
        return;
      }

      if (checkDef.passive) {
        // Passive check — no animation, just show result
        const result = this.rpg.rollCheck(checkDef, this.state);
        checkDisplay.showPassiveResult(checkDef, result);
        const outcome = result.success ? checkDef.onSuccess : checkDef.onFailure;
        this._applyCheckOutcome(outcome);
      } else {
        // Active check — show animation, then result
        const result = await checkDisplay.performAndDisplay(checkDef);
        if (result && result.blocked) {
          this._renderContinueButton(node.next);
          return;
        }
        const outcome = result && result.success ? checkDef.onSuccess : checkDef.onFailure;
        this._applyCheckOutcome(outcome);

        // Append outcome text to narrative
        const narrative = document.getElementById('narrative-text');
        if (narrative && outcome) {
          const outcomeText = typeof outcome.text === 'string' ? outcome.text : (outcome.text || []).map(s => typeof s === 'string' ? s : s.text).join('');
          if (outcomeText) {
            const el = document.createElement('div');
            el.className = 'check-narrative ' + ((result && result.success) ? 'check-success-text' : 'check-failure-text');
            el.textContent = outcomeText;
            narrative.appendChild(el);
            narrative.scrollTop = narrative.scrollHeight;
          }
        }
      }

      // Show continue button instead of auto-advance, so player can read the result
      if (node.next) {
        this._renderContinueButton(node.next);
      }
    } catch (err) {
      console.error('[Check] Error in _handleCheckNode:', err);
      this._showCheckFallback(node);
    }
  }

  _showCheckFallback(node) {
    const checkArea = document.getElementById('check-area');
    if (checkArea) {
      checkArea.innerHTML = `
        <div class="check-panel check-fallback">
          <p class="check-fallback-text">检定完成。</p>
        </div>
      `;
    }
    if (node.next) {
      this._renderContinueButton(node.next);
    }
  }

  _applyCheckOutcome(outcome) {
    if (!outcome) return;
    if (outcome.changes) {
      for (const [key, val] of Object.entries(outcome.changes)) {
        const old = this.state.get(key);
        this.state.set(key, old + val);
      }
    }
    if (outcome.affinityChanges) {
      this.rpg.applyAffinityChanges(outcome.affinityChanges, this.state);
    }
    if (outcome.grantItems && this.story) {
      const storyItems = this.story.items || {};
      const itemDefs = outcome.grantItems.map(id => storyItems[id]).filter(Boolean);
      this.rpg.grantItems(itemDefs, this.state);
    }
    if (outcome.flag) {
      this.rpg.setFlag(outcome.flag);
    }
    if (outcome.unlock) {
      this.rpg.setFlag(outcome.unlock);
    }
  }

  /* ── v2.0: Continue button ──────────── */
  _renderContinueButton(nextNodeId) {
    const container = document.getElementById('choices-area');
    if (!container) return;
    container.innerHTML = `
      <button class="choice-btn" id="continue-btn" data-next="${nextNodeId}">
        <span class="choice-text">继续前进 →</span>
      </button>
    `;
    const btn = document.getElementById('continue-btn');
    if (btn) {
      btn.addEventListener('click', () => {
        this.navigateTo(nextNodeId);
      });
    }
  }

  /* ── v2.0: Ending controls ──────────── */
  _renderEndingControls(node) {
    const container = document.getElementById('choices-area');
    if (!container) return;

    const endingName = node.title || '结局';
    const hasNext = !!node.next;

    container.innerHTML = `
      <div class="ending-controls">
        <p class="ending-hint">— ${endingName} —</p>
        ${hasNext ? `
          <button class="choice-btn" id="continue-next-chapter-btn">
            <span class="choice-text">→ 继续下一章</span>
          </button>
        ` : ''}
        <button class="choice-btn" id="restart-btn">
          <span class="choice-text">↺ 重新开始</span>
        </button>
      </div>
    `;

    if (hasNext) {
      const nextBtn = document.getElementById('continue-next-chapter-btn');
      if (nextBtn) {
        nextBtn.addEventListener('click', () => {
          // Unlock next chapter
          if (node.chapter && window.state && window.state.chapters) {
            const idx = window.state.chapters.indexOf(node.chapter);
            if (idx >= 0 && idx + 1 < window.state.chapters.length) {
              window.state.maxUnlockedChapter = Math.max(window.state.maxUnlockedChapter, idx + 1);
              if (this.theme) this.theme._renderChapterSelector();
            }
          }
          this.navigateTo(node.next);
        });
      }
    }

    const btn = document.getElementById('restart-btn');
    if (btn) {
      btn.addEventListener('click', () => {
        if (this.story) {
          this.restart();
        }
      });
    }
  }

  /**
   * Restart the current story from the beginning.
   * Fully resets all systems and state in-memory (no page reload).
   */
  restart() {
    if (!this.story) return;

    // 1. Clear persisted state
    localStorage.clear();
    sessionStorage.clear();

    // 2. Reset RPG flags & interactions
    if (this.rpg) {
      this.rpg.flags = new Set();
      if (this.story.flags && Array.isArray(this.story.flags)) {
        for (const flag of this.story.flags) {
          this.rpg.setFlag(flag);
        }
      }
      this.rpg.interactionsDone = new Set();
    }

    // 3. Reset game state to initial values
    if (this.state) {
      this.state.stats = {};
      const storyVars = this.story.initialState || this.story.variables || {};
      for (const [key, val] of Object.entries(storyVars)) {
        this.state.stats[key] = val;
      }

      // Reset inventory
      this.state.inventory = {};
      if (this.story.initialInventory) {
        this.state.inventory = JSON.parse(JSON.stringify(this.story.initialInventory));
      }
      this._updateInventoryBadge();

      // Reset NPC affinities
      if (this.story.npcRelations) {
        this.state.npcAffinities = {};
        const npcList = Array.isArray(this.story.npcRelations) ? this.story.npcRelations : [];
        for (const npc of npcList) {
          if (npc && npc.id) {
            this.state.npcAffinities[npc.id] = npc.initialAffinity || npc.defaultAffinity || 0;
          }
        }
      }

      // Reset chapter progress
      if (window.state && window.state.chapters) {
        window.state.chapter = 0;
        window.state.maxUnlockedChapter = 0;
        if (this.theme) this.theme._renderChapterSelector();
      }

      // Re-register story stat labels
      if (this.story.meta.rpg?.primaryStats) {
        this.state._storyStatLabels = {};
        for (const stat of this.story.meta.rpg.primaryStats) {
          this.state._storyStatLabels[stat.key] = stat.label;
        }
      }
    }

    // 4. Clear all UI areas
    const narrativeEl = document.getElementById('narrative-text');
    if (narrativeEl) {
      narrativeEl.style.opacity = '0';
      narrativeEl.innerHTML = '';
    }
    const explorationArea = document.getElementById('exploration-area');
    const dialogueArea = document.getElementById('dialogue-area');
    const checkArea = document.getElementById('check-area');
    const itemUseBar = document.getElementById('item-use-bar');
    const choicesContainer = document.getElementById('choices-area');
    if (explorationArea) explorationArea.innerHTML = '';
    if (dialogueArea) dialogueArea.innerHTML = '';
    if (checkArea) checkArea.innerHTML = '';
    if (itemUseBar) itemUseBar.innerHTML = '';
    if (choicesContainer) choicesContainer.innerHTML = '';

    // 5. Reset scene
    const sceneImg = document.getElementById('scene-image');
    const placeholder = document.querySelector('.scene-placeholder');
    if (sceneImg) { sceneImg.src = ''; sceneImg.style.display = 'none'; }
    if (placeholder) placeholder.style.display = '';
    const titleEl = document.getElementById('scene-title');
    if (titleEl) { titleEl.textContent = ''; titleEl.style.display = 'none'; }
    this._lastSceneName = null;

    // 6. Reset internal navigation state
    this.currentNodeId = null;
    this._postDialogueNext = null;
    this._delayedChangesQueue = null;
    if (this._countdownTimer) {
      clearInterval(this._countdownTimer);
      this._countdownTimer = null;
    }
    this._countdownValue = 0;
    this._countdownWarningShown = false;

    // 7. Navigate to start node
    const startId = this.story.startNodeId || 'start';
    const startNode = this.story.nodes.find(n => n.id === startId) || this.story.nodes[0];
    if (startNode) {
      setTimeout(() => {
        this.navigateTo(startNode.id);
      }, 100);
    }
  }

  /* ── v2.0: Dialogue end callback ────── */
  _onDialogueEnd() {
    if (this._postDialogueNext) {
      const next = this._postDialogueNext;
      this._postDialogueNext = null;
      this.navigateTo(next);
    }
  }

  /* ── Scene transition ───────────────── */
  _handleSceneTransition(scene) {
    // Update scene image
    const sceneImg = document.getElementById('scene-image');
    const placeholder = document.querySelector('.scene-placeholder');
    if (sceneImg && scene.background) {
      sceneImg.src = scene.background;
      sceneImg.style.display = 'block';
      if (placeholder) placeholder.style.display = 'none';
    }
    // Update genre tag if scene specifies genre
    const genreTag = document.getElementById('genre-tag');
    if (genreTag && scene.genre) {
      genreTag.textContent = scene.genre;
    }
    // Trigger transition animation if scene name changed
    if (scene.name && this.theme && this._lastSceneName !== scene.name) {
      this._lastSceneName = scene.name;
      this.theme.triggerChapterTransition(this.state.genre, scene.name);
    }
  }

  /* ── Scene title ────────────────────── */
  _renderSceneTitle(title) {
    const titleEl = document.getElementById('scene-title');
    if (titleEl) {
      titleEl.textContent = title;
      titleEl.style.display = 'block';
    }
  }

  /* ── Interactions rendering ─────────── */
  _renderInteractions(interactions) {
    const area = document.getElementById('interactions-area');
    const grid = document.getElementById('interactions-grid');
    if (!grid) return;

    grid.innerHTML = interactions.map((inter, idx) => {
      // Check once flag — if already done, show as disabled
      const onceKey = inter.id || inter.type;
      const isDone = inter.once && this.rpg.interactionsDone.has(onceKey);
      const disabledClass = isDone ? 'disabled' : '';
      const depthClass = inter.depth ? `depth-${inter.depth}` : '';
      const hintAttr = inter.hint ? `title="${inter.hint}"` : '';

      return `
        <button class="interaction-btn ${disabledClass} ${depthClass}"
                data-interaction-type="${inter.type}"
                data-interaction-index="${idx}"
                data-interaction-id="${inter.id || ''}"
                ${disabledClass ? 'disabled' : ''}
                ${hintAttr}
                aria-label="${inter.label}">
          <svg class="btn-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5"><use href="#icon-${inter.icon || 'box'}"/></svg>
          <span class="btn-label">${inter.label}</span>
          ${inter.hint ? `<span class="interaction-hint">${inter.hint}</span>` : ''}
        </button>
      `;
    }).join('');

    if (area) area.style.display = '';
  }

  _bindChoiceEvents(choices) {
    const container = document.getElementById('choices-area');
    if (!container) return;

    // Exclude continue-btn and restart-btn from choice event binding
    container.querySelectorAll('.choice-btn:not(#continue-btn):not(#restart-btn)').forEach((btn) => {
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

    // Close chapter dropdown if open
    const dropdown = document.getElementById('chapter-dropdown');
    if (dropdown && !dropdown.classList.contains('hidden')) {
      dropdown.classList.add('hidden');
    }

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
      // Always show change feedback on selection (preview on button is controlled by changes.show)
      if (window.rpgChoiceRenderer) {
        window.rpgChoiceRenderer.showChangeFeedback(results, choice.changes.feedback);
      }

      // Update status bar after changes
      if (window.rpgStatusBar) {
        setTimeout(() => window.rpgStatusBar.render(), 300);
      }
    }

    // Apply affinity changes
    if (choice.affinityChanges && this.rpg.isEnabled()) {
      for (const ac of choice.affinityChanges) {
        const oldVal = this.getNPCAffinity(ac.npcId);
        this.setNPCAffinity(ac.npcId, oldVal + (ac.delta || 0));
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
    const targetNode = choice.next || choice.targetNodeId;
    if (targetNode) {
      setTimeout(() => {
        this.navigateTo(targetNode);
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

    // Pre-load achievements
    if (storyJson.achievements && window.achievementSystem) {
      const achList = Array.isArray(storyJson.achievements)
        ? storyJson.achievements
        : Object.values(storyJson.achievements);
      for (const ach of achList) {
        if (!window.achievementSystem.achievements.find(a => a.id === ach.id)) {
          window.achievementSystem.register({
            id: ach.id,
            name: ach.title || ach.name,
            desc: ach.description || ach.desc,
            category: ach.category || 'general',
            rarity: ach.rarity || 'common',
            maxProgress: ach.maxProgress || 1,
          });
        }
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

  _findNPCBySpeaker(speakerName) {
    if (!this.story || !this.story.npcRelations) return null;
    const npcList = Array.isArray(this.story.npcRelations)
      ? this.story.npcRelations
      : (this.story.npcRelations.npcs || []);
    const npc = npcList.find(n => n.name === speakerName);
    return npc ? npc.id : null;
  }

  /* ================================================================
   * 10. Auto-Unlock Achievement Check
   * ================================================================ */

  _checkAutoUnlockAchievements() {
    if (!this.story || !this.story.achievements) return;
    if (!window.achievementSystem) return;

    const achievements = Array.isArray(this.story.achievements)
      ? this.story.achievements.map(a => [a.id, a])
      : Object.entries(this.story.achievements);

    for (const [id, def] of achievements) {
      if (window.achievementSystem.unlocked && window.achievementSystem.unlocked.has(id)) continue;
      if (this.rpg.checkAutoUnlock(id, def, this.state)) {
        window.achievementSystem.register({ id, name: def.title || def.name, desc: def.description || def.desc, category: def.category || 'general', rarity: def.rarity || 'common' });
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
        text: (!node.segments || !Array.isArray(node.segments)) ? (node.text || '') : undefined,
        segments: Array.isArray(node.segments) && node.segments.length > 0 ? node.segments : undefined,
        scene: node.scene || undefined,
        title: node.title || undefined,
        ambient: node.ambient || undefined,
        theme: node.theme || undefined,
        progress: node.progress || undefined,
        interactions: node.interactions || undefined,
        delayedChanges: node.delayedChanges || undefined,
        countdown: node.countdown || undefined,
        condition: node.condition || undefined,
        type: node.isEnding ? 'ending' : 'narrative',
        candidateEndings: node.isEnding
          ? (Array.isArray(json.endings)
              ? json.endings.map(e => e.id)
              : Object.keys(json.endings || {}))
          : undefined,
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

          // Convert changes — supports both v1.1 array format and flat object format
          // v1.1 array: [{ variable, value, addFlag, addFlags }]
          // flat object: { key: delta, show: true, feedback: {...}, flags: [...], inventory: [...] }
          if (ch.changes) {
            if (Array.isArray(ch.changes) && ch.changes.length > 0) {
              // Array format — convert to flat object
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

              // Handle SCHEMA v1.1 special change types in array format
              const specialChanges = ch.changes.filter(c => c.unlockAchievement || c.unlockAchievements || c.importantFlag || c.importantFlags || c.removeFlag || c.valSet);
              if (specialChanges.length > 0 && result.changes) {
                for (const sc of specialChanges) {
                  if (sc.unlockAchievement) result.changes._unlockAchievement = sc.unlockAchievement;
                  if (sc.unlockAchievements) result.changes._unlockAchievements = sc.unlockAchievements;
                  if (sc.importantFlag) result.changes._importantFlag = sc.importantFlag;
                  if (sc.importantFlags) result.changes._importantFlags = sc.importantFlags;
                  if (sc.removeFlag) result.changes._removeFlag = sc.removeFlag;
                  if (sc.valSet) result.changes._valSet = sc.valSet;
                }
              }
            } else if (typeof ch.changes === 'object') {
              // Flat object format — pass through directly
              result.changes = { ...ch.changes };
            }
          }

          // weight — support both string (schema v1.1) and numeric (legacy) formats
          if (ch.weight) {
            const weightMap = { 1: 'critical', 2: 'branch', 3: 'minor', 4: 'cosmetic' };
            result.weight = weightMap[ch.weight] || ch.weight;
          }

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

    // Convert endings: support both dict and array format
    let endings = [];
    if (json.endings) {
      if (Array.isArray(json.endings)) {
        endings = json.endings.map(e => ({
          id: e.id,
          name: e.title || e.name || e.id,
          desc: e.description || e.desc || '',
          type: e.type || e.tone || 'neutral',
          closing: e.description || '',
          condition: e.condition,
          hint: e.hint || null,
        }));
      } else {
        endings = Object.entries(json.endings).map(([id, e]) => ({
          id: e.id || id,
          name: e.title || e.name || id,
          desc: e.description || e.desc || '',
          type: e.type || 'neutral',
          closing: e.description || '',
          condition: e.condition,
          hint: e.hint || null,
        }));
      }
    }

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
