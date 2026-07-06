"use client";

import { useRouter } from "next/navigation";
import { FormEvent, useState } from "react";
import { AlertBox, PixelButton } from "@/components/PixelUi";

export function JoinRoomByCodeForm() {
  const router = useRouter();
  const [roomCode, setRoomCode] = useState("");
  const [error, setError] = useState<string | null>(null);

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    const normalizedRoomCode = roomCode.trim().toUpperCase();

    if (!normalizedRoomCode) {
      setError("Hãy nhập mã phòng từ người dẫn.");
      return;
    }

    setError(null);
    router.push(`/play/${encodeURIComponent(normalizedRoomCode)}`);
  }

  return (
    <form className="mt-5 grid gap-3" onSubmit={handleSubmit}>
      <label className="pixel-label text-slate-600" htmlFor="room-code">Mã phòng</label>
      <input
        autoComplete="off"
        className="pixel-input uppercase"
        id="room-code"
        maxLength={12}
        onChange={(event) => {
          setRoomCode(event.target.value);
          if (error) {
            setError(null);
          }
        }}
        placeholder="Ví dụ: ABC123"
        value={roomCode}
      />
      {error ? <AlertBox tone="danger">{error}</AlertBox> : null}
      <PixelButton className="w-full" type="submit" variant="secondary">
        Tham gia phòng
      </PixelButton>
    </form>
  );
}
