import assert from "node:assert/strict";
import test from "node:test";
import { createGameRestartedEvent, getRestartGameError, resetRoomForNewRound, restartedBoardRegenerationCount, restartedBoardRegenerationsRemaining } from "./restartGame.js";

test("getRestartGameError accepts ended rooms", () => {
  assert.equal(getRestartGameError({ status: "ended" }), null);
});

test("getRestartGameError rejects missing rooms as invalid token", () => {
  assert.deepEqual(getRestartGameError(null), {
    code: "INVALID_TOKEN",
    message: "Host token không hợp lệ.",
  });
});

test("getRestartGameError rejects rooms that are not ended", () => {
  assert.deepEqual(getRestartGameError({ status: "waiting" }), {
    code: "INVALID_ROOM_STATUS",
    message: "Only ended games can be restarted.",
  });

  assert.deepEqual(getRestartGameError({ status: "playing" }), {
    code: "INVALID_ROOM_STATUS",
    message: "Only ended games can be restarted.",
  });
});

test("createGameRestartedEvent returns a waiting-room reset payload", () => {
  const restartedAt = new Date("2026-07-06T10:00:00.000Z");

  assert.deepEqual(createGameRestartedEvent("ABC123", restartedAt), {
    roomCode: "ABC123",
    status: "waiting",
    restartedAt: "2026-07-06T10:00:00.000Z",
    calledItems: [],
    markedCells: [],
    boardRegenerationCount: restartedBoardRegenerationCount,
    boardRegenerationsRemaining: restartedBoardRegenerationsRemaining,
  });
});

test("resetRoomForNewRound clears current-round data in one transaction", async () => {
  const calls: Array<{ method: string; args: unknown }> = [];
  const fakeClient = {
    bingoClaim: {
      deleteMany: (args: unknown) => {
        calls.push({ method: "bingoClaim.deleteMany", args });
        return "delete-claims";
      },
    },
    calledItem: {
      deleteMany: (args: unknown) => {
        calls.push({ method: "calledItem.deleteMany", args });
        return "delete-called-items";
      },
    },
    player: {
      updateMany: (args: unknown) => {
        calls.push({ method: "player.updateMany", args });
        return "update-players";
      },
    },
    room: {
      update: (args: unknown) => {
        calls.push({ method: "room.update", args });
        return "update-room";
      },
    },
    $transaction: async (operations: unknown[]) => {
      calls.push({ method: "$transaction", args: operations });
      return operations;
    },
  };

  await resetRoomForNewRound("room-1", fakeClient as never);

  assert.deepEqual(calls, [
    { method: "bingoClaim.deleteMany", args: { where: { roomId: "room-1" } } },
    { method: "calledItem.deleteMany", args: { where: { roomId: "room-1" } } },
    {
      method: "player.updateMany",
      args: {
        where: { roomId: "room-1" },
        data: { markedCells: [], isWinner: false, boardRegenerationCount: restartedBoardRegenerationCount },
      },
    },
    { method: "room.update", args: { where: { id: "room-1" }, data: { status: "waiting", endedAt: null } } },
    { method: "$transaction", args: ["delete-claims", "delete-called-items", "update-players", "update-room"] },
  ]);
});
