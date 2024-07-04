import { RelationshipGraph } from './RelationshipGraph.js';

document.addEventListener('DOMContentLoaded', function() {
    let books = [];
    let currentBook = null;
    let currentItem = null;
    let currentScreen = 'bookList';
    let currentItemType = null;
  
    // Load initial state
    chrome.storage.sync.get(['books', 'currentState'], function(result) {
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
                    showScreen(currentScreen);
                }
            } else {
                showScreen('bookList');
            }
        } else {
            showScreen('bookList');
        }

        populateCharacterDropdowns();
    });
  
    // Utility Functions
    function showScreen(screenId) {
        console.log('Showing screen:', screenId);
        const screens = ['bookList', 'bookDetails', 'characterDetails', 'locationDetails', 'plotPointDetails', 'noteDetails', 'chapterDetails', 'sceneDetails', 'taggedItems', 'relationshipGraph'];
        screens.forEach(screen => {
            const screenElement = document.getElementById(screen);
            if (screenElement) {
                screenElement.style.display = screen === screenId ? 'block' : 'none';
            } else {
                console.warn(`Screen element not found: ${screen}`);
            }
        });
        currentScreen = screenId;
        saveCurrentState();
    }
  
    function saveCurrentState() {
        const currentState = { 
            currentBook, 
            currentItem, 
            currentScreen, 
            currentItemType 
        };
        chrome.storage.sync.set({ currentState: currentState }, function() {
            console.log('State saved:', currentState);
        });
    }
  
    function updateBooks(updatedBooks) {
        books = updatedBooks;
        chrome.storage.sync.set({ books: books }, function() {
            console.log('Books updated');
            displayBooks(books);
        });
    }
  
    function updateBook(updatedBook) {
        const index = books.findIndex(book => book.name === updatedBook.name);
        if (index !== -1) {
            books[index] = updatedBook;
            chrome.storage.sync.set({ books: books }, function() {
                console.log('Book updated in storage');
                if (currentBook && currentBook.name === updatedBook.name) {
                    currentBook = updatedBook;
                    console.log('Current book updated');
                }
            });
        } else {
            console.error('Book not found in books array');
        }
    }
  
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
                    showScreen('bookDetails');
                });
                bookList.appendChild(li);
            });
        }
    }
    // Add event listener for save button
    const saveSceneButton = document.getElementById('saveScene');
