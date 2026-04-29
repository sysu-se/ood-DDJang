import { createSudoku } from './sudoku.js';
import { createHistoryManager } from './history.js';
import { validateMove, validateSudoku } from './validation.js';

function createGame({ sudoku, history = [], redoHistory = [] }) {
  validateSudoku(sudoku);

  let currentSudoku = sudoku.clone();
  const historyManager = createHistoryManager();
  historyManager.loadFromJSON(history, redoHistory);

  let isExploring = false;
  let explorationSnapshot = null;
  let explorationHistoryManager = null;

  const failedPathGrids = new Set();

  function gridKey(grid) {
    return grid.map(row => row.join('')).join('|');
  }

  function recordFailedPath() {
    failedPathGrids.add(gridKey(currentSudoku.getGrid()));
  }

  const game = {
    guess(move) {
      validateMove(move);
      if (isExploring) {
        explorationHistoryManager.push(currentSudoku);
      } else {
        historyManager.push(currentSudoku);
      }
      const success = currentSudoku.guess(move);
      return success;
    },

    undo() {
      if (isExploring) {
        const previousState = explorationHistoryManager.undo(currentSudoku);
        if (previousState) {
          currentSudoku = previousState;
          return true;
        }
        return false;
      } else {
        const previousState = historyManager.undo(currentSudoku);
        if (previousState) {
          currentSudoku = previousState;
          return true;
        }
        return false;
      }
    },

    redo() {
      if (isExploring) {
        const nextState = explorationHistoryManager.redo(currentSudoku);
        if (nextState) {
          currentSudoku = nextState;
          return true;
        }
        return false;
      } else {
        const nextState = historyManager.redo(currentSudoku);
        if (nextState) {
          currentSudoku = nextState;
          return true;
        }
        return false;
      }
    },

    canUndo() {
      if (isExploring) {
        return explorationHistoryManager.canUndo();
      }
      return historyManager.canUndo();
    },

    canRedo() {
      if (isExploring) {
        return explorationHistoryManager.canRedo();
      }
      return historyManager.canRedo();
    },

    getGrid() {
      return currentSudoku.getGrid();
    },

    getGivens() {
      return currentSudoku.getGivens();
    },

    getSudoku() {
      return currentSudoku.clone();
    },

    isGiven(row, col) {
      return currentSudoku.isGiven(row, col);
    },

    isEditable(row, col) {
      return currentSudoku.isEditable(row, col);
    },

    getCandidates(row, col) {
      return currentSudoku.getCandidates(row, col);
    },

    getHint() {
      return currentSudoku.getNextHint();
    },

    hasConflicts() {
      return currentSudoku.hasConflicts();
    },

    getInvalidCells() {
      return currentSudoku.getInvalidCells();
    },

    isComplete() {
      return currentSudoku.isComplete();
    },

    isExploring() {
      return isExploring;
    },

    enterExplore() {
      if (isExploring) return false;
      isExploring = true;
      explorationSnapshot = currentSudoku.clone();
      explorationHistoryManager = createHistoryManager();
      return true;
    },

    commitExploration() {
      if (!isExploring) return false;
      if (currentSudoku.hasConflicts()) {
        return false;
      }
      historyManager.push(explorationSnapshot);
      historyManager.mergeFrom(explorationHistoryManager);
      failedPathGrids.clear();
      explorationSnapshot = null;
      explorationHistoryManager = null;
      isExploring = false;
      return true;
    },

    abandonExploration() {
      if (!isExploring) return false;
      recordFailedPath();
      currentSudoku = explorationSnapshot;
      explorationSnapshot = null;
      explorationHistoryManager = null;
      isExploring = false;
      return true;
    },

    isFailedPath() {
      return failedPathGrids.has(gridKey(currentSudoku.getGrid()));
    },

    getFailedPathCount() {
      return failedPathGrids.size;
    },

    toJSON() {
      return {
        sudoku: currentSudoku.toJSON(),
        history: historyManager.getHistory(),
        redoHistory: historyManager.getRedoHistory(),
        isExploring,
        explorationSnapshot: explorationSnapshot ? explorationSnapshot.toJSON() : null,
        explorationHistory: isExploring ? explorationHistoryManager.getHistory() : [],
        explorationRedoHistory: isExploring ? explorationHistoryManager.getRedoHistory() : []
      };
    }
  };

  return game;
}

export {
  createGame
};