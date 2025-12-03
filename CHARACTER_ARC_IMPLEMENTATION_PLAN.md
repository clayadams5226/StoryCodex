# Character Arc Feature - Implementation Plan

## Project Status

**Current Phase:** Phase 0 - COMPLETED ✅
**Branch:** feature/enhanced-characters
**Last Updated:** 2025-11-30

---

## Phase 0: Foundation - Scene/Chapter ID System ✅ COMPLETED

### Summary
Migrated from index-based scene/chapter references to stable UUID-based IDs. This provides the foundation needed for linking arc beats to specific scenes and chapters.

### Completed Tasks
- ✅ Added `id` field to `ItemFactory.createScene()` and `createChapter()`
- ✅ Created UUID generation helper compatible with browser and Node.js
- ✅ Built ID-based helper functions in `src/utils/idHelpers.js`
- ✅ Created automatic migration system in `src/migrations/addSceneChapterIds.js`
- ✅ Integrated migration into `StateManager.loadFromStorage()`
- ✅ Updated all popup.js functions to use scene/chapter IDs
- ✅ Updated all tests (179/179 passing)

### Key Files Created/Modified
- `src/models/ItemFactory.js` - Added ID generation
- `src/utils/idHelpers.js` - NEW: Helper functions for ID-based operations
- `src/migrations/addSceneChapterIds.js` - NEW: Migration system
- `src/core/StateManager.js` - Integrated migration
- `popup.js` - Updated 6 functions
- Tests updated across integration and unit test files

---

## Phase 1: Data Model & Arc Templates

### Objective
Implement the core data structures for character arcs without any UI.

### Tasks

#### 1.1 Update Character Data Model
**File:** `src/models/ItemFactory.js`

- [ ] Add `characterArc` field to `createCharacter()`:
  ```javascript
  characterArc: {
    templateType: '', // 'redemption', 'corruption', etc.
    beats: []
  }
  ```

#### 1.2 Create Arc Beat Factory Method
**File:** `src/models/ItemFactory.js`

- [ ] Add `createArcBeat(name, order)` static method
- [ ] Include all fields: `id`, `name`, `description`, `order`, `linkedScenes`, `linkedChapters`, `emotionalState`, `yPosition`

#### 1.3 Create Arc Templates
**File:** `src/constants/arcTemplates.js` (NEW)

- [ ] Create `ARC_TEMPLATES` constant with all templates:
  - Redemption
  - Corruption (Fall)
  - Disillusionment
  - Coming of Age
  - Quest
  - Custom
- [ ] Each template includes: `name`, `description`, `color`, `defaultBeats[]`

#### 1.4 Update ItemTypes Metadata
**File:** `src/models/ItemTypes.js`

- [ ] Add `characterArc` to character fields metadata (if needed)

#### 1.5 Testing
**File:** `tests/models/ItemFactory.test.js`

- [ ] Test `createCharacter()` has `characterArc` field
- [ ] Test `createArcBeat()` creates proper structure
- [ ] Test beat IDs are unique
- [ ] Verify all arc templates are properly structured

### Estimated Completion
~2-3 hours

---

## Phase 2: Arc Editor UI - List View

### Objective
Build the arc editor modal/panel with list-based beat management. This is the primary interface for editing character arcs.

### Tasks

#### 2.1 Create Arc Editor Component Structure
**File:** `popup.html`

- [ ] Add modal/panel HTML for arc editor:
  - Header with character name/thumbnail
  - Template selector (buttons or dropdown)
  - View toggle (Graph/List)
  - Beat list container
  - Beat detail panel
  - Action buttons (Add Beat, Save, Close)

**File:** `styles.css`

- [ ] Style arc editor modal/panel to match dark theme
- [ ] Use template colors for accents
- [ ] Style beat list items
- [ ] Style beat detail panel

#### 2.2 Template Selection UI
**File:** `popup.js` or new `src/ui/ArcEditor.js`

- [ ] Create function to render template buttons/dropdown
- [ ] Import `ARC_TEMPLATES` constant
- [ ] Handle template selection event
- [ ] Populate character arc with default beats from selected template
- [ ] Confirm before switching templates if beats already exist

#### 2.3 Beat List View
**File:** `popup.js` or `src/ui/ArcEditor.js`

- [ ] Render list of beats for current character arc
- [ ] Display beat order number, name, linked content count
- [ ] Implement beat selection (click to select)
- [ ] Highlight selected beat
- [ ] Show empty state when no beats exist

#### 2.4 Beat Detail Panel
**File:** `popup.js` or `src/ui/ArcEditor.js`

- [ ] Show detail panel when beat is selected
- [ ] Beat name (editable text input)
- [ ] Description textarea
- [ ] Emotional state text input
- [ ] Y-position slider (0-100)
- [ ] Delete beat button
- [ ] Auto-save or manual save for beat edits

