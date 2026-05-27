"use client";

import { useEffect, useMemo, useState } from "react";
import { AlertBox, PageShell, PixelButton, PixelPanel, StatCard, StatusBadge } from "@/components/PixelUi";
import { API_BASE_URL, apiFetch } from "@/lib/api";
import type { CreateRoomResponse } from "@/lib/types";

const starterItems = Array.from({ length: 40 }, (_, index) => String(index + 1)).join("\n");

type UploadResponse = {
  url: string;
  label: string | null;
};

type WinnerEstimate = {
  averageFirstWin: number;
  luckyOnePercent: number;
  typicalWinners: number;
};

function toAbsoluteImageUrl(url: string) {
  if (/^https?:\/\//.test(url)) {
    return url;
  }

  return `${API_BASE_URL}${url}`;
}

function appendItemLines(currentItems: string, lines: string[]) {
  const nextLines = lines.map((line) => line.trim()).filter(Boolean);

  if (!nextLines.length) {
    return currentItems;
  }

  return currentItems.trimEnd() ? `${currentItems.trimEnd()}\n${nextLines.join("\n")}` : nextLines.join("\n");
}

function fileNameLabel(fileName: string) {
  return fileName.replace(/\.[^.]+$/, "") || "Image";
}

function randomUniqueNumbers(count: number, min: number, max: number) {
  const pool = Array.from({ length: max - min + 1 }, (_, index) => min + index);

  for (let index = pool.length - 1; index > 0; index -= 1) {
    const swapIndex = Math.floor(Math.random() * (index + 1));
    [pool[index], pool[swapIndex]] = [pool[swapIndex], pool[index]];
  }

  return pool.slice(0, count).map(String);
}

function parseItems(rawItems: string) {
  return rawItems
    .split("\n")
    .map((item) => item.trim())
    .filter(Boolean)
    .map((line) => {
      const [kind, imageUrl, label] = line.split("|").map((part) => part.trim());

      if (kind?.toLowerCase() === "image" && imageUrl) {
        return {
          type: "image",
          value: imageUrl,
          label: label || "Image",
        };
      }

      return {
        type: /^\d+$/.test(line) ? "number" : "text",
        value: line,
      };
    });
}

function getWinningLines(boardSize: number, winRules: { horizontal: boolean; vertical: boolean; diagonal: boolean }) {
  const lines: number[][] = [];

  if (winRules.horizontal) {
    for (let row = 0; row < boardSize; row += 1) {
      lines.push(Array.from({ length: boardSize }, (_, col) => row * boardSize + col));
    }
  }

  if (winRules.vertical) {
    for (let col = 0; col < boardSize; col += 1) {
      lines.push(Array.from({ length: boardSize }, (_, row) => row * boardSize + col));
    }
  }

  if (winRules.diagonal) {
    lines.push(Array.from({ length: boardSize }, (_, index) => index * boardSize + index));
    lines.push(Array.from({ length: boardSize }, (_, index) => index * boardSize + (boardSize - 1 - index)));
  }

  return lines;
}

function hasBingo(cellItems: Array<number | null>, calledItems: Set<number>, lines: number[][]) {
  return lines.some((line) => line.every((cellIndex) => cellItems[cellIndex] === null || calledItems.has(cellItems[cellIndex])));
}

function shuffledIndexes(length: number) {
  const indexes = Array.from({ length }, (_, index) => index);

  for (let index = indexes.length - 1; index > 0; index -= 1) {
    const swapIndex = Math.floor(Math.random() * (index + 1));
    [indexes[index], indexes[swapIndex]] = [indexes[swapIndex], indexes[index]];
  }

  return indexes;
}

