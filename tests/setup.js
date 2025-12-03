import { jest } from '@jest/globals';
import { TextEncoder, TextDecoder } from 'util';

// Polyfill TextEncoder/TextDecoder for jsdom
global.TextEncoder = TextEncoder;
global.TextDecoder = TextDecoder;

// Mock Chrome APIs
let localStorageData = {}; // For books (large data)
let syncStorageData = {};  // For state (lightweight)
let currentState = null;

// Helper to create storage mock (same logic for both local and sync)
const createStorageMock = (storageData) => ({
  get: (keys, callback) => {
    if (typeof keys === 'function') {
      callback = keys;
      keys = null;
    }

    if (!keys) {
      callback(storageData);
    } else if (Array.isArray(keys)) {
      const result = {};
      keys.forEach(key => {
        if (storageData.hasOwnProperty(key)) {
          result[key] = storageData[key];
        }
      });
      callback(result);
    } else {
      // Single key or object with defaults
      const result = {};
      const keysArray = typeof keys === 'string' ? [keys] : Object.keys(keys);
      keysArray.forEach(key => {
        result[key] = storageData.hasOwnProperty(key)
          ? storageData[key]
          : (typeof keys === 'object' ? keys[key] : undefined);
      });
      callback(result);
    }
  },
  set: (items, callback) => {
    Object.assign(storageData, items);
    if (callback) callback();
  },
  remove: (keys, callback) => {
    const keysArray = Array.isArray(keys) ? keys : [keys];
    keysArray.forEach(key => delete storageData[key]);
    if (callback) callback();
  },
  clear: (callback) => {
    Object.keys(storageData).forEach(key => delete storageData[key]);
    if (callback) callback();
  }
});

global.chrome = {
  storage: {
    local: createStorageMock(localStorageData),
    sync: createStorageMock(syncStorageData)
  },
  runtime: {
    lastError: null
  }
};

// Helper to reset storage between tests
global.resetChromeStorage = () => {
  Object.keys(localStorageData).forEach(key => delete localStorageData[key]);
  Object.keys(syncStorageData).forEach(key => delete syncStorageData[key]);
  chrome.runtime.lastError = null;
};

// Helper to get current storage state (returns local storage for backward compatibility)
global.getChromeStorage = () => localStorageData;

// Helper to get sync storage state
global.getSyncStorage = () => syncStorageData;

// Helper to set storage state (sets local storage for backward compatibility)
global.setChromeStorage = (data) => {
  Object.keys(localStorageData).forEach(key => delete localStorageData[key]);
  Object.assign(localStorageData, data);
};

// Helper to set sync storage state
global.setSyncStorage = (data) => {
  Object.keys(syncStorageData).forEach(key => delete syncStorageData[key]);
  Object.assign(syncStorageData, data);
};

// Mock File and FileReader for import/export tests
global.File = class MockFile {
  constructor(parts, filename, options) {
    this.parts = parts;
    this.name = filename;
    this.type = options?.type || '';
  }
};

global.FileReader = class MockFileReader {
  readAsText(file) {
    setTimeout(() => {
      this.result = file.parts[0];
      if (this.onload) this.onload({ target: this });
    }, 0);
  }
};

// Mock Blob
global.Blob = class MockBlob {
  constructor(parts, options) {
    this.parts = parts;
    this.type = options?.type || '';
  }
};

// Mock URL.createObjectURL
global.URL.createObjectURL = jest.fn(() => 'blob:mock-url');
global.URL.revokeObjectURL = jest.fn();

// Mock document.execCommand (not available in jsdom)
document.execCommand = jest.fn(() => true);

// Mock window.scrollTo (not implemented in jsdom)
window.scrollTo = jest.fn();

// Reset mocks before each test
beforeEach(() => {
  global.resetChromeStorage();
  document.body.innerHTML = '';
  document.execCommand.mockClear();
  window.scrollTo.mockClear();
});
