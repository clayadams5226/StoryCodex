/**
 * ListRenderer - Generic list rendering for items
 * Eliminates duplicated display functions
 */

import { getItemName } from '../models/ItemTypes.js';

export class ListRenderer {
  /**
   * Render a list of items
   * @param {string} containerId - ID of the container element
   * @param {Array} items - Items to render
   * @param {string} itemType - Type from ItemTypes
   * @param {Function} onItemClick - Callback when item is clicked (item, index)
   */
  renderList(containerId, items, itemType, onItemClick) {
    const container = document.getElementById(containerId);
    if (!container) {
      console.error('Container not found:', containerId);
      return;
    }

    container.innerHTML = '';

    if (!items || items.length === 0) {
      return;
    }

    items.forEach((item, index) => {
      const li = document.createElement('li');
      li.textContent = getItemName(item, itemType);
      li.addEventListener('click', () => {
        if (onItemClick) {
          onItemClick(item, index, itemType);
        }
      });
      container.appendChild(li);
    });
  }

  /**
   * Clear a list container
   * @param {string} containerId - ID of the container element
   */
  clearList(containerId) {
    const container = document.getElementById(containerId);
    if (container) {
      container.innerHTML = '';
    }
  }

  /**
   * Get input value from an element
   * @param {string} inputId - ID of the input element
   * @returns {string} Trimmed input value
   */
  getInputValue(inputId) {
    const input = document.getElementById(inputId);
    return input ? input.value.trim() : '';
  }

  /**
   * Set input value
   * @param {string} inputId - ID of the input element
   * @param {string} value - Value to set
   */
  setInputValue(inputId, value) {
    const input = document.getElementById(inputId);
    if (input) {
      input.value = value || '';
    }
  }

  /**
   * Set text content of an element
   * @param {string} elementId - ID of the element
   * @param {string} text - Text to set
   */
  setTextContent(elementId, text) {
    const element = document.getElementById(elementId);
    if (element) {
      element.textContent = text || '';
    }
  }
}