function estimateFirstWinner(
  itemCount: number,
  playerCount: number,
  boardSize: number,
  hasFreeCell: boolean,
  winRules: { horizontal: boolean; vertical: boolean; diagonal: boolean },
) {
  const totalCells = boardSize * boardSize;
  const requiredItems = hasFreeCell ? totalCells - 1 : totalCells;

  if (itemCount < requiredItems || playerCount <= 0 || (!winRules.horizontal && !winRules.vertical && !winRules.diagonal)) {
    return null;
  }

  const centerIndex = Math.floor(totalCells / 2);
  const lines = getWinningLines(boardSize, winRules);
  const iterations = 80;
  const firstWinCalls: number[] = [];
  const winnerCounts: number[] = [];

  for (let iteration = 0; iteration < iterations; iteration += 1) {
    const boards = Array.from({ length: playerCount }, () => {
      const boardItems = shuffledIndexes(itemCount).slice(0, requiredItems);
      return Array.from({ length: totalCells }, (_, index) => hasFreeCell && index === centerIndex ? null : boardItems.shift() ?? null);
    });
    const callOrder = shuffledIndexes(itemCount);
    const calledItems = new Set<number>();

    for (let callIndex = 0; callIndex < callOrder.length; callIndex += 1) {
      calledItems.add(callOrder[callIndex]);
      const winners = boards.filter((board) => hasBingo(board, calledItems, lines)).length;

      if (winners > 0) {
        firstWinCalls.push(callIndex + 1);
        winnerCounts.push(winners);
        break;
      }
    }
  }

  if (!firstWinCalls.length) {
    return null;
  }

  const sortedCalls = [...firstWinCalls].sort((a, b) => a - b);
  const sortedWinnerCounts = [...winnerCounts].sort((a, b) => a - b);
  const averageFirstWin = Math.round(firstWinCalls.reduce((sum, calls) => sum + calls, 0) / firstWinCalls.length);
  const luckyOnePercent = sortedCalls[Math.max(0, Math.floor(sortedCalls.length * 0.01) - 1)];
  const typicalWinners = sortedWinnerCounts[Math.floor(sortedWinnerCounts.length / 2)];

  return { averageFirstWin, luckyOnePercent, typicalWinners };
}

