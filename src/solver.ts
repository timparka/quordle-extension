class Solver {
    private static instance: Solver;
    private wordBank: string[] = [];
    private quadrantWordLists: string[][] = Array(4).fill(null).map(() => []);

    private constructor() {
        // Placeholder for word bank loading, adapt as necessary for your environment
    }

    public static getInstance(): Solver {
        if (!Solver.instance) {
            Solver.instance = new Solver();
        }
        return Solver.instance;
    }

    public async loadWordBank(): Promise<void> {
        try {
          const url = chrome.runtime.getURL('word-bank.txt');
          console.log(`Fetching word bank from URL: ${url}`);
          const response = await fetch(url);
          const text = await response.text();
          this.wordBank = text.split('\n').map(word => word.trim()).filter(word => word.length > 0);
          console.log(`Loaded ${this.wordBank.length} words into the word bank.`);
          this.initializeQuadrantWordLists();
          console.log('Word bank loaded successfully.');
        } catch (error) {
          console.error('Error loading word bank:', error);
        }
    }
      
    public getWordBankSizeForQuadrant(quadrant: number): number {
        return this.quadrantWordLists[quadrant]?.length || 0;
    }
    
    private initializeQuadrantWordLists(): void {
        for (let i = 0; i < 4; i++) {
            this.quadrantWordLists[i] = [...this.wordBank];
        }
    }

    public quordleSolver(
        greenChars: Map<string, number[]>,
        yellowChars: Map<string, number[]>,
        greyChars: Map<string, number[]>,
        quadrant: number
    ): string[] {
        this.filterWordsForQuadrant(greenChars, yellowChars, greyChars, quadrant);
        // Assuming one word suggestion per quadrant, adjust as necessary
        return this.quadrantWordLists[quadrant].slice(0, 3);
    }

    public filterWordsForQuadrant(
        greenChars: Map<string, number[]>,
        yellowChars: Map<string, number[]>,
        greyChars: Map<string, number[]>,
        quadrant: number
    ): void {
        let validWords = this.filterGreenCharacters(greenChars);
        let filteredYellow = this.filterYellowCharacters(yellowChars, validWords);
        let filteredGrey = this.filterGreyCharacters(greyChars, greenChars, yellowChars, filteredYellow);

        this.quadrantWordLists[quadrant] = filteredGrey;
    }

    private filterGreenCharacters(greenChars: Map<string, number[]>): string[] {
        return this.wordBank.filter(word => {
            for (let [char, indices] of greenChars) {
                if (!indices.every(index => word.charAt(index) === char)) {
                    return false;
                }
            }
            return true;
        });
    }

    private filterYellowCharacters(yellowChars: Map<string, number[]>, words: string[]): string[] {
        return words.filter(word => {
            for (let [char, indices] of yellowChars) {
                if (!word.includes(char) || indices.some(index => word.charAt(index) === char)) {
                    return false;
                }
            }
            return true;
        });
    }

    private filterGreyCharacters(greyChars: Map<string, number[]>, greenChars: Map<string, number[]>, yellowChars: Map<string, number[]>, words: string[]): string[] {
        // Create a copy of grey characters
        let filteredGreyChars = new Map<string, number[]>(greyChars);
    
        // Remove green and yellow characters from the grey list
        greenChars.forEach((_, char) => filteredGreyChars.delete(char));
        yellowChars.forEach((_, char) => filteredGreyChars.delete(char));
    
        return words.filter(word => {
            let isValid = true;
            for (let [char, indices] of filteredGreyChars) {
                // Check each index for the presence of the grey character in the word
                if (indices.some(index => word.charAt(index) === char)) {
                    isValid = false; // Invalidate word if any grey character is found in its specified position
                    break;
                }
            }
            return isValid;
        });
    }
    
}

export default Solver;
