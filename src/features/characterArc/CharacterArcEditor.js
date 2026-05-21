import { ARC_TEMPLATES, getArcTemplateKeys } from '../../constants/arcTemplates.js';

const CURVE_WIDTH = 720;
const CURVE_HEIGHT = 176;
const CURVE_PADDING_X = 54;
const CURVE_PADDING_Y = 30;

export class CharacterArcEditor {
  constructor({ app, getCurrentBook, getBooks, updateBook }) {
    this.app = app;
    this.getCurrentBook = getCurrentBook;
    this.getBooks = getBooks;
    this.updateBook = updateBook;

    this.currentEditingCharacter = null;
    this.currentSelectedBeat = null;
    this.arcSaveDebounceTimer = null;
    this.pendingTemplateKey = null;
    this.beatSortable = null;
  }

  initialize() {
    document.getElementById('beatName')?.addEventListener('input', event => {
      if (this.currentSelectedBeat) {
        this.currentSelectedBeat.name = event.target.value;
        this.renderBeatList();
        this.renderArcCurve();
        this.saveArcChanges();
      }
    });

    document.getElementById('beatDescription')?.addEventListener('input', event => {
      if (this.currentSelectedBeat) {
        this.currentSelectedBeat.description = event.target.value;
        this.saveArcChanges();
      }
    });

    document.getElementById('beatEmotionalState')?.addEventListener('input', event => {
      if (this.currentSelectedBeat) {
        this.currentSelectedBeat.emotionalState = event.target.value;
        this.saveArcChanges();
      }
    });

    document.getElementById('beatYPosition')?.addEventListener('input', event => {
      if (this.currentSelectedBeat) {
        const yPosition = this.normalizeYPosition(event.target.value);
        this.currentSelectedBeat.yPosition = yPosition;
        document.getElementById('beatYPositionValue').textContent = yPosition;
        this.renderBeatList();
        this.renderArcCurve();
        this.saveArcChanges();
      }
    });

    document.getElementById('closeArcEditor')?.addEventListener('click', () => this.close());
    document.getElementById('addArcBeat')?.addEventListener('click', () => this.addNewBeat());
    document.getElementById('deleteBeat')?.addEventListener('click', () => this.deleteBeat());
    document.getElementById('applyTemplateChange')?.addEventListener('click', () => this.applyPendingTemplateChange());
    document.getElementById('cancelTemplateChange')?.addEventListener('click', () => this.hideTemplateConfirm());

    document.getElementById('openCharacterArcEditor')?.addEventListener('click', () => {
      const character = this.app.stateManager.getCurrentItem();
      if (character) {
        this.open(character);
      }
    });

    window.openArcEditor = character => this.open(character);
  }

  open(character) {
    if (!character) return;

    this.currentEditingCharacter = character;
    this.currentSelectedBeat = null;
    this.pendingTemplateKey = null;

    document.getElementById('arcCharacterName').textContent = character.name || 'Character Arc';

    const thumbnail = document.getElementById('arcCharacterThumbnail');
    if (thumbnail && character.picture) {
      thumbnail.src = character.picture;
      thumbnail.style.display = 'block';
    } else if (thumbnail) {
      thumbnail.style.display = 'none';
    }

    if (!character.characterArc) {
      character.characterArc = {
        templateType: '',
        beats: []
      };
    }

    this.renderTemplateButtons();
    this.renderArcSummary();
    this.renderArcCurve();
    this.renderBeatList();
    this.showBeatDetailEmpty();
    this.hideTemplateConfirm();

    document.getElementById('arcEditorModal').style.display = 'block';
    document.body.classList.add('modal-open');
  }

  close() {
    document.getElementById('arcEditorModal').style.display = 'none';
    document.body.classList.remove('modal-open');

    if (this.arcSaveDebounceTimer) {
      clearTimeout(this.arcSaveDebounceTimer);
      this.arcSaveDebounceTimer = null;
      this.persistArcChangesNow();
    }

    if (this.beatSortable) {
      this.beatSortable.destroy();
      this.beatSortable = null;
    }

    this.currentEditingCharacter = null;
    this.currentSelectedBeat = null;
    this.pendingTemplateKey = null;
  }

  renderTemplateButtons() {
    const container = document.getElementById('arcTemplateButtons');
    if (!container || !this.currentEditingCharacter) return;

    const selectedTemplate = this.currentEditingCharacter.characterArc.templateType;
    container.innerHTML = '';

    getArcTemplateKeys().forEach(key => {
      const template = ARC_TEMPLATES[key];
      const button = document.createElement('button');
      button.type = 'button';
      button.className = 'arc-template-btn';
      button.style.setProperty('--template-color', template.color);
      button.innerHTML = `
        <span class="arc-template-swatch" aria-hidden="true"></span>
        <span>
          <strong>${this.escapeHTML(template.name)}</strong>
          <small>${this.escapeHTML(template.description)}</small>
        </span>
      `;

      if (selectedTemplate === key) {
        button.classList.add('active');
      }

      button.addEventListener('click', () => this.selectTemplate(key));
      container.appendChild(button);
    });
  }

  selectTemplate(templateKey) {
    const template = ARC_TEMPLATES[templateKey];
    if (!template || !this.currentEditingCharacter) return;

    const arc = this.currentEditingCharacter.characterArc;
    const hasExistingBeats = (arc.beats || []).length > 0;
    const isDifferentTemplate = arc.templateType !== templateKey;

    if (hasExistingBeats && isDifferentTemplate) {
      this.showTemplateConfirm(templateKey);
      return;
    }

    if (!hasExistingBeats || isDifferentTemplate) {
      this.applyTemplate(templateKey);
    } else {
      this.hideTemplateConfirm();
    }
  }

  showTemplateConfirm(templateKey) {
    this.pendingTemplateKey = templateKey;
    const template = ARC_TEMPLATES[templateKey];
    const confirmPanel = document.getElementById('arcTemplateConfirm');
    const confirmText = document.getElementById('arcTemplateConfirmText');
    if (!confirmPanel || !confirmText || !template) return;

    confirmText.textContent = `Replace the current beats with the ${template.name} template? Existing beat details and links will be removed.`;
    confirmPanel.hidden = false;
    this.renderTemplateButtons();
  }

  hideTemplateConfirm() {
    this.pendingTemplateKey = null;
    const confirmPanel = document.getElementById('arcTemplateConfirm');
    if (confirmPanel) {
      confirmPanel.hidden = true;
    }
    this.renderTemplateButtons();
  }

  applyPendingTemplateChange() {
    if (!this.pendingTemplateKey) return;
    this.applyTemplate(this.pendingTemplateKey);
  }

  applyTemplate(templateKey) {
    const template = ARC_TEMPLATES[templateKey];
    if (!template || !this.currentEditingCharacter) return;

    this.currentEditingCharacter.characterArc.templateType = templateKey;
    this.currentEditingCharacter.characterArc.beats = template.defaultBeats.map((beatTemplate, index) => {
      const beat = this.app.ItemFactory.createArcBeat(beatTemplate.name, index);
      beat.yPosition = beatTemplate.y;
      return beat;
    });

    this.currentSelectedBeat = this.currentEditingCharacter.characterArc.beats[0] || null;
    this.pendingTemplateKey = null;
    this.saveArcChanges();
    this.renderTemplateButtons();
    this.hideTemplateConfirm();
    this.renderArcSummary();
    this.renderArcCurve();
    this.renderBeatList();

    if (this.currentSelectedBeat) {
      this.showBeatDetail(this.currentSelectedBeat);
    } else {
      this.showBeatDetailEmpty();
    }
  }

