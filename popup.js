document.addEventListener('DOMContentLoaded', function () {
  const bookForm = document.getElementById('book-form');
  const characterForm = document.getElementById('character-form');
  const booksList = document.getElementById('books-list');
  const charactersList = document.getElementById('characters-list');
  const bookTitleHeader = document.getElementById('book-title-header');
  const backToBooksButton = document.getElementById('back-to-books');
  const newCharacterButton = document.getElementById('new-character-button');
  const backToCharactersButton = document.getElementById('back-to-characters');
  const characterNameHeader = document.getElementById('character-name-header');
  const booksScreen = document.getElementById('books-screen');
  const charactersScreen = document.getElementById('characters-screen');
  const characterDetailsScreen = document.getElementById('character-details-screen');

  let currentBookTitle = '';
  let editingCharacterIndex = -1;

  // Load saved books and characters when the popup is opened
  chrome.storage.local.get('books', function (result) {
    if (result.books) {
      result.books.forEach(book => addBookToDOM(book));
    }
  });

  // Add a new book
  bookForm.addEventListener('submit', function (e) {
    e.preventDefault();
    const title = document.getElementById('book-title').value;
    const book = { title, characters: [] };

    chrome.storage.local.get('books', function (result) {
      const books = result.books || [];
      books.push(book);
      chrome.storage.local.set({ books }, function () {
        addBookToDOM(book);
        bookForm.reset();
      });
    });
  });

  // Save a character profile
  characterForm.addEventListener('submit', function (e) {
    e.preventDefault();
    const name = document.getElementById('character-name').value;
    const nickname = document.getElementById('character-nickname').value;
    const description = document.getElementById('character-description').value;
    const background = document.getElementById('character-background').value;
    const personality = document.getElementById('character-personality').value;
    const relationships = document.getElementById('character-relationships').value;
    const goals = document.getElementById('character-goals').value;
    const events = document.getElementById('character-events').value;
    const character = { name, nickname, description, background, personality, relationships, goals, events };

    chrome.storage.local.get('books', function (result) {
      const books = result.books || [];
      const book = books.find(b => b.title === currentBookTitle);
      if (book) {
        if (editingCharacterIndex > -1) {
          book.characters[editingCharacterIndex] = character;
        } else {
          book.characters.push(character);
        }
        chrome.storage.local.set({ books }, function () {
          loadCharacters(book.characters);
          characterForm.reset();
          editingCharacterIndex = -1;
          characterDetailsScreen.classList.add('hidden');
          charactersScreen.classList.remove('hidden');
        });
      } else {
        console.error('Book not found:', currentBookTitle);
      }
    });
  });

  // Function to add a book to the DOM
  function addBookToDOM(book) {
    const li = document.createElement('li');
    li.textContent = book.title;
    li.addEventListener('click', function () {
      currentBookTitle = book.title;
      bookTitleHeader.textContent = `Characters in "${book.title}"`;
      chrome.storage.local.get('books', function (result) {
        const books = result.books || [];
        const book = books.find(b => b.title === currentBookTitle);
        if (book) {
          loadCharacters(book.characters);
        }
      });
      booksScreen.classList.add('hidden');
      charactersScreen.classList.remove('hidden');
    });
    booksList.appendChild(li);
  }

  // Function to add a character to the DOM
  function addCharacterToDOM(character, index) {
    const li = document.createElement('li');
    li.textContent = character.name;
    li.addEventListener('click', function () {
      editingCharacterIndex = index;
      document.getElementById('character-name').value = character.name;
      document.getElementById('character-nickname').value = character.nickname;
      document.getElementById('character-description').value = character.description;
      document.getElementById('character-background').value = character.background;
      document.getElementById('character-personality').value = character.personality;
      document.getElementById('character-relationships').value = character.relationships;
      document.getElementById('character-goals').value = character.goals;
      document.getElementById('character-events').value = character.events;
      characterNameHeader.textContent = `Edit Character: ${character.name}`;
      charactersScreen.classList.add('hidden');
      characterDetailsScreen.classList.remove('hidden');
    });
    charactersList.appendChild(li);
  }

  // Function to load characters of a selected book
  function loadCharacters(characters) {
    charactersList.innerHTML = '';
    characters.forEach((character, index) => addCharacterToDOM(character, index));
  }

  // Back to books screen
  backToBooksButton.addEventListener('click', function () {
    charactersScreen.classList.add('hidden');
    booksScreen.classList.remove('hidden');
  });

  // Back to characters screen
  backToCharactersButton.addEventListener('click', function () {
    characterDetailsScreen.classList.add('hidden');
    charactersScreen.classList.remove('hidden');
    chrome.storage.local.get('books', function (result) {
      const books = result.books || [];
      const book = books.find(b => b.title === currentBookTitle);
      if (book) {
        loadCharacters(book.characters);
      }
    });
  });

  // New character button
  newCharacterButton.addEventListener('click', function () {
    characterForm.reset();
    editingCharacterIndex = -1;
    characterNameHeader.textContent = 'New Character';
    charactersScreen.classList.add('hidden');
    characterDetailsScreen.classList.remove('hidden');
  });
});
