import { CharacterArcGraph } from '../../../CharacterArcGraph.js';
import { ARC_TEMPLATES, getArcTemplateKeys } from '../../constants/arcTemplates.js';

export class CharacterArcEditor {
  constructor({ app, getCurrentBook, getBooks, updateBook }) {
    this.app = app;
    this.getCurrentBook = getCurrentBook;
    this.getBooks = getBooks;
    this.updateBook = updateBook;

    this.currentEditingCharacter = null;
    this.currentSelectedBeat = null;
    this.arcSaveDebounceTimer = null;
    this.arcGraphInstance = null;
  }

  initialize() {
    document.getElementById('beatName')?.addEventListener('input', event => {
      if (this.currentSelectedBeat) {
        this.currentSelectedBeat.name = event.target.value;
        this.saveArcChanges();
        this.renderBeatList();
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
        this.currentSelectedBeat.yPosition = parseInt(event.target.value);
        document.getElementById('beatYPositionValue').textContent = event.target.value;
        this.saveArcChanges();
      }
    });

    document.getElementById('closeArcEditor')?.addEventListener('click', () => this.close());
    document.getElementById('closeArcEditorFooter')?.addEventListener('click', () => this.close());
    document.getElementById('addArcBeat')?.addEventListener('click', () => this.addNewBeat());
    document.getElementById('deleteBeat')?.addEventListener('click', () => this.deleteBeat());

    document.querySelectorAll('.arc-view-btn').forEach(button => {
      button.addEventListener('click', () => this.switchView(button));
    });

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

    document.getElementById('arcCharacterName').textContent = `${character.name} - Character Arc`;

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
    this.renderBeatList();
    this.showBeatDetailEmpty();

    document.getElementById('arcEditorModal').style.display = 'block';
    document.body.classList.add('modal-open');
  }

  close() {
    document.getElementById('arcEditorModal').style.display = 'none';
    document.body.classList.remove('modal-open');
    this.currentEditingCharacter = null;
    this.currentSelectedBeat = null;

    if (this.arcSaveDebounceTimer) {
      clearTimeout(this.arcSaveDebounceTimer);
      this.arcSaveDebounceTimer = null;
    }

    if (this.arcGraphInstance) {
      this.arcGraphInstance.destroy();
      this.arcGraphInstance = null;
    }
  }

  renderTemplateButtons() {
    const container = document.getElementById('arcTemplateButtons');
    if (!container) return;

    container.innerHTML = '';

    getArcTemplateKeys().forEach(key => {
      const template = ARC_TEMPLATES[key];
      const button = document.createElement('button');
      button.className = 'arc-template-btn';
      button.textContent = template.name;
      button.style.borderColor = template.color;
      button.style.color = template.color;

      if (this.currentEditingCharacter.characterArc.templateType === key) {
        button.classList.add('active');
      }

      button.addEventListener('click', () => this.selectTemplate(key));
      container.appendChild(button);
    });
  }

  selectTemplate(templateKey) {
    const template = ARC_TEMPLATES[templateKey];
    if (!template) return;

    if (
      this.currentEditingCharacter.characterArc.beats.length > 0 &&
      this.currentEditingCharacter.characterArc.templateType !== templateKey
    ) {
      const confirmed = confirm('Changing templates will replace existing beats. Continue?');
      if (!confirmed) return;
    }

    this.currentEditingCharacter.characterArc.templateType = templateKey;
    this.currentEditingCharacter.characterArc.beats = template.defaultBeats.map((beatTemplate, index) => {
      const beat = this.app.ItemFactory.createArcBeat(beatTemplate.name, index);
      beat.yPosition = beatTemplate.y;
      return beat;
    });

    this.saveArcChanges();
    this.renderTemplateButtons();
    this.renderBeatList();
    this.showBeatDetailEmpty();
  }

