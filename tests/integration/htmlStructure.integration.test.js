/**
 * Integration Tests for HTML Structure and DOM Integration
 *
 * These tests verify that the HTML structure matches what the JavaScript
 * code expects, catching integration issues between HTML and JS.
 */

import { describe, test, expect, beforeEach } from '@jest/globals';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

describe('HTML Structure Integration Tests', () => {
  let html;
  let relationshipGraphSource;
  let manifest;

  beforeEach(() => {
    const htmlPath = path.join(__dirname, '../../popup.html');
    const relationshipGraphPath = path.join(__dirname, '../../RelationshipGraph.js');
    const manifestPath = path.join(__dirname, '../../manifest.json');
    html = fs.readFileSync(htmlPath, 'utf-8');
    relationshipGraphSource = fs.readFileSync(relationshipGraphPath, 'utf-8');
    manifest = JSON.parse(fs.readFileSync(manifestPath, 'utf-8'));
  });

  describe('Popup Manifest Integration', () => {
    test('should register popup.html as the default extension popup', () => {
      expect(manifest.action.default_popup).toBe('popup.html');
    });

    test('should not require the side panel permission', () => {
      expect(manifest.permissions).not.toContain('sidePanel');
    });

    test('popup should include a popout control for opening the app in a tab', () => {
      expect(html).toContain('id="openPopout"');
      expect(html).toContain('aria-label="Open Story Codex in a tab"');
      expect(html).toContain('popup.js');
    });
  });

  describe('Graph Container Elements', () => {
    test('should have graphContainer element for RelationshipGraph', () => {
      expect(html).toContain('id="graphContainer"');
      expect(html).toContain('class="relationship-map-container"');
    });

    test('should have arcTimelineCurve element for the character arc editor', () => {
      expect(html).toContain('id="arcTimelineCurve"');
    });

    test('should have relationshipGraph screen section', () => {
      expect(html).toContain('id="relationshipGraph"');
      expect(html).toContain('class="relationship-map-screen"');
    });

    test('RelationshipGraph should render focused map controls and containers', () => {
      expect(relationshipGraphSource).toContain('id="relationshipSearch"');
      expect(relationshipGraphSource).toContain('id="relationshipFilter"');
      expect(relationshipGraphSource).toContain('id="showIsolatedCharacters"');
      expect(relationshipGraphSource).toContain('id="relationshipMapStats"');
      expect(relationshipGraphSource).toContain('id="relationshipMapLegend"');
      expect(relationshipGraphSource).toContain('id="relationshipGraphNetwork"');
    });

    test('should have arcEditorModal for character arc editing', () => {
      expect(html).toContain('id="arcEditorModal"');
    });
  });

  describe('Script Loading', () => {
    test('should load RelationshipGraph.js as a module', () => {
      expect(html).toMatch(/type="module"[^>]*src="RelationshipGraph\.js"|src="RelationshipGraph\.js"[^>]*type="module"/);
    });

    test('should load vis.js for graph rendering', () => {
      expect(html).toContain('vis.min.js');
    });

    test('should load scripts in correct order', () => {
      const relationshipGraphIndex = html.indexOf('RelationshipGraph.js');
      const popupIndex = html.indexOf('popup.js');

      expect(relationshipGraphIndex).toBeGreaterThan(-1);
      expect(popupIndex).toBeGreaterThan(-1);

      // Graph classes should load before popup.js
      expect(relationshipGraphIndex).toBeLessThan(popupIndex);
    });
  });

  describe('Character Details Page Structure', () => {
    test('should have characterDetails screen', () => {
      expect(html).toContain('id="characterDetails"');
    });

    test('should have characterRelationships list element', () => {
      expect(html).toContain('id="characterRelationships"');
    });

    test('should have relationships section in collapsible structure', () => {
      const relationshipsSection = html.match(
        /<div[^>]*class="collapsible-section[^"]*"[^>]*data-section="relationships"/
      );
      expect(relationshipsSection).not.toBeNull();
    });

    test('should have character arc section in collapsible structure', () => {
      const arcSection = html.match(
        /<div[^>]*class="collapsible-section[^"]*"[^>]*data-section="character-arc"/
      );
      expect(arcSection).not.toBeNull();
    });

    test('should have openCharacterArcEditor button', () => {
      expect(html).toContain('id="openCharacterArcEditor"');
    });

    test('should have characterArcPreview element', () => {
      expect(html).toContain('id="characterArcPreview"');
    });
  });

  describe('Relationship Graph Integration Points', () => {
    test('should have viewRelationshipGraph button in book details', () => {
      expect(html).toContain('id="viewRelationshipGraph"');
    });

    test('should have character selection dropdowns for relationships', () => {
      expect(html).toContain('id="character1"');
      expect(html).toContain('id="character2"');
    });

    test('should have relationshipType dropdown', () => {
      expect(html).toContain('id="relationshipType"');
      expect(html).toContain('<option value="friend">Friend</option>');
      expect(html).toContain('<option value="enemy">Enemy</option>');
    });

    test('should have addRelationship button', () => {
      expect(html).toContain('id="addRelationship"');
    });

    test('should have relationships list in book details', () => {
      expect(html).toContain('id="relationships"');
    });

    test('relationship graph screen should not include relationship creation controls', () => {
      const graphScreen = html.match(/<div id="relationshipGraph"[\s\S]*?<\/div>\s*<\/main>/);

      expect(graphScreen).not.toBeNull();
      expect(graphScreen[0]).not.toContain('id="addRelationship"');
      expect(graphScreen[0]).not.toContain('Add Relationship');
    });
  });

  describe('Arc Editor Structure', () => {
    test('should have unified timeline workspace', () => {
      expect(html).toContain('id="arcListView"');
      expect(html).toContain('class="arc-workspace"');
      expect(html).toContain('id="arcTimelineSummary"');
      expect(html).toContain('id="arcTimelineCurve"');
    });

    test('should have template replacement confirmation controls', () => {
      expect(html).toContain('id="arcTemplateConfirm"');
      expect(html).toContain('id="cancelTemplateChange"');
      expect(html).toContain('id="applyTemplateChange"');
    });

    test('should have timeline labels and detail panel', () => {
      expect(html).toContain('Emotional Timeline');
      expect(html).toContain('Emotional State');
      expect(html).toContain('id="arcBeatDetail"');
    });

    test('should have beat detail panel', () => {
      expect(html).toContain('id="arcBeatDetail"');
    });

    test('should have close arc editor button', () => {
      expect(html).toContain('id="closeArcEditor"');
    });
  });

  describe('CSS Styling Requirements', () => {
    test('should link to styles.css', () => {
      expect(html).toContain('href="styles.css"');
    });

    test('should link to vis.min.css for graph styling', () => {
      expect(html).toContain('href="vis.min.css"');
    });

    test('should have collapsible-section class defined', () => {
      const cssPath = path.join(__dirname, '../../styles.css');
      const css = fs.readFileSync(cssPath, 'utf-8');
      expect(css).toContain('.collapsible-section');
    });
  });

  describe('Data Attributes for JavaScript Hooks', () => {
    test('should have data-section attributes on collapsible sections', () => {
      expect(html).toContain('data-section="basic-details"');
      expect(html).toContain('data-section="physical-description"');
      expect(html).toContain('data-section="background"');
      expect(html).toContain('data-section="character-depth"');
      expect(html).toContain('data-section="character-arc"');
      expect(html).toContain('data-section="relationships"');
    });
  });

  describe('Accessibility', () => {
    test('should have proper button text for screen readers', () => {
      expect(html).toContain('>View Relationship Graph</button>');
      expect(html).toContain('>Edit Character Arc</button>');
      expect(html).toContain('>Add Relationship</button>');
    });

    test('should have placeholder text on inputs', () => {
      expect(html).toContain('placeholder="New character name"');
      expect(html).toContain('placeholder="New location name"');
    });
  });
});
