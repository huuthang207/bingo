"use client";

import type { MarkedCell } from "@bingo/shared";
import { useEffect, useMemo, useRef, useState } from "react";
import type { Socket } from "socket.io-client";
import { BingoBoard } from "@/components/BingoBoard";
import { CalledItemCard } from "@/components/CalledItemCard";
import { apiFetch } from "@/lib/api";
import { createSocket } from "@/lib/socket";
import type { CalledItem, ItemCalledEvent, JoinRoomResponse, PlayerState, RoomStateEvent } from "@/lib/types";

type PlayRoomClientProps = {
  roomCode: string;
};

function tokenKey(roomCode: string) {
  return `bingo:${roomCode}:playerToken`;
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

export function PlayRoomClient({ roomCode }: PlayRoomClientProps) {
  const [name, setName] = useState("");
  const [playerToken, setPlayerToken] = useState<string | null>(null);
  const [state, setState] = useState<PlayerState | null>(null);
  const [localBoard, setLocalBoard] = useState<JoinRoomResponse | null>(null);
  const [markedCells, setMarkedCells] = useState<MarkedCell[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [animatedCalledOrder, setAnimatedCalledOrder] = useState<number | null>(null);
  const [soundEnabled, setSoundEnabled] = useState(false);
  const [socket, setSocket] = useState<Socket | null>(null);
  const [isConnected, setIsConnected] = useState(false);
  const soundEnabledRef = useRef(soundEnabled);
  const audioContextRef = useRef<AudioContext | null>(null);
  const [isJoining, setIsJoining] = useState(false);
  const [isLoadingState, setIsLoadingState] = useState(true);

  const board = state?.board ?? localBoard?.board ?? [];
  const playerName = state?.name ?? name;
  const roomStatus = state?.roomStatus ?? "waiting";
  const latestItem = useMemo(() => state?.calledItems.at(-1), [state?.calledItems]);

  useEffect(() => {
    soundEnabledRef.current = soundEnabled;
  }, [soundEnabled]);

  useEffect(() => {
    if (!playerToken) {
      return;
    }

    const nextSocket = createSocket();
    setSocket(nextSocket);

    nextSocket.on("connect", () => {
      setIsConnected(true);
      nextSocket.emit("join_room", { roomCode, playerToken });
    });
    nextSocket.on("disconnect", () => setIsConnected(false));
    nextSocket.on("room_state", (event: RoomStateEvent) => {
      setState((current) => current ? {
        ...current,
        board: event.board ?? current.board,
        markedCells: event.markedCells ?? current.markedCells,
        calledItems: event.calledItems ?? current.calledItems,
        roomStatus: event.status,
      } : current);
      if (event.markedCells) {
        setMarkedCells(event.markedCells);
      }
    });
    nextSocket.on("game_started", () => setState((current) => (current ? { ...current, roomStatus: "playing" } : current)));
    nextSocket.on("game_ended", () => setState((current) => (current ? { ...current, roomStatus: "ended" } : current)));
    nextSocket.on("item_called", (event: ItemCalledEvent) => {
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
      setState((current) => current ? { ...current, calledItems: [...current.calledItems, calledItem] } : current);
    });
    nextSocket.on("cell_marked", ({ markedCells: nextMarkedCells }: { markedCells: MarkedCell[] }) => setMarkedCells(nextMarkedCells));
    nextSocket.on("bingo_verified", ({ playerName }: { playerName: string }) => setSuccessMessage(`${playerName} đã Bingo hợp lệ!`));
    nextSocket.on("error_message", ({ message }: { message: string }) => setError(message));
    nextSocket.connect();

    return () => {
      nextSocket.disconnect();
    };
  }, [playerToken, roomCode]);

  useEffect(() => {
    const storedToken = window.localStorage.getItem(tokenKey(roomCode));

    if (!storedToken) {
      setIsLoadingState(false);
      return;
    }

    setPlayerToken(storedToken);
    apiFetch<PlayerState>(`/rooms/${roomCode}/player-state`, {
      headers: { Authorization: `Bearer ${storedToken}` },
    })
      .then((playerState) => {
        setState(playerState);
        setMarkedCells(playerState.markedCells);
      })
      .catch(() => {
        window.localStorage.removeItem(tokenKey(roomCode));
        setPlayerToken(null);
      })
      .finally(() => setIsLoadingState(false));
  }, [roomCode]);

  async function joinRoom() {
    setError(null);
    setIsJoining(true);

    try {
      const joined = await apiFetch<JoinRoomResponse>(`/rooms/${roomCode}/join`, {
        method: "POST",
        body: JSON.stringify({ name }),
      });

      window.localStorage.setItem(tokenKey(roomCode), joined.playerToken);
      setPlayerToken(joined.playerToken);
      setLocalBoard(joined);
      setMarkedCells([]);
      setState({
        playerId: joined.playerId,
        name,
        board: joined.board,
        markedCells: [],
        calledItems: [],
        roomStatus: "waiting",
        winRules: { horizontal: true, vertical: true, diagonal: true },
      });
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "Không thể tham gia phòng.");
    } finally {
      setIsJoining(false);
    }
  }

  function markCell(row: number, col: number) {
    setError(null);
    socket?.emit("mark_cell", { roomCode, playerToken, row, col });
  }

  function claimBingo() {
    setError(null);
    setSuccessMessage(null);
    socket?.emit("claim_bingo", { roomCode, playerToken });
  }

  function toggleSound() {
    const nextEnabled = !soundEnabled;
    setSoundEnabled(nextEnabled);
    if (nextEnabled) {
      playCalledItemSound(audioContextRef);
    }
  }

  if (isLoadingState) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-slate-950 px-6 text-white">
        <p className="rounded-full border-2 border-white px-6 py-3 font-black tracking-[0.2em]">Đang khôi phục phòng...</p>
      </main>
    );
  }

  if (!playerToken) {
    return (
      <main className="relative min-h-screen overflow-hidden bg-slate-950 px-5 py-10 text-white">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_20%_20%,#f43f5e_0,transparent_28%),radial-gradient(circle_at_80%_10%,#22d3ee_0,transparent_24%),radial-gradient(circle_at_50%_90%,#facc15_0,transparent_30%)] opacity-80" />
        <section className="relative mx-auto max-w-xl rounded-[2rem] border-4 border-white bg-slate-900/90 p-8 shadow-[14px_14px_0_#facc15] backdrop-blur">
          <p className="text-sm font-black uppercase tracking-[0.35em] text-cyan-300">Phòng {roomCode}</p>
          <h1 className="mt-4 text-5xl font-black leading-none">Lấy bảng Bingo của bạn</h1>
          <p className="mt-5 text-lg font-semibold text-slate-300">Nhập tên để nhận một board riêng. Không cần tài khoản.</p>
          <label className="mt-8 block text-sm font-black uppercase tracking-[0.22em] text-slate-400" htmlFor="player-name">Tên người chơi</label>
          <input
            className="mt-3 w-full rounded-2xl border-4 border-white bg-white px-4 py-4 text-xl font-black text-slate-950 outline-none focus:ring-4 focus:ring-cyan-300"
            id="player-name"
            maxLength={40}
            onChange={(event) => setName(event.target.value)}
            placeholder="Ví dụ: Minh Anh"
            value={name}
          />
          {error ? <p className="mt-4 rounded-2xl bg-red-500 px-4 py-3 font-bold text-white">{error}</p> : null}
          <button
            className="mt-6 w-full rounded-2xl border-4 border-white bg-cyan-300 px-6 py-4 text-xl font-black text-slate-950 shadow-[8px_8px_0_#ffffff] transition hover:-translate-y-1 disabled:cursor-not-allowed disabled:bg-slate-500"
            disabled={name.trim().length === 0 || isJoining}
            onClick={joinRoom}
            type="button"
          >
            {isJoining ? "Đang vào phòng..." : "Tham gia ngay"}
          </button>
        </section>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-[#fff7dc] px-2.5 py-4 text-slate-950 sm:px-4 sm:py-6">
      <div className="mx-auto max-w-5xl">
        <header className="mb-5 rounded-[1.5rem] border-4 border-slate-950 bg-white p-4 shadow-[6px_6px_0_#0f172a] sm:mb-6 sm:rounded-[2rem] sm:p-5 sm:shadow-[10px_10px_0_#0f172a]">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <p className="text-sm font-black uppercase tracking-[0.3em] text-rose-600">Phòng {roomCode}</p>
              <h1 className="mt-2 text-2xl font-black sm:text-3xl">{playerName || "Người chơi"}</h1>
            </div>
            <div className="grid gap-2 sm:grid-cols-3">
              <div className="rounded-2xl border-2 border-slate-950 bg-amber-300 px-5 py-3 text-center font-black uppercase tracking-[0.15em]">
                {roomStatus === "playing" ? "Đang chơi" : roomStatus === "ended" ? "Đã kết thúc" : "Đang chờ host"}
              </div>
              <div className={`rounded-2xl border-2 border-slate-950 px-5 py-3 text-center font-black uppercase tracking-[0.15em] ${isConnected ? "bg-lime-300" : "bg-slate-200"}`}>
                {isConnected ? "Online" : "Offline"}
              </div>
              <button className={`rounded-2xl border-2 border-slate-950 px-5 py-3 text-center font-black uppercase tracking-[0.15em] ${soundEnabled ? "bg-cyan-300" : "bg-white"}`} onClick={toggleSound} type="button">
                Âm: {soundEnabled ? "Bật" : "Tắt"}
              </button>
            </div>
          </div>
          <div className="mt-5 rounded-2xl bg-slate-950 px-3 py-3 text-white sm:px-5 sm:py-4">
            <p className="text-xs font-black uppercase tracking-[0.24em] text-cyan-300">Item mới nhất</p>
            <div className="mt-3">
              <CalledItemCard animate={latestItem?.calledOrder === animatedCalledOrder} compact item={latestItem?.item} key={latestItem?.calledOrder ?? "empty"} order={latestItem?.calledOrder} />
            </div>
          </div>
        </header>

        {error ? <p className="mb-5 rounded-2xl border-4 border-slate-950 bg-red-500 px-5 py-4 font-black text-white shadow-[6px_6px_0_#0f172a]">{error}</p> : null}
        {successMessage ? <p className="mb-5 rounded-2xl border-4 border-slate-950 bg-lime-300 px-5 py-4 font-black text-slate-950 shadow-[6px_6px_0_#0f172a]">{successMessage}</p> : null}

        {board.length > 0 ? <BingoBoard board={board} markedCells={markedCells} onCellClick={markCell} disabled={roomStatus !== "playing" || !isConnected} /> : null}

        <button
          className="mt-6 w-full rounded-[1.25rem] border-4 border-slate-950 bg-rose-500 px-6 py-4 text-2xl font-black text-white shadow-[6px_6px_0_#0f172a] transition hover:-translate-y-1 disabled:cursor-not-allowed disabled:bg-slate-300 sm:mt-8 sm:rounded-[1.5rem] sm:py-5 sm:text-3xl sm:shadow-[10px_10px_0_#0f172a]"
          disabled={!isConnected || roomStatus !== "playing"}
          onClick={claimBingo}
          type="button"
        >
          BINGO!
        </button>

        <section className="mt-6 rounded-[1.5rem] border-4 border-slate-950 bg-white p-4 sm:mt-8 sm:rounded-[2rem] sm:p-5">
          <p className="text-sm font-black uppercase tracking-[0.24em] text-slate-500">Đã gọi</p>
          <div className="mt-4 flex flex-wrap gap-2">
            {state?.calledItems.length ? (
              state.calledItems.map((called) => (
                <span className="rounded-full bg-slate-950 px-4 py-2 text-sm font-black text-white" key={called.id}>
                  {called.item.label ?? called.item.value}
                </span>
              ))
            ) : (
              <p className="font-semibold text-slate-500">Danh sách sẽ hiện ở đây khi host bắt đầu gọi item.</p>
            )}
          </div>
        </section>
      </div>
    </main>
  );
}
