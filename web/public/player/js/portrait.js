/* ================================================
   portrait.js — Character Portrait System
   Manages character avatars and full-body stands
   ================================================ */

class PortraitSystem {
  constructor() {
    this.characters = {};
    this.currentPortrait = null;
    this.container = null;
    this.standEl = null;
  }

  init() {
    this.container = document.getElementById('narrative-area');
    // Create portrait stand if not in HTML
    if (!document.getElementById('portrait-stand')) {
      const stand = document.createElement('div');
      stand.id = 'portrait-stand';
      stand.style.display = 'none';
      stand.innerHTML = '<img class="portrait-stand-img" id="portrait-stand-img" src="" alt=""><span class="portrait-name-tag" id="portrait-name-tag"></span>';
      this.container.parentElement.insertBefore(stand, this.container);
    }
    this.standEl = document.getElementById('portrait-stand');
  }

  registerCharacter(id, data) {
    this.characters[id] = {
      name: data.name || id,
      avatar: data.avatar || null,    // URL or null → placeholder
      stand: data.stand || null,     // URL or null → no stand
      color: data.color || null       // brand color for dialogue
    };
  }

  showDialogue(characterId, text, options = {}) {
    if (!this.container) return;
    const char = this.characters[characterId];
    if (!char) return;

    const narrativeText = document.getElementById('narrative-text');
    if (!narrativeText) return;

    const block = document.createElement('div');
    block.className = 'dialogue-block';

    // Avatar
    const avatar = document.createElement('div');
    avatar.className = 'dialogue-avatar speaking';
    if (char.avatar) {
      avatar.innerHTML = `<img src="${char.avatar}" alt="${char.name}" loading="lazy">`;
    } else {
      const initial = char.name.charAt(0);
      avatar.innerHTML = `<span class="dialogue-avatar-placeholder">${initial}</span>`;
    }
    block.appendChild(avatar);

    // Body
    const body = document.createElement('div');
    body.className = 'dialogue-body';

    const speaker = document.createElement('div');
    speaker.className = 'dialogue-speaker';
    speaker.textContent = char.name;
    if (char.color) speaker.style.color = char.color;

    const content = document.createElement('div');
    content.className = 'dialogue-content';
    content.textContent = text;

    body.appendChild(speaker);
    body.appendChild(content);
    block.appendChild(body);

    // Remove speaking pulse after delay
    setTimeout(() => avatar.classList.remove('speaking'), 2000);

    narrativeText.appendChild(block);
    block.scrollIntoView({ behavior: 'smooth', block: 'end' });
  }

  showStand(characterId) {
    const char = this.characters[characterId];
    if (!char || !char.stand || !this.standEl) return;

    const img = document.getElementById('portrait-stand-img');
    const tag = document.getElementById('portrait-name-tag');

    if (img && tag) {
      img.className = 'portrait-stand-img entering';
      img.src = char.stand;
      img.alt = char.name;
      tag.textContent = char.name;

      this.standEl.style.display = 'block';

      // Trigger animation
      requestAnimationFrame(() => {
        img.className = 'portrait-stand-img visible';
      });
    }

    this.currentPortrait = characterId;
  }

  hideStand() {
    if (!this.standEl) return;
    const img = document.getElementById('portrait-stand-img');
    if (img) {
      img.className = 'portrait-stand-img exiting';
      setTimeout(() => {
        this.standEl.style.display = 'none';
      }, 400);
    }
    this.currentPortrait = null;
  }

  createAvatarHTML(characterId) {
    const char = this.characters[characterId];
    if (!char) return '';
    if (char.avatar) {
      return `<img src="${char.avatar}" alt="${char.name}" loading="lazy">`;
    }
    const initial = char.name.charAt(0);
    return `<span class="dialogue-avatar-placeholder">${initial}</span>`;
  }
}

window.PortraitSystem = PortraitSystem;
