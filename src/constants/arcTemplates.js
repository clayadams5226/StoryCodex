/**
 * Character Arc Templates
 * Predefined arc structures to help writers track character development
 */

export const ARC_TEMPLATES = {
  redemption: {
    name: 'Redemption',
    description: 'Character overcomes a flaw or past mistake to become better',
    color: '#10b981', // Green
    defaultBeats: [
      { name: 'The Flaw Established', y: 20 },
      { name: 'Confronted with Consequences', y: 15 },
      { name: 'Glimpse of Another Way', y: 35 },
      { name: 'Resistance / Backslide', y: 10 },
      { name: 'The Choice or Sacrifice', y: 50 },
      { name: 'Transformation', y: 85 }
    ]
  },

  corruption: {
    name: 'Fall / Corruption',
    description: 'Character descends from virtue into darkness',
    color: '#ef4444', // Red
    defaultBeats: [
      { name: 'Virtue Established', y: 85 },
      { name: 'Temptation Introduced', y: 75 },
      { name: 'First Compromise', y: 55 },
      { name: 'Justification', y: 45 },
      { name: 'Point of No Return', y: 25 },
      { name: 'The Fall Complete', y: 10 }
    ]
  },

  disillusionment: {
    name: 'Disillusionment',
    description: 'Character loses faith in something they believed and finds new understanding',
    color: '#8b5cf6', // Purple
    defaultBeats: [
      { name: 'The Belief', y: 80 },
      { name: 'Cracks Appear', y: 70 },
      { name: 'Denial', y: 65 },
      { name: 'Undeniable Truth', y: 30 },
      { name: 'Crisis', y: 15 },
      { name: 'New Worldview', y: 50 }
    ]
  },

  comingOfAge: {
    name: 'Coming of Age',
    description: 'Character matures through challenges and gains wisdom',
    color: '#f59e0b', // Amber
    defaultBeats: [
      { name: 'Innocence', y: 50 },
      { name: 'Call to Growth', y: 45 },
      { name: 'First Trial', y: 30 },
      { name: 'Mentorship / Learning', y: 55 },
      { name: 'The Test', y: 25 },
      { name: 'Maturity Achieved', y: 80 }
    ]
  },

  quest: {
    name: 'The Quest',
    description: 'Character pursues a goal and is transformed by the journey',
    color: '#3b82f6', // Blue
    defaultBeats: [
      { name: 'The Call', y: 50 },
      { name: 'Refusal / Hesitation', y: 40 },
      { name: 'Crossing the Threshold', y: 55 },
      { name: 'Trials and Allies', y: 45 },
      { name: 'The Ordeal', y: 20 },
      { name: 'Reward and Return', y: 85 }
    ]
  },

  custom: {
    name: 'Custom Arc',
    description: 'Build your own arc from scratch',
    color: '#6b7280', // Gray
    defaultBeats: [
      { name: 'Beginning', y: 50 },
      { name: 'Middle', y: 50 },
      { name: 'End', y: 50 }
    ]
  }
};

/**
 * Get all available arc template keys
 * @returns {Array<string>} Array of template keys
 */
export function getArcTemplateKeys() {
  return Object.keys(ARC_TEMPLATES);
}

/**
 * Get a specific arc template by key
 * @param {string} templateKey - The template key (e.g., 'redemption')
 * @returns {Object|null} The template object or null if not found
 */
export function getArcTemplate(templateKey) {
  return ARC_TEMPLATES[templateKey] || null;
}

/**
 * Check if a template key is valid
 * @param {string} templateKey - The template key to validate
 * @returns {boolean} True if template exists
 */
export function isValidTemplateKey(templateKey) {
  return templateKey in ARC_TEMPLATES;
}
