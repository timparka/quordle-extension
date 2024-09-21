import Solver from "./solver";

type LetterPosition = { letter: string, position: number };
type CharPositions = LetterPosition[][];
type LetterBank = LetterPosition[][];

let currentSuggestions: { quadrant: number, suggestions: string[] }[] = [];
console.log("Content script loaded and setting up message listener");

const strongStartingWords = ["crane", "crate", "slant", "trace", "carte", "audio"];

// Helper function to convert Map to Object for easier logging
function mapToObject(map: Map<string, number[]>): { [key: string]: number[] } {
    const object: { [key: string]: number[] } = {};
    map.forEach((value, key) => {
        object[key] = value;
    });
    return object;
}

// Processes the game board and updates the solver's state
function processGameState(solver: Solver, gameBoard: Element, gameBoardIndex: number) {
    console.log(`Processing game state for Game Board ${gameBoardIndex + 1}...`);

    let greenChar: Map<string, number[]> = new Map();
    let yellowChar: Map<string, number[]> = new Map();
    let greyChar: Map<string, number[]> = new Map();

    const rows = gameBoard.querySelectorAll('.quordle-guess-row');
    console.log(`Found ${rows.length} rows for Game Board ${gameBoardIndex + 1}`);

    if (rows.length === 0) {
        console.log('No rows found - check the .quordle-guess-row selector');
        return;
    }

    Array.from(rows).forEach((row, rowIndex) => {
        const cells = row.querySelectorAll('.quordle-box');
        console.log(`Row ${rowIndex + 1} has ${cells.length} cells`);

        Array.from(cells).forEach((cell, cellIndex) => {
            const ariaLabel = cell.getAttribute('aria-label');
            if (ariaLabel) {
                console.log(`Aria-Label: ${ariaLabel}`); // Debugging aria-label
                const letterMatch = ariaLabel.match(/'(\w+)'|'Blank'/);
                if (letterMatch && letterMatch[1] && letterMatch[1] !== 'Blank') {
                    const letter = letterMatch[1].toLowerCase();

                    console.log(`Extracted Letter: ${letter} at Cell Index: ${cellIndex}`); // Debugging extracted letter

                    if (ariaLabel.includes('is correct')) {
                        console.log(`Letter ${letter} is correct at index ${cellIndex}`);
                        let greenIndices = greenChar.get(letter) || [];
                        greenIndices.push(cellIndex);
                        greenChar.set(letter, greenIndices);
                    } else if (ariaLabel.includes('is incorrect')) {
                        console.log(`Letter ${letter} is incorrect at index ${cellIndex}`);
                        let greyIndices = greyChar.get(letter) || [];
                        greyIndices.push(cellIndex);
                        greyChar.set(letter, greyIndices);
                    } else if (ariaLabel.includes('is in a different spot')) {
                        console.log(`Letter ${letter} is misplaced at index ${cellIndex}`);
                        let yellowIndices = yellowChar.get(letter) || [];
                        yellowIndices.push(cellIndex);
                        yellowChar.set(letter, yellowIndices);
                    }
                }
            }
        });
    });

    // Logging character maps before solver call
    console.log(`Green Characters Map for Board ${gameBoardIndex + 1}:`, [...greenChar]);
    console.log(`Yellow Characters Map for Board ${gameBoardIndex + 1}:`, [...yellowChar]);
    console.log(`Grey Characters Map for Board ${gameBoardIndex + 1}:`, [...greyChar]);

    let suggestions = solver.quordleSolver(
        greenChar,
        yellowChar,
        greyChar,
        gameBoardIndex
    );
    
    if (Array.from(rows).every(row => row.querySelector('.quordle-box[aria-label*="Blank"]'))) {
        // If no guesses have been made, use a strong starting word
        console.log(`No guesses made yet. Suggesting a strong starting word for Game Board ${gameBoardIndex + 1}.`);
        currentSuggestions[gameBoardIndex] = { quadrant: gameBoardIndex, suggestions: [strongStartingWords[Math.floor(Math.random() * strongStartingWords.length)]] };
    } else {
        // Process the game state normally if guesses have been made
        let suggestions = solver.quordleSolver(greenChar, yellowChar, greyChar, gameBoardIndex);
        console.log(`Suggestions for Game Board ${gameBoardIndex + 1}: ${suggestions.join(', ')}`);
        currentSuggestions[gameBoardIndex] = { quadrant: gameBoardIndex, suggestions };
    }
    
    if (gameBoardIndex === 3) {
        console.log(`Final generated suggestions: ${JSON.stringify(currentSuggestions)}`);
        sendSuggestionsToPopup(currentSuggestions);
    }
}

// Function to send the suggestions to the popup script
function sendSuggestionsToPopup(suggestionsList: any[]) {
    console.log(`Sending suggestions to popup:`, JSON.stringify(suggestionsList));
    chrome.runtime.sendMessage({ type: 'suggestions', data: suggestionsList });
}

// Sets up an observer on the Quordle game boards to detect changes
function observeQuordleBoard(solver: Solver) {
    console.log('Setting up observer on the Quordle game boards...');

    const middleContainer = document.querySelector('.middle-container');
    if (!middleContainer) {
        console.error('Middle container not found!');
        return;
    }

    const gameBoardsRow1 = middleContainer.querySelector('#game-board-row-1');
    const gameBoardsRow2 = middleContainer.querySelector('#game-board-row-2');

    if (!gameBoardsRow1 || !gameBoardsRow2) {
        console.error('Game board rows not found!');
        return;
    }

    const allGameBoards: HTMLElement[] = [];
    gameBoardsRow1.querySelectorAll('div[aria-label^="Game Board"]').forEach(board => allGameBoards.push(board as HTMLElement));
    gameBoardsRow2.querySelectorAll('div[aria-label^="Game Board"]').forEach(board => allGameBoards.push(board as HTMLElement));

    allGameBoards.forEach((gameBoard, index) => {
        console.log(`Checking initial state and setting up observer for Game Board ${index + 1}...`);

        // Initial call to process the game state
        processGameState(solver, gameBoard, index);

        const observer = new MutationObserver((mutations) => {
            const isRelevantMutation = mutations.some(mutation => mutation.type === 'childList' && mutation.addedNodes.length > 0 || (mutation.type === 'attributes' && mutation.attributeName === 'aria-label'));
            if (isRelevantMutation) {
                console.log(`Relevant mutation observed for Game Board ${index + 1}. Reprocessing state.`);
                processGameState(solver, gameBoard, index);
            }
        });

        observer.observe(gameBoard, {
            childList: true,
            attributes: true,
            characterData: true,
            subtree: true,
            attributeFilter: ['aria-label']
        });
    });
}

// The main function to start the extension's logic
function startExtension() {
    console.log('Starting extension...');
    const solver = Solver.getInstance(); // Ensure Solver is correctly instantiated

    // Load the word bank asynchronously and then set up observers
    console.log('Loading word bank...');
    solver.loadWordBank().then(() => {
        console.log('Word bank loaded successfully.');
        observeQuordleBoard(solver);
    }).catch(error => {
        console.error('Failed to load word bank:', error);
    });
}


// Listening for messages from the popup
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
    console.log("Content script received message:", message);

    if (message.type === 'requestSuggestions') {
        console.log('Popup requested suggestions.');
        sendResponse({ status: 'suggestions sent', data: currentSuggestions });
    } else {
        console.log('Received an unknown type of message.');
    }
    return true;
});

startExtension();
