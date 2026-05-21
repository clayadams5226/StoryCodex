import { describe, test, expect, beforeEach, jest } from '@jest/globals';
import { RelationshipGraph } from '../RelationshipGraph.js';

class MockDataSet {
  constructor(data = []) {
    this.data = [...data];
  }

  get() {
    return this.data;
  }

  add(items) {
    if (Array.isArray(items)) {
      this.data.push(...items);
    } else {
      this.data.push(items);
    }
  }

  clear() {
    this.data = [];
  }

  update(items) {
    const updates = Array.isArray(items) ? items : [items];

    updates.forEach(item => {
      const index = this.data.findIndex(existing => existing.id === item.id);
      if (index !== -1) {
        this.data[index] = { ...this.data[index], ...item };
      }
    });
  }
}

class MockNetwork {
  constructor(container, data, options) {
    this.container = container;
    this.data = data;
    this.options = options;
    this.eventListeners = {};
    this.fit = jest.fn();
    this.selectNodes = jest.fn();
  }

  on(event, callback) {
    this.eventListeners[event] = callback;
  }

  trigger(event, params) {
    if (this.eventListeners[event]) {
      this.eventListeners[event](params);
    }
  }

  destroy() {
    this.eventListeners = {};
  }
}

global.vis = {
  Network: MockNetwork,
  DataSet: MockDataSet
};

describe('RelationshipGraph', () => {
  let graph;
  let mockBook;

  beforeEach(() => {
    document.body.innerHTML = '<div id="graphContainer"></div>';

    mockBook = {
      name: 'Test Book',
      characters: [
        { name: 'Alice', description: 'The protagonist', type: 'Hero', tags: ['brave'], relationships: [] },
        { name: 'Bob', description: 'The sidekick', type: 'Friend', tags: ['funny'], relationships: [] },
        { name: 'Carol', description: 'The villain', type: 'Rival', tags: ['villain'], relationships: [] },
        { name: 'Dina', description: 'Unconnected observer', type: 'Witness', tags: [], relationships: [] }
      ],
      relationships: [
        { character1: 'Alice', character2: 'Bob', type: 'friend' },
        { character1: 'Alice', character2: 'Carol', type: 'enemy' },
        { character1: 'Bob', character2: 'Carol', type: 'colleague' },
        { character1: 'Alice', character2: 'Dina', type: 'mentor' }
      ]
    };

    graph = new RelationshipGraph(mockBook);
  });

  describe('constructor', () => {
    test('initializes graph state', () => {
      expect(graph.book).toBe(mockBook);
      expect(graph.container).toBe(document.getElementById('graphContainer'));
      expect(graph.network).toBeNull();
      expect(graph.data).toBeNull();
      expect(graph.currentFilter).toBe('all');
      expect(graph.showIsolated).toBe(true);
    });

    test('handles missing container gracefully', () => {
      document.body.innerHTML = '';
      const graphWithoutContainer = new RelationshipGraph(mockBook);

      expect(graphWithoutContainer.container).toBeNull();
      expect(() => graphWithoutContainer.show()).not.toThrow();
    });
  });

  describe('show', () => {
    test('renders focused map structure and vis network', () => {
      graph.show();

      expect(document.getElementById('relationshipSearch')).not.toBeNull();
      expect(document.getElementById('relationshipFilter')).not.toBeNull();
      expect(document.getElementById('showIsolatedCharacters')).not.toBeNull();
      expect(document.getElementById('fitRelationshipMap')).not.toBeNull();
      expect(document.getElementById('relationshipMapStats')).not.toBeNull();
      expect(document.getElementById('relationshipMapLegend')).not.toBeNull();
      expect(document.getElementById('relationshipGraphNetwork')).toBe(graph.network.container);
      expect(graph.network).not.toBeNull();
    });

    test('does not render Add Relationship or edit controls on graph screen', () => {
      graph.show();

      expect(graph.container.textContent).not.toContain('Add Relationship');
      expect(graph.container.textContent).not.toContain('Edit Relationship');
    });

    test('clears existing content before rendering', () => {
      graph.container.innerHTML = '<div class="existing">Existing content</div>';

      graph.show();

      expect(graph.container.querySelector('.existing')).toBeNull();
    });
  });

  describe('filter controls', () => {
    test('creates known defaults plus custom relationship types', () => {
      mockBook.relationships.push({ character1: 'Alice', character2: 'Bob', type: 'Oath Bond' });

      graph.show();

      const options = Array.from(document.getElementById('relationshipFilter').options).map(option => option.value);

      expect(options).toContain('all');
      expect(options).toContain('family');
      expect(options).toContain('friend');
      expect(options).toContain('enemy');
      expect(options).toContain('mentor');
      expect(options).toContain('oath bond');
    });

    test('filters edges by relationship type from dropdown change', () => {
      graph.show();

      const filter = document.getElementById('relationshipFilter');
      filter.value = 'friend';
      filter.dispatchEvent(new Event('change'));

      expect(graph.data.edges.get()).toHaveLength(1);
      expect(graph.data.edges.get()[0].group).toBe('friend');
    });

    test('restores all relationships after filtering', () => {
      graph.show();

      graph.filterRelationships('enemy');
      expect(graph.data.edges.get()).toHaveLength(1);

      graph.filterRelationships('all');
      expect(graph.data.edges.get()).toHaveLength(4);
    });

    test('hides isolated characters when toggle is off', () => {
      mockBook.relationships = [
        { character1: 'Alice', character2: 'Bob', type: 'friend' }
      ];
      graph.show();

      graph.toggleIsolatedCharacters(false);

      const hiddenNames = graph.data.nodes.get()
        .filter(node => node.hidden)
        .map(node => node.characterName);

      expect(hiddenNames).toEqual(expect.arrayContaining(['Carol', 'Dina']));
      expect(hiddenNames).not.toContain('Alice');
    });
  });

  describe('prepareData', () => {
    test('creates styled nodes and edges from book data', () => {
      const data = graph.prepareData();
      const nodes = data.nodes.get();
      const edges = data.edges.get();

      expect(nodes).toHaveLength(4);
      expect(nodes[0]).toMatchObject({
        id: 0,
        label: 'Alice',
        characterName: 'Alice',
        group: 'connected',
        relationshipCount: 3
      });
      expect(nodes[0].color.border).toBe('#10295f');

      expect(edges).toHaveLength(4);
      expect(edges[0]).toMatchObject({
        from: 0,
        to: 1,
        group: 'friend',
        label: 'Friend'
      });
      expect(edges[0].color.color).toBe('#6b8f71');
    });

    test('uses muted red dashed styling for enemy and conflict relationships', () => {
      const data = graph.prepareData();
      const enemyEdge = data.edges.get().find(edge => edge.group === 'enemy');

      expect(enemyEdge.color.color).toBe('#b4443e');
      expect(enemyEdge.dashes).toEqual([8, 6]);
    });

    test('marks characters with no valid relationships as isolated', () => {
      mockBook.relationships = [
        { character1: 'Alice', character2: 'Bob', type: 'friend' }
      ];

      const data = graph.prepareData();
      const dina = data.nodes.get().find(node => node.characterName === 'Dina');

      expect(dina.group).toBe('isolated');
      expect(dina.relationshipCount).toBe(0);
      expect(dina.color.background).toBe('#f8f3df');
    });

    test('skips relationships that reference missing characters', () => {
      mockBook.relationships.push({ character1: 'Alice', character2: 'Missing', type: 'friend' });

      const data = graph.prepareData();
      const edges = data.edges.get();

      expect(edges).toHaveLength(4);
      expect(edges.some(edge => edge.from === -1 || edge.to === -1)).toBe(false);
      expect(graph.invalidRelationships).toHaveLength(1);
    });
  });

  describe('tooltips and styles', () => {
    test('formats tooltip with character role, description, tags, and count', () => {
      const tooltip = graph.getCharacterTooltip(mockBook.characters[0], 3);

      expect(tooltip).toContain('<strong>Alice</strong>');
      expect(tooltip).toContain('Hero | 3 relationships');
      expect(tooltip).toContain('The protagonist');
      expect(tooltip).toContain('Tags: brave');
    });

    test('escapes tooltip HTML from character data', () => {
      const tooltip = graph.getCharacterTooltip({
        name: '<Alice>',
        description: '<script>alert(1)</script>',
        type: 'Hero',
        tags: ['<tag>']
      }, 1);

      expect(tooltip).toContain('&lt;Alice&gt;');
      expect(tooltip).not.toContain('<script>');
    });

    test('returns fallback style for custom relationship type', () => {
      const style = graph.getEdgeStyle('oath bond');

      expect(style.color).toBe('#4d5364');
      expect(style.dashes).toBe(false);
    });
  });

  describe('stats and states', () => {
    test('renders stats for characters, relationships, conflicts, and unconnected characters', () => {
      mockBook.relationships = [
        { character1: 'Alice', character2: 'Bob', type: 'friend' },
        { character1: 'Alice', character2: 'Carol', type: 'enemy' }
      ];

      graph.show();

      const stats = document.getElementById('relationshipMapStats').textContent;
      expect(stats).toContain('4');
      expect(stats).toContain('Characters');
      expect(stats).toContain('2');
      expect(stats).toContain('Relationships');
      expect(stats).toContain('1');
      expect(stats).toContain('Conflict lines');
      expect(stats).toContain('Unconnected');
    });

    test('renders polished empty state when no relationships exist', () => {
      mockBook.relationships = [];

      graph.show();

      const empty = document.getElementById('relationshipMapEmpty');
      expect(empty.hidden).toBe(false);
      expect(empty.textContent).toContain('No relationships yet');
      expect(empty.textContent).toContain('More tab');
    });

    test('renders warning when invalid relationship references are skipped', () => {
      mockBook.relationships = [
        { character1: 'Alice', character2: 'Missing', type: 'friend' }
      ];

      graph.show();

      const warning = document.getElementById('relationshipMapWarning');
      expect(warning.hidden).toBe(false);
      expect(warning.textContent).toContain('missing character');
      expect(graph.data.edges.get()).toHaveLength(0);
    });
  });

  describe('search and highlight behavior', () => {
    test('search highlights matching characters and dims non-matches', () => {
      graph.show();

      const search = document.getElementById('relationshipSearch');
      search.value = 'ali';
      search.dispatchEvent(new Event('input'));

      const alice = graph.data.nodes.get().find(node => node.characterName === 'Alice');
      const bob = graph.data.nodes.get().find(node => node.characterName === 'Bob');

      expect(alice.borderWidth).toBe(4);
      expect(bob.opacity).toBe(0.34);
    });

    test('selecting a character highlights connected edges and nodes', () => {
      graph.show();

      graph.network.trigger('click', { nodes: [0] });

      const alice = graph.data.nodes.get().find(node => node.id === 0);
      const selectedEdges = graph.data.edges.get().filter(edge => edge.width === 4);

      expect(alice.borderWidth).toBe(4);
      expect(selectedEdges).toHaveLength(3);
      expect(graph.network.selectNodes).toHaveBeenCalledWith([0]);
    });

    test('clicking empty graph space clears selected state without clearing search', () => {
      graph.show();

      document.getElementById('relationshipSearch').value = 'ali';
      graph.searchCharacters('ali');
      graph.network.trigger('click', { nodes: [0] });
      graph.network.trigger('click', { nodes: [] });

      expect(graph.selectedNodeId).toBeNull();
      expect(graph.searchTerm).toBe('ali');
      expect(document.getElementById('relationshipSearch').value).toBe('ali');
    });

    test('fit button delegates to vis network fit', () => {
      graph.show();

      document.getElementById('fitRelationshipMap').click();

      expect(graph.network.fit).toHaveBeenCalled();
    });
  });

  describe('edge cases', () => {
    test('handles empty book without throwing', () => {
      const emptyGraph = new RelationshipGraph({ name: 'Empty Book', characters: [], relationships: [] });

      expect(() => emptyGraph.show()).not.toThrow();
      expect(emptyGraph.data.nodes.get()).toHaveLength(0);
      expect(emptyGraph.data.edges.get()).toHaveLength(0);
    });

    test('supports multiple relationships between the same characters', () => {
      mockBook.relationships.push({ character1: 'Alice', character2: 'Bob', type: 'family' });

      const data = graph.prepareData();
      const aliceBobEdges = data.edges.get().filter(edge => edge.from === 0 && edge.to === 1);

      expect(aliceBobEdges).toHaveLength(2);
    });
  });
});