#### 2.5 Scene/Chapter Linking UI
**File:** `popup.js` or `src/ui/ArcEditor.js`

- [ ] Fetch all scenes from current book
- [ ] Fetch all chapters from current book
- [ ] Display scenes with checkboxes/toggles
- [ ] Display chapters with checkboxes/toggles
- [ ] Handle toggle to add/remove scene ID from `beat.linkedScenes`
- [ ] Handle toggle to add/remove chapter ID from `beat.linkedChapters`
- [ ] Show visual indicator for linked vs unlinked content

#### 2.6 Add/Delete Beat Functionality
**File:** `popup.js` or `src/ui/ArcEditor.js`

- [ ] "Add Beat" button appends new beat to end
- [ ] Auto-increment order value
- [ ] Generate unique ID for new beat
- [ ] Delete beat with confirmation
- [ ] Remove beat from `character.characterArc.beats` array

#### 2.7 Drag-and-Drop Reordering
**File:** `popup.js` or `src/ui/ArcEditor.js`

- [ ] Use Sortable.js (already in project) for beat reordering
- [ ] Update `order` values after reorder
- [ ] Persist changes to character arc

#### 2.8 Save & Close
**File:** `popup.js` or `src/ui/ArcEditor.js`

- [ ] Implement auto-save with debouncing (300ms)
- [ ] Or implement manual save button
- [ ] Update character object in book
- [ ] Call `updateBook()` to persist
- [ ] Close modal/panel on close button

#### 2.9 Entry Point from Character Details
**File:** `popup.html`

- [ ] Add "Character Arc" section to character details screen
- [ ] Show compact preview: template name, beat count, linked content count
- [ ] "View Arc" button opens arc editor
- [ ] "Set Up Arc" button if no arc configured

**File:** `popup.js`

- [ ] Function to open arc editor for current character
- [ ] Function to render arc preview on character details

#### 2.10 Testing
**File:** Manual testing for now (UI-heavy)

- [ ] Test template selection
- [ ] Test beat creation/deletion
- [ ] Test beat editing
- [ ] Test scene/chapter linking
- [ ] Test drag-and-drop reordering
- [ ] Test save/close behavior
- [ ] Test with characters that have no arc

### Estimated Completion
~8-10 hours

---

## Phase 3: Arc Editor UI - Graph View

### Objective
Create the visual graph representation of character arcs using SVG or vis.js.

### Tasks

#### 3.1 Decide on Visualization Library
**Decision Point:**

- [ ] **Option A:** Use vis.js (consistency with relationship graph)
  - Pros: Already in project, powerful, handles interactions
  - Cons: Less control over custom curve rendering
- [ ] **Option B:** Use vanilla SVG
  - Pros: Complete control, custom bezier curves
  - Cons: More code, need to handle interactions manually

#### 3.2 Create SVG/Canvas Container
**File:** `popup.html`

- [ ] Add graph view container in arc editor
- [ ] Add axis labels (Story Progression, Emotional State)
- [ ] Hidden by default, shown when "Graph View" toggle selected

#### 3.3 Render Beat Nodes
**File:** `popup.js` or `src/ui/ArcGraphView.js`

- [ ] Calculate X position based on beat order (evenly spaced)
- [ ] Use `beat.yPosition` for Y position (0-100 scale)
- [ ] Render nodes as circles or custom shapes
- [ ] Use template color for styling
- [ ] Display beat name below/beside node (truncate if needed)

#### 3.4 Draw Connecting Curve
**File:** `popup.js` or `src/ui/ArcGraphView.js`

- [ ] Draw smooth bezier curve connecting all beat nodes
- [ ] Use template color for stroke
- [ ] Ensure curve flows smoothly between Y positions

#### 3.5 Visual Indicators for Linked Content
**File:** `popup.js` or `src/ui/ArcGraphView.js`

- [ ] Filled node = has linked scenes/chapters
- [ ] Empty node = no linked content
- [ ] Badge showing count of linked items

#### 3.6 Node Interactivity
**File:** `popup.js` or `src/ui/ArcGraphView.js`

- [ ] Click node to select beat (show detail panel)
- [ ] Highlight selected node
- [ ] Hover tooltip showing beat name and link count
- [ ] Optionally: drag node vertically to adjust Y position

#### 3.7 Y-Position Adjustment
**File:** `popup.js` or `src/ui/ArcGraphView.js`

**Option A:** Slider in detail panel (already planned in Phase 2)
**Option B:** Drag node directly on graph

- [ ] Implement chosen approach
- [ ] Update `beat.yPosition` value
- [ ] Redraw curve in real-time

