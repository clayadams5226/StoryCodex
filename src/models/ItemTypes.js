/**
 * ItemTypes - Constants and metadata for all item types
 * Prevents string-based type errors and centralizes type information
 */

export const ItemTypes = {
  BOOK: 'book',
  CHARACTER: 'character',
  LOCATION: 'location',
  PLOT_POINT: 'plotPoint',
  NOTE: 'note',
  CHAPTER: 'chapter',
  SCENE: 'scene'
};

/**
 * Metadata for each item type
 * - pluralKey: Key used in book object to store items
 * - nameField: Field used as the primary display name
 * - fields: All fields in the item schema
 */
export const ItemMetadata = {
  [ItemTypes.BOOK]: {
    pluralKey: 'books',
    nameField: 'name',
    fields: ['name', 'characters', 'locations', 'plotPoints', 'relationships', 'notes', 'tags', 'wordCount', 'targetWordCount', 'chapters', 'scenes']
  },
  [ItemTypes.CHARACTER]: {
    pluralKey: 'characters',
    nameField: 'name',
    fields: ['name', 'nickname', 'description', 'scene', 'type', 'characterArc']
  },
  [ItemTypes.LOCATION]: {
    pluralKey: 'locations',
    nameField: 'name',
    fields: ['name', 'description', 'importance']
  },
  [ItemTypes.PLOT_POINT]: {
    pluralKey: 'plotPoints',
    nameField: 'title',
    fields: ['title', 'description', 'characters', 'location']
  },
  [ItemTypes.NOTE]: {
    pluralKey: 'notes',
    nameField: 'title',
    fields: ['title', 'content']
  },
  [ItemTypes.CHAPTER]: {
    pluralKey: 'chapters',
    nameField: 'title',
    fields: ['title', 'summary']
  },
  [ItemTypes.SCENE]: {
    pluralKey: 'scenes',
    nameField: 'title',
    fields: ['title', 'summary']
  }
};

/**
 * Get the display name for an item
 * @param {Object} item - Item object
 * @param {string} itemType - Type constant from ItemTypes
 * @returns {string} Display name
 */
export function getItemName(item, itemType) {
  const metadata = ItemMetadata[itemType];
  if (!metadata) {
    console.error('Unknown item type:', itemType);
    return 'Untitled';
  }
  return item[metadata.nameField] || 'Untitled';
}

/**
 * Get the collection name for an item type
 * @param {string} itemType - Type constant from ItemTypes
 * @returns {string} Collection name (e.g., 'characters')
 */
export function getCollectionName(itemType) {
  const metadata = ItemMetadata[itemType];
  if (!metadata) {
    console.error('Unknown item type:', itemType);
    return null;
  }
  return metadata.pluralKey;
}
