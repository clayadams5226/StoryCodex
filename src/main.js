/**
 * main.js - Application entry point
 * Wires up all dependencies and initializes the modular architecture
 */

import { StateManager } from './core/StateManager.js';
import { StorageService } from './core/StorageService.js';
import { BookService } from './services/BookService.js';
import { ItemService } from './services/ItemService.js';
import { TagService } from './services/TagService.js';
import { ScreenManager } from './ui/ScreenManager.js';
import { ListRenderer } from './ui/ListRenderer.js';
import { ItemTypes } from './models/ItemTypes.js';
import { ItemFactory } from './models/ItemFactory.js';
import { DataManager } from '../DataManager.js';
import { RichTextEditor } from '../RichTextEditor.js';

/**
 * Main Application class
 * Manages dependency injection and initialization
 */
class Application {
  constructor() {
    // Core layer
    this.storageService = new StorageService();
    this.stateManager = new StateManager(this.storageService);

    // Services layer
    this.bookService = new BookService(this.stateManager, this.storageService);
    this.itemService = new ItemService(this.stateManager);
    this.tagService = new TagService();

    // UI layer
    this.screenManager = new ScreenManager(this.stateManager);
    this.listRenderer = new ListRenderer();

    // Existing modules (unchanged)
    this.dataManager = new DataManager();
    this.richTextEditor = new RichTextEditor('noteEditor');
    this.relationshipGraph = null; // Created on demand

    // Make ItemTypes and ItemFactory available
    this.ItemTypes = ItemTypes;
    this.ItemFactory = ItemFactory;
  }

  /**
   * Initialize the application
   * Loads state from storage and sets up initial UI
   */
  async initialize() {
    // Uncomment for debugging:
    // console.log('Initializing Story Codex with modular architecture...');

    try {
      // Load state from storage
      await this.stateManager.loadFromStorage();

      // Uncomment for debugging:
      // const state = this.stateManager.getState();
      // console.log('Loaded state:', {
      //   bookCount: state.books.length,
      //   currentScreen: state.currentScreen
      // });

      // Application is now ready
      // Event listeners and UI updates can be added by popup.js
      // or migrated here incrementally

      // Uncomment for debugging:
      // console.log('Story Codex initialized successfully');
      return true;
    } catch (error) {
      console.error('Error initializing application:', error);
      return false;
    }
  }

  /**
   * Get current state (useful for debugging and migration)
   * @returns {Object} Current application state
   */
  getState() {
    return this.stateManager.getState();
  }

  /**
   * Get all books
   * @returns {Array} Array of books
   */
  getBooks() {
    return this.stateManager.getBooks();
  }

  /**
   * Get current book
   * @returns {Object|null} Current book or null
   */
  getCurrentBook() {
    return this.stateManager.getCurrentBook();
  }
}

/**
 * Initialize application when DOM is ready
 * Makes the app instance available globally for migration purposes
 */
if (typeof document !== 'undefined') {
  document.addEventListener('DOMContentLoaded', async () => {
    const app = new Application();
    const initialized = await app.initialize();

    if (initialized) {
      // Make app available globally for debugging and gradual migration
      window.storyCodex = app;

      // Uncomment for debugging:
      // console.log('StoryCodex app instance available at window.storyCodex');
      // console.log('Access modules via: window.storyCodex.bookService, etc.');
    }
  });
}

export { Application };