  renderBeatList() {
    const container = document.getElementById('arcBeatsList');
    if (!container) return;

    container.innerHTML = '';
    const beats = this.currentEditingCharacter.characterArc.beats || [];

    if (beats.length === 0) {
      container.innerHTML = '<p style="color: #6b7280; text-align: center; padding: 20px;">No beats yet. Select a template or add a beat manually.</p>';
      return;
    }

    beats.forEach((beat, index) => {
      const beatElement = document.createElement('div');
      beatElement.className = 'arc-beat-item';
      beatElement.setAttribute('data-beat-id', beat.id);

      const linkedCount = (beat.linkedScenes?.length || 0) + (beat.linkedChapters?.length || 0);
      beatElement.innerHTML = `
        <span class="beat-drag-handle">&#9776;</span>
        <div class="beat-info">
          <div>
            <span class="beat-order">${index + 1}</span>
            <span class="beat-name">${beat.name || 'Untitled Beat'}</span>
          </div>
          ${linkedCount > 0 ? `<div class="beat-links"><span class="beat-link-badge">${linkedCount} linked</span></div>` : ''}
        </div>
      `;

      beatElement.addEventListener('click', () => this.selectBeat(beat));
      container.appendChild(beatElement);
    });

    this.initializeBeatSortable();
  }

  initializeBeatSortable() {
    const beatsList = document.getElementById('arcBeatsList');
    if (beatsList && window.Sortable) {
      new Sortable(beatsList, {
        animation: 150,
        handle: '.beat-drag-handle',
        onEnd: event => this.reorderBeats(event.oldIndex, event.newIndex)
      });
    }
  }

  reorderBeats(oldIndex, newIndex) {
    const beats = this.currentEditingCharacter.characterArc.beats;
    const [movedBeat] = beats.splice(oldIndex, 1);
    beats.splice(newIndex, 0, movedBeat);
    beats.forEach((beat, index) => {
      beat.order = index;
    });

    this.saveArcChanges();
    this.renderBeatList();

    if (this.currentSelectedBeat && this.currentSelectedBeat.id === movedBeat.id) {
      this.selectBeat(movedBeat);
    }
  }

  selectBeat(beat) {
    this.currentSelectedBeat = beat;

    document.querySelectorAll('.arc-beat-item').forEach(item => {
      item.classList.remove('selected');
      if (item.getAttribute('data-beat-id') === beat.id) {
        item.classList.add('selected');
      }
    });

    this.showBeatDetail(beat);
  }

  showBeatDetail(beat) {
    document.querySelector('.beat-detail-empty').style.display = 'none';
    const content = document.querySelector('.beat-detail-content');
    content.style.display = 'block';

    document.getElementById('beatName').value = beat.name || '';
    document.getElementById('beatDescription').value = beat.description || '';
    document.getElementById('beatEmotionalState').value = beat.emotionalState || '';
    document.getElementById('beatYPosition').value = beat.yPosition || 50;
    document.getElementById('beatYPositionValue').textContent = beat.yPosition || 50;

    this.renderLinkedScenes(beat);
    this.renderLinkedChapters(beat);
  }

  showBeatDetailEmpty() {
    document.querySelector('.beat-detail-empty').style.display = 'flex';
    document.querySelector('.beat-detail-content').style.display = 'none';
    this.currentSelectedBeat = null;

    document.querySelectorAll('.arc-beat-item').forEach(item => {
      item.classList.remove('selected');
    });
  }

