const DEFAULT_RELATIONSHIP_TYPES = [
    'family',
    'friend',
    'enemy',
    'mentor',
    'colleague',
    'married',
    'lover',
    'other'
];

const RELATIONSHIP_STYLES = {
    family: { color: '#d7ad58', background: '#f3dfaa', border: '#b88932', dashes: false },
    married: { color: '#d7ad58', background: '#f3dfaa', border: '#b88932', dashes: false },
    friend: { color: '#6b8f71', background: '#e3efdf', border: '#4f7455', dashes: false },
    ally: { color: '#6b8f71', background: '#e3efdf', border: '#4f7455', dashes: false },
    enemy: { color: '#b4443e', background: '#f9e4e1', border: '#95352f', dashes: [8, 6] },
    rival: { color: '#b4443e', background: '#f9e4e1', border: '#95352f', dashes: [8, 6] },
    conflict: { color: '#b4443e', background: '#f9e4e1', border: '#95352f', dashes: [8, 6] },
    mentor: { color: '#6656a6', background: '#ece8ff', border: '#51428f', dashes: false },
    teacher: { color: '#6656a6', background: '#ece8ff', border: '#51428f', dashes: false },
    lover: { color: '#6656a6', background: '#ece8ff', border: '#51428f', dashes: false },
    colleague: { color: '#1d3f7a', background: '#dfe9ff', border: '#10295f', dashes: false },
    other: { color: '#6a6f83', background: '#eef0f5', border: '#4d5364', dashes: false }
};

export class RelationshipGraph {

    constructor(book) {
        this.book = book || {};
        this.container = document.getElementById('graphContainer');
        this.network = null;
        this.data = null;
        this.allNodes = [];
        this.allEdges = [];
        this.invalidRelationships = [];
        this.relationshipCounts = new Map();
        this.currentFilter = 'all';
        this.searchTerm = '';
        this.showIsolated = true;
        this.selectedNodeId = null;
        this.elements = {};
    }

    show() {
        if (!this.container) {
            return;
        }

        if (this.network?.destroy) {
            this.network.destroy();
        }

        this.container.innerHTML = '';
        this.renderScaffold();
        this.data = this.prepareData();
        this.allNodes = this.data.nodes.get();
        this.allEdges = this.data.edges.get();
        this.renderFilterOptions();
        this.renderStats();
        this.renderLegend();
        this.renderDataWarning();
        this.renderEmptyState();

        const options = this.getGraphOptions();
        this.network = new vis.Network(this.elements.network, this.data, options);
        this.addEventListeners();
        this.applyFilters();
    }

    renderScaffold() {
        this.container.className = 'relationship-map';
        this.container.innerHTML = `
            <section class="relationship-map-header">
                <div class="relationship-map-title">
                    <h2>Character Relationships</h2>
                    <p>Inspect alliances, conflicts, families, and isolated cast members at a glance.</p>
                </div>
                <div class="relationship-map-toolbar" role="search">
                    <input id="relationshipSearch" class="relationship-map-field" type="search" placeholder="Search characters" aria-label="Search characters">
                    <select id="relationshipFilter" class="relationship-map-select" aria-label="Relationship type"></select>
                    <label class="relationship-map-toggle">
                        <input id="showIsolatedCharacters" type="checkbox" checked>
                        <span>Isolated</span>
                    </label>
                    <button id="fitRelationshipMap" class="relationship-map-icon-button" type="button" aria-label="Fit map" title="Fit map">
                        <svg viewBox="0 0 24 24" aria-hidden="true">
                            <path d="M8 3H5a2 2 0 0 0-2 2v3"></path>
                            <path d="M16 3h3a2 2 0 0 1 2 2v3"></path>
                            <path d="M8 21H5a2 2 0 0 1-2-2v-3"></path>
                            <path d="M16 21h3a2 2 0 0 0 2-2v-3"></path>
                        </svg>
                    </button>
                </div>
            </section>
            <div id="relationshipMapStats" class="relationship-map-stats" aria-label="Relationship map statistics"></div>
            <div id="relationshipMapWarning" class="relationship-map-warning" hidden></div>
            <section class="relationship-map-shell" aria-label="Relationship graph">
                <div id="relationshipGraphNetwork" class="relationship-map-network"></div>
                <div id="relationshipMapEmpty" class="relationship-map-empty" hidden></div>
                <div id="relationshipMapLegend" class="relationship-map-legend" aria-label="Relationship legend"></div>
            </section>
        `;

        this.elements = {
            search: document.getElementById('relationshipSearch'),
            filter: document.getElementById('relationshipFilter'),
            showIsolated: document.getElementById('showIsolatedCharacters'),
            fit: document.getElementById('fitRelationshipMap'),
            stats: document.getElementById('relationshipMapStats'),
            warning: document.getElementById('relationshipMapWarning'),
            network: document.getElementById('relationshipGraphNetwork'),
            empty: document.getElementById('relationshipMapEmpty'),
            legend: document.getElementById('relationshipMapLegend')
        };
    }

