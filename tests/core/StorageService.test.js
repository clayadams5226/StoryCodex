import { jest } from '@jest/globals';
import { StorageService } from '../../src/core/StorageService.js';

describe('StorageService', () => {
  let storageService;

  beforeEach(() => {
    resetChromeStorage();
    storageService = new StorageService();
  });

  describe('load', () => {
    test('should load books and currentState from storage', async () => {
      const mockBooks = [{ name: 'Test Book', characters: [] }];
      const mockState = { currentScreen: 'bookDetails', currentBookName: 'Test Book' };

      // Books go in local storage, state goes in sync storage
      setChromeStorage({ books: mockBooks });
      setSyncStorage({ currentState: mockState });

      const result = await storageService.load();

      expect(result.books).toEqual(mockBooks);
      expect(result.currentState).toEqual(mockState);
    });

    test('should return empty defaults when storage is empty', async () => {
      const result = await storageService.load();

      expect(result.books).toEqual([]);
      expect(result.currentState).toEqual({});
    });

    test('should handle storage errors gracefully', async () => {
      chrome.runtime.lastError = { message: 'Storage error' };
      const consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation();

      const result = await storageService.load();

      expect(result.books).toEqual([]);
      expect(result.currentState).toEqual({});
      expect(consoleErrorSpy).toHaveBeenCalled();

      chrome.runtime.lastError = null;
      consoleErrorSpy.mockRestore();
    });
  });

  describe('saveBooks', () => {
    test('should save books array to storage', async () => {
      const books = [
        { name: 'Book 1', characters: [] },
        { name: 'Book 2', locations: [] }
      ];

      await storageService.saveBooks(books);

      const storage = getChromeStorage();
      expect(storage.books).toEqual(books);
    });

    test('should handle save errors', async () => {
      chrome.runtime.lastError = { message: 'Quota exceeded' };
      const consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation();

      await expect(storageService.saveBooks([])).rejects.toBeDefined();
      expect(consoleErrorSpy).toHaveBeenCalled();

      chrome.runtime.lastError = null;
      consoleErrorSpy.mockRestore();
    });
  });

  describe('saveState', () => {
    test('should save currentState to storage', async () => {
      const state = {
        books: [{ name: 'Test' }],
        currentBook: { name: 'Test' },
        currentItem: { name: 'Character' },
        currentScreen: 'characterDetails',
        currentItemType: 'character'
      };

      await storageService.saveState(state);

      // State is saved to sync storage (only references, not full objects)
      const syncStorage = getSyncStorage();
      expect(syncStorage.currentState).toEqual({
        currentBookName: 'Test',
        currentItemName: 'Character',
        currentScreen: 'characterDetails',
        currentItemType: 'character'
      });
      // Should NOT save books array
      expect(syncStorage.currentState.books).toBeUndefined();
    });
  });

  describe('saveAll', () => {
    test('should save both books and state in single operation', async () => {
      const books = [{ name: 'Book 1' }];
      const state = {
        currentBook: books[0],
        currentItem: null,
        currentScreen: 'bookDetails',
        currentItemType: null
      };

      await storageService.saveAll(books, state);

      // Books saved to local storage
      const localStorage = getChromeStorage();
      expect(localStorage.books).toEqual(books);

      // State saved to sync storage (as references)
      const syncStorage = getSyncStorage();
      expect(syncStorage.currentState.currentBookName).toEqual('Book 1');
      expect(syncStorage.currentState.currentScreen).toEqual('bookDetails');
    });
  });
});
