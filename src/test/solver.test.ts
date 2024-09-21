import Solver from '../solver';
import { describe, expect, test, beforeEach } from '@jest/globals';
import fs from 'fs';
import path from 'path';

describe('Solver class', () => {
    let solver: Solver;
    let wordBank: string[];

    beforeEach(() => {
        solver = Solver.getInstance();
        const data = fs.readFileSync(path.join(__dirname, '../assets/word-bank.txt'), 'utf8');
        wordBank = data.split('\n').map(word => word.trim()).filter(word => word);
    });

    function getRandomWord(): string {
        return wordBank[Math.floor(Math.random() * wordBank.length)];
    }

    function simulateGuess(word: string, correctWord: string): [Map<string, number[]>, Map<string, number[]>, Map<string, number[]>] {
        let greenChars = new Map<string, number[]>();
        let yellowChars = new Map<string, number[]>();
        let greyChars = new Map<string, number[]>();

        for (let i = 0; i < word.length; i++) {
            let char = word.charAt(i);
            if (correctWord.charAt(i) === char) {
                greenChars.set(char, [...(greenChars.get(char) || []), i]);
            } else if (correctWord.includes(char)) {
                yellowChars.set(char, [...(yellowChars.get(char) || []), i]);
            } else {
                greyChars.set(char, [...(greyChars.get(char) || []), i]);
            }
        }

        return [greenChars, yellowChars, greyChars];
    }

    test('quordleSolver should solve within 9 guesses', () => {
        const correctWord = wordBank[Math.floor(Math.random() * wordBank.length)];
        let previousGuesses = [wordBank[Math.floor(Math.random() * wordBank.length)]]; // Start with a random initial guess
        let foundCorrectWord = false;
        let attempt = 0;

        console.log("Correct Word: " + correctWord);

        while (attempt < 9 && !foundCorrectWord) {
            let accumulatedGreenChars = new Map<string, number[]>();
            let accumulatedYellowChars = new Map<string, number[]>();
            let accumulatedGreyChars = new Map<string, number[]>();

            previousGuesses.forEach(guess => {
                let [greenChars, yellowChars, greyChars] = simulateGuess(guess, correctWord);
                greenChars.forEach((indices, char) => accumulatedGreenChars.set(char, indices));
                yellowChars.forEach((indices, char) => accumulatedYellowChars.set(char, indices));
                greyChars.forEach((indices, char) => accumulatedGreyChars.set(char, indices));
            });

            let result = solver.quordleSolver(accumulatedGreenChars, accumulatedYellowChars, accumulatedGreyChars, 1);
            expect(result).toBeDefined();

            let newGuess = result.length > 0 ? result[0] : ""; // Take the first suggested word for the next guess
            previousGuesses.push(newGuess);
            attempt++;

            console.log("New Guess: " + newGuess);

            if (newGuess === correctWord) {
                foundCorrectWord = true;
            }

            if (result.length === 0) {
                break; // No valid guesses left
            }
        }

        expect(foundCorrectWord).toBe(true);
    });
});
