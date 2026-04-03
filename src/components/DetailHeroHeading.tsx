"use client";

import { useEffect, useState } from "react";
import { motion } from "motion/react";

/**
 * Mesmo efeito da hero da index: palavras a entrar e frase com fundo `--indaco` (scaleX).
 */
export function DetailHeroHeading({
  line1,
  highlight,
}: {
  line1: string;
  highlight: string;
}) {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const id = window.setTimeout(() => setVisible(true), 50);
    return () => window.clearTimeout(id);
  }, []);

  const words = line1.trim().split(/\s+/).filter(Boolean);
  const totalBefore = words.length;
  const highlightDelay = totalBefore * 0.05 + 0.18;

  return (
    <h1
      className="text-left leading-[1.05] tracking-tight text-white"
      style={{
        fontFamily:
          "var(--font-latino-gothic), Latino Gothic WdEx, sans-serif",
        fontWeight: 800,
        fontSize: "clamp(26px, 4.8vw, 72px)",
      }}
    >
      {words.map((word, wi) => (
        <span
          key={`w-${wi}`}
          className="inline-block"
          style={{
            transform: visible
              ? "translateY(0) rotate(0deg)"
              : "translateY(48px) rotate(4deg)",
            opacity: visible ? 1 : 0,
            transition: `transform 0.8s cubic-bezier(0.22, 1, 0.36, 1) ${wi * 0.05}s, opacity 0.5s ease ${wi * 0.05}s`,
          }}
        >
          {word}&nbsp;
        </span>
      ))}
      <br />
      <span
        className="relative mt-1 inline-block"
        style={{
          transform: visible
            ? "translateY(0) scale(1)"
            : "translateY(32px) scale(0.92)",
          opacity: visible ? 1 : 0,
          transition: `transform 0.9s cubic-bezier(0.22, 1, 0.36, 1) ${totalBefore * 0.05 + 0.08}s, opacity 0.5s ease ${totalBefore * 0.05 + 0.08}s`,
        }}
      >
        <span className="relative z-10 px-3 py-0.5 text-white md:px-4">
          {highlight}
        </span>
        <motion.span
          className="absolute inset-0 z-0 origin-left"
          style={{ backgroundColor: "var(--indaco)" }}
          initial={{ scaleX: 0 }}
          animate={{ scaleX: visible ? 1 : 0 }}
          transition={{
            duration: 0.7,
            ease: [0.22, 1, 0.36, 1],
            delay: highlightDelay,
          }}
        />
      </span>
    </h1>
  );
}
