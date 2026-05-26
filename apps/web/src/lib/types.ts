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

export type DisplayState = {
  roomCode: string;
  title: string;
  status: string;
  calledItems: CalledItem[];
  playerCount: number;
  winners: Array<{
    id: string;
    name: string;
  }>;
};

export type RoomStateEvent = {
  roomCode: string;
  status: string;
  board?: BoardCell[][];
  markedCells?: MarkedCell[];
  calledItems?: CalledItem[];
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
  playerId: string;
  playerName: string;
  status: string;
};
