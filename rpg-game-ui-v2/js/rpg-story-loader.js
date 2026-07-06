/**
 * rpg-story-loader.js — RPG Story Script Loader
 * Loads JSON story scripts, initializes RPG state, manages node navigation.
 */

window.RPGStoryLoader = class RPGStoryLoader {

  constructor(rpgCore, gameState, themeEngine, uiController) {
    this.rpg = rpgCore;
    this.state = gameState;
    this.theme = themeEngine;
    this.ui = uiController;
    this.story = null;
    this.currentNodeId = null;
  }

  /* ── Load Story ──────────────────────── */
  async loadFromUrl(url) {
    try {
      const res = await fetch(url);
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const json = await res.json();
      return this.load(json);
    } catch (err) {
      console.error('Failed to load story:', err);
      return false;
    }
  }

  load(storyJson) {
    if (!storyJson || !storyJson.meta) {
      console.warn('Invalid story JSON');
      return false;
    }

    this.story = storyJson;

    // Initialize RPG core
    const enabled = this.rpg.loadStory(storyJson);
    if (!enabled) {
      console.log('RPG mode not enabled for this story');
      return false;
    }

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

    // Find start node
    const startNode = this.story.nodes.find(n => n.id === 'start') || this.story.nodes[0];
    if (startNode) {
      this.navigateTo(startNode.id);
    }

    window.rpgStory = this;
    return true;
  }

  /* ── Navigation ──────────────────────── */
  navigateTo(nodeId) {
    if (!this.story) return false;
    const node = this.story.nodes.find(n => n.id === nodeId);
    if (!node) {
      console.warn('Node not found:', nodeId);
      return false;
    }

    this.currentNodeId = nodeId;
    this._renderNode(node);
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
    if (window.rpgChoiceRenderer && this.rpg.isEnabled()) {
      window.rpgChoiceRenderer.renderChoices(node.choices || []);
    } else if (this.theme) {
      this.theme._renderChoices(node.choices || []);
    }

    // Update status bar
    if (window.rpgStatusBar && this.rpg.isEnabled()) {
      window.rpgStatusBar.render();
    } else if (this.theme) {
      this.theme._renderStats();
    }
  }

  /* ── Make Choice ─────────────────────── */
  makeChoice(index) {
    if (!this.story || !this.currentNodeId) return;

    const node = this.story.nodes.find(n => n.id === this.currentNodeId);
    if (!node || !node.choices || index >= node.choices.length) return;

    const choice = node.choices[index];

    // Apply changes
    if (choice.changes && this.rpg) {
      const results = this.rpg.applyChanges(choice.changes, this.state);
      if (window.rpgChoiceRenderer && choice.changes.show !== false) {
        window.rpgChoiceRenderer.showChangeFeedback(results, choice.changes.feedback);
      }
    }

    // Navigate to next node
    if (choice.next) {
      this.navigateTo(choice.next);
    }
  }

  /* ── Current Node Access ─────────────── */
  get currentNode() {
    if (!this.story || !this.currentNodeId) return null;
    return this.story.nodes.find(n => n.id === this.currentNodeId) || null;
  }
};
