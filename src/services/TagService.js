/**
 * TagService - Tag management for items and books
 * Eliminates duplicated tag management code
 */

import { ItemTypes } from '../models/ItemTypes.js';

export class TagService {
  /**
   * Add a tag to an item
   * @param {Object} item - Item to tag
   * @param {string} tag - Tag to add
   * @returns {boolean} True if tag was added, false if already exists
   */
  addTagToItem(item, tag) {
    if (!item) {
      console.error('Cannot add tag to null item');
      return false;
    }

    if (!tag || tag.trim() === '') {
      console.error('Tag cannot be empty');
      return false;
    }

    if (!item.tags) {
      item.tags = [];
    }

    if (item.tags.includes(tag)) {
      return false; // Tag already exists
    }

    item.tags.push(tag);
    return true;
  }

  /**
   * Remove a tag from an item
   * @param {Object} item - Item to untag
   * @param {string} tag - Tag to remove
   * @returns {boolean} True if tag was removed
   */
  removeTagFromItem(item, tag) {
    if (!item || !item.tags) {
      return false;
    }

    const index = item.tags.indexOf(tag);
    if (index === -1) {
      return false;
    }

    item.tags.splice(index, 1);
    return true;
  }

  /**
   * Add a tag to the book's tag list
   * @param {Object} book - Book object
   * @param {string} tag - Tag to add
   * @returns {boolean} True if tag was added
   */
  addTagToBook(book, tag) {
    if (!book) {
      console.error('Cannot add tag to null book');
      return false;
    }

    if (!tag || tag.trim() === '') {
      console.error('Tag cannot be empty');
      return false;
    }

    if (!book.tags) {
      book.tags = [];
    }

    if (book.tags.includes(tag)) {
      return false; // Tag already exists
    }

    book.tags.push(tag);
    return true;
  }

  /**
   * Remove a tag from the book's tag list
   * @param {Object} book - Book object
   * @param {string} tag - Tag to remove
   * @returns {boolean} True if tag was removed
   */
  removeTagFromBook(book, tag) {
    if (!book || !book.tags) {
      return false;
    }

    const index = book.tags.indexOf(tag);
    if (index === -1) {
      return false;
    }

    book.tags.splice(index, 1);
    return true;
  }

  /**
   * Get all items with a specific tag
   * @param {Object} book - Book object
   * @param {string} tag - Tag to search for
   * @returns {Array} Array of {item, type} objects
   */
  getTaggedItems(book, tag) {
    if (!book || !tag) {
      return [];
    }

    const items = [];
    const itemTypes = [
      { type: ItemTypes.CHARACTER, collection: 'characters' },
      { type: ItemTypes.LOCATION, collection: 'locations' },
      { type: ItemTypes.PLOT_POINT, collection: 'plotPoints' }
    ];

    itemTypes.forEach(({ type, collection }) => {
      if (book[collection]) {
        book[collection].forEach(item => {
          if (item.tags && item.tags.includes(tag)) {
            items.push({ item, type });
          }
        });
      }
    });

    return items;
  }

  /**
   * Get all unique tags from all items in a book
   * @param {Object} book - Book object
   * @returns {Array} Array of unique tag strings
   */
  getAllTags(book) {
    if (!book) {
      return [];
    }

    const tagsSet = new Set();

    // Add book-level tags
    if (book.tags) {
      book.tags.forEach(tag => tagsSet.add(tag));
    }

    // Add item-level tags
    const collections = ['characters', 'locations', 'plotPoints'];
    collections.forEach(collection => {
      if (book[collection]) {
        book[collection].forEach(item => {
          if (item.tags) {
            item.tags.forEach(tag => tagsSet.add(tag));
          }
        });
      }
    });

    return Array.from(tagsSet).sort();
  }

  /**
   * Check if an item has a specific tag
   * @param {Object} item - Item to check
   * @param {string} tag - Tag to look for
   * @returns {boolean} True if item has the tag
   */
  hasTag(item, tag) {
    return Boolean(item && item.tags && item.tags.includes(tag));
  }
}
