import type { MarkedCell } from "@bingo/shared";
import { prisma } from "../db.js";

export const restartedBoardRegenerationCount = 0;
export const restartedBoardRegenerationsRemaining = 3;

export type RestartGameError = {
  code: string;
  message: string;
};

export type GameRestartedEvent = {
  roomCode: string;
  status: "waiting";
  restartedAt: string;
  calledItems: [];
  markedCells: MarkedCell[];
  boardRegenerationCount: number;
  boardRegenerationsRemaining: number;
};

export function getRestartGameError(room: { status: string } | null): RestartGameError | null {
  if (!room) {
    return { code: "INVALID_TOKEN", message: "Host token không hợp lệ." };
  }

  if (room.status !== "ended") {
    return { code: "INVALID_ROOM_STATUS", message: "Only ended games can be restarted." };
  }

  return null;
}

type RestartGamePrismaClient = Pick<typeof prisma, "$transaction" | "bingoClaim" | "calledItem" | "player" | "room">;

export async function resetRoomForNewRound(roomId: string, client: RestartGamePrismaClient = prisma) {
  const markedCells: MarkedCell[] = [];

  await client.$transaction([
    client.bingoClaim.deleteMany({ where: { roomId } }),
    client.calledItem.deleteMany({ where: { roomId } }),
    client.player.updateMany({
      where: { roomId },
      data: { markedCells, isWinner: false, boardRegenerationCount: restartedBoardRegenerationCount },
    }),
    client.room.update({ where: { id: roomId }, data: { status: "waiting", endedAt: null } }),
  ]);
}

export function createGameRestartedEvent(roomCode: string, restartedAt = new Date()): GameRestartedEvent {
  return {
    roomCode,
    status: "waiting",
    restartedAt: restartedAt.toISOString(),
    calledItems: [],
    markedCells: [],
    boardRegenerationCount: restartedBoardRegenerationCount,
    boardRegenerationsRemaining: restartedBoardRegenerationsRemaining,
  };
}
