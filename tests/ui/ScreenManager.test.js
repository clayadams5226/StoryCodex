import { jest } from '@jest/globals';
import { ScreenManager } from '../../src/ui/ScreenManager.js';
import { StateManager } from '../../src/core/StateManager.js';
import { StorageService } from '../../src/core/StorageService.js';

describe('ScreenManager', () => {
  let screenManager;
  let stateManager;

  beforeEach(() => {
    resetChromeStorage();

    // Create DOM elements for screens
    const screens = [
      'bookList', 'bookDetails', 'characterDetails', 'locationDetails',
      'plotPointDetails', 'noteDetails', 'chapterDetails', 'sceneDetails',
      'taggedItems', 'relationshipGraph', 'noteEditor'
    ];

    screens.forEach(screenId => {
      const div = document.createElement('div');
      div.id = screenId;
      div.style.display = 'none';
      document.body.appendChild(div);
    });

    const storageService = new StorageService();
    stateManager = new StateManager(storageService);
    screenManager = new ScreenManager(stateManager);
  });

  describe('showScreen', () => {
    test('should show requested screen and hide others', async () => {
      await screenManager.showScreen('characterDetails');

      expect(document.getElementById('characterDetails').style.display).toBe('block');
      expect(document.getElementById('bookList').style.display).toBe('none');
      expect(document.getElementById('bookDetails').style.display).toBe('none');
    });

    test('should update state with current screen', async () => {
      await screenManager.showScreen('locationDetails');

      const currentScreen = stateManager.getCurrentScreen();
      expect(currentScreen).toBe('locationDetails');
    });

    test('should handle invalid screen ID', async () => {
      const consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation();

      const result = await screenManager.showScreen('invalidScreen');

      expect(result).toBe('bookList'); // Should return current screen
      expect(consoleErrorSpy).toHaveBeenCalledWith('Invalid screen:', 'invalidScreen');

      consoleErrorSpy.mockRestore();
    });
  });

  describe('getCurrentScreen', () => {
    test('should return current screen ID', async () => {
      await screenManager.showScreen('plotPointDetails');

      expect(screenManager.getCurrentScreen()).toBe('plotPointDetails');
    });
  });

  describe('isValidScreen', () => {
    test('should return true for valid screen', () => {
      expect(screenManager.isValidScreen('bookList')).toBe(true);
      expect(screenManager.isValidScreen('characterDetails')).toBe(true);
    });

    test('should return false for invalid screen', () => {
      expect(screenManager.isValidScreen('invalidScreen')).toBe(false);
      expect(screenManager.isValidScreen('')).toBe(false);
    });
  });

  describe('getAllScreens', () => {
    test('should return all valid screen IDs', () => {
      const screens = screenManager.getAllScreens();

      expect(screens).toContain('bookList');
      expect(screens).toContain('characterDetails');
      expect(screens).toContain('noteEditor');
      expect(screens.length).toBe(11);
    });
  });
});
