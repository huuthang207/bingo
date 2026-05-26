import type { BingoItem, BoardCell, MarkedCell, WinRules } from "@bingo/shared";
import { prisma } from "../db.js";
import { verifyToken } from "./tokens.js";

export function getAuthorizationToken(authorization: string | undefined): string | null {
  if (!authorization?.startsWith("Bearer ")) {
    return null;
  }

  return authorization.slice("Bearer ".length);
}

export function getWinRules(room: { winHorizontal: boolean; winVertical: boolean; winDiagonal: boolean }): WinRules {
  return {
    horizontal: room.winHorizontal,
    vertical: room.winVertical,
    diagonal: room.winDiagonal,
  };
}

export function toBingoItem(item: { id: string; type: string; value: string; label: string | null }): BingoItem {
  return {
    id: item.id,
    type: item.type as BingoItem["type"],
    value: item.value,
    label: item.label,
  };
}

export function parseBoard(value: unknown): BoardCell[][] {
  return value as BoardCell[][];
}

export function parseMarkedCells(value: unknown): MarkedCell[] {
  return Array.isArray(value) ? (value as MarkedCell[]) : [];
}

export async function getRoomForHost(roomCode: string, hostToken: string) {
  const room = await prisma.room.findUnique({ where: { roomCode } });

  if (!room || !verifyToken(hostToken, room.hostTokenHash)) {
    return null;
  }

  return room;
}

export async function getPlayerForToken(roomCode: string, playerToken: string) {
  const room = await prisma.room.findUnique({ where: { roomCode } });

  if (!room) {
    return null;
  }

  const players = await prisma.player.findMany({ where: { roomId: room.id } });
  const player = players.find((candidate) => verifyToken(playerToken, candidate.playerTokenHash));

  if (!player) {
    return null;
  }

  return { room, player };
}

export async function getCalledItems(roomId: string) {
  const calledItems = await prisma.calledItem.findMany({
    where: { roomId },
    include: { roomItem: true },
    orderBy: { calledOrder: "asc" },
  });

  return calledItems.map((calledItem) => ({
    id: calledItem.id,
    calledOrder: calledItem.calledOrder,
    calledAt: calledItem.calledAt,
    item: toBingoItem(calledItem.roomItem),
  }));
}
