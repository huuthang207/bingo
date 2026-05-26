import { readdir, rm, stat } from "node:fs/promises";
import path from "node:path";
import { uploadsDirectory } from "../routes/uploads.js";

const defaultMaxAgeDays = 30;
const allowedExtensions = new Set([".jpg", ".jpeg", ".png", ".webp"]);

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
const cutoffTime = Date.now() - maxAgeDays * 24 * 60 * 60 * 1000;
const files = await readdir(uploadsDirectory, { withFileTypes: true });
let matchedCount = 0;
let removedCount = 0;
let skippedCount = 0;

for (const file of files) {
  if (!file.isFile()) {
    skippedCount += 1;
    continue;
  }

  const extension = path.extname(file.name).toLowerCase();

  if (!allowedExtensions.has(extension)) {
    skippedCount += 1;
    continue;
  }

  const filePath = path.join(uploadsDirectory, file.name);
  const fileStat = await stat(filePath);

  if (fileStat.mtimeMs > cutoffTime) {
    continue;
  }

  matchedCount += 1;

  if (shouldApply) {
    await rm(filePath);
    removedCount += 1;
  }
}

console.log(
  JSON.stringify(
    {
      uploadsDirectory,
      maxAgeDays,
      dryRun: !shouldApply,
      matchedCount,
      removedCount,
      skippedCount,
    },
    null,
    2,
  ),
);
