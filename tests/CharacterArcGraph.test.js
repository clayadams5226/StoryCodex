import { describe, test, expect, beforeEach, jest } from '@jest/globals';
import { CharacterArcGraph } from '../CharacterArcGraph.js';

// Mock vis.js Network and DataSet
class MockDataSet {
  constructor(data = []) {
    this.data = data;
  }

  get(id) {
    if (id !== undefined) {
      return this.data.find(item => item.id === id);
    }
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
    if (Array.isArray(items)) {
      items.forEach(item => {
        const index = this.data.findIndex(d => d.id === item.id);
        if (index !== -1) {
          this.data[index] = { ...this.data[index], ...item };
        }
      });
    } else {
      const index = this.data.findIndex(d => d.id === items.id);
      if (index !== -1) {
        this.data[index] = { ...this.data[index], ...items };
      }
    }
  }
}

class MockNetwork {
  constructor(container, data, options) {
    this.container = container;
    this.data = data;
    this.options = options;
    this.eventListeners = {};
    this.selectedNodes = [];
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

  fit(options) {
    this.fitOptions = options;
  }

  getPositions(nodeIds) {
    const positions = {};
    nodeIds.forEach(id => {
      const node = this.data.nodes.get(id);
      if (node) {
        positions[id] = { x: node.x, y: node.y };
      }
    });
    return positions;
  }

  selectNodes(nodeIds) {
    this.selectedNodes = nodeIds;
  }

  unselectAll() {
    this.selectedNodes = [];
  }
}

// Setup vis.js global mock
global.vis = {
  Network: MockNetwork,
  DataSet: MockDataSet
};

describe('CharacterArcGraph', () => {
  let graph;
  let mockCharacter;
  let mockArcTemplates;
  let containerHTML;

  beforeEach(() => {
    // Create the graph container
    containerHTML = `
      <div id="arcGraphNetwork"></div>
    `;
    document.body.innerHTML = containerHTML;

    // Create mock arc templates
    mockArcTemplates = {
      redemption: {
        name: 'Redemption',
        description: 'Character overcomes a flaw',
        color: '#10b981'
      },
      corruption: {
        name: 'Fall / Corruption',
        description: 'Character descends into darkness',
        color: '#ef4444'
      },
      custom: {
        name: 'Custom Arc',
        description: 'Build your own arc',
        color: '#6b7280'
      }
    };

    // Create mock character with arc data
    mockCharacter = {
      name: 'Alice',
      description: 'The protagonist',
      characterArc: {
        templateType: 'redemption',
        beats: [
          {
            id: 'beat-1',
            name: 'The Flaw Established',
            yPosition: 20,
            linkedScenes: [],
            linkedChapters: []
          },
          {
            id: 'beat-2',
            name: 'Glimpse of Another Way',
            yPosition: 35,
            linkedScenes: ['scene-1'],
            linkedChapters: []
          },
          {
            id: 'beat-3',
            name: 'Transformation',
            yPosition: 85,
            linkedScenes: ['scene-2'],
            linkedChapters: ['chapter-1']
          }
        ]
      }
    };

    graph = new CharacterArcGraph(mockCharacter, mockArcTemplates);
  });

  describe('constructor', () => {
    test('should initialize with character and templates', () => {
      expect(graph.character).toBe(mockCharacter);
      expect(graph.arcTemplates).toBe(mockArcTemplates);
      expect(graph.container).toBe(document.getElementById('arcGraphNetwork'));
      expect(graph.network).toBeNull();
      expect(graph.data).toBeNull();
    });

    test('should initialize callbacks as null', () => {
      expect(graph.onBeatClickCallback).toBeNull();
      expect(graph.onBeatDragCallback).toBeNull();
    });

    test('should handle missing container gracefully', () => {
      document.body.innerHTML = '';
      const graphWithoutContainer = new CharacterArcGraph(mockCharacter, mockArcTemplates);

      expect(graphWithoutContainer.container).toBeNull();
    });
  });

  describe('show', () => {
    test('should render graph when character has beats', () => {
      graph.show();

      expect(graph.data).not.toBeNull();
      expect(graph.network).not.toBeNull();
    });

    test('should not render if container is null', () => {
      const consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation(() => {});
      graph.container = null;

      graph.show();

      expect(consoleErrorSpy).toHaveBeenCalledWith('Graph container not found!');
      expect(graph.data).toBeNull();
      expect(graph.network).toBeNull();

      consoleErrorSpy.mockRestore();
    });

    test('should show empty message if character is null', () => {
      graph.character = null;

      graph.show();

      expect(graph.container.innerHTML).toContain('No character or character arc');
      expect(graph.container.innerHTML).toContain('#6b7280');
    });

    test('should show empty message if character has no arc', () => {
      graph.character = { name: 'Bob' };

      graph.show();

      expect(graph.container.innerHTML).toContain('No character or character arc');
    });

    test('should show empty message if beats array is empty', () => {
      graph.character.characterArc.beats = [];

      graph.show();

      expect(graph.container.innerHTML).toContain('No beats to display');
      expect(graph.container.innerHTML).toContain('Add beats in List View first');
    });

    test('should destroy existing network before creating new one', () => {
      graph.show();
      const firstNetwork = graph.network;
      const destroySpy = jest.spyOn(firstNetwork, 'destroy');

      graph.show();

      expect(destroySpy).toHaveBeenCalled();
    });

    test('should call fitToView after rendering', () => {
      const fitSpy = jest.spyOn(graph, 'fitToView');

      graph.show();

      expect(fitSpy).toHaveBeenCalled();
    });
  });

  describe('showEmptyMessage', () => {
    test('should display custom empty message', () => {
      graph.showEmptyMessage('Test empty message');

      expect(graph.container.innerHTML).toContain('Test empty message');
      expect(graph.container.innerHTML).toContain('#6b7280');
    });

    test('should handle null container gracefully', () => {
      graph.container = null;

      expect(() => graph.showEmptyMessage('Test')).not.toThrow();
    });
  });

  describe('showErrorMessage', () => {
    test('should display custom error message', () => {
      graph.showErrorMessage('Test error message');

      expect(graph.container.innerHTML).toContain('Test error message');
      expect(graph.container.innerHTML).toContain('#ef4444');
    });

    test('should handle null container gracefully', () => {
      graph.container = null;

      expect(() => graph.showErrorMessage('Test')).not.toThrow();
    });
  });

  describe('prepareData', () => {
    test('should create nodes from beats', () => {
      const beats = mockCharacter.characterArc.beats;
      const data = graph.prepareData(beats);

      expect(data.nodes).toBeInstanceOf(MockDataSet);
      const nodes = data.nodes.get();
      expect(nodes).toHaveLength(3);
      expect(nodes[0].id).toBe('beat-1');
      expect(nodes[1].id).toBe('beat-2');
      expect(nodes[2].id).toBe('beat-3');
    });

    test('should set node labels from beat names', () => {
      const beats = mockCharacter.characterArc.beats;
      const data = graph.prepareData(beats);
      const nodes = data.nodes.get();

      expect(nodes[0].label).toBe('The Flaw Established');
      expect(nodes[1].label).toBe('Glimpse of Another Way');
      expect(nodes[2].label).toBe('Transformation');
    });

    test('should position nodes horizontally based on index', () => {
      const beats = mockCharacter.characterArc.beats;
      const data = graph.prepareData(beats);
      const nodes = data.nodes.get();

      expect(nodes[0].x).toBe(0);
      expect(nodes[1].x).toBe(200);
      expect(nodes[2].x).toBe(400);
    });

    test('should position nodes vertically based on yPosition', () => {
      const beats = mockCharacter.characterArc.beats;
      const data = graph.prepareData(beats);
      const nodes = data.nodes.get();

      // yPosition 20 -> y = -(20*10) = -200
      expect(nodes[0].y).toBe(-200);
      // yPosition 35 -> y = -(35*10) = -350
      expect(nodes[1].y).toBe(-350);
      // yPosition 85 -> y = -(85*10) = -850
      expect(nodes[2].y).toBe(-850);
    });

    test('should make nodes with linked content larger', () => {
      const beats = mockCharacter.characterArc.beats;
      const data = graph.prepareData(beats);
      const nodes = data.nodes.get();

      expect(nodes[0].size).toBe(40); // No linked content
      expect(nodes[1].size).toBe(50); // Has linked scene
      expect(nodes[2].size).toBe(50); // Has linked scene and chapter
    });

    test('should color nodes with linked content using arc color', () => {
      const beats = mockCharacter.characterArc.beats;
      const data = graph.prepareData(beats);
      const nodes = data.nodes.get();
      const arcColor = '#10b981';

      expect(nodes[0].color.background).toBe('#1f2937'); // No linked content
      expect(nodes[1].color.background).toBe(arcColor); // Has linked content
      expect(nodes[2].color.background).toBe(arcColor); // Has linked content
    });

    test('should include tooltip with beat info', () => {
      const beats = mockCharacter.characterArc.beats;
      const data = graph.prepareData(beats);
      const nodes = data.nodes.get();

      expect(nodes[0].title).toContain('The Flaw Established');
      expect(nodes[0].title).toContain('Linked: 0');
      expect(nodes[0].title).toContain('Emotional State: 20/100');

      expect(nodes[2].title).toContain('Transformation');
      expect(nodes[2].title).toContain('Linked: 2');
      expect(nodes[2].title).toContain('Emotional State: 85/100');
    });

    test('should fix x position and allow y dragging', () => {
      const beats = mockCharacter.characterArc.beats;
      const data = graph.prepareData(beats);
      const nodes = data.nodes.get();

      nodes.forEach(node => {
        expect(node.fixed.x).toBe(true);
        expect(node.fixed.y).toBe(false);
      });
    });

    test('should create edges connecting sequential beats', () => {
      const beats = mockCharacter.characterArc.beats;
      const data = graph.prepareData(beats);
      const edges = data.edges.get();

      expect(edges).toHaveLength(2);
      expect(edges[0].from).toBe('beat-1');
      expect(edges[0].to).toBe('beat-2');
      expect(edges[1].from).toBe('beat-2');
      expect(edges[1].to).toBe('beat-3');
    });

    test('should style edges with arc color', () => {
      const beats = mockCharacter.characterArc.beats;
      const data = graph.prepareData(beats);
      const edges = data.edges.get();
      const arcColor = '#10b981';

      edges.forEach(edge => {
        expect(edge.color.color).toBe(arcColor);
        expect(edge.color.opacity).toBe(0.7);
      });
    });

    test('should configure edges with curved smooth style', () => {
      const beats = mockCharacter.characterArc.beats;
      const data = graph.prepareData(beats);
      const edges = data.edges.get();

      edges.forEach(edge => {
        expect(edge.smooth.enabled).toBe(true);
        expect(edge.smooth.type).toBe('curvedCW');
        expect(edge.smooth.roundness).toBe(0.2);
      });
    });

    test('should not create edges for single beat', () => {
      const singleBeat = [mockCharacter.characterArc.beats[0]];
      const data = graph.prepareData(singleBeat);
      const edges = data.edges.get();

      expect(edges).toHaveLength(0);
    });
  });

  describe('getArcColor', () => {
    test('should return color from template', () => {
      expect(graph.getArcColor()).toBe('#10b981');
    });

    test('should return default color for unknown template', () => {
      graph.character.characterArc.templateType = 'unknown';

      expect(graph.getArcColor()).toBe('#6b7280');
    });

    test('should return default color if no template type', () => {
      graph.character.characterArc.templateType = null;

      expect(graph.getArcColor()).toBe('#6b7280');
    });

    test('should work with different templates', () => {
      graph.character.characterArc.templateType = 'corruption';

      expect(graph.getArcColor()).toBe('#ef4444');

      graph.character.characterArc.templateType = 'custom';

      expect(graph.getArcColor()).toBe('#6b7280');
    });
  });

  describe('getGraphOptions', () => {
    test('should return valid vis.js options object', () => {
      const options = graph.getGraphOptions();

      expect(options.nodes).toBeDefined();
      expect(options.edges).toBeDefined();
      expect(options.physics).toBeDefined();
      expect(options.interaction).toBeDefined();
      expect(options.manipulation).toBeDefined();
    });

    test('should configure node font', () => {
      const options = graph.getGraphOptions();

      expect(options.nodes.font.color).toBe('#e5e7eb');
      expect(options.nodes.font.size).toBe(13);
      expect(options.nodes.font.face).toContain('Inter');
    });

    test('should configure edges with cubic bezier smoothing', () => {
      const options = graph.getGraphOptions();

      expect(options.edges.smooth.enabled).toBe(true);
      expect(options.edges.smooth.type).toBe('cubicBezier');
      expect(options.edges.smooth.forceDirection).toBe('horizontal');
      expect(options.edges.smooth.roundness).toBe(0.5);
    });

    test('should disable physics', () => {
      const options = graph.getGraphOptions();

      expect(options.physics.enabled).toBe(false);
    });

    test('should enable interaction features', () => {
      const options = graph.getGraphOptions();

      expect(options.interaction.dragNodes).toBe(true);
      expect(options.interaction.dragView).toBe(true);
      expect(options.interaction.zoomView).toBe(true);
      expect(options.interaction.hover).toBe(true);
    });

    test('should disable manipulation', () => {
      const options = graph.getGraphOptions();

      expect(options.manipulation.enabled).toBe(false);
    });
  });

  describe('addEventListeners', () => {
    test('should add click event listener', () => {
      const beats = mockCharacter.characterArc.beats;
      graph.show();

      expect(graph.network.eventListeners.click).toBeDefined();
    });

    test('should call onBeatClick callback when node clicked', () => {
      const clickCallback = jest.fn();
      graph.onBeatClick(clickCallback);
      graph.show();

      const beats = mockCharacter.characterArc.beats;
      graph.network.trigger('click', { nodes: ['beat-1'] });

      expect(clickCallback).toHaveBeenCalledWith(beats[0]);
    });

    test('should not call callback when clicking empty space', () => {
      const clickCallback = jest.fn();
      graph.onBeatClick(clickCallback);
      graph.show();

      graph.network.trigger('click', { nodes: [] });

      expect(clickCallback).not.toHaveBeenCalled();
    });

    test('should add dragEnd event listener', () => {
      graph.show();

      expect(graph.network.eventListeners.dragEnd).toBeDefined();
    });

    test('should update beat yPosition on drag', () => {
      const dragCallback = jest.fn();
      graph.onBeatDrag(dragCallback);
      graph.show();

      const beats = mockCharacter.characterArc.beats;
      // Simulate dragging beat-1 to y=-300
      graph.data.nodes.update({ id: 'beat-1', y: -300 });

      graph.network.trigger('dragEnd', { nodes: ['beat-1'] });

      // y=-300 -> yPosition = -(-300/10) = 30
      expect(beats[0].yPosition).toBe(30);
      expect(dragCallback).toHaveBeenCalledWith(beats[0], 30);
    });

    test('should clamp yPosition between 0 and 100 on drag', () => {
      graph.show();

      const beats = mockCharacter.characterArc.beats;

      // Drag to y=-1100 (would be > 100)
      graph.data.nodes.update({ id: 'beat-1', y: -1100 });
      graph.network.trigger('dragEnd', { nodes: ['beat-1'] });
      expect(beats[0].yPosition).toBe(100);

      // Drag to y=100 (would be < 0)
      graph.data.nodes.update({ id: 'beat-1', y: 100 });
      graph.network.trigger('dragEnd', { nodes: ['beat-1'] });
      expect(beats[0].yPosition).toBe(0);
    });

    test('should round yPosition to integer on drag', () => {
      graph.show();

      const beats = mockCharacter.characterArc.beats;

      // Drag to y=-495 -> yPosition = -(-495/10) = 49.5 -> 50
      graph.data.nodes.update({ id: 'beat-1', y: -495 });
      graph.network.trigger('dragEnd', { nodes: ['beat-1'] });

      expect(beats[0].yPosition).toBe(50);
    });
  });

  describe('fitToView', () => {
    test('should call network.fit with animation options', async () => {
      graph.show();

      // Wait for setTimeout to complete
      await new Promise(resolve => setTimeout(resolve, 150));

      expect(graph.network.fitOptions).toBeDefined();
      expect(graph.network.fitOptions.animation.duration).toBe(500);
      expect(graph.network.fitOptions.animation.easingFunction).toBe('easeInOutQuad');
    });

    test('should handle null network gracefully', () => {
      graph.network = null;

      expect(() => graph.fitToView()).not.toThrow();
    });
  });

  describe('callback setters', () => {
    test('should set onBeatClick callback', () => {
      const callback = jest.fn();

      graph.onBeatClick(callback);

      expect(graph.onBeatClickCallback).toBe(callback);
    });

    test('should set onBeatDrag callback', () => {
      const callback = jest.fn();

      graph.onBeatDrag(callback);

      expect(graph.onBeatDragCallback).toBe(callback);
    });
  });

  describe('destroy', () => {
    test('should destroy network and clear reference', () => {
      graph.show();
      const destroySpy = jest.spyOn(graph.network, 'destroy');

      graph.destroy();

      expect(destroySpy).toHaveBeenCalled();
      expect(graph.network).toBeNull();
    });

    test('should handle null network gracefully', () => {
      graph.network = null;

      expect(() => graph.destroy()).not.toThrow();
    });
  });

  describe('updateBeatPosition', () => {
    test('should update node position in graph', () => {
      graph.show();

      graph.updateBeatPosition('beat-1', 60);

      const node = graph.data.nodes.get('beat-1');
      // yPosition 60 -> y = -(60*10) = -600
      expect(node.y).toBe(-600);
    });

    test('should handle null data gracefully', () => {
      graph.data = null;

      expect(() => graph.updateBeatPosition('beat-1', 50)).not.toThrow();
    });

    test('should handle null network gracefully', () => {
      graph.show();
      graph.network = null;

      expect(() => graph.updateBeatPosition('beat-1', 50)).not.toThrow();
    });

    test('should handle non-existent beat ID', () => {
      graph.show();

      expect(() => graph.updateBeatPosition('non-existent', 50)).not.toThrow();
    });
  });

  describe('highlightBeat', () => {
    test('should select node by ID', () => {
      graph.show();

      graph.highlightBeat('beat-2');

      expect(graph.network.selectedNodes).toContain('beat-2');
    });

    test('should handle null network gracefully', () => {
      graph.network = null;

      expect(() => graph.highlightBeat('beat-1')).not.toThrow();
    });
  });

  describe('unhighlightAll', () => {
    test('should clear all selections', () => {
      graph.show();
      graph.network.selectedNodes = ['beat-1', 'beat-2'];

      graph.unhighlightAll();

      expect(graph.network.selectedNodes).toHaveLength(0);
    });

    test('should handle null network gracefully', () => {
      graph.network = null;

      expect(() => graph.unhighlightAll()).not.toThrow();
    });
  });

  describe('edge case scenarios', () => {
    test('should handle character with undefined linkedScenes', () => {
      mockCharacter.characterArc.beats[0].linkedScenes = undefined;

      const beats = mockCharacter.characterArc.beats;
      const data = graph.prepareData(beats);
      const nodes = data.nodes.get();

      expect(nodes[0].size).toBe(40);
      expect(nodes[0].title).toContain('Linked: 0');
    });

    test('should handle character with undefined linkedChapters', () => {
      mockCharacter.characterArc.beats[1].linkedChapters = undefined;

      const beats = mockCharacter.characterArc.beats;
      const data = graph.prepareData(beats);
      const nodes = data.nodes.get();

      expect(nodes[1].size).toBe(50); // Still has linkedScenes
    });

    test('should handle beat with yPosition at boundaries', () => {
      mockCharacter.characterArc.beats[0].yPosition = 0;
      mockCharacter.characterArc.beats[1].yPosition = 100;

      const beats = mockCharacter.characterArc.beats;
      const data = graph.prepareData(beats);
      const nodes = data.nodes.get();

      expect(nodes[0].y).toBe(0);      // -(0*10)
      expect(nodes[1].y).toBe(-1000);  // -(100*10)
    });

    test('should handle empty template object', () => {
      graph.arcTemplates = {};

      expect(graph.getArcColor()).toBe('#6b7280');
    });

    test('should handle multiple callbacks on same beat', () => {
      const clickCallback1 = jest.fn();
      const clickCallback2 = jest.fn();

      graph.onBeatClick(clickCallback1);
      graph.onBeatClick(clickCallback2);
      graph.show();

      graph.network.trigger('click', { nodes: ['beat-1'] });

      expect(clickCallback1).not.toHaveBeenCalled();
      expect(clickCallback2).toHaveBeenCalled(); // Only latest callback
    });
  });

  describe('integration scenarios', () => {
    test('should handle complete workflow: show -> click -> drag -> destroy', () => {
      const clickCallback = jest.fn();
      const dragCallback = jest.fn();

      graph.onBeatClick(clickCallback);
      graph.onBeatDrag(dragCallback);

      // Show graph
      graph.show();
      expect(graph.network).not.toBeNull();

      // Click on beat
      graph.network.trigger('click', { nodes: ['beat-1'] });
      expect(clickCallback).toHaveBeenCalled();

      // Drag beat
      graph.data.nodes.update({ id: 'beat-1', y: 300 });
      graph.network.trigger('dragEnd', { nodes: ['beat-1'] });
      expect(dragCallback).toHaveBeenCalled();

      // Destroy
      graph.destroy();
      expect(graph.network).toBeNull();
    });

    test('should handle highlight and unhighlight', () => {
      graph.show();

      graph.highlightBeat('beat-2');
      expect(graph.network.selectedNodes).toContain('beat-2');

      graph.unhighlightAll();
      expect(graph.network.selectedNodes).toHaveLength(0);
    });

    test('should handle re-rendering after changes', () => {
      graph.show();
      const firstNetwork = graph.network;

      // Modify character
      mockCharacter.characterArc.beats.push({
        id: 'beat-4',
        name: 'New Beat',
        yPosition: 50,
        linkedScenes: [],
        linkedChapters: []
      });

      // Re-render
      graph.show();

      expect(graph.network).not.toBe(firstNetwork);
      expect(graph.data.nodes.get()).toHaveLength(4);
    });

    test('should maintain state across template changes', () => {
      graph.show();
      const initialColor = graph.getArcColor();

      mockCharacter.characterArc.templateType = 'corruption';
      graph.show();
      const newColor = graph.getArcColor();

      expect(initialColor).toBe('#10b981');
      expect(newColor).toBe('#ef4444');
    });
  });
});