if (saveSceneButton) {
    saveSceneButton.addEventListener('click', function() {
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
                    showScreen('bookDetails');
                }
            } else {
                console.error('Failed to save scene');
            }
        } else {
            console.error('No current scene to save or wrong item type');
        }
    });
} else {
    console.error('Save Scene button not found');
}
  
    const addBookButton = document.getElementById('addBook');
    if (addBookButton) {
        addBookButton.addEventListener('click', function() {
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
      updateBooks(books);
      }
  
    // Book Details Functions
    function displayBookDetails(book) {
      const bookTitleElement = document.getElementById('bookTitle');
      if (bookTitleElement) {
          bookTitleElement.textContent = book.name;
      }
      
      const chaptersList = document.getElementById('chapters');
      if (chaptersList) {
          chaptersList.innerHTML = '';
          book.chapters.forEach((chapter, index) => {
              const chapterLi = document.createElement('li');
              chapterLi.textContent = chapter.title;
              chapterLi.addEventListener('click', () => showItemDetails('chapter', chapter, index));
              chaptersList.appendChild(chapterLi);
          });
      }
      populateCharacterDropdowns();
      displayCharacters(book.characters);
      displayLocations(book.locations);
      displayPlotPoints(book.plotPoints);
      displayTags(book.tags);
      displayRelationships(book.relationships);
      displayNotes(book.notes);
      displayWordCount(book);
      populateTagDropdowns();
      showScreen('bookDetails');
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
  
  function displayScenes(scenes) {
      const sceneList = document.getElementById('scenes');
      if (sceneList) {
          sceneList.innerHTML = '';
          scenes.forEach(scene => {
              const li = document.createElement('li');
              li.textContent = scene.title;
              li.addEventListener('click', () => showItemDetails('scene', scene));
              sceneList.appendChild(li);
          });
      }
  }
  
  
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
        const noteList = document.getElementById('notes');
        if (noteList) {
            noteList.innerHTML = '';
            notes.forEach(note => {
                const li = document.createElement('li');
                li.textContent = note.title;
                li.addEventListener('click', () => showItemDetails('note', note));
                noteList.appendChild(li);
            });
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
  
    // Add new items
    const addCharacterButton = document.getElementById('addCharacter');
    if (addCharacterButton) {
        addCharacterButton.addEventListener('click', function() {
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
        addLocationButton.addEventListener('click', function() {
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
        addPlotPointButton.addEventListener('click', function() {
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
        addTagButton.addEventListener('click', function() {
            const tagSelect = document.getElementById('tagSelect');
            const newTagInput = document.getElementById('newTagName');
            if (tagSelect && newTagInput) {
                const tagName = (tagSelect.value === '' ? newTagInput.value : tagSelect.value).trim();
                if (tagName && currentBook) {
                    if (!currentBook.tags.includes(tagName)) {
                        currentBook.tags.push(tagName);
                        updateBook(currentBook);
                        displayBookDetails(currentBook);
                        populateTagDropdowns();
                    }
                    tagSelect.value = '';
                    newTagInput.value = '';
                }
            }
        });
    }
  
    const addRelationshipButton = document.getElementById('addRelationship');
if (addRelationshipButton) {
    addRelationshipButton.addEventListener('click', function() {
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
        addNoteButton.addEventListener('click', function() {
            const newNoteTitleInput = document.getElementById('newNoteTitle');
            const newNoteContentInput = document.getElementById('newNoteContent');
            if (newNoteTitleInput && newNoteContentInput) {
                const noteTitle = newNoteTitleInput.value.trim();
                const noteContent = newNoteContentInput.value.trim();
                if (noteTitle && noteContent && currentBook) {
                    addNote(currentBook, noteTitle, noteContent);
                    newNoteTitleInput.value = '';
                    newNoteContentInput.value = '';
                }
            }
        });
    }
  
    const addChapterButton = document.getElementById('addChapter');
if (addChapterButton) {
    addChapterButton.addEventListener('click', function() {
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
    addSceneButton.addEventListener('click', function() {
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

const saveChapterButton = document.getElementById('saveChapter');
if (saveChapterButton) {
    saveChapterButton.addEventListener('click', function() {
        if (currentItem && currentItemType === 'chapter') {
            currentItem.title = document.getElementById('chapterTitle').value;
            currentItem.summary = document.getElementById('chapterSummary').value;
            updateBook(currentBook);
            displayChapters(currentBook.chapters);
            showScreen('bookDetails');
        }
    });
}

// Add this event listener in the DOMContentLoaded event
const backToChapterFromSceneButton = document.getElementById('backToChapterFromScene');
    if (backToChapterFromSceneButton) {
        backToChapterFromSceneButton.addEventListener('click', function() {
            navigateBackToChapter();
        });
    }

function addChapter(book, chapterTitle) {
    if (!book.chapters) book.chapters = [];
    const newChapter = {
        title: chapterTitle,
        summary: '',
        scenes: []
    };
    book.chapters.push(newChapter);
    updateBook(book);
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
    
    updateBook(book);
    return newScene;
}

function displaySceneDetails(scene, sceneIndex) {
    console.log('Displaying scene details:', scene, 'Index:', sceneIndex);
    try {
        currentItem = scene;
        currentItemType = 'scene';

        const sceneTitleInput = document.getElementById('sceneTitle');
        const sceneSummaryInput = document.getElementById('sceneSummary');
        const sceneCharactersList = document.getElementById('sceneCharacters');
        const sceneLocationsList = document.getElementById('sceneLocations');
        const scenePlotPointsList = document.getElementById('scenePlotPoints');

        if (!sceneTitleInput) throw new Error('sceneTitle input not found');
        if (!sceneSummaryInput) throw new Error('sceneSummary input not found');
        if (!sceneCharactersList) throw new Error('sceneCharacters list not found');
        if (!sceneLocationsList) throw new Error('sceneLocations list not found');
        if (!scenePlotPointsList) throw new Error('scenePlotPoints list not found');

        sceneTitleInput.value = scene ? (scene.title || '') : '';
        sceneSummaryInput.value = scene ? (scene.summary || '') : '';

        if (scene) {
            // Display and allow adding characters, locations, and plot points
            displayAndAddItems(scene, 'characters', sceneCharactersList, 'addCharacterToScene');
            displayAndAddItems(scene, 'locations', sceneLocationsList, 'addLocationToScene');
            displayAndAddItems(scene, 'plotPoints', scenePlotPointsList, 'addPlotPointToScene');
        } else {
            // Clear lists for new scene
            [sceneCharactersList, sceneLocationsList, scenePlotPointsList].forEach(list => {
                list.innerHTML = '';
            });
        }

        // Add event listener for save button
        const saveSceneButton = document.getElementById('saveScene');
        if (saveSceneButton) {
            saveSceneButton.addEventListener('click', function() {
                console.log('Save Scene button clicked');
                if (currentItem && currentItemType === 'scene') {
                    const sceneIndex = currentBook.scenes.findIndex(s => s === currentItem);
                    if (sceneIndex !== -1) {
                        saveSceneDetails(sceneIndex);
                        console.log('Scene saved successfully');
                        // Refresh the scene details display
                        displaySceneDetails(currentItem, sceneIndex);
                    } else {
                        console.error('Scene not found in the book');
                    }
                } else {
                    console.error('No current scene to save or wrong item type');
                }
            });
        } else {
            console.error('Save Scene button not found');
        }

        showScreen('sceneDetails');
    } catch (error) {
        console.error('Error in displaySceneDetails:', error);
        alert('An error occurred while displaying scene details. Please check the console for more information.');
    }
}

function saveSceneDetails(sceneIndex) {
    console.log('Saving scene details for index:', sceneIndex);
    
    try {
        let scene;
        if (sceneIndex === -1) {
            console.log('Creating a new scene.');
            scene = {};
            sceneIndex = currentBook.scenes.push(scene) - 1;
        } else {
            scene = currentBook.scenes[sceneIndex];
        }

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

        // Find the chapter that contains this scene
        let chapterIndex = currentBook.chapters.findIndex(chapter => 
            chapter.scenes && chapter.scenes.includes(sceneIndex)
        );
        
        if (chapterIndex === -1) {
            console.log('Scene not found in any chapter. Adding to the current chapter.');
            chapterIndex = currentBook.chapters.indexOf(currentItem);
            if (chapterIndex === -1) {
                console.warn('Current chapter not found. Adding to the first chapter.');
                chapterIndex = 0;
            }
            if (!currentBook.chapters[chapterIndex].scenes) {
                currentBook.chapters[chapterIndex].scenes = [];
            }
            if (!currentBook.chapters[chapterIndex].scenes.includes(sceneIndex)) {
                currentBook.chapters[chapterIndex].scenes.push(sceneIndex);
            }
        }

        updateBook(currentBook);
        console.log('Book updated with new scene details');
        return true;
    } catch (error) {
        console.error('Error saving scene details:', error);
        return false;
    }
}

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
    updateBook(book);
    displayCharacters(book.characters);
    populateCharacterDropdowns(); // Add this line
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
    updateBook(book);
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
    updateBook(book);
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

  updateBook(book);
  displayBookDetails(book);
}

document.getElementById('relationshipType').addEventListener('change', function() {
  const customInput = document.getElementById('customRelationshipType');
  customInput.style.display = this.value === 'other' ? 'block' : 'none';
});

function addNote(book, noteTitle, noteContent) {
    const newNote = {
        title: noteTitle,
        content: noteContent
    };
    book.notes.push(newNote);
    updateBook(book);
    displayNotes(book.notes);
    return newNote;
}

// Item Details Functions
function showItemDetails(itemType, item, index) {
    console.log(`Showing details for ${itemType}:`, item);
    try {
        currentItem = item;
        currentItemType = itemType;
        switch(itemType) {
            case 'character':
                displayCharacterDetails(item);
                break;
            case 'location':
                displayLocationDetails(item);
                break;
            case 'plotPoint':
                displayPlotPointDetails(item);
                break;
            case 'note':
                displayNoteDetails(item);
                break;
            case 'chapter':
                displayChapterDetails(item, index);
                break;
            case 'scene':
                displaySceneDetails(item, index);
                break;
            default:
                console.error('Unknown item type:', itemType);
        }
        // Update currentScreen based on itemType
        currentScreen = `${itemType}Details`;
        saveCurrentState();
    } catch (error) {
        console.error(`Error displaying ${itemType} details:`, error);
        alert(`An error occurred while displaying ${itemType} details. Please check the console for more information.`);
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
            chapter.scenes.forEach((sceneIndex) => {
                const scene = currentBook.scenes[sceneIndex];
                if (scene) {
                    const li = document.createElement('li');
                    li.textContent = scene.title || 'Untitled Scene';
                    li.addEventListener('click', () => displaySceneDetails(scene, sceneIndex));
                    chapterScenesList.appendChild(li);
                } else {
                    console.warn('Scene not found:', sceneIndex);
                }
            });
        }
    }

    showScreen('chapterDetails');
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

    showScreen('sceneDetails');
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

function addItemToScene(scene, itemType, itemName) {
  if (!scene[itemType].includes(itemName)) {
      scene[itemType].push(itemName);
      updateBook(currentBook);
      refreshSceneDetails(scene);
  }
}

function removeItemFromScene(scene, itemType, itemName) {
  scene[itemType] = scene[itemType].filter(item => item !== itemName);
  updateBook(currentBook);
  refreshSceneDetails(scene);
}

function refreshSceneDetails(scene) {
    const sceneIndex = currentBook.scenes.findIndex(s => s === scene);
    if (sceneIndex !== -1) {
        displaySceneDetails(scene, sceneIndex);
    } else {
        console.error('Scene not found in the book');
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

    showScreen('characterDetails');
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

    showScreen('locationDetails');
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

    showScreen('plotPointDetails');
}

function displayNoteDetails(note) {
    const noteTitleElement = document.getElementById('noteTitle');
    const noteContentElement = document.getElementById('noteContent');
    if (noteTitleElement) noteTitleElement.textContent = note.title;
    if (noteContentElement) noteContentElement.textContent = note.content;
    showScreen('noteDetails');
}

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
    const tagsList = document.getElementById(`${itemType}Tags`);
    if (tagsList) {
        tagsList.innerHTML = '';
        if (item.tags && Array.isArray(item.tags)) {
            item.tags.forEach(tag => {
                const span = document.createElement('span');
                span.textContent = tag;
                span.classList.add('tag');
                tagsList.appendChild(span);
            });
        }
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
                li.addEventListener('click', () => displayNoteDetails(note));
                notesList.appendChild(li);
            });
        }
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

  showScreen('taggedItems');
}

// Save item details
const saveCharacterButton = document.getElementById('saveCharacter');
if (saveCharacterButton) {
    saveCharacterButton.addEventListener('click', function() {
        if (currentItem && currentItemType === 'character') {
            currentItem.name = document.getElementById('characterName').value;
            currentItem.nickname = document.getElementById('characterNickname').value;
            currentItem.description = document.getElementById('characterDescription').value;
            currentItem.scene = document.getElementById('characterScene').value;
            currentItem.type = document.getElementById('characterType').value;
            updateBook(currentBook);
            displayCharacters(currentBook.characters);
            showScreen('bookDetails');
        }
    });
}

const saveLocationButton = document.getElementById('saveLocation');
if (saveLocationButton) {
    saveLocationButton.addEventListener('click', function() {
        if (currentItem && currentItemType === 'location') {
            currentItem.name = document.getElementById('locationName').value;
            currentItem.description = document.getElementById('locationDescription').value;
            currentItem.importance = document.getElementById('locationImportance').value;
            updateBook(currentBook);
            displayLocations(currentBook.locations);
            showScreen('bookDetails');
        }
    });
}

const savePlotPointButton = document.getElementById('savePlotPoint');
if (savePlotPointButton) {
    savePlotPointButton.addEventListener('click', function() {
        if (currentItem && currentItemType === 'plotPoint') {
            currentItem.title = document.getElementById('plotPointTitle').value;
            currentItem.description = document.getElementById('plotPointDescription').value;
            currentItem.characters = document.getElementById('plotPointCharacters').value;
            currentItem.location = document.getElementById('plotPointLocation').value;
            updateBook(currentBook);
            displayPlotPoints(currentBook.plotPoints);
            showScreen('bookDetails');
        }
    });
}

// Add tag to item
function addTagToItem(itemType, tag) {
  if (currentItem && currentItemType === itemType) {
      if (!currentItem.tags) currentItem.tags = [];
      if (!currentItem.tags.includes(tag)) {
          currentItem.tags.push(tag);
          
          // Always add the tag to the book's overall tag list if it's not already there
          if (!currentBook.tags.includes(tag)) {
              currentBook.tags.push(tag);
          }
          
          updateBook(currentBook);
          showItemDetails(itemType, currentItem);
          populateTagDropdowns(); // Refresh tag dropdowns
          displayTags(currentBook.tags); // Refresh tags display on all screens
      }
  }
}

const addTagToCharacterButton = document.getElementById('addTagToCharacter');
if (addTagToCharacterButton) {
    addTagToCharacterButton.addEventListener('click', function() {
        const characterTagSelect = document.getElementById('characterTagSelect');
        const characterTagInput = document.getElementById('characterTagInput');
        if (characterTagSelect && characterTagInput) {
            const tag = characterTagSelect.value || characterTagInput.value.trim();
            if (tag) {
                addTagToItem('character', tag);
                characterTagSelect.value = '';
                characterTagInput.value = '';
            }
        }
    });
}

const addTagToLocationButton = document.getElementById('addTagToLocation');
if (addTagToLocationButton) {
    addTagToLocationButton.addEventListener('click', function() {
        const locationTagSelect = document.getElementById('locationTagSelect');
        const locationTagInput = document.getElementById('locationTagInput');
        if (locationTagSelect && locationTagInput) {
            const tag = locationTagSelect.value || locationTagInput.value.trim();
            if (tag) {
                addTagToItem('location', tag);
                locationTagSelect.value = '';
                locationTagInput.value = '';
            }
        }
    });
}
  
  const addTagToPlotPointButton = document.getElementById('addTagToPlotPoint');
  if (addTagToPlotPointButton) {
      addTagToPlotPointButton.addEventListener('click', function() {
          const plotPointTagSelect = document.getElementById('plotPointTagSelect');
          const plotPointTagInput = document.getElementById('plotPointTagInput');
          if (plotPointTagSelect && plotPointTagInput) {
              const tag = plotPointTagSelect.value || plotPointTagInput.value.trim();
              if (tag) {
                  addTagToItem('plotPoint', tag);
                  plotPointTagSelect.value = '';
                  plotPointTagInput.value = '';
              }
          }
      });
  }
  
  // Add note to item
  function addNoteToItem(itemType, noteTitle, noteContent) {
      if (currentItem && currentItemType === itemType) {
          if (!currentItem.notes) currentItem.notes = [];
          currentItem.notes.push({ title: noteTitle, content: noteContent });
          updateBook(currentBook);
          showItemDetails(itemType, currentItem);
      }
  }
  
  const addNoteToCharacterButton = document.getElementById('addNoteToCharacter');
  if (addNoteToCharacterButton) {
      addNoteToCharacterButton.addEventListener('click', function() {
          const newCharacterNoteTitleInput = document.getElementById('newCharacterNoteTitle');
          const newCharacterNoteContentInput = document.getElementById('newCharacterNoteContent');
          if (newCharacterNoteTitleInput && newCharacterNoteContentInput) {
              const title = newCharacterNoteTitleInput.value.trim();
              const content = newCharacterNoteContentInput.value.trim();
              if (title && content) {
                  addNoteToItem('character', title, content);
                  newCharacterNoteTitleInput.value = '';
                  newCharacterNoteContentInput.value = '';
              }
          }
      });
  }
  
  const addNoteToLocationButton = document.getElementById('addNoteToLocation');
  if (addNoteToLocationButton) {
      addNoteToLocationButton.addEventListener('click', function() {
          const newLocationNoteTitleInput = document.getElementById('newLocationNoteTitle');
          const newLocationNoteContentInput = document.getElementById('newLocationNoteContent');
          if (newLocationNoteTitleInput && newLocationNoteContentInput) {
              const title = newLocationNoteTitleInput.value.trim();
              const content = newLocationNoteContentInput.value.trim();
              if (title && content) {
                  addNoteToItem('location', title, content);
                  newLocationNoteTitleInput.value = '';
                  newLocationNoteContentInput.value = '';
              }
          }
      });
  }
  
  const addNoteToPlotPointButton = document.getElementById('addNoteToPlotPoint');
  if (addNoteToPlotPointButton) {
      addNoteToPlotPointButton.addEventListener('click', function() {
          const newPlotPointNoteTitleInput = document.getElementById('newPlotPointNoteTitle');
          const newPlotPointNoteContentInput = document.getElementById('newPlotPointNoteContent');
          if (newPlotPointNoteTitleInput && newPlotPointNoteContentInput) {
              const title = newPlotPointNoteTitleInput.value.trim();
              const content = newPlotPointNoteContentInput.value.trim();
              if (title && content) {
                  addNoteToItem('plotPoint', title, content);
                  newPlotPointNoteTitleInput.value = '';
                  newPlotPointNoteContentInput.value = '';
              }
          }
      });
  }
  
  // Update word count
  const updateWordCountButton = document.getElementById('updateWordCount');
  if (updateWordCountButton) {
      updateWordCountButton.addEventListener('click', function() {
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
                  
                  updateBook(currentBook);
                  displayWordCount(currentBook);
                  newWordCountInput.value = '';
                  newTargetWordCountInput.value = '';
              }
          }
      });
  }
  
  // Populate tag dropdowns
  function populateTagDropdowns() {
    const tagSelects = document.querySelectorAll('.tagSelect');
    const allTags = currentBook ? currentBook.tags : [];
    
    tagSelects.forEach(select => {
        const currentValue = select.value; // Store the current value
        select.innerHTML = '<option value="">Select a tag or type a new one</option>';
        allTags.forEach(tag => {
            const option = document.createElement('option');
            option.value = tag;
            option.textContent = tag;
            select.appendChild(option);
        });
        select.value = currentValue; // Restore the previous value if it still exists
    });
  }
  
  // Display relationship graph
  const viewRelationshipGraphButton = document.getElementById('viewRelationshipGraph');
if (viewRelationshipGraphButton) {
    viewRelationshipGraphButton.addEventListener('click', function() {
        if (currentBook) {
            showRelationshipGraph(currentBook);
        }
    });
}
  
  function showRelationshipGraph(book) {
    const graph = new RelationshipGraph(book);
    graph.show();
    showScreen('relationshipGraph');
}
  
  // Navigation
  document.querySelectorAll('.backToBooks').forEach(button => {
    if (button) {
        button.addEventListener('click', function() {
            showScreen('bookList');
        });
    }
  });
  
  document.querySelectorAll('.backToBook').forEach(button => {
    if (button) {
        button.addEventListener('click', function() {
            if (currentScreen === 'sceneDetails') {
                navigateBackToChapter();
            } else {
                showScreen('bookDetails');
            }
        });
    }
  });

  function navigateBackToChapter() {
        if (currentBook && currentItem) {
            const chapterIndex = currentBook.chapters.findIndex(chapter => 
                chapter.scenes && chapter.scenes.includes(currentBook.scenes.indexOf(currentItem))
            );
            if (chapterIndex !== -1) {
                displayChapterDetails(currentBook.chapters[chapterIndex], chapterIndex);
            } else {
                console.warn('Chapter not found for this scene. Returning to book details.');
                showScreen('bookDetails');
            }
        } else {
            showScreen('bookDetails');
        }
    }
  });