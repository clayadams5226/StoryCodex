/**
 * ScreenManager - Centralized screen navigation
 * Replaces utils.showScreen() with a class-based approach
 */

export class ScreenManager {
  constructor(stateManager) {
    this.stateManager = stateManager;
    this.screens = [
      'bookList',
      'bookDetails',
      'characterDetails',
      'locationDetails',
      'plotPointDetails',
      'noteDetails',
      'chapterDetails',
      'sceneDetails',
      'taggedItems',
      'relationshipGraph',
      'noteEditor'
    ];
  }

  /**
   * Show a specific screen and hide all others
   * @param {string} screenId - ID of the screen to show
   * @returns {string} The screenId that was shown
   */
  async showScreen(screenId) {
    if (!this.screens.includes(screenId)) {
      console.error('Invalid screen:', screenId);
      return this.stateManager.getCurrentScreen();
    }

    // Hide all screens, show the requested one
    this.screens.forEach(screen => {
      const element = document.getElementById(screen);
      if (element) {
        element.style.display = screen === screenId ? 'block' : 'none';
      }
    });

    // Update state
    await this.stateManager.setCurrentScreen(screenId);

    return screenId;
  }

  /**
   * Get the currently displayed screen
   * @returns {string} Current screen ID
   */
  getCurrentScreen() {
    return this.stateManager.getCurrentScreen();
  }

  /**
   * Check if a screen ID is valid
   * @param {string} screenId - Screen ID to check
   * @returns {boolean} True if valid
   */
  isValidScreen(screenId) {
    return this.screens.includes(screenId);
  }

  /**
   * Get all valid screen IDs
   * @returns {Array<string>} Array of screen IDs
   */
  getAllScreens() {
    return [...this.screens];
  }
}
