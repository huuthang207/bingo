"use client";

import { useEffect } from "react";
import { playSound } from "@/lib/sounds";

export function GlobalClickSound() {
  useEffect(() => {
    function handlePointerDown(event: PointerEvent) {
      const target = event.target;

      if (!(target instanceof Element)) {
        return;
      }

      const clickable = target.closest("button:not(:disabled), a[href], input[type='button'], input[type='submit'], [role='button']");

      if (clickable && !clickable.closest("[data-sound='card']")) {
        playSound("click", 0.35);
      }
    }

    document.addEventListener("pointerdown", handlePointerDown);

    return () => {
      document.removeEventListener("pointerdown", handlePointerDown);
    };
  }, []);

  return null;
}
