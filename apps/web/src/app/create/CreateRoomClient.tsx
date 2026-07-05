"use client";

import { useEffect, useMemo, useState } from "react";
import { AlertBox, PageShell, PixelButton, PixelPanel, StatCard, StatusBadge } from "@/components/PixelUi";
import { API_BASE_URL, apiFetch } from "@/lib/api";
import type { CreateRoomResponse } from "@/lib/types";

const starterItems = "";
const maxImageFilesPerUpload = 10;
const maxRoomItems = 250;

type UploadResponse = {
  items: Array<{
    url: string;
    label: string | null;
  }>;
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
  return fileName.replace(/\.[^.]+$/, "") || "Ảnh";
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
          label: label || "Ảnh",
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
  const [title, setTitle] = useState("Đêm Bingo Pixel");
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
  const [randomNumberCount, setRandomNumberCount] = useState(99);
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
  const remainingItemCapacity = Math.max(0, maxRoomItems - parsedItems.length);
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
      setItemActionError("Số lượng phải lớn hơn 0.");
      return;
    }

    if (randomNumberMin > randomNumberMax) {
      setItemActionError("Số nhỏ nhất phải nhỏ hơn hoặc bằng số lớn nhất.");
      return;
    }

    const rangeSize = randomNumberMax - randomNumberMin + 1;

    if (randomNumberCount > rangeSize) {
      setItemActionError(`Khoảng này chỉ có ${rangeSize} số không trùng.`);
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
      setItemActionError("Vui lòng chọn một hoặc nhiều file ảnh.");
      return;
    }

    if (imageFiles.length > maxImageFilesPerUpload) {
      setItemActionError(`Chỉ được tải tối đa ${maxImageFilesPerUpload} ảnh mỗi lần.`);
      return;
    }

    if (imageFiles.length > remainingItemCapacity) {
      setItemActionError(
        remainingItemCapacity > 0
          ? `Tổng số mục tối đa là ${maxRoomItems}. Bạn đang có ${parsedItems.length} mục, chỉ có thể thêm ${remainingItemCapacity} ảnh nữa.`
          : `Tổng số mục tối đa là ${maxRoomItems}. Hãy xóa bớt mục trước khi thêm ảnh mới.`,
      );
      return;
    }

    setItemActionError(null);
    setUploadProgress(`Đang tải lên ${imageFiles.length} ảnh...`);
    setIsUploading(true);

    try {
      const formData = new FormData();

      for (const imageFile of imageFiles) {
        formData.append("files", imageFile);
      }

      const response = await fetch(`${API_BASE_URL}/uploads`, {
        method: "POST",
        body: formData,
      });

      const payload = await response.json().catch(() => ({ message: "Không thể tải ảnh lên." }));

      if (!response.ok) {
        throw new Error(payload.message ?? "Không thể tải ảnh lên.");
      }

      const uploaded = payload as UploadResponse;
      const imageLines = uploaded.items.map((item, index) => {
        const label = (item.label ?? fileNameLabel(imageFiles[index]?.name ?? "")) || "Ảnh";
        return `image|${toAbsoluteImageUrl(item.url)}|${label}`;
      });

      setItems((currentItems) => appendItemLines(currentItems, imageLines));
      setImageFiles([]);
      setUploadProgress(`Đã tải lên ${imageLines.length} ảnh.`);
    } catch (caught) {
      setItemActionError(caught instanceof Error ? caught.message : "Không thể tải ảnh lên.");
      setUploadProgress(null);
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
      setError(caught instanceof Error ? caught.message : "Không thể tạo phòng.");
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
            <StatusBadge tone="warning">Tạo phòng</StatusBadge>
            <h1 className="pixel-title mt-5 text-4xl leading-tight sm:text-5xl">Tạo sảnh Bingo</h1>
            <p className="mt-5 font-bold leading-7 text-pixel-muted">Nhập danh sách mục, chọn luật thắng, rồi chia sẻ link để mỗi người chơi nhận một bảng riêng.</p>
          </PixelPanel>
          <StatCard label="Mục sẵn sàng" tone={parsedItems.length >= requiredItems ? "green" : "gold"} value={`${parsedItems.length}/${requiredItems}`} />
          <div className="grid grid-cols-3 gap-3">
            <StatCard label="Số" tone="cyan" value={itemTypeCounts.number} />
            <StatCard label="Chữ" tone="pink" value={itemTypeCounts.text} />
            <StatCard label="Ảnh" tone="green" value={itemTypeCounts.image} />
          </div>
          <PixelPanel className="p-4 sm:p-5">
            <p className="pixel-label text-slate-600">Ước tính lượt thắng Bingo</p>
            <label className="mt-3 block text-sm font-black text-slate-700" htmlFor="estimated-players">
              Số người chơi dự kiến
              <input className="pixel-input mt-2 px-2 py-1 text-sm" id="estimated-players" min={1} onChange={(event) => setEstimatedPlayers(Number(event.target.value))} type="number" value={estimatedPlayers} />
            </label>
            {winnerEstimate ? (
              <div className="mt-4 space-y-3 text-sm font-black leading-6 text-slate-700">
                <p>Với {winnerEstimatePlayerCount} người chơi cùng tranh Bingo, bạn sẽ gọi khoảng <span className="font-pixel text-xl text-pixel-ink">{winnerEstimate.averageFirstWin}</span> mục trước khi có người thắng.</p>
                <p>Có 1% khả năng một người chơi may mắn thắng sau <span className="font-pixel text-xl text-pixel-ink">{winnerEstimate.luckyOnePercent}</span> lượt gọi.</p>
                <p>Thông thường sẽ có <span className="font-pixel text-xl text-pixel-ink">{winnerEstimate.typicalWinners}</span> người chơi thắng cùng lúc.</p>
              </div>
            ) : (
              <p className="mt-4 text-sm font-bold text-slate-600">Thêm đủ mục và ít nhất một luật thắng để ước tính người thắng đầu tiên.</p>
            )}
          </PixelPanel>
        </aside>

        <section className="space-y-5">
          <PixelPanel className="p-4 sm:p-6">
            <label className="pixel-label text-slate-600" htmlFor="title">Tên ván chơi</label>
            <input className="pixel-input mt-3" id="title" onChange={(event) => setTitle(event.target.value)} value={title} />

            <div className="mt-6 grid gap-3 sm:grid-cols-2">
              <label className="flex min-h-16 items-center gap-3 border-4 border-pixel-ink bg-pixel-cyan p-4 font-black shadow-[4px_4px_0_#10101f]">
                <input checked={hasFreeCell} className="h-5 w-5 accent-pixel-ink" onChange={(event) => setHasFreeCell(event.target.checked)} type="checkbox" />
                Dùng ô TỰ DO ở giữa
              </label>
              <div className="border-4 border-pixel-ink bg-pixel-pink p-4 font-black text-pixel-ink shadow-[4px_4px_0_#10101f]">
                <p className="font-pixel text-sm font-black uppercase tracking-[0.08em]">Kích thước bảng</p>
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
            <p className="pixel-label text-slate-600">Luật thắng</p>
            <div className="mt-3 grid gap-3 sm:grid-cols-3">
              {[
                ["Hàng ngang", horizontal, setHorizontal],
                ["Cột dọc", vertical, setVertical],
                ["Đường chéo", diagonal, setDiagonal],
              ].map(([label, checked, setter]) => (
                <label className={`${checked ? "bg-pixel-gold" : "bg-white"} flex min-h-14 items-center gap-3 border-4 border-pixel-ink p-3 font-black shadow-[4px_4px_0_#10101f]`} key={label as string}>
                  <input checked={checked as boolean} className="h-5 w-5 accent-pixel-ink" onChange={(event) => (setter as (value: boolean) => void)(event.target.checked)} type="checkbox" />
                  {label as string}
                </label>
              ))}
            </div>
          </PixelPanel>

          <PixelPanel className="p-4 sm:p-6">
            <p className="pixel-label text-slate-600">Danh sách mục</p>
            <div className="mt-4 grid gap-4 xl:grid-cols-2">
              <div className="border-4 border-pixel-ink bg-pixel-cyan p-3 shadow-[4px_4px_0_#10101f]">
                <p className="font-pixel text-sm font-black uppercase tracking-[0.08em] text-pixel-ink">Thêm số ngẫu nhiên</p>
                <div className="mt-3 grid gap-2 sm:grid-cols-3">
                  <label className="text-sm font-black" htmlFor="random-count">
                    Số lượng
                    <input className="pixel-input mt-1 px-2 py-1 text-sm" id="random-count" min={1} onChange={(event) => setRandomNumberCount(Number(event.target.value))} type="number" value={randomNumberCount} />
                  </label>
                  <label className="text-sm font-black" htmlFor="random-min">
                    Từ
                    <input className="pixel-input mt-1 px-2 py-1 text-sm" id="random-min" onChange={(event) => setRandomNumberMin(Number(event.target.value))} type="number" value={randomNumberMin} />
                  </label>
                  <label className="text-sm font-black" htmlFor="random-max">
                    Đến
                    <input className="pixel-input mt-1 px-2 py-1 text-sm" id="random-max" onChange={(event) => setRandomNumberMax(Number(event.target.value))} type="number" value={randomNumberMax} />
                  </label>
                </div>
                <PixelButton className="mt-3 w-full text-sm" onClick={addRandomNumbers} variant="secondary">
                  Thêm số
                </PixelButton>
              </div>

              <div className="border-4 border-pixel-ink bg-pixel-green p-3 shadow-[4px_4px_0_#10101f]">
                <p className="font-pixel text-sm font-black uppercase tracking-[0.08em] text-pixel-ink">Tải ảnh lên</p>
                <label className="mt-3 block text-sm font-black" htmlFor="image-files">
                  Chọn ảnh
                  <input accept="image/jpeg,image/png,image/webp" aria-describedby="image-files-help" className="pixel-input mt-1 px-2 py-1 text-sm" id="image-files" multiple onChange={(event) => setImageFiles(Array.from(event.target.files ?? []))} type="file" />
                </label>
                <PixelButton className="mt-3 w-full text-sm" disabled={!imageFiles.length || isUploading} onClick={uploadImageItems} variant="success">
                  {isUploading ? uploadProgress ?? "Đang tải lên" : imageFiles.length ? `Thêm ${imageFiles.length} ảnh` : "Thêm ảnh"}
                </PixelButton>
                <p className="mt-2 text-xs font-bold text-pixel-ink/75" id="image-files-help">JPG, PNG, WEBP • tối đa 10MB/ảnh • tối đa 10 ảnh/lần • còn có thể thêm {remainingItemCapacity} mục.</p>
              </div>
            </div>

            {itemActionError ? <AlertBox className="mt-4" tone="danger">{itemActionError}</AlertBox> : null}
            {uploadProgress && !isUploading ? <AlertBox className="mt-4" tone="success">{uploadProgress}</AlertBox> : null}

            <div className="mt-5 border-4 border-pixel-ink bg-white p-3 shadow-[4px_4px_0_#10101f]">
              <div className="flex items-center justify-between gap-3">
                <p className="font-pixel text-sm font-black uppercase tracking-[0.08em] text-pixel-ink">Xem trước ({parsedItems.length})</p>
                <button className="pixel-badge bg-pixel-paper" onClick={clearItems} type="button">Xóa hết</button>
              </div>
              <div className="mt-3 flex max-h-36 flex-wrap gap-2 overflow-auto pr-1">
                {parsedItems.length ? parsedItems.slice(0, 30).map((item, index) => (
                  <span className="pixel-chip max-w-36 truncate" key={`${item.value}-${index}`}>
                    {item.type === "image" ? "Ảnh" : item.label ?? item.value}
                  </span>
                )) : <p className="font-bold text-slate-600">Chưa có mục nào. Thêm số ngẫu nhiên hoặc tải ảnh lên để bắt đầu.</p>}
                {parsedItems.length > 30 ? <span className="pixel-chip bg-pixel-gold">+{parsedItems.length - 30} mục nữa</span> : null}
              </div>
            </div>

            <details className="mt-5 border-4 border-pixel-ink bg-slate-100 p-3 shadow-[4px_4px_0_#10101f]">
              <summary className="pixel-label cursor-pointer text-slate-600">Chỉnh sửa nâng cao</summary>
              <AlertBox className="mt-3" tone="info">
                <p>Mỗi dòng là một mục. Dòng chỉ gồm số sẽ thành mục số; các dòng khác sẽ thành mục chữ.</p>
                <p className="mt-1 break-all font-mono text-xs">Ảnh: image|https://example.com/photo.jpg|Tên ảnh</p>
              </AlertBox>
              <label className="mt-4 block text-sm font-black text-slate-700" htmlFor="items">Nội dung danh sách mục</label>
              <textarea className="pixel-textarea mt-2 min-h-56 font-mono text-sm" id="items" onChange={(event) => setItems(event.target.value)} value={items} />
            </details>
          </PixelPanel>

          {error ? <AlertBox tone="danger">{error}</AlertBox> : null}

          <PixelPanel className="p-4 sm:p-6">
            <PixelButton className="w-full text-base sm:text-lg" disabled={!canSubmit || isSubmitting} onClick={createRoom}>
              {isSubmitting ? "Đang tạo phòng" : "Tạo phòng Bingo"}
            </PixelButton>
            {!canSubmit ? <p className="mt-3 text-sm font-bold text-slate-600">Bạn cần tên ván chơi, đủ số mục, và ít nhất một luật thắng.</p> : null}

            {result ? (
              <div className="mt-5 border-4 border-pixel-ink bg-pixel-green p-4 shadow-[4px_4px_0_#10101f]">
                <p className="pixel-label text-pixel-ink/70">Phòng đã sẵn sàng</p>
                <p className="mt-2 font-pixel text-4xl font-black text-pixel-ink">{result.roomCode}</p>
                <div className="mt-4 grid gap-3 sm:grid-cols-2">
                  <a className="pixel-button pixel-button-primary" href={result.hostUrl} rel="noreferrer" target="_blank">Mở trang người dẫn</a>
                  <PixelButton className="w-full" onClick={copyInviteLink} variant="secondary">
                    {inviteCopyStatus === "copied" ? "Đã sao chép" : inviteCopyStatus === "failed" ? "Sao chép thất bại" : "Sao chép link mời"}
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
