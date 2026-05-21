import { Application } from './Application.js';

export function getStoryCodexApp() {
  return window.storyCodex;
}

export async function initializeStoryCodexApp() {
  const app = new Application();
  const initialized = await app.initialize();

  if (initialized) {
    window.storyCodex = app;
    return app;
  }

  return null;
}

export async function waitForStoryCodexApp() {
  while (!getStoryCodexApp()) {
    await new Promise(resolve => setTimeout(resolve, 10));
  }

  return getStoryCodexApp();
}
