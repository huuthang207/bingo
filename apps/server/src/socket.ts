import { markCellSchema, type BingoItem, type MarkedCell } from "@bingo/shared";
import type { Server } from "socket.io";
import { checkWin } from "./bingo/checkWin.js";
import { generateBoard } from "./bingo/generateBoard.js";
import { prisma } from "./db.js";
import { addMarkedCell, canMarkCell, getCalledItemIds } from "./services/game.js";
import { logger } from "./services/logger.js";
import { addOnlinePlayer, countOnlinePlayers, removeOnlinePlayer } from "./services/onlinePlayers.js";
import { getCalledItems, getPlayerForToken, getRoomForHost, getWinRules, parseBoard, parseMarkedCells, toBingoItem } from "./services/state.js";

function emitError(socket: Parameters<Server["on"]>[1] extends (socket: infer S) => void ? S : never, code: string, message: string) {
  logger.warn("socket_error", { socketId: socket.id, code, message });
  socket.emit("error_message", { code, message });
}

async function getOnlinePlayerCount(roomId: string) {
  const players = await prisma.player.findMany({ where: { roomId }, select: { id: true } });
  return countOnlinePlayers(players.map((player) => player.id));
}

async function emitOnlinePlayerCount(io: Server, roomCode: string, roomId: string) {
  io.to(`room:${roomCode}`).emit("online_player_count_updated", {
    roomCode,
    onlinePlayerCount: await getOnlinePlayerCount(roomId),
  });
}

const maxBoardRegenerations = 3;

function boardRegenerationsRemaining(boardRegenerationCount: number) {
  return Math.max(0, maxBoardRegenerations - boardRegenerationCount);
}

