import { GRID_SIZE, BOX_SIZE } from './constants.js';

const VALID_VALUES = [1, 2, 3, 4, 5, 6, 7, 8, 9];

function getRowValues(grid, row) {
  return grid[row].filter(v => v !== 0);
}

function getColValues(grid, col) {
  const values = [];
  for (let row = 0; row < GRID_SIZE; row++) {
    if (grid[row][col] !== 0) values.push(grid[row][col]);
  }
  return values;
}

function getBoxValues(grid, row, col) {
  const boxRow = Math.floor(row / BOX_SIZE) * BOX_SIZE;
  const boxCol = Math.floor(col / BOX_SIZE) * BOX_SIZE;
  const values = [];
  for (let r = boxRow; r < boxRow + BOX_SIZE; r++) {
    for (let c = boxCol; c < boxCol + BOX_SIZE; c++) {
      if (grid[r][c] !== 0) values.push(grid[r][c]);
    }
  }
  return values;
}

function getUsedValues(grid, row, col) {
  const rowVals = getRowValues(grid, row);
  const colVals = getColValues(grid, col);
  const boxVals = getBoxValues(grid, row, col);
  return [...new Set([...rowVals, ...colVals, ...boxVals])];
}

function isValidPlacement(grid, row, col, value) {
  for (let c = 0; c < GRID_SIZE; c++) {
    if (c !== col && grid[row][c] === value) return false;
  }
  for (let r = 0; r < GRID_SIZE; r++) {
    if (r !== row && grid[r][col] === value) return false;
  }
  const boxRow = Math.floor(row / BOX_SIZE) * BOX_SIZE;
  const boxCol = Math.floor(col / BOX_SIZE) * BOX_SIZE;
  for (let r = boxRow; r < boxRow + BOX_SIZE; r++) {
    for (let c = boxCol; c < boxCol + BOX_SIZE; c++) {
      if ((r !== row || c !== col) && grid[r][c] === value) return false;
    }
  }
  return true;
}

function hasConflict(grid, row, col, value) {
  for (let c = 0; c < GRID_SIZE; c++) {
    if (c !== col && grid[row][c] === value) return true;
  }
  for (let r = 0; r < GRID_SIZE; r++) {
    if (r !== row && grid[r][col] === value) return true;
  }
  const boxRow = Math.floor(row / BOX_SIZE) * BOX_SIZE;
  const boxCol = Math.floor(col / BOX_SIZE) * BOX_SIZE;
  for (let r = boxRow; r < boxRow + BOX_SIZE; r++) {
    for (let c = boxCol; c < boxCol + BOX_SIZE; c++) {
      if ((r !== row || c !== col) && grid[r][c] === value) return true;
    }
  }
  return false;
}

function getCandidates(grid, row, col) {
  if (grid[row][col] !== 0) return [];
  const used = getUsedValues(grid, row, col);
  return VALID_VALUES.filter(v => !used.includes(v));
}

function findNakedSingle(grid) {
  for (let row = 0; row < GRID_SIZE; row++) {
    for (let col = 0; col < GRID_SIZE; col++) {
      if (grid[row][col] === 0) {
        const candidates = getCandidates(grid, row, col);
        if (candidates.length === 1) {
          return { row, col, value: candidates[0], candidates };
        }
      }
    }
  }
  return null;
}

function hasConflicts(grid) {
  for (let row = 0; row < GRID_SIZE; row++) {
    for (let col = 0; col < GRID_SIZE; col++) {
      const value = grid[row][col];
      if (value !== 0) {
        grid[row][col] = 0;
        if (hasConflict(grid, row, col, value)) {
          grid[row][col] = value;
          return true;
        }
        grid[row][col] = value;
      }
    }
  }
  return false;
}

function getInvalidCells(grid) {
  const invalid = [];
  for (let row = 0; row < GRID_SIZE; row++) {
    for (let col = 0; col < GRID_SIZE; col++) {
      const value = grid[row][col];
      if (value !== 0) {
        grid[row][col] = 0;
        if (hasConflict(grid, row, col, value)) {
          invalid.push(`${col},${row}`);
        }
        grid[row][col] = value;
      }
    }
  }
  return invalid;
}

export {
  getCandidates,
  findNakedSingle,
  hasConflicts,
  getInvalidCells,
  isValidPlacement,
  VALID_VALUES
};