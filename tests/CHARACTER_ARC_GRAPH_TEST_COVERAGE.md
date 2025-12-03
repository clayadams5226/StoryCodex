# Character Arc Graph UI Test Coverage

## Overview
Comprehensive UI test suite for the CharacterArcGraph visualization component with 66 test cases covering all aspects of character arc beat rendering, interaction, and functionality.

## Test Categories

### 1. Constructor & Initialization (3 tests)
- ✅ Initializes with character data and arc templates
- ✅ Initializes callbacks as null
- ✅ Handles missing container gracefully

### 2. Graph Rendering (7 tests)
- ✅ Renders graph when character has beats
- ✅ Handles null container without errors
- ✅ Shows empty message if character is null
- ✅ Shows empty message if character has no arc
- ✅ Shows empty message if beats array is empty
- ✅ Destroys existing network before creating new one
- ✅ Calls fitToView after rendering

### 3. Message Display (4 tests)
- ✅ Displays custom empty message with gray color
- ✅ Displays custom error message with red color
- ✅ Handles null container in empty message
- ✅ Handles null container in error message

### 4. Data Preparation (11 tests)
- ✅ Creates nodes from beat data
- ✅ Sets node labels from beat names
- ✅ Positions nodes horizontally based on index (120px spacing)
- ✅ Positions nodes vertically based on yPosition (inverted scale)
- ✅ Makes nodes larger (50px) when they have linked content
- ✅ Colors nodes with linked content using arc color
- ✅ Includes tooltips with beat name, linked count, and emotional state
- ✅ Fixes X position and allows Y dragging
- ✅ Creates edges connecting sequential beats
- ✅ Styles edges with arc color and opacity
- ✅ Configures edges with curved smooth style
- ✅ Creates no edges for single beat

