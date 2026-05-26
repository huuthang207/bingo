export type BingoItemType = "number" | "text" | "image";
export type RoomStatus = "waiting" | "playing" | "ended";
export type ClaimStatus = "pending" | "valid" | "invalid";

export type WinRules = {
  horizontal: boolean;
  vertical: boolean;
  diagonal: boolean;
};

export type BingoItem = {
  id: string;
  type: BingoItemType;
  value: string;
  label?: string | null;
};

export type FreeCell = {
  type: "free";
  value: "FREE";
  label: "FREE";
};

export type BoardCell = BingoItem | FreeCell;

export type MarkedCell = {
  row: number;
  col: number;
};

export type WinningPattern = {
  type: "horizontal" | "vertical" | "diagonal";
  cells: MarkedCell[];
};

export type CheckWinResult = {
  valid: boolean;
  pattern?: WinningPattern;
};
