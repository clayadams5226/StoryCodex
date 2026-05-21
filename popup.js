import { showScreen, updateBook, populateTagDropdowns, syncBookTagsFromItems } from './utils.js';
import { RelationshipGraph } from './RelationshipGraph.js';
import {
    findSceneById,
    findChapterBySceneId,
    removeSceneFromChapter,
    addSceneToChapter as addSceneIdToChapter,
    reorderSceneInChapter
} from './src/utils/idHelpers.js';
import { waitForStoryCodexApp } from './src/app/storyCodexGlobal.js';
import { CharacterArcEditor } from './src/features/characterArc/CharacterArcEditor.js';
import { getVisibleScreenId, inputValue, stripHtml } from './src/ui/domHelpers.js';
import { observeCollapsibleSections } from './src/ui/collapsibleSections.js';

// Get reference to the modular app (initialized by main.js)
// Wait for it to be available
function getApp() {
    return window.storyCodex;
}

// Helper functions to access state through StateManager
function getBooks() {
    const app = getApp();
    return app ? app.getBooks() : [];
}

function getCurrentBook() {
    const app = getApp();
    return app ? app.getCurrentBook() : null;
}

function getCurrentItem() {
    const app = getApp();
    return app ? app.stateManager.getCurrentItem() : null;
}

function getCurrentScreen() {
    const app = getApp();
    return app ? app.stateManager.getCurrentScreen() : 'bookList';
}

function getCurrentItemType() {
    const app = getApp();
    return app ? app.stateManager.getCurrentItemType() : null;
}

async function setCurrentBook(book) {
    const app = getApp();
    if (app) await app.stateManager.setCurrentBook(book);
}

async function setCurrentItem(item, itemType) {
    const app = getApp();
    if (app) await app.stateManager.setCurrentItem(item, itemType);
}

async function setCurrentScreen(screen) {
    const app = getApp();
    if (app) await app.stateManager.setCurrentScreen(screen);
}