  renderLinkedScenes(beat) {
    const container = document.getElementById('beatLinkedScenes');
    container.innerHTML = '';

    const book = this.getCurrentBook();
    if (!book || !book.scenes || book.scenes.length === 0) {
      container.innerHTML = '<p style="color: #6b7280; font-size: 12px;">No scenes available</p>';
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
    container.innerHTML = '';

    const book = this.getCurrentBook();
    if (!book || !book.chapters || book.chapters.length === 0) {
      container.innerHTML = '<p style="color: #6b7280; font-size: 12px;">No chapters available</p>';
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
  }

  toggleChapterLink(beat, chapterId, isChecked) {
    if (!beat.linkedChapters) beat.linkedChapters = [];
    beat.linkedChapters = isChecked
      ? [...new Set([...beat.linkedChapters, chapterId])]
      : beat.linkedChapters.filter(id => id !== chapterId);

    this.saveArcChanges();
    this.renderBeatList();
  }

  addNewBeat() {
    const order = this.currentEditingCharacter.characterArc.beats.length;
    const newBeat = this.app.ItemFactory.createArcBeat('New Beat', order);
    this.currentEditingCharacter.characterArc.beats.push(newBeat);

    this.saveArcChanges();
    this.renderBeatList();
    this.selectBeat(newBeat);
  }

  deleteBeat() {
    if (!this.currentSelectedBeat) return;

    const confirmed = confirm(`Delete beat "${this.currentSelectedBeat.name}"?`);
    if (!confirmed) return;

    this.currentEditingCharacter.characterArc.beats = this.currentEditingCharacter.characterArc.beats.filter(
      beat => beat.id !== this.currentSelectedBeat.id
    );

    this.currentEditingCharacter.characterArc.beats.forEach((beat, index) => {
      beat.order = index;
    });

    this.saveArcChanges();
    this.renderBeatList();
    this.showBeatDetailEmpty();
  }

  saveArcChanges() {
    if (this.arcSaveDebounceTimer) {
      clearTimeout(this.arcSaveDebounceTimer);
    }

    this.arcSaveDebounceTimer = setTimeout(() => {
      const book = this.getCurrentBook();
      if (book && this.currentEditingCharacter) {
        this.updateBook(this.getBooks(), book);

        const graphView = document.getElementById('arcGraphView');
        if (graphView && graphView.classList.contains('active')) {
          this.renderArcGraph();
        }
      }
    }, 300);
  }

  switchView(button) {
    const view = button.getAttribute('data-view');

    document.querySelectorAll('.arc-view-btn').forEach(currentButton => currentButton.classList.remove('active'));
    button.classList.add('active');

    document.querySelectorAll('.arc-view').forEach(arcView => arcView.classList.remove('active'));

    if (view === 'list') {
      document.getElementById('arcListView')?.classList.add('active');
    } else if (view === 'graph') {
      document.getElementById('arcGraphView')?.classList.add('active');
      this.renderArcGraph();
    }
  }

  renderArcGraph() {
    if (!this.currentEditingCharacter) return;

    if (this.arcGraphInstance) {
      this.arcGraphInstance.destroy();
    }

    this.arcGraphInstance = new CharacterArcGraph(this.currentEditingCharacter, ARC_TEMPLATES);
    this.arcGraphInstance.onBeatClick(beat => this.selectBeat(beat));
    this.arcGraphInstance.onBeatDrag(beat => {
      this.saveArcChanges();
      if (this.currentSelectedBeat && this.currentSelectedBeat.id === beat.id) {
        const yPositionInput = document.getElementById('beatYPosition');
        const yPositionValue = document.getElementById('beatYPositionValue');
        if (yPositionInput) yPositionInput.value = beat.yPosition;
        if (yPositionValue) yPositionValue.textContent = beat.yPosition;
      }
    });
    this.arcGraphInstance.show();
  }

  updatePreview(character) {
    const previewContainer = document.getElementById('arcPreviewContent');
    if (!previewContainer) return;

    const arc = character.characterArc;
    if (!arc || !arc.templateType || arc.beats.length === 0) {
      previewContainer.innerHTML = '<p style="color: #6b7280;">No arc configured yet. Click "Edit Character Arc" to get started.</p>';
      return;
    }

    const template = ARC_TEMPLATES[arc.templateType];
    const templateName = template ? template.name : 'Custom';
    const beatCount = arc.beats.length;
    const linkedCount = arc.beats.reduce((sum, beat) => {
      return sum + (beat.linkedScenes?.length || 0) + (beat.linkedChapters?.length || 0);
    }, 0);

    previewContainer.innerHTML = `
      <div style="margin-bottom: 10px;">
        <strong style="color: #f3f4f6; font-size: 16px;">${templateName} Arc</strong>
      </div>
      <div style="display: flex; gap: 15px; font-size: 14px;">
        <div><span style="color: #9ca3af;">Beats:</span> <span style="color: #e5e7eb;">${beatCount}</span></div>
        <div><span style="color: #9ca3af;">Linked Content:</span> <span style="color: #e5e7eb;">${linkedCount}</span></div>
      </div>
    `;
  }
}
