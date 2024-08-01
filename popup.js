import { showScreen, saveCurrentState, updateBook, populateTagDropdowns } from './utils.js';
import { RelationshipGraph } from './RelationshipGraph.js';
import { DataManager } from './DataManager.js';
import { RichTextEditor } from './RichTextEditor.js';

let books = [];
let currentBook = null;
let currentItem = null;
let currentScreen = 'bookList';
let currentItemType = null;
const dataManager = new DataManager();
const richTextEditor = new RichTextEditor('noteEditor');

document.addEventListener('DOMContentLoaded', function () {
    const itemDisplayFunctions = {
        character: displayCharacterDetails,
        location: displayLocationDetails,
        plotPoint: displayPlotPointDetails,
        note: displayNoteDetails,
        chapter: displayChapterDetails,
        scene: displaySceneDetails,
    };

    // Load initial state
    chrome.storage.sync.get(['books', 'currentState'], function (result) {
        books = result.books || [];
        displayBooks(books);

        if (result.currentState) {
            currentBook = result.currentState.currentBook;
            currentItem = result.currentState.currentItem;
            currentScreen = result.currentState.currentScreen;
            currentItemType = result.currentState.currentItemType;

            console.log('Loaded state:', result.currentState);

            if (currentBook) {
                displayBookDetails(currentBook);
                if (currentItem && currentItemType) {
                    showItemDetails(currentItemType, currentItem);
                } else {
                    currentScreen = showScreen(currentScreen);
                }
            } else {
                currentScreen = showScreen('bookList');
            }
        } else {
            currentScreen = showScreen('bookList');
        }

        populateCharacterDropdowns();
    });

    // Book List Functions
    function displayBooks(books) {
        const bookList = document.getElementById('books');
        if (bookList) {
            bookList.innerHTML = '';
            books.forEach(book => {
                const li = document.createElement('li');
                li.textContent = book.name;
                li.addEventListener('click', () => {
                    currentBook = book;
                    displayBookDetails(book);
                    currentScreen = showScreen('bookDetails');
                });
                bookList.appendChild(li);
            });
        }
    }

    function addBook(bookName) {
        const newBook = {
            name: bookName,
            characters: [],
            locations: [],
            plotPoints: [],
            relationships: [],
            notes: [],
            tags: [],
            wordCount: 0,
            targetWordCount: 0,
            chapters: [],
            scenes: []
        };
        books.push(newBook);
        books = updateBook(books, newBook);
        displayBooks(books);
    }

    // Book Details Functions
    function displayBookDetails(book) {
        const bookTitleElement = document.getElementById('bookTitle');
        if (bookTitleElement) {
            bookTitleElement.textContent = book.name;
        }

        displayChapters(book.chapters);
        populateCharacterDropdowns();
        displayCharacters(book.characters);
        displayLocations(book.locations);
        displayPlotPoints(book.plotPoints);
        displayTags(book.tags);
        displayRelationships(book.relationships);
        displayNotes(book.notes);
        displayWordCount(book);
        populateTagDropdowns(book);
        currentScreen = showScreen('bookDetails');
    }

    function displayChapters(chapters) {
        const chaptersList = document.getElementById('chapters');
        if (chaptersList) {
            chaptersList.innerHTML = '';
            chapters.forEach((chapter, index) => {
                const chapterLi = document.createElement('li');
                chapterLi.textContent = chapter.title;
                chapterLi.addEventListener('click', () => showItemDetails('chapter', chapter, index));
                chaptersList.appendChild(chapterLi);
            });
        }
    }

    function displayCharacters(characters) {
        const characterList = document.getElementById('characters');
        if (characterList) {
            characterList.innerHTML = '';
            characters.forEach(character => {
                const li = document.createElement('li');
                li.textContent = character.name;
                li.addEventListener('click', () => showItemDetails('character', character));
                characterList.appendChild(li);
            });
        }
    }
    
    function displayLocations(locations) {
        const locationList = document.getElementById('locations');
        if (locationList) {
            locationList.innerHTML = '';
            locations.forEach(location => {
                const li = document.createElement('li');
                li.textContent = location.name;
                li.addEventListener('click', () => showItemDetails('location', location));
                locationList.appendChild(li);
            });
        }
    }
    
    function displayPlotPoints(plotPoints) {
        const plotPointList = document.getElementById('plotPoints');
        if (plotPointList) {
            plotPointList.innerHTML = '';
            plotPoints.forEach(plotPoint => {
                const li = document.createElement('li');
                li.textContent = plotPoint.title;
                li.addEventListener('click', () => showItemDetails('plotPoint', plotPoint));
                plotPointList.appendChild(li);
            });
        }
    }
    
    function displayTags(tags) {
        const tagContainers = [
            document.getElementById('tags'),
            document.getElementById('characterTags'),
            document.getElementById('locationTags'),
            document.getElementById('plotPointTags')
        ];
    
        tagContainers.forEach(container => {
            if (container) {
                container.innerHTML = '';
                tags.forEach(tag => {
                    const div = document.createElement('div');
                    div.textContent = tag;
                    div.classList.add('tag');
                    div.addEventListener('click', () => displayTaggedItems(tag));
                    container.appendChild(div);
                });
            }
        });
    
        // Update the All Tags section in the book details
        const allTagsContainer = document.getElementById('allTags');
        if (allTagsContainer) {
            allTagsContainer.innerHTML = '';
            tags.forEach(tag => {
                const div = document.createElement('div');
                div.textContent = tag;
                div.classList.add('tag');
                div.addEventListener('click', () => displayTaggedItems(tag));
                allTagsContainer.appendChild(div);
            });
        }
    }
    
    function displayRelationships(relationships) {
        const relationshipList = document.getElementById('relationships');
        if (relationshipList) {
            relationshipList.innerHTML = '';
            relationships.forEach(relationship => {
                const li = document.createElement('li');
                li.textContent = `${relationship.character1} - ${relationship.type} - ${relationship.character2}`;
                relationshipList.appendChild(li);
            });
        }
    }
    
    function displayNotes(notes) {
        console.log('Displaying notes:', notes);
        const noteList = document.getElementById('notes');
        if (noteList) {
            noteList.innerHTML = '';
            if (notes && notes.length > 0) {
                notes.forEach(note => {
                    if (note && note.title) {
                        const li = document.createElement('li');
                        li.textContent = note.title;
                        li.addEventListener('click', () => showItemDetails('note', note));
                        noteList.appendChild(li);
                    } else {
                        console.error('Invalid note object:', note);
                    }
                });
            } else {
                noteList.innerHTML = '<li>No notes yet</li>';
            }
        } else {
            console.error('Note list element not found');
        }
    }
    
    function displayWordCount(book) {
        const wordCountDisplay = document.getElementById('wordCountDisplay');
        const progressBar = document.getElementById('progressBar');
        if (wordCountDisplay && progressBar) {
            wordCountDisplay.textContent = `${book.wordCount} / ${book.targetWordCount} words`;
            const progress = book.targetWordCount > 0 ? (book.wordCount / book.targetWordCount) * 100 : 0;
            progressBar.style.width = `${progress}%`;
        }
    }
    
    function displayTaggedItems(tag) {
        const currentTagElement = document.getElementById('currentTag');
        const taggedItemsList = document.getElementById('taggedItemsList');
        if (currentTagElement) currentTagElement.textContent = tag;
        if (taggedItemsList) {
            taggedItemsList.innerHTML = '';
    
            const addTaggedItem = (item, type) => {
                const li = document.createElement('li');
                li.textContent = `${type}: ${item.name || item.title}`;
                li.addEventListener('click', () => showItemDetails(type, item));
                taggedItemsList.appendChild(li);
            };
    
            currentBook.characters.filter(char => char.tags && char.tags.includes(tag)).forEach(char => addTaggedItem(char, 'character'));
            currentBook.locations.filter(loc => loc.tags && loc.tags.includes(tag)).forEach(loc => addTaggedItem(loc, 'location'));
            currentBook.plotPoints.filter(plot => plot.tags && plot.tags.includes(tag)).forEach(plot => addTaggedItem(plot, 'plotPoint'));
        }
    
        currentScreen = showScreen('taggedItems');
    }

    // ... (other display functions for characters, locations, plot points, etc.)

    // Item Details Functions
    function showItemDetails(itemType, item, index) {
        console.log(`Showing details for ${itemType}:`, item);
        try {
            currentItem = item;
            currentItemType = itemType;

            const displayFunction = itemDisplayFunctions[itemType];
            if (displayFunction) {
                displayFunction(item, index);
                currentScreen = `${itemType}Details`;
                saveCurrentState(currentBook, currentItem, currentScreen, currentItemType);
                currentScreen = showScreen(`${itemType}Details`);
            } else {
                console.error('Unknown item type:', itemType);
            }
        } catch (error) {
            console.error(`Error displaying ${itemType} details:`, error);
            alert(`An error occurred while displaying ${itemType} details. Please check the console for more information.`);
        }
    }

    function displayCharacterDetails(character) {
        const characterNameInput = document.getElementById('characterName');
        const characterNicknameInput = document.getElementById('characterNickname');
        const characterDescriptionInput = document.getElementById('characterDescription');
        const characterSceneInput = document.getElementById('characterScene');
        const characterTypeInput = document.getElementById('characterType');
    
        if (characterNameInput) characterNameInput.value = character.name || '';
        if (characterNicknameInput) characterNicknameInput.value = character.nickname || '';
        if (characterDescriptionInput) characterDescriptionInput.value = character.description || '';
        if (characterSceneInput) characterSceneInput.value = character.scene || '';
        if (characterTypeInput) characterTypeInput.value = character.type || '';
    
        displayRelationshipsForCharacter(character);
        displayTagsForItem(character, 'character');
        displayNotesForItem(character, 'character');
        displayTagsForItem(character, 'character');
        populateTagDropdowns(currentBook);
    
        currentScreen = showScreen('characterDetails');
    }
    
    function displayLocationDetails(location) {
        const locationNameInput = document.getElementById('locationName');
        const locationDescriptionInput = document.getElementById('locationDescription');
        const locationImportanceInput = document.getElementById('locationImportance');
    
        if (locationNameInput) locationNameInput.value = location.name || '';
        if (locationDescriptionInput) locationDescriptionInput.value = location.description || '';
        if (locationImportanceInput) locationImportanceInput.value = location.importance || '';
    
        displayTagsForItem(location, 'location');
        displayNotesForItem(location, 'location');
        displayTagsForItem(location, 'location');
        populateTagDropdowns(currentBook);
    
        currentScreen = showScreen('locationDetails');
    }
    
    function displayPlotPointDetails(plotPoint) {
        const plotPointTitleInput = document.getElementById('plotPointTitle');
        const plotPointDescriptionInput = document.getElementById('plotPointDescription');
        const plotPointCharactersInput = document.getElementById('plotPointCharacters');
        const plotPointLocationInput = document.getElementById('plotPointLocation');
    
        if (plotPointTitleInput) plotPointTitleInput.value = plotPoint.title || '';
        if (plotPointDescriptionInput) plotPointDescriptionInput.value = plotPoint.description || '';
        if (plotPointCharactersInput) plotPointCharactersInput.value = plotPoint.characters || '';
        if (plotPointLocationInput) plotPointLocationInput.value = plotPoint.location || '';
    
        displayTagsForItem(plotPoint, 'plotPoint');
        displayNotesForItem(plotPoint, 'plotPoint');
        displayTagsForItem(plotPoint, 'plotPoint');
        populateTagDropdowns(currentBook);
    
        currentScreen = showScreen('plotPointDetails');
    }
    
    function displayNoteDetails(note) {
        if (!note) {
            console.error('Attempted to display details of null note');
            return;
        }
        currentItem = note;
        currentItemType = 'note';
        const noteTitleElement = document.getElementById('noteDetailTitle');
        const noteContentElement = document.getElementById('noteDetailContent');
    
        if (noteTitleElement && noteContentElement) {
            noteTitleElement.textContent = note.title || 'Untitled Note';
            noteContentElement.innerHTML = note.content || 'No content';
            currentScreen = showScreen('noteDetails');
        } else {
            console.error('Note detail elements not found in the DOM');
        }
    }
    
    function displayChapterDetails(chapter, chapterIndex) {
        console.log('Displaying chapter details:', chapter);
        currentItem = chapter;
        currentItemType = 'chapter';
    
        const chapterTitleInput = document.getElementById('chapterTitle');
        const chapterSummaryInput = document.getElementById('chapterSummary');
        const chapterScenesList = document.getElementById('chapterScenes');
    
        if (chapterTitleInput) chapterTitleInput.value = chapter.title || '';
        if (chapterSummaryInput) chapterSummaryInput.value = chapter.summary || '';
    
        if (chapterScenesList) {
            chapterScenesList.innerHTML = '';
            if (chapter.scenes && Array.isArray(chapter.scenes)) {
                chapter.scenes.forEach((sceneIndex, index) => {
                    const scene = currentBook.scenes[sceneIndex];
                    if (scene) {
                        const li = document.createElement('li');
                        li.setAttribute('data-scene-index', sceneIndex);
                        li.classList.add('scene-item');
                        li.draggable = true;
    
                        const sceneTitle = document.createElement('h4');
                        sceneTitle.textContent = scene.title || 'Untitled Scene';
                        sceneTitle.classList.add('scene-title');
                        sceneTitle.addEventListener('click', () => displaySceneDetails(scene, sceneIndex));
    
                        const sceneSummary = document.createElement('p');
                        sceneSummary.textContent = scene.summary || 'No summary available';
                        sceneSummary.classList.add('scene-summary');
    
                        const moveChapterLabel = document.createElement('label');
                        moveChapterLabel.textContent = 'Move to Chapter: ';
                        moveChapterLabel.classList.add('move-chapter-label');
    
                        const moveChapterSelect = document.createElement('select');
                        moveChapterSelect.classList.add('move-chapter-select');
                        populateChapterSelect(moveChapterSelect, chapterIndex);
                        moveChapterSelect.addEventListener('change', (event) => moveSceneToChapter(sceneIndex, parseInt(event.target.value)));
    
                        li.appendChild(sceneTitle);
                        li.appendChild(sceneSummary);
                        li.appendChild(moveChapterLabel);
                        li.appendChild(moveChapterSelect);
                        chapterScenesList.appendChild(li);
                    } else {
                        console.warn('Scene not found:', sceneIndex);
                    }
                });
    
                // Initialize Sortable
                new Sortable(chapterScenesList, {
                    animation: 150,
                    onEnd: function (evt) {
                        const sceneIndex = parseInt(evt.item.getAttribute('data-scene-index'));
                        const newPosition = evt.newIndex;
                        updateSceneOrder(chapter, sceneIndex, newPosition);
                    }
                });
            }
        }
    
        currentScreen = showScreen('chapterDetails');
    }
    
    function displaySceneDetails(scene, sceneIndex) {
        console.log('Displaying scene details:', scene);
        currentItem = scene;
        currentItemType = 'scene';

        const sceneTitleInput = document.getElementById('sceneTitle');
        const sceneSummaryInput = document.getElementById('sceneSummary');
        const sceneCharactersList = document.getElementById('sceneCharacters');
        const sceneLocationsList = document.getElementById('sceneLocations');
        const scenePlotPointsList = document.getElementById('scenePlotPoints');

        if (sceneTitleInput) sceneTitleInput.value = scene.title || '';
        if (sceneSummaryInput) sceneSummaryInput.value = scene.summary || '';

        // Display and allow adding characters, locations, and plot points
        displayAndAddItems(scene, 'characters', sceneCharactersList, 'addCharacterToScene');
        displayAndAddItems(scene, 'locations', sceneLocationsList, 'addLocationToScene');
        displayAndAddItems(scene, 'plotPoints', scenePlotPointsList, 'addPlotPointToScene');

        // Ensure the back button is properly set up
        const backToChapterButton = document.getElementById('backToChapterFromScene');
        if (backToChapterButton) {
            backToChapterButton.addEventListener('click', navigateBackToChapter);
        }

        currentScreen = showScreen('sceneDetails');
    }
    
    // Helper functions used in the above display functions
    
    function displayRelationshipsForCharacter(character) {
        const relationshipsList = document.getElementById('characterRelationships');
        if (relationshipsList) {
            relationshipsList.innerHTML = '';
            if (character.relationships && Array.isArray(character.relationships)) {
                character.relationships.forEach(rel => {
                    const li = document.createElement('li');
                    li.textContent = `${rel.character1 === character.name ? rel.character2 : rel.character1}: ${rel.type}`;
                    relationshipsList.appendChild(li);
                });
            }
        }
    }
    
    function displayTagsForItem(item, itemType) {
        console.log(`Displaying tags for ${itemType}:`, item.tags);
        const tagsList = document.getElementById(`${itemType}Tags`);
        if (tagsList) {
            tagsList.innerHTML = '';
            if (item.tags && Array.isArray(item.tags)) {
                item.tags.forEach(tag => {
                    const span = document.createElement('span');
                    span.classList.add('tag');
                    
                    const tagText = document.createTextNode(tag);
                    span.appendChild(tagText);
                    
                    // Add remove button for each tag
                    const removeButton = document.createElement('button');
                    removeButton.textContent = '×'; // Using '×' instead of 'x' for a nicer look
                    removeButton.classList.add('remove-tag');
                    removeButton.addEventListener('click', (e) => {
                        e.stopPropagation(); // Prevent event from bubbling up to the tag span
                        removeTagFromItem(itemType, tag);
                    });
                    
                    span.appendChild(removeButton);
                    tagsList.appendChild(span);
                });
            }
        } else {
            console.error(`Tags list element for ${itemType} not found`);
        }
    }


    function removeTagFromItem(itemType, tagToRemove) {
        console.log(`Attempting to remove tag "${tagToRemove}" from ${itemType}`);
        if (currentItem && currentItemType === itemType) {
            currentItem.tags = currentItem.tags.filter(tag => tag !== tagToRemove);
            console.log(`Removed tag "${tagToRemove}" from ${itemType}`, currentItem.tags);
            updateBook(books, currentBook);
            displayTagsForItem(currentItem, itemType);
            populateTagDropdowns(currentBook);
        } else {
            console.error(`Cannot remove tag: currentItem is ${currentItem} and currentItemType is ${currentItemType}`);
        }
    }

    
    function displayNotesForItem(item, itemType) {
        const notesList = document.getElementById(`${itemType}Notes`);
        if (notesList) {
            notesList.innerHTML = '';
            if (item.notes && Array.isArray(item.notes)) {
                item.notes.forEach(note => {
                    const li = document.createElement('li');
                    li.textContent = note.title;
                    li.addEventListener('click', () => {
                        currentItem = note;
                        currentItemType = 'note';
                        displayNoteDetails(note);
                    });
                    notesList.appendChild(li);
                });
            }
        }
    }
    
    function displayAndAddItems(scene, itemType, listElement, selectId) {
        listElement.innerHTML = '';
        const select = document.getElementById(selectId);
        select.innerHTML = `<option value="">Add a ${itemType.slice(0, -1)}</option>`;
    
        const items = currentBook[itemType] || [];
        items.forEach(item => {
            const itemName = item.name || item.title;
            const option = document.createElement('option');
            option.value = itemName;
            option.textContent = itemName;
            select.appendChild(option);
    
            if (scene[itemType].includes(itemName)) {
                const div = document.createElement('div');
                div.textContent = itemName;
                div.classList.add('tag');
                const removeButton = document.createElement('span');
                removeButton.textContent = '×';
                removeButton.classList.add('remove-tag');
                removeButton.addEventListener('click', () => removeItemFromScene(scene, itemType, itemName));
                div.appendChild(removeButton);
                listElement.appendChild(div);
            }
        });
    
        select.addEventListener('change', (event) => {
            if (event.target.value) {
                addItemToScene(scene, itemType, event.target.value);
                event.target.value = '';
            }
        });
    }

    const importButton = document.getElementById('importBookButton');
    const importInput = document.getElementById('importBook');
    if (importButton && importInput) {
        importButton.addEventListener('click', function () {
            importInput.click();
        });

        importInput.addEventListener('change', function (event) {
            const file = event.target.files[0];
            if (file) {
                dataManager.importFromJSON(file)
                    .then(importedBook => {
                        console.log('Imported book:', importedBook); // Log the imported book for debugging
                        if (importedBook && typeof importedBook === 'object' && importedBook.name) {
                            books.push(importedBook);
                            books = updateBook(books, importedBook);
                            alert('Book imported successfully');
                            displayBooks(books);
                        } else {
                            throw new Error('Invalid book data: The imported data does not have the expected structure.');
                        }
                    })
                    .catch(error => {
                        console.error('Import error:', error); // Log the full error for debugging
                        alert(`Import failed: ${error.message}`);
                    });
            }
        });
    }

    function addTagToItem(itemType, tag) {
        console.log(`Attempting to add tag "${tag}" to ${itemType}`);
        if (currentItem && currentItemType === itemType) {
            if (!currentItem.tags) currentItem.tags = [];
            if (!currentItem.tags.includes(tag)) {
                currentItem.tags.push(tag);
                console.log(`Added tag "${tag}" to ${itemType}`, currentItem.tags);
                
                // Add the tag to the book's overall tag list if it's not already there
                if (!currentBook.tags.includes(tag)) {
                    currentBook.tags.push(tag);
                    console.log(`Added tag "${tag}" to book's tag list`, currentBook.tags);
                }

                updateBook(books, currentBook);
                displayTagsForItem(currentItem, itemType);
                populateTagDropdowns(currentBook);
            } else {
                console.log(`Tag "${tag}" already exists on ${itemType}`);
            }
        } else {
            console.error(`Cannot add tag: currentItem is ${currentItem} and currentItemType is ${currentItemType}`);
        }
    }

    function setupAddTagButton(buttonId, selectId, inputId, itemType) {
        const addTagButton = document.getElementById(buttonId);
        if (addTagButton) {
            addTagButton.addEventListener('click', function () {
                const tagSelect = document.getElementById(selectId);
                const tagInput = document.getElementById(inputId);
                if (tagSelect && tagInput) {
                    let tag = tagSelect.value;
                    if (tag === '') {
                        tag = tagInput.value.trim();
                    }
                    if (tag) {
                        console.log(`Add tag button clicked. Selected tag: "${tag}"`);
                        addTagToItem(itemType, tag);
                        tagSelect.value = '';
                        tagInput.value = '';
                    } else {
                        console.log('No tag selected or entered');
                    }
                } else {
                    console.error(`Tag select (${selectId}) or input (${inputId}) not found`);
                }
            });
        } else {
            console.error(`Add tag button (${buttonId}) not found`);
        }
    }

    const editNoteButton = document.getElementById('editNote');
    if (editNoteButton) {
        editNoteButton.addEventListener('click', function () {
            if (currentItem && currentItemType === 'note') {
                console.log('Editing note:', currentItem);
                openNoteEditor(currentItem);
            } else {
                console.error('No current note to edit or wrong item type');
            }
        });
    }

    // Set up Add Tag buttons for different screens
    setupAddTagButton('addTagToBook', 'tagSelect', 'newTagName', 'book');
    setupAddTagButton('addTagToCharacter', 'characterTagSelect', 'characterTagInput', 'character');
    setupAddTagButton('addTagToLocation', 'locationTagSelect', 'locationTagInput', 'location');
    setupAddTagButton('addTagToPlotPoint', 'plotPointTagSelect', 'plotPointTagInput', 'plotPoint');

    // Event Listeners
    const addCharacterButton = document.getElementById('addCharacter');
if (addCharacterButton) {
    addCharacterButton.addEventListener('click', function () {
        const newCharacterNameInput = document.getElementById('newCharacterName');
        if (newCharacterNameInput) {
            const characterName = newCharacterNameInput.value.trim();
            if (characterName && currentBook) {
                addCharacter(currentBook, characterName);
                newCharacterNameInput.value = '';
            }
        }
    });
}

const addLocationButton = document.getElementById('addLocation');
if (addLocationButton) {
    addLocationButton.addEventListener('click', function () {
        const newLocationNameInput = document.getElementById('newLocationName');
        if (newLocationNameInput) {
            const locationName = newLocationNameInput.value.trim();
            if (locationName && currentBook) {
                addLocation(currentBook, locationName);
                newLocationNameInput.value = '';
            }
        }
    });
}

const addPlotPointButton = document.getElementById('addPlotPoint');
if (addPlotPointButton) {
    addPlotPointButton.addEventListener('click', function () {
        const newPlotPointInput = document.getElementById('newPlotPoint');
        if (newPlotPointInput) {
            const plotPointTitle = newPlotPointInput.value.trim();
            if (plotPointTitle && currentBook) {
                addPlotPoint(currentBook, plotPointTitle);
                newPlotPointInput.value = '';
            }
        }
    });
}

const addTagButton = document.getElementById('addTag');
if (addTagButton) {
    addTagButton.addEventListener('click', function () {
        const tagSelect = document.getElementById('tagSelect');
        const newTagInput = document.getElementById('newTagName');
        if (tagSelect && newTagInput) {
            const tagName = (tagSelect.value === '' ? newTagInput.value : tagSelect.value).trim();
            if (tagName && currentBook) {
                if (!currentBook.tags.includes(tagName)) {
                    currentBook.tags.push(tagName);
                    updateBook(books, currentBook);
                    displayBookDetails(currentBook);
                    populateTagDropdowns(currentBook);
                }
                tagSelect.value = '';
                newTagInput.value = '';
            }
        }
    });
}

const addRelationshipButton = document.getElementById('addRelationship');
if (addRelationshipButton) {
    addRelationshipButton.addEventListener('click', function () {
        const character1Select = document.getElementById('character1');
        const character2Select = document.getElementById('character2');
        const relationshipTypeSelect = document.getElementById('relationshipType');
        const customRelationshipTypeInput = document.getElementById('customRelationshipType');

        if (character1Select && character2Select && relationshipTypeSelect) {
            const character1 = character1Select.value;
            const character2 = character2Select.value;
            let relationshipType = relationshipTypeSelect.value;

            if (relationshipType === 'other') {
                relationshipType = customRelationshipTypeInput.value.trim();
            }

            if (character1 && character2 && relationshipType && currentBook) {
                addRelationship(currentBook, character1, character2, relationshipType);
                character1Select.value = '';
                character2Select.value = '';
                relationshipTypeSelect.value = '';
                customRelationshipTypeInput.value = '';
                customRelationshipTypeInput.style.display = 'none';
            }
        }
    });
}

const addNoteButton = document.getElementById('addNote');
    if (addNoteButton) {
        addNoteButton.addEventListener('click', function () {
            const newNoteTitleInput = document.getElementById('newNoteTitle');
            if (newNoteTitleInput && currentBook) {
                const noteTitle = newNoteTitleInput.value.trim();
                if (noteTitle) {
                    const newNote = addNote(currentBook, noteTitle, '');
                    newNoteTitleInput.value = '';
                    openNoteEditor(newNote);
                }
            }
        });
    }

const addChapterButton = document.getElementById('addChapter');
if (addChapterButton) {
    addChapterButton.addEventListener('click', function () {
        const newChapterTitleInput = document.getElementById('newChapterTitle');
        if (newChapterTitleInput && currentBook) {
            const chapterTitle = newChapterTitleInput.value.trim();
            if (chapterTitle) {
                const newChapter = addChapter(currentBook, chapterTitle);
                newChapterTitleInput.value = '';
                displayChapterDetails(newChapter, currentBook.chapters.length - 1);
                displayBookDetails(currentBook);
            }
        }
    });
}

const addSceneButton = document.getElementById('addScene');
if (addSceneButton) {
    addSceneButton.addEventListener('click', function () {
        const newSceneTitleInput = document.getElementById('newSceneTitle');
        if (newSceneTitleInput && currentBook) {
            const sceneTitle = newSceneTitleInput.value.trim();
            if (sceneTitle) {
                const chapterIndex = currentBook.chapters.indexOf(currentItem);
                const newScene = addScene(currentBook, chapterIndex, sceneTitle);
                newSceneTitleInput.value = '';
                displaySceneDetails(newScene, currentBook.scenes.length - 1);
            }
        }
    });
}

const saveCharacterButton = document.getElementById('saveCharacter');
if (saveCharacterButton) {
    saveCharacterButton.addEventListener('click', function () {
        if (currentItem && currentItemType === 'character') {
            currentItem.name = document.getElementById('characterName').value;
            currentItem.nickname = document.getElementById('characterNickname').value;
            currentItem.description = document.getElementById('characterDescription').value;
            currentItem.scene = document.getElementById('characterScene').value;
            currentItem.type = document.getElementById('characterType').value;
            updateBook(books, currentBook);
            displayCharacters(currentBook.characters);
            currentScreen = showScreen('bookDetails');
        }
    });
}

const saveLocationButton = document.getElementById('saveLocation');
if (saveLocationButton) {
    saveLocationButton.addEventListener('click', function () {
        if (currentItem && currentItemType === 'location') {
            currentItem.name = document.getElementById('locationName').value;
            currentItem.description = document.getElementById('locationDescription').value;
            currentItem.importance = document.getElementById('locationImportance').value;
            updateBook(books, currentBook);
            displayLocations(currentBook.locations);
            currentScreen = showScreen('bookDetails');
        }
    });
}

const savePlotPointButton = document.getElementById('savePlotPoint');
if (savePlotPointButton) {
    savePlotPointButton.addEventListener('click', function () {
        if (currentItem && currentItemType === 'plotPoint') {
            currentItem.title = document.getElementById('plotPointTitle').value;
            currentItem.description = document.getElementById('plotPointDescription').value;
            currentItem.characters = document.getElementById('plotPointCharacters').value;
            currentItem.location = document.getElementById('plotPointLocation').value;
            updateBook(books, currentBook);
            displayPlotPoints(currentBook.plotPoints);
            currentScreen = showScreen('bookDetails');
        }
    });
}

const saveChapterButton = document.getElementById('saveChapter');
if (saveChapterButton) {
    saveChapterButton.addEventListener('click', function () {
        if (currentItem && currentItemType === 'chapter') {
            currentItem.title = document.getElementById('chapterTitle').value;
            currentItem.summary = document.getElementById('chapterSummary').value;
            updateBook(books, currentBook);
            displayChapters(currentBook.chapters);
            currentScreen = showScreen('bookDetails');
        }
    });
}

const saveSceneButton = document.getElementById('saveScene');
if (saveSceneButton) {
    saveSceneButton.addEventListener('click', function () {
        console.log('Save Scene button clicked');
        if (currentItemType === 'scene') {
            const sceneIndex = currentBook.scenes.indexOf(currentItem);
            if (saveSceneDetails(sceneIndex)) {
                console.log('Scene saved successfully');
                // Navigate back to Chapter Details
                const chapterIndex = currentBook.chapters.findIndex(chapter =>
                    chapter.scenes && chapter.scenes.includes(sceneIndex)
                );
                if (chapterIndex !== -1) {
                    displayChapterDetails(currentBook.chapters[chapterIndex], chapterIndex);
                } else {
                    console.error('Could not find the chapter for this scene');
                    currentScreen = showScreen('bookDetails');
                }
            } else {
                console.error('Failed to save scene');
            }
        } else {
            console.error('No current scene to save or wrong item type');
        }
    });
}

const updateWordCountButton = document.getElementById('updateWordCount');
if (updateWordCountButton) {
    updateWordCountButton.addEventListener('click', function () {
        if (currentBook) {
            const newWordCountInput = document.getElementById('newWordCount');
            const newTargetWordCountInput = document.getElementById('newTargetWordCount');
            if (newWordCountInput && newTargetWordCountInput) {
                const newWordCount = parseInt(newWordCountInput.value);
                const newTargetWordCount = parseInt(newTargetWordCountInput.value);

                if (!isNaN(newWordCount)) {
                    currentBook.wordCount = newWordCount;
                }
                if (!isNaN(newTargetWordCount)) {
                    currentBook.targetWordCount = newTargetWordCount;
                }

                updateBook(books, currentBook);
                displayWordCount(currentBook);
                newWordCountInput.value = '';
                newTargetWordCountInput.value = '';
            }
        }
    });
}

const viewRelationshipGraphButton = document.getElementById('viewRelationshipGraph');
if (viewRelationshipGraphButton) {
    viewRelationshipGraphButton.addEventListener('click', function () {
        if (currentBook) {
            showRelationshipGraph(currentBook);
        }
    });
}

// Navigation
document.querySelectorAll('.backToBook, .backToChapter').forEach(button => {
    if (button) {
        button.addEventListener('click', function () {
            if (currentScreen === 'sceneDetails') {
                navigateBackToChapter();
            } else {
                currentScreen = showScreen('bookDetails');
            }
        });
    }
});

document.querySelectorAll('.backToBook').forEach(button => {
    if (button) {
        button.addEventListener('click', function () {
            if (currentScreen === 'sceneDetails') {
                navigateBackToChapter();
            } else {
                currentScreen = showScreen('bookDetails');
            }
        });
    }
});

// Helper Functions
function addCharacter(book, characterName) {
    const newCharacter = {
        name: characterName,
        nickname: '',
        description: '',
        scene: '',
        type: '',
        relationships: [],
        notes: [],
        tags: []
    };
    book.characters.push(newCharacter);
    updateBook(books, book);
    displayCharacters(book.characters);
    populateCharacterDropdowns();
    return newCharacter;
}

function addLocation(book, locationName) {
    const newLocation = {
        name: locationName,
        description: '',
        importance: '',
        notes: [],
        tags: []
    };
    book.locations.push(newLocation);
    updateBook(books, book);
    displayLocations(book.locations);
    return newLocation;
}

function addPlotPoint(book, plotPointTitle) {
    const newPlotPoint = {
        title: plotPointTitle,
        description: '',
        characters: '',
        location: '',
        notes: [],
        tags: []
    };
    book.plotPoints.push(newPlotPoint);
    updateBook(books, book);
    displayPlotPoints(book.plotPoints);
    return newPlotPoint;
}

function addRelationship(book, character1, character2, relationshipType) {
    const relationship = {
        character1,
        character2,
        type: relationshipType
    };
    book.relationships.push(relationship);

    const addRelationshipToCharacter = (charName) => {
        const char = book.characters.find(c => c.name === charName);
        if (char) {
            if (!char.relationships) char.relationships = [];
            char.relationships.push(relationship);
        }
    };

    addRelationshipToCharacter(character1);
    addRelationshipToCharacter(character2);

    updateBook(books, book);
    displayBookDetails(book);
}

function addNote(book, title, content = '') {
    console.log('Adding new note to book:', book.name);
    const newNote = {
        id: Date.now(), // Add a unique identifier
        title: title,
        content: content,
        createdAt: new Date().toISOString()
    };

    if (!book.notes) {
        book.notes = [];
    }

    book.notes.push(newNote);
    console.log('New note added:', newNote);

    updateBook(books, book);
    console.log('Book updated with new note');

    displayNotes(book.notes);
    console.log('Notes display updated');

    return newNote; // Return the new note
}

function addChapter(book, chapterTitle) {
    if (!book.chapters) book.chapters = [];
    const newChapter = {
        title: chapterTitle,
        summary: '',
        scenes: []
    };
    book.chapters.push(newChapter);
    updateBook(books, book);
    displayChapters(book.chapters);
    return newChapter;
}

function addScene(book, chapterIndex, sceneTitle) {
    if (!book.scenes) book.scenes = [];
    const newScene = {
        title: sceneTitle,
        summary: '',
        characters: [],
        locations: [],
        plotPoints: []
    };
    const newSceneIndex = book.scenes.push(newScene) - 1;

    if (!book.chapters[chapterIndex]) {
        console.error('Chapter not found at index:', chapterIndex);
        chapterIndex = 0; // Fallback to the first chapter
    }
    if (!book.chapters[chapterIndex].scenes) {
        book.chapters[chapterIndex].scenes = [];
    }
    book.chapters[chapterIndex].scenes.push(newSceneIndex);

    updateBook(books, book);
    displayChapterDetails(book.chapters[chapterIndex], chapterIndex);
    return newScene;
}

function navigateBackToChapter() {
    if (currentBook && currentItem) {
        const sceneIndex = currentBook.scenes.indexOf(currentItem);
        const chapterIndex = currentBook.chapters.findIndex(chapter =>
            chapter.scenes && chapter.scenes.includes(sceneIndex)
        );
        if (chapterIndex !== -1) {
            displayChapterDetails(currentBook.chapters[chapterIndex], chapterIndex);
        } else {
            console.warn('Chapter not found for this scene. Returning to book details.');
            currentScreen = showScreen('bookDetails');
        }
    } else {
        currentScreen = showScreen('bookDetails');
    }
}

function saveSceneDetails(sceneIndex) {
    console.log('Saving scene details for index:', sceneIndex);

    try {
        let scene = currentBook.scenes[sceneIndex];
        if (!scene) {
            console.error('Scene not found at index:', sceneIndex);
            return false;
        }

        scene.title = document.getElementById('sceneTitle').value;
        scene.summary = document.getElementById('sceneSummary').value;

        // Save characters, locations, and plot points
        scene.characters = Array.from(document.getElementById('sceneCharacters').children).map(div => div.textContent.replace('×', '').trim());
        scene.locations = Array.from(document.getElementById('sceneLocations').children).map(div => div.textContent.replace('×', '').trim());
        scene.plotPoints = Array.from(document.getElementById('scenePlotPoints').children).map(div => div.textContent.replace('×', '').trim());

        console.log('Updated scene:', scene);

        updateBook(books, currentBook);
        console.log('Book updated with new scene details');

        return true;
    } catch (error) {
        console.error('Error saving scene details:', error);
        return false;
    }
}

function showRelationshipGraph(book) {
    const graph = new RelationshipGraph(book);
    graph.show();
    currentScreen = showScreen('relationshipGraph');
}

function openNoteEditor(note) {
    console.log('Opening note editor for:', note);
    if (!note) {
        console.warn('No note provided, creating a new one');
        note = { id: Date.now(), title: '', content: '' };
    }
    currentItem = note;
    currentItemType = 'note';

    richTextEditor.setNote(note);
    richTextEditor.show();

    // Remove previous event listeners to avoid duplicates
    richTextEditor.clearEventListeners();

    richTextEditor.onSave((updatedNote) => {
        console.log('Saving updated note:', updatedNote);
        if (updatedNote) {
            saveNote(updatedNote);
        } else {
            console.error('Attempted to save null note');
        }
    });

    richTextEditor.onCancel(() => {
        console.log('Note editing cancelled');
        currentScreen = showScreen('bookDetails');
    });

    currentScreen = showScreen('noteEditor');
    console.log('Note editor opened');
}

function saveNote(updatedNote) {
    if (!updatedNote) {
        console.error('Attempted to save null note');
        return;
    }
    if (!currentBook.notes) {
        currentBook.notes = [];
    }
    const index = currentBook.notes.findIndex(n => n.id === updatedNote.id);
    if (index === -1) {
        console.log('Adding new note to book');
        currentBook.notes.push(updatedNote);
    } else {
        console.log('Updating existing note at index:', index);
        currentBook.notes[index] = updatedNote;
    }
    updateBook(books, currentBook);
    displayNotes(currentBook.notes);
    currentScreen = showScreen('bookDetails');
}

// Additional utility functions

function populateChapterSelect(select, currentChapterIndex) {
    select.innerHTML = '';
    currentBook.chapters.forEach((chapter, index) => {
        const option = document.createElement('option');
        option.value = index;
        option.textContent = chapter.title || `Chapter ${index + 1}`;
        if (index === currentChapterIndex) {
            option.selected = true;
        }
        select.appendChild(option);
    });
}

function moveSceneToChapter(sceneIndex, newChapterIndex) {
    const oldChapterIndex = currentBook.chapters.findIndex(chapter =>
        chapter.scenes && chapter.scenes.includes(sceneIndex)
    );

    if (oldChapterIndex !== -1 && oldChapterIndex !== newChapterIndex) {
        // Remove scene from old chapter
        currentBook.chapters[oldChapterIndex].scenes = currentBook.chapters[oldChapterIndex].scenes.filter(s => s !== sceneIndex);

        // Add scene to new chapter
        if (!currentBook.chapters[newChapterIndex].scenes) {
            currentBook.chapters[newChapterIndex].scenes = [];
        }
        currentBook.chapters[newChapterIndex].scenes.push(sceneIndex);

        updateBook(books, currentBook);
        displayChapterDetails(currentBook.chapters[newChapterIndex], newChapterIndex);
    }
}

function updateSceneOrder(chapter, sceneIndex, newPosition) {
    const currentPosition = chapter.scenes.indexOf(sceneIndex);
    if (currentPosition !== -1 && currentPosition !== newPosition) {
        chapter.scenes.splice(currentPosition, 1);
        chapter.scenes.splice(newPosition, 0, sceneIndex);
        updateBook(books, currentBook);
    }
}

const addBookButton = document.getElementById('addBook');
if (addBookButton) {
    addBookButton.addEventListener('click', function () {
        const newBookNameInput = document.getElementById('newBookName');
        if (newBookNameInput) {
            const bookName = newBookNameInput.value.trim();
            if (bookName) {
                addBook(bookName);
                newBookNameInput.value = '';
            }
        }
    });
}

const exportButton = document.getElementById('exportBook');
if (exportButton) {
    exportButton.addEventListener('click', function () {
        if (currentBook) {
            dataManager.setCurrentBook(currentBook);
            dataManager.exportToJSON();
        } else {
            alert('No book is currently selected');
        }
    });
}

// Initialize event listeners for rich text editor
richTextEditor.initializeEventListeners();

    // ... (other event listeners)

    // Utility Functions
    function populateCharacterDropdowns() {
        const character1Select = document.getElementById('character1');
        const character2Select = document.getElementById('character2');

        if (character1Select && character2Select && currentBook) {
            const characters = currentBook.characters;

            [character1Select, character2Select].forEach(select => {
                select.innerHTML = '<option value="">Select a character</option>';
                characters.forEach(character => {
                    const option = document.createElement('option');
                    option.value = character.name;
                    option.textContent = character.name;
                    select.appendChild(option);
                });
            });
        }
    }

    // ... (other utility functions)

    // Initialize event listeners for rich text editor
    richTextEditor.initializeEventListeners();
});