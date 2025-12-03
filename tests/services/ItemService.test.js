import { jest } from '@jest/globals';
import { ItemService } from '../../src/services/ItemService.js';
import { StateManager } from '../../src/core/StateManager.js';
import { StorageService } from '../../src/core/StorageService.js';
import { ItemTypes } from '../../src/models/ItemTypes.js';
import { ItemFactory } from '../../src/models/ItemFactory.js';

describe('ItemService', () => {
  let itemService;
  let stateManager;
  let book;

  beforeEach(() => {
    resetChromeStorage();
    const storageService = new StorageService();
    stateManager = new StateManager(storageService);
    itemService = new ItemService(stateManager);

    book = ItemFactory.createBook('Test Book');
  });

  describe('addItem', () => {
    test('should add character to book', () => {
      const character = itemService.addItem(book, ItemTypes.CHARACTER, 'Alice');

      expect(character).toBeDefined();
      expect(character.name).toBe('Alice');
      expect(book.characters).toContain(character);
      expect(book.characters.length).toBe(1);
    });

    test('should add location to book', () => {
      const location = itemService.addItem(book, ItemTypes.LOCATION, 'Castle');

      expect(location.name).toBe('Castle');
      expect(book.locations).toContain(location);
    });

    test('should add plot point to book', () => {
      const plotPoint = itemService.addItem(book, ItemTypes.PLOT_POINT, 'Discovery');

      expect(plotPoint.title).toBe('Discovery');
      expect(book.plotPoints).toContain(plotPoint);
    });

    test('should add note with content to book', () => {
      const note = itemService.addItem(book, ItemTypes.NOTE, 'Title', 'Content');

      expect(note.title).toBe('Title');
      expect(note.content).toBe('Content');
      expect(book.notes).toContain(note);
    });

    test('should handle unknown item type', () => {
      const consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation();

      const result = itemService.addItem(book, 'invalid_type', 'Test');

      expect(result).toBeNull();
      expect(consoleErrorSpy).toHaveBeenCalled();

      consoleErrorSpy.mockRestore();
    });
  });

  describe('updateItem', () => {
    test('should update item properties', () => {
      const character = itemService.addItem(book, ItemTypes.CHARACTER, 'Alice');

      itemService.updateItem(character, {
        nickname: 'Al',
        description: 'Protagonist'
      });

      expect(character.nickname).toBe('Al');
      expect(character.description).toBe('Protagonist');
    });

    test('should handle null item', () => {
      const consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation();

      const result = itemService.updateItem(null, { name: 'Test' });

      expect(result).toBeNull();
      expect(consoleErrorSpy).toHaveBeenCalled();

      consoleErrorSpy.mockRestore();
    });
  });

  describe('deleteItem', () => {
    test('should delete item from book', () => {
      const character = itemService.addItem(book, ItemTypes.CHARACTER, 'Alice');

      const result = itemService.deleteItem(book, ItemTypes.CHARACTER, character);

      expect(result).toBe(true);
      expect(book.characters.length).toBe(0);
      expect(book.characters).not.toContain(character);
    });

    test('should return false when deleting non-existent item', () => {
      const character = { name: 'Bob' };

      const result = itemService.deleteItem(book, ItemTypes.CHARACTER, character);

      expect(result).toBe(false);
    });
  });

  describe('getItems', () => {
    test('should get all characters', () => {
      itemService.addItem(book, ItemTypes.CHARACTER, 'Alice');
      itemService.addItem(book, ItemTypes.CHARACTER, 'Bob');

      const characters = itemService.getItems(book, ItemTypes.CHARACTER);

      expect(characters.length).toBe(2);
      expect(characters[0].name).toBe('Alice');
      expect(characters[1].name).toBe('Bob');
    });

    test('should return empty array for empty collection', () => {
      const characters = itemService.getItems(book, ItemTypes.CHARACTER);

      expect(characters).toEqual([]);
    });
  });

  describe('findItem', () => {
    test('should find item by field value', () => {
      itemService.addItem(book, ItemTypes.CHARACTER, 'Alice');
      itemService.addItem(book, ItemTypes.CHARACTER, 'Bob');

      const found = itemService.findItem(book, ItemTypes.CHARACTER, 'name', 'Alice');

      expect(found).toBeDefined();
      expect(found.name).toBe('Alice');
    });

    test('should return null when item not found', () => {
      const found = itemService.findItem(book, ItemTypes.CHARACTER, 'name', 'Charlie');

      expect(found).toBeNull();
    });
  });

  describe('getItemIndex', () => {
    test('should get correct item index', () => {
      const alice = itemService.addItem(book, ItemTypes.CHARACTER, 'Alice');
      itemService.addItem(book, ItemTypes.CHARACTER, 'Bob');

      const index = itemService.getItemIndex(book, ItemTypes.CHARACTER, alice);

      expect(index).toBe(0);
    });

    test('should return -1 for non-existent item', () => {
      const character = { name: 'Charlie' };

      const index = itemService.getItemIndex(book, ItemTypes.CHARACTER, character);

      expect(index).toBe(-1);
    });
  });
});
