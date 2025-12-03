export class RelationshipGraph {

    constructor(book) {
        this.book = book;
        this.container = document.getElementById('graphContainer');
        this.network = null;
        this.data = null;
        this.allEdges = [];
    }

    show() {
        if (this.container) {
            this.container.innerHTML = '';
            this.createFilterControls();
            this.data = this.prepareData();
            this.allEdges = this.data.edges.get();
            const options = this.getGraphOptions();
            this.network = new vis.Network(this.container, this.data, options);
            this.addEventListeners();
        }
    }

    createFilterControls() {
        const filterDiv = document.createElement('div');
        filterDiv.innerHTML = `
            <select id="relationshipFilter">
                <option value="all">All Relationships</option>
                <option value="married">Married</option>
                <option value="family">Family</option>
                <option value="friend">Friend</option>
                <option value="enemy">Enemy</option>
                <option value="colleague">Colleague</option>
                <option value="lover">Lover</option>
            </select>
        `;
        this.container.appendChild(filterDiv);

        document.getElementById('relationshipFilter').addEventListener('change', (event) => {
            this.filterRelationships(event.target.value);
        });
    }

    prepareData() {
        const nodes = this.book.characters.map((char, index) => ({
            id: index,
            label: char.name,
            title: this.getCharacterTooltip(char)
        }));

        const edges = this.book.relationships.map(rel => {
            const fromIndex = this.book.characters.findIndex(char => char.name === rel.character1);
            const toIndex = this.book.characters.findIndex(char => char.name === rel.character2);
            
            const { color, dashes } = this.getEdgeStyle(rel.type);

            return {
                from: fromIndex,
                to: toIndex,
                label: rel.type,
                color: { color: color },
                dashes: dashes
            };
        });

        return {
            nodes: new vis.DataSet(nodes),
            edges: new vis.DataSet(edges)
        };
    }

    getCharacterTooltip(character) {
        return `
            <strong>${character.name}</strong><br>
            ${character.description || 'No description available.'}<br>
            Tags: ${character.tags?.join(', ') || 'None'}
        `;
    }

    getEdgeStyle(relationType) {
        switch(relationType.toLowerCase()) {
            case 'married':
                return { color: '#FF0000', dashes: false };
            case 'family':
                return { color: '#00FF00', dashes: false };
            case 'friend':
                return { color: '#0000FF', dashes: false };
            case 'enemy':
                return { color: '#FF00FF', dashes: [5, 5] };
            case 'colleague':
                return { color: '#FFA500', dashes: false };
            case 'lover':
                return { color: '#FF0000', dashes: false };
            default:
                return { color: '#808080', dashes: false };
        }
    }

    getGraphOptions() {
        return {
            nodes: {
                shape: 'circle',
                size: 25,
                font: {
                    size: 14
                }
            },
            edges: {
                font: {
                    size: 12,
                    align: 'middle'
                },
                arrows: 'to',
                smooth: {
                    type: 'curvedCW',
                    roundness: 0.2
                }
            },
            physics: {
                enabled: true,
                barnesHut: {
                    gravitationalConstant: -2000,
                    centralGravity: 0.3,
                    springLength: 95,
                    springConstant: 0.04,
                    damping: 0.09
                }
            },
            interaction: {
                hover: true,
                tooltipDelay: 200
            }
        };
    }

    addEventListeners() {
        this.network.on('click', (params) => {
            if (params.nodes.length > 0) {
                const nodeId = params.nodes[0];
                const character = this.book.characters[nodeId];
                this.showCharacterDetails(character);
            }
        });
    }

    showCharacterDetails(character) {
        const detailsDiv = document.createElement('div');
        detailsDiv.innerHTML = `
            <h3>${character.name}</h3>
            <p>${character.description || 'No description available.'}</p>
            <p>Tags: ${character.tags?.join(', ') || 'None'}</p>
            <button id="closeDetails">Close</button>
        `;
        this.container.appendChild(detailsDiv);

        document.getElementById('closeDetails').addEventListener('click', () => {
            detailsDiv.remove();
        });
    }

    filterRelationships(relationType) {
        const filteredEdges = relationType === 'all'
            ? this.allEdges
            : this.allEdges.filter(edge => edge.label.toLowerCase() === relationType.toLowerCase());

        this.data.edges.clear();
        this.data.edges.add(filteredEdges);
    }
}