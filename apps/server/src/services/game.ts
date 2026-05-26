import type { BoardCell, MarkedCell } from "@bingo/shared";

export function hasMarkedCell(markedCells: MarkedCell[], row: number, col: number): boolean {
  return markedCells.some((cell) => cell.row === row && cell.col === col);
}

export function getBoardCell(board: BoardCell[][], row: number, col: number): BoardCell | null {
  return board[row]?.[col] ?? null;
}

export function getCalledItemIds(calledItems: { roomItemId: string }[]): Set<string> {
  return new Set(calledItems.map((calledItem) => calledItem.roomItemId));
}

export function canMarkCell(board: BoardCell[][], calledItemIds: Set<string>, row: number, col: number): boolean {
  const cell = getBoardCell(board, row, col);

  if (!cell) {
    return false;
  }

  if (cell.type === "free") {
    return true;
  }

  return calledItemIds.has(cell.id);
}

export function addMarkedCell(markedCells: MarkedCell[], row: number, col: number): MarkedCell[] {
  if (hasMarkedCell(markedCells, row, col)) {
    return markedCells;
  }

  return [...markedCells, { row, col }];
}
