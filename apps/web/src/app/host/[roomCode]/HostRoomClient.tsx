"use client";

import Link from "next/link";
import { QRCodeSVG } from "qrcode.react";
import { useEffect, useMemo, useState } from "react";
import type { Socket } from "socket.io-client";
import { CalledItemCard } from "@/components/CalledItemCard";
import { AlertBox, PageShell, PixelButton, PixelPanel, StatCard, StatusBadge } from "@/components/PixelUi";
import { apiFetch } from "@/lib/api";
import { createSocket } from "@/lib/socket";
import type { BingoClaimedEvent, CalledItem, GameRestartedEvent, HostState, ItemCalledEvent } from "@/lib/types";

type HostRoomClientProps = {
  roomCode: string;
  hostToken: string;
};

function publicPlayerUrl(origin: string, roomCode: string) {
  return `${origin}/play/${roomCode}`;
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

function statusTone(status?: string) {
  if (status === "playing") return "success";
  if (status === "ended") return "danger";
  return "warning";
}

export function HostRoomClient({ roomCode, hostToken }: HostRoomClientProps) {
  const [hostState, setHostState] = useState<HostState | null>(null);
  const [socket, setSocket] = useState<Socket | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [copyStatus, setCopyStatus] = useState<"idle" | "copied" | "failed">("idle");
  const [animatedCalledOrder, setAnimatedCalledOrder] = useState<number | null>(null);
  const [isConnected, setIsConnected] = useState(false);
  const [publicOrigin, setPublicOrigin] = useState("");
  const [showPlayersPopup, setShowPlayersPopup] = useState(false);

  const playerUrl = publicPlayerUrl(publicOrigin, roomCode);
  const latestItem = useMemo(() => hostState?.calledItems.at(-1), [hostState?.calledItems]);
  const previousItem = useMemo(() => hostState?.calledItems.at(-2), [hostState?.calledItems]);
  const onlinePlayers = useMemo(() => hostState?.players.filter((player) => player.isOnline) ?? [], [hostState?.players]);
  const offlinePlayers = useMemo(() => hostState?.players.filter((player) => !player.isOnline) ?? [], [hostState?.players]);
  const winners = useMemo(() => hostState?.claims.filter((claim) => claim.status === "valid") ?? [], [hostState?.claims]);

  useEffect(() => {
    setPublicOrigin(window.location.origin);
  }, []);

  useEffect(() => {
    apiFetch<HostState>(`/rooms/${roomCode}/host-state`, {
      headers: { Authorization: `Bearer ${hostToken}` },
    })
      .then(setHostState)
      .catch((caught) => setError(caught instanceof Error ? caught.message : "Không thể tải phòng người dẫn."));
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
    nextSocket.on("game_restarted", (event: GameRestartedEvent) => {
      setError(null);
      setAnimatedCalledOrder(null);
      setHostState((current) => current ? {
        ...current,
        status: event.status,
        calledItems: event.calledItems,
        claims: [],
        players: current.players.map((player) => ({ ...player, isWinner: false })),
      } : current);
    });
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

  function emitHostEvent(eventName: "start_game" | "call_next_item" | "end_game" | "restart_game") {
    setError(null);
    socket?.emit(eventName, { roomCode, hostToken });
  }

  if (!hostToken) {
    return (
      <PageShell className="flex items-center justify-center" narrow>
        <AlertBox tone="danger">
          <p className="text-2xl font-black">Thiếu token người dẫn</p>
          <p className="mt-2">Hãy mở đúng link người dẫn được tạo sau khi tạo phòng.</p>
        </AlertBox>
      </PageShell>
    );
  }

  return (
    <PageShell>
      <div className="space-y-6">
        <PixelPanel dark className="p-4 sm:p-6">
          <div className="grid gap-4 lg:grid-cols-[1fr_auto] lg:items-center">
            <div>
              <p className="pixel-label text-pixel-cyan">Bảng điều khiển người dẫn</p>
              <h1 className="mt-2 text-3xl font-black leading-tight text-pixel-cream sm:text-5xl">{hostState?.title ?? `Phòng ${roomCode}`}</h1>
            </div>
            <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
              <StatusBadge tone="warning">Mã {roomCode}</StatusBadge>
              <StatusBadge tone={isConnected ? "success" : "danger"}>{isConnected ? "Online" : "Offline"}</StatusBadge>
              <StatusBadge tone={statusTone(hostState?.status)}>{hostState?.status === "playing" ? "đang chơi" : hostState?.status === "ended" ? "đã kết thúc" : hostState?.status === "waiting" ? "đang chờ" : "đang tải"}</StatusBadge>
            </div>
          </div>
        </PixelPanel>

        {error ? <AlertBox tone="danger">{error}</AlertBox> : null}

        <div className="grid gap-6 lg:grid-cols-[0.8fr_1.2fr_0.9fr]">
          <section className="space-y-5 lg:order-1">
            <PixelPanel className="p-3 sm:p-4">
              <p className="pixel-label text-slate-600">Điều khiển</p>
              <div className="mt-3 grid grid-cols-2 gap-2">
                <PixelButton className="min-h-10 w-full px-2 py-2 text-xs sm:text-sm" disabled={hostState?.status !== "waiting"} onClick={() => emitHostEvent("start_game")} variant="success">
                  Bắt đầu
                </PixelButton>
                <PixelButton className="min-h-10 w-full px-2 py-2 text-xs sm:text-sm" disabled={hostState?.status !== "playing"} onClick={() => emitHostEvent("call_next_item")}>
                  Gọi mục
                </PixelButton>
                <PixelButton className="min-h-10 w-full px-2 py-2 text-xs sm:text-sm" disabled={hostState?.status === "ended"} onClick={() => emitHostEvent("end_game")} variant="danger">
                  Kết thúc
                </PixelButton>
                <PixelButton className="min-h-10 w-full px-2 py-2 text-xs sm:text-sm" disabled={hostState?.status !== "ended"} onClick={() => emitHostEvent("restart_game")} variant="secondary">
                  Chơi lại phòng này
                </PixelButton>
                <Link className="pixel-button pixel-button-ghost col-span-2 min-h-10 w-full px-2 py-2 text-xs sm:text-sm" href="/create">
                  Tạo phòng mới
                </Link>
              </div>
            </PixelPanel>

            <PixelPanel className="p-4 sm:p-5">
              <p className="pixel-label text-slate-600">Mời người chơi</p>
              <div className="mt-4 grid gap-4">
                <div aria-describedby="host-player-url" aria-label="Mã QR để tham gia phòng" className="mx-auto border-4 border-pixel-ink bg-white p-3 shadow-[4px_4px_0_#10101f]" role="img">
                  <QRCodeSVG bgColor="#ffffff" fgColor="#10101f" level="M" size={132} value={playerUrl} />
                </div>
                <p className="break-all text-sm font-black text-slate-700" id="host-player-url">{playerUrl}</p>
                <PixelButton className="w-full" onClick={copyInviteLink} variant="secondary">
                  {copyStatus === "copied" ? "Đã sao chép" : copyStatus === "failed" ? "Sao chép thất bại" : "Sao chép link"}
                </PixelButton>
              </div>
            </PixelPanel>
          </section>

          <section className="space-y-5 lg:order-2">
            <CalledItemCard animate={latestItem?.calledOrder === animatedCalledOrder} item={latestItem?.item} key={latestItem?.calledOrder ?? "empty"} previousItem={previousItem?.item} />
            <PixelPanel className="p-4">
              <p className="pixel-label text-slate-600">Đã gọi gần đây</p>
              <div className="mt-4 flex max-h-72 flex-wrap gap-2 overflow-auto pr-1">
                {hostState?.calledItems.length ? hostState.calledItems.map((called) => (
                  <span className="pixel-chip max-w-full" key={called.id}>
                    <span className="min-w-0 max-w-36 truncate sm:max-w-48">{called.item.label ?? (called.item.type === "image" ? "Ảnh" : called.item.value)}</span>
                  </span>
                )) : <p className="font-bold text-slate-600">Chưa có mục nào được gọi.</p>}
              </div>
            </PixelPanel>
          </section>

          <section className="grid content-start gap-5 lg:order-3">
            <div className="grid grid-cols-3 gap-2">
              <StatCard compact label="Người chơi" tone="cyan" value={hostState?.players.length ?? 0} />
              <button className="block w-full text-left focus:outline-none focus-visible:ring-4 focus-visible:ring-pixel-cyan" onClick={() => setShowPlayersPopup(true)} type="button">
                <StatCard compact className="transition hover:brightness-110" label="Trực tuyến" tone="green" value={onlinePlayers.length} />
              </button>
              <StatCard compact label="Yêu cầu" tone="gold" value={hostState?.claims.length ?? 0} />
            </div>
            {showPlayersPopup ? (
              <div className="fixed inset-0 z-40 flex items-center justify-center bg-pixel-ink/70 p-4" aria-modal="true" aria-labelledby="host-players-popup-title" role="dialog">
                <PixelPanel className="max-h-[85vh] w-full max-w-lg overflow-auto p-4 sm:p-5">
                  <div className="flex items-center justify-between gap-4">
                    <p className="pixel-label text-slate-600" id="host-players-popup-title">Trạng thái người chơi</p>
                    <button className="pixel-badge bg-pixel-paper" onClick={() => setShowPlayersPopup(false)} type="button">Đóng</button>
                  </div>
                  <div className="mt-4 grid gap-3">
                    <p className="font-black text-slate-700">Đang trực tuyến ({onlinePlayers.length})</p>
                    {onlinePlayers.length ? onlinePlayers.map((player) => (
                      <div className="border-4 border-pixel-ink bg-green-100 p-3 shadow-[3px_3px_0_#10101f]" key={player.id}>
                        <span className="font-black">{player.name}{player.isWinner ? " • Thắng" : ""}</span>
                      </div>
                    )) : <p className="font-bold text-slate-600">Chưa có người chơi trực tuyến.</p>}
                  </div>
                  <div className="mt-5 grid gap-3">
                    <p className="font-black text-slate-700">Không trực tuyến ({offlinePlayers.length})</p>
                    {offlinePlayers.length ? offlinePlayers.map((player) => (
                      <div className="border-4 border-pixel-ink bg-slate-100 p-3 text-slate-600 shadow-[3px_3px_0_#10101f]" key={player.id}>
                        <div className="font-black">{player.name}{player.isWinner ? " • Thắng" : ""}</div>
                        <p className="mt-1 text-xs font-bold">Lần cuối trực tuyến: {formatLastSeen(player.lastSeenAt)}</p>
                      </div>
                    )) : <p className="font-bold text-slate-600">Không có người chơi ngoại tuyến.</p>}
                  </div>
                </PixelPanel>
              </div>
            ) : null}
            <PixelPanel className="p-4 sm:p-5">
              <p className="pixel-label text-slate-600">Người thắng</p>
              <div className="mt-4 grid gap-3">
                {winners.length ? winners.map((claim) => (
                  <div className="border-4 border-pixel-ink bg-yellow-100 p-3 font-black shadow-[3px_3px_0_#10101f]" key={claim.id}>
                    {claim.player.name}
                  </div>
                )) : <p className="font-bold text-slate-600">Chưa có người thắng.</p>}
              </div>
            </PixelPanel>
          </section>
        </div>
      </div>
    </PageShell>
  );
}