document.addEventListener('DOMContentLoaded', async function () {
    console.log('=== POPUP.JS LOADED ===');
    let activeBookSection = 'outline';

    const itemDisplayFunctions = {
        character: displayCharacterDetails,
        location: displayLocationDetails,
        plotPoint: displayPlotPointDetails,
        note: displayNoteDetails,
        chapter: displayChapterDetails,
        scene: displaySceneDetails,
    };

    const app = await waitForStoryCodexApp();
    const dataManager = app.dataManager;
    const richTextEditor = app.richTextEditor;
    const imageHandler = app.imageHandler;
    const arcEditor = new CharacterArcEditor({
        app,
        getCurrentBook,
        getBooks,
        updateBook
    });
    arcEditor.initialize();

    // Display initial UI
    displayBooks(getBooks());

    if (getCurrentBook()) {
        displayBookDetails(getCurrentBook());
        if (getCurrentItem() && getCurrentItemType()) {
            showItemDetails(getCurrentItemType(), getCurrentItem());
        } else {
            showScreen(getCurrentScreen());
        }
    } else {
        showScreen('bookList');
    }

    populateCharacterDropdowns();
    setupBookTabs();
    setupContinueCard();
    setupBookSearch();
    setupEnterKeyActions();
    setupPopoutButton();

    // Book List Functions
    async function displayBooks(books) {
        // Using ListRenderer from modular architecture
        app.listRenderer.renderList(
            'books',
            books,
            app.ItemTypes.BOOK,
            async (book, _index) => {
                await setCurrentBook(book);
                await setCurrentScreen('bookDetails');
                displayBookDetails(book);
                showScreen('bookDetails');
            }
        );
    }

    async function addBook(bookName) {
        // Using BookService from modular architecture
        const app = getApp();
        const newBook = await app.bookService.createBook(bookName);

        displayBooks(getBooks());
        return newBook;
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
        syncBookTagsFromItems(book);
        displayTags(book.tags);
        displayRelationships(book.relationships);
        displayNotes(book.notes);
        refreshBookOverview(book);
        populateTagDropdowns(book);
        setActiveBookSection(activeBookSection);
        showScreen('bookDetails');
    }

    function setupBookTabs() {
        document.querySelectorAll('.book-tab').forEach(tab => {
            tab.addEventListener('click', () => {
                const section = tab.dataset.bookTab;
                if (section) {
                    clearBookSearch();
                    setActiveBookSection(section);
                }
            });
        });
    }

    function setupContinueCard() {
        const continueCard = document.getElementById('continueWritingCard');
        if (!continueCard) return;

        continueCard.addEventListener('click', () => {
            const book = getCurrentBook();
            const target = getContinueTarget(book);
            if (!target) return;

            if (target.type === 'scene') {
                displaySceneDetails(target.item);
            } else if (target.type === 'chapter') {
                displayChapterDetails(target.item, book.chapters.indexOf(target.item));
            }
        });
    }

    function setupBookSearch() {
        const searchInput = document.getElementById('bookSearchInput');
        const clearButton = document.getElementById('clearBookSearch');

        if (searchInput) {
            searchInput.addEventListener('input', () => renderBookSearchResults(searchInput.value));
            searchInput.addEventListener('keydown', event => {
                if (event.key === 'Escape') {
                    clearBookSearch();
                    searchInput.focus();
                }
            });
        }

        if (clearButton) {
            clearButton.addEventListener('click', clearBookSearch);
        }
    }

    function clearBookSearch() {
        const searchInput = document.getElementById('bookSearchInput');
        if (searchInput && searchInput.value) {
            searchInput.value = '';
        }

        const resultsPanel = document.getElementById('bookSearchResults');
        const resultsList = document.getElementById('bookSearchResultsList');
        if (resultsPanel) {
            resultsPanel.hidden = true;
        }
        if (resultsList) {
            resultsList.innerHTML = '';
        }

        document.querySelectorAll('.book-section').forEach(section => {
            section.hidden = section.dataset.bookSection !== activeBookSection;
        });
    }

    function renderBookSearchResults(query) {
        const resultsPanel = document.getElementById('bookSearchResults');
        const resultsList = document.getElementById('bookSearchResultsList');
        const book = getCurrentBook();

        if (!resultsPanel || !resultsList || !book) return;

        const normalizedQuery = query.trim().toLowerCase();
        resultsList.innerHTML = '';

        if (!normalizedQuery) {
            clearBookSearch();
            return;
        }

        document.querySelectorAll('.book-section').forEach(section => {
            section.hidden = true;
        });
        resultsPanel.hidden = false;

        const results = getBookSearchResults(book, normalizedQuery);
        if (results.length === 0) {
            addEmptyState(resultsList, `No matches for "${query.trim()}"`);
            return;
        }

        results.forEach(result => {
            const li = document.createElement('li');
            li.classList.add('search-result-item');

            const title = document.createElement('span');
            title.classList.add('search-result-title');
            title.textContent = result.title;

            const meta = document.createElement('span');
            meta.classList.add('search-result-meta');
            meta.textContent = result.meta;

            li.appendChild(title);
            li.appendChild(meta);
            li.addEventListener('click', () => {
                clearBookSearch();
                result.open();
                focusCurrentScreenHeading();
            });
            resultsList.appendChild(li);
        });
    }

    function getBookSearchResults(book, normalizedQuery) {
        const results = [];
        const matches = (...values) => values
            .filter(Boolean)
            .some(value => String(value).toLowerCase().includes(normalizedQuery));

        const addResult = (title, meta, open, ...searchValues) => {
            if (matches(title, meta, ...searchValues)) {
                results.push({ title, meta, open });
            }
        };

        (book.chapters || []).forEach((chapter, index) => {
            addResult(
                chapter.title || 'Untitled chapter',
                'Chapter',
                () => displayChapterDetails(chapter, index),
                chapter.summary
            );
        });

        (book.scenes || []).forEach(scene => {
            const chapter = scene.id ? findChapterBySceneId(book, scene.id) : null;
            addResult(
                scene.title || 'Untitled scene',
                chapter ? `Scene in ${chapter.title || 'Untitled chapter'}` : 'Scene',
                () => displaySceneDetails(scene),
                scene.summary
            );
        });

        (book.characters || []).forEach(character => {
            addResult(
                character.name || 'Unnamed character',
                'Character',
                () => showItemDetails('character', character),
                character.nickname,
                character.description,
                character.role,
                character.tags?.join(' ')
            );
        });

        (book.locations || []).forEach(location => {
            addResult(
                location.name || 'Unnamed location',
                'Location',
                () => showItemDetails('location', location),
                location.description,
                location.importance,
                location.tags?.join(' ')
            );
        });

        (book.plotPoints || []).forEach(plotPoint => {
            addResult(
                plotPoint.title || 'Untitled plot point',
                'Plot point',
                () => showItemDetails('plotPoint', plotPoint),
                plotPoint.description,
                plotPoint.characters,
                plotPoint.location,
                plotPoint.tags?.join(' ')
            );
        });

        (book.notes || []).forEach(note => {
            addResult(
                note.title || 'Untitled note',
                'Note',
                () => showItemDetails('note', note),
                stripHtml(note.content || '')
            );
        });

        return results.slice(0, 20);
    }

    function setupEnterKeyActions() {
        const inputButtonPairs = [
            ['newBookName', 'addBook'],
            ['newChapterTitle', 'addChapter'],
            ['newCharacterName', 'addCharacter'],
            ['newLocationName', 'addLocation'],
            ['newPlotPoint', 'addPlotPoint'],
            ['newTagName', 'addTag'],
            ['newNoteTitle', 'addNote'],
            ['newSceneTitle', 'addScene']
        ];

        inputButtonPairs.forEach(([inputId, buttonId]) => {
            const input = document.getElementById(inputId);
            const button = document.getElementById(buttonId);
            if (!input || !button) return;

            input.addEventListener('keydown', event => {
                if (event.key === 'Enter') {
                    event.preventDefault();
                    button.click();
                }
            });
        });
    }

    function setupPopoutButton() {
        const popoutButton = document.getElementById('openPopout');
        if (!popoutButton) return;

        popoutButton.addEventListener('click', async () => {
            popoutButton.disabled = true;
            try {
                await persistCurrentViewBeforePopout();
                const url = chrome.runtime.getURL('popup.html');

                if (chrome.tabs?.create) {
                    await chrome.tabs.create({ url });
                } else {
                    window.open(url, '_blank', 'noopener');
                }

                if (window.innerWidth < 700) {
                    window.close();
                }
            } catch (error) {
                console.error('Unable to open Story Codex in a tab:', error);
                popoutButton.disabled = false;
            }
        });
    }

    function tagValues(containerId) {
        const container = document.getElementById(containerId);
        if (!container) return [];

        return Array.from(container.children)
            .map(element => element.textContent.replace('Ã—', '').trim())
            .filter(Boolean);
    }

    async function persistCurrentViewBeforePopout() {
        const app = getApp();
        if (!app) return;

        const visibleScreen = getVisibleScreenId(getCurrentScreen());
        const book = getCurrentBook();
        const item = getCurrentItem();
        const itemType = getCurrentItemType();
        let shouldSaveBook = false;

        if (visibleScreen === 'bookDetails' && book) {
            const newWordCount = parseInt(inputValue('newWordCount'), 10);
            const newTargetWordCount = parseInt(inputValue('newTargetWordCount'), 10);

            if (!Number.isNaN(newWordCount)) {
                book.wordCount = newWordCount;
                shouldSaveBook = true;
            }
            if (!Number.isNaN(newTargetWordCount)) {
                book.targetWordCount = newTargetWordCount;
                shouldSaveBook = true;
            }
        }

        if (visibleScreen === 'characterDetails' && item && itemType === 'character') {
            app.itemService.updateItem(item, {
                name: inputValue('characterName'),
                nickname: inputValue('characterNickname'),
                description: inputValue('characterDescription'),
                scene: inputValue('characterScene'),
                type: inputValue('characterType'),
                age: inputValue('characterAge'),
                occupation: inputValue('characterOccupation'),
                pronouns: inputValue('characterPronouns'),
                role: inputValue('characterRole'),
                aliases: inputValue('characterAliases'),
                status: inputValue('characterStatus'),
                physicalDescription: inputValue('characterPhysicalDescription'),
                background: inputValue('characterBackground'),
                personalityTraits: inputValue('characterPersonalityTraits'),
                motivations: inputValue('characterMotivations'),
                fears: inputValue('characterFears'),
                voicePatterns: inputValue('characterVoicePatterns'),
                internalConflict: inputValue('characterInternalConflict'),
                externalConflict: inputValue('characterExternalConflict')
            });
            shouldSaveBook = true;
        }

        if (visibleScreen === 'locationDetails' && item && itemType === 'location') {
            app.itemService.updateItem(item, {
                name: inputValue('locationName'),
                description: inputValue('locationDescription'),
                importance: inputValue('locationImportance')
            });
            shouldSaveBook = true;
        }

        if (visibleScreen === 'plotPointDetails' && item && itemType === 'plotPoint') {
            app.itemService.updateItem(item, {
                title: inputValue('plotPointTitle'),
                description: inputValue('plotPointDescription'),
                characters: inputValue('plotPointCharacters'),
                location: inputValue('plotPointLocation')
            });
            shouldSaveBook = true;
        }

        if (visibleScreen === 'chapterDetails' && item && itemType === 'chapter') {
            app.itemService.updateItem(item, {
                title: inputValue('chapterTitle'),
                summary: inputValue('chapterSummary')
            });
            shouldSaveBook = true;
        }

        if (visibleScreen === 'sceneDetails' && item && itemType === 'scene') {
            app.itemService.updateItem(item, {
                title: inputValue('sceneTitle'),
                summary: inputValue('sceneSummary'),
                characters: tagValues('sceneCharacters'),
                locations: tagValues('sceneLocations'),
                plotPoints: tagValues('scenePlotPoints')
            });
            shouldSaveBook = true;
        }

        if (visibleScreen === 'noteEditor' && item && itemType === 'note') {
            item.title = inputValue('noteTitle');
            item.content = document.getElementById('noteContent')?.innerHTML || '';
            shouldSaveBook = true;
        }

        if (shouldSaveBook && book) {
            await app.bookService.updateBook(book);
        }

        await app.stateManager.setState({
            currentBook: book || null,
            currentItem: item || null,
            currentItemType: itemType || null,
            currentScreen: visibleScreen
        });
    }

    function focusCurrentScreenHeading() {
        requestAnimationFrame(() => {
            const visibleScreen = [
                'bookDetails',
                'characterDetails',
                'locationDetails',
                'plotPointDetails',
                'noteDetails',
                'chapterDetails',
                'sceneDetails'
            ]
                .map(id => document.getElementById(id))
                .find(element => element && element.style.display !== 'none');

            const heading = visibleScreen?.querySelector('h1, h2');
            if (heading) {
                heading.setAttribute('tabindex', '-1');
                heading.focus();
            }
        });
    }

    function setActiveBookSection(sectionName) {
        activeBookSection = sectionName;

        document.querySelectorAll('.book-tab').forEach(tab => {
            const isActive = tab.dataset.bookTab === sectionName;
            tab.classList.toggle('active', isActive);
            tab.setAttribute('aria-selected', String(isActive));
            tab.setAttribute('tabindex', isActive ? '0' : '-1');
        });

        document.querySelectorAll('.book-section').forEach(section => {
            section.hidden = section.dataset.bookSection !== sectionName;
        });
    }

    function updateBookDashboard(book) {
        const wordCount = Number(book.wordCount) || 0;
        const targetWordCount = Number(book.targetWordCount) || 0;
        const progress = targetWordCount > 0 ? Math.min(100, Math.round((wordCount / targetWordCount) * 100)) : 0;

        const dashboardValues = {
            dashboardWordCount: `${wordCount.toLocaleString()} / ${targetWordCount.toLocaleString()} words`,
            dashboardProgressPercent: `${progress}%`,
            dashboardChapterCount: book.chapters?.length || 0,
            dashboardSceneCount: book.scenes?.length || 0,
            dashboardCharacterCount: book.characters?.length || 0,
            dashboardNoteCount: book.notes?.length || 0
        };

        Object.entries(dashboardValues).forEach(([id, value]) => {
            const element = document.getElementById(id);
            if (element) {
                element.textContent = value;
            }
        });

        const dashboardProgressBar = document.getElementById('dashboardProgressBar');
        if (dashboardProgressBar) {
            dashboardProgressBar.style.width = `${progress}%`;
        }

        const continueTitle = document.getElementById('continueWritingTitle');
        const continueMeta = document.getElementById('continueWritingMeta');
        const continueCard = document.getElementById('continueWritingCard');
        const target = getContinueTarget(book);

        if (continueTitle && continueMeta) {
            if (target?.type === 'scene') {
                const chapter = findChapterBySceneId(book, target.item.id);
                continueTitle.textContent = target.item.title || 'Untitled scene';
                continueMeta.textContent = chapter
                    ? `Most recently added scene in ${chapter.title || 'Untitled chapter'}`
                    : 'Most recently added scene';
            } else if (target?.type === 'chapter') {
                continueTitle.textContent = target.item.title || 'Untitled chapter';
                continueMeta.textContent = 'Add a scene to this chapter';
            } else {
                continueTitle.textContent = 'No scenes yet';
                continueMeta.textContent = 'Create a chapter and add your first scene.';
            }
        }

        if (continueCard) {
            continueCard.disabled = !target;
        }
    }

    function getContinueTarget(book) {
        if (!book) return null;

        const latestScene = book.scenes && book.scenes.length > 0
            ? book.scenes[book.scenes.length - 1]
            : null;

        if (latestScene) {
            return { type: 'scene', item: latestScene };
        }

        const latestChapter = book.chapters && book.chapters.length > 0
            ? book.chapters[book.chapters.length - 1]
            : null;

        if (latestChapter) {
            return { type: 'chapter', item: latestChapter };
        }

        return null;
    }

    function refreshBookOverview(book) {
        if (!book) return;
        updateBookDashboard(book);
        displayWordCount(book);
    }

    function displayChapters(chapters) {
        // Using ListRenderer from modular architecture
        app.listRenderer.renderList(
            'chapters',
            chapters,
            app.ItemTypes.CHAPTER,
            (chapter, index) => showItemDetails('chapter', chapter, index)
        );
        addEmptyStateIfNeeded('chapters', chapters, 'No chapters yet');
    }

    function displayCharacters(characters) {
        // Custom rendering to support character thumbnails
        const container = document.getElementById('characters');
        if (!container) {
            console.error('Characters container not found');
            return;
        }

        container.innerHTML = '';

        if (!characters || characters.length === 0) {
            addEmptyState(container, 'No characters yet');
            return;
        }

        characters.forEach((character, _index) => {
            const li = document.createElement('li');
            li.classList.add('character-list-item');

            // Add thumbnail if picture exists
            if (character.picture) {
                const thumbnail = document.createElement('img');
                thumbnail.src = character.picture;
                thumbnail.alt = character.name;
                thumbnail.classList.add('character-thumbnail');
                li.appendChild(thumbnail);
            }

            // Add character name
            const nameSpan = document.createElement('span');
            nameSpan.textContent = character.name;
            nameSpan.classList.add('character-name');
            li.appendChild(nameSpan);

            // Add click handler
            li.addEventListener('click', () => showItemDetails('character', character));

            container.appendChild(li);
        });
    }
    
    function displayLocations(locations) {
        // Using ListRenderer from modular architecture
        app.listRenderer.renderList(
            'locations',
            locations,
            app.ItemTypes.LOCATION,
            (location, _index) => showItemDetails('location', location)
        );
        addEmptyStateIfNeeded('locations', locations, 'No locations yet');
    }
    
    function displayPlotPoints(plotPoints) {
        // Using ListRenderer from modular architecture
        app.listRenderer.renderList(
            'plotPoints',
            plotPoints,
            app.ItemTypes.PLOT_POINT,
            (plotPoint, _index) => showItemDetails('plotPoint', plotPoint)
        );
        addEmptyStateIfNeeded('plotPoints', plotPoints, 'No plot points yet');
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
        if (!noteList) {
            console.error('Note list element not found');
            return;
        }

        if (!notes || notes.length === 0) {
            noteList.innerHTML = '';
            addEmptyState(noteList, 'No notes yet');
            return;
        }

        // Using ListRenderer from modular architecture
        app.listRenderer.renderList(
            'notes',
            notes,
            app.ItemTypes.NOTE,
            (note, _index) => {
                if (note && note.title) {
                    showItemDetails('note', note);
                } else {
                    console.error('Invalid note object:', note);
                }
            }
        );
    }

    function addEmptyStateIfNeeded(containerId, items, message) {
        if (items && items.length > 0) return;
        const container = document.getElementById(containerId);
        if (container) {
            addEmptyState(container, message);
        }
    }

    function addEmptyState(container, message) {
        container.innerHTML = '';
        const li = document.createElement('li');
        li.classList.add('empty-state');
        li.textContent = message;
        container.appendChild(li);
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

            const book = getCurrentBook();
            book.characters.filter(char => char.tags && char.tags.includes(tag)).forEach(char => addTaggedItem(char, 'character'));
            book.locations.filter(loc => loc.tags && loc.tags.includes(tag)).forEach(loc => addTaggedItem(loc, 'location'));
            book.plotPoints.filter(plot => plot.tags && plot.tags.includes(tag)).forEach(plot => addTaggedItem(plot, 'plotPoint'));
        }

        showScreen('taggedItems');
    }

    // ... (other display functions for characters, locations, plot points, etc.)

    // Item Details Functions
    async function showItemDetails(itemType, item, index) {
        console.log(`Showing details for ${itemType}:`, item);
        try {
            await setCurrentItem(item, itemType);
            await setCurrentScreen(`${itemType}Details`);

            const displayFunction = itemDisplayFunctions[itemType];
            if (displayFunction) {
                displayFunction(item, index);
                // State is automatically saved by StateManager
                showScreen(`${itemType}Details`);
            } else {
                console.error('Unknown item type:', itemType);
            }
        } catch (error) {
            console.error(`Error displaying ${itemType} details:`, error);
            alert(`An error occurred while displaying ${itemType} details. Please check the console for more information.`);
        }
    }

    function displayCharacterDetails(character) {
        // Basic fields
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

        // NEW: Picture
        const picturePreview = document.getElementById('characterPicturePreview');
        const removePictureButton = document.getElementById('removePictureButton');
        if (picturePreview && character.picture) {
            picturePreview.src = character.picture;
            picturePreview.style.display = 'block';
            if (removePictureButton) removePictureButton.style.display = 'inline-block';
        } else if (picturePreview) {
            picturePreview.style.display = 'none';
            if (removePictureButton) removePictureButton.style.display = 'none';
        }

        // NEW: Basic Details fields
        const ageInput = document.getElementById('characterAge');
        const occupationInput = document.getElementById('characterOccupation');
        const pronounsInput = document.getElementById('characterPronouns');
        const roleSelect = document.getElementById('characterRole');
        const aliasesInput = document.getElementById('characterAliases');
        const statusSelect = document.getElementById('characterStatus');

        if (ageInput) ageInput.value = character.age || '';
        if (occupationInput) occupationInput.value = character.occupation || '';
        if (pronounsInput) pronounsInput.value = character.pronouns || '';
        if (roleSelect) roleSelect.value = character.role || '';
        if (aliasesInput) aliasesInput.value = character.aliases || '';
        if (statusSelect) statusSelect.value = character.status || '';

        // NEW: Physical Description
        const physicalDescInput = document.getElementById('characterPhysicalDescription');
        if (physicalDescInput) physicalDescInput.value = character.physicalDescription || '';

        // NEW: Background
        const backgroundInput = document.getElementById('characterBackground');
        if (backgroundInput) backgroundInput.value = character.background || '';

        // NEW: Character Depth fields
        const personalityInput = document.getElementById('characterPersonalityTraits');
        const motivationsInput = document.getElementById('characterMotivations');
        const fearsInput = document.getElementById('characterFears');
        const voicePatternsInput = document.getElementById('characterVoicePatterns');
        const internalConflictInput = document.getElementById('characterInternalConflict');
        const externalConflictInput = document.getElementById('characterExternalConflict');

        if (personalityInput) personalityInput.value = character.personalityTraits || '';
        if (motivationsInput) motivationsInput.value = character.motivations || '';
        if (fearsInput) fearsInput.value = character.fears || '';
        if (voicePatternsInput) voicePatternsInput.value = character.voicePatterns || '';
        if (internalConflictInput) internalConflictInput.value = character.internalConflict || '';
        if (externalConflictInput) externalConflictInput.value = character.externalConflict || '';

        // NEW: Character Arc Preview
        arcEditor.updatePreview(character);

        // Existing functionality
        displayRelationshipsForCharacter(character);
        displayTagsForItem(character, 'character');
        displayNotesForItem(character, 'character');
        populateTagDropdowns(getCurrentBook());

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
        displayTagsForItem(location, 'location');
        populateTagDropdowns(getCurrentBook());

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
        displayTagsForItem(plotPoint, 'plotPoint');
        populateTagDropdowns(getCurrentBook());

        showScreen('plotPointDetails');
    }
    
    async function displayNoteDetails(note) {
        if (!note) {
            console.error('Attempted to display details of null note');
            return;
        }
        await setCurrentItem(note, 'note');
        const noteTitleElement = document.getElementById('noteDetailTitle');
        const noteContentElement = document.getElementById('noteDetailContent');

        if (noteTitleElement && noteContentElement) {
            noteTitleElement.textContent = note.title || 'Untitled Note';
            noteContentElement.innerHTML = note.content || 'No content';
            showScreen('noteDetails');
        } else {
            console.error('Note detail elements not found in the DOM');
        }
    }
    
    async function displayChapterDetails(chapter, chapterIndex) {
        console.log('Displaying chapter details:', chapter);
        await setCurrentItem(chapter, 'chapter');

        const chapterTitleInput = document.getElementById('chapterTitle');
        const chapterSummaryInput = document.getElementById('chapterSummary');
        const chapterScenesList = document.getElementById('chapterScenes');

        if (chapterTitleInput) chapterTitleInput.value = chapter.title || '';
        if (chapterSummaryInput) chapterSummaryInput.value = chapter.summary || '';

        if (chapterScenesList) {
            chapterScenesList.innerHTML = '';
            if (chapter.scenes && Array.isArray(chapter.scenes)) {
                chapter.scenes.forEach((sceneId, _index) => {
                    const scene = findSceneById(getCurrentBook(), sceneId);
                    if (scene) {
                        const li = document.createElement('li');
                        li.setAttribute('data-scene-id', sceneId);
                        li.classList.add('scene-item');
                        li.draggable = true;

                        const sceneTitle = document.createElement('h4');
                        sceneTitle.textContent = scene.title || 'Untitled Scene';
                        sceneTitle.classList.add('scene-title');
                        sceneTitle.addEventListener('click', () => displaySceneDetails(scene));

                        const sceneSummary = document.createElement('p');
                        sceneSummary.textContent = scene.summary || 'No summary available';
                        sceneSummary.classList.add('scene-summary');

                        const moveChapterLabel = document.createElement('label');
                        moveChapterLabel.textContent = 'Move to Chapter: ';
                        moveChapterLabel.classList.add('move-chapter-label');

                        const moveChapterSelect = document.createElement('select');
                        moveChapterSelect.classList.add('move-chapter-select');
                        populateChapterSelect(moveChapterSelect, chapterIndex);
                        moveChapterSelect.addEventListener('change', (event) => moveSceneToChapter(sceneId, parseInt(event.target.value)));

                        li.appendChild(sceneTitle);
                        li.appendChild(sceneSummary);
                        li.appendChild(moveChapterLabel);
                        li.appendChild(moveChapterSelect);
                        chapterScenesList.appendChild(li);
                    } else {
                        console.warn('Scene not found:', sceneId);
                    }
                });

                // Initialize Sortable
                new Sortable(chapterScenesList, {
                    animation: 150,
                    onEnd: function (evt) {
                        const sceneId = evt.item.getAttribute('data-scene-id');
                        const newPosition = evt.newIndex;
                        updateSceneOrder(chapter, sceneId, newPosition);
                    }
                });
            }
        }

        showScreen('chapterDetails');
    }
    
    async function displaySceneDetails(scene) {
        console.log('Displaying scene details:', scene);
        await setCurrentItem(scene, 'scene');

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

        showScreen('sceneDetails');
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
        const item = getCurrentItem();
        const type = getCurrentItemType();
        if (item && type === itemType) {
            // NEW: Using TagService from modular architecture
            app.tagService.removeTagFromItem(item, tagToRemove);
            console.log(`Removed tag "${tagToRemove}" from ${itemType}`, item.tags);

            updateBook(getBooks(), getCurrentBook());
            displayTagsForItem(item, itemType);
            populateTagDropdowns(getCurrentBook());
        } else {
            console.error(`Cannot remove tag: currentItem is ${item} and currentItemType is ${type}`);
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
                    li.addEventListener('click', async () => {
                        await setCurrentItem(note, 'note');
                        displayNoteDetails(note);
                    });
                    notesList.appendChild(li);
                });
            }
        }
    }

    function addItemToScene(scene, itemType, itemName) {
        if (!scene[itemType]) {
            scene[itemType] = [];
        }
        if (!scene[itemType].includes(itemName)) {
            scene[itemType].push(itemName);
            const book = getCurrentBook();
            updateBook(getBooks(), book);
            displaySceneDetails(scene);
        }
    }

    function removeItemFromScene(scene, itemType, itemName) {
        if (scene[itemType]) {
            const index = scene[itemType].indexOf(itemName);
            if (index > -1) {
                scene[itemType].splice(index, 1);
                const book = getCurrentBook();
                updateBook(getBooks(), book);
                displaySceneDetails(scene);
            }
        }
    }

    function displayAndAddItems(scene, itemType, listElement, selectId) {
        listElement.innerHTML = '';
        const select = document.getElementById(selectId);
        select.innerHTML = `<option value="">Add a ${itemType.slice(0, -1)}</option>`;

        const items = getCurrentBook()[itemType] || [];
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
                            const books = getBooks();
                            books.push(importedBook);
                            updateBook(books, importedBook);
                            alert('Book imported successfully');
                            displayBooks(getBooks());
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
        const item = getCurrentItem();
        const type = getCurrentItemType();
        if (item && type === itemType) {
            // NEW: Using TagService from modular architecture
            const added = app.tagService.addTagToItem(item, tag);

            if (added) {
                console.log(`Added tag "${tag}" to ${itemType}`, item.tags);

                // Add the tag to the book's overall tag list
                const book = getCurrentBook();
                app.tagService.addTagToBook(book, tag);
                console.log(`Added tag "${tag}" to book's tag list`, book.tags);

                updateBook(getBooks(), book);
                displayTagsForItem(item, itemType);
                populateTagDropdowns(book);
            } else {
                console.log(`Tag "${tag}" already exists on ${itemType}`);
            }
        } else {
            console.error(`Cannot add tag: currentItem is ${item} and currentItemType is ${type}`);
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
            const item = getCurrentItem();
            const type = getCurrentItemType();
            if (item && type === 'note') {
                console.log('Editing note:', item);
                openNoteEditor(item);
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
            const book = getCurrentBook();
            if (characterName && book) {
                addCharacter(book, characterName);
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
            const book = getCurrentBook();
            if (locationName && book) {
                addLocation(book, locationName);
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
            const book = getCurrentBook();
            if (plotPointTitle && book) {
                addPlotPoint(book, plotPointTitle);
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
            const book = getCurrentBook();
            if (tagName && book) {
                if (!book.tags.includes(tagName)) {
                    book.tags.push(tagName);
                    updateBook(getBooks(), book);
                    displayBookDetails(book);
                    populateTagDropdowns(book);
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

            const book = getCurrentBook();
            if (character1 && character2 && relationshipType && book) {
                addRelationship(book, character1, character2, relationshipType);
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
            const book = getCurrentBook();
            if (newNoteTitleInput && book) {
                const noteTitle = newNoteTitleInput.value.trim();
                if (noteTitle) {
                    const newNote = addNote(book, noteTitle, '');
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
        const book = getCurrentBook();
        if (newChapterTitleInput && book) {
            const chapterTitle = newChapterTitleInput.value.trim();
            if (chapterTitle) {
                const newChapter = addChapter(book, chapterTitle);
                newChapterTitleInput.value = '';
                displayChapterDetails(newChapter, book.chapters.length - 1);
                displayBookDetails(book);
            }
        }
    });
}

const addSceneButton = document.getElementById('addScene');
if (addSceneButton) {
    addSceneButton.addEventListener('click', function () {
        const newSceneTitleInput = document.getElementById('newSceneTitle');
        const book = getCurrentBook();
        if (newSceneTitleInput && book) {
            const sceneTitle = newSceneTitleInput.value.trim();
            if (sceneTitle) {
                const chapterIndex = book.chapters.indexOf(getCurrentItem());
                const newScene = addScene(book, chapterIndex, sceneTitle);
                newSceneTitleInput.value = '';
                displaySceneDetails(newScene, book.scenes.length - 1);
            }
        }
    });
}

const saveCharacterButton = document.getElementById('saveCharacter');
if (saveCharacterButton) {
    saveCharacterButton.addEventListener('click', async function () {
        const item = getCurrentItem();
        const type = getCurrentItemType();
        if (item && type === 'character') {
            // Using ItemService to update character with all fields
            const app = getApp();
            app.itemService.updateItem(item, {
                // Basic fields
                name: document.getElementById('characterName').value,
                nickname: document.getElementById('characterNickname').value,
                description: document.getElementById('characterDescription').value,
                scene: document.getElementById('characterScene').value,
                type: document.getElementById('characterType').value,

                // NEW: Basic Details
                age: document.getElementById('characterAge').value,
                occupation: document.getElementById('characterOccupation').value,
                pronouns: document.getElementById('characterPronouns').value,
                role: document.getElementById('characterRole').value,
                aliases: document.getElementById('characterAliases').value,
                status: document.getElementById('characterStatus').value,

                // NEW: Physical Description & Background
                physicalDescription: document.getElementById('characterPhysicalDescription').value,
                background: document.getElementById('characterBackground').value,

                // NEW: Character Depth
                personalityTraits: document.getElementById('characterPersonalityTraits').value,
                motivations: document.getElementById('characterMotivations').value,
                fears: document.getElementById('characterFears').value,
                voicePatterns: document.getElementById('characterVoicePatterns').value,
                internalConflict: document.getElementById('characterInternalConflict').value,
                externalConflict: document.getElementById('characterExternalConflict').value

                // Note: picture is handled separately by the upload handlers
            });

            const book = getCurrentBook();
            syncBookTagsFromItems(book);
            updateBook(getBooks(), book);
            displayCharacters(book.characters);
            displayTags(book.tags);
            populateTagDropdowns(book);
            refreshBookOverview(book);

            // Clear current item and update screen in state
            await app.stateManager.setState({
                currentItem: null,
                currentItemType: null,
                currentScreen: 'bookDetails'
            });

            showScreen('bookDetails');
        }
    });
}

// Character Picture Upload Handlers
const uploadPictureButton = document.getElementById('uploadPictureButton');
const pictureInput = document.getElementById('characterPictureInput');
const removePictureButton = document.getElementById('removePictureButton');
const picturePreview = document.getElementById('characterPicturePreview');

if (uploadPictureButton && pictureInput) {
    // Upload button triggers file input
    uploadPictureButton.addEventListener('click', function () {
        pictureInput.click();
    });

    // Handle file selection - automatically process image
    pictureInput.addEventListener('change', async function (event) {
        const file = event.target.files[0];
        if (!file) return;

        try {
            // Show loading state
            uploadPictureButton.textContent = 'Processing...';
            uploadPictureButton.disabled = true;

            // Process the image (validates, resizes to 200x200, center crops, compresses)
            const base64Image = await imageHandler.processImage(file);

            // Get current character and update picture
            const character = getCurrentItem();
            const type = getCurrentItemType();

            if (character && type === 'character') {
                character.picture = base64Image;

                // Update preview
                if (picturePreview) {
                    picturePreview.src = base64Image;
                    picturePreview.style.display = 'block';
                }

                // Show remove button
                if (removePictureButton) {
                    removePictureButton.style.display = 'inline-block';
                }

                // Save to storage
                const book = getCurrentBook();
                const app = getApp();
                await app.bookService.updateBook(book);
            }

            // Reset button
            uploadPictureButton.textContent = 'Upload Picture';
            uploadPictureButton.disabled = false;

            // Clear file input
            pictureInput.value = '';

        } catch (error) {
            alert(error.message);
            uploadPictureButton.textContent = 'Upload Picture';
            uploadPictureButton.disabled = false;
            pictureInput.value = '';
        }
    });
}

// Remove picture button
if (removePictureButton) {
    removePictureButton.addEventListener('click', async function () {
        const character = getCurrentItem();
        const type = getCurrentItemType();

        if (character && type === 'character') {
            // Remove picture from character
            character.picture = '';

            // Hide preview
            if (picturePreview) {
                picturePreview.style.display = 'none';
                picturePreview.src = '';
            }

            // Hide remove button
            removePictureButton.style.display = 'none';

            // Save to storage
            const book = getCurrentBook();
            const app = getApp();
            await app.bookService.updateBook(book);
        }
    });
}

observeCollapsibleSections();

const saveLocationButton = document.getElementById('saveLocation');
if (saveLocationButton) {
    saveLocationButton.addEventListener('click', async function () {
        const item = getCurrentItem();
        const type = getCurrentItemType();
        if (item && type === 'location') {
            // Using ItemService to update location
            const app = getApp();
            app.itemService.updateItem(item, {
                name: document.getElementById('locationName').value,
                description: document.getElementById('locationDescription').value,
                importance: document.getElementById('locationImportance').value
            });

            const book = getCurrentBook();
            syncBookTagsFromItems(book);
            updateBook(getBooks(), book);
            displayLocations(book.locations);
            displayTags(book.tags);
            populateTagDropdowns(book);
            refreshBookOverview(book);

            // Clear current item and update screen in state
            await app.stateManager.setState({
                currentItem: null,
                currentItemType: null,
                currentScreen: 'bookDetails'
            });

            showScreen('bookDetails');
        }
    });
}

const savePlotPointButton = document.getElementById('savePlotPoint');
if (savePlotPointButton) {
    savePlotPointButton.addEventListener('click', async function () {
        const item = getCurrentItem();
        const type = getCurrentItemType();
        if (item && type === 'plotPoint') {
            // Using ItemService to update plot point
            const app = getApp();
            app.itemService.updateItem(item, {
                title: document.getElementById('plotPointTitle').value,
                description: document.getElementById('plotPointDescription').value,
                characters: document.getElementById('plotPointCharacters').value,
                location: document.getElementById('plotPointLocation').value
            });

            const book = getCurrentBook();
            syncBookTagsFromItems(book);
            updateBook(getBooks(), book);
            displayPlotPoints(book.plotPoints);
            displayTags(book.tags);
            populateTagDropdowns(book);
            refreshBookOverview(book);

            // Clear current item and update screen in state
            await app.stateManager.setState({
                currentItem: null,
                currentItemType: null,
                currentScreen: 'bookDetails'
            });

            showScreen('bookDetails');
        }
    });
}

const saveChapterButton = document.getElementById('saveChapter');
if (saveChapterButton) {
    saveChapterButton.addEventListener('click', async function () {
        const item = getCurrentItem();
        const type = getCurrentItemType();
        if (item && type === 'chapter') {
            // Using ItemService to update chapter
            const app = getApp();
            app.itemService.updateItem(item, {
                title: document.getElementById('chapterTitle').value,
                summary: document.getElementById('chapterSummary').value
            });

            const book = getCurrentBook();
            updateBook(getBooks(), book);
            displayChapters(book.chapters);
            refreshBookOverview(book);

            // Clear current item and update screen in state
            await app.stateManager.setState({
                currentItem: null,
                currentItemType: null,
                currentScreen: 'bookDetails'
            });

            showScreen('bookDetails');
        }
    });
}

const saveSceneButton = document.getElementById('saveScene');
if (saveSceneButton) {
    saveSceneButton.addEventListener('click', async function () {
        console.log('Save Scene button clicked');
        const type = getCurrentItemType();
        if (type === 'scene') {
            const scene = getCurrentItem();
            const book = getCurrentBook();
            if (saveSceneDetails()) {
                console.log('Scene saved successfully');
                refreshBookOverview(book);
                // Navigate back to Chapter Details
                const chapter = findChapterBySceneId(book, scene.id);
                if (chapter) {
                    const chapterIndex = book.chapters.indexOf(chapter);

                    // Update state to reflect we're viewing this chapter
                    const app = getApp();
                    await app.stateManager.setState({
                        currentItem: chapter,
                        currentItemType: 'chapter',
                        currentScreen: 'chapterDetails'
                    });

                    displayChapterDetails(chapter, chapterIndex);
                } else {
                    console.error('Could not find the chapter for this scene');

                    // Clear current item when going back to book details
                    const app = getApp();
                    await app.stateManager.setState({
                        currentItem: null,
                        currentItemType: null,
                        currentScreen: 'bookDetails'
                    });

                    showScreen('bookDetails');
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
        const book = getCurrentBook();
        if (book) {
            const newWordCountInput = document.getElementById('newWordCount');
            const newTargetWordCountInput = document.getElementById('newTargetWordCount');
            if (newWordCountInput && newTargetWordCountInput) {
                const newWordCount = parseInt(newWordCountInput.value);
                const newTargetWordCount = parseInt(newTargetWordCountInput.value);

                if (!isNaN(newWordCount)) {
                    book.wordCount = newWordCount;
                }
                if (!isNaN(newTargetWordCount)) {
                    book.targetWordCount = newTargetWordCount;
                }

                updateBook(getBooks(), book);
                refreshBookOverview(book);
                newWordCountInput.value = '';
                newTargetWordCountInput.value = '';
            }
        }
    });
}

const viewRelationshipGraphButton = document.getElementById('viewRelationshipGraph');
if (viewRelationshipGraphButton) {
    viewRelationshipGraphButton.addEventListener('click', function () {
        const book = getCurrentBook();
        if (book) {
            showRelationshipGraph(book);
        }
    });
}

// Navigation
document.querySelectorAll('.backToBooks').forEach(button => {
    if (button) {
        button.addEventListener('click', async function () {
            // Clear current book and item when going back to book list
            const app = getApp();
            await app.stateManager.setState({
                currentBook: null,
                currentItem: null,
                currentItemType: null,
                currentScreen: 'bookList'
            });
            showScreen('bookList');
        });
    }
});

document.querySelectorAll('.backToBook, .backToChapter').forEach(button => {
    if (button) {
        button.addEventListener('click', async function () {
            if (getCurrentScreen() === 'sceneDetails') {
                navigateBackToChapter();
            } else {
                // Clear current item when going back to book details
                const app = getApp();
                await app.stateManager.setState({
                    currentItem: null,
                    currentItemType: null,
                    currentScreen: 'bookDetails'
                });
                showScreen('bookDetails');
            }
        });
    }
});

document.querySelectorAll('.backToBook').forEach(button => {
    if (button) {
        button.addEventListener('click', async function () {
            if (getCurrentScreen() === 'sceneDetails') {
                navigateBackToChapter();
            } else {
                // Clear current item when going back to book details
                const app = getApp();
                await app.stateManager.setState({
                    currentItem: null,
                    currentItemType: null,
                    currentScreen: 'bookDetails'
                });
                showScreen('bookDetails');
            }
        });
    }
});

// Helper Functions
function addCharacter(book, characterName) {
    // NEW: Using ItemService from modular architecture
    const app = getApp();
    const newCharacter = app.itemService.addItem(
        book,
        app.ItemTypes.CHARACTER,
        characterName
    );

    // Update and refresh UI
    updateBook(getBooks(), book);
    displayCharacters(book.characters);
    populateCharacterDropdowns();
    refreshBookOverview(book);
    return newCharacter;
}

function addLocation(book, locationName) {
    // Using ItemService from modular architecture
    const app = getApp();
    const newLocation = app.itemService.addItem(
        book,
        app.ItemTypes.LOCATION,
        locationName
    );

    updateBook(getBooks(), book);
    displayLocations(book.locations);
    refreshBookOverview(book);
    return newLocation;
}

function addPlotPoint(book, plotPointTitle) {
    // Using ItemService from modular architecture
    const app = getApp();
    const newPlotPoint = app.itemService.addItem(
        book,
        app.ItemTypes.PLOT_POINT,
        plotPointTitle
    );

    updateBook(getBooks(), book);
    displayPlotPoints(book.plotPoints);
    refreshBookOverview(book);
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

    updateBook(getBooks(), book);
    displayBookDetails(book);
}

function addNote(book, title, content = '') {
    console.log('Adding new note to book:', book.name);

    // Using ItemService from modular architecture
    const app = getApp();
    const newNote = app.itemService.addItem(
        book,
        app.ItemTypes.NOTE,
        title,
        content
    );

    console.log('New note added:', newNote);

    updateBook(getBooks(), book);
    console.log('Book updated with new note');

    displayNotes(book.notes);
    refreshBookOverview(book);
    console.log('Notes display updated');

    return newNote;
}

function addChapter(book, chapterTitle) {
    // Using ItemService from modular architecture
    const app = getApp();
    const newChapter = app.itemService.addItem(
        book,
        app.ItemTypes.CHAPTER,
        chapterTitle
    );

    updateBook(getBooks(), book);
    displayChapters(book.chapters);
    refreshBookOverview(book);
    return newChapter;
}

function addScene(book, chapterIndex, sceneTitle) {
    if (!book.scenes) book.scenes = [];

    // Using ItemService from modular architecture
    const app = getApp();
    const newScene = app.itemService.addItem(
        book,
        app.ItemTypes.SCENE,
        sceneTitle
    );

    if (!book.chapters[chapterIndex]) {
        console.error('Chapter not found at index:', chapterIndex);
        chapterIndex = 0; // Fallback to the first chapter
    }
    if (!book.chapters[chapterIndex].scenes) {
        book.chapters[chapterIndex].scenes = [];
    }
    // Use scene ID instead of index
    book.chapters[chapterIndex].scenes.push(newScene.id);

    updateBook(getBooks(), book);
    refreshBookOverview(book);
    displayChapterDetails(book.chapters[chapterIndex], chapterIndex);
    return newScene;
}

function navigateBackToChapter() {
    const book = getCurrentBook();
    const scene = getCurrentItem();
    if (book && scene && scene.id) {
        const chapter = findChapterBySceneId(book, scene.id);
        if (chapter) {
            const chapterIndex = book.chapters.indexOf(chapter);
            displayChapterDetails(chapter, chapterIndex);
        } else {
            console.warn('Chapter not found for this scene. Returning to book details.');
            showScreen('bookDetails');
        }
    } else {
        showScreen('bookDetails');
    }
}

function saveSceneDetails() {
    console.log('Saving scene details');

    try {
        const scene = getCurrentItem();
        if (!scene || !scene.id) {
            console.error('No valid scene to save');
            return false;
        }

        const book = getCurrentBook();
        if (!book) {
            console.error('No current book');
            return false;
        }

        // Using ItemService to update scene
        const app = getApp();
        app.itemService.updateItem(scene, {
            title: document.getElementById('sceneTitle').value,
            summary: document.getElementById('sceneSummary').value,
            characters: Array.from(document.getElementById('sceneCharacters').children).map(div => div.textContent.replace('×', '').trim()),
            locations: Array.from(document.getElementById('sceneLocations').children).map(div => div.textContent.replace('×', '').trim()),
            plotPoints: Array.from(document.getElementById('scenePlotPoints').children).map(div => div.textContent.replace('×', '').trim())
        });

        console.log('Updated scene:', scene);

        updateBook(getBooks(), book);
        refreshBookOverview(book);
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
    showScreen('relationshipGraph');
}

async function openNoteEditor(note) {
    console.log('Opening note editor for:', note);
    if (!note) {
        console.warn('No note provided, creating a new one');
        note = { id: Date.now(), title: '', content: '' };
    }
    await setCurrentItem(note, 'note');

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

    richTextEditor.onCancel(async () => {
        console.log('Note editing cancelled');

        // Clear current item and update screen in state
        const app = getApp();
        await app.stateManager.setState({
            currentItem: null,
            currentItemType: null,
            currentScreen: 'bookDetails'
        });

        showScreen('bookDetails');
    });

    showScreen('noteEditor');
    console.log('Note editor opened');
}

async function saveNote(updatedNote) {
    if (!updatedNote) {
        console.error('Attempted to save null note');
        return;
    }
    const book = getCurrentBook();
    if (!book.notes) {
        book.notes = [];
    }
    const index = book.notes.findIndex(n => n.id === updatedNote.id);
    if (index === -1) {
        console.log('Adding new note to book');
        book.notes.push(updatedNote);
    } else {
        console.log('Updating existing note at index:', index);
        book.notes[index] = updatedNote;
    }
    updateBook(getBooks(), book);
    displayNotes(book.notes);
    refreshBookOverview(book);

    // Clear current item and update screen in state
    const app = getApp();
    await app.stateManager.setState({
        currentItem: null,
        currentItemType: null,
        currentScreen: 'bookDetails'
    });

    showScreen('bookDetails');
}

// Additional utility functions

function populateChapterSelect(select, currentChapterIndex) {
    select.innerHTML = '';
    const book = getCurrentBook();
    book.chapters.forEach((chapter, index) => {
        const option = document.createElement('option');
        option.value = index;
        option.textContent = chapter.title || `Chapter ${index + 1}`;
        if (index === currentChapterIndex) {
            option.selected = true;
        }
        select.appendChild(option);
    });
}

function moveSceneToChapter(sceneId, newChapterIndex) {
    const book = getCurrentBook();
    const oldChapter = findChapterBySceneId(book, sceneId);
    const newChapter = book.chapters[newChapterIndex];

    if (oldChapter && newChapter && oldChapter !== newChapter) {
        // Remove scene from old chapter and add to new chapter
        removeSceneFromChapter(oldChapter, sceneId);
        addSceneIdToChapter(newChapter, sceneId);

        updateBook(getBooks(), book);
        displayChapterDetails(newChapter, newChapterIndex);
    }
}

function updateSceneOrder(chapter, sceneId, newPosition) {
    if (reorderSceneInChapter(chapter, sceneId, newPosition)) {
        updateBook(getBooks(), getCurrentBook());
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
        const book = getCurrentBook();
        if (book) {
            dataManager.setCurrentBook(book);
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

        const book = getCurrentBook();
        if (character1Select && character2Select && book) {
            const characters = book.characters;

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

});
