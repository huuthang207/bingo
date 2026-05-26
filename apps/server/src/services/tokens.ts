import { createHash, randomBytes, timingSafeEqual } from "node:crypto";

export function createToken(): string {
  return randomBytes(32).toString("base64url");
}

export function hashToken(token: string): string {
  return createHash("sha256").update(token).digest("hex");
}

export function verifyToken(token: string, tokenHash: string): boolean {
  const expected = Buffer.from(tokenHash, "hex");
  const actual = Buffer.from(hashToken(token), "hex");

  return expected.length === actual.length && timingSafeEqual(expected, actual);
}