  renderArcSummary() {
    const summary = document.getElementById('arcTimelineSummary');
    if (!summary || !this.currentEditingCharacter) return;

    const arc = this.currentEditingCharacter.characterArc;
    const beats = arc.beats || [];
    const template = ARC_TEMPLATES[arc.templateType];
    const linkedCount = this.getLinkedCount(beats);

    if (beats.length === 0) {
      summary.textContent = 'Choose a template or add a beat to begin.';
      return;
    }

    const templateName = template ? `${template.name} arc` : 'Custom arc';
    summary.textContent = `${templateName} with ${beats.length} beat${beats.length === 1 ? '' : 's'} and ${linkedCount} linked story item${linkedCount === 1 ? '' : 's'}.`;
  }

  renderArcCurve() {
    const container = document.getElementById('arcTimelineCurve');
    if (!container || !this.currentEditingCharacter) return;

    const beats = this.currentEditingCharacter.characterArc.beats || [];
    if (beats.length === 0) {
      container.innerHTML = '<div class="arc-curve-empty">No timeline yet</div>';
      return;
    }

    const accent = this.getTemplateColor();
    const points = this.getCurvePoints(beats);
    const pointString = points.map(point => `${point.x},${point.y}`).join(' ');
    const path = points.map((point, index) => `${index === 0 ? 'M' : 'L'} ${point.x} ${point.y}`).join(' ');
    const beatMarkers = points.map((point, index) => {
      const beat = beats[index];
      const selected = this.currentSelectedBeat && this.currentSelectedBeat.id === beat.id;
      const labelY = point.y > CURVE_HEIGHT / 2 ? point.y - 16 : point.y + 24;
      return `
        <g class="arc-curve-point ${selected ? 'selected' : ''}" data-arc-beat-id="${this.escapeHTML(beat.id)}" role="button" tabindex="0">
          <circle cx="${point.x}" cy="${point.y}" r="${selected ? 8 : 6}"></circle>
          <text x="${point.x}" y="${labelY}">${index + 1}</text>
        </g>
      `;
    }).join('');

    container.innerHTML = `
      <svg class="arc-curve-svg" viewBox="0 0 ${CURVE_WIDTH} ${CURVE_HEIGHT}" role="img" aria-label="Emotional trajectory">
        <line class="arc-curve-grid" x1="${CURVE_PADDING_X}" y1="${CURVE_PADDING_Y}" x2="${CURVE_WIDTH - CURVE_PADDING_X}" y2="${CURVE_PADDING_Y}"></line>
        <line class="arc-curve-grid arc-curve-grid-mid" x1="${CURVE_PADDING_X}" y1="${CURVE_HEIGHT / 2}" x2="${CURVE_WIDTH - CURVE_PADDING_X}" y2="${CURVE_HEIGHT / 2}"></line>
        <line class="arc-curve-grid" x1="${CURVE_PADDING_X}" y1="${CURVE_HEIGHT - CURVE_PADDING_Y}" x2="${CURVE_WIDTH - CURVE_PADDING_X}" y2="${CURVE_HEIGHT - CURVE_PADDING_Y}"></line>
        <text class="arc-curve-axis" x="8" y="${CURVE_PADDING_Y + 4}">High</text>
        <text class="arc-curve-axis" x="8" y="${CURVE_HEIGHT - CURVE_PADDING_Y + 4}">Low</text>
        <polyline class="arc-curve-shadow" points="${pointString}"></polyline>
        <path class="arc-curve-line" d="${path}" style="--curve-color: ${accent};"></path>
        ${beatMarkers}
      </svg>
    `;

    container.querySelectorAll('[data-arc-beat-id]').forEach(marker => {
      const beat = beats.find(currentBeat => currentBeat.id === marker.getAttribute('data-arc-beat-id'));
      marker.addEventListener('click', () => {
        if (beat) this.selectBeat(beat);
      });
      marker.addEventListener('keydown', event => {
        if ((event.key === 'Enter' || event.key === ' ') && beat) {
          event.preventDefault();
          this.selectBeat(beat);
        }
      });
    });
  }

