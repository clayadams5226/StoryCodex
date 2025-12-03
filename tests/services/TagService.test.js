import { jest } from '@jest/globals';
import { TagService } from '../../src/services/TagService.js';
import { ItemFactory } from '../../src/models/ItemFactory.js';

describe('TagService', () => {
  let tagService;
  let book;

  beforeEach(() => {
    tagService = new TagService();
    book = ItemFactory.createBook('Test Book');
  });

  describe('addTagToItem', () => {
    test('should add tag to item', () => {
      const character = ItemFactory.createCharacter('Alice');

      const result = tagService.addTagToItem(character, 'protagonist');

      expect(result).toBe(true);
      expect(character.tags).toContain('protagonist');
    });

    test('should not add duplicate tag', () => {
      const character = ItemFactory.createCharacter('Alice');
      tagService.addTagToItem(character, 'protagonist');

      const result = tagService.addTagToItem(character, 'protagonist');

      expect(result).toBe(false);
      expect(character.tags.length).toBe(1);
    });

    test('should handle null item', () => {
      const consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation();

      const result = tagService.addTagToItem(null, 'tag');

      expect(result).toBe(false);
      expect(consoleErrorSpy).toHaveBeenCalled();

      consoleErrorSpy.mockRestore();
    });

    test('should handle empty tag', () => {
      const character = ItemFactory.createCharacter('Alice');
      const consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation();

      const result = tagService.addTagToItem(character, '');

      expect(result).toBe(false);
      expect(consoleErrorSpy).toHaveBeenCalled();

      consoleErrorSpy.mockRestore();
    });
  });

  describe('removeTagFromItem', () => {
    test('should remove tag from item', () => {
      const character = ItemFactory.createCharacter('Alice');
      character.tags.push('protagonist');

      const result = tagService.removeTagFromItem(character, 'protagonist');

      expect(result).toBe(true);
      expect(character.tags).not.toContain('protagonist');
    });

    test('should return false when tag not found', () => {
      const character = ItemFactory.createCharacter('Alice');

      const result = tagService.removeTagFromItem(character, 'nonexistent');

      expect(result).toBe(false);
    });
  });

  describe('addTagToBook', () => {
    test('should add tag to book', () => {
      const result = tagService.addTagToBook(book, 'fantasy');

      expect(result).toBe(true);
      expect(book.tags).toContain('fantasy');
    });

    test('should not add duplicate tag to book', () => {
      tagService.addTagToBook(book, 'fantasy');

      const result = tagService.addTagToBook(book, 'fantasy');

      expect(result).toBe(false);
      expect(book.tags.length).toBe(1);
    });
  });

  describe('removeTagFromBook', () => {
    test('should remove tag from book', () => {
      book.tags.push('fantasy');

      const result = tagService.removeTagFromBook(book, 'fantasy');

      expect(result).toBe(true);
      expect(book.tags).not.toContain('fantasy');
    });
  });

  describe('getTaggedItems', () => {
    test('should find all items with tag', () => {
      const alice = ItemFactory.createCharacter('Alice');
      alice.tags.push('protagonist');
      book.characters.push(alice);

      const castle = ItemFactory.createLocation('Castle');
      castle.tags.push('protagonist');
      book.locations.push(castle);

      const discovery = ItemFactory.createPlotPoint('Discovery');
      discovery.tags.push('other');
      book.plotPoints.push(discovery);

      const tagged = tagService.getTaggedItems(book, 'protagonist');

      expect(tagged.length).toBe(2);
      expect(tagged[0].item.name).toBe('Alice');
      expect(tagged[0].type).toBe('character');
      expect(tagged[1].item.name).toBe('Castle');
      expect(tagged[1].type).toBe('location');
    });

    test('should return empty array when no items have tag', () => {
      const tagged = tagService.getTaggedItems(book, 'nonexistent');

      expect(tagged).toEqual([]);
    });
  });

  describe('getAllTags', () => {
    test('should collect all unique tags from book and items', () => {
      book.tags.push('fantasy');
      book.tags.push('adventure');

      const alice = ItemFactory.createCharacter('Alice');
      alice.tags.push('protagonist');
      alice.tags.push('fantasy'); // Duplicate
      book.characters.push(alice);

      const castle = ItemFactory.createLocation('Castle');
      castle.tags.push('important');
      book.locations.push(castle);

      const tags = tagService.getAllTags(book);

      expect(tags).toEqual(['adventure', 'fantasy', 'important', 'protagonist']);
      expect(tags.length).toBe(4); // No duplicates
    });

    test('should return empty array for book with no tags', () => {
      const tags = tagService.getAllTags(book);

      expect(tags).toEqual([]);
    });
  });

  describe('hasTag', () => {
    test('should return true when item has tag', () => {
      const character = ItemFactory.createCharacter('Alice');
      character.tags.push('protagonist');

      expect(tagService.hasTag(character, 'protagonist')).toBe(true);
    });

    test('should return false when item does not have tag', () => {
      const character = ItemFactory.createCharacter('Alice');

      expect(tagService.hasTag(character, 'protagonist')).toBe(false);
    });

    test('should handle null item', () => {
      expect(tagService.hasTag(null, 'tag')).toBe(false);
    });
  });
});
