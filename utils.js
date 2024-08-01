export function showScreen(screenId) {
    console.log('Showing screen:', screenId);
    const screens = ['bookList', 'bookDetails', 'characterDetails', 'locationDetails', 'plotPointDetails', 'noteDetails', 'chapterDetails', 'sceneDetails', 'taggedItems', 'relationshipGraph', 'noteEditor'];
    screens.forEach(screen => {
        const screenElement = document.getElementById(screen);
        if (screenElement) {
            screenElement.style.display = screen === screenId ? 'block' : 'none';
        } else {
            console.warn(`Screen element not found: ${screen}`);
        }
    });
    return screenId;
}

export function saveCurrentState(currentBook, currentItem, currentScreen, currentItemType) {
    const currentState = {
        currentBook,
        currentItem,
        currentScreen,
        currentItemType
    };
    chrome.storage.sync.set({ currentState: currentState }, function () {
        console.log('State saved:', currentState);
    });
}

export function updateBook(books, updatedBook) {
    console.log('Updating book:', updatedBook);
    const index = books.findIndex(book => book.name === updatedBook.name);
    if (index !== -1) {
        books[index] = updatedBook;
        chrome.storage.sync.set({ books: books }, function () {
            if (chrome.runtime.lastError) {
                console.error('Error updating book:', chrome.runtime.lastError);
            } else {
                console.log('Book updated in storage');
            }
        });
    } else {
        console.error('Book not found in books array');
    }
    return books;
}

export function populateTagDropdowns(currentBook) {
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