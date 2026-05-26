"use client";

import { QRCodeSVG } from "qrcode.react";
import { useEffect, useMemo, useRef, useState } from "react";
import type { Socket } from "socket.io-client";
import { CalledItemCard } from "@/components/CalledItemCard";
import { apiFetch } from "@/lib/api";
import { createSocket } from "@/lib/socket";
import type { BingoClaimedEvent, CalledItem, HostState, ItemCalledEvent } from "@/lib/types";

type HostRoomClientProps = {
  roomCode: string;
  hostToken: string;
};

function publicPlayerUrl(origin: string, roomCode: string) {
  return `${origin}/play/${roomCode}`;
}

function publicDisplayUrl(origin: string, roomCode: string) {
  return `${origin}/display/${roomCode}`;
}

function formatLastSeen(lastSeenAt: string) {
  return new Intl.DateTimeFormat("vi-VN", {
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
    hour12: false,
    timeZone: "Asia/Ho_Chi_Minh",
  }).format(new Date(lastSeenAt));
}

function playCalledItemSound(audioContextRef: React.MutableRefObject<AudioContext | null>) {
  const audioContext = audioContextRef.current ?? new AudioContext();
  audioContextRef.current = audioContext;

  const oscillator = audioContext.createOscillator();
  const gain = audioContext.createGain();
  const now = audioContext.currentTime;

  oscillator.type = "sine";
  oscillator.frequency.setValueAtTime(880, now);
  oscillator.frequency.exponentialRampToValueAtTime(660, now + 0.18);
  gain.gain.setValueAtTime(0.0001, now);
  gain.gain.exponentialRampToValueAtTime(0.16, now + 0.02);
  gain.gain.exponentialRampToValueAtTime(0.0001, now + 0.22);
  oscillator.connect(gain);
  gain.connect(audioContext.destination);
  oscillator.start(now);
  oscillator.stop(now + 0.24);
}