  renderBeatList() {
    const container = document.getElementById('arcBeatsList');
    if (!container || !this.currentEditingCharacter) return;

    if (this.beatSortable) {
      this.beatSortable.destroy();
      this.beatSortable = null;
    }

    container.innerHTML = '';
    const beats = this.currentEditingCharacter.characterArc.beats || [];

    if (beats.length === 0) {
      container.innerHTML = '<p class="arc-empty-message">No beats yet. Select a template or add a beat manually.</p>';
      this.renderArcSummary();
      return;
    }

    beats.forEach((beat, index) => {
      const beatElement = document.createElement('div');
      const selected = this.currentSelectedBeat && this.currentSelectedBeat.id === beat.id;
      const linkedCount = this.getLinkedCount([beat]);
      const yPosition = this.normalizeYPosition(beat.yPosition);

      beatElement.className = `arc-beat-item${selected ? ' selected' : ''}`;
      beatElement.setAttribute('data-beat-id', beat.id);
      beatElement.setAttribute('role', 'button');
      beatElement.setAttribute('tabindex', '0');
      beatElement.innerHTML = `
        <span class="beat-drag-handle" aria-hidden="true">&#9776;</span>
        <div class="beat-info">
          <div class="beat-title-row">
            <span class="beat-order">${index + 1}</span>
            <span class="beat-name">${this.escapeHTML(beat.name || 'Untitled Beat')}</span>
          </div>
          <div class="beat-meta-row">
            <span class="beat-emotion">${this.escapeHTML(beat.emotionalState || 'No emotional note')}</span>
            <span class="beat-link-badge">${linkedCount} linked</span>
          </div>
          <div class="beat-meter" aria-hidden="true"><span style="width: ${yPosition}%;"></span></div>
        </div>
      `;

      beatElement.addEventListener('click', () => this.selectBeat(beat));
      beatElement.addEventListener('keydown', event => {
        if (event.key === 'Enter' || event.key === ' ') {
          event.preventDefault();
          this.selectBeat(beat);
        }
      });
      container.appendChild(beatElement);
    });

    this.renderArcSummary();
    this.initializeBeatSortable();
  }

  initializeBeatSortable() {
    const beatsList = document.getElementById('arcBeatsList');
    if (beatsList && window.Sortable) {
      this.beatSortable = new Sortable(beatsList, {
        animation: 150,
        handle: '.beat-drag-handle',
        onEnd: event => this.reorderBeats(event.oldIndex, event.newIndex)
      });
    }
  }

  reorderBeats(oldIndex, newIndex) {
    if (oldIndex === newIndex || oldIndex == null || newIndex == null) return;

    const beats = this.currentEditingCharacter.characterArc.beats;
    const [movedBeat] = beats.splice(oldIndex, 1);
    beats.splice(newIndex, 0, movedBeat);
    beats.forEach((beat, index) => {
      beat.order = index;
    });

    this.saveArcChanges();
    this.renderBeatList();
    this.renderArcCurve();

    if (this.currentSelectedBeat && this.currentSelectedBeat.id === movedBeat.id) {
      this.selectBeat(movedBeat);
    }
  }

  selectBeat(beat) {
    this.currentSelectedBeat = beat;
    this.renderBeatList();
    this.renderArcCurve();
    this.showBeatDetail(beat);
  }

  showBeatDetail(beat) {
    const empty = document.querySelector('.beat-detail-empty');
    const content = document.querySelector('.beat-detail-content');
    if (!empty || !content) return;

    empty.style.display = 'none';
    content.style.display = 'block';

    const yPosition = this.normalizeYPosition(beat.yPosition);
    document.getElementById('beatName').value = beat.name || '';
    document.getElementById('beatDescription').value = beat.description || '';
    document.getElementById('beatEmotionalState').value = beat.emotionalState || '';
    document.getElementById('beatYPosition').value = yPosition;
    document.getElementById('beatYPositionValue').textContent = yPosition;

    this.renderLinkedScenes(beat);
    this.renderLinkedChapters(beat);
  }

  showBeatDetailEmpty() {
    const empty = document.querySelector('.beat-detail-empty');
    const content = document.querySelector('.beat-detail-content');
    if (empty) empty.style.display = 'flex';
    if (content) content.style.display = 'none';
    this.currentSelectedBeat = null;
    this.renderBeatList();
    this.renderArcCurve();
  }

