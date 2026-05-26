"use client";

import { useEffect, useMemo, useState } from "react";
import { CalledItemCard } from "@/components/CalledItemCard";
import { apiFetch } from "@/lib/api";
import { createSocket } from "@/lib/socket";
import type { CalledItem, DisplayState, ItemCalledEvent } from "@/lib/types";

type DisplayRoomClientProps = {
  roomCode: string;
};

export function DisplayRoomClient({ roomCode }: DisplayRoomClientProps) {
  const [displayState, setDisplayState] = useState<DisplayState | null>(null);
  const [animatedCalledOrder, setAnimatedCalledOrder] = useState<number | null>(null);
  const [isConnected, setIsConnected] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const latestItem = useMemo(() => displayState?.calledItems.at(-1), [displayState?.calledItems]);
  const previousItems = useMemo(() => displayState?.calledItems.slice(-13, -1).reverse() ?? [], [displayState?.calledItems]);

  useEffect(() => {
    apiFetch<DisplayState>(`/rooms/${roomCode}/display-state`)
      .then(setDisplayState)
      .catch((caught) => setError(caught instanceof Error ? caught.message : "Không thể tải màn hình hiển thị."));
  }, [roomCode]);

  useEffect(() => {
    const socket = createSocket();

    socket.on("connect", () => {
      setIsConnected(true);
      socket.emit("join_display_room", { roomCode });
    });
    socket.on("disconnect", () => setIsConnected(false));
    socket.on("game_started", () => setDisplayState((current) => (current ? { ...current, status: "playing" } : current)));
    socket.on("game_ended", () => setDisplayState((current) => (current ? { ...current, status: "ended" } : current)));
    socket.on("item_called", (event: ItemCalledEvent) => {
      const calledItem: CalledItem = {
        id: `${event.item.id}:${event.calledOrder}`,
        item: event.item,
        calledOrder: event.calledOrder,
        calledAt: new Date().toISOString(),
      };

      setAnimatedCalledOrder(event.calledOrder);
      setDisplayState((current) => current ? { ...current, calledItems: [...current.calledItems, calledItem] } : current);
    });
    socket.on("bingo_verified", ({ playerId, playerName }: { playerId: string; playerName: string }) => {
      setDisplayState((current) => {
        if (!current || current.winners.some((winner) => winner.id === playerId)) {
          return current;
        }

        return { ...current, winners: [...current.winners, { id: playerId, name: playerName }] };
      });
    });
    socket.on("error_message", ({ message }: { message: string }) => setError(message));
    socket.connect();

    return () => {
      socket.disconnect();
    };
  }, [roomCode]);

  return (
    <main className="min-h-screen overflow-hidden bg-slate-950 px-8 py-8 text-white">
      <div className="mx-auto flex min-h-[calc(100vh-4rem)] max-w-[90rem] flex-col gap-8">
        <header className="grid gap-5 rounded-[2.5rem] border-4 border-white bg-white p-6 text-slate-950 shadow-[12px_12px_0_#22d3ee] lg:grid-cols-[1fr_auto_auto] lg:items-center">
          <div>
            <p className="text-lg font-black uppercase tracking-[0.35em] text-rose-600">Màn hình Bingo</p>
            <h1 className="mt-2 text-6xl font-black leading-none xl:text-7xl">{displayState?.title ?? `Phòng ${roomCode}`}</h1>
          </div>
          <div className="rounded-3xl border-4 border-slate-950 bg-amber-300 px-8 py-5 text-center">
            <p className="text-sm font-black uppercase tracking-[0.25em]">Mã phòng</p>
            <p className="text-5xl font-black">{roomCode}</p>
          </div>
          <div className={`rounded-3xl border-4 border-slate-950 px-8 py-5 text-center ${isConnected ? "bg-lime-300" : "bg-slate-200"}`}>
            <p className="text-sm font-black uppercase tracking-[0.25em]">Trạng thái</p>
            <p className="text-3xl font-black">{displayState?.status ?? "loading"}</p>
          </div>
        </header>

        {error ? <p className="rounded-3xl border-4 border-white bg-red-500 px-6 py-5 text-2xl font-black shadow-[8px_8px_0_#ffffff]">{error}</p> : null}

        <section className="grid flex-1 gap-8 lg:grid-cols-[1.45fr_0.8fr]">
          <div className="rounded-[2.5rem] border-4 border-cyan-300 bg-cyan-300 p-6 text-slate-950 shadow-[12px_12px_0_rgba(34,211,238,0.35)]">
            <p className="text-xl font-black uppercase tracking-[0.3em] text-slate-700">Item mới nhất</p>
            <div className="mt-6">
              <CalledItemCard animate={latestItem?.calledOrder === animatedCalledOrder} emptyText="Chờ host gọi item đầu tiên" item={latestItem?.item} key={latestItem?.calledOrder ?? "empty"} order={latestItem?.calledOrder} />
            </div>
          </div>

          <aside className="grid gap-6">
            <div className="rounded-[2rem] border-4 border-white bg-white p-6 text-slate-950 shadow-[10px_10px_0_#facc15]">
              <p className="text-sm font-black uppercase tracking-[0.25em] text-slate-500">Người chơi</p>
              <p className="mt-2 text-7xl font-black leading-none">{displayState?.playerCount ?? 0}</p>
            </div>

            <div className="rounded-[2rem] border-4 border-white bg-lime-300 p-6 text-slate-950 shadow-[10px_10px_0_#ffffff]">
              <p className="text-sm font-black uppercase tracking-[0.25em] text-slate-600">Winner</p>
              <div className="mt-4 grid gap-3">
                {displayState?.winners.length ? displayState.winners.map((winner) => (
                  <p className="rounded-2xl border-2 border-slate-950 bg-white px-5 py-3 text-3xl font-black" key={winner.id}>{winner.name}</p>
                )) : <p className="text-2xl font-black text-slate-700">Chưa có Bingo hợp lệ</p>}
              </div>
            </div>

            <div className="rounded-[2rem] border-4 border-white bg-slate-900 p-6 shadow-[10px_10px_0_#ffffff]">
              <p className="text-sm font-black uppercase tracking-[0.25em] text-cyan-300">Đã gọi gần đây</p>
              <div className="mt-4 grid max-h-[24rem] gap-3 overflow-hidden">
                {previousItems.length ? previousItems.map((called) => (
                  <div className="flex items-center justify-between gap-4 rounded-2xl bg-white px-5 py-3 text-slate-950" key={called.id}>
                    <span className="truncate text-2xl font-black">{called.item.label ?? called.item.value}</span>
                    <span className="shrink-0 rounded-full bg-cyan-300 px-4 py-1 text-xl font-black">#{called.calledOrder}</span>
                  </div>
                )) : <p className="text-xl font-bold text-slate-300">Các item trước đó sẽ hiện ở đây.</p>}
              </div>
            </div>
          </aside>
        </section>
      </div>
    </main>
  );
}
