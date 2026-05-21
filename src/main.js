import { Application } from './app/Application.js';
import { initializeStoryCodexApp } from './app/storyCodexGlobal.js';

/**
 * Initialize application when DOM is ready
 * Makes the app instance available globally for migration purposes
 */
if (typeof document !== 'undefined') {
  document.addEventListener('DOMContentLoaded', async () => {
    await initializeStoryCodexApp();
  });
}

export { Application };
