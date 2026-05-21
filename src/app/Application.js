/**
 * Application - Dependency container for Story Codex.
 * Keeps construction in one place so popup feature modules can share services.
 */

import { StateManager } from '../core/StateManager.js';
import { StorageService } from '../core/StorageService.js';
import { BookService } from '../services/BookService.js';
import { ItemService } from '../services/ItemService.js';
import { TagService } from '../services/TagService.js';
import { ScreenManager } from '../ui/ScreenManager.js';
import { ListRenderer } from '../ui/ListRenderer.js';
import { ItemTypes } from '../models/ItemTypes.js';
import { ItemFactory } from '../models/ItemFactory.js';
import { DataManager } from '../../DataManager.js';
import { RichTextEditor } from '../../RichTextEditor.js';
import { ImageHandler } from '../../ImageHandler.js';

export class Application {
  constructor() {
    this.storageService = new StorageService();
    this.stateManager = new StateManager(this.storageService);

    this.bookService = new BookService(this.stateManager, this.storageService);
    this.itemService = new ItemService(this.stateManager);
    this.tagService = new TagService();

    this.screenManager = new ScreenManager(this.stateManager);
    this.listRenderer = new ListRenderer();

    this.dataManager = new DataManager();
    this.richTextEditor = new RichTextEditor('noteEditor');
    this.imageHandler = new ImageHandler();
    this.relationshipGraph = null;

    this.ItemTypes = ItemTypes;
    this.ItemFactory = ItemFactory;
  }

  async initialize() {
    try {
      await this.stateManager.loadFromStorage();
      return true;
    } catch (error) {
      console.error('Error initializing application:', error);
      return false;
    }
  }

  getState() {
    return this.stateManager.getState();
  }

  getBooks() {
    return this.stateManager.getBooks();
  }

  getCurrentBook() {
    return this.stateManager.getCurrentBook();
  }
}
