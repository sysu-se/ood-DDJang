import { getCandidates, findNakedSingle, hasConflicts, getInvalidCells, isValidPlacement } from './solver.js';
import { validateGrid } from './validation.js';

const GRID_SIZE = 9;
const VALID_VALUES = [0, 1, 2, 3, 4, 5, 6, 7, 8, 9];

function deepClone(obj) {
  return JSON.parse(JSON.stringify(obj));
}

function createSudoku(input, givenOverride) {
  validateGrid(input);
  const grid = deepClone(input);
  const givens = givenOverride ? deepClone(givenOverride) : grid.map(row => row.map(cell => cell !== 0));

  const sudoku = {
    getGrid() {
      return deepClone(grid);
    },

    getGivens() {
      return deepClone(givens);
    },

    isGiven(row, col) {
      return givens[row][col];
    },

    guess(move) {
      const { row, col, value } = move;
      if (givens[row][col]) {
        return false;
      }
      if (value < 0 || value > 9) {
        return false;
      }
      grid[row][col] = value;
      return true;
    },

    isEditable(row, col) {
      return !givens[row][col] && grid[row][col] === 0;
    },

    clone() {
      return createSudoku(grid, givens);
    },

    toJSON() {
      return {
        grid: deepClone(grid),
        givens: deepClone(givens)
      };
    },

    getCandidates(row, col) {
      return getCandidates(grid, row, col);
    },

    getNextHint() {
      return findNakedSingle(grid);
    },

    hasConflicts() {
      return hasConflicts(grid);
    },

    getInvalidCells() {
      return getInvalidCells(grid);
    },

    isComplete() {
      for (let row = 0; row < GRID_SIZE; row++) {
        for (let col = 0; col < GRID_SIZE; col++) {
          if (grid[row][col] === 0) return false;
        }
      }
      return !this.hasConflicts();
    },

    toString() {
      let out = '╔═══════╤═══════╤═══════╗\n';
      for (let row = 0; row < GRID_SIZE; row++) {
        if (row !== 0 && row % 3 === 0) {
          out += '╟───────┼───────┼───────╢\n';
        }
        for (let col = 0; col < GRID_SIZE; col++) {
          if (col === 0) {
            out += '║ ';
          } else if (col % 3 === 0) {
            out += '│ ';
          }
          out += (grid[row][col] === 0 ? '·' : grid[row][col]) + ' ';
          if (col === GRID_SIZE - 1) {
            out += '║';
          }
        }
        out += '\n';
      }
      out += '╚═══════╧═══════╧═══════╝';
      return out;
    }
  };

  return sudoku;
}

export {
  createSudoku,
  GRID_SIZE,
  VALID_VALUES,
  deepClone
};