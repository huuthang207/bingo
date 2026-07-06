import type { BoardCell, MarkedCell, WinRules } from "@bingo/shared";

export type CreateRoomResponse = {
  roomCode: string;
  hostToken: string;
  hostUrl: string;
  playerUrl: string;
};

export type JoinRoomResponse = {
  playerId: string;
  playerToken: string;
  board: BoardCell[][];
  boardRegenerationCount: number;
  boardRegenerationsRemaining: number;
};

export type CalledItem = {
  id: string;
  calledOrder: number;
  calledAt: string;
  item: Exclude<BoardCell, { type: "free" }>;
};

export type PlayerState = {
  playerId: string;
  name: string;
  board: BoardCell[][];
  markedCells: MarkedCell[];
  calledItems: CalledItem[];
  roomStatus: string;
  winRules: WinRules;
  boardRegenerationCount: number;
  boardRegenerationsRemaining: number;
};

export type HostPlayer = {
  id: string;
  name: string;
  isWinner: boolean;
  isOnline: boolean;
  joinedAt: string;
  lastSeenAt: string;
};

export type BingoClaim = {
  id: string;
  status: string;
  winningPattern: unknown;
  createdAt: string;
  reviewedAt: string | null;
  player: {
    id: string;
    name: string;
  };
};

export type HostState = {
  roomCode: string;
  title: string;
  status: string;
  boardSize: number;
  hasFreeCell: boolean;
  winRules: WinRules;
  players: HostPlayer[];
  calledItems: CalledItem[];
  claims: BingoClaim[];
};

export type RoomStateEvent = {
  roomCode: string;
  status: string;
  board?: BoardCell[][];
  markedCells?: MarkedCell[];
  calledItems?: CalledItem[];
  onlinePlayerCount?: number;
  boardRegenerationCount?: number;
  boardRegenerationsRemaining?: number;
};

export type OnlinePlayerCountEvent = {
  roomCode: string;
  onlinePlayerCount: number;
};

export type ItemCalledEvent = {
  item: Exclude<BoardCell, { type: "free" }>;
  calledOrder: number;
};

export type BingoClaimedEvent = {
  claimId: string;
  playerId: string;
  playerName: string;
  status: string;
  winningPattern: unknown;
};

export type BingoVerifiedEvent = {
  claimId: string;
  status: string;
  playerName: string;
};

export type BoardRegeneratedEvent = {
  roomCode: string;
  board: BoardCell[][];
  markedCells: MarkedCell[];
  boardRegenerationCount: number;
  boardRegenerationsRemaining: number;
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