    renderFilterOptions() {
        if (!this.elements.filter) {
            return;
        }

        const relationshipTypes = this.getRelationshipTypes();
        this.elements.filter.innerHTML = [
            '<option value="all">All relationships</option>',
            ...relationshipTypes.map(type => `<option value="${this.escapeAttribute(type)}">${this.formatRelationshipType(type)}</option>`)
        ].join('');
        this.elements.filter.value = this.currentFilter;
    }

    renderStats() {
        const stats = this.getStats();

        if (!this.elements.stats) {
            return;
        }

        this.elements.stats.innerHTML = `
            <div class="relationship-map-stat"><strong>${stats.characters}</strong><span>Characters</span></div>
            <div class="relationship-map-stat"><strong>${stats.relationships}</strong><span>Relationships</span></div>
            <div class="relationship-map-stat"><strong>${stats.conflicts}</strong><span>Conflict lines</span></div>
            <div class="relationship-map-stat"><strong>${stats.isolated}</strong><span>Unconnected</span></div>
        `;
    }

    renderLegend() {
        if (!this.elements.legend) {
            return;
        }

        const legendTypes = this.getRelationshipTypes().filter(type => this.allEdges.some(edge => edge.group === type));
        const types = legendTypes.length > 0 ? legendTypes : ['family', 'friend', 'enemy', 'mentor', 'other'];

        this.elements.legend.innerHTML = types.map(type => {
            const style = this.getEdgeStyle(type);
            const dashed = style.dashes ? ' dashed' : '';

            return `
                <span class="relationship-map-legend-chip">
                    <span class="relationship-map-legend-line${dashed}" style="--line-color:${style.color}"></span>
                    ${this.formatRelationshipType(type)}
                </span>
            `;
        }).join('');
    }

    renderDataWarning() {
        if (!this.elements.warning) {
            return;
        }

        if (this.invalidRelationships.length === 0) {
            this.elements.warning.hidden = true;
            this.elements.warning.textContent = '';
            return;
        }

        const skippedText = this.invalidRelationships.length === 1
            ? '1 relationship references a missing character and was skipped.'
            : `${this.invalidRelationships.length} relationships reference missing characters and were skipped.`;

        this.elements.warning.hidden = false;
        this.elements.warning.textContent = skippedText;
    }

    renderEmptyState() {
        if (!this.elements.empty) {
            return;
        }

        const characters = this.getCharacters();
        const relationships = this.getRelationships();
        let message = '';

        if (characters.length === 0) {
            message = '<strong>No characters yet</strong><span>Add characters first, then manage relationships from the book More tab.</span>';
        } else if (relationships.length === 0) {
            message = '<strong>No relationships yet</strong><span>Add relationships from the book More tab to turn this into a usable map.</span>';
        } else if (this.allEdges.length === 0) {
            message = '<strong>No valid relationships to map</strong><span>Some relationship records reference characters that no longer exist.</span>';
        }

        this.elements.empty.hidden = message === '';
        this.elements.empty.innerHTML = message;
    }