#### 3.8 Responsive/Scrollable Graph
**File:** `popup.js` or `src/ui/ArcGraphView.js`

- [ ] Ensure graph is responsive or horizontally scrollable
- [ ] Handle many beats gracefully (>10)

#### 3.9 Testing
**File:** Manual testing

- [ ] Test with various arc templates
- [ ] Test with different yPosition values
- [ ] Test node selection
- [ ] Test with many beats
- [ ] Test hover tooltips
- [ ] Test drag interactions (if implemented)

### Estimated Completion
~6-8 hours

---

## Phase 4: Integration & Bidirectional Linking

### Objective
Complete the feature by integrating arc display into scene/chapter views and adding polish.

### Tasks

#### 4.1 Arc Preview on Character Details
**File:** `popup.html`

- [ ] Add "Character Arc" section (already done in Phase 2.9)
- [ ] Display: template type, number of beats, linked content count

**File:** `popup.js`

- [ ] Function to render arc summary
- [ ] Click to open full arc editor

#### 4.2 Bidirectional Display on Scene Details
**File:** `popup.html`

- [ ] Add "Character Arcs" section to scene details screen

**File:** `popup.js`

- [ ] Function `displayCharacterArcsForScene(sceneId)`
- [ ] Find all characters whose arc beats link to this scene
- [ ] Display format: "[Character Name] - [Beat Name]"
- [ ] Make each entry clickable to open that character's arc

#### 4.3 Bidirectional Display on Chapter Details
**File:** `popup.html`

- [ ] Add "Character Arcs" section to chapter details screen

**File:** `popup.js`

- [ ] Function `displayCharacterArcsForChapter(chapterId)`
- [ ] Find all characters whose arc beats link to this chapter
- [ ] Display format: "[Character Name] - [Beat Name]"
- [ ] Make each entry clickable to open that character's arc

#### 4.4 Empty States & Onboarding
**File:** `popup.html` / `popup.js`

- [ ] Empty state when character has no arc configured
- [ ] Helpful text explaining what arcs are
- [ ] "Set Up Arc" button prominent and clear

#### 4.5 Data Validation
**File:** `popup.js` or `src/utils/arcValidation.js` (NEW)

- [ ] Ensure arc beats have valid scene/chapter IDs
- [ ] Clean up references to deleted scenes/chapters
- [ ] Validate yPosition is 0-100
- [ ] Validate order is sequential

#### 4.6 Performance Optimization
**File:** Various

- [ ] Debounce auto-save properly (already planned)
- [ ] Optimize re-rendering of graph view
- [ ] Lazy load graph view only when tab is selected
- [ ] Cache scene/chapter lookups if needed

#### 4.7 Accessibility
**File:** `popup.html` / `popup.js` / `styles.css`

- [ ] Add ARIA labels to arc editor controls
- [ ] Ensure keyboard navigation works
- [ ] Proper focus management in modal
- [ ] Screen reader friendly beat list

#### 4.8 Testing
**File:** Manual and integration tests

- [ ] Test arc display on character details
- [ ] Test arc references on scene details
- [ ] Test arc references on chapter details
- [ ] Test with multiple characters having arcs
- [ ] Test with deleted scenes (cleanup validation)
- [ ] Test keyboard navigation
- [ ] Test with large books (performance)

### Estimated Completion
~6-8 hours

---

## Phase 5: Polish & Optional Enhancements

### Objective
Add nice-to-have features and polish based on time/feedback.

### Tasks (Optional)

#### 5.1 Multi-Character Arc Comparison
**File:** New comparison view

- [ ] View multiple character arcs side-by-side
- [ ] Overlay arcs on same graph
- [ ] Use different colors per character
- [ ] Helpful for tracking parallel character journeys

#### 5.2 Export Arc as Image
**File:** `popup.js` or export utility

- [ ] Export arc graph as PNG/SVG
- [ ] Use html2canvas or similar library
- [ ] Download button in arc editor

#### 5.3 Arc Timeline View
**File:** New timeline view

- [ ] Map arc beats to actual chapter/scene order in manuscript
- [ ] Show progression through the story
- [ ] Identify gaps in character development

#### 5.4 Arc Completion Percentage
**File:** `popup.js`

- [ ] Calculate % of beats with linked content
- [ ] Display in arc preview
- [ ] Visual progress indicator

#### 5.5 Custom Template Creation
**File:** `popup.js` or template manager

- [ ] Allow users to save custom arc templates
- [ ] Store in book or global settings
- [ ] Reuse across characters

#### 5.6 Guided Arc Wizard
**File:** New wizard component

- [ ] Step-by-step guide for new users
- [ ] Explains each arc type
- [ ] Helps users choose appropriate template
- [ ] Auto-suggests scenes for beats

