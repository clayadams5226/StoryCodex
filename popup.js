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
  currentScreen = screenId;
  const screens = ['bookList', 'bookDetails', 'characterDetails', 'locationDetails', 'plotPointDetails', 'noteDetails', 'taggedItems'];
  screens.forEach(screen => {
    document.getElementById(screen).style.display = screen === screenId ? 'block' : 'none';
  });
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
  bookList.innerHTML = '';
  books.forEach(book => {
    const li = document.createElement('li');
    li.textContent = book.name;
    li.addEventListener('click', () => {
      currentBook = book;
      displayBookDetails(book);
    });
    bookList.appendChild(li);
  });
}

document.getElementById('addBook').addEventListener('click', function() {
  const bookName = document.getElementById('newBookName').value;
  if (bookName) {
    addBook(bookName);
    document.getElementById('newBookName').value = '';
  }
});

function addBook(bookName) {
  books.push({
    name: bookName,
    characters: [],
    locations: [],
    plotPoints: [],
    relationships: [],
    notes: [],
    tags: []
  });
  updateBooks(books);
}

// Book Details Functions
function displayBookDetails(book) {
  document.getElementById('bookTitle').textContent = book.name;
  displayCharacters(book.characters);
  displayLocations(book.locations);
  displayPlotPoints(book.plotPoints);
  displayTags(book.tags);
  displayRelationships(book.relationships);
  displayNotes(book.notes);
  showScreen('bookDetails');
}

function displayCharacters(characters) {
  const characterList = document.getElementById('characters');
  characterList.innerHTML = '';
  characters.forEach(character => {
    const li = document.createElement('li');
    li.textContent = character.name;
    li.addEventListener('click', () => showItemDetails('character', character));
    characterList.appendChild(li);
  });
}

function displayLocations(locations) {
  const locationList = document.getElementById('locations');
  locationList.innerHTML = '';
  locations.forEach(location => {
    const li = document.createElement('li');
    li.textContent = location.name;
    li.addEventListener('click', () => showItemDetails('location', location));
    locationList.appendChild(li);
  });
}

function displayPlotPoints(plotPoints) {
  const plotPointList = document.getElementById('plotPoints');
  plotPointList.innerHTML = '';
  plotPoints.forEach(plotPoint => {
    const li = document.createElement('li');
    li.textContent = plotPoint.title;
    li.addEventListener('click', () => showItemDetails('plotPoint', plotPoint));
    plotPointList.appendChild(li);
  });
}

function displayTags(tags) {
  const tagContainer = document.getElementById('tags');
  tagContainer.innerHTML = '';
  tags.forEach(tag => {
    const span = document.createElement('span');
    span.textContent = tag;
    span.classList.add('tag');
    span.addEventListener('click', () => displayTaggedItems(tag));
    tagContainer.appendChild(span);
  });
}

function displayRelationships(relationships) {
  const relationshipList = document.getElementById('relationships');
  relationshipList.innerHTML = '';
  relationships.forEach(relationship => {
    const li = document.createElement('li');
    li.textContent = `${relationship.character1} - ${relationship.type} - ${relationship.character2}`;
    relationshipList.appendChild(li);
  });
}

function displayNotes(notes) {
  const noteList = document.getElementById('notes');
  noteList.innerHTML = '';
  notes.forEach(note => {
    const li = document.createElement('li');
    li.textContent = note.title;
    li.addEventListener('click', () => showItemDetails('note', note));
    noteList.appendChild(li);
  });
}
// Add new items
document.getElementById('addCharacter').addEventListener('click', function() {
  const characterName = document.getElementById('newCharacterName').value;
  if (characterName && currentBook) {
    addCharacter(currentBook, characterName);
    document.getElementById('newCharacterName').value = '';
  }
});

document.getElementById('addLocation').addEventListener('click', function() {
  const locationName = document.getElementById('newLocationName').value;
  if (locationName && currentBook) {
    addLocation(currentBook, locationName);
    document.getElementById('newLocationName').value = '';
  }
});

document.getElementById('addPlotPoint').addEventListener('click', function() {
  const plotPointTitle = document.getElementById('newPlotPoint').value;
  if (plotPointTitle && currentBook) {
    addPlotPoint(currentBook, plotPointTitle);
    document.getElementById('newPlotPoint').value = '';
  }
});

document.getElementById('addTag').addEventListener('click', function() {
  const tagName = document.getElementById('newTagName').value;
  if (tagName && currentBook) {
    if (!currentBook.tags) currentBook.tags = [];
    currentBook.tags.push(tagName);
    updateBook(currentBook);
    displayBookDetails(currentBook);
    document.getElementById('newTagName').value = '';
  }
});