### 5. Arc Color Management (4 tests)
- ✅ Returns color from template (e.g., redemption = #10b981)
- ✅ Returns default gray color (#6b7280) for unknown template
- ✅ Returns default color if no template type specified
- ✅ Works with different template types (redemption, corruption, custom)

### 6. Graph Configuration (6 tests)
- ✅ Returns valid vis.js options object
- ✅ Configures node font (color, size, face)
- ✅ Configures edges with cubic bezier horizontal smoothing
- ✅ Disables physics (fixed positions)
- ✅ Enables interaction (drag nodes, drag view, zoom, hover)
- ✅ Disables manipulation

### 7. Event Handling (7 tests)
- ✅ Adds click event listener to network
- ✅ Calls onBeatClick callback when node clicked
- ✅ Doesn't call callback when clicking empty space
- ✅ Adds dragEnd event listener
- ✅ Updates beat yPosition on drag
- ✅ Clamps yPosition between 0 and 100 on drag
- ✅ Rounds yPosition to integer on drag

### 8. View Management (2 tests)
- ✅ Calls network.fit with animation options (500ms, easeInOutQuad)
- ✅ Handles null network in fitToView gracefully

### 9. Callback Management (2 tests)
- ✅ Sets onBeatClick callback
- ✅ Sets onBeatDrag callback

### 10. Network Lifecycle (2 tests)
- ✅ Destroys network and clears reference
- ✅ Handles null network in destroy gracefully

### 11. Position Updates (4 tests)
- ✅ Updates node position in graph data
- ✅ Handles null data in updateBeatPosition
- ✅ Handles null network in updateBeatPosition
- ✅ Handles non-existent beat ID

### 12. Selection Management (4 tests)
- ✅ Highlights beat by selecting node
- ✅ Handles null network in highlightBeat
- ✅ Unhighlights all selections
- ✅ Handles null network in unhighlightAll

### 13. Edge Cases (5 tests)
- ✅ Handles character with undefined linkedScenes
- ✅ Handles character with undefined linkedChapters
- ✅ Handles beat yPosition at boundaries (0 and 100)
- ✅ Handles empty template object
- ✅ Handles multiple callbacks (latest overwrites previous)

### 14. Integration Scenarios (4 tests)
- ✅ Complete workflow: show → click → drag → destroy
- ✅ Highlight and unhighlight operations
- ✅ Re-rendering after character changes
- ✅ Maintains state across template changes

## Character Arc Graph Features

### Node Visualization
- **Size:** 40px (no linked content) or 50px (with linked content)
- **Color:** Arc template color for linked content, dark gray (#1f2937) otherwise
- **Border:** Arc template color with 4px width
- **Position:**
  - X: Fixed, based on beat index (index × 120px)
  - Y: Draggable, based on emotional state (0-100 inverted scale)
- **Tooltip:** Shows beat name, linked count, and emotional state

### Edge Visualization
- **Style:** Curved (cubic bezier) with horizontal force direction
- **Color:** Arc template color with 70% opacity
- **Width:** 5px
- **Arrows:** Disabled (no directional arrows)
- **Connection:** Sequential (beat N → beat N+1)

### Arc Templates
- **Redemption:** Green (#10b981)
- **Corruption:** Red (#ef4444)
- **Disillusionment:** Purple (#8b5cf6)
- **Coming of Age:** Amber (#f59e0b)
- **Quest:** Blue (#3b82f6)
- **Custom:** Gray (#6b7280)

### Interactions
1. **Click:** Select beat to view/edit details
2. **Drag Y:** Adjust emotional state (0-100)
3. **Zoom:** Zoom in/out on graph
4. **Pan:** Drag view to explore
5. **Hover:** Show tooltip with beat information

### Position Calculations
- **Y to yPosition:** `yPosition = 100 - (y / 6)`
- **yPosition to Y:** `y = (100 - yPosition) × 6`
- **Range:** yPosition clamped to [0, 100], rounded to integer

## New Class Created

### CharacterArcGraph.js
A dedicated graph visualization class extracted from popup.js functionality:

**Key Methods:**
- `show()` - Render the graph
- `prepareData(beats)` - Transform beats into vis.js nodes/edges
- `getArcColor()` - Get template color
- `getGraphOptions()` - Configure vis.js options
- `addEventListeners(beats)` - Handle click and drag events
- `fitToView()` - Animate zoom to fit all nodes
- `updateBeatPosition(beatId, yPosition)` - Programmatically update position
- `highlightBeat(beatId)` - Select/highlight a beat
- `unhighlightAll()` - Clear all selections
- `destroy()` - Clean up network resources

**Callbacks:**
- `onBeatClick(callback)` - Handle beat selection
- `onBeatDrag(callback)` - Handle position changes

## Test Execution

```bash
npm test -- CharacterArcGraph.test.js
```

**Results:** 66/66 tests passing ✅

## Dependencies Mocked

- **vis.js Network:** Custom MockNetwork class simulating graph rendering
- **vis.js DataSet:** Custom MockDataSet class simulating data storage with get/add/clear/update
- **DOM Elements:** Using jsdom for DOM manipulation

## Coverage Areas

✅ **Rendering:** Graph initialization and beat display
✅ **Data Transformation:** Beats → nodes and edges with proper positioning
✅ **Styling:** Template-based colors, sizes, and visual indicators
✅ **Positioning:** Horizontal (fixed) and vertical (draggable) layout
✅ **Interaction:** Click selection and drag-to-adjust emotional state
✅ **Configuration:** Physics, layout, and interaction options
✅ **Edge Cases:** Empty data, missing properties, boundary values
✅ **Integration:** Multi-step user workflows and state management
✅ **Lifecycle:** Network creation, updates, and cleanup

## Differences from RelationshipGraph

| Feature | RelationshipGraph | CharacterArcGraph |
|---------|-------------------|-------------------|
| **Purpose** | Visualize character relationships | Track character emotional journey |
| **Nodes** | Characters | Arc beats (story moments) |
| **Edges** | Relationships (friend, enemy, etc.) | Sequential connections |
| **Layout** | Physics-based (force-directed) | Fixed horizontal timeline |
| **Node Position** | Physics-driven | X fixed, Y represents emotional state |
| **Dragging** | Moves freely | Y-only (adjusts emotional state) |
| **Node Color** | Single color | Template color or gray |
| **Node Size** | Fixed (25px) | Variable (40-50px based on links) |
| **Edge Style** | Type-based colors and dashing | Single template color, curved |
| **Filtering** | By relationship type | N/A (shows all beats) |
| **Templates** | N/A | Multiple arc types with colors |
| **Physics** | Enabled (Barnes-Hut) | Disabled (fixed positions) |

## Future Test Considerations

1. **Performance Testing:** Large arcs with 20+ beats
2. **Animation Testing:** Fit animation timing and easing
3. **Touch Interactions:** Mobile drag and zoom gestures
4. **Accessibility:** Keyboard navigation for beat selection
5. **Export Testing:** Arc visualization export (if added)
6. **Multi-character Testing:** Switching between characters
7. **Undo/Redo:** Position change history (if added)
8. **Beat Validation:** Ensuring beat order integrity

## Visual Testing Recommendations

While these tests verify functionality, consider adding visual regression tests for:
- Beat node appearance (size, color, border)
- Edge curve quality and smoothness
- Tooltip styling and positioning
- Layout consistency across different beat counts
- Template color accuracy
- Drag handle visual feedback

Tools: Percy, Chromatic, or similar visual testing platforms

## Integration with Popup.js

The original `renderArcGraph()` function in popup.js can now be refactored to use this class:

```javascript
function renderArcGraph() {
    if (!currentEditingCharacter) return;

    const arcGraph = new CharacterArcGraph(currentEditingCharacter, ARC_TEMPLATES);
    arcGraph.onBeatClick(selectBeat);
    arcGraph.onBeatDrag((beat, newYPosition) => {
        saveArcChanges();
        updateBeatDetailPanel(beat);
    });
    arcGraph.show();
}
```

This provides better separation of concerns, easier testing, and improved maintainability.
