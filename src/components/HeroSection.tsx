"use client";

import { useEffect, useState } from "react";
import Image from "next/image";

interface HeroSlideProps {
  isActive: boolean;
  /** Text before the highlighted word */
  before: string;
  /** The highlighted word with indaco background */
  highlight: string;
  /** Text after the highlighted word */
  after: string;
  /** Whether "after" goes on a new line */
  multiline: boolean;
  /** 3D creature image source */
  creatureSrc: string;
  /** 3D creature alt text */
  creatureAlt: string;
}

export function HeroSlide({
  isActive,
  before,
  highlight,
  after,
  multiline,
  creatureSrc,
  creatureAlt,
}: HeroSlideProps) {
  const [textVisible, setTextVisible] = useState(false);
  const [creatureVisible, setCreatureVisible] = useState(false);

  useEffect(() => {
    if (isActive) {
      setTimeout(() => setCreatureVisible(true), 150);
      setTimeout(() => setTextVisible(true), 350);
    } else {
      setCreatureVisible(false);
      setTextVisible(false);
    }
  }, [isActive]);

  const beforeWords = before.split(" ");
  const afterWords = after ? after.split(" ") : [];
  const totalBeforeWords = beforeWords.length;

  return (
    <div className="relative w-full h-full flex items-center justify-center">
      {/* 3D Creature — Left */}
      <div
        className="absolute left-[-5%] md:left-[8%] top-[10%] md:top-1/2 z-10 w-[200px] md:w-[420px]"
        style={{
          transform: creatureVisible
            ? "translateY(-55%) scale(1) rotate(0deg)"
            : "translateY(-55%) scale(0.3) rotate(-20deg)",
          opacity: creatureVisible ? 0.6 : 0,
          transition:
            "transform 1.2s cubic-bezier(0.22, 1, 0.36, 1), opacity 0.8s ease",
        }}
      >
        <div
          className="md:opacity-100 opacity-60"
          style={{
            animation: isActive ? "float 6s ease-in-out infinite" : "none",
          }}
        >
          <Image
            src={creatureSrc}
            alt={creatureAlt}
            width={420}
            height={420}
            className="drop-shadow-2xl w-full h-auto"
            priority
          />
        </div>
      </div>

      {/* Center Text */}
      <div className="relative z-20 text-center w-full max-w-[850px] px-4 md:px-8">
        <h1
          className="text-black leading-[1.05] tracking-tight"
          style={{
            fontFamily:
              "var(--font-latino-gothic), Latino Gothic WdEx, sans-serif",
            fontWeight: 800,
            fontSize: "clamp(28px, 5.1vw, 80px)",
          }}
        >
          {/* Before words — each word pops in */}
          {beforeWords.map((word, wi) => (
            <span
              key={`b-${wi}`}
              className="inline-block"
              style={{
                transform: textVisible
                  ? "translateY(0) rotate(0deg)"
                  : "translateY(60px) rotate(5deg)",
                opacity: textVisible ? 1 : 0,
                transition: `transform 0.8s cubic-bezier(0.22, 1, 0.36, 1) ${wi * 0.06}s, opacity 0.5s ease ${wi * 0.06}s`,
              }}
            >
              {word}&nbsp;
            </span>
          ))}

          {/* Highlighted word */}
          <span
            className="inline-block relative"
            style={{
              transform: textVisible
                ? "translateY(0) scale(1)"
                : "translateY(40px) scale(0.9)",
              opacity: textVisible ? 1 : 0,
              transition: `transform 0.9s cubic-bezier(0.22, 1, 0.36, 1) ${totalBeforeWords * 0.06}s, opacity 0.5s ease ${totalBeforeWords * 0.06}s`,
            }}
          >
            <span
              className="relative z-10 text-white px-3 md:px-5 py-0.5"
              style={{ backgroundColor: "var(--indaco)" }}
            >
              {highlight}
            </span>
          </span>

          {/* After text */}
          {after && (
            <>
              {multiline && <br />}
              {afterWords.map((word, wi) => (
                <span
                  key={`a-${wi}`}
                  className="inline-block"
                  style={{
                    transform: textVisible
                      ? "translateY(0) rotate(0deg)"
                      : "translateY(60px) rotate(-3deg)",
                    opacity: textVisible ? 1 : 0,
                    transition: `transform 0.8s cubic-bezier(0.22, 1, 0.36, 1) ${(totalBeforeWords + 1 + wi) * 0.06}s, opacity 0.5s ease ${(totalBeforeWords + 1 + wi) * 0.06}s`,
                  }}
                >
                  {word}&nbsp;
                </span>
              ))}
            </>
          )}
        </h1>
      </div>
    </div>
  );
}