document.getElementById('addRelationship').addEventListener('click', function() {
  const character1 = document.getElementById('character1').value;
  const character2 = document.getElementById('character2').value;
  const relationshipType = document.getElementById('relationshipType').value;
  if (character1 && character2 && relationshipType && currentBook) {
    if (!currentBook.relationships) currentBook.relationships = [];
    const relationship = { character1, character2, type: relationshipType };
    currentBook.relationships.push(relationship);
    
    // Add relationship to characters
    let char1 = currentBook.characters.find(c => c.name === character1);
    let char2 = currentBook.characters.find(c => c.name === character2);
    if (char1) {
      if (!char1.relationships) char1.relationships = [];
      char1.relationships.push(relationship);
    }
    if (char2) {
      if (!char2.relationships) char2.relationships = [];
      char2.relationships.push(relationship);
    }

    updateBook(currentBook);
    displayBookDetails(currentBook);
    // Clear input fields
    document.getElementById('character1').value = '';
    document.getElementById('character2').value = '';
    document.getElementById('relationshipType').value = '';
  }
});

document.getElementById('addNote').addEventListener('click', function() {
  const noteTitle = document.getElementById('newNoteTitle').value;
  const noteContent = document.getElementById('newNoteContent').value;
  if (noteTitle && noteContent && currentBook) {
    addNote(currentBook, noteTitle, noteContent);
    document.getElementById('newNoteTitle').value = '';
    document.getElementById('newNoteContent').value = '';
  }
});

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
  displayCharacters(book.characters); // Refresh character list
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
  displayLocations(book.locations); // Refresh location list
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
  displayPlotPoints(book.plotPoints); // Refresh plot point list
}

function addNote(book, noteTitle, noteContent) {
  book.notes.push({
    title: noteTitle,
    content: noteContent
  });
  updateBook(book);
  displayNotes(book.notes); // Refresh note list
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
  document.getElementById('characterName').value = character.name;
  document.getElementById('characterNickname').value = character.nickname;
  document.getElementById('characterDescription').value = character.description;
  document.getElementById('characterScene').value = character.scene;
  document.getElementById('characterType').value = character.type;

  const relationshipsList = document.getElementById('characterRelationships');
  relationshipsList.innerHTML = '';
  character.relationships.forEach(rel => {
    const li = document.createElement('li');
    li.textContent = `${rel.character1 === character.name ? rel.character2 : rel.character1}: ${rel.type}`;
    relationshipsList.appendChild(li);
  });

  const tagsList = document.getElementById('characterTags');
  tagsList.innerHTML = '';
  character.tags.forEach(tag => {
    const span = document.createElement('span');
    span.textContent = tag;
    span.classList.add('tag');
    tagsList.appendChild(span);
  });

  const notesList = document.getElementById('characterNotes');
  notesList.innerHTML = '';
  character.notes.forEach(note => {
    const li = document.createElement('li');
    li.textContent = note.title;
    li.addEventListener('click', () => displayNoteDetails(note));
    notesList.appendChild(li);
  });

  showScreen('characterDetails');
}

function displayLocationDetails(location) {
  document.getElementById('locationName').value = location.name;
  document.getElementById('locationDescription').value = location.description;
  document.getElementById('locationImportance').value = location.importance;

  const tagsList = document.getElementById('locationTags');
  tagsList.innerHTML = '';
  location.tags.forEach(tag => {
    const span = document.createElement('span');
    span.textContent = tag;
    span.classList.add('tag');
    tagsList.appendChild(span);
  });

  const notesList = document.getElementById('locationNotes');
  notesList.innerHTML = '';
  location.notes.forEach(note => {
    const li = document.createElement('li');
    li.textContent = note.title;
    li.addEventListener('click', () => displayNoteDetails(note));
    notesList.appendChild(li);
  });

  showScreen('locationDetails');
}

function displayPlotPointDetails(plotPoint) {
  document.getElementById('plotPointTitle').value = plotPoint.title;
  document.getElementById('plotPointDescription').value = plotPoint.description;
  document.getElementById('plotPointCharacters').value = plotPoint.characters;
  document.getElementById('plotPointLocation').value = plotPoint.location;

  const tagsList = document.getElementById('plotPointTags');
  tagsList.innerHTML = '';
  plotPoint.tags.forEach(tag => {
    const span = document.createElement('span');
    span.textContent = tag;
    span.classList.add('tag');
    tagsList.appendChild(span);
  });

  const notesList = document.getElementById('plotPointNotes');
  notesList.innerHTML = '';
  plotPoint.notes.forEach(note => {
    const li = document.createElement('li');
    li.textContent = note.title;
    li.addEventListener('click', () => displayNoteDetails(note));
    notesList.appendChild(li);
  });

  showScreen('plotPointDetails');
}

