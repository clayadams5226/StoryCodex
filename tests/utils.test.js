import { describe, test, expect, beforeEach, jest } from '@jest/globals';
import { showScreen, saveCurrentState, updateBook, populateTagDropdowns } from '../utils.js';

describe('utils', () => {
  describe('showScreen', () => {
    beforeEach(() => {
      // Create all screen elements
      const screens = ['bookList', 'bookDetails', 'characterDetails', 'locationDetails',
                      'plotPointDetails', 'noteDetails', 'chapterDetails', 'sceneDetails',
                      'taggedItems', 'relationshipGraph', 'noteEditor'];

      screens.forEach(screenId => {
        const div = document.createElement('div');
        div.id = screenId;
        div.style.display = 'none';
        document.body.appendChild(div);
      });
    });

    test('should show the specified screen and hide others', () => {
      const result = showScreen('characterDetails');

      expect(result).toBe('characterDetails');
      expect(document.getElementById('characterDetails').style.display).toBe('block');
      expect(document.getElementById('bookList').style.display).toBe('none');
      expect(document.getElementById('bookDetails').style.display).toBe('none');
    });

    test('should hide previously visible screen', () => {
      document.getElementById('bookList').style.display = 'block';

      showScreen('characterDetails');

      expect(document.getElementById('bookList').style.display).toBe('none');
      expect(document.getElementById('characterDetails').style.display).toBe('block');
    });

    test('should handle all valid screen IDs', () => {
      const screenIds = ['bookList', 'bookDetails', 'characterDetails', 'locationDetails',
                        'plotPointDetails', 'noteDetails', 'chapterDetails', 'sceneDetails',
                        'taggedItems', 'relationshipGraph', 'noteEditor'];

      screenIds.forEach(screenId => {
        const result = showScreen(screenId);
        expect(result).toBe(screenId);
        expect(document.getElementById(screenId).style.display).toBe('block');
      });
    });
  });

  describe('saveCurrentState', () => {
    test('should save state to chrome.storage.sync', (done) => {
      const mockBook = { name: 'Test Book', characters: [] };
      const mockItem = { name: 'Test Character' };
      const mockScreen = 'characterDetails';
      const mockItemType = 'character';

      saveCurrentState(mockBook, mockItem, mockScreen, mockItemType);

      // Wait for async storage operation
      setTimeout(() => {
        // State is saved to sync storage (as references)
        const syncStorage = getSyncStorage();
        expect(syncStorage.currentState).toBeDefined();
        expect(syncStorage.currentState.currentBookName).toBe('Test Book');
        expect(syncStorage.currentState.currentItemName).toBe('Test Character');
        expect(syncStorage.currentState.currentScreen).toBe(mockScreen);
        expect(syncStorage.currentState.currentItemType).toBe(mockItemType);
        done();
      }, 10);
    });

    test('should save null values', (done) => {
      saveCurrentState(null, null, 'bookList', null);

      setTimeout(() => {
        // State is saved to sync storage (as references)
        const syncStorage = getSyncStorage();
        expect(syncStorage.currentState.currentBookName).toBeNull();
        expect(syncStorage.currentState.currentItemName).toBeNull();
        expect(syncStorage.currentState.currentScreen).toBe('bookList');
        done();
      }, 10);
    });
  });

  describe('updateBook', () => {
    test('should update existing book in books array', (done) => {
      const book1 = { name: 'Book 1', characters: [] };
      const book2 = { name: 'Book 2', characters: [] };
      const books = [book1, book2];

      const updatedBook2 = { name: 'Book 2', characters: [{ name: 'Alice' }] };

      const result = updateBook(books, updatedBook2);

      setTimeout(() => {
        expect(result).toBe(books);
        expect(books[1]).toBe(updatedBook2);
        expect(books[1].characters.length).toBe(1);

        const storage = getChromeStorage();
        expect(storage.books).toBeDefined();
        expect(storage.books[1].characters.length).toBe(1);
        done();
      }, 10);
    });

    test('should not modify array if book not found', (done) => {
      const book1 = { name: 'Book 1', characters: [] };
      const books = [book1];
      const nonExistentBook = { name: 'Book 2', characters: [] };

      const consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation(() => {});

      updateBook(books, nonExistentBook);

      setTimeout(() => {
        expect(books.length).toBe(1);
        expect(consoleErrorSpy).toHaveBeenCalledWith('Book not found in books array');
        consoleErrorSpy.mockRestore();
        done();
      }, 10);
    });

    test('should handle chrome.storage errors', (done) => {
      const book = { name: 'Test Book', characters: [] };
      const books = [book];

      chrome.runtime.lastError = { message: 'Storage quota exceeded' };
      const consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation(() => {});

      updateBook(books, book);

      setTimeout(() => {
        expect(consoleErrorSpy).toHaveBeenCalledWith('Error updating book:', chrome.runtime.lastError);
        chrome.runtime.lastError = null;
        consoleErrorSpy.mockRestore();
        done();
      }, 10);
    });
  });

  describe('populateTagDropdowns', () => {
    beforeEach(() => {
      // Create tag select elements
      const select1 = document.createElement('select');
      select1.className = 'tagSelect';
      select1.id = 'tagSelect1';
      document.body.appendChild(select1);

      const select2 = document.createElement('select');
      select2.className = 'tagSelect';
      select2.id = 'tagSelect2';
      document.body.appendChild(select2);
    });

    test('should populate all tag selects with book tags', () => {
      const mockBook = {
        tags: ['Fantasy', 'Adventure', 'Magic']
      };

      populateTagDropdowns(mockBook);

      const selects = document.querySelectorAll('.tagSelect');
      selects.forEach(select => {
        expect(select.options.length).toBe(4); // 1 default + 3 tags
        expect(select.options[0].value).toBe('');
        expect(select.options[0].textContent).toBe('Select a tag or type a new one');
        expect(select.options[1].value).toBe('Fantasy');
        expect(select.options[2].value).toBe('Adventure');
        expect(select.options[3].value).toBe('Magic');
      });
    });

    test('should preserve current selection if tag still exists', () => {
      const mockBook = {
        tags: ['Fantasy', 'Adventure', 'Magic']
      };

      const select = document.getElementById('tagSelect1');
      select.innerHTML = '<option value="Fantasy">Fantasy</option>';
      select.value = 'Fantasy';

      populateTagDropdowns(mockBook);

      expect(select.value).toBe('Fantasy');
    });

    test('should handle empty tags array', () => {
      const mockBook = {
        tags: []
      };

      populateTagDropdowns(mockBook);

      const selects = document.querySelectorAll('.tagSelect');
      selects.forEach(select => {
        expect(select.options.length).toBe(1);
        expect(select.options[0].value).toBe('');
      });
    });

    test('should handle null currentBook', () => {
      populateTagDropdowns(null);

      const selects = document.querySelectorAll('.tagSelect');
      selects.forEach(select => {
        expect(select.options.length).toBe(1);
        expect(select.options[0].textContent).toBe('Select a tag or type a new one');
      });
    });
  });
});
