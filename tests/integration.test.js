import { describe, test, expect, beforeEach } from '@jest/globals';
import { DataManager } from '../DataManager.js';
import { updateBook, saveCurrentState } from '../utils.js';
import { ItemFactory } from '../src/models/ItemFactory.js';

describe('Integration Tests - Core Workflows', () => {
  let books;
  let currentBook;

  beforeEach(() => {
    books = [];
    currentBook = null;
  });

  describe('Book Management Workflow', () => {
    test('should create a new book with proper structure', () => {
      const newBook = {
        name: 'My Fantasy Novel',
        characters: [],
        locations: [],
        plotPoints: [],
        relationships: [],
        notes: [],
        tags: [],
        wordCount: 0,
        targetWordCount: 80000,
        chapters: [],
        scenes: []
      };

      books.push(newBook);

      expect(books.length).toBe(1);
      expect(books[0].name).toBe('My Fantasy Novel');
      expect(books[0].targetWordCount).toBe(80000);
    });

    test('should manage multiple books independently', () => {
      const book1 = {
        name: 'Book 1',
        characters: [{ name: 'Alice' }],
        locations: [],
        plotPoints: [],
        relationships: [],
        notes: [],
        tags: [],
        wordCount: 1000,
        targetWordCount: 50000,
        chapters: [],
        scenes: []
      };

      const book2 = {
        name: 'Book 2',
        characters: [{ name: 'Bob' }],
        locations: [],
        plotPoints: [],
        relationships: [],
        notes: [],
        tags: [],
        wordCount: 2000,
        targetWordCount: 60000,
        chapters: [],
        scenes: []
      };

      books.push(book1, book2);

      expect(books.length).toBe(2);
      expect(books[0].characters[0].name).toBe('Alice');
      expect(books[1].characters[0].name).toBe('Bob');
      expect(books[0].wordCount).toBe(1000);
      expect(books[1].wordCount).toBe(2000);
    });
  });

  describe('Character Management Workflow', () => {
    beforeEach(() => {
      currentBook = {
        name: 'Test Book',
        characters: [],
        locations: [],
        plotPoints: [],
        relationships: [],
        notes: [],
        tags: ['Fantasy', 'Magic'],
        wordCount: 0,
        targetWordCount: 50000,
        chapters: [],
        scenes: []
      };
      books = [currentBook];
    });

    test('should add character with all properties', () => {
      const character = {
        name: 'Gandalf',
        nickname: 'The Grey',
        description: 'A powerful wizard',
        scene: 'Appears in the Shire',
        type: 'Protagonist',
        relationships: [],
        notes: [],
        tags: ['Magic']
      };

      currentBook.characters.push(character);

      expect(currentBook.characters.length).toBe(1);
      expect(currentBook.characters[0].name).toBe('Gandalf');
      expect(currentBook.characters[0].tags).toContain('Magic');
    });

    test('should add tags to character and maintain book tags', () => {
      const character = {
        name: 'Frodo',
        nickname: 'Ring-bearer',
        description: 'A hobbit',
        scene: '',
        type: 'Protagonist',
        relationships: [],
        notes: [],
        tags: []
      };

      currentBook.characters.push(character);

      // Add tag to character
      const newTag = 'Hero';
      character.tags.push(newTag);

      // Add tag to book if not exists
      if (!currentBook.tags.includes(newTag)) {
        currentBook.tags.push(newTag);
      }

      expect(character.tags).toContain('Hero');
      expect(currentBook.tags).toContain('Hero');
      expect(currentBook.tags.length).toBe(3);
    });

    test('should add notes to character', () => {
      const character = {
        name: 'Aragorn',
        nickname: 'Strider',
        description: 'Ranger of the North',
        scene: '',
        type: 'Protagonist',
        relationships: [],
        notes: [],
        tags: []
      };

      currentBook.characters.push(character);

      const note = {
        id: Date.now(),
        title: 'Character Background',
        content: '<p>Heir to the throne of Gondor</p>',
        createdAt: new Date().toISOString()
      };

      character.notes.push(note);

      expect(character.notes.length).toBe(1);
      expect(character.notes[0].title).toBe('Character Background');
    });
  });

  describe('Relationship Management Workflow', () => {
    beforeEach(() => {
      currentBook = {
        name: 'Test Book',
        characters: [
          {
            name: 'Romeo',
            nickname: '',
            description: '',
            scene: '',
            type: 'Protagonist',
            relationships: [],
            notes: [],
            tags: []
          },
          {
            name: 'Juliet',
            nickname: '',
            description: '',
            scene: '',
            type: 'Protagonist',
            relationships: [],
            notes: [],
            tags: []
          }
        ],
        locations: [],
        plotPoints: [],
        relationships: [],
        notes: [],
        tags: [],
        wordCount: 0,
        targetWordCount: 50000,
        chapters: [],
        scenes: []
      };
      books = [currentBook];
    });

    test('should create bidirectional relationship between characters', () => {
      const relationship = {
        character1: 'Romeo',
        character2: 'Juliet',
        type: 'lover'
      };

      currentBook.relationships.push(relationship);

      // Add relationship to both characters
      const romeo = currentBook.characters.find(c => c.name === 'Romeo');
      const juliet = currentBook.characters.find(c => c.name === 'Juliet');

      romeo.relationships.push(relationship);
      juliet.relationships.push(relationship);

      expect(currentBook.relationships.length).toBe(1);
      expect(romeo.relationships.length).toBe(1);
      expect(juliet.relationships.length).toBe(1);
      expect(romeo.relationships[0].type).toBe('lover');
    });

    test('should support multiple relationship types', () => {
      const char1 = {
        name: 'Darth Vader',
        relationships: [],
        notes: [],
        tags: []
      };
      const char2 = {
        name: 'Luke Skywalker',
        relationships: [],
        notes: [],
        tags: []
      };

      currentBook.characters = [char1, char2];

      const familyRelationship = {
        character1: 'Darth Vader',
        character2: 'Luke Skywalker',
        type: 'family'
      };

      const enemyRelationship = {
        character1: 'Darth Vader',
        character2: 'Luke Skywalker',
        type: 'enemy'
      };

      currentBook.relationships.push(familyRelationship, enemyRelationship);

      expect(currentBook.relationships.length).toBe(2);
      expect(currentBook.relationships[0].type).toBe('family');
      expect(currentBook.relationships[1].type).toBe('enemy');
    });
  });

  describe('Chapter and Scene Workflow', () => {
    beforeEach(() => {
      currentBook = {
        name: 'Test Book',
        characters: [
          { name: 'Alice', tags: [] },
          { name: 'Bob', tags: [] }
        ],
        locations: [
          { name: 'Forest', tags: [] }
        ],
        plotPoints: [
          { title: 'Discovery', tags: [] }
        ],
        relationships: [],
        notes: [],
        tags: [],
        wordCount: 0,
        targetWordCount: 50000,
        chapters: [],
        scenes: []
      };
      books = [currentBook];
    });

    test('should create chapter with scenes', () => {
      const chapter = {
        title: 'Chapter 1: The Beginning',
        summary: 'Our heroes meet for the first time',
        scenes: []
      };

      currentBook.chapters.push(chapter);

      // Add scene to the book's scenes array using ItemFactory
      const scene = ItemFactory.createScene('The Forest Encounter');
      scene.summary = 'Alice meets Bob in the forest';
      scene.characters = ['Alice', 'Bob'];
      scene.locations = ['Forest'];
      scene.plotPoints = ['Discovery'];

      currentBook.scenes.push(scene);

      // Add scene ID to chapter
      chapter.scenes.push(scene.id);

      expect(currentBook.chapters.length).toBe(1);
      expect(currentBook.scenes.length).toBe(1);
      expect(currentBook.chapters[0].scenes.length).toBe(1);
      expect(currentBook.scenes[0].characters).toContain('Alice');
      expect(currentBook.scenes[0].locations).toContain('Forest');
    });

    test('should move scene between chapters', () => {
      const chapter1 = ItemFactory.createChapter('Chapter 1');
      const chapter2 = ItemFactory.createChapter('Chapter 2');

      currentBook.chapters.push(chapter1, chapter2);

      const scene = ItemFactory.createScene('Scene 1');

      currentBook.scenes.push(scene);
      chapter1.scenes.push(scene.id);

      expect(chapter1.scenes).toContain(scene.id);
      expect(chapter2.scenes).not.toContain(scene.id);

      // Move scene from chapter1 to chapter2
      chapter1.scenes = chapter1.scenes.filter(s => s !== scene.id);
      chapter2.scenes.push(scene.id);

      expect(chapter1.scenes).not.toContain(scene.id);
      expect(chapter2.scenes).toContain(scene.id);
    });

    test('should reorder scenes within chapter', () => {
      const chapter = ItemFactory.createChapter('Chapter 1');

      currentBook.chapters.push(chapter);

      // Create multiple scenes using ItemFactory
      const scene1 = ItemFactory.createScene('Scene 1');
      const scene2 = ItemFactory.createScene('Scene 2');
      const scene3 = ItemFactory.createScene('Scene 3');

      currentBook.scenes.push(scene1, scene2, scene3);

      chapter.scenes = [scene1.id, scene2.id, scene3.id];

      expect(chapter.scenes).toEqual([scene1.id, scene2.id, scene3.id]);

      // Reorder: move scene at position 0 to position 2
      const [removed] = chapter.scenes.splice(0, 1);
      chapter.scenes.splice(2, 0, removed);

      expect(chapter.scenes).toEqual([scene2.id, scene3.id, scene1.id]);
    });
  });

  describe('Import/Export Workflow', () => {
    test('should export and import book maintaining data integrity', async () => {
      const originalBook = {
        name: 'Complete Book',
        characters: [
          {
            name: 'Hero',
            nickname: 'The Brave',
            description: 'A courageous warrior',
            scene: 'Opening battle',
            type: 'Protagonist',
            relationships: [],
            notes: [{ id: 1, title: 'Note 1', content: 'Content' }],
            tags: ['Brave', 'Strong']
          }
        ],
        locations: [
          {
            name: 'Castle',
            description: 'Ancient fortress',
            importance: 'High',
            notes: [],
            tags: ['Medieval']
          }
        ],
        plotPoints: [
          {
            title: 'First Battle',
            description: 'Hero proves their worth',
            characters: 'Hero',
            location: 'Castle',
            notes: [],
            tags: ['Action']
          }
        ],
        relationships: [
          {
            character1: 'Hero',
            character2: 'Villain',
            type: 'enemy'
          }
        ],
        notes: [
          {
            id: 100,
            title: 'Book Note',
            content: '<p>General notes</p>',
            createdAt: '2024-01-01T00:00:00.000Z'
          }
        ],
        tags: ['Brave', 'Strong', 'Medieval', 'Action'],
        wordCount: 15000,
        targetWordCount: 80000,
        chapters: [
          {
            title: 'Chapter 1',
            summary: 'The beginning',
            scenes: [0]
          }
        ],
        scenes: [
          {
            title: 'Opening Scene',
            summary: 'Hero appears',
            characters: ['Hero'],
            locations: ['Castle'],
            plotPoints: ['First Battle']
          }
        ]
      };

      const dataManager = new DataManager();
      dataManager.setCurrentBook(originalBook);

      // Export to JSON string (simulate export)
      const exportedJSON = JSON.stringify(originalBook, null, 2);

      // Import from JSON (simulate import)
      const mockFile = new File([exportedJSON], 'complete-book.json', { type: 'application/json' });
      const importedBook = await dataManager.importFromJSON(mockFile);

      // Verify all data is preserved
      expect(importedBook.name).toBe(originalBook.name);
      expect(importedBook.characters.length).toBe(1);
      expect(importedBook.characters[0].name).toBe('Hero');
      expect(importedBook.characters[0].tags).toEqual(['Brave', 'Strong']);
      expect(importedBook.locations.length).toBe(1);
      expect(importedBook.plotPoints.length).toBe(1);
      expect(importedBook.relationships.length).toBe(1);
      expect(importedBook.notes.length).toBe(1);
      expect(importedBook.wordCount).toBe(15000);
      expect(importedBook.chapters.length).toBe(1);
      expect(importedBook.scenes.length).toBe(1);
      expect(importedBook.chapters[0].scenes).toContain(0);
    });
  });

  describe('Storage Persistence Workflow', () => {
    test('should save and restore book state', (done) => {
      const book = {
        name: 'Test Book',
        characters: [{ name: 'Alice' }],
        locations: [],
        plotPoints: [],
        relationships: [],
        notes: [],
        tags: [],
        wordCount: 5000,
        targetWordCount: 50000,
        chapters: [],
        scenes: []
      };

      books = [book];

      // Update book in storage
      updateBook(books, book);

      setTimeout(() => {
        const storage = getChromeStorage();
        expect(storage.books).toBeDefined();
        expect(storage.books.length).toBe(1);
        expect(storage.books[0].name).toBe('Test Book');
        expect(storage.books[0].wordCount).toBe(5000);
        done();
      }, 10);
    });

    test('should save and restore navigation state', (done) => {
      const book = {
        name: 'Test Book',
        characters: [{ name: 'Alice' }],
        locations: [],
        plotPoints: [],
        relationships: [],
        notes: [],
        tags: [],
        wordCount: 0,
        targetWordCount: 50000,
        chapters: [],
        scenes: []
      };

      const character = book.characters[0];

      saveCurrentState(book, character, 'characterDetails', 'character');

      setTimeout(() => {
        // State is saved to sync storage (as references)
        const syncStorage = getSyncStorage();
        expect(syncStorage.currentState).toBeDefined();
        expect(syncStorage.currentState.currentBookName).toBe('Test Book');
        expect(syncStorage.currentState.currentItemName).toBe('Alice');
        expect(syncStorage.currentState.currentScreen).toBe('characterDetails');
        expect(syncStorage.currentState.currentItemType).toBe('character');
        done();
      }, 10);
    });
  });
});
