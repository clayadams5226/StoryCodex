/**
 * StorageService - Abstraction layer for Chrome storage API
 * Provides Promise-based interface for storage operations
 *
 * Uses chrome.storage.local for books (supports large data like images)
 * and chrome.storage.sync for lightweight navigation state (cross-device sync)
 */
export class StorageService {
  constructor() {
    // Use local storage for books (5MB+ quota for images)
    this.booksStorage = chrome.storage.local;
    // Use sync storage for lightweight state (cross-device sync)
    this.stateStorage = chrome.storage.sync;
  }

  /**
   * Load books and current state from storage
   * @returns {Promise<{books: Array, currentState: Object}>}
   */
  async load() {
    return new Promise((resolve) => {
      // Load books from local storage
      this.booksStorage.get(['books'], (booksResult) => {
        if (chrome.runtime.lastError) {
          console.error('Error loading books from storage:', chrome.runtime.lastError);
          resolve({ books: [], currentState: {} });
          return;
        }

        // Load state from sync storage
        this.stateStorage.get(['currentState'], (stateResult) => {
          if (chrome.runtime.lastError) {
            console.error('Error loading state from storage:', chrome.runtime.lastError);
          }

          resolve({
            books: booksResult.books || [],
            currentState: stateResult.currentState || {}
          });
        });
      });
    });
  }

  /**
   * Save books array to storage
   * @param {Array} books - Array of book objects
   * @returns {Promise<void>}
   */
  async saveBooks(books) {
    return new Promise((resolve, reject) => {
      this.booksStorage.set({ books }, () => {
        if (chrome.runtime.lastError) {
          console.error('Error saving books:', chrome.runtime.lastError);
          reject(chrome.runtime.lastError);
        } else {
          resolve();
        }
      });
    });
  }

  /**
   * Save current navigation state to storage
   * Only saves lightweight references, not full objects (to avoid sync storage limits)
   * @param {Object} state - State object with currentBook, currentItem, etc.
   * @returns {Promise<void>}
   */
  async saveState(state) {
    const currentState = {
      // Save only book name as reference (not full object to avoid size limits)
      currentBookName: state.currentBook ? state.currentBook.name : null,
      // Save only item name as reference
      currentItemName: state.currentItem ? state.currentItem.name || state.currentItem.title : null,
      currentScreen: state.currentScreen,
      currentItemType: state.currentItemType
    };

    return new Promise((resolve, reject) => {
      this.stateStorage.set({ currentState }, () => {
        if (chrome.runtime.lastError) {
          console.error('Error saving state:', chrome.runtime.lastError);
          reject(chrome.runtime.lastError);
        } else {
          resolve();
        }
      });
    });
  }

  /**
   * Save both books and state in separate operations
   * @param {Array} books - Array of book objects
   * @param {Object} state - State object
   * @returns {Promise<void>}
   */
  async saveAll(books, state) {
    // Extract references (not full objects) for sync storage
    const currentState = {
      currentBookName: state.currentBook ? state.currentBook.name : null,
      currentItemName: state.currentItem ? (state.currentItem.name || state.currentItem.title) : null,
      currentScreen: state.currentScreen,
      currentItemType: state.currentItemType
    };

    // Save books to local storage and state to sync storage in parallel
    return Promise.all([
      new Promise((resolve, reject) => {
        this.booksStorage.set({ books }, () => {
          if (chrome.runtime.lastError) {
            console.error('Error saving books:', chrome.runtime.lastError);
            reject(chrome.runtime.lastError);
          } else {
            resolve();
          }
        });
      }),
      new Promise((resolve, reject) => {
        this.stateStorage.set({ currentState }, () => {
          if (chrome.runtime.lastError) {
            console.error('Error saving state:', chrome.runtime.lastError);
            reject(chrome.runtime.lastError);
          } else {
            resolve();
          }
        });
      })
    ]).then(() => undefined); // Convert array result to void
  }
}
