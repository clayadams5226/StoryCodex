/**
 * idHelpers - Utility functions for working with scene and chapter IDs
 * Provides helper functions to find items by ID instead of array index
 */

/**
 * Find a scene by its ID
 * @param {Object} book - The book object
 * @param {string} sceneId - The scene ID to find
 * @returns {Object|null} The scene object or null if not found
 */
export function findSceneById(book, sceneId) {
  if (!book || !book.scenes) return null;
  return book.scenes.find(scene => scene.id === sceneId) || null;
}

/**
 * Find a chapter by its ID
 * @param {Object} book - The book object
 * @param {string} chapterId - The chapter ID to find
 * @returns {Object|null} The chapter object or null if not found
 */
export function findChapterById(book, chapterId) {
  if (!book || !book.chapters) return null;
  return book.chapters.find(chapter => chapter.id === chapterId) || null;
}

/**
 * Find which chapter contains a specific scene
 * @param {Object} book - The book object
 * @param {string} sceneId - The scene ID to find
 * @returns {Object|null} The chapter object or null if not found
 */
export function findChapterBySceneId(book, sceneId) {
  if (!book || !book.chapters) return null;
  return book.chapters.find(chapter =>
    chapter.scenes && chapter.scenes.includes(sceneId)
  ) || null;
}

/**
 * Get the index of a scene in a chapter's scene array
 * @param {Object} chapter - The chapter object
 * @param {string} sceneId - The scene ID
 * @returns {number} The index of the scene, or -1 if not found
 */
export function getSceneIndexInChapter(chapter, sceneId) {
  if (!chapter || !chapter.scenes) return -1;
  return chapter.scenes.indexOf(sceneId);
}

/**
 * Add a scene ID to a chapter
 * @param {Object} chapter - The chapter object
 * @param {string} sceneId - The scene ID to add
 */
export function addSceneToChapter(chapter, sceneId) {
  if (!chapter.scenes) {
    chapter.scenes = [];
  }
  if (!chapter.scenes.includes(sceneId)) {
    chapter.scenes.push(sceneId);
  }
}

/**
 * Remove a scene ID from a chapter
 * @param {Object} chapter - The chapter object
 * @param {string} sceneId - The scene ID to remove
 * @returns {boolean} True if the scene was removed, false otherwise
 */
export function removeSceneFromChapter(chapter, sceneId) {
  if (!chapter || !chapter.scenes) return false;
  const index = chapter.scenes.indexOf(sceneId);
  if (index !== -1) {
    chapter.scenes.splice(index, 1);
    return true;
  }
  return false;
}

/**
 * Move a scene from one chapter to another
 * @param {Object} fromChapter - The source chapter
 * @param {Object} toChapter - The destination chapter
 * @param {string} sceneId - The scene ID to move
 * @returns {boolean} True if the scene was moved successfully
 */
export function moveSceneBetweenChapters(fromChapter, toChapter, sceneId) {
  if (!fromChapter || !toChapter) return false;

  const removed = removeSceneFromChapter(fromChapter, sceneId);
  if (removed) {
    addSceneToChapter(toChapter, sceneId);
    return true;
  }
  return false;
}

/**
 * Reorder a scene within a chapter
 * @param {Object} chapter - The chapter object
 * @param {string} sceneId - The scene ID to move
 * @param {number} newPosition - The new position index
 * @returns {boolean} True if reordered successfully
 */
export function reorderSceneInChapter(chapter, sceneId, newPosition) {
  if (!chapter || !chapter.scenes) return false;

  const currentPosition = chapter.scenes.indexOf(sceneId);
  if (currentPosition === -1 || currentPosition === newPosition) {
    return false;
  }

  // Remove from current position
  chapter.scenes.splice(currentPosition, 1);
  // Insert at new position
  chapter.scenes.splice(newPosition, 0, sceneId);

  return true;
}
