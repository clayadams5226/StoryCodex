# Story Codex

Story Codex is a powerful Chrome extension designed to help writers organize and manage their story elements efficiently. It provides a comprehensive set of tools for tracking characters, locations, plot points, relationships, and more.

## Features

- **Book Management**: Create and manage multiple books within the extension.
- **Character Tracking**: Add detailed character profiles including name, nickname, description, memorable scenes, and character type.
- **Location Management**: Keep track of important locations in your story, including descriptions and their significance to the plot.
- **Plot Point Organization**: Outline your story's key events and keep them organized.
- **Relationship Mapping**: Define and visualize relationships between characters with an interactive graph.
- **Tagging System**: Add tags to characters, locations, and plot points for easy categorization and retrieval.
- **Notes**: Attach notes to any story element for additional details or reminders.
- **Word Count Tracker**: Set target word counts and track your progress.

## Installation

1. Clone this repository or download the source code.
2. Open Chrome and navigate to `chrome://extensions`.
3. Enable "Developer mode" in the top right corner.
4. Click "Load unpacked" and select the directory containing the extension files.

## Usage

1. Click on the Story Codex icon in your Chrome toolbar to open the extension.
2. Create a new book or select an existing one.
3. Use the intuitive interface to add and manage your story elements.
4. Explore the relationship graph to visualize character connections.
5. Track your writing progress with the word count feature.

## Development

### Running Tests

This project uses Jest for testing. To run the test suite:

```bash
# Install dependencies
npm install

# Run all tests
npm test

# Run tests in watch mode (re-runs on file changes)
npm run test:watch

# Run tests with coverage report
npm run test:coverage
```

### Test Structure

Tests are organized in the `tests/` directory:

- `DataManager.test.js` - Tests for import/export and validation
- `utils.test.js` - Tests for utility functions (showScreen, saveCurrentState, updateBook)
- `RichTextEditor.test.js` - Tests for the rich text editor component
- `integration.test.js` - End-to-end tests for core workflows

### What's Tested

The test suite ensures core functionality remains stable:

1. **Book Management**: Creating, updating, and managing multiple books
2. **Character Management**: Adding characters with tags, notes, and relationships
3. **Relationship System**: Creating and maintaining bidirectional character relationships
4. **Chapter/Scene Organization**: Creating chapters, adding scenes, and moving scenes between chapters
5. **Import/Export**: Validating book structure and maintaining data integrity
6. **Storage Persistence**: Saving and restoring state from Chrome storage
7. **UI Utilities**: Screen navigation and tag management

### Running Tests on Commit

To ensure code quality, run `npm test` before committing changes. Consider setting up a pre-commit hook:

```bash
# .git/hooks/pre-commit
#!/bin/sh
npm test
```

## Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

## License

N/A

## Contact

clayadams52@gmail.com