"use client";

import type { MarkedCell } from "@bingo/shared";
import { useEffect, useMemo, useRef, useState } from "react";
import type { Socket } from "socket.io-client";
import { BingoBoard } from "@/components/BingoBoard";
import { CalledItemCard } from "@/components/CalledItemCard";
import { AlertBox, PageShell, PixelButton, PixelPanel, StatusBadge } from "@/components/PixelUi";
import { apiFetch } from "@/lib/api";
import { createSocket } from "@/lib/socket";
import { playSound } from "@/lib/sounds";
import type { BingoVerifiedEvent, BoardRegeneratedEvent, CalledItem, ItemCalledEvent, JoinRoomResponse, PlayerState, RoomStateEvent } from "@/lib/types";

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

function roomStatusTone(status: string) {
  if (status === "playing") return "success";
  if (status === "ended") return "danger";
  return "warning";
}

export function PlayRoomClient({ roomCode }: PlayRoomClientProps) {
  const [name, setName] = useState("");
  const [playerToken, setPlayerToken] = useState<string | null>(null);
  const [state, setState] = useState<PlayerState | null>(null);
  const [localBoard, setLocalBoard] = useState<JoinRoomResponse | null>(null);
  const [markedCells, setMarkedCells] = useState<MarkedCell[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [winnerName, setWinnerName] = useState<string | null>(null);
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
  const calledItemIds = useMemo(() => new Set(state?.calledItems.map((called) => called.item.id) ?? []), [state?.calledItems]);

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
    nextSocket.on("game_restarted", () => {
      setError(null);
      setSuccessMessage(null);
      setWinnerName(null);
      setAnimatedCalledOrder(null);
      setMarkedCells([]);
      setState((current) => (current ? { ...current, roomStatus: "waiting", calledItems: [], markedCells: [] } : current));
    });
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
    nextSocket.on("cell_marked", ({ markedCells: nextMarkedCells }: { markedCells: MarkedCell[] }) => {
      playSound("card", 0.55);
      setMarkedCells(nextMarkedCells);
    });
    nextSocket.on("board_regenerated", (event: BoardRegeneratedEvent) => {
      setError(null);
      setSuccessMessage("New Bingo card generated.");
      setMarkedCells(event.markedCells);
      setLocalBoard((current) => current ? { ...current, board: event.board } : current);
      setState((current) => current ? { ...current, board: event.board, markedCells: event.markedCells } : current);
    });
    nextSocket.on("bingo_verified", (event: BingoVerifiedEvent) => {
      playSound("winner", 0.75);
      setWinnerName(event.playerName);
      setSuccessMessage(`${event.playerName} won Bingo. The game has ended.`);
    });
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
      setError(caught instanceof Error ? caught.message : "Could not join the room.");
    } finally {
      setIsJoining(false);
    }
  }

  function markCell(row: number, col: number) {
    setError(null);
    socket?.emit("mark_cell", { roomCode, playerToken, row, col });
  }

  function regenerateBoard() {
    setError(null);
    setSuccessMessage(null);
    socket?.emit("regenerate_board", { roomCode, playerToken });
  }

  function closeWinnerPopup() {
    setWinnerName(null);
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
      <PageShell className="flex items-center justify-center">
        <StatusBadge tone="info">Restoring room...</StatusBadge>
      </PageShell>
    );
  }

  if (!playerToken) {
    return (
      <PageShell className="flex items-center justify-center py-10" narrow>
        <PixelPanel dark className="w-full p-5 sm:p-8">
          <StatusBadge tone="info">Room {roomCode}</StatusBadge>
          <h1 className="pixel-title mt-5 text-4xl leading-tight sm:text-6xl">Claim Your Bingo Board</h1>
          <p className="mt-5 font-bold leading-7 text-pixel-muted">Enter your name to receive a unique board. No account needed, just the room link.</p>
          <label className="pixel-label mt-8 block text-pixel-muted" htmlFor="player-name">Player name</label>
          <input className="pixel-input mt-3" id="player-name" maxLength={40} onChange={(event) => setName(event.target.value)} placeholder="Example: Alex" value={name} />
          {error ? <AlertBox className="mt-5" tone="danger">{error}</AlertBox> : null}
          <PixelButton className="mt-6 w-full text-base" disabled={name.trim().length === 0 || isJoining} onClick={joinRoom} variant="secondary">
            {isJoining ? "Joining room" : "Join now"}
          </PixelButton>
        </PixelPanel>
      </PageShell>
    );
  }

  return (
    <PageShell className="py-4 pb-24 sm:py-5 sm:pb-6">
      <div className="mx-auto max-w-5xl space-y-3 sm:space-y-4">
        <PixelPanel dark className="p-3 sm:p-4">
          <div className="grid gap-3 lg:grid-cols-[1fr_auto] lg:items-center">
            <div className="min-w-0">
              <p className="pixel-label text-pixel-cyan">Room {roomCode}</p>
              <h1 className="mt-1 truncate text-xl font-black text-pixel-cream sm:text-2xl">{playerName || "Player"}</h1>
            </div>
            <div className="grid grid-cols-3 gap-1.5 sm:gap-2">
              <StatusBadge className="justify-center px-2 text-[0.7rem] sm:text-xs" tone={roomStatusTone(roomStatus)}>{roomStatus === "playing" ? "Playing" : roomStatus === "ended" ? "Ended" : "Waiting"}</StatusBadge>
              <StatusBadge className="justify-center px-2 text-[0.7rem] sm:text-xs" tone={isConnected ? "success" : "danger"}>{isConnected ? "Online" : "Offline"}</StatusBadge>
              <button className={`pixel-badge justify-center px-2 text-[0.7rem] sm:text-xs ${soundEnabled ? "bg-pixel-cyan" : "bg-pixel-paper"}`} onClick={toggleSound} type="button">
                Sound {soundEnabled ? "on" : "off"}
              </button>
            </div>
          </div>
        </PixelPanel>

        <section className="grid gap-2 sm:gap-3">
          <p className="pixel-label text-pixel-cyan">Latest item</p>
          <CalledItemCard animate={latestItem?.calledOrder === animatedCalledOrder} compact item={latestItem?.item} key={latestItem?.calledOrder ?? "empty"} order={latestItem?.calledOrder} />
        </section>

        {error ? <AlertBox tone="danger">{error}</AlertBox> : null}
        {successMessage ? <AlertBox tone="success">{successMessage}</AlertBox> : null}

        {roomStatus === "waiting" ? (
          <PixelButton className="w-full text-base" disabled={!isConnected} onClick={regenerateBoard} variant="secondary">
            Generate new card
          </PixelButton>
        ) : null}

        {board.length > 0 ? <BingoBoard board={board} calledItemIds={calledItemIds} markedCells={markedCells} onCellClick={markCell} disabled={roomStatus !== "playing" || !isConnected} /> : null}

        <div className="hidden sm:block">
          <PixelButton className="w-full text-xl" disabled={!isConnected || roomStatus !== "playing"} onClick={claimBingo} variant="danger">
            BINGO!
          </PixelButton>
        </div>

        <details className="pixel-panel p-3 sm:p-4">
          <summary className="pixel-label cursor-pointer text-slate-600">Called items ({state?.calledItems.length ?? 0})</summary>
          <div className="mt-3 flex max-h-32 flex-wrap gap-2 overflow-auto pr-1 sm:max-h-40">
            {state?.calledItems.length ? (
              state.calledItems.map((called) => (
                <span className="pixel-chip" key={called.id}>
                  {called.item.label ?? called.item.value}
                </span>
              ))
            ) : (
              <p className="font-bold text-slate-600">Called items will appear here once the host starts calling.</p>
            )}
          </div>
        </details>
      </div>

      {winnerName ? (
        <div className="winner-overlay-enter fixed inset-0 z-40 flex items-center justify-center bg-pixel-ink/75 p-4">
          <PixelPanel className="winner-panel-enter w-full max-w-md p-5 text-center sm:p-7">
            <p className="pixel-label text-pixel-pink">Bingo winner</p>
            <p className="mt-4 font-pixel text-4xl font-black uppercase leading-tight text-pixel-ink sm:text-5xl">{winnerName}</p>
            <p className="mt-4 font-bold text-slate-700">The game has ended.</p>
            <PixelButton className="mt-6 w-full" onClick={closeWinnerPopup} variant="secondary">
              Close
            </PixelButton>
          </PixelPanel>
        </div>
      ) : null}

      <div className="fixed inset-x-0 bottom-0 z-20 border-t-4 border-pixel-ink bg-pixel-panel/95 p-2.5 shadow-[0_-6px_0_#10101f] backdrop-blur sm:hidden">
        <PixelButton className="w-full text-xl" disabled={!isConnected || roomStatus !== "playing"} onClick={claimBingo} variant="danger">
          BINGO!
        </PixelButton>
      </div>
    </PageShell>
  );
}