### Estimated Completion
~Varies by feature (1-4 hours each)

---

## Testing Strategy

### Unit Tests
- **Phase 1:** ItemFactory, ArcBeat creation, template validation
- **Phase 4:** Arc validation utilities

### Integration Tests
- **Phase 2:** Arc creation, beat management, linking
- **Phase 4:** Bidirectional display, data cleanup

### Manual Testing Checklist
- [ ] Create character arc from each template
- [ ] Edit beat names, descriptions, emotional states
- [ ] Link beats to scenes and chapters
- [ ] Reorder beats via drag-and-drop
- [ ] Delete beats and verify cleanup
- [ ] View graph representation
- [ ] Adjust Y-positions
- [ ] Check arc references on scene/chapter details
- [ ] Test with existing data (migration)
- [ ] Test with no scenes/chapters (edge case)
- [ ] Test with many beats (performance)
- [ ] Test keyboard navigation
- [ ] Test on different screen sizes

---

## Migration & Backward Compatibility

### Existing Characters
- Characters created before this feature will have `characterArc: { templateType: '', beats: [] }`
- No migration needed beyond ensuring new field exists
- Can be handled in `ItemFactory` or on-the-fly when loading

### Data Integrity
- Arc beats reference scenes/chapters by ID (already implemented in Phase 0)
- If scene/chapter is deleted, need to clean up arc beat references
- Implement in Phase 4.5 (Data Validation)

---

## File Structure Overview

```
StoryCodex/
├── src/
│   ├── constants/
│   │   └── arcTemplates.js          # NEW - Arc template definitions
│   ├── models/
│   │   ├── ItemFactory.js           # MODIFY - Add characterArc, createArcBeat
│   │   └── ItemTypes.js             # MODIFY - Update metadata (optional)
│   ├── ui/
│   │   ├── ArcEditor.js             # NEW - Arc editor logic (optional separate file)
│   │   └── ArcGraphView.js          # NEW - Graph visualization (optional separate file)
│   ├── utils/
│   │   ├── idHelpers.js             # EXISTS - Already created in Phase 0
│   │   └── arcValidation.js         # NEW - Validation utilities
│   └── migrations/
│       └── addSceneChapterIds.js    # EXISTS - Phase 0 migration
├── popup.html                        # MODIFY - Add arc editor UI
├── popup.js                          # MODIFY - Add arc functionality
├── styles.css                        # MODIFY - Style arc UI
└── tests/
    ├── models/
    │   └── ItemFactory.test.js      # MODIFY - Test arc creation
    └── integration.test.js           # MODIFY - Test arc workflows
```

---

## Design Decisions to Confirm

Before starting Phase 1, confirm these decisions:

1. **Modal vs Slide-out Panel**
   - Recommendation: Modal (easier)
   - Alternative: Slide-out from right

2. **Graph Library**
   - Recommendation: Vanilla SVG (more control for arc visualization)
   - Alternative: vis.js (consistency with relationship graph)

3. **Auto-save vs Manual Save**
   - Decision: Auto-save with 300ms debounce (already decided)

4. **Arc Editor as Separate Component**
   - Recommendation: Create `src/ui/ArcEditor.js` for cleaner code
   - Alternative: Keep in popup.js (simpler but messier)

---

## Estimated Total Time

| Phase | Description | Estimated Time |
|-------|-------------|----------------|
| Phase 0 | Scene/Chapter IDs | ✅ **COMPLETED** |
| Phase 1 | Data Model & Templates | 2-3 hours |
| Phase 2 | Arc Editor - List View | 8-10 hours |
| Phase 3 | Arc Editor - Graph View | 6-8 hours |
| Phase 4 | Integration & Polish | 6-8 hours |
| Phase 5 | Optional Enhancements | Variable |
| **Total** | **Core Feature** | **22-29 hours** |

---

## Next Steps

When you're ready to continue:

1. Review this plan and confirm design decisions
2. Start with **Phase 1** (Data Model)
3. Test each phase thoroughly before moving to the next
4. Can skip Phase 5 (optional features) initially
5. Consider creating a new branch for the arc feature if desired

---

## Notes & Considerations

- **Chrome Storage Limit:** 100KB sync storage quota may be a concern with arc data. Monitor size during testing.
- **vis.js Version:** Confirm we're using a compatible version if we choose that route for graphs.
- **Sortable.js:** Already used for scene reordering, can reuse for beat reordering.
- **Template Colors:** Use CSS variables for easy theming.
- **UUID Consistency:** Already implemented in Phase 0 with browser/Node.js compatibility.

---

**Document maintained by:** Claude Code
**Last updated:** 2025-11-30
**Implementation status:** Phase 0 complete, ready for Phase 1