    prepareData() {
        const characters = this.getCharacters();
        const relationships = this.getRelationships();
        const characterIndex = new Map(characters.map((char, index) => [char.name, index]));

        this.relationshipCounts = this.getRelationshipCounts(relationships, characterIndex);
        this.invalidRelationships = [];

        const nodes = characters.map((char, index) => {
            const count = this.relationshipCounts.get(char.name) || 0;
            const isolated = count === 0;

            return {
                id: index,
                label: char.name,
                title: this.getCharacterTooltip(char, count),
                group: isolated ? 'isolated' : 'connected',
                relationshipCount: count,
                characterName: char.name,
                hidden: false,
                color: this.getNodeColor(isolated, false, false),
                font: { color: '#07173d', size: 14, face: 'Inter, Segoe UI, sans-serif', bold: { color: '#07173d' } },
                borderWidth: isolated ? 1 : 2,
                shadow: !isolated
            };
        });

        const edges = relationships.reduce((items, rel, index) => {
            const fromIndex = characterIndex.get(rel.character1);
            const toIndex = characterIndex.get(rel.character2);

            if (fromIndex === undefined || toIndex === undefined) {
                this.invalidRelationships.push(rel);
                return items;
            }

            const type = this.normalizeRelationshipType(rel.type);
            const style = this.getEdgeStyle(type);

            items.push({
                id: `relationship-${index}`,
                from: fromIndex,
                to: toIndex,
                label: this.formatRelationshipType(type),
                relationshipType: rel.type || 'other',
                group: type,
                color: { color: style.color, highlight: '#d7ad58', hover: style.border },
                dashes: style.dashes,
                width: 2.5,
                font: {
                    color: '#10295f',
                    strokeWidth: 4,
                    strokeColor: '#ffffff',
                    size: 11,
                    face: 'Inter, Segoe UI, sans-serif'
                },
                smooth: { type: 'curvedCW', roundness: 0.2 }
            });

            return items;
        }, []);

        return {
            nodes: new vis.DataSet(nodes),
            edges: new vis.DataSet(edges)
        };
    }

    getCharacterTooltip(character, relationshipCount = 0) {
        const description = character.description || 'No description available.';
        const role = character.type || character.role || character.archetype || 'Character';
        const tags = character.tags?.length ? character.tags.join(', ') : 'None';
        const relationshipLabel = relationshipCount === 1 ? '1 relationship' : `${relationshipCount} relationships`;

        return `
            <strong>${this.escapeHTML(character.name)}</strong><br>
            ${this.escapeHTML(role)} | ${relationshipLabel}<br>
            ${this.escapeHTML(description)}<br>
            Tags: ${this.escapeHTML(tags)}
        `;
    }

    getEdgeStyle(relationType) {
        const normalizedType = this.normalizeRelationshipType(relationType);
        return RELATIONSHIP_STYLES[normalizedType] || {
            ...RELATIONSHIP_STYLES.other,
            color: '#4d5364',
            border: '#10295f'
        };
    }

    getGraphOptions() {
        return {
            autoResize: true,
            nodes: {
                shape: 'dot',
                size: 22,
                borderWidth: 2,
                margin: 10,
                font: {
                    size: 14,
                    face: 'Inter, Segoe UI, sans-serif',
                    color: '#07173d'
                }
            },
            edges: {
                arrows: {
                    to: {
                        enabled: false
                    }
                },
                color: {
                    inherit: false
                },
                font: {
                    size: 11,
                    align: 'middle'
                },
                smooth: {
                    type: 'curvedCW',
                    roundness: 0.2
                }
            },
            physics: {
                enabled: true,
                barnesHut: {
                    gravitationalConstant: -2600,
                    centralGravity: 0.22,
                    springLength: 125,
                    springConstant: 0.04,
                    damping: 0.12,
                    avoidOverlap: 0.55
                },
                stabilization: {
                    iterations: 160
                }
            },
            interaction: {
                hover: true,
                tooltipDelay: 180,
                multiselect: false,
                navigationButtons: false,
                keyboard: false
            }
        };
    }

