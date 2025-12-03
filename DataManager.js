export class DataManager {
    constructor() {
        this.currentBook = null;
    }

    setCurrentBook(book) {
        this.currentBook = book;
    }

    exportToJSON() {
        if (!this.currentBook) {
            throw new Error('No book is currently loaded');
        }

        const jsonString = JSON.stringify(this.currentBook, null, 2);
        const blob = new Blob([jsonString], { type: 'application/json' });
        const url = URL.createObjectURL(blob);

        const a = document.createElement('a');
        a.href = url;
        a.download = `${this.currentBook.name}.json`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
    }

    importFromJSON(file) {
        return new Promise((resolve, reject) => {
            const reader = new FileReader();
            reader.onload = (event) => {
                try {
                    const importedBook = JSON.parse(event.target.result);
                    // Validate the imported data structure here
                    if (this.validateImportedBook(importedBook)) {
                        resolve(importedBook);
                    } else {
                        reject(new Error('Invalid book structure'));
                    }
                } catch (error) {
                    reject(new Error('Failed to parse JSON file'));
                }
            };
            reader.onerror = () => reject(new Error('Failed to read file'));
            reader.readAsText(file);
        });
    }

    validateImportedBook(book) {
        // Add validation logic here
        // Check for required fields and data types
        return (
            book &&
            typeof book.name === 'string' &&
            Array.isArray(book.characters) &&
            Array.isArray(book.locations) &&
            Array.isArray(book.plotPoints) &&
            Array.isArray(book.relationships) &&
            Array.isArray(book.notes) &&
            Array.isArray(book.tags) &&
            typeof book.wordCount === 'number' &&
            typeof book.targetWordCount === 'number' &&
            Array.isArray(book.chapters) &&
            Array.isArray(book.scenes)
        );
    }

    importFromNovelCrafter(_file) {
        // Placeholder for future implementation
        return Promise.reject(new Error('Import from NovelCrafter not yet implemented'));
    }

    importFromObsidian(_file) {
        // Placeholder for future implementation
        return Promise.reject(new Error('Import from Obsidian not yet implemented'));
    }

    // Additional import methods can be added here for other apps
}

