import { z } from "zod";
import {
  MAX_PLAYER_NAME_LENGTH,
  MAX_ROOM_ITEMS,
  MAX_ROOM_TITLE_LENGTH,
  MIN_BOARD_SIZE,
  MAX_BOARD_SIZE,
} from "./constants.js";

export const winRulesSchema = z
  .object({
    horizontal: z.boolean(),
    vertical: z.boolean(),
    diagonal: z.boolean(),
  })
  .refine((rules) => rules.horizontal || rules.vertical || rules.diagonal, {
    message: "At least one win rule must be enabled",
  });

export const roomItemInputSchema = z.object({
  type: z.enum(["number", "text", "image"]),
  value: z.string().trim().min(1).max(500),
  label: z.string().trim().max(120).optional().nullable(),
});

export const createRoomSchema = z.object({
  title: z.string().trim().min(1).max(MAX_ROOM_TITLE_LENGTH),
  boardSize: z.number().int().min(MIN_BOARD_SIZE).max(MAX_BOARD_SIZE),
  hasFreeCell: z.boolean(),
  winRules: winRulesSchema,
  items: z.array(roomItemInputSchema).min(1).max(MAX_ROOM_ITEMS),
});

export const joinRoomSchema = z.object({
  name: z.string().trim().min(1).max(MAX_PLAYER_NAME_LENGTH),
});

export const markCellSchema = z.object({
  roomCode: z.string().trim().min(1),
  playerToken: z.string().trim().min(1),
  row: z.number().int().min(0),
  col: z.number().int().min(0),
});

export type CreateRoomInput = z.infer<typeof createRoomSchema>;
export type JoinRoomInput = z.infer<typeof joinRoomSchema>;