export function HostRoomClient({ roomCode, hostToken }: HostRoomClientProps) {
  const [hostState, setHostState] = useState<HostState | null>(null);
  const [socket, setSocket] = useState<Socket | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [copyStatus, setCopyStatus] = useState<"idle" | "copied" | "failed">("idle");
  const [animatedCalledOrder, setAnimatedCalledOrder] = useState<number | null>(null);
  const [soundEnabled, setSoundEnabled] = useState(false);
  const [isConnected, setIsConnected] = useState(false);
  const [publicOrigin, setPublicOrigin] = useState("");
  const soundEnabledRef = useRef(soundEnabled);
  const audioContextRef = useRef<AudioContext | null>(null);

  const playerUrl = publicPlayerUrl(publicOrigin, roomCode);
  const displayUrl = publicDisplayUrl(publicOrigin, roomCode);
  const latestItem = useMemo(() => hostState?.calledItems.at(-1), [hostState?.calledItems]);

  useEffect(() => {
    setPublicOrigin(window.location.origin);
  }, []);

  useEffect(() => {
    soundEnabledRef.current = soundEnabled;
  }, [soundEnabled]);

  useEffect(() => {
    apiFetch<HostState>(`/rooms/${roomCode}/host-state`, {
      headers: { Authorization: `Bearer ${hostToken}` },
    })
      .then(setHostState)
      .catch((caught) => setError(caught instanceof Error ? caught.message : "Không thể tải phòng host."));
  }, [hostToken, roomCode]);

  useEffect(() => {
    const nextSocket = createSocket();
    setSocket(nextSocket);

    nextSocket.on("connect", () => {
      setIsConnected(true);
      nextSocket.emit("host_join_room", { roomCode, hostToken });
    });
    nextSocket.on("disconnect", () => setIsConnected(false));
    nextSocket.on("game_started", () => setHostState((current) => (current ? { ...current, status: "playing" } : current)));
    nextSocket.on("game_ended", () => setHostState((current) => (current ? { ...current, status: "ended" } : current)));
    nextSocket.on("item_called", (event: ItemCalledEvent) => {
      setHostState((current) => {
        if (!current) {
          return current;
        }

        const calledItem: CalledItem = {
          id: `${event.item.id}:${event.calledOrder}`,
          item: event.item,
          calledOrder: event.calledOrder,
          calledAt: new Date().toISOString(),
        };

        setAnimatedCalledOrder(event.calledOrder);
        if (soundEnabledRef.current) {
          playCalledItemSound(audioContextRef);
        }

        return { ...current, calledItems: [...current.calledItems, calledItem] };
      });
    });
    nextSocket.on("player_joined", ({ player }: { player: { id: string; name: string; isWinner: boolean; isOnline: boolean; joinedAt: string; lastSeenAt: string } }) => {
      setHostState((current) => {
        if (!current) {
          return current;
        }

        if (current.players.some((existingPlayer) => existingPlayer.id === player.id)) {
          return {
            ...current,
            players: current.players.map((existingPlayer) => existingPlayer.id === player.id ? { ...existingPlayer, ...player, isOnline: true } : existingPlayer),
          };
        }

        return { ...current, players: [...current.players, player] };
      });
    });
    nextSocket.on("player_left", ({ playerId, lastSeenAt }: { playerId: string; lastSeenAt: string }) => {
      setHostState((current) => {
        if (!current) {
          return current;
        }

        return {
          ...current,
          players: current.players.map((player) => player.id === playerId ? { ...player, isOnline: false, lastSeenAt } : player),
        };
      });
    });
    nextSocket.on("bingo_claimed", (event: BingoClaimedEvent) => {
      setHostState((current) => {
        if (!current) {
          return current;
        }

        return {
          ...current,
          claims: [
            {
              id: event.claimId,
              status: event.status,
              winningPattern: event.winningPattern,
              createdAt: new Date().toISOString(),
              reviewedAt: new Date().toISOString(),
              player: { id: event.playerId, name: event.playerName },
            },
            ...current.claims,
          ],
        };
      });
    });
    nextSocket.on("error_message", ({ message }: { message: string }) => setError(message));
    nextSocket.connect();

    return () => {
      nextSocket.disconnect();
    };
  }, [hostToken, roomCode]);

  async function copyInviteLink() {
    try {
      await navigator.clipboard.writeText(playerUrl);
      setCopyStatus("copied");
      window.setTimeout(() => setCopyStatus("idle"), 1800);
    } catch {
      setCopyStatus("failed");
      window.setTimeout(() => setCopyStatus("idle"), 1800);
    }
  }

  function emitHostEvent(eventName: "start_game" | "call_next_item" | "end_game") {
    setError(null);
    socket?.emit(eventName, { roomCode, hostToken });
  }

  function toggleSound() {
    const nextEnabled = !soundEnabled;
    setSoundEnabled(nextEnabled);
    if (nextEnabled) {
      playCalledItemSound(audioContextRef);
    }
  }

  if (!hostToken) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-slate-950 px-6 text-white">
        <section className="max-w-lg rounded-[2rem] border-4 border-white bg-rose-600 p-8 shadow-[12px_12px_0_#facc15]">
          <p className="text-3xl font-black">Thiếu host token</p>
          <p className="mt-3 font-semibold">Hãy mở đúng link host được tạo sau khi tạo phòng.</p>
        </section>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-[#dff7ff] px-3 py-5 text-slate-950 sm:px-5 sm:py-8">
      <div className="mx-auto max-w-7xl">
        <header className="rounded-[1.5rem] border-4 border-slate-950 bg-white p-4 shadow-[7px_7px_0_#0f172a] sm:rounded-[2rem] sm:p-6 sm:shadow-[12px_12px_0_#0f172a]">
          <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
            <div>
              <p className="text-sm font-black uppercase tracking-[0.35em] text-rose-600">Host dashboard</p>
              <h1 className="mt-2 text-3xl font-black leading-none sm:text-5xl">{hostState?.title ?? `Phòng ${roomCode}`}</h1>
            </div>
            <div className="grid gap-3 sm:grid-cols-2">
              <div className="rounded-2xl border-2 border-slate-950 bg-amber-300 px-5 py-3 text-center font-black">Mã: {roomCode}</div>
              <div className={`rounded-2xl border-2 border-slate-950 px-5 py-3 text-center font-black ${isConnected ? "bg-lime-300" : "bg-slate-200"}`}>
                {isConnected ? "Socket online" : "Socket offline"}
              </div>
            </div>
          </div>
          <div className="mt-5 grid gap-4 rounded-2xl bg-slate-950 p-3 text-white sm:p-4 lg:grid-cols-[auto_1fr_auto] lg:items-center">
            <div className="mx-auto rounded-2xl border-4 border-white bg-white p-3 shadow-[6px_6px_0_#22d3ee] lg:mx-0">
              <QRCodeSVG bgColor="#ffffff" fgColor="#0f172a" level="M" size={132} value={playerUrl} />
            </div>
            <div>
              <p className="text-xs font-black uppercase tracking-[0.24em] text-cyan-300">Link người chơi</p>
              <p className="mt-2 break-all text-lg font-black">{playerUrl}</p>
              <p className="mt-2 text-sm font-bold text-slate-300">Người chơi có thể quét QR hoặc mở link này để vào phòng.</p>
              <a className="mt-3 inline-flex rounded-full border-2 border-cyan-300 px-4 py-2 text-sm font-black text-cyan-300 transition hover:bg-cyan-300 hover:text-slate-950" href={displayUrl} rel="noreferrer" target="_blank">
                Mở màn hình lớn
              </a>
            </div>
            <button
              className="rounded-2xl border-2 border-white bg-cyan-300 px-5 py-3 font-black text-slate-950 shadow-[5px_5px_0_#ffffff] transition hover:-translate-y-0.5"
              onClick={copyInviteLink}
              type="button"
            >
              {copyStatus === "copied" ? "Đã copy" : copyStatus === "failed" ? "Copy lỗi" : "Copy link"}
            </button>
          </div>
        </header>

        {error ? <p className="mt-6 rounded-2xl border-4 border-slate-950 bg-red-500 px-5 py-4 font-black text-white shadow-[6px_6px_0_#0f172a]">{error}</p> : null}

        <div className="mt-6 grid gap-5 lg:mt-8 lg:grid-cols-[0.85fr_1.15fr_0.9fr]">
          <section className="rounded-[1.5rem] border-4 border-slate-950 bg-white p-5 shadow-[10px_10px_0_#0f172a]">
            <p className="text-sm font-black uppercase tracking-[0.24em] text-slate-500">Điều khiển</p>
            <div className="mt-5 grid gap-4">
              <button className="rounded-2xl border-4 border-slate-950 bg-lime-300 px-5 py-4 text-xl font-black shadow-[6px_6px_0_#0f172a] disabled:bg-slate-200" disabled={hostState?.status !== "waiting"} onClick={() => emitHostEvent("start_game")} type="button">
                Start game
              </button>
              <button className="rounded-2xl border-4 border-slate-950 bg-amber-300 px-5 py-4 text-xl font-black shadow-[6px_6px_0_#0f172a] disabled:bg-slate-200" disabled={hostState?.status !== "playing"} onClick={() => emitHostEvent("call_next_item")} type="button">
                Gọi item tiếp theo
              </button>
              <button className={`rounded-2xl border-4 border-slate-950 px-5 py-4 text-xl font-black shadow-[6px_6px_0_#0f172a] ${soundEnabled ? "bg-cyan-300" : "bg-slate-100"}`} onClick={toggleSound} type="button">
                Âm thanh: {soundEnabled ? "Bật" : "Tắt"}
              </button>
              <button className="rounded-2xl border-4 border-slate-950 bg-rose-500 px-5 py-4 text-xl font-black text-white shadow-[6px_6px_0_#0f172a] disabled:bg-slate-300" disabled={hostState?.status === "ended"} onClick={() => emitHostEvent("end_game")} type="button">
                Kết thúc game
              </button>
            </div>
            <div className="mt-6 rounded-2xl border-2 border-slate-950 bg-slate-50 p-4">
              <p className="text-xs font-black uppercase tracking-[0.2em] text-slate-500">Trạng thái</p>
              <p className="mt-2 text-3xl font-black">{hostState?.status ?? "loading"}</p>
            </div>
          </section>

          <section className="rounded-[1.5rem] border-4 border-slate-950 bg-slate-950 p-5 text-white shadow-[10px_10px_0_rgba(15,23,42,0.35)]">
            <p className="text-sm font-black uppercase tracking-[0.24em] text-cyan-300">Item mới nhất</p>
            <div className="mt-4">
              <CalledItemCard animate={latestItem?.calledOrder === animatedCalledOrder} item={latestItem?.item} key={latestItem?.calledOrder ?? "empty"} order={latestItem?.calledOrder} />
            </div>
            <div className="mt-5 flex max-h-72 flex-wrap gap-2 overflow-auto">
              {hostState?.calledItems.map((called) => (
                <span className="rounded-full bg-cyan-300 px-4 py-2 text-sm font-black text-slate-950" key={called.id}>
                  #{called.calledOrder} {called.item.label ?? called.item.value}
                </span>
              ))}
            </div>
          </section>

          <section className="grid gap-6">
            <div className="rounded-[2rem] border-4 border-slate-950 bg-white p-5 shadow-[10px_10px_0_#0f172a]">
              <p className="text-sm font-black uppercase tracking-[0.24em] text-slate-500">Người chơi</p>
              <p className="mt-2 text-4xl font-black">{hostState?.players.length ?? 0}</p>
              <div className="mt-4 grid gap-2">
                {hostState?.players.map((player) => (
                  <div className={`rounded-2xl border-2 px-4 py-3 font-bold ${player.isOnline ? "border-lime-500 bg-lime-100" : "border-slate-200 bg-slate-100 text-slate-500"}`} key={player.id}>
                    <div className="flex items-center justify-between gap-3">
                      <span>{player.name} {player.isWinner ? "• Winner" : ""}</span>
                      <span className={`rounded-full px-3 py-1 text-xs font-black uppercase tracking-[0.16em] ${player.isOnline ? "bg-lime-300 text-slate-950" : "bg-slate-300 text-slate-600"}`}>
                        {player.isOnline ? "Online" : "Offline"}
                      </span>
                    </div>
                    {!player.isOnline ? <p className="mt-1 text-xs font-semibold">Lần cuối: {formatLastSeen(player.lastSeenAt)}</p> : null}
                  </div>
                ))}
              </div>
            </div>
            <div className="rounded-[2rem] border-4 border-slate-950 bg-white p-5 shadow-[10px_10px_0_#0f172a]">
              <p className="text-sm font-black uppercase tracking-[0.24em] text-slate-500">Bingo claims</p>
              <div className="mt-4 grid gap-2">
                {hostState?.claims.length ? hostState.claims.map((claim) => (
                  <div className="rounded-2xl border-2 border-slate-950 bg-amber-100 px-4 py-3 font-black" key={claim.id}>
                    {claim.player.name}: {claim.status}
                  </div>
                )) : <p className="font-semibold text-slate-500">Chưa có ai báo Bingo.</p>}
              </div>
            </div>
          </section>
        </div>
      </div>
    </main>
  );
}
