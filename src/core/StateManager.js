/**
 * StateManager - Centralized state management
 * Single source of truth for application state
 * Eliminates global variables and manages state persistence
 */

import { migrateAllBooks, needsMigration } from '../migrations/addSceneChapterIds.js';

export class StateManager {
  constructor(storageService) {
    this.storageService = storageService;
    this.state = {
      books: [],
      currentBook: null,
      currentItem: null,
      currentScreen: 'bookList',
      currentItemType: null
    };
  }

  /**
   * Get the entire state object (immutable copy)
   * @returns {Object} Current state
   */
  getState() {
    return this.state;
  }

  /**
   * Update state and persist to storage
   * @param {Object} updates - Partial state updates
   * @returns {Promise<void>}
   */
  async setState(updates) {
    Object.assign(this.state, updates);

    // Persist state changes
    try {
      await this.storageService.saveState(this.state);

      // If books were updated, save them separately
      if (Object.prototype.hasOwnProperty.call(updates, 'books')) {
        await this.storageService.saveBooks(this.state.books);
      }
    } catch (error) {
      console.error('Error persisting state:', error);
    }
  }

  /**
   * Get current book
   * @returns {Object|null} Current book object
   */
  getCurrentBook() {
    return this.state.currentBook;
  }

  /**
   * Get current item
   * @returns {Object|null} Current item object
   */
  getCurrentItem() {
    return this.state.currentItem;
  }

  /**
   * Get current screen ID
   * @returns {string} Current screen ID
   */
  getCurrentScreen() {
    return this.state.currentScreen;
  }

  /**
   * Get current item type
   * @returns {string|null} Current item type
   */
  getCurrentItemType() {
    return this.state.currentItemType;
  }

  /**
   * Get all books
   * @returns {Array} Books array
   */
  getBooks() {
    return this.state.books;
  }

  /**
   * Set current book
   * @param {Object} book - Book object
   * @returns {Promise<void>}
   */
  async setCurrentBook(book) {
    await this.setState({ currentBook: book });
  }

  /**
   * Set current item
   * @param {Object} item - Item object
   * @param {string} itemType - Item type
   * @returns {Promise<void>}
   */
  async setCurrentItem(item, itemType) {
    await this.setState({
      currentItem: item,
      currentItemType: itemType
    });
  }

  /**
   * Set current screen
   * @param {string} screenId - Screen ID
   * @returns {Promise<void>}
   */
  async setCurrentScreen(screenId) {
    await this.setState({ currentScreen: screenId });
  }

  /**
   * Clear current item
   * @returns {Promise<void>}
   */
  async clearCurrentItem() {
    await this.setState({
      currentItem: null,
      currentItemType: null
    });
  }

  /**
   * Load state from storage
   * Restores object references from saved names
   * @returns {Promise<void>}
   */
  async loadFromStorage() {
    const data = await this.storageService.load();

    // Restore books first (contains full data with pictures)
    this.state.books = data.books || [];

    // Run migration to add IDs to scenes and chapters if needed
    const needsSceneChapterMigration = this.state.books.some(book => needsMigration(book));
    if (needsSceneChapterMigration) {
      console.log('Running scene/chapter ID migration...');
      this.state.books = migrateAllBooks(this.state.books);
      // Save migrated data immediately
      await this.storageService.saveBooks(this.state.books);
      console.log('Scene/chapter ID migration complete');
    }

    // Restore navigation state from lightweight references
    if (data.currentState) {
      // Restore currentBook by finding it in loaded books
      if (data.currentState.currentBookName) {
        this.state.currentBook = this.state.books.find(
          book => book.name === data.currentState.currentBookName
        ) || null;
      } else {
        this.state.currentBook = null;
      }

      // Restore currentItem by finding it in the current book
      if (data.currentState.currentItemName && this.state.currentBook && data.currentState.currentItemType) {
        this.state.currentItem = this.findItemInBook(
          this.state.currentBook,
          data.currentState.currentItemType,
          data.currentState.currentItemName
        ) || null;
      } else {
        this.state.currentItem = null;
      }

      this.state.currentScreen = data.currentState.currentScreen || 'bookList';
      this.state.currentItemType = data.currentState.currentItemType || null;
    }
  }

  /**
   * Find an item in a book by type and name
   * @param {Object} book - Book object
   * @param {string} itemType - Type of item (character, location, etc.)
   * @param {string} itemName - Name or title of the item
   * @returns {Object|null} Found item or null
   */
  findItemInBook(book, itemType, itemName) {
    let collection;
    let nameField;

    switch (itemType) {
      case 'character':
        collection = book.characters;
        nameField = 'name';
        break;
      case 'location':
        collection = book.locations;
        nameField = 'name';
        break;
      case 'plotPoint':
        collection = book.plotPoints;
        nameField = 'title';
        break;
      case 'note':
        collection = book.notes;
        nameField = 'title';
        break;
      case 'chapter':
        collection = book.chapters;
        nameField = 'title';
        break;
      case 'scene':
        collection = book.scenes;
        nameField = 'title';
        break;
      default:
        return null;
    }

    if (!collection) return null;

    return collection.find(item => item[nameField] === itemName) || null;
  }
}