export function registerSocketHandlers(io: Server) {
  io.on("connection", (socket) => {
    let connectedPlayer: { id: string; roomCode: string } | null = null;
    socket.on("join_room", async ({ roomCode, playerToken }: { roomCode: string; playerToken?: string }) => {
      if (!playerToken) {
        emitError(socket, "INVALID_TOKEN", "Thiếu player token.");
        return;
      }

      const result = await getPlayerForToken(roomCode, playerToken);

      if (!result) {
        emitError(socket, "INVALID_TOKEN", "Player token không hợp lệ.");
        return;
      }

      socket.join(`room:${roomCode}`);
      socket.join(`player:${result.player.id}`);
      connectedPlayer = { id: result.player.id, roomCode };
      const shouldEmitOnline = addOnlinePlayer(result.player.id, socket.id);
      logger.info("socket_join_room", { socketId: socket.id, roomCode, playerId: result.player.id });
      const updatedPlayer = await prisma.player.update({ where: { id: result.player.id }, data: { lastSeenAt: new Date() } });

      if (shouldEmitOnline) {
        io.to(`host:${roomCode}`).emit("player_joined", {
          player: {
            id: updatedPlayer.id,
            name: updatedPlayer.name,
            isWinner: updatedPlayer.isWinner,
            isOnline: true,
            joinedAt: updatedPlayer.joinedAt.toISOString(),
            lastSeenAt: updatedPlayer.lastSeenAt.toISOString(),
          },
        });
        await emitOnlinePlayerCount(io, roomCode, result.room.id);
      }

      socket.emit("room_state", {
        roomCode,
        status: result.room.status,
        board: parseBoard(result.player.boardData),
        markedCells: parseMarkedCells(result.player.markedCells),
        calledItems: await getCalledItems(result.room.id),
        onlinePlayerCount: await getOnlinePlayerCount(result.room.id),
        boardRegenerationCount: result.player.boardRegenerationCount,
        boardRegenerationsRemaining: boardRegenerationsRemaining(result.player.boardRegenerationCount),
      });
    });

    socket.on("host_join_room", async ({ roomCode, hostToken }: { roomCode: string; hostToken?: string }) => {
      if (!hostToken) {
        emitError(socket, "INVALID_TOKEN", "Thiếu host token.");
        return;
      }

      const room = await getRoomForHost(roomCode, hostToken);

      if (!room) {
        emitError(socket, "INVALID_TOKEN", "Host token không hợp lệ.");
        return;
      }

      socket.join(`room:${roomCode}`);
      socket.join(`host:${roomCode}`);
      logger.info("socket_host_join_room", { socketId: socket.id, roomCode });
      socket.emit("room_state", {
        roomCode,
        status: room.status,
        calledItems: await getCalledItems(room.id),
      });
    });

    socket.on("start_game", async ({ roomCode, hostToken }: { roomCode: string; hostToken?: string }) => {
      if (!hostToken) {
        emitError(socket, "INVALID_TOKEN", "Thiếu host token.");
        return;
      }

      const room = await getRoomForHost(roomCode, hostToken);

      if (!room) {
        emitError(socket, "INVALID_TOKEN", "Host token không hợp lệ.");
        return;
      }

      if (room.status !== "waiting") {
        emitError(socket, "INVALID_ROOM_STATUS", "Chỉ có thể bắt đầu phòng đang chờ.");
        return;
      }

      await prisma.room.update({ where: { id: room.id }, data: { status: "playing" } });
      logger.info("socket_start_game", { socketId: socket.id, roomCode });
      io.to(`room:${roomCode}`).emit("game_started", { roomCode, startedAt: new Date().toISOString() });
    });

    socket.on("call_next_item", async ({ roomCode, hostToken }: { roomCode: string; hostToken?: string }) => {
      if (!hostToken) {
        emitError(socket, "INVALID_TOKEN", "Thiếu host token.");
        return;
      }

      const room = await getRoomForHost(roomCode, hostToken);

      if (!room) {
        emitError(socket, "INVALID_TOKEN", "Host token không hợp lệ.");
        return;
      }

      if (room.status !== "playing") {
        emitError(socket, "INVALID_ROOM_STATUS", "Game chưa bắt đầu.");
        return;
      }

      const [items, calledItems] = await Promise.all([
        prisma.roomItem.findMany({ where: { roomId: room.id } }),
        prisma.calledItem.findMany({ where: { roomId: room.id } }),
      ]);
      const calledItemIds = getCalledItemIds(calledItems);
      const remainingItems = items.filter((item) => !calledItemIds.has(item.id));

      if (remainingItems.length === 0) {
        emitError(socket, "NO_ITEMS_LEFT", "Không còn item để gọi.");
        return;
      }

      const item = remainingItems[Math.floor(Math.random() * remainingItems.length)];
      const calledItem = await prisma.calledItem.create({
        data: {
          roomId: room.id,
          roomItemId: item.id,
          calledOrder: calledItems.length + 1,
        },
      });

      logger.info("socket_call_next_item", { socketId: socket.id, roomCode, itemId: item.id, calledOrder: calledItem.calledOrder });
      io.to(`room:${roomCode}`).emit("item_called", {
        item: toBingoItem(item),
        calledOrder: calledItem.calledOrder,
      });
    });

    socket.on("mark_cell", async (payload: unknown) => {
      const parsed = markCellSchema.safeParse(payload);

      if (!parsed.success) {
        emitError(socket, "INVALID_PAYLOAD", "Dữ liệu đánh dấu ô không hợp lệ.");
        return;
      }

      const { roomCode, playerToken, row, col } = parsed.data;
      const result = await getPlayerForToken(roomCode, playerToken);

      if (!result) {
        emitError(socket, "INVALID_TOKEN", "Player token không hợp lệ.");
        return;
      }

      if (result.room.status !== "playing") {
        emitError(socket, "INVALID_ROOM_STATUS", "Game chưa bắt đầu.");
        return;
      }

      const board = parseBoard(result.player.boardData);
      const calledItems = await prisma.calledItem.findMany({ where: { roomId: result.room.id } });

      if (!canMarkCell(board, getCalledItemIds(calledItems), row, col)) {
        emitError(socket, "CELL_NOT_CALLABLE", "Ô này chưa được gọi hoặc không tồn tại.");
        return;
      }

      const markedCells = addMarkedCell(parseMarkedCells(result.player.markedCells), row, col);

      await prisma.player.update({
        where: { id: result.player.id },
        data: { markedCells, lastSeenAt: new Date() },
      });

      logger.info("socket_mark_cell", { socketId: socket.id, roomCode, playerId: result.player.id, row, col });
      socket.emit("cell_marked", { row, col, markedCells });
    });

    socket.on("claim_bingo", async ({ roomCode, playerToken }: { roomCode: string; playerToken?: string }) => {
      if (!playerToken) {
        emitError(socket, "INVALID_TOKEN", "Thiếu player token.");
        return;
      }

      const result = await getPlayerForToken(roomCode, playerToken);

      if (!result) {
        emitError(socket, "INVALID_TOKEN", "Player token không hợp lệ.");
        return;
      }

      if (result.room.status !== "playing") {
        emitError(socket, "INVALID_ROOM_STATUS", "Game is not accepting Bingo claims.");
        return;
      }

      const board = parseBoard(result.player.boardData);
      const markedCells = parseMarkedCells(result.player.markedCells);
      const winResult = checkWin(board, markedCells, getWinRules(result.room));
      const now = new Date();

      const outcome = await prisma.$transaction(async (tx) => {
        const room = await tx.room.findUnique({ where: { id: result.room.id } });

        if (!room || room.status !== "playing") {
          return { type: "ended" as const };
        }

        const existingWinner = await tx.player.findFirst({ where: { roomId: room.id, isWinner: true }, select: { id: true } });

        if (existingWinner) {
          return { type: "ended" as const };
        }

        const claim = await tx.bingoClaim.create({
          data: {
            roomId: room.id,
            playerId: result.player.id,
            status: winResult.valid ? "valid" : "invalid",
            winningPattern: winResult.pattern ?? undefined,
            reviewedAt: now,
          },
        });

        if (!winResult.valid) {
          return { type: "invalid" as const, claim };
        }

        await tx.player.update({ where: { id: result.player.id }, data: { isWinner: true } });
        await tx.room.update({ where: { id: room.id }, data: { status: "ended", endedAt: now } });

        return { type: "valid" as const, claim };
      });

      if (outcome.type === "ended") {
        emitError(socket, "GAME_ALREADY_ENDED", "Game already has a winner.");
        return;
      }

      logger.info("socket_claim_bingo", { socketId: socket.id, roomCode, playerId: result.player.id, claimId: outcome.claim.id, status: outcome.claim.status });
      io.to(`host:${roomCode}`).emit("bingo_claimed", {
        claimId: outcome.claim.id,
        playerId: result.player.id,
        playerName: result.player.name,
        status: outcome.claim.status,
        winningPattern: winResult.pattern ?? null,
      });

      if (outcome.type === "valid") {
        io.to(`room:${roomCode}`).emit("bingo_verified", {
          claimId: outcome.claim.id,
          status: outcome.claim.status,
          playerName: result.player.name,
        });
        io.to(`room:${roomCode}`).emit("game_ended", { roomCode, endedAt: now.toISOString(), reason: "bingo_verified" });
      }
    });

    socket.on("restart_game", async ({ roomCode, hostToken }: { roomCode: string; hostToken?: string }) => {
      if (!hostToken) {
        emitError(socket, "INVALID_TOKEN", "Thiếu host token.");
        return;
      }

      const room = await getRoomForHost(roomCode, hostToken);

      if (!room) {
        emitError(socket, "INVALID_TOKEN", "Host token không hợp lệ.");
        return;
      }

      if (room.status !== "ended") {
        emitError(socket, "INVALID_ROOM_STATUS", "Only ended games can be restarted.");
        return;
      }

      await prisma.$transaction([
        prisma.calledItem.deleteMany({ where: { roomId: room.id } }),
        prisma.player.updateMany({ where: { roomId: room.id }, data: { markedCells: [], isWinner: false } }),
        prisma.room.update({ where: { id: room.id }, data: { status: "waiting", endedAt: null } }),
      ]);

      logger.info("socket_restart_game", { socketId: socket.id, roomCode });
      io.to(`room:${roomCode}`).emit("game_restarted", { roomCode, restartedAt: new Date().toISOString() });
    });

    socket.on("regenerate_board", async ({ roomCode, playerToken }: { roomCode: string; playerToken?: string }) => {
      if (!playerToken) {
        emitError(socket, "INVALID_TOKEN", "Thiếu player token.");
        return;
      }

      const result = await getPlayerForToken(roomCode, playerToken);

      if (!result) {
        emitError(socket, "INVALID_TOKEN", "Player token không hợp lệ.");
        return;
      }

      if (result.room.status !== "waiting") {
        emitError(socket, "INVALID_ROOM_STATUS", "Cards can only be regenerated before the game starts.");
        return;
      }

      const roomItems = await prisma.roomItem.findMany({ where: { roomId: result.room.id } });
      const items: BingoItem[] = roomItems.map(toBingoItem);
      const board = generateBoard(items, result.room.boardSize, result.room.hasFreeCell);
      const markedCells: MarkedCell[] = [];
      const updatedPlayers = await prisma.player.updateMany({
        where: { id: result.player.id, boardRegenerationCount: { lt: maxBoardRegenerations } },
        data: { boardData: board, markedCells, boardRegenerationCount: { increment: 1 }, lastSeenAt: new Date() },
      });

      if (updatedPlayers.count === 0) {
        emitError(socket, "BOARD_REGENERATION_LIMIT_REACHED", "You've reached the 3-card regeneration limit.");
        return;
      }

      const updatedPlayer = await prisma.player.findUniqueOrThrow({ where: { id: result.player.id }, select: { boardRegenerationCount: true } });

      logger.info("socket_regenerate_board", { socketId: socket.id, roomCode, playerId: result.player.id });
      socket.emit("board_regenerated", {
        roomCode,
        board,
        markedCells,
        boardRegenerationCount: updatedPlayer.boardRegenerationCount,
        boardRegenerationsRemaining: boardRegenerationsRemaining(updatedPlayer.boardRegenerationCount),
      });
    });

    socket.on("end_game", async ({ roomCode, hostToken }: { roomCode: string; hostToken?: string }) => {
      if (!hostToken) {
        emitError(socket, "INVALID_TOKEN", "Thiếu host token.");
        return;
      }

      const room = await getRoomForHost(roomCode, hostToken);

      if (!room) {
        emitError(socket, "INVALID_TOKEN", "Host token không hợp lệ.");
        return;
      }

      const endedAt = new Date();
      await prisma.room.update({ where: { id: room.id }, data: { status: "ended", endedAt } });
      logger.info("socket_end_game", { socketId: socket.id, roomCode });
      io.to(`room:${roomCode}`).emit("game_ended", { roomCode, endedAt: endedAt.toISOString() });
    });

    socket.on("disconnect", async () => {
      if (!connectedPlayer) {
        return;
      }

      const lastSeenAt = new Date();
      await prisma.player.update({ where: { id: connectedPlayer.id }, data: { lastSeenAt } });
      logger.info("socket_player_disconnect", { socketId: socket.id, roomCode: connectedPlayer.roomCode, playerId: connectedPlayer.id });

      if (removeOnlinePlayer(connectedPlayer.id, socket.id)) {
        const room = await prisma.room.findUnique({ where: { roomCode: connectedPlayer.roomCode }, select: { id: true } });

        io.to(`host:${connectedPlayer.roomCode}`).emit("player_left", {
          playerId: connectedPlayer.id,
          lastSeenAt: lastSeenAt.toISOString(),
        });

        if (room) {
          await emitOnlinePlayerCount(io, connectedPlayer.roomCode, room.id);
        }
      }

      connectedPlayer = null;
    });
  });
}