    addEventListeners() {
        if (this.elements.filter) {
            this.elements.filter.addEventListener('change', (event) => {
                this.filterRelationships(event.target.value);
            });
        }

        if (this.elements.search) {
            this.elements.search.addEventListener('input', (event) => {
                this.searchCharacters(event.target.value);
            });
        }

        if (this.elements.showIsolated) {
            this.elements.showIsolated.addEventListener('change', (event) => {
                this.toggleIsolatedCharacters(event.target.checked);
            });
        }

        if (this.elements.fit) {
            this.elements.fit.addEventListener('click', () => {
                this.fitGraph();
            });
        }

        if (!this.network) {
            return;
        }

        this.network.on('click', (params) => {
            if (params.nodes.length > 0) {
                this.selectCharacter(params.nodes[0]);
            } else {
                this.clearHighlight();
            }
        });

        this.network.on('stabilizationIterationsDone', () => {
            this.fitGraph();
        });
    }

    filterRelationships(relationType) {
        this.currentFilter = relationType || 'all';
        this.applyFilters();
    }

    searchCharacters(searchTerm) {
        this.searchTerm = (searchTerm || '').trim().toLowerCase();
        this.applyFilters();
    }

    toggleIsolatedCharacters(showIsolated) {
        this.showIsolated = showIsolated;
        this.applyFilters();
    }

    selectCharacter(nodeId) {
        this.selectedNodeId = nodeId;
        this.updateHighlightState();
    }

    clearHighlight() {
        this.selectedNodeId = null;
        this.updateHighlightState();
    }

    fitGraph() {
        if (this.network?.fit) {
            this.network.fit({ animation: { duration: 220, easingFunction: 'easeInOutQuad' } });
        }
    }

    applyFilters() {
        if (!this.data) {
            return;
        }

        const filteredEdges = this.getFilteredEdges();
        const visibleNodeIds = new Set();

        filteredEdges.forEach(edge => {
            visibleNodeIds.add(edge.from);
            visibleNodeIds.add(edge.to);
        });

        const updatedNodes = this.allNodes.map(node => ({
            ...node,
            hidden: !this.shouldShowNode(node, visibleNodeIds)
        }));

        this.data.nodes.clear();
        this.data.nodes.add(updatedNodes);
        this.data.edges.clear();
        this.data.edges.add(filteredEdges);
        this.updateHighlightState();
    }

    updateHighlightState() {
        if (!this.data) {
            return;
        }

        const searchMatches = this.getSearchMatchIds();
        const connectedIds = new Set();
        const selectedEdges = new Set();

        if (this.selectedNodeId !== null) {
            this.allEdges.forEach(edge => {
                if (edge.from === this.selectedNodeId || edge.to === this.selectedNodeId) {
                    selectedEdges.add(edge.id);
                    connectedIds.add(edge.from);
                    connectedIds.add(edge.to);
                }
            });
        }

        const nodeUpdates = this.data.nodes.get().map(node => {
            const isolated = (node.relationshipCount || 0) === 0;
            const isSelected = node.id === this.selectedNodeId || searchMatches.has(node.id);
            const isConnected = connectedIds.has(node.id);
            const dimmed = (this.selectedNodeId !== null && !isConnected) || (this.searchTerm && !searchMatches.has(node.id));

            return {
                id: node.id,
                color: this.getNodeColor(isolated, isSelected, isConnected),
                borderWidth: isSelected ? 4 : (isolated ? 1 : 2),
                opacity: dimmed ? 0.34 : 1
            };
        });

        const edgeUpdates = this.data.edges.get().map(edge => {
            const style = this.getEdgeStyle(edge.group);
            const active = selectedEdges.has(edge.id);
            const dimmed = this.selectedNodeId !== null && !active;

            return {
                id: edge.id,
                color: { color: dimmed ? '#d8d0ad' : style.color, highlight: '#d7ad58', hover: style.border },
                width: active ? 4 : 2.5,
                dashes: style.dashes
            };
        });

        this.data.nodes.update(nodeUpdates);
        this.data.edges.update(edgeUpdates);

        if (this.selectedNodeId !== null && this.network?.selectNodes) {
            this.network.selectNodes([this.selectedNodeId]);
        }
    }

