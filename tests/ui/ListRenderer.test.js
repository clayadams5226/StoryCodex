import { jest } from '@jest/globals';
import { ListRenderer } from '../../src/ui/ListRenderer.js';
import { ItemTypes } from '../../src/models/ItemTypes.js';
import { ItemFactory } from '../../src/models/ItemFactory.js';

describe('ListRenderer', () => {
  let listRenderer;

  beforeEach(() => {
    listRenderer = new ListRenderer();
  });

  describe('renderList', () => {
    test('should render list of characters', () => {
      const container = document.createElement('ul');
      container.id = 'characters';
      document.body.appendChild(container);

      const characters = [
        ItemFactory.createCharacter('Alice'),
        ItemFactory.createCharacter('Bob')
      ];

      const onItemClick = jest.fn();
      listRenderer.renderList('characters', characters, ItemTypes.CHARACTER, onItemClick);

      const items = container.querySelectorAll('li');
      expect(items.length).toBe(2);
      expect(items[0].textContent).toBe('Alice');
      expect(items[1].textContent).toBe('Bob');
    });

    test('should call onClick when item is clicked', () => {
      const container = document.createElement('ul');
      container.id = 'locations';
      document.body.appendChild(container);

      const locations = [ItemFactory.createLocation('Castle')];
      const onItemClick = jest.fn();

      listRenderer.renderList('locations', locations, ItemTypes.LOCATION, onItemClick);

      const item = container.querySelector('li');
      item.click();

      expect(onItemClick).toHaveBeenCalledWith(locations[0], 0, ItemTypes.LOCATION);
    });

    test('should handle empty list', () => {
      const container = document.createElement('ul');
      container.id = 'empty';
      document.body.appendChild(container);

      listRenderer.renderList('empty', [], ItemTypes.CHARACTER, jest.fn());

      expect(container.innerHTML).toBe('');
    });

    test('should handle missing container', () => {
      const consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation();

      listRenderer.renderList('nonexistent', [], ItemTypes.CHARACTER, jest.fn());

      expect(consoleErrorSpy).toHaveBeenCalledWith('Container not found:', 'nonexistent');

      consoleErrorSpy.mockRestore();
    });
  });

  describe('clearList', () => {
    test('should clear list container', () => {
      const container = document.createElement('ul');
      container.id = 'test';
      container.innerHTML = '<li>Item 1</li><li>Item 2</li>';
      document.body.appendChild(container);

      listRenderer.clearList('test');

      expect(container.innerHTML).toBe('');
    });
  });

  describe('getInputValue', () => {
    test('should get trimmed input value', () => {
      const input = document.createElement('input');
      input.id = 'testInput';
      input.value = '  test value  ';
      document.body.appendChild(input);

      const value = listRenderer.getInputValue('testInput');

      expect(value).toBe('test value');
    });

    test('should return empty string for missing input', () => {
      const value = listRenderer.getInputValue('nonexistent');

      expect(value).toBe('');
    });
  });

  describe('setInputValue', () => {
    test('should set input value', () => {
      const input = document.createElement('input');
      input.id = 'testInput';
      document.body.appendChild(input);

      listRenderer.setInputValue('testInput', 'new value');

      expect(input.value).toBe('new value');
    });

    test('should handle null value', () => {
      const input = document.createElement('input');
      input.id = 'testInput';
      input.value = 'old value';
      document.body.appendChild(input);

      listRenderer.setInputValue('testInput', null);

      expect(input.value).toBe('');
    });
  });

  describe('setTextContent', () => {
    test('should set text content', () => {
      const div = document.createElement('div');
      div.id = 'testDiv';
      document.body.appendChild(div);

      listRenderer.setTextContent('testDiv', 'test text');

      expect(div.textContent).toBe('test text');
    });
  });
});
