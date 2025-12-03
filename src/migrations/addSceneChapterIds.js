/**
 * Migration: Add IDs to existing scenes and chapters
 *
 * This migration adds unique IDs to scenes and chapters that don't have them,
 * and converts chapter.scenes from index-based arrays to ID-based arrays.
 */

// UUID generation that works in both browser and Node.js
function generateUUID() {
  // Browser environment
  if (typeof crypto !== 'undefined' && crypto.randomUUID) {
    return crypto.randomUUID();
  }

  // Node.js environment or fallback
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
    const r = Math.random() * 16 | 0;
    const v = c === 'x' ? r : (r & 0x3 | 0x8);
    return v.toString(16);
  });
}

/**
 * Migrate a single book to use scene and chapter IDs
 * @param {Object} book - The book object to migrate
 * @returns {Object} The migrated book object
 */
export function migrateBookToIds(book) {
  if (!book) return book;

  // Step 1: Add IDs to all scenes that don't have them
  if (book.scenes && Array.isArray(book.scenes)) {
    book.scenes = book.scenes.map(scene => {
      if (!scene.id) {
        return {
          ...scene,
          id: generateUUID()
        };
      }
      return scene;
    });
  }

  // Step 2: Add IDs to all chapters that don't have them
  if (book.chapters && Array.isArray(book.chapters)) {
    book.chapters = book.chapters.map(chapter => {
      if (!chapter.id) {
        chapter.id = generateUUID();
      }
      return chapter;
    });
  }

  // Step 3: Convert chapter.scenes from indices to IDs
  if (book.chapters && book.scenes) {
    book.chapters = book.chapters.map(chapter => {
      if (chapter.scenes && Array.isArray(chapter.scenes)) {
        // Check if scenes are already IDs (string format) or indices (numbers)
        const firstScene = chapter.scenes[0];
        const alreadyMigrated = typeof firstScene === 'string';

        if (!alreadyMigrated) {
          // Convert indices to IDs
          chapter.scenes = chapter.scenes
            .map(sceneIndex => {
              const scene = book.scenes[sceneIndex];
              return scene ? scene.id : null;
            })
            .filter(id => id !== null); // Remove any invalid references
        }
      }
      return chapter;
    });
  }

  return book;
}

/**
 * Migrate all books in the books array
 * @param {Array} books - Array of book objects
 * @returns {Array} Array of migrated book objects
 */
export function migrateAllBooks(books) {
  if (!books || !Array.isArray(books)) return books;

  return books.map(book => migrateBookToIds(book));
}

/**
 * Check if a book needs migration
 * @param {Object} book - The book to check
 * @returns {boolean} True if migration is needed
 */
export function needsMigration(book) {
  if (!book) return false;

  // Check if any scene is missing an ID
  if (book.scenes && book.scenes.some(scene => !scene.id)) {
    return true;
  }

  // Check if any chapter is missing an ID
  if (book.chapters && book.chapters.some(chapter => !chapter.id)) {
    return true;
  }

  // Check if chapter.scenes contains numbers (indices) instead of strings (IDs)
  if (book.chapters && book.chapters.some(chapter =>
    chapter.scenes && chapter.scenes.length > 0 && typeof chapter.scenes[0] === 'number'
  )) {
    return true;
  }

  return false;
}