    getStats() {
        const characters = this.getCharacters();
        const relationships = this.allEdges.length;
        const isolated = characters.filter(char => (this.relationshipCounts.get(char.name) || 0) === 0).length;
        const conflicts = this.allEdges.filter(edge => this.isConflictType(edge.group)).length;

        return {
            characters: characters.length,
            relationships,
            conflicts,
            isolated
        };
    }

    getFilteredEdges() {
        if (this.currentFilter === 'all') {
            return this.allEdges;
        }

        const normalizedFilter = this.normalizeRelationshipType(this.currentFilter);
        return this.allEdges.filter(edge => edge.group === normalizedFilter);
    }

    shouldShowNode(node, visibleNodeIds) {
        if (!this.showIsolated && node.relationshipCount === 0) {
            return false;
        }

        if (this.currentFilter !== 'all' && node.relationshipCount > 0 && !visibleNodeIds.has(node.id)) {
            return false;
        }

        return true;
    }

    getSearchMatchIds() {
        if (!this.searchTerm) {
            return new Set();
        }

        return new Set(this.allNodes
            .filter(node => node.characterName.toLowerCase().includes(this.searchTerm))
            .map(node => node.id));
    }

    getRelationshipTypes() {
        const relationshipTypes = new Set(DEFAULT_RELATIONSHIP_TYPES);

        this.getRelationships().forEach(rel => {
            if (rel.type) {
                relationshipTypes.add(this.normalizeRelationshipType(rel.type));
            }
        });

        return Array.from(relationshipTypes);
    }

    getRelationshipCounts(relationships, characterIndex) {
        const counts = new Map();

        this.getCharacters().forEach(char => counts.set(char.name, 0));
        relationships.forEach(rel => {
            if (characterIndex.has(rel.character1) && characterIndex.has(rel.character2)) {
                counts.set(rel.character1, (counts.get(rel.character1) || 0) + 1);
                counts.set(rel.character2, (counts.get(rel.character2) || 0) + 1);
            }
        });

        return counts;
    }

    getNodeColor(isolated, selected, connected) {
        if (selected) {
            return {
                border: '#d7ad58',
                background: '#fffaf0',
                highlight: { border: '#d7ad58', background: '#fffaf0' },
                hover: { border: '#d7ad58', background: '#fffaf0' }
            };
        }

        if (connected) {
            return {
                border: '#10295f',
                background: '#dfe9ff',
                highlight: { border: '#d7ad58', background: '#fffaf0' },
                hover: { border: '#d7ad58', background: '#fffaf0' }
            };
        }

        if (isolated) {
            return {
                border: '#bdb38c',
                background: '#f8f3df',
                highlight: { border: '#d7ad58', background: '#fffaf0' },
                hover: { border: '#d7ad58', background: '#fffaf0' }
            };
        }

        return {
            border: '#10295f',
            background: '#ffffff',
            highlight: { border: '#d7ad58', background: '#fffaf0' },
            hover: { border: '#d7ad58', background: '#fffaf0' }
        };
    }

    normalizeRelationshipType(relationType) {
        return (relationType || 'other').toString().trim().toLowerCase() || 'other';
    }

    formatRelationshipType(relationType) {
        return this.normalizeRelationshipType(relationType)
            .split(/[\s_-]+/)
            .map(part => part.charAt(0).toUpperCase() + part.slice(1))
            .join(' ');
    }

    isConflictType(relationType) {
        return ['enemy', 'rival', 'conflict'].includes(this.normalizeRelationshipType(relationType));
    }

    getCharacters() {
        return Array.isArray(this.book.characters) ? this.book.characters : [];
    }

    getRelationships() {
        return Array.isArray(this.book.relationships) ? this.book.relationships : [];
    }

    escapeHTML(value) {
        return String(value)
            .replaceAll('&', '&amp;')
            .replaceAll('<', '&lt;')
            .replaceAll('>', '&gt;')
            .replaceAll('"', '&quot;')
            .replaceAll("'", '&#39;');
    }

    escapeAttribute(value) {
        return this.escapeHTML(value);
    }
}
