import assert from "node:assert/strict";
import test from "node:test";
import type { BoardCell, MarkedCell, WinRules } from "@bingo/shared";
import { checkWin } from "./checkWin.js";

const allRules: WinRules = { horizontal: true, vertical: true, diagonal: true };

function createBoard(size: number): BoardCell[][] {
  return Array.from({ length: size }, (_, row) =>
    Array.from({ length: size }, (_, col) => ({
      id: `item-${row}-${col}`,
      type: "number",
      value: `${row}-${col}`,
    })),
  );
}

test("checkWin detects a completed horizontal line", () => {
  const markedCells: MarkedCell[] = [
    { row: 1, col: 0 },
    { row: 1, col: 1 },
    { row: 1, col: 2 },
  ];

  const result = checkWin(createBoard(3), markedCells, allRules);

  assert.equal(result.valid, true);
  assert.equal(result.pattern?.type, "horizontal");
  assert.deepEqual(result.pattern?.cells, markedCells);
});

test("checkWin detects a completed vertical line", () => {
  const markedCells: MarkedCell[] = [
    { row: 0, col: 2 },
    { row: 1, col: 2 },
    { row: 2, col: 2 },
  ];

  const result = checkWin(createBoard(3), markedCells, allRules);

  assert.equal(result.valid, true);
  assert.equal(result.pattern?.type, "vertical");
  assert.deepEqual(result.pattern?.cells, markedCells);
});

test("checkWin detects a completed diagonal line", () => {
  const markedCells: MarkedCell[] = [
    { row: 0, col: 0 },
    { row: 1, col: 1 },
    { row: 2, col: 2 },
  ];

  const result = checkWin(createBoard(3), markedCells, allRules);

  assert.equal(result.valid, true);
  assert.equal(result.pattern?.type, "diagonal");
  assert.deepEqual(result.pattern?.cells, markedCells);
});

test("checkWin treats free cells as already complete", () => {
  const board = createBoard(3);
  board[1][1] = { type: "free", value: "FREE", label: "FREE" };

  const result = checkWin(
    board,
    [
      { row: 0, col: 0 },
      { row: 2, col: 2 },
    ],
    allRules,
  );

  assert.equal(result.valid, true);
  assert.equal(result.pattern?.type, "diagonal");
});

test("checkWin respects disabled win rules", () => {
  const markedCells: MarkedCell[] = [
    { row: 0, col: 0 },
    { row: 0, col: 1 },
    { row: 0, col: 2 },
  ];

  const result = checkWin(createBoard(3), markedCells, { horizontal: false, vertical: true, diagonal: true });

  assert.equal(result.valid, false);
});

test("checkWin returns invalid when no enabled pattern is complete", () => {
  const result = checkWin(createBoard(3), [{ row: 0, col: 0 }], allRules);

  assert.deepEqual(result, { valid: false });
});
