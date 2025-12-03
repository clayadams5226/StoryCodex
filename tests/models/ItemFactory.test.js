import { jest } from '@jest/globals';
import { ItemFactory } from '../../src/models/ItemFactory.js';
import { ItemTypes } from '../../src/models/ItemTypes.js';

describe('ItemFactory', () => {
  describe('createCharacter', () => {
    test('should create character with correct structure', () => {
      const character = ItemFactory.createCharacter('Alice');

      // Basic fields
      expect(character.name).toBe('Alice');
      expect(character.nickname).toBe('');
      expect(character.description).toBe('');
      expect(character.scene).toBe('');
      expect(character.type).toBe('');
      expect(character.relationships).toEqual([]);
      expect(character.notes).toEqual([]);
      expect(character.tags).toEqual([]);

      // NEW: Picture
      expect(character.picture).toBe('');

      // NEW: Basic Details
      expect(character.age).toBe('');
      expect(character.occupation).toBe('');
      expect(character.pronouns).toBe('');
      expect(character.role).toBe('');
      expect(character.aliases).toBe('');
      expect(character.status).toBe('');

      // NEW: Physical Description & Background
      expect(character.physicalDescription).toBe('');
      expect(character.background).toBe('');

      // NEW: Character Depth
      expect(character.personalityTraits).toBe('');
      expect(character.motivations).toBe('');
      expect(character.fears).toBe('');
      expect(character.voicePatterns).toBe('');
      expect(character.internalConflict).toBe('');
      expect(character.externalConflict).toBe('');

      // NEW: Character Arc
      expect(character.characterArc).toBeDefined();
      expect(character.characterArc.templateType).toBe('');
      expect(character.characterArc.beats).toEqual([]);
    });
  });

  describe('createLocation', () => {
    test('should create location with correct structure', () => {
      const location = ItemFactory.createLocation('Castle');

      expect(location.name).toBe('Castle');
      expect(location.description).toBe('');
      expect(location.importance).toBe('');
      expect(location.notes).toEqual([]);
      expect(location.tags).toEqual([]);
    });
  });

  describe('createPlotPoint', () => {
    test('should create plot point with correct structure', () => {
      const plotPoint = ItemFactory.createPlotPoint('Discovery');

      expect(plotPoint.title).toBe('Discovery');
      expect(plotPoint.description).toBe('');
      expect(plotPoint.characters).toBe('');
      expect(plotPoint.location).toBe('');
      expect(plotPoint.notes).toEqual([]);
      expect(plotPoint.tags).toEqual([]);
    });
  });

  describe('createNote', () => {
    test('should create note with correct structure', () => {
      const before = Date.now();
      const note = ItemFactory.createNote('Chapter Ideas', 'Some content');
      const after = Date.now();

      expect(note.title).toBe('Chapter Ideas');
      expect(note.content).toBe('Some content');
      expect(note.id).toBeGreaterThanOrEqual(before);
      expect(note.id).toBeLessThanOrEqual(after);
      expect(note.createdAt).toBeDefined();
      expect(new Date(note.createdAt)).toBeInstanceOf(Date);
    });

    test('should create note with empty content when not provided', () => {
      const note = ItemFactory.createNote('Title Only');

      expect(note.title).toBe('Title Only');
      expect(note.content).toBe('');
    });
  });

  describe('createChapter', () => {
    test('should create chapter with correct structure', () => {
      const chapter = ItemFactory.createChapter('Chapter 1');

      expect(chapter.id).toBeDefined();
      expect(typeof chapter.id).toBe('string');
      expect(chapter.id.length).toBeGreaterThan(0);
      expect(chapter.title).toBe('Chapter 1');
      expect(chapter.summary).toBe('');
      expect(chapter.scenes).toEqual([]);
    });

    test('should create unique IDs for each chapter', () => {
      const chapter1 = ItemFactory.createChapter('Chapter 1');
      const chapter2 = ItemFactory.createChapter('Chapter 2');

      expect(chapter1.id).not.toBe(chapter2.id);
    });
  });

  describe('createScene', () => {
    test('should create scene with correct structure', () => {
      const scene = ItemFactory.createScene('Opening Scene');

      expect(scene.id).toBeDefined();
      expect(typeof scene.id).toBe('string');
      expect(scene.id.length).toBeGreaterThan(0);
      expect(scene.title).toBe('Opening Scene');
      expect(scene.summary).toBe('');
      expect(scene.characters).toEqual([]);
      expect(scene.locations).toEqual([]);
      expect(scene.plotPoints).toEqual([]);
    });

    test('should create unique IDs for each scene', () => {
      const scene1 = ItemFactory.createScene('Scene 1');
      const scene2 = ItemFactory.createScene('Scene 2');

      expect(scene1.id).not.toBe(scene2.id);
    });
  });

  describe('createArcBeat', () => {
    test('should create arc beat with correct structure', () => {
      const beat = ItemFactory.createArcBeat('The Flaw Established', 0);

      expect(beat.id).toBeDefined();
      expect(typeof beat.id).toBe('string');
      expect(beat.id.length).toBeGreaterThan(0);
      expect(beat.name).toBe('The Flaw Established');
      expect(beat.description).toBe('');
      expect(beat.order).toBe(0);
      expect(beat.linkedScenes).toEqual([]);
      expect(beat.linkedChapters).toEqual([]);
      expect(beat.emotionalState).toBe('');
      expect(beat.yPosition).toBe(50);
    });

    test('should create unique IDs for each beat', () => {
      const beat1 = ItemFactory.createArcBeat('Beat 1', 0);
      const beat2 = ItemFactory.createArcBeat('Beat 2', 1);

      expect(beat1.id).not.toBe(beat2.id);
    });

    test('should use default order of 0 if not provided', () => {
      const beat = ItemFactory.createArcBeat('Test Beat');

      expect(beat.order).toBe(0);
    });

    test('should accept custom order value', () => {
      const beat = ItemFactory.createArcBeat('Middle Beat', 5);

      expect(beat.order).toBe(5);
    });
  });

  describe('createBook', () => {
    test('should create book with correct structure', () => {
      const book = ItemFactory.createBook('My Novel');

      expect(book.name).toBe('My Novel');
      expect(book.characters).toEqual([]);
      expect(book.locations).toEqual([]);
      expect(book.plotPoints).toEqual([]);
      expect(book.relationships).toEqual([]);
      expect(book.notes).toEqual([]);
      expect(book.tags).toEqual([]);
      expect(book.wordCount).toBe(0);
      expect(book.targetWordCount).toBe(0);
      expect(book.chapters).toEqual([]);
      expect(book.scenes).toEqual([]);
    });
  });

  describe('create (generic)', () => {
    test('should create character using generic method', () => {
      const character = ItemFactory.create(ItemTypes.CHARACTER, 'Bob');

      expect(character.name).toBe('Bob');
      expect(character).toHaveProperty('nickname');
      expect(character).toHaveProperty('relationships');
    });

    test('should create location using generic method', () => {
      const location = ItemFactory.create(ItemTypes.LOCATION, 'Forest');

      expect(location.name).toBe('Forest');
      expect(location).toHaveProperty('description');
      expect(location).toHaveProperty('importance');
    });

    test('should create plot point using generic method', () => {
      const plotPoint = ItemFactory.create(ItemTypes.PLOT_POINT, 'Revelation');

      expect(plotPoint.title).toBe('Revelation');
      expect(plotPoint).toHaveProperty('description');
    });

    test('should create note using generic method', () => {
      const note = ItemFactory.create(ItemTypes.NOTE, 'Test Note', 'Test content');

      expect(note.title).toBe('Test Note');
      expect(note.content).toBe('Test content');
      expect(note).toHaveProperty('id');
    });

    test('should handle unknown item type', () => {
      const consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation();

      const result = ItemFactory.create('invalid_type', 'Test');

      expect(result).toBeNull();
      expect(consoleErrorSpy).toHaveBeenCalledWith('Unknown item type:', 'invalid_type');

      consoleErrorSpy.mockRestore();
    });
  });
});
