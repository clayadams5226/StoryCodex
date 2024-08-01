export class RichTextEditor {
    constructor(containerId) {
        this.container = document.getElementById(containerId);
        this.toolbar = this.container.querySelector('#toolbar');
        this.noteContent = this.container.querySelector('#noteContent');
        this.formatBlock = this.container.querySelector('#formatBlock');
        this.saveButton = this.container.querySelector('#saveNote');
        this.cancelButton = this.container.querySelector('#cancelNote');
        this.currentNote = null;
        this.saveCallback = null;
        this.cancelCallback = null;

        this.initializeEventListeners();
    }

    initializeEventListeners() {
        this.toolbar.addEventListener('click', this.handleToolbarClick.bind(this));
        this.formatBlock.addEventListener('change', this.handleFormatBlockChange.bind(this));
        this.noteContent.addEventListener('keydown', this.handleNoteContentKeydown.bind(this));
        if (this.saveButton) {
            this.saveButton.addEventListener('click', this.handleSave.bind(this));
        }
        if (this.cancelButton) {
            this.cancelButton.addEventListener('click', this.handleCancel.bind(this));
        }
    }

    clearEventListeners() {
        this.saveCallback = null;
        this.cancelCallback = null;
    }

    handleToolbarClick(e) {
        if (e.target.tagName === 'BUTTON') {
            e.preventDefault();
            let command = e.target.id;
            if (command === 'createlink') {
                let url = prompt('Enter the link URL');
                if (url) {
                    document.execCommand(command, false, url);
                }
            } else {
                document.execCommand(command, false, null);
            }
        }
    }

    handleFormatBlockChange(e) {
        document.execCommand('formatBlock', false, e.target.value);
    }

    handleNoteContentKeydown(e) {
        if (e.key === 'Enter' && !e.shiftKey) {
            document.execCommand('insertParagraph', false);
            e.preventDefault();
        }
    }

    handleSave() {
        if (this.currentNote) {
            this.currentNote.content = this.noteContent.innerHTML;
            this.currentNote.title = this.container.querySelector('#noteTitle').value;
            if (this.saveCallback) {
                this.saveCallback(this.currentNote);
            }
        } else {
            console.error('Attempted to save null note');
        }
    }

    handleCancel() {
        if (this.cancelCallback) {
            this.cancelCallback();
        }
    }

    setNote(note) {
        if (!note) {
            console.error('Attempted to set null note');
            note = { id: Date.now(), title: '', content: '' };
        }
        this.currentNote = note;
        this.container.querySelector('#noteTitle').value = note.title || '';
        this.noteContent.innerHTML = note.content || '';
    }

    show() {
        this.container.style.display = 'block';
    }

    hide() {
        this.container.style.display = 'none';
    }

    onSave(callback) {
        this.saveCallback = callback;
    }

    onCancel(callback) {
        this.cancelCallback = callback;
    }
}