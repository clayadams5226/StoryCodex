import { describe, test, expect, beforeEach, jest } from '@jest/globals';
import { RelationshipGraph } from '../RelationshipGraph.js';

// Mock vis.js Network and DataSet
class MockDataSet {
  constructor(data = []) {
    this.data = data;
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
    // Simple update implementation
    if (Array.isArray(items)) {
      items.forEach(item => {
        const index = this.data.findIndex(d => d.id === item.id);
        if (index !== -1) {
          this.data[index] = { ...this.data[index], ...item };
        }
      });
    }
  }
}

class MockNetwork {
  constructor(container, data, options) {
    this.container = container;
    this.data = data;
    this.options = options;
    this.eventListeners = {};
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

// Setup vis.js global mock
global.vis = {
  Network: MockNetwork,
  DataSet: MockDataSet
};

describe('RelationshipGraph', () => {
  let graph;
  let mockBook;
  let containerHTML;

  beforeEach(() => {
    // Create the graph container
    containerHTML = `
      <div id="graphContainer"></div>
    `;
    document.body.innerHTML = containerHTML;

    // Create mock book data
    mockBook = {
      name: 'Test Book',
      characters: [
        {
          name: 'Alice',
          description: 'The protagonist',
          tags: ['hero', 'brave'],
          relationships: []
        },
        {
          name: 'Bob',
          description: 'The sidekick',
          tags: ['sidekick', 'funny'],
          relationships: []
        },
        {
          name: 'Carol',
          description: 'The villain',
          tags: ['villain'],
          relationships: []
        }
      ],
      relationships: [
        { character1: 'Alice', character2: 'Bob', type: 'friend' },
        { character1: 'Alice', character2: 'Carol', type: 'enemy' },
        { character1: 'Bob', character2: 'Carol', type: 'colleague' }
      ],
      locations: [],
      plotPoints: [],
      notes: [],
      tags: ['hero', 'villain', 'sidekick', 'brave', 'funny']
    };

    graph = new RelationshipGraph(mockBook);
  });

  describe('constructor', () => {
    test('should initialize with book and container', () => {
      expect(graph.book).toBe(mockBook);
      expect(graph.container).toBe(document.getElementById('graphContainer'));
      expect(graph.network).toBeNull();
      expect(graph.data).toBeNull();
    });

    test('should handle missing container gracefully', () => {
      document.body.innerHTML = '';
      const graphWithoutContainer = new RelationshipGraph(mockBook);

      expect(graphWithoutContainer.container).toBeNull();
    });
  });

  describe('show', () => {
    test('should render graph when container exists', () => {
      graph.show();

      expect(graph.container.innerHTML).not.toBe('');
      expect(graph.data).not.toBeNull();
      expect(graph.network).not.toBeNull();
    });

    test('should create filter controls', () => {
      graph.show();

      const filter = document.getElementById('relationshipFilter');
      expect(filter).not.toBeNull();
      expect(filter.tagName).toBe('SELECT');
    });

    test('should not render if container is null', () => {
      graph.container = null;

      expect(() => graph.show()).not.toThrow();
      expect(graph.data).toBeNull();
      expect(graph.network).toBeNull();
    });

    test('should clear existing content before rendering', () => {
      graph.container.innerHTML = '<div class="existing">Existing content</div>';

      graph.show();

      const existingDiv = graph.container.querySelector('div.existing');
      expect(existingDiv).toBeNull();
    });
  });

  describe('createFilterControls', () => {
    test('should create filter dropdown with all relationship types', () => {
      graph.show();

      const filter = document.getElementById('relationshipFilter');
      const options = Array.from(filter.options).map(opt => opt.value);

      expect(options).toContain('all');
      expect(options).toContain('married');
      expect(options).toContain('family');
      expect(options).toContain('friend');
      expect(options).toContain('enemy');
      expect(options).toContain('colleague');
      expect(options).toContain('lover');
    });

    test('should have "all" as default selection', () => {
      graph.show();

      const filter = document.getElementById('relationshipFilter');
      expect(filter.value).toBe('all');
    });

    test('should trigger filterRelationships on change', () => {
      const filterSpy = jest.spyOn(graph, 'filterRelationships');
      graph.show();

      const filter = document.getElementById('relationshipFilter');
      filter.value = 'friend';
      filter.dispatchEvent(new Event('change'));

      expect(filterSpy).toHaveBeenCalledWith('friend');
    });
  });

  describe('prepareData', () => {
    test('should create nodes from characters', () => {
      const data = graph.prepareData();

      expect(data.nodes).toBeInstanceOf(MockDataSet);
      const nodes = data.nodes.get();
      expect(nodes).toHaveLength(3);
      expect(nodes[0].label).toBe('Alice');
      expect(nodes[1].label).toBe('Bob');
      expect(nodes[2].label).toBe('Carol');
    });

    test('should assign sequential IDs to nodes', () => {
      const data = graph.prepareData();
      const nodes = data.nodes.get();

      expect(nodes[0].id).toBe(0);
      expect(nodes[1].id).toBe(1);
      expect(nodes[2].id).toBe(2);
    });

    test('should include tooltips for nodes', () => {
      const data = graph.prepareData();
      const nodes = data.nodes.get();

      expect(nodes[0].title).toContain('Alice');
      expect(nodes[0].title).toContain('The protagonist');
      expect(nodes[0].title).toContain('hero, brave');
    });

    test('should create edges from relationships', () => {
      const data = graph.prepareData();

      expect(data.edges).toBeInstanceOf(MockDataSet);
      const edges = data.edges.get();
      expect(edges).toHaveLength(3);
    });

    test('should map character names to node indices in edges', () => {
      const data = graph.prepareData();
      const edges = data.edges.get();

      // Alice (0) -> Bob (1), type: friend
      const aliceBobEdge = edges.find(e => e.from === 0 && e.to === 1);
      expect(aliceBobEdge).toBeDefined();
      expect(aliceBobEdge.label).toBe('friend');
    });

    test('should apply correct edge styles based on relationship type', () => {
      const data = graph.prepareData();
      const edges = data.edges.get();

      const friendEdge = edges.find(e => e.label === 'friend');
      expect(friendEdge.color.color).toBe('#0000FF'); // Blue for friend
      expect(friendEdge.dashes).toBe(false);

      const enemyEdge = edges.find(e => e.label === 'enemy');
      expect(enemyEdge.color.color).toBe('#FF00FF'); // Magenta for enemy
      expect(enemyEdge.dashes).toEqual([5, 5]); // Dashed line
    });

    test('should handle empty characters array', () => {
      graph.book.characters = [];
      graph.book.relationships = [];

      const data = graph.prepareData();
      const nodes = data.nodes.get();
      const edges = data.edges.get();

      expect(nodes).toHaveLength(0);
      expect(edges).toHaveLength(0);
    });

    test('should handle characters with no relationships', () => {
      graph.book.relationships = [];

      const data = graph.prepareData();
      const nodes = data.nodes.get();
      const edges = data.edges.get();

      expect(nodes).toHaveLength(3);
      expect(edges).toHaveLength(0);
    });
  });

  describe('getCharacterTooltip', () => {
    test('should format tooltip with character info', () => {
      const character = mockBook.characters[0];
      const tooltip = graph.getCharacterTooltip(character);

      expect(tooltip).toContain('<strong>Alice</strong>');
      expect(tooltip).toContain('The protagonist');
      expect(tooltip).toContain('hero, brave');
    });

    test('should handle character without description', () => {
      const character = { name: 'Dan', tags: ['minor'] };
      const tooltip = graph.getCharacterTooltip(character);

      expect(tooltip).toContain('Dan');
      expect(tooltip).toContain('No description available');
    });

    test('should handle character without tags', () => {
      const character = { name: 'Eve', description: 'A character' };
      const tooltip = graph.getCharacterTooltip(character);

      expect(tooltip).toContain('Eve');
      expect(tooltip).toContain('Tags: None');
    });

    test('should handle character with empty tags array', () => {
      const character = { name: 'Frank', description: 'Test', tags: [] };
      const tooltip = graph.getCharacterTooltip(character);

      expect(tooltip).toContain('Tags: None');
    });
  });

  describe('getEdgeStyle', () => {
    test('should return red solid line for married', () => {
      const style = graph.getEdgeStyle('married');
      expect(style.color).toBe('#FF0000');
      expect(style.dashes).toBe(false);
    });

    test('should return green solid line for family', () => {
      const style = graph.getEdgeStyle('family');
      expect(style.color).toBe('#00FF00');
      expect(style.dashes).toBe(false);
    });

    test('should return blue solid line for friend', () => {
      const style = graph.getEdgeStyle('friend');
      expect(style.color).toBe('#0000FF');
      expect(style.dashes).toBe(false);
    });

    test('should return magenta dashed line for enemy', () => {
      const style = graph.getEdgeStyle('enemy');
      expect(style.color).toBe('#FF00FF');
      expect(style.dashes).toEqual([5, 5]);
    });

    test('should return orange solid line for colleague', () => {
      const style = graph.getEdgeStyle('colleague');
      expect(style.color).toBe('#FFA500');
      expect(style.dashes).toBe(false);
    });

    test('should return red solid line for lover', () => {
      const style = graph.getEdgeStyle('lover');
      expect(style.color).toBe('#FF0000');
      expect(style.dashes).toBe(false);
    });

    test('should return gray solid line for unknown type', () => {
      const style = graph.getEdgeStyle('unknown');
      expect(style.color).toBe('#808080');
      expect(style.dashes).toBe(false);
    });

    test('should handle case-insensitive relationship types', () => {
      const style1 = graph.getEdgeStyle('FRIEND');
      const style2 = graph.getEdgeStyle('Friend');
      const style3 = graph.getEdgeStyle('friend');

      expect(style1.color).toBe(style2.color);
      expect(style2.color).toBe(style3.color);
    });
  });

  describe('getGraphOptions', () => {
    test('should return valid vis.js options object', () => {
      const options = graph.getGraphOptions();

      expect(options.nodes).toBeDefined();
      expect(options.edges).toBeDefined();
      expect(options.physics).toBeDefined();
      expect(options.interaction).toBeDefined();
    });

    test('should configure nodes with circle shape and size 25', () => {
      const options = graph.getGraphOptions();

      expect(options.nodes.shape).toBe('circle');
      expect(options.nodes.size).toBe(25);
      expect(options.nodes.font.size).toBe(14);
    });

    test('should configure edges with arrows and curved style', () => {
      const options = graph.getGraphOptions();

      expect(options.edges.arrows).toBe('to');
      expect(options.edges.smooth.type).toBe('curvedCW');
      expect(options.edges.smooth.roundness).toBe(0.2);
      expect(options.edges.font.size).toBe(12);
      expect(options.edges.font.align).toBe('middle');
    });

    test('should enable physics with specific parameters', () => {
      const options = graph.getGraphOptions();

      expect(options.physics.enabled).toBe(true);
      expect(options.physics.barnesHut).toBeDefined();
      expect(options.physics.barnesHut.gravitationalConstant).toBe(-2000);
      expect(options.physics.barnesHut.centralGravity).toBe(0.3);
      expect(options.physics.barnesHut.springLength).toBe(95);
      expect(options.physics.barnesHut.springConstant).toBe(0.04);
      expect(options.physics.barnesHut.damping).toBe(0.09);
    });

    test('should enable interaction with hover and tooltip delay', () => {
      const options = graph.getGraphOptions();

      expect(options.interaction.hover).toBe(true);
      expect(options.interaction.tooltipDelay).toBe(200);
    });
  });

  describe('addEventListeners', () => {
    test('should add click event listener to network', () => {
      graph.show();

      expect(graph.network.eventListeners.click).toBeDefined();
    });

    test('should call showCharacterDetails on node click', () => {
      const showDetailsSpy = jest.spyOn(graph, 'showCharacterDetails');
      graph.show();

      // Simulate clicking on node 0 (Alice)
      graph.network.trigger('click', { nodes: [0] });

      expect(showDetailsSpy).toHaveBeenCalledWith(mockBook.characters[0]);
    });

    test('should not call showCharacterDetails when clicking empty space', () => {
      const showDetailsSpy = jest.spyOn(graph, 'showCharacterDetails');
      graph.show();

      // Simulate clicking on empty space
      graph.network.trigger('click', { nodes: [] });

      expect(showDetailsSpy).not.toHaveBeenCalled();
    });

    test('should handle click on multiple nodes (should use first)', () => {
      const showDetailsSpy = jest.spyOn(graph, 'showCharacterDetails');
      graph.show();

      // Simulate clicking on multiple nodes
      graph.network.trigger('click', { nodes: [0, 1] });

      expect(showDetailsSpy).toHaveBeenCalledWith(mockBook.characters[0]);
    });
  });

  describe('showCharacterDetails', () => {
    test('should display character details in container', () => {
      graph.show();
      const character = mockBook.characters[0];

      graph.showCharacterDetails(character);

      const detailsDiv = graph.container.querySelector('div:last-child');
      expect(detailsDiv.innerHTML).toContain('Alice');
      expect(detailsDiv.innerHTML).toContain('The protagonist');
      expect(detailsDiv.innerHTML).toContain('hero, brave');
    });

    test('should display close button', () => {
      graph.show();
      const character = mockBook.characters[0];

      graph.showCharacterDetails(character);

      const closeButton = document.getElementById('closeDetails');
      expect(closeButton).not.toBeNull();
      expect(closeButton.textContent).toBe('Close');
    });

    test('should remove details div when close button clicked', () => {
      graph.show();
      const character = mockBook.characters[0];

      graph.showCharacterDetails(character);

      const closeButton = document.getElementById('closeDetails');
      closeButton.click();

      // Details div should be removed
      const newCloseButton = document.getElementById('closeDetails');
      expect(newCloseButton).toBeNull();
    });

    test('should handle character without description', () => {
      graph.show();
      const character = { name: 'Test', tags: [] };

      graph.showCharacterDetails(character);

      const detailsDiv = graph.container.querySelector('div:last-child');
      expect(detailsDiv.innerHTML).toContain('No description available');
    });

    test('should handle character without tags', () => {
      graph.show();
      const character = { name: 'Test', description: 'A test character' };

      graph.showCharacterDetails(character);

      const detailsDiv = graph.container.querySelector('div:last-child');
      expect(detailsDiv.innerHTML).toContain('Tags: None');
    });
  });

  describe('filterRelationships', () => {
    test('should show all relationships when filter is "all"', () => {
      graph.show();
      const initialEdgeCount = graph.data.edges.get().length;

      graph.filterRelationships('all');

      const edges = graph.data.edges.get();
      expect(edges).toHaveLength(initialEdgeCount);
      expect(edges).toHaveLength(3);
    });

    test('should filter to only friend relationships', () => {
      graph.show();

      graph.filterRelationships('friend');

      const edges = graph.data.edges.get();
      expect(edges).toHaveLength(1);
      expect(edges[0].label).toBe('friend');
    });

    test('should filter to only enemy relationships', () => {
      graph.show();

      graph.filterRelationships('enemy');

      const edges = graph.data.edges.get();
      expect(edges).toHaveLength(1);
      expect(edges[0].label).toBe('enemy');
    });

    test('should return empty array when no relationships match filter', () => {
      graph.show();

      graph.filterRelationships('married');

      const edges = graph.data.edges.get();
      expect(edges).toHaveLength(0);
    });

    test('should handle case-insensitive filtering', () => {
      graph.show();

      graph.filterRelationships('FRIEND');

      const edges = graph.data.edges.get();
      expect(edges).toHaveLength(1);
      expect(edges[0].label).toBe('friend');
    });

    test('should restore all relationships after filtering then selecting "all"', () => {
      graph.show();

      // Filter to friends
      graph.filterRelationships('friend');
      expect(graph.data.edges.get()).toHaveLength(1);

      // Restore all
      graph.filterRelationships('all');
      expect(graph.data.edges.get()).toHaveLength(3);
    });
  });

  describe('edge case scenarios', () => {
    test('should handle book with no characters', () => {
      const emptyBook = {
        name: 'Empty Book',
        characters: [],
        relationships: []
      };

      const emptyGraph = new RelationshipGraph(emptyBook);
      document.body.innerHTML = '<div id="graphContainer"></div>';
      emptyGraph.container = document.getElementById('graphContainer');

      expect(() => emptyGraph.show()).not.toThrow();
    });

    test('should handle book with characters but no relationships', () => {
      mockBook.relationships = [];
      graph.show();

      const edges = graph.data.edges.get();
      expect(edges).toHaveLength(0);
    });

    test('should handle relationship with non-existent character', () => {
      mockBook.relationships.push({
        character1: 'Alice',
        character2: 'NonExistent',
        type: 'friend'
      });

      const data = graph.prepareData();
      const edges = data.edges.get();

      // Edge should be created but with -1 index for non-existent character
      const invalidEdge = edges.find(e => e.to === -1 || e.from === -1);
      expect(invalidEdge).toBeDefined();
    });

    test('should handle multiple relationships between same characters', () => {
      mockBook.relationships.push({
        character1: 'Alice',
        character2: 'Bob',
        type: 'colleague'
      });

      const data = graph.prepareData();
      const edges = data.edges.get();

      // Should have 4 edges now (original 3 + 1 new)
      expect(edges).toHaveLength(4);

      // Should have two edges between Alice (0) and Bob (1)
      const aliceBobEdges = edges.filter(e =>
        (e.from === 0 && e.to === 1) || (e.from === 1 && e.to === 0)
      );
      expect(aliceBobEdges).toHaveLength(2);
    });
  });

  describe('integration scenarios', () => {
    test('should handle complete workflow: show -> filter -> click -> close', () => {
      // Show graph
      graph.show();
      expect(graph.network).not.toBeNull();

      // Filter to friends
      const filter = document.getElementById('relationshipFilter');
      filter.value = 'friend';
      filter.dispatchEvent(new Event('change'));
      expect(graph.data.edges.get()).toHaveLength(1);

      // Click on a node
      graph.network.trigger('click', { nodes: [0] });
      let closeButton = document.getElementById('closeDetails');
      expect(closeButton).not.toBeNull();

      // Close details
      closeButton.click();
      closeButton = document.getElementById('closeDetails');
      expect(closeButton).toBeNull();
    });

    test('should handle rapid filter changes', () => {
      graph.show();

      graph.filterRelationships('friend');
      expect(graph.data.edges.get()).toHaveLength(1);

      graph.filterRelationships('enemy');
      expect(graph.data.edges.get()).toHaveLength(1);

      graph.filterRelationships('all');
      expect(graph.data.edges.get()).toHaveLength(3);

      graph.filterRelationships('married');
      expect(graph.data.edges.get()).toHaveLength(0);
    });

    test('should maintain graph state after multiple interactions', () => {
      graph.show();
      const initialNodeCount = graph.data.nodes.get().length;

      // Multiple interactions
      graph.filterRelationships('friend');
      graph.network.trigger('click', { nodes: [0] });
      document.getElementById('closeDetails').click();
      graph.filterRelationships('all');

      // Node count should remain the same
      expect(graph.data.nodes.get()).toHaveLength(initialNodeCount);
    });
  });
});
