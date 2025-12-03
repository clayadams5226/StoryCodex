/**
 * ItemFactory - Creates item instances with proper structure
 * Centralizes item creation logic and ensures consistency
 */

import { ItemTypes } from './ItemTypes.js';

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

export class ItemFactory {
  /**
   * Create a character
   * @param {string} name - Character name
   * @returns {Object} Character object
   */
  static createCharacter(name) {
    return {
      name,
      nickname: '',
      description: '', // Keeping for backward compatibility
      scene: '',
      type: '',
      relationships: [],
      notes: [],
      tags: [],

      // NEW: Picture
      picture: '', // base64 encoded image string

      // NEW: Basic Details
      age: '',
      occupation: '',
      pronouns: '',
      role: '', // Protagonist, Antagonist, Supporting, Minor
      aliases: '',
      status: '', // Alive, Deceased, Unknown

      // NEW: Physical Description & Background
      physicalDescription: '',
      background: '',

      // NEW: Character Depth
      personalityTraits: '',
      motivations: '',
      fears: '',
      voicePatterns: '',
      internalConflict: '',
      externalConflict: '',

      // NEW: Character Arc
      characterArc: {
        templateType: '', // 'redemption', 'corruption', 'disillusionment', 'comingOfAge', 'quest', 'custom'
        beats: []
      }
    };
  }

  /**
   * Create a location
   * @param {string} name - Location name
   * @returns {Object} Location object
   */
  static createLocation(name) {
    return {
      name,
      description: '',
      importance: '',
      notes: [],
      tags: []
    };
  }

  /**
   * Create a plot point
   * @param {string} title - Plot point title
   * @returns {Object} Plot point object
   */
  static createPlotPoint(title) {
    return {
      title,
      description: '',
      characters: '',
      location: '',
      notes: [],
      tags: []
    };
  }

  /**
   * Create a note
   * @param {string} title - Note title
   * @param {string} content - Note content (optional)
   * @returns {Object} Note object
   */
  static createNote(title, content = '') {
    return {
      id: Date.now(),
      title,
      content,
      createdAt: new Date().toISOString()
    };
  }

  /**
   * Create a chapter
   * @param {string} title - Chapter title
   * @returns {Object} Chapter object
   */
  static createChapter(title) {
    return {
      id: generateUUID(),
      title,
      summary: '',
      scenes: []
    };
  }

  /**
   * Create a scene
   * @param {string} title - Scene title
   * @returns {Object} Scene object
   */
  static createScene(title) {
    return {
      id: generateUUID(),
      title,
      summary: '',
      characters: [],
      locations: [],
      plotPoints: []
    };
  }

  /**
   * Create an arc beat for character development tracking
   * @param {string} name - Beat name (e.g., "The Flaw Established")
   * @param {number} order - Beat order/position in the arc
   * @returns {Object} Arc beat object
   */
  static createArcBeat(name, order = 0) {
    return {
      id: generateUUID(),
      name: name,
      description: '',
      order: order,
      linkedScenes: [],
      linkedChapters: [],
      emotionalState: '',
      yPosition: 50 // 0-100 value for graph positioning (50 = neutral)
    };
  }

  /**
   * Create a book
   * @param {string} name - Book name
   * @returns {Object} Book object
   */
  static createBook(name) {
    return {
      name,
      characters: [],
      locations: [],
      plotPoints: [],
      relationships: [],
      notes: [],
      tags: [],
      wordCount: 0,
      targetWordCount: 0,
      chapters: [],
      scenes: []
    };
  }

  /**
   * Generic factory method using ItemTypes
   * @param {string} itemType - Type from ItemTypes constants
   * @param {string} primaryValue - Primary value (name or title)
   * @param {*} secondaryValue - Optional secondary value (e.g., content for notes)
   * @returns {Object} Created item
   */
  static create(itemType, primaryValue, secondaryValue = null) {
    const creators = {
      [ItemTypes.CHARACTER]: () => this.createCharacter(primaryValue),
      [ItemTypes.LOCATION]: () => this.createLocation(primaryValue),
      [ItemTypes.PLOT_POINT]: () => this.createPlotPoint(primaryValue),
      [ItemTypes.NOTE]: () => this.createNote(primaryValue, secondaryValue),
      [ItemTypes.CHAPTER]: () => this.createChapter(primaryValue),
      [ItemTypes.SCENE]: () => this.createScene(primaryValue)
    };

    const creator = creators[itemType];
    if (!creator) {
      console.error('Unknown item type:', itemType);
      return null;
    }

    return creator();
  }
}
