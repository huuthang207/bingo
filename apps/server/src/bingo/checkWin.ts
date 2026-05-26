import type { BoardCell, CheckWinResult, MarkedCell, WinRules } from "@bingo/shared";

function isMarked(markedCells: MarkedCell[], row: number, col: number): boolean {
  return markedCells.some((cell) => cell.row === row && cell.col === col);
}

function isCompleteLine(board: BoardCell[][], markedCells: MarkedCell[], cells: MarkedCell[]): boolean {
  return cells.every(({ row, col }) => board[row][col].type === "free" || isMarked(markedCells, row, col));
}

export function checkWin(board: BoardCell[][], markedCells: MarkedCell[], winRules: WinRules): CheckWinResult {
  const size = board.length;

  if (winRules.horizontal) {
    for (let row = 0; row < size; row += 1) {
      const cells = Array.from({ length: size }, (_, col) => ({ row, col }));

      if (isCompleteLine(board, markedCells, cells)) {
        return { valid: true, pattern: { type: "horizontal", cells } };
      }
    }
  }

  if (winRules.vertical) {
    for (let col = 0; col < size; col += 1) {
      const cells = Array.from({ length: size }, (_, row) => ({ row, col }));

      if (isCompleteLine(board, markedCells, cells)) {
        return { valid: true, pattern: { type: "vertical", cells } };
      }
    }
  }

  if (winRules.diagonal) {
    const leftToRight = Array.from({ length: size }, (_, index) => ({ row: index, col: index }));
    const rightToLeft = Array.from({ length: size }, (_, index) => ({ row: index, col: size - 1 - index }));

    if (isCompleteLine(board, markedCells, leftToRight)) {
      return { valid: true, pattern: { type: "diagonal", cells: leftToRight } };
    }

    if (isCompleteLine(board, markedCells, rightToLeft)) {
      return { valid: true, pattern: { type: "diagonal", cells: rightToLeft } };
    }
  }

  return { valid: false };
}
