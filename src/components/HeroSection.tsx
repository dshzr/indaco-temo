"use client";

import { useEffect, useState } from "react";
import { motion, useReducedMotion } from "motion/react";
import {
  FloatingGeometricFace,
  FloatingShapeMatter,
  type FloatingGeometricKind,
} from "@/components/FloatingShapeMatter";

interface HeroSlideProps {
  isActive: boolean;
  /** false força forma estática (CSS); por omissão usa Matter na viewport. */
  useViewportDrift?: boolean;
  before: string;
  highlight: string;
  after: string;
  multiline: boolean;
  shapeAlt: string;
  shapeGeometry: FloatingGeometricKind;
}

export function HeroSlide({
  isActive,
  useViewportDrift = true,
  before,
  highlight,
  after,
  multiline,
  shapeAlt,
  shapeGeometry,
}: HeroSlideProps) {
  const reduceMotion = useReducedMotion();
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

  /** Matter gere o seu próprio atraso + pop; texto continua com creatureVisible. */
  const showMatter = useViewportDrift && isActive;

  return (
    <div className="relative w-full h-full flex items-center justify-center">
      {showMatter ? (
        <FloatingShapeMatter
          geometry={shapeGeometry}
          alt={shapeAlt}
          width={200}
          height={200}
          className="drop-shadow-xl"
        />
      ) : (
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
            className="md:opacity-100 opacity-60 aspect-square w-full max-w-[220px] md:max-w-[260px] mx-auto drop-shadow-xl"
            style={{
              animation: isActive ? "float 6s ease-in-out infinite" : "none",
            }}
          >
            <motion.div
              className="h-full w-full"
              role="img"
              aria-label={shapeAlt}
              animate={
                reduceMotion ? undefined : { scale: [1, 1.007, 1] }
              }
              transition={{
                duration: 3.9,
                repeat: Infinity,
                ease: "easeInOut",
              }}
            >
              <FloatingGeometricFace geometry={shapeGeometry} />
            </motion.div>
          </div>
        </div>
      )}

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
            <span className="relative z-10 text-white px-3 md:px-5 py-0.5">
              {highlight}
            </span>
            <motion.span
              className="absolute inset-0 z-0 origin-left"
              style={{ backgroundColor: "var(--indaco)" }}
              initial={{ scaleX: 0 }}
              animate={{ scaleX: textVisible ? 1 : 0 }}
              transition={{
                duration: 0.7,
                ease: [0.22, 1, 0.36, 1],
                delay: totalBeforeWords * 0.06 + 0.2,
              }}
            />
          </span>

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
