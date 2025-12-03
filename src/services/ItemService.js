/**
 * ItemService - Generic CRUD operations for all item types
 * Eliminates duplicated add/update/delete functions
 */

import { ItemFactory } from '../models/ItemFactory.js';
import { getCollectionName } from '../models/ItemTypes.js';

export class ItemService {
  constructor(stateManager) {
    this.stateManager = stateManager;
  }

  /**
   * Add a new item to a book
   * @param {Object} book - Book object
   * @param {string} itemType - Type from ItemTypes
   * @param {string} primaryValue - Primary value (name or title)
   * @param {*} secondaryValue - Optional secondary value
   * @returns {Object} Created item
   */
  addItem(book, itemType, primaryValue, secondaryValue = null) {
    const item = ItemFactory.create(itemType, primaryValue, secondaryValue);
    if (!item) {
      console.error('Failed to create item of type:', itemType);
      return null;
    }

    const collectionName = getCollectionName(itemType);
    if (!collectionName) {
      console.error('Unknown item type:', itemType);
      return null;
    }

    // Ensure collection exists
    if (!book[collectionName]) {
      book[collectionName] = [];
    }

    book[collectionName].push(item);
    return item;
  }

  /**
   * Update an item's properties
   * @param {Object} item - Item to update
   * @param {Object} updates - Properties to update
   * @returns {Object} Updated item
   */
  updateItem(item, updates) {
    if (!item) {
      console.error('Cannot update null item');
      return null;
    }

    Object.assign(item, updates);
    return item;
  }

  /**
   * Delete an item from a book
   * @param {Object} book - Book object
   * @param {string} itemType - Type from ItemTypes
   * @param {Object} item - Item to delete
   * @returns {boolean} Success status
   */
  deleteItem(book, itemType, item) {
    const collectionName = getCollectionName(itemType);
    if (!collectionName) {
      console.error('Unknown item type:', itemType);
      return false;
    }

    const collection = book[collectionName];
    if (!collection) {
      console.error('Collection not found:', collectionName);
      return false;
    }

    const index = collection.indexOf(item);
    if (index !== -1) {
      collection.splice(index, 1);
      return true;
    }

    return false;
  }

  /**
   * Get all items of a specific type from a book
   * @param {Object} book - Book object
   * @param {string} itemType - Type from ItemTypes
   * @returns {Array} Array of items
   */
  getItems(book, itemType) {
    const collectionName = getCollectionName(itemType);
    if (!collectionName) {
      console.error('Unknown item type:', itemType);
      return [];
    }

    return book[collectionName] || [];
  }

  /**
   * Find an item by a field value
   * @param {Object} book - Book object
   * @param {string} itemType - Type from ItemTypes
   * @param {string} fieldName - Field to search
   * @param {*} value - Value to match
   * @returns {Object|null} Found item or null
   */
  findItem(book, itemType, fieldName, value) {
    const items = this.getItems(book, itemType);
    return items.find(item => item[fieldName] === value) || null;
  }

  /**
   * Get the index of an item in its collection
   * @param {Object} book - Book object
   * @param {string} itemType - Type from ItemTypes
   * @param {Object} item - Item to find
   * @returns {number} Index or -1 if not found
   */
  getItemIndex(book, itemType, item) {
    const items = this.getItems(book, itemType);
    return items.indexOf(item);
  }
}
