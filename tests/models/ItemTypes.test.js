import { jest } from '@jest/globals';
import { ItemTypes, ItemMetadata, getItemName, getCollectionName } from '../../src/models/ItemTypes.js';

describe('ItemTypes', () => {
  describe('getItemName', () => {
    test('should return book name for BOOK type', () => {
      const book = { name: 'My Novel' };
      const result = getItemName(book, ItemTypes.BOOK);

      expect(result).toBe('My Novel');
    });

    test('should return character name for CHARACTER type', () => {
      const character = { name: 'Alice' };
      const result = getItemName(character, ItemTypes.CHARACTER);

      expect(result).toBe('Alice');
    });

    test('should return location name for LOCATION type', () => {
      const location = { name: 'Castle' };
      const result = getItemName(location, ItemTypes.LOCATION);

      expect(result).toBe('Castle');
    });

    test('should return plot point title for PLOT_POINT type', () => {
      const plotPoint = { title: 'Discovery' };
      const result = getItemName(plotPoint, ItemTypes.PLOT_POINT);

      expect(result).toBe('Discovery');
    });

    test('should return note title for NOTE type', () => {
      const note = { title: 'Chapter Ideas' };
      const result = getItemName(note, ItemTypes.NOTE);

      expect(result).toBe('Chapter Ideas');
    });

    test('should return chapter title for CHAPTER type', () => {
      const chapter = { title: 'Chapter 1' };
      const result = getItemName(chapter, ItemTypes.CHAPTER);

      expect(result).toBe('Chapter 1');
    });

    test('should return scene title for SCENE type', () => {
      const scene = { title: 'Opening Scene' };
      const result = getItemName(scene, ItemTypes.SCENE);

      expect(result).toBe('Opening Scene');
    });

    test('should return "Untitled" when item name/title is empty', () => {
      const book = { name: '' };
      const result = getItemName(book, ItemTypes.BOOK);

      expect(result).toBe('Untitled');
    });

    test('should return "Untitled" when item name/title is missing', () => {
      const book = {};
      const result = getItemName(book, ItemTypes.BOOK);

      expect(result).toBe('Untitled');
    });

    test('should return "Untitled" and log error for unknown item type', () => {
      const consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation();

      const item = { name: 'Test' };
      const result = getItemName(item, 'unknown_type');

      expect(result).toBe('Untitled');
      expect(consoleErrorSpy).toHaveBeenCalledWith('Unknown item type:', 'unknown_type');

      consoleErrorSpy.mockRestore();
    });
  });

  describe('getCollectionName', () => {
    test('should return "books" for BOOK type', () => {
      expect(getCollectionName(ItemTypes.BOOK)).toBe('books');
    });

    test('should return "characters" for CHARACTER type', () => {
      expect(getCollectionName(ItemTypes.CHARACTER)).toBe('characters');
    });

    test('should return "locations" for LOCATION type', () => {
      expect(getCollectionName(ItemTypes.LOCATION)).toBe('locations');
    });

    test('should return "plotPoints" for PLOT_POINT type', () => {
      expect(getCollectionName(ItemTypes.PLOT_POINT)).toBe('plotPoints');
    });

    test('should return "notes" for NOTE type', () => {
      expect(getCollectionName(ItemTypes.NOTE)).toBe('notes');
    });

    test('should return "chapters" for CHAPTER type', () => {
      expect(getCollectionName(ItemTypes.CHAPTER)).toBe('chapters');
    });

    test('should return "scenes" for SCENE type', () => {
      expect(getCollectionName(ItemTypes.SCENE)).toBe('scenes');
    });

    test('should return null and log error for unknown item type', () => {
      const consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation();

      const result = getCollectionName('unknown_type');

      expect(result).toBeNull();
      expect(consoleErrorSpy).toHaveBeenCalledWith('Unknown item type:', 'unknown_type');

      consoleErrorSpy.mockRestore();
    });
  });

  describe('ItemMetadata', () => {
    test('should have correct metadata for BOOK type', () => {
      const metadata = ItemMetadata[ItemTypes.BOOK];

      expect(metadata.pluralKey).toBe('books');
      expect(metadata.nameField).toBe('name');
      expect(metadata.fields).toContain('name');
    });

    test('should have correct metadata for CHARACTER type', () => {
      const metadata = ItemMetadata[ItemTypes.CHARACTER];

      expect(metadata.pluralKey).toBe('characters');
      expect(metadata.nameField).toBe('name');
      expect(metadata.fields).toContain('name');
    });
  });
});
