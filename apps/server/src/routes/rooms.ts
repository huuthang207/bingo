import { createRoomSchema, joinRoomSchema, type BingoItem } from "@bingo/shared";
import { Router, type RequestHandler } from "express";
import { generateBoard } from "../bingo/generateBoard.js";
import { prisma } from "../db.js";
import { rateLimit } from "../middleware/rateLimit.js";
import { isPlayerOnline } from "../services/onlinePlayers.js";
import { createRoomCode } from "../services/roomCode.js";
import { getAuthorizationToken, getCalledItems, getPlayerForToken, getRoomForHost, getWinRules, parseBoard, parseMarkedCells } from "../services/state.js";
import { createToken, hashToken } from "../services/tokens.js";

export const roomsRouter = Router();

const createRoomRateLimit = rateLimit({ keyPrefix: "create-room", windowMs: 60_000, maxRequests: 10 });
const joinRoomRateLimit = rateLimit({ keyPrefix: "join-room", windowMs: 60_000, maxRequests: 30 });
const maxBoardRegenerations = 3;

function boardRegenerationsRemaining(boardRegenerationCount: number) {
  return Math.max(0, maxBoardRegenerations - boardRegenerationCount);
}

const createRoomHandler: RequestHandler = async (request, response, next) => {
  try {
    const input = createRoomSchema.parse(request.body);
    const totalCells = input.boardSize * input.boardSize;
    const requiredItems = input.hasFreeCell ? totalCells - 1 : totalCells;

    if (input.items.length < requiredItems) {
      response.status(400).json({ message: `Cần tối thiểu ${requiredItems} item cho board này.` });
      return;
    }

    const roomCode = createRoomCode();
    const hostToken = createToken();

    const room = await prisma.room.create({
      data: {
        roomCode,
        title: input.title,
        hostTokenHash: hashToken(hostToken),
        boardSize: input.boardSize,
        hasFreeCell: input.hasFreeCell,
        winHorizontal: input.winRules.horizontal,
        winVertical: input.winRules.vertical,
        winDiagonal: input.winRules.diagonal,
        items: {
          create: input.items.map((item) => ({
            type: item.type,
            value: item.value,
            label: item.label,
          })),
        },
      },
    });

    response.status(201).json({
      roomCode: room.roomCode,
      hostToken,
      hostUrl: `/host/${room.roomCode}?token=${hostToken}`,
      playerUrl: `/play/${room.roomCode}`,
    });
  } catch (error) {
    next(error);
  }
};

roomsRouter.post("/", createRoomRateLimit, createRoomHandler);

roomsRouter.get("/:roomCode", async (request, response, next) => {
  try {
    const room = await prisma.room.findUnique({ where: { roomCode: request.params.roomCode } });

    if (!room) {
      response.status(404).json({ message: "Không tìm thấy phòng." });
      return;
    }

    response.json({
      roomCode: room.roomCode,
      title: room.title,
      status: room.status,
      boardSize: room.boardSize,
      hasFreeCell: room.hasFreeCell,
      winRules: {
        horizontal: room.winHorizontal,
        vertical: room.winVertical,
        diagonal: room.winDiagonal,
      },
    });
  } catch (error) {
    next(error);
  }
});

roomsRouter.get("/:roomCode/host-state", async (request, response, next) => {
  try {
    const hostToken = getAuthorizationToken(request.headers.authorization);

    if (!hostToken) {
      response.status(401).json({ message: "Thiếu host token." });
      return;
    }

    const room = await getRoomForHost(request.params.roomCode, hostToken);

    if (!room) {
      response.status(401).json({ message: "Host token không hợp lệ." });
      return;
    }

    const [players, calledItems, claims] = await Promise.all([
      prisma.player.findMany({
        where: { roomId: room.id },
        orderBy: { joinedAt: "asc" },
        select: { id: true, name: true, isWinner: true, joinedAt: true, lastSeenAt: true },
      }),
      getCalledItems(room.id),
      prisma.bingoClaim.findMany({
        where: { roomId: room.id },
        include: { player: { select: { id: true, name: true } } },
        orderBy: { createdAt: "desc" },
      }),
    ]);

    response.json({
      roomCode: room.roomCode,
      title: room.title,
      status: room.status,
      boardSize: room.boardSize,
      hasFreeCell: room.hasFreeCell,
      winRules: getWinRules(room),
      players: players.map((player) => ({
        ...player,
        isOnline: isPlayerOnline(player.id),
      })),
      calledItems,
      claims: claims.map((claim) => ({
        id: claim.id,
        status: claim.status,
        winningPattern: claim.winningPattern,
        createdAt: claim.createdAt,
        reviewedAt: claim.reviewedAt,
        player: claim.player,
      })),
    });
  } catch (error) {
    next(error);
  }
});

roomsRouter.get("/:roomCode/player-state", async (request, response, next) => {
  try {
    const playerToken = getAuthorizationToken(request.headers.authorization);

    if (!playerToken) {
      response.status(401).json({ message: "Thiếu player token." });
      return;
    }

    const result = await getPlayerForToken(request.params.roomCode, playerToken);

    if (!result) {
      response.status(401).json({ message: "Player token không hợp lệ." });
      return;
    }

    const calledItems = await getCalledItems(result.room.id);

    response.json({
      playerId: result.player.id,
      name: result.player.name,
      board: parseBoard(result.player.boardData),
      markedCells: parseMarkedCells(result.player.markedCells),
      calledItems,
      roomStatus: result.room.status,
      winRules: getWinRules(result.room),
      boardRegenerationCount: result.player.boardRegenerationCount,
      boardRegenerationsRemaining: boardRegenerationsRemaining(result.player.boardRegenerationCount),
    });
  } catch (error) {
    next(error);
  }
});

const joinRoomHandler: RequestHandler<{ roomCode: string }> = async (request, response, next) => {
  try {
    const input = joinRoomSchema.parse(request.body);
    const room = await prisma.room.findUnique({
      where: { roomCode: request.params.roomCode },
      include: { items: true },
    });

    if (!room) {
      response.status(404).json({ message: "Không tìm thấy phòng." });
      return;
    }

    if (room.status !== "waiting") {
      response.status(400).json({ message: room.status === "ended" ? "Phòng đã kết thúc." : "This game has already started. New players can't join now." });
      return;
    }

    const playerToken = createToken();
    const items: BingoItem[] = room.items.map((item) => ({
      id: item.id,
      type: item.type as BingoItem["type"],
      value: item.value,
      label: item.label,
    }));
    const board = generateBoard(items, room.boardSize, room.hasFreeCell);

    const player = await prisma.player.create({
      data: {
        roomId: room.id,
        name: input.name,
        playerTokenHash: hashToken(playerToken),
        boardData: board,
      },
    });

    response.status(201).json({
      playerId: player.id,
      playerToken,
      board,
      boardRegenerationCount: player.boardRegenerationCount,
      boardRegenerationsRemaining: boardRegenerationsRemaining(player.boardRegenerationCount),
    });
  } catch (error) {
    next(error);
  }
};

roomsRouter.post("/:roomCode/join", joinRoomRateLimit, joinRoomHandler);
