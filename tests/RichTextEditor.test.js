import { describe, test, expect, beforeEach, jest } from '@jest/globals';
import { RichTextEditor } from '../RichTextEditor.js';

describe('RichTextEditor', () => {
  let editor;
  let containerHTML;

  beforeEach(() => {
    // Create the editor HTML structure
    containerHTML = `
      <div id="noteEditor">
        <input type="text" id="noteTitle" placeholder="Note Title">
        <div id="toolbar">
          <select id="formatBlock">
            <option value="p">Paragraph</option>
            <option value="h1">Heading 1</option>
            <option value="h2">Heading 2</option>
            <option value="h3">Heading 3</option>
          </select>
          <button id="bold" title="Bold">B</button>
          <button id="italic" title="Italic">I</button>
          <button id="underline" title="Underline">U</button>
          <button id="insertUnorderedList" title="Bullet List">•</button>
          <button id="insertOrderedList" title="Numbered List">1.</button>
          <button id="createlink" title="Insert Link">🔗</button>
        </div>
        <div id="noteContent" contenteditable="true"></div>
        <button id="saveNote">Save Note</button>
        <button id="cancelNote">Cancel</button>
      </div>
    `;
    document.body.innerHTML = containerHTML;

    editor = new RichTextEditor('noteEditor');
  });

  describe('constructor', () => {
    test('should initialize with correct DOM elements', () => {
      expect(editor.container).toBeDefined();
      expect(editor.toolbar).toBeDefined();
      expect(editor.noteContent).toBeDefined();
      expect(editor.formatBlock).toBeDefined();
      expect(editor.saveButton).toBeDefined();
      expect(editor.cancelButton).toBeDefined();
    });

    test('should initialize with null callbacks', () => {
      expect(editor.saveCallback).toBeNull();
      expect(editor.cancelCallback).toBeNull();
    });

    test('should initialize with null currentNote', () => {
      expect(editor.currentNote).toBeNull();
    });
  });

  describe('setNote', () => {
    test('should set note and populate fields', () => {
      const mockNote = {
        id: 1,
        title: 'Test Note',
        content: '<p>Test content</p>'
      };

      editor.setNote(mockNote);

      expect(editor.currentNote).toBe(mockNote);
      expect(document.getElementById('noteTitle').value).toBe('Test Note');
      expect(document.getElementById('noteContent').innerHTML).toBe('<p>Test content</p>');
    });

    test('should handle null note by creating default', () => {
      const consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation(() => {});

      editor.setNote(null);

      expect(editor.currentNote).toBeDefined();
      expect(editor.currentNote.title).toBe('');
      expect(editor.currentNote.content).toBe('');
      expect(consoleErrorSpy).toHaveBeenCalledWith('Attempted to set null note');

      consoleErrorSpy.mockRestore();
    });

    test('should handle note with missing title/content', () => {
      const mockNote = { id: 1 };

      editor.setNote(mockNote);

      expect(document.getElementById('noteTitle').value).toBe('');
      expect(document.getElementById('noteContent').innerHTML).toBe('');
    });
  });

  describe('show and hide', () => {
    test('show should set display to block', () => {
      editor.container.style.display = 'none';

      editor.show();

      expect(editor.container.style.display).toBe('block');
    });

    test('hide should set display to none', () => {
      editor.container.style.display = 'block';

      editor.hide();

      expect(editor.container.style.display).toBe('none');
    });
  });

  describe('onSave and onCancel', () => {
    test('should set save callback', () => {
      const callback = jest.fn();

      editor.onSave(callback);

      expect(editor.saveCallback).toBe(callback);
    });

    test('should set cancel callback', () => {
      const callback = jest.fn();

      editor.onCancel(callback);

      expect(editor.cancelCallback).toBe(callback);
    });
  });

  describe('clearEventListeners', () => {
    test('should clear both callbacks', () => {
      editor.saveCallback = jest.fn();
      editor.cancelCallback = jest.fn();

      editor.clearEventListeners();

      expect(editor.saveCallback).toBeNull();
      expect(editor.cancelCallback).toBeNull();
    });
  });

  describe('handleSave', () => {
    test('should update note and call saveCallback', () => {
      const mockNote = { id: 1, title: 'Original', content: '' };
      const saveCallback = jest.fn();

      editor.setNote(mockNote);
      editor.onSave(saveCallback);

      document.getElementById('noteTitle').value = 'Updated Title';
      document.getElementById('noteContent').innerHTML = '<p>New content</p>';

      editor.handleSave();

      expect(editor.currentNote.title).toBe('Updated Title');
      expect(editor.currentNote.content).toBe('<p>New content</p>');
      expect(saveCallback).toHaveBeenCalledWith(editor.currentNote);
    });

    test('should not call saveCallback if currentNote is null', () => {
      const consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation(() => {});
      const saveCallback = jest.fn();
      editor.onSave(saveCallback);

      editor.currentNote = null;
      editor.handleSave();

      expect(saveCallback).not.toHaveBeenCalled();
      expect(consoleErrorSpy).toHaveBeenCalledWith('Attempted to save null note');

      consoleErrorSpy.mockRestore();
    });

    test('should handle missing saveCallback gracefully', () => {
      const mockNote = { id: 1, title: 'Test', content: '' };
      editor.setNote(mockNote);

      expect(() => editor.handleSave()).not.toThrow();
    });
  });

  describe('handleCancel', () => {
    test('should call cancelCallback if set', () => {
      const cancelCallback = jest.fn();
      editor.onCancel(cancelCallback);

      editor.handleCancel();

      expect(cancelCallback).toHaveBeenCalled();
    });

    test('should handle missing cancelCallback gracefully', () => {
      expect(() => editor.handleCancel()).not.toThrow();
    });
  });

  describe('toolbar interactions', () => {
    test('should execute command on button click', () => {
      const execCommandSpy = jest.spyOn(document, 'execCommand').mockImplementation(() => true);

      const boldButton = document.getElementById('bold');
      boldButton.click();

      expect(execCommandSpy).toHaveBeenCalledWith('bold', false, null);

      execCommandSpy.mockRestore();
    });

    test('should prompt for URL on createlink', () => {
      const execCommandSpy = jest.spyOn(document, 'execCommand').mockImplementation(() => true);
      const promptSpy = jest.spyOn(window, 'prompt').mockReturnValue('https://example.com');

      const linkButton = document.getElementById('createlink');
      linkButton.click();

      expect(promptSpy).toHaveBeenCalledWith('Enter the link URL');
      expect(execCommandSpy).toHaveBeenCalledWith('createlink', false, 'https://example.com');

      execCommandSpy.mockRestore();
      promptSpy.mockRestore();
    });

    test('should not create link if prompt cancelled', () => {
      const execCommandSpy = jest.spyOn(document, 'execCommand').mockImplementation(() => true);
      const promptSpy = jest.spyOn(window, 'prompt').mockReturnValue(null);

      const linkButton = document.getElementById('createlink');
      linkButton.click();

      expect(promptSpy).toHaveBeenCalled();
      expect(execCommandSpy).not.toHaveBeenCalled();

      execCommandSpy.mockRestore();
      promptSpy.mockRestore();
    });
  });

  describe('formatBlock changes', () => {
    test('should execute formatBlock command on select change', () => {
      const execCommandSpy = jest.spyOn(document, 'execCommand').mockImplementation(() => true);

      const formatBlock = document.getElementById('formatBlock');
      formatBlock.value = 'h1';
      formatBlock.dispatchEvent(new Event('change'));

      expect(execCommandSpy).toHaveBeenCalledWith('formatBlock', false, 'h1');

      execCommandSpy.mockRestore();
    });
  });
});
