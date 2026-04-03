"use client";

import { useEffect, useRef } from "react";

/** Coloque um MP3 curto de clique de rato em `public/sounds/click.mp3`. */
const CLICK_SOUND_SRC = "/sounds/click.mp3";
const CLICK_VOLUME = 0.28;

export function ClickSound() {
  const audioRef = useRef<HTMLAudioElement | null>(null);

  useEffect(() => {
    const audio = new Audio(CLICK_SOUND_SRC);
    audio.volume = CLICK_VOLUME;
    audio.preload = "none";
    audioRef.current = audio;

    const onPointerDown = (e: PointerEvent) => {
      if (e.button !== 0) return;
      const a = audioRef.current;
      if (!a) return;
      if (a.readyState < 2) void a.load();
      a.currentTime = 0;
      void a.play().catch(() => {});
    };

    document.addEventListener("pointerdown", onPointerDown, true);
    return () => {
      document.removeEventListener("pointerdown", onPointerDown, true);
      audioRef.current = null;
    };
  }, []);

  return null;
}
