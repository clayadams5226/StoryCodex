import { describe, test, expect, beforeEach, jest } from '@jest/globals';
import { DataManager } from '../DataManager.js';

describe('DataManager', () => {
  let dataManager;
  let mockBook;

  beforeEach(() => {
    dataManager = new DataManager();
    mockBook = {
      name: 'Test Book',
      characters: [{ name: 'Alice', tags: [] }],
      locations: [{ name: 'Forest', tags: [] }],
      plotPoints: [{ title: 'Opening Scene', tags: [] }],
      relationships: [],
      notes: [],
      tags: [],
      wordCount: 1000,
      targetWordCount: 50000,
      chapters: [],
      scenes: []
    };
  });

  describe('setCurrentBook', () => {
    test('should set the current book', () => {
      dataManager.setCurrentBook(mockBook);
      expect(dataManager.currentBook).toBe(mockBook);
    });
  });

  describe('exportToJSON', () => {
    test('should throw error when no book is loaded', () => {
      expect(() => dataManager.exportToJSON()).toThrow('No book is currently loaded');
    });

    test('should create download link when book is loaded', () => {
      dataManager.setCurrentBook(mockBook);

      // Mock document methods
      const mockAnchor = {
        href: '',
        download: '',
        click: jest.fn()
      };
      const createElementSpy = jest.spyOn(document, 'createElement').mockReturnValue(mockAnchor);
      const appendChildSpy = jest.spyOn(document.body, 'appendChild').mockImplementation(() => {});
      const removeChildSpy = jest.spyOn(document.body, 'removeChild').mockImplementation(() => {});

      dataManager.exportToJSON();

      expect(createElementSpy).toHaveBeenCalledWith('a');
      expect(mockAnchor.download).toBe('Test Book.json');
      expect(mockAnchor.click).toHaveBeenCalled();
      expect(appendChildSpy).toHaveBeenCalledWith(mockAnchor);
      expect(removeChildSpy).toHaveBeenCalledWith(mockAnchor);

      createElementSpy.mockRestore();
      appendChildSpy.mockRestore();
      removeChildSpy.mockRestore();
    });
  });

  describe('validateImportedBook', () => {
    test('should validate a correct book structure', () => {
      expect(dataManager.validateImportedBook(mockBook)).toBe(true);
    });

    test('should reject book without name', () => {
      const invalidBook = { ...mockBook, name: undefined };
      expect(dataManager.validateImportedBook(invalidBook)).toBe(false);
    });

    test('should reject book without characters array', () => {
      const invalidBook = { ...mockBook, characters: 'not an array' };
      expect(dataManager.validateImportedBook(invalidBook)).toBe(false);
    });

    test('should reject book without locations array', () => {
      const invalidBook = { ...mockBook, locations: null };
      expect(dataManager.validateImportedBook(invalidBook)).toBe(false);
    });

    test('should reject book without plotPoints array', () => {
      const invalidBook = { ...mockBook, plotPoints: undefined };
      expect(dataManager.validateImportedBook(invalidBook)).toBe(false);
    });

    test('should reject book with invalid wordCount', () => {
      const invalidBook = { ...mockBook, wordCount: 'not a number' };
      expect(dataManager.validateImportedBook(invalidBook)).toBe(false);
    });

    test('should reject null book', () => {
      expect(dataManager.validateImportedBook(null)).toBeFalsy();
    });
  });

  describe('importFromJSON', () => {
    test('should successfully import valid JSON file', async () => {
      const fileContent = JSON.stringify(mockBook);
      const mockFile = new File([fileContent], 'test-book.json', { type: 'application/json' });

      const result = await dataManager.importFromJSON(mockFile);

      expect(result).toEqual(mockBook);
    });

    test('should reject invalid JSON file', async () => {
      const invalidContent = 'not valid json {';
      const mockFile = new File([invalidContent], 'invalid.json', { type: 'application/json' });

      await expect(dataManager.importFromJSON(mockFile)).rejects.toThrow('Failed to parse JSON file');
    });

    test('should reject file with invalid book structure', async () => {
      const invalidBook = { name: 'Test', characters: 'invalid' };
      const fileContent = JSON.stringify(invalidBook);
      const mockFile = new File([fileContent], 'invalid-book.json', { type: 'application/json' });

      await expect(dataManager.importFromJSON(mockFile)).rejects.toThrow('Invalid book structure');
    });
  });

  describe('importFromNovelCrafter', () => {
    test('should reject with not implemented error', async () => {
      const mockFile = new File([''], 'test.nc', { type: 'application/octet-stream' });
      await expect(dataManager.importFromNovelCrafter(mockFile)).rejects.toThrow('Import from NovelCrafter not yet implemented');
    });
  });

  describe('importFromObsidian', () => {
    test('should reject with not implemented error', async () => {
      const mockFile = new File([''], 'test.md', { type: 'text/markdown' });
      await expect(dataManager.importFromObsidian(mockFile)).rejects.toThrow('Import from Obsidian not yet implemented');
    });
  });
});
