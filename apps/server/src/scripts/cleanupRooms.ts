import { prisma } from "../db.js";

const defaultMaxAgeDays = 30;

function getArgValue(name: string): string | null {
  const prefix = `--${name}=`;
  const arg = process.argv.find((value) => value.startsWith(prefix));
  return arg ? arg.slice(prefix.length) : null;
}

function getMaxAgeDays() {
  const rawValue = getArgValue("max-age-days");

  if (!rawValue) {
    return defaultMaxAgeDays;
  }

  const parsed = Number(rawValue);

  if (!Number.isFinite(parsed) || parsed < 1) {
    throw new Error("--max-age-days must be a positive number.");
  }

  return parsed;
}

const maxAgeDays = getMaxAgeDays();
const shouldApply = process.argv.includes("--apply");
const cutoffDate = new Date(Date.now() - maxAgeDays * 24 * 60 * 60 * 1000);

const rooms = await prisma.room.findMany({
  where: {
    status: "ended",
    endedAt: { lte: cutoffDate },
  },
  select: {
    id: true,
    roomCode: true,
    title: true,
    endedAt: true,
    _count: {
      select: {
        items: true,
        players: true,
        calledItems: true,
        bingoClaims: true,
      },
    },
  },
  orderBy: { endedAt: "asc" },
});

let removedCount = 0;

if (shouldApply && rooms.length > 0) {
  const result = await prisma.room.deleteMany({
    where: { id: { in: rooms.map((room) => room.id) } },
  });
  removedCount = result.count;
}

console.log(
  JSON.stringify(
    {
      maxAgeDays,
      cutoffDate: cutoffDate.toISOString(),
      dryRun: !shouldApply,
      matchedCount: rooms.length,
      removedCount,
      rooms: rooms.map((room) => ({
        roomCode: room.roomCode,
        title: room.title,
        endedAt: room.endedAt,
        counts: room._count,
      })),
    },
    null,
    2,
  ),
);

await prisma.$disconnect();
