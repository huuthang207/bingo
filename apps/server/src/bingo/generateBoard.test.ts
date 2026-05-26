import assert from "node:assert/strict";
import test from "node:test";
import type { BingoItem } from "@bingo/shared";
import { generateBoard } from "./generateBoard.js";

function createItems(count: number): BingoItem[] {
  return Array.from({ length: count }, (_, index) => ({
    id: `item-${index + 1}`,
    type: "number",
    value: String(index + 1),
  }));
}

test("generateBoard creates a square board with a center free cell", () => {
  const board = generateBoard(createItems(24), 5, true);

  assert.equal(board.length, 5);
  assert.ok(board.every((row) => row.length === 5));
  assert.deepEqual(board[2][2], { type: "free", value: "FREE", label: "FREE" });
  assert.equal(board.flat().filter((cell) => cell.type === "free").length, 1);
  assert.equal(board.flat().filter((cell) => cell.type !== "free").length, 24);
});

test("generateBoard fills every cell when free cell is disabled", () => {
  const board = generateBoard(createItems(9), 3, false);

  assert.equal(board.length, 3);
  assert.ok(board.every((row) => row.length === 3));
  assert.equal(board.flat().filter((cell) => cell.type === "free").length, 0);
  assert.equal(board.flat().filter((cell) => cell.type !== "free").length, 9);
});

test("generateBoard rejects insufficient items", () => {
  assert.throws(() => generateBoard(createItems(23), 5, true), /Not enough items/);
  assert.throws(() => generateBoard(createItems(24), 5, false), /Not enough items/);
});
