/**
 * BookService - Book-level operations
 * Handles book creation, updates, and persistence
 */

import { ItemFactory } from '../models/ItemFactory.js';

export class BookService {
  constructor(stateManager, storageService) {
    this.stateManager = stateManager;
    this.storageService = storageService;
  }

  /**
   * Create a new book
   * @param {string} name - Book name
   * @returns {Promise<Object>} Created book
   */
  async createBook(name) {
    const book = ItemFactory.createBook(name);
    const state = this.stateManager.getState();

    state.books.push(book);
    await this.stateManager.setState({ books: state.books });

    return book;
  }

  /**
   * Update a book in storage
   * @param {Object} book - Book to update
   * @returns {Promise<void>}
   */
  async updateBook(book) {
    if (!book) {
      console.error('Cannot update null book');
      return;
    }

    const state = this.stateManager.getState();
    const index = state.books.findIndex(b => b === book);

    if (index === -1) {
      console.error('Book not found in state');
      return;
    }

    // Book is already updated by reference, just persist
    await this.storageService.saveBooks(state.books);
  }

  /**
   * Delete a book
   * @param {Object} book - Book to delete
   * @returns {Promise<boolean>} Success status
   */
  async deleteBook(book) {
    const state = this.stateManager.getState();
    const index = state.books.indexOf(book);

    if (index === -1) {
      console.error('Book not found');
      return false;
    }

    state.books.splice(index, 1);
    await this.stateManager.setState({ books: state.books });

    return true;
  }

  /**
   * Get a book by name
   * @param {string} name - Book name
   * @returns {Object|null} Book or null if not found
   */
  getBook(name) {
    const state = this.stateManager.getState();
    return state.books.find(b => b.name === name) || null;
  }

  /**
   * Get all books
   * @returns {Array} Array of books
   */
  getAllBooks() {
    return this.stateManager.getBooks();
  }

  /**
   * Update book word count
   * @param {Object} book - Book to update
   * @param {number} wordCount - New word count
   * @returns {Promise<void>}
   */
  async updateWordCount(book, wordCount) {
    book.wordCount = wordCount;
    await this.updateBook(book);
  }

  /**
   * Update book target word count
   * @param {Object} book - Book to update
   * @param {number} targetWordCount - New target word count
   * @returns {Promise<void>}
   */
  async updateTargetWordCount(book, targetWordCount) {
    book.targetWordCount = targetWordCount;
    await this.updateBook(book);
  }
}