  renderLinkedScenes(beat) {
    const container = document.getElementById('beatLinkedScenes');
    if (!container) return;
    container.innerHTML = '';

    const book = this.getCurrentBook();
    if (!book || !book.scenes || book.scenes.length === 0) {
      container.innerHTML = '<p class="arc-empty-message compact">No scenes available</p>';
      return;
    }

    book.scenes.forEach(scene => {
      const isLinked = beat.linkedScenes && beat.linkedScenes.includes(scene.id);
      const div = document.createElement('div');
      div.className = 'linked-content-item';

      const checkbox = document.createElement('input');
      checkbox.type = 'checkbox';
      checkbox.id = `scene-${scene.id}`;
      checkbox.checked = isLinked;
      checkbox.addEventListener('change', event => this.toggleSceneLink(beat, scene.id, event.target.checked));

      const label = document.createElement('label');
      label.htmlFor = `scene-${scene.id}`;
      label.textContent = scene.title || 'Untitled Scene';

      div.appendChild(checkbox);
      div.appendChild(label);
      container.appendChild(div);
    });
  }

  renderLinkedChapters(beat) {
    const container = document.getElementById('beatLinkedChapters');
    if (!container) return;
    container.innerHTML = '';

    const book = this.getCurrentBook();
    if (!book || !book.chapters || book.chapters.length === 0) {
      container.innerHTML = '<p class="arc-empty-message compact">No chapters available</p>';
      return;
    }

    book.chapters.forEach(chapter => {
      const isLinked = beat.linkedChapters && beat.linkedChapters.includes(chapter.id);
      const div = document.createElement('div');
      div.className = 'linked-content-item';

      const checkbox = document.createElement('input');
      checkbox.type = 'checkbox';
      checkbox.id = `chapter-${chapter.id}`;
      checkbox.checked = isLinked;
      checkbox.addEventListener('change', event => this.toggleChapterLink(beat, chapter.id, event.target.checked));

      const label = document.createElement('label');
      label.htmlFor = `chapter-${chapter.id}`;
      label.textContent = chapter.title || 'Untitled Chapter';

      div.appendChild(checkbox);
      div.appendChild(label);
      container.appendChild(div);
    });
  }

  toggleSceneLink(beat, sceneId, isChecked) {
    if (!beat.linkedScenes) beat.linkedScenes = [];
    beat.linkedScenes = isChecked
      ? [...new Set([...beat.linkedScenes, sceneId])]
      : beat.linkedScenes.filter(id => id !== sceneId);

    this.saveArcChanges();
    this.renderBeatList();
    this.renderArcSummary();
  }

  toggleChapterLink(beat, chapterId, isChecked) {
    if (!beat.linkedChapters) beat.linkedChapters = [];
    beat.linkedChapters = isChecked
      ? [...new Set([...beat.linkedChapters, chapterId])]
      : beat.linkedChapters.filter(id => id !== chapterId);

    this.saveArcChanges();
    this.renderBeatList();
    this.renderArcSummary();
  }

  addNewBeat() {
    if (!this.currentEditingCharacter.characterArc.beats) {
      this.currentEditingCharacter.characterArc.beats = [];
    }
    const beats = this.currentEditingCharacter.characterArc.beats;
    const order = beats.length;
    const newBeat = this.app.ItemFactory.createArcBeat('New Beat', order);
    beats.push(newBeat);

    this.saveArcChanges();
    this.renderArcSummary();
    this.renderArcCurve();
    this.renderBeatList();
    this.selectBeat(newBeat);
  }

  deleteBeat() {
    if (!this.currentSelectedBeat) return;

    const confirmed = confirm(`Delete beat "${this.currentSelectedBeat.name}"?`);
    if (!confirmed) return;

    const deletedBeatId = this.currentSelectedBeat.id;
    const beats = this.currentEditingCharacter.characterArc.beats.filter(beat => beat.id !== deletedBeatId);
    this.currentEditingCharacter.characterArc.beats = beats;
    beats.forEach((beat, index) => {
      beat.order = index;
    });

    this.saveArcChanges();
    this.renderArcSummary();
    this.showBeatDetailEmpty();
  }

