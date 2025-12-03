export class CharacterArcGraph {

    constructor(character, arcTemplates) {
        this.character = character;
        this.arcTemplates = arcTemplates;
        this.container = document.getElementById('arcGraphNetwork');
        this.network = null;
        this.data = null;
        this.onBeatClickCallback = null;
        this.onBeatDragCallback = null;
    }

    show() {
        if (!this.container) {
            console.error('Graph container not found!');
            return;
        }

        if (!this.character || !this.character.characterArc) {
            this.showEmptyMessage('No character or character arc');
            return;
        }

        const beats = this.character.characterArc.beats || [];
        if (beats.length === 0) {
            this.showEmptyMessage('No beats to display. Add beats in List View first.');
            return;
        }

        this.data = this.prepareData(beats);
        const options = this.getGraphOptions();

        // Destroy existing network if it exists
        if (this.network) {
            this.network.destroy();
        }

        // Create new network
        try {
            this.network = new vis.Network(this.container, this.data, options);
            this.addEventListeners(beats);
            this.fitToView();
        } catch (error) {
            console.error('Error creating network:', error);
            this.showErrorMessage('Error creating graph: ' + error.message);
        }
    }

    showEmptyMessage(message) {
        if (this.container) {
            this.container.innerHTML = `<div style="display: flex; align-items: center; justify-content: center; height: 100%; color: #6b7280;">${message}</div>`;
        }
    }

    showErrorMessage(message) {
        if (this.container) {
            this.container.innerHTML = `<div style="display: flex; align-items: center; justify-content: center; height: 100%; color: #ef4444;">${message}</div>`;
        }
    }

    prepareData(beats) {
        const arcColor = this.getArcColor();

        const nodes = beats.map((beat, index) => {
            const hasLinkedContent = (beat.linkedScenes?.length || 0) + (beat.linkedChapters?.length || 0) > 0;
            const linkedCount = (beat.linkedScenes?.length || 0) + (beat.linkedChapters?.length || 0);

            return {
                id: beat.id,
                label: beat.name,
                x: index * 200,
                y: -(beat.yPosition * 10) || 0,
                shape: 'dot',
                size: hasLinkedContent ? 50 : 40,
                color: {
                    background: hasLinkedContent ? arcColor : '#1f2937',
                    border: arcColor,
                    highlight: {
                        background: arcColor,
                        border: '#ffffff'
                    }
                },
                borderWidth: 4,
                borderWidthSelected: 5,
                font: {
                    color: '#e5e7eb',
                    size: 16,
                    bold: true
                },
                title: `${beat.name}\nLinked: ${linkedCount}\nEmotional State: ${beat.yPosition}/100`,
                fixed: { x: true, y: false }
            };
        });

        const edges = [];
        for (let i = 0; i < beats.length - 1; i++) {
            edges.push({
                from: beats[i].id,
                to: beats[i + 1].id,
                color: {
                    color: arcColor,
                    opacity: 0.7
                },
                width: 5,
                smooth: {
                    enabled: true,
                    type: 'curvedCW',
                    roundness: 0.2
                },
                arrows: {
                    to: {
                        enabled: false
                    }
                }
            });
        }

        return {
            nodes: new vis.DataSet(nodes),
            edges: new vis.DataSet(edges)
        };
    }

    getArcColor() {
        const templateType = this.character.characterArc?.templateType;
        const template = this.arcTemplates[templateType];
        return template ? template.color : '#6b7280';
    }

    getGraphOptions() {
        return {
            nodes: {
                font: {
                    color: '#e5e7eb',
                    size: 13,
                    face: 'Inter, system-ui, sans-serif'
                }
            },
            edges: {
                smooth: {
                    enabled: true,
                    type: 'cubicBezier',
                    forceDirection: 'horizontal',
                    roundness: 0.5
                }
            },
            physics: {
                enabled: false
            },
            interaction: {
                dragNodes: true,
                dragView: true,
                zoomView: true,
                hover: true
            },
            manipulation: {
                enabled: false
            },
            height: '100%',
            width: '100%',
            autoResize: true
        };
    }

    addEventListeners(beats) {
        if (!this.network) return;

        // Handle node click to select beat
        this.network.on('click', (params) => {
            if (params.nodes.length > 0) {
                const beatId = params.nodes[0];
                const beat = beats.find(b => b.id === beatId);
                if (beat && this.onBeatClickCallback) {
                    this.onBeatClickCallback(beat);
                }
            }
        });

        // Handle node drag to update Y position
        this.network.on('dragEnd', (params) => {
            if (params.nodes.length > 0) {
                const beatId = params.nodes[0];
                const beat = beats.find(b => b.id === beatId);
                if (beat) {
                    const position = this.network.getPositions([beatId])[beatId];
                    const newYPosition = Math.max(0, Math.min(100, -(position.y / 10)));
                    beat.yPosition = Math.round(newYPosition);

                    if (this.onBeatDragCallback) {
                        this.onBeatDragCallback(beat, newYPosition);
                    }
                }
            }
        });
    }

    fitToView() {
        if (this.network) {
            // Small delay to ensure the container is fully rendered
            setTimeout(() => {
                this.network.fit({
                    animation: {
                        duration: 500,
                        easingFunction: 'easeInOutQuad'
                    },
                    // Add padding to prevent nodes from touching edges
                    minZoomLevel: 0.5,
                    maxZoomLevel: 2
                });
            }, 100);
        }
    }

    onBeatClick(callback) {
        this.onBeatClickCallback = callback;
    }

    onBeatDrag(callback) {
        this.onBeatDragCallback = callback;
    }

    destroy() {
        if (this.network) {
            this.network.destroy();
            this.network = null;
        }
    }

    updateBeatPosition(beatId, yPosition) {
        if (!this.data || !this.network) return;

        const nodes = this.data.nodes.get();
        const node = nodes.find(n => n.id === beatId);

        if (node) {
            node.y = -(yPosition * 10) || 0;
            this.data.nodes.update(node);
        }
    }

    highlightBeat(beatId) {
        if (this.network) {
            this.network.selectNodes([beatId]);
        }
    }

    unhighlightAll() {
        if (this.network) {
            this.network.unselectAll();
        }
    }
}
