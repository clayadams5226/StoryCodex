import { jest } from '@jest/globals';
import { BookService } from '../../src/services/BookService.js';
import { StateManager } from '../../src/core/StateManager.js';
import { StorageService } from '../../src/core/StorageService.js';

describe('BookService', () => {
  let bookService;
  let stateManager;
  let storageService;

  beforeEach(() => {
    resetChromeStorage();
    storageService = new StorageService();
    stateManager = new StateManager(storageService);
    bookService = new BookService(stateManager, storageService);
  });

  describe('createBook', () => {
    test('should create and add book to state', async () => {
      const book = await bookService.createBook('My Novel');

      expect(book.name).toBe('My Novel');
      expect(book.characters).toEqual([]);
      expect(book.locations).toEqual([]);

      const state = stateManager.getState();
      expect(state.books).toContain(book);
    });

    test('should persist book to storage', async () => {
      await bookService.createBook('My Novel');

      const storage = getChromeStorage();
      expect(storage.books.length).toBe(1);
      expect(storage.books[0].name).toBe('My Novel');
    });
  });

  describe('updateBook', () => {
    test('should persist book changes', async () => {
      const book = await bookService.createBook('My Novel');
      book.wordCount = 5000;

      await bookService.updateBook(book);

      const storage = getChromeStorage();
      expect(storage.books[0].wordCount).toBe(5000);
    });

    test('should handle null book', async () => {
      const consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation();

      await bookService.updateBook(null);

      expect(consoleErrorSpy).toHaveBeenCalledWith('Cannot update null book');

      consoleErrorSpy.mockRestore();
    });
  });

  describe('deleteBook', () => {
    test('should remove book from state and storage', async () => {
      const book = await bookService.createBook('My Novel');

      const result = await bookService.deleteBook(book);

      expect(result).toBe(true);

      const state = stateManager.getState();
      expect(state.books.length).toBe(0);

      const storage = getChromeStorage();
      expect(storage.books.length).toBe(0);
    });

    test('should return false for non-existent book', async () => {
      const book = { name: 'Nonexistent' };

      const result = await bookService.deleteBook(book);

      expect(result).toBe(false);
    });
  });

  describe('getBook', () => {
    test('should find book by name', async () => {
      await bookService.createBook('Book 1');
      await bookService.createBook('Book 2');

      const found = bookService.getBook('Book 1');

      expect(found).toBeDefined();
      expect(found.name).toBe('Book 1');
    });

    test('should return null when book not found', () => {
      const found = bookService.getBook('Nonexistent');

      expect(found).toBeNull();
    });
  });

  describe('getAllBooks', () => {
    test('should return all books', async () => {
      await bookService.createBook('Book 1');
      await bookService.createBook('Book 2');

      const books = bookService.getAllBooks();

      expect(books.length).toBe(2);
      expect(books[0].name).toBe('Book 1');
      expect(books[1].name).toBe('Book 2');
    });
  });

  describe('updateWordCount', () => {
    test('should update word count and persist', async () => {
      const book = await bookService.createBook('My Novel');

      await bookService.updateWordCount(book, 10000);

      expect(book.wordCount).toBe(10000);

      const storage = getChromeStorage();
      expect(storage.books[0].wordCount).toBe(10000);
    });
  });

  describe('updateTargetWordCount', () => {
    test('should update target word count and persist', async () => {
      const book = await bookService.createBook('My Novel');

      await bookService.updateTargetWordCount(book, 50000);

      expect(book.targetWordCount).toBe(50000);

      const storage = getChromeStorage();
      expect(storage.books[0].targetWordCount).toBe(50000);
    });
  });

  describe('character picture persistence', () => {
    test('should persist character picture when book is updated', async () => {
      const book = await bookService.createBook('My Novel');

      // Add a character with a picture (simulating base64 image)
      const testPicture = 'data:image/jpeg;base64,/9j/4AAQSkZJRg=='; // Sample base64
      book.characters.push({
        name: 'Alice',
        picture: testPicture,
        nickname: '',
        description: '',
        scene: '',
        type: '',
        relationships: [],
        notes: [],
        tags: []
      });

      // Update book to persist the change
      await bookService.updateBook(book);

      // Verify picture is persisted in storage
      const storage = getChromeStorage();
      expect(storage.books[0].characters.length).toBe(1);
      expect(storage.books[0].characters[0].name).toBe('Alice');
      expect(storage.books[0].characters[0].picture).toBe(testPicture);
    });

    test('should persist character picture removal', async () => {
      const book = await bookService.createBook('My Novel');

      // Add a character with a picture
      const testPicture = 'data:image/jpeg;base64,/9j/4AAQSkZJRg==';
      book.characters.push({
        name: 'Alice',
        picture: testPicture,
        nickname: '',
        description: '',
        scene: '',
        type: '',
        relationships: [],
        notes: [],
        tags: []
      });

      await bookService.updateBook(book);

      // Remove the picture
      book.characters[0].picture = '';

      await bookService.updateBook(book);

      // Verify picture removal is persisted
      const storage = getChromeStorage();
      expect(storage.books[0].characters[0].picture).toBe('');
    });

    test('should persist all new character fields', async () => {
      const book = await bookService.createBook('My Novel');

      // Add a character with all new fields
      book.characters.push({
        name: 'Bob',
        picture: 'data:image/jpeg;base64,test',
        age: '30',
        occupation: 'Detective',
        pronouns: 'he/him',
        role: 'protagonist',
        aliases: 'Bobby',
        status: 'alive',
        physicalDescription: 'Tall with dark hair',
        background: 'Former police officer',
        personalityTraits: 'Determined and analytical',
        motivations: 'Solve the case',
        fears: 'Failure',
        voicePatterns: 'Speaks quickly when excited',
        internalConflict: 'Doubts his abilities',
        externalConflict: 'Corrupt system',
        // Legacy fields
        nickname: '',
        description: '',
        scene: '',
        type: '',
        relationships: [],
        notes: [],
        tags: []
      });

      await bookService.updateBook(book);

      // Verify all fields are persisted
      const storage = getChromeStorage();
      const savedCharacter = storage.books[0].characters[0];

      expect(savedCharacter.name).toBe('Bob');
      expect(savedCharacter.picture).toBe('data:image/jpeg;base64,test');
      expect(savedCharacter.age).toBe('30');
      expect(savedCharacter.occupation).toBe('Detective');
      expect(savedCharacter.pronouns).toBe('he/him');
      expect(savedCharacter.role).toBe('protagonist');
      expect(savedCharacter.aliases).toBe('Bobby');
      expect(savedCharacter.status).toBe('alive');
      expect(savedCharacter.physicalDescription).toBe('Tall with dark hair');
      expect(savedCharacter.background).toBe('Former police officer');
      expect(savedCharacter.personalityTraits).toBe('Determined and analytical');
      expect(savedCharacter.motivations).toBe('Solve the case');
      expect(savedCharacter.fears).toBe('Failure');
      expect(savedCharacter.voicePatterns).toBe('Speaks quickly when excited');
      expect(savedCharacter.internalConflict).toBe('Doubts his abilities');
      expect(savedCharacter.externalConflict).toBe('Corrupt system');
    });
  });
});
