import type { BingoItem, BoardCell } from "@bingo/shared";

function shuffle<T>(items: T[]): T[] {
  return [...items].sort(() => Math.random() - 0.5);
}

export function generateBoard(items: BingoItem[], boardSize: number, hasFreeCell: boolean): BoardCell[][] {
  const totalCells = boardSize * boardSize;
  const requiredItems = hasFreeCell ? totalCells - 1 : totalCells;

  if (items.length < requiredItems) {
    throw new Error(`Not enough items. Required ${requiredItems}, received ${items.length}.`);
  }

  const selectedItems = shuffle(items).slice(0, requiredItems);
  const board: BoardCell[][] = [];
  const freeIndex = hasFreeCell ? Math.floor(totalCells / 2) : -1;
  let itemIndex = 0;

  for (let row = 0; row < boardSize; row += 1) {
    const rowCells: BoardCell[] = [];

    for (let col = 0; col < boardSize; col += 1) {
      const cellIndex = row * boardSize + col;

      if (cellIndex === freeIndex) {
        rowCells.push({ type: "free", value: "FREE", label: "FREE" });
      } else {
        rowCells.push(selectedItems[itemIndex]);
        itemIndex += 1;
      }
    }

    board.push(rowCells);
  }

  return board;
}
