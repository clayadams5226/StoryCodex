import { jest } from '@jest/globals';
import { StateManager } from '../../src/core/StateManager.js';
import { StorageService } from '../../src/core/StorageService.js';

describe('StateManager', () => {
  let stateManager;
  let storageService;

  beforeEach(() => {
    resetChromeStorage();
    storageService = new StorageService();
    stateManager = new StateManager(storageService);
  });

  describe('initial state', () => {
    test('should have default state', () => {
      const state = stateManager.getState();

      expect(state.books).toEqual([]);
      expect(state.currentBook).toBeNull();
      expect(state.currentItem).toBeNull();
      expect(state.currentScreen).toBe('bookList');
      expect(state.currentItemType).toBeNull();
    });
  });

  describe('setState', () => {
    test('should update state and persist to storage', async () => {
      const newBook = { name: 'Test Book', characters: [] };

      await stateManager.setState({
        currentBook: newBook,
        currentScreen: 'bookDetails'
      });

      const state = stateManager.getState();
      expect(state.currentBook).toEqual(newBook);
      expect(state.currentScreen).toBe('bookDetails');

      // Verify persistence - state goes to sync storage (as references)
      const syncStorage = getSyncStorage();
      expect(syncStorage.currentState.currentBookName).toBe('Test Book');
      expect(syncStorage.currentState.currentScreen).toBe('bookDetails');
    });

    test('should save books when books are updated', async () => {
      const books = [
        { name: 'Book 1', characters: [] },
        { name: 'Book 2', locations: [] }
      ];

      await stateManager.setState({ books });

      const state = stateManager.getState();
      expect(state.books).toEqual(books);

      // Verify books were saved
      const storage = getChromeStorage();
      expect(storage.books).toEqual(books);
    });

    test('should handle storage errors gracefully', async () => {
      chrome.runtime.lastError = { message: 'Storage error' };
      const consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation();

      await stateManager.setState({ currentScreen: 'bookDetails' });

      expect(consoleErrorSpy).toHaveBeenCalled();

      chrome.runtime.lastError = null;
      consoleErrorSpy.mockRestore();
    });
  });

  describe('getters', () => {
    test('should get current book', async () => {
      const book = { name: 'Test Book' };
      await stateManager.setState({ currentBook: book });

      expect(stateManager.getCurrentBook()).toEqual(book);
    });

    test('should get current item', async () => {
      const item = { name: 'Test Character' };
      await stateManager.setState({ currentItem: item });

      expect(stateManager.getCurrentItem()).toEqual(item);
    });

    test('should get current screen', async () => {
      await stateManager.setState({ currentScreen: 'characterDetails' });

      expect(stateManager.getCurrentScreen()).toBe('characterDetails');
    });

    test('should get current item type', async () => {
      await stateManager.setState({ currentItemType: 'character' });

      expect(stateManager.getCurrentItemType()).toBe('character');
    });

    test('should get books', async () => {
      const books = [{ name: 'Book 1' }];
      await stateManager.setState({ books });

      expect(stateManager.getBooks()).toEqual(books);
    });
  });

  describe('convenience setters', () => {
    test('should set current book', async () => {
      const book = { name: 'Test Book' };

      await stateManager.setCurrentBook(book);

      expect(stateManager.getCurrentBook()).toEqual(book);
    });

    test('should set current item with type', async () => {
      const item = { name: 'Test Character' };

      await stateManager.setCurrentItem(item, 'character');

      expect(stateManager.getCurrentItem()).toEqual(item);
      expect(stateManager.getCurrentItemType()).toBe('character');
    });

    test('should set current screen', async () => {
      await stateManager.setCurrentScreen('characterDetails');

      expect(stateManager.getCurrentScreen()).toBe('characterDetails');
    });

    test('should clear current item', async () => {
      const item = { name: 'Test Character' };
      await stateManager.setCurrentItem(item, 'character');

      await stateManager.clearCurrentItem();

      expect(stateManager.getCurrentItem()).toBeNull();
      expect(stateManager.getCurrentItemType()).toBeNull();
    });
  });

  describe('loadFromStorage', () => {
    test('should load state from storage and restore object references', async () => {
      const books = [{
        name: 'Book 1',
        characters: [{ name: 'Character' }],
        locations: [],
        plotPoints: [],
        relationships: [],
        notes: [],
        tags: [],
        wordCount: 0,
        targetWordCount: 0,
        chapters: [],
        scenes: []
      }];
      const currentState = {
        currentBookName: 'Book 1',
        currentItemName: 'Character',
        currentScreen: 'characterDetails',
        currentItemType: 'character'
      };

      // Books in local storage, state references in sync storage
      setChromeStorage({ books });
      setSyncStorage({ currentState });

      await stateManager.loadFromStorage();

      expect(stateManager.getBooks()).toEqual(books);
      expect(stateManager.getCurrentBook()).toEqual(books[0]);
      expect(stateManager.getCurrentItem()).toEqual(books[0].characters[0]);
      expect(stateManager.getCurrentScreen()).toBe('characterDetails');
      expect(stateManager.getCurrentItemType()).toBe('character');
    });

    test('should handle empty storage', async () => {
      await stateManager.loadFromStorage();

      expect(stateManager.getBooks()).toEqual([]);
      expect(stateManager.getCurrentBook()).toBeNull();
      expect(stateManager.getCurrentScreen()).toBe('bookList');
    });
  });
});