  saveArcChanges() {
    if (this.arcSaveDebounceTimer) {
      clearTimeout(this.arcSaveDebounceTimer);
    }

    this.arcSaveDebounceTimer = setTimeout(() => {
      this.persistArcChangesNow();
      this.arcSaveDebounceTimer = null;
    }, 300);
  }

  persistArcChangesNow() {
    const book = this.getCurrentBook();
    if (book && this.currentEditingCharacter) {
      this.updateBook(this.getBooks(), book);
      this.updatePreview(this.currentEditingCharacter);
    }
  }

  updatePreview(character) {
    const previewContainer = document.getElementById('arcPreviewContent');
    if (!previewContainer) return;

    const arc = character.characterArc;
    const beats = arc?.beats || [];
    if (!arc || !arc.templateType || beats.length === 0) {
      previewContainer.innerHTML = '<p class="arc-preview-empty">No arc configured yet. Click "Edit Character Arc" to get started.</p>';
      return;
    }

    const template = ARC_TEMPLATES[arc.templateType];
    const templateName = template ? template.name : 'Custom';
    const beatCount = beats.length;
    const linkedCount = this.getLinkedCount(beats);
    const sparkline = this.getPreviewSparkline(beats, template?.color || '#d7ad58');

    previewContainer.innerHTML = `
      <div class="arc-preview-card">
        <div class="arc-preview-copy">
          <strong>${this.escapeHTML(templateName)} Arc</strong>
          <span>${beatCount} beat${beatCount === 1 ? '' : 's'} - ${linkedCount} linked item${linkedCount === 1 ? '' : 's'}</span>
        </div>
        ${sparkline}
      </div>
    `;
  }

  getCurvePoints(beats) {
    const innerWidth = CURVE_WIDTH - (CURVE_PADDING_X * 2);
    const innerHeight = CURVE_HEIGHT - (CURVE_PADDING_Y * 2);
    const step = beats.length > 1 ? innerWidth / (beats.length - 1) : 0;

    return beats.map((beat, index) => {
      const yPosition = this.normalizeYPosition(beat.yPosition);
      return {
        x: beats.length > 1 ? CURVE_PADDING_X + (index * step) : CURVE_WIDTH / 2,
        y: CURVE_PADDING_Y + ((100 - yPosition) / 100) * innerHeight
      };
    });
  }

  getPreviewSparkline(beats, color) {
    const width = 180;
    const height = 54;
    const padding = 7;
    const innerWidth = width - (padding * 2);
    const innerHeight = height - (padding * 2);
    const step = beats.length > 1 ? innerWidth / (beats.length - 1) : 0;
    const points = beats.map((beat, index) => {
      const x = beats.length > 1 ? padding + (index * step) : width / 2;
      const y = padding + ((100 - this.normalizeYPosition(beat.yPosition)) / 100) * innerHeight;
      return `${x},${y}`;
    }).join(' ');

    return `
      <svg class="arc-preview-sparkline" viewBox="0 0 ${width} ${height}" aria-hidden="true">
        <polyline points="${points}" style="--curve-color: ${color};"></polyline>
      </svg>
    `;
  }

  getTemplateColor() {
    const templateType = this.currentEditingCharacter?.characterArc?.templateType;
    return ARC_TEMPLATES[templateType]?.color || '#d7ad58';
  }

  getLinkedCount(beats) {
    return beats.reduce((sum, beat) => {
      return sum + (beat.linkedScenes?.length || 0) + (beat.linkedChapters?.length || 0);
    }, 0);
  }

  normalizeYPosition(value) {
    const parsed = Number.parseInt(value, 10);
    if (Number.isNaN(parsed)) return 50;
    return Math.max(0, Math.min(100, parsed));
  }

  escapeHTML(value) {
    return String(value)
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#39;');
  }
}