export function CreateRoomClient() {
  const [title, setTitle] = useState("Pixel Bingo Night");
  const [items, setItems] = useState(starterItems);
  const [boardSize, setBoardSize] = useState(5);
  const [hasFreeCell, setHasFreeCell] = useState(true);
  const [horizontal, setHorizontal] = useState(true);
  const [vertical, setVertical] = useState(true);
  const [diagonal, setDiagonal] = useState(true);
  const [result, setResult] = useState<CreateRoomResponse | null>(null);
  const [inviteCopyStatus, setInviteCopyStatus] = useState<"idle" | "copied" | "failed">("idle");
  const [estimatedPlayers, setEstimatedPlayers] = useState(50);
  const [winnerEstimate, setWinnerEstimate] = useState<WinnerEstimate | null>(null);
  const [winnerEstimatePlayerCount, setWinnerEstimatePlayerCount] = useState(estimatedPlayers);
  const [randomNumberCount, setRandomNumberCount] = useState(25);
  const [randomNumberMin, setRandomNumberMin] = useState(1);
  const [randomNumberMax, setRandomNumberMax] = useState(99);
  const [imageFiles, setImageFiles] = useState<File[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [itemActionError, setItemActionError] = useState<string | null>(null);
  const [uploadProgress, setUploadProgress] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isUploading, setIsUploading] = useState(false);

  const parsedItems = useMemo(() => parseItems(items), [items]);
  const itemTypeCounts = useMemo(() => ({
    image: parsedItems.filter((item) => item.type === "image").length,
    number: parsedItems.filter((item) => item.type === "number").length,
    text: parsedItems.filter((item) => item.type === "text").length,
  }), [parsedItems]);
  const winRules = useMemo(() => ({ horizontal, vertical, diagonal }), [horizontal, vertical, diagonal]);
  const requiredItems = hasFreeCell ? boardSize * boardSize - 1 : boardSize * boardSize;
  const canSubmit = title.trim().length > 0 && parsedItems.length >= requiredItems && (horizontal || vertical || diagonal);

  useEffect(() => {
    const timeoutId = window.setTimeout(() => {
      setWinnerEstimate(estimateFirstWinner(parsedItems.length, estimatedPlayers, boardSize, hasFreeCell, winRules));
      setWinnerEstimatePlayerCount(estimatedPlayers);
    }, 350);

    return () => window.clearTimeout(timeoutId);
  }, [boardSize, estimatedPlayers, hasFreeCell, parsedItems.length, winRules]);

  function addRandomNumbers() {
    setItemActionError(null);

    if (!Number.isInteger(randomNumberCount) || randomNumberCount <= 0) {
      setItemActionError("Number count must be greater than 0.");
      return;
    }

    if (randomNumberMin > randomNumberMax) {
      setItemActionError("Minimum number must be less than or equal to maximum number.");
      return;
    }

    const rangeSize = randomNumberMax - randomNumberMin + 1;

    if (randomNumberCount > rangeSize) {
      setItemActionError(`Range only has ${rangeSize} unique numbers.`);
      return;
    }

    setItems((currentItems) => appendItemLines(currentItems, randomUniqueNumbers(randomNumberCount, randomNumberMin, randomNumberMax)));
  }

  function clearItems() {
    setItemActionError(null);
    setItems("");
  }

  async function uploadImageItems() {
    if (!imageFiles.length) {
      setItemActionError("Please choose one or more image files.");
      return;
    }

    setItemActionError(null);
    setUploadProgress(null);
    setIsUploading(true);

    try {
      const imageLines: string[] = [];

      for (const [index, imageFile] of imageFiles.entries()) {
        setUploadProgress(`Uploading ${index + 1}/${imageFiles.length}`);
        const formData = new FormData();
        formData.append("file", imageFile);
        formData.append("label", fileNameLabel(imageFile.name));

        const response = await fetch(`${API_BASE_URL}/uploads`, {
          method: "POST",
          body: formData,
        });

        const payload = await response.json().catch(() => ({ message: "Could not upload the image." }));

        if (!response.ok) {
          throw new Error(payload.message ?? "Could not upload the image.");
        }

        const uploaded = payload as UploadResponse;
        const label = (uploaded.label ?? fileNameLabel(imageFile.name)) || "Image";
        imageLines.push(`image|${toAbsoluteImageUrl(uploaded.url)}|${label}`);
      }

      setItems((currentItems) => appendItemLines(currentItems, imageLines));
      setImageFiles([]);
      setUploadProgress(`Uploaded ${imageLines.length} image${imageLines.length === 1 ? "" : "s"}.`);
    } catch (caught) {
      setItemActionError(caught instanceof Error ? caught.message : "Could not upload the images.");
    } finally {
      setIsUploading(false);
    }
  }

  async function createRoom() {
    setError(null);
    setInviteCopyStatus("idle");
    setIsSubmitting(true);

    try {
      const createdRoom = await apiFetch<CreateRoomResponse>("/rooms", {
        method: "POST",
        body: JSON.stringify({
          title,
          boardSize,
          hasFreeCell,
          winRules: { horizontal, vertical, diagonal },
          items: parsedItems,
        }),
      });

      setResult(createdRoom);
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "Could not create the room.");
    } finally {
      setIsSubmitting(false);
    }
  }

  async function copyInviteLink() {
    if (!result) {
      return;
    }

    try {
      await navigator.clipboard.writeText(new URL(result.playerUrl, window.location.origin).toString());
      setInviteCopyStatus("copied");
      window.setTimeout(() => setInviteCopyStatus("idle"), 1800);
    } catch {
      setInviteCopyStatus("failed");
      window.setTimeout(() => setInviteCopyStatus("idle"), 1800);
    }
  }

  return (
    <PageShell>
      <div className="grid gap-6 lg:grid-cols-[0.78fr_1.22fr]">
        <aside className="space-y-5 lg:sticky lg:top-6 lg:self-start">
          <PixelPanel dark className="p-5 sm:p-7">
            <StatusBadge tone="warning">Create room</StatusBadge>
            <h1 className="pixel-title mt-5 text-4xl leading-tight sm:text-5xl">Create Bingo Arena</h1>
            <p className="mt-5 font-bold leading-7 text-pixel-muted">Enter items, choose win rules, then share the link so every player gets a unique board.</p>
          </PixelPanel>
          <StatCard label="Item ready" tone={parsedItems.length >= requiredItems ? "green" : "gold"} value={`${parsedItems.length}/${requiredItems}`} />
          <div className="grid grid-cols-3 gap-3">
            <StatCard label="Numbers" tone="cyan" value={itemTypeCounts.number} />
            <StatCard label="Text" tone="pink" value={itemTypeCounts.text} />
            <StatCard label="Images" tone="green" value={itemTypeCounts.image} />
          </div>
          <PixelPanel className="p-4 sm:p-5">
            <p className="pixel-label text-slate-600">Bingo win estimate</p>
            <label className="mt-3 block text-sm font-black text-slate-700" htmlFor="estimated-players">
              Estimated players
              <input className="pixel-input mt-2 px-2 py-1 text-sm" id="estimated-players" min={1} onChange={(event) => setEstimatedPlayers(Number(event.target.value))} type="number" value={estimatedPlayers} />
            </label>
            {winnerEstimate ? (
              <div className="mt-4 space-y-3 text-sm font-black leading-6 text-slate-700">
                <p>With {winnerEstimatePlayerCount} players vying for a Bingo, you will call about <span className="font-pixel text-xl text-pixel-ink">{winnerEstimate.averageFirstWin}</span> items before someone wins.</p>
                <p>There is a 1% chance that a lucky player wins after calling <span className="font-pixel text-xl text-pixel-ink">{winnerEstimate.luckyOnePercent}</span> items.</p>
                <p>Typically, <span className="font-pixel text-xl text-pixel-ink">{winnerEstimate.typicalWinners}</span> player{winnerEstimate.typicalWinners === 1 ? "" : "s"} will win at a time.</p>
              </div>
            ) : (
              <p className="mt-4 text-sm font-bold text-slate-600">Add enough items and at least one win rule to estimate the first winner.</p>
            )}
          </PixelPanel>
        </aside>

        <section className="space-y-5">
          <PixelPanel className="p-4 sm:p-6">
            <label className="pixel-label text-slate-600" htmlFor="title">Game title</label>
            <input className="pixel-input mt-3" id="title" onChange={(event) => setTitle(event.target.value)} value={title} />

            <div className="mt-6 grid gap-3 sm:grid-cols-2">
              <label className="flex min-h-16 items-center gap-3 border-4 border-pixel-ink bg-pixel-cyan p-4 font-black shadow-[4px_4px_0_#10101f]">
                <input checked={hasFreeCell} className="h-5 w-5 accent-pixel-ink" onChange={(event) => setHasFreeCell(event.target.checked)} type="checkbox" />
                Use a FREE center cell
              </label>
              <div className="border-4 border-pixel-ink bg-pixel-pink p-4 font-black text-pixel-ink shadow-[4px_4px_0_#10101f]">
                <p className="font-pixel text-sm font-black uppercase tracking-[0.08em]">Board size</p>
                <div className="mt-3 grid grid-cols-3 gap-2">
                  {[5, 6, 7].map((size) => (
                    <button className={`${boardSize === size ? "bg-pixel-gold" : "bg-white"} border-2 border-pixel-ink px-2 py-2 font-pixel text-sm font-black shadow-[2px_2px_0_#10101f]`} key={size} onClick={() => setBoardSize(size)} type="button">
                      {size}x{size}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          </PixelPanel>

          <PixelPanel className="p-4 sm:p-6">
            <p className="pixel-label text-slate-600">Win rules</p>
            <div className="mt-3 grid gap-3 sm:grid-cols-3">
              {[
                ["Rows", horizontal, setHorizontal],
                ["Columns", vertical, setVertical],
                ["Diagonals", diagonal, setDiagonal],
              ].map(([label, checked, setter]) => (
                <label className={`${checked ? "bg-pixel-gold" : "bg-white"} flex min-h-14 items-center gap-3 border-4 border-pixel-ink p-3 font-black shadow-[4px_4px_0_#10101f]`} key={label as string}>
                  <input checked={checked as boolean} className="h-5 w-5 accent-pixel-ink" onChange={(event) => (setter as (value: boolean) => void)(event.target.checked)} type="checkbox" />
                  {label as string}
                </label>
              ))}
            </div>
          </PixelPanel>

          <PixelPanel className="p-4 sm:p-6">
            <p className="pixel-label text-slate-600">Item list</p>
            <div className="mt-4 grid gap-4 xl:grid-cols-2">
              <div className="border-4 border-pixel-ink bg-pixel-cyan p-3 shadow-[4px_4px_0_#10101f]">
                <p className="font-pixel text-sm font-black uppercase tracking-[0.08em] text-pixel-ink">Add random numbers</p>
                <div className="mt-3 grid grid-cols-3 gap-2">
                  <label className="text-sm font-black" htmlFor="random-count">
                    Count
                    <input className="pixel-input mt-1 px-2 py-1 text-sm" id="random-count" min={1} onChange={(event) => setRandomNumberCount(Number(event.target.value))} type="number" value={randomNumberCount} />
                  </label>
                  <label className="text-sm font-black" htmlFor="random-min">
                    From
                    <input className="pixel-input mt-1 px-2 py-1 text-sm" id="random-min" onChange={(event) => setRandomNumberMin(Number(event.target.value))} type="number" value={randomNumberMin} />
                  </label>
                  <label className="text-sm font-black" htmlFor="random-max">
                    To
                    <input className="pixel-input mt-1 px-2 py-1 text-sm" id="random-max" onChange={(event) => setRandomNumberMax(Number(event.target.value))} type="number" value={randomNumberMax} />
                  </label>
                </div>
                <PixelButton className="mt-3 w-full text-sm" onClick={addRandomNumbers} variant="secondary">
                  Add numbers
                </PixelButton>
              </div>

              <div className="border-4 border-pixel-ink bg-pixel-green p-3 shadow-[4px_4px_0_#10101f]">
                <p className="font-pixel text-sm font-black uppercase tracking-[0.08em] text-pixel-ink">Upload images</p>
                <label className="mt-3 block text-sm font-black" htmlFor="image-files">
                  Choose images
                  <input accept="image/jpeg,image/png,image/webp" className="pixel-input mt-1 px-2 py-1 text-sm" id="image-files" multiple onChange={(event) => setImageFiles(Array.from(event.target.files ?? []))} type="file" />
                </label>
                <PixelButton className="mt-3 w-full text-sm" disabled={!imageFiles.length || isUploading} onClick={uploadImageItems} variant="success">
                  {isUploading ? uploadProgress ?? "Uploading" : `Add ${imageFiles.length || ""} image${imageFiles.length === 1 ? "" : "s"}`}
                </PixelButton>
                <p className="mt-2 text-xs font-bold text-pixel-ink/75">JPG, PNG, WEBP up to 2MB each.</p>
              </div>
            </div>

            {itemActionError ? <AlertBox className="mt-4" tone="danger">{itemActionError}</AlertBox> : null}
            {uploadProgress && !isUploading ? <AlertBox className="mt-4" tone="success">{uploadProgress}</AlertBox> : null}

            <div className="mt-5 border-4 border-pixel-ink bg-white p-3 shadow-[4px_4px_0_#10101f]">
              <div className="flex items-center justify-between gap-3">
                <p className="font-pixel text-sm font-black uppercase tracking-[0.08em] text-pixel-ink">Preview ({parsedItems.length})</p>
                <button className="pixel-badge bg-pixel-paper" onClick={clearItems} type="button">Clear</button>
              </div>
              <div className="mt-3 flex max-h-36 flex-wrap gap-2 overflow-auto pr-1">
                {parsedItems.length ? parsedItems.slice(0, 30).map((item, index) => (
                  <span className="pixel-chip max-w-36 truncate" key={`${item.value}-${index}`}>
                    {item.type === "image" ? "Image" : item.label ?? item.value}
                  </span>
                )) : <p className="font-bold text-slate-600">No items yet. Add random numbers or upload images to start.</p>}
                {parsedItems.length > 30 ? <span className="pixel-chip bg-pixel-gold">+{parsedItems.length - 30} more</span> : null}
              </div>
            </div>

            <details className="mt-5 border-4 border-pixel-ink bg-slate-100 p-3 shadow-[4px_4px_0_#10101f]">
              <summary className="pixel-label cursor-pointer text-slate-600">Advanced edit</summary>
              <AlertBox className="mt-3" tone="info">
                <p>Each line is one item. Numeric lines become number items; other lines become text items.</p>
                <p className="mt-1 break-all font-mono text-xs">Image: image|https://example.com/photo.jpg|Image name</p>
              </AlertBox>
              <textarea className="pixel-textarea mt-4 min-h-56 font-mono text-sm" id="items" onChange={(event) => setItems(event.target.value)} value={items} />
            </details>
          </PixelPanel>

          {error ? <AlertBox tone="danger">{error}</AlertBox> : null}

          <PixelPanel className="p-4 sm:p-6">
            <PixelButton className="w-full text-base sm:text-lg" disabled={!canSubmit || isSubmitting} onClick={createRoom}>
              {isSubmitting ? "Creating room" : "Create Bingo Room"}
            </PixelButton>
            {!canSubmit ? <p className="mt-3 text-sm font-bold text-slate-600">You need a game title, enough items, and at least one win rule.</p> : null}

            {result ? (
              <div className="mt-5 border-4 border-pixel-ink bg-pixel-green p-4 shadow-[4px_4px_0_#10101f]">
                <p className="pixel-label text-pixel-ink/70">Room is ready</p>
                <p className="mt-2 font-pixel text-4xl font-black text-pixel-ink">{result.roomCode}</p>
                <div className="mt-4 grid gap-3 sm:grid-cols-2">
                  <a className="pixel-button pixel-button-primary" href={result.hostUrl} rel="noreferrer" target="_blank">Open host</a>
                  <PixelButton className="w-full" onClick={copyInviteLink} variant="secondary">
                    {inviteCopyStatus === "copied" ? "Copied" : inviteCopyStatus === "failed" ? "Copy failed" : "Copy invite link"}
                  </PixelButton>
                </div>
              </div>
            ) : null}
          </PixelPanel>
        </section>
      </div>
    </PageShell>
  );
}