function displayNoteDetails(note) {
  document.getElementById('noteTitle').textContent = note.title;
  document.getElementById('noteContent').textContent = note.content;
  showScreen('noteDetails');
}

function displayTaggedItems(tag) {
  document.getElementById('currentTag').textContent = tag;
  const taggedItemsList = document.getElementById('taggedItemsList');
  taggedItemsList.innerHTML = '';

  const addTaggedItem = (item, type) => {
    const li = document.createElement('li');
    li.textContent = `${type}: ${item.name || item.title}`;
    li.addEventListener('click', () => showItemDetails(type, item));
    taggedItemsList.appendChild(li);
  };

  currentBook.characters.filter(char => char.tags.includes(tag)).forEach(char => addTaggedItem(char, 'character'));
  currentBook.locations.filter(loc => loc.tags.includes(tag)).forEach(loc => addTaggedItem(loc, 'location'));
  currentBook.plotPoints.filter(plot => plot.tags.includes(tag)).forEach(plot => addTaggedItem(plot, 'plotPoint'));

  showScreen('taggedItems');
}

// Save item details
document.getElementById('saveCharacter').addEventListener('click', function() {
  if (currentItem && currentItemType === 'character') {
    currentItem.name = document.getElementById('characterName').value;
    currentItem.nickname = document.getElementById('characterNickname').value;
    currentItem.description = document.getElementById('characterDescription').value;
    currentItem.scene = document.getElementById('characterScene').value;
    currentItem.type = document.getElementById('characterType').value;
    updateBook(currentBook);
    displayBookDetails(currentBook);
  }
});

document.getElementById('saveLocation').addEventListener('click', function() {
  if (currentItem && currentItemType === 'location') {
    currentItem.name = document.getElementById('locationName').value;
    currentItem.description = document.getElementById('locationDescription').value;
    currentItem.importance = document.getElementById('locationImportance').value;
    updateBook(currentBook);
    displayBookDetails(currentBook);
  }
});

document.getElementById('savePlotPoint').addEventListener('click', function() {
  if (currentItem && currentItemType === 'plotPoint') {
    currentItem.title = document.getElementById('plotPointTitle').value;
    currentItem.description = document.getElementById('plotPointDescription').value;
    currentItem.characters = document.getElementById('plotPointCharacters').value;
    currentItem.location = document.getElementById('plotPointLocation').value;
    updateBook(currentBook);
    displayBookDetails(currentBook);
  }
});

// Add tags to items
document.getElementById('addTagToCharacter').addEventListener('click', function() {
  addTagToItem('character', document.getElementById('characterTagInput').value);
});

document.getElementById('addTagToLocation').addEventListener('click', function() {
  addTagToItem('location', document.getElementById('locationTagInput').value);
});

document.getElementById('addTagToPlotPoint').addEventListener('click', function() {
  addTagToItem('plotPoint', document.getElementById('plotPointTagInput').value);
});

function addTagToItem(itemType, tag) {
  if (currentItem && currentItemType === itemType && tag) {
    if (!currentItem.tags) currentItem.tags = [];
    currentItem.tags.push(tag);
    updateBook(currentBook);
    showItemDetails(itemType, currentItem);
    // Clear input field
    document.getElementById(`${itemType}TagInput`).value = '';
  }
}

// Navigation
document.getElementById('backToBooks').addEventListener('click', function() {
  showScreen('bookList');
});

document.getElementById('backToBook').addEventListener('click', function() {
  displayBookDetails(currentBook);
});

document.getElementById('backToBookFromLocation').addEventListener('click', function() {
  displayBookDetails(currentBook);
});

document.getElementById('backToBookFromPlotPoint').addEventListener('click', function() {
  displayBookDetails(currentBook);
});

document.getElementById('backToBookFromNote').addEventListener('click', function() {
  displayBookDetails(currentBook);
});

document.getElementById('backToBookFromTaggedItems').addEventListener('click', function() {
  displayBookDetails(currentBook);
});

// Initialize the app
function init() {
  chrome.storage.sync.get(['books'], function(result) {
    books = result.books || [];
    displayBooks(books);
  });
}

init();