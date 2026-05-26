"use client";

import { useMemo, useState } from "react";
import { API_BASE_URL, apiFetch } from "@/lib/api";
import type { CreateRoomResponse } from "@/lib/types";

const starterItems = Array.from({ length: 40 }, (_, index) => String(index + 1)).join("\n");

type UploadResponse = {
  url: string;
  label: string | null;
};

function toAbsoluteImageUrl(url: string) {
  if (/^https?:\/\//.test(url)) {
    return url;
  }

  return `${API_BASE_URL}${url}`;
}

function appendItemLine(currentItems: string, line: string) {
  return currentItems.trimEnd() ? `${currentItems.trimEnd()}\n${line}` : line;
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
          label: label || "Hình ảnh",
        };
      }

      return {
        type: /^\d+$/.test(line) ? "number" : "text",
        value: line,
      };
    });
}

export function CreateRoomClient() {
  const [title, setTitle] = useState("Đêm Bingo vui vẻ");
  const [items, setItems] = useState(starterItems);
  const [hasFreeCell, setHasFreeCell] = useState(true);
  const [horizontal, setHorizontal] = useState(true);
  const [vertical, setVertical] = useState(true);
  const [diagonal, setDiagonal] = useState(true);
  const [result, setResult] = useState<CreateRoomResponse | null>(null);
  const [imageLabel, setImageLabel] = useState("");
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isUploading, setIsUploading] = useState(false);

  const parsedItems = useMemo(() => parseItems(items), [items]);
  const requiredItems = hasFreeCell ? 24 : 25;
  const canSubmit = title.trim().length > 0 && parsedItems.length >= requiredItems && (horizontal || vertical || diagonal);

  async function uploadImageItem() {
    if (!imageFile) {
      setUploadError("Hãy chọn một file ảnh.");
      return;
    }

    setUploadError(null);
    setIsUploading(true);

    try {
      const formData = new FormData();
      formData.append("file", imageFile);
      formData.append("label", imageLabel);

      const response = await fetch(`${API_BASE_URL}/uploads`, {
        method: "POST",
        body: formData,
      });

      const payload = await response.json().catch(() => ({ message: "Không thể upload ảnh." }));

      if (!response.ok) {
        throw new Error(payload.message ?? "Không thể upload ảnh.");
      }

      const uploaded = payload as UploadResponse;
      const label = (uploaded.label ?? imageLabel.trim()) || "Hình ảnh";
      const imageLine = `image|${toAbsoluteImageUrl(uploaded.url)}|${label}`;
      setItems((currentItems) => appendItemLine(currentItems, imageLine));
      setImageFile(null);
      setImageLabel("");
    } catch (caught) {
      setUploadError(caught instanceof Error ? caught.message : "Không thể upload ảnh.");
    } finally {
      setIsUploading(false);
    }
  }

  async function createRoom() {
    setError(null);
    setIsSubmitting(true);

    try {
      const createdRoom = await apiFetch<CreateRoomResponse>("/rooms", {
        method: "POST",
        body: JSON.stringify({
          title,
          boardSize: 5,
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

  return (
    <main className="relative min-h-screen overflow-hidden bg-[#f7d64a] px-3 py-5 text-slate-950 sm:px-5 sm:py-8">
      <div className="absolute left-[-8rem] top-[-8rem] h-80 w-80 rounded-full bg-cyan-300 blur-3xl" />
      <div className="absolute bottom-[-10rem] right-[-8rem] h-96 w-96 rounded-full bg-rose-400 blur-3xl" />
      <div className="relative mx-auto grid max-w-6xl gap-8 lg:grid-cols-[0.9fr_1.1fr]">
        <section className="flex flex-col justify-between rounded-[1.5rem] border-4 border-slate-950 bg-white p-5 shadow-[8px_8px_0_#0f172a] sm:rounded-[2rem] sm:p-8 sm:shadow-[14px_14px_0_#0f172a]">
          <div>
            <p className="text-sm font-black uppercase tracking-[0.35em] text-rose-600">Bingo control room</p>
            <h1 className="mt-4 text-4xl font-black leading-none tracking-tight sm:text-6xl">Tạo sàn Bingo</h1>
            <p className="mt-5 text-lg font-semibold leading-8 text-slate-700">
              Nhập danh sách số hoặc từ khóa, chọn luật thắng, rồi chia sẻ link cho người chơi.
            </p>
          </div>
          <div className="mt-8 rounded-3xl border-2 border-slate-950 bg-cyan-100 p-5">
            <p className="text-sm font-black uppercase tracking-[0.2em]">Đủ item?</p>
            <p className="mt-2 text-4xl font-black">{parsedItems.length}/{requiredItems}</p>
            <p className="mt-1 font-semibold text-slate-700">Board 5x5 {hasFreeCell ? "có" : "không có"} ô FREE.</p>
          </div>
        </section>

        <section className="rounded-[1.5rem] border-4 border-slate-950 bg-slate-950 p-2 shadow-[8px_8px_0_rgba(15,23,42,0.35)] sm:rounded-[2rem] sm:p-3 sm:shadow-[14px_14px_0_rgba(15,23,42,0.35)]">
          <div className="rounded-[1.25rem] bg-white p-4 sm:rounded-[1.5rem] sm:p-6">
            <label className="block text-sm font-black uppercase tracking-[0.24em] text-slate-500" htmlFor="title">Tên game</label>
            <input
              className="mt-3 w-full rounded-2xl border-2 border-slate-950 bg-amber-50 px-4 py-3 text-lg font-bold outline-none focus:bg-white focus:ring-4 focus:ring-cyan-300"
              id="title"
              onChange={(event) => setTitle(event.target.value)}
              value={title}
            />

            <div className="mt-6 grid gap-4 sm:grid-cols-2">
              <label className="rounded-2xl border-2 border-slate-950 bg-slate-50 p-4 font-bold">
                <input checked={hasFreeCell} className="mr-3" onChange={(event) => setHasFreeCell(event.target.checked)} type="checkbox" />
                Có ô FREE giữa board
              </label>
              <div className="rounded-2xl border-2 border-slate-950 bg-rose-50 p-4 font-bold">Board MVP: 5 × 5</div>
            </div>

            <div className="mt-6">
              <p className="text-sm font-black uppercase tracking-[0.24em] text-slate-500">Luật thắng</p>
              <div className="mt-3 grid gap-3 sm:grid-cols-3">
                {[
                  ["Ngang", horizontal, setHorizontal],
                  ["Dọc", vertical, setVertical],
                  ["Chéo", diagonal, setDiagonal],
                ].map(([label, checked, setter]) => (
                  <label className="rounded-2xl border-2 border-slate-950 bg-white p-4 font-black shadow-[4px_4px_0_#0f172a]" key={label as string}>
                    <input checked={checked as boolean} className="mr-3" onChange={(event) => (setter as (value: boolean) => void)(event.target.checked)} type="checkbox" />
                    {label as string}
                  </label>
                ))}
              </div>
            </div>

            <label className="mt-6 block text-sm font-black uppercase tracking-[0.24em] text-slate-500" htmlFor="items">Danh sách item</label>
            <div className="mt-3 rounded-2xl border-2 border-slate-950 bg-cyan-50 p-4 text-sm font-bold text-slate-700">
              <p>Mỗi dòng là một item. Số sẽ tự nhận là number, chữ là text.</p>
              <p className="mt-1 font-mono text-xs">Ảnh: image|https://example.com/photo.jpg|Tên ảnh</p>
            </div>
            <textarea
              className="mt-3 min-h-64 w-full rounded-2xl border-2 border-slate-950 bg-slate-50 px-4 py-3 font-mono text-sm outline-none focus:bg-white focus:ring-4 focus:ring-rose-300"
              id="items"
              onChange={(event) => setItems(event.target.value)}
              value={items}
            />

            <div className="mt-4 rounded-2xl border-2 border-slate-950 bg-lime-50 p-4">
              <p className="text-sm font-black uppercase tracking-[0.24em] text-slate-500">Upload ảnh item</p>
              <div className="mt-3 grid gap-3 sm:grid-cols-[1fr_1fr_auto] sm:items-end">
                <label className="block text-sm font-bold text-slate-700" htmlFor="image-file">
                  File ảnh
                  <input
                    accept="image/jpeg,image/png,image/webp"
                    className="mt-2 w-full rounded-xl border-2 border-slate-950 bg-white px-3 py-2 text-sm font-semibold"
                    id="image-file"
                    onChange={(event) => setImageFile(event.target.files?.[0] ?? null)}
                    type="file"
                  />
                </label>
                <label className="block text-sm font-bold text-slate-700" htmlFor="image-label">
                  Tên ảnh
                  <input
                    className="mt-2 w-full rounded-xl border-2 border-slate-950 bg-white px-3 py-2 font-semibold outline-none focus:ring-4 focus:ring-lime-300"
                    id="image-label"
                    onChange={(event) => setImageLabel(event.target.value)}
                    placeholder="Ví dụ: Logo đội A"
                    value={imageLabel}
                  />
                </label>
                <button
                  className="rounded-xl border-2 border-slate-950 bg-lime-300 px-4 py-3 font-black shadow-[4px_4px_0_#0f172a] transition hover:-translate-y-0.5 disabled:cursor-not-allowed disabled:bg-slate-200"
                  disabled={!imageFile || isUploading}
                  onClick={uploadImageItem}
                  type="button"
                >
                  {isUploading ? "Đang upload..." : "Thêm ảnh"}
                </button>
              </div>
              <p className="mt-2 text-xs font-bold text-slate-500">Hỗ trợ jpg, png, webp tối đa 2MB. Ảnh upload sẽ được thêm vào danh sách item bên trên.</p>
              {uploadError ? <p className="mt-3 rounded-xl bg-red-100 px-3 py-2 text-sm font-bold text-red-700">{uploadError}</p> : null}
            </div>

            <div className="mt-4 grid gap-2 rounded-2xl border-2 border-slate-950 bg-slate-50 p-4 sm:grid-cols-3">
              <div>
                <p className="text-xs font-black uppercase tracking-[0.18em] text-slate-500">Số</p>
                <p className="text-2xl font-black">{parsedItems.filter((item) => item.type === "number").length}</p>
              </div>
              <div>
                <p className="text-xs font-black uppercase tracking-[0.18em] text-slate-500">Chữ</p>
                <p className="text-2xl font-black">{parsedItems.filter((item) => item.type === "text").length}</p>
              </div>
              <div>
                <p className="text-xs font-black uppercase tracking-[0.18em] text-slate-500">Ảnh</p>
                <p className="text-2xl font-black">{parsedItems.filter((item) => item.type === "image").length}</p>
              </div>
            </div>

            {error ? <p className="mt-4 rounded-2xl bg-red-100 px-4 py-3 font-bold text-red-700">{error}</p> : null}

            <button
              className="mt-6 w-full rounded-2xl border-4 border-slate-950 bg-rose-500 px-6 py-4 text-xl font-black text-white shadow-[8px_8px_0_#0f172a] transition hover:-translate-y-1 disabled:cursor-not-allowed disabled:bg-slate-300 disabled:text-slate-600"
              disabled={!canSubmit || isSubmitting}
              onClick={createRoom}
              type="button"
            >
              {isSubmitting ? "Đang tạo phòng..." : "Tạo phòng Bingo"}
            </button>

            {result ? (
              <div className="mt-6 rounded-3xl border-4 border-slate-950 bg-lime-200 p-5">
                <p className="text-sm font-black uppercase tracking-[0.2em]">Phòng đã sẵn sàng</p>
                <p className="mt-2 text-4xl font-black">{result.roomCode}</p>
                <div className="mt-4 grid gap-3 sm:grid-cols-2">
                  <a className="rounded-2xl bg-slate-950 px-4 py-3 text-center font-black text-white" href={result.hostUrl}>Vào trang host</a>
                  <a className="rounded-2xl bg-white px-4 py-3 text-center font-black text-slate-950 ring-2 ring-slate-950" href={result.playerUrl}>Mở link player</a>
                </div>
              </div>
            ) : null}
          </div>
        </section>
      </div>
    </main>
  );
}
