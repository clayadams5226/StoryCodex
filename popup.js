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

          if (currentBook) {
              displayBookDetails(currentBook);
              if (currentItem) {
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
  });

  // Utility Functions
  function showScreen(screenId) {
    const screens = ['bookList', 'bookDetails', 'characterDetails', 'locationDetails', 'plotPointDetails', 'noteDetails', 'taggedItems', 'relationshipGraph'];
    screens.forEach(screen => {
        const screenElement = document.getElementById(screen);
        if (screenElement) {
            screenElement.style.display = screen === screenId ? 'block' : 'none';
        }
    });
    currentScreen = screenId;
    
    // Refresh tags when switching to book details
    if (screenId === 'bookDetails' && currentBook) {
        displayTags(currentBook.tags);
    }
    
    saveCurrentState();
}

  function saveCurrentState() {
      const currentState = { currentBook, currentItem, currentScreen, currentItemType };
      chrome.storage.sync.set({ currentState: currentState }, function() {
          console.log('State saved');
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
          updateBooks(books);
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
        targetWordCount: 0
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
          const character1Input = document.getElementById('character1');
          const character2Input = document.getElementById('character2');
          const relationshipTypeInput = document.getElementById('relationshipType');
          if (character1Input && character2Input && relationshipTypeInput) {
              const character1 = character1Input.value.trim();
              const character2 = character2Input.value.trim();
              const relationshipType = relationshipTypeInput.value.trim();
              if (character1 && character2 && relationshipType && currentBook) {
                  addRelationship(currentBook, character1, character2, relationshipType);
                  character1Input.value = '';
                  character2Input.value = '';
                  relationshipTypeInput.value = '';
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

  function addCharacter(book, characterName) {
    book.characters.push({
        name: characterName,
        nickname: '',
        description: '',
        scene: '',
        type: '',
        relationships: [],
        notes: [],
        tags: []
    });
    updateBook(book);
    displayCharacters(book.characters);
}

function addLocation(book, locationName) {
  book.locations.push({
      name: locationName,
      description: '',
      importance: '',
      notes: [],
      tags: []
  });
  updateBook(book);
  displayLocations(book.locations);
}

function addPlotPoint(book, plotPointTitle) {
  book.plotPoints.push({
      title: plotPointTitle,
      description: '',
      characters: '',
      location: '',
      notes: [],
      tags: []
  });
  updateBook(book);
  displayPlotPoints(book.plotPoints);
}

  function addRelationship(book, character1, character2, relationshipType) {
      const relationship = { character1, character2, type: relationshipType };
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

  function addNote(book, noteTitle, noteContent) {
      book.notes.push({
          title: noteTitle,
          content: noteContent
      });
      updateBook(book);
      displayNotes(book.notes);
  }

  // Item Details Functions
  function showItemDetails(itemType, item) {
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
    const container = document.getElementById('graphContainer');
    if (container) {
        container.innerHTML = '';

        const nodes = book.characters.map((char, index) => ({
            id: index,
            label: char.name
        }));

        const edges = book.relationships.map(rel => ({
            from: book.characters.findIndex(char => char.name === rel.character1),
            to: book.characters.findIndex(char => char.name === rel.character2),
            label: rel.type
        }));

        const data = {
            nodes: new vis.DataSet(nodes),
            edges: new vis.DataSet(edges)
        };

        const options = {
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
                arrows: 'to'
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
            }
        };

        new vis.Network(container, data, options);
        showScreen('relationshipGraph');
    }
}

// Navigation
const backToBooksList = document.querySelectorAll('.backToBooks');
backToBooksList.forEach(button => {
    if (button) {
        button.addEventListener('click', function() {
            showScreen('bookList');
        });
    }
});

const backToBookList = document.querySelectorAll('.backToBook');
backToBookList.forEach(button => {
    if (button) {
        button.addEventListener('click', function() {
            showScreen('bookDetails');
        });
    }
});
});