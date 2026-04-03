"use client";

import { useState, useCallback, useRef, useEffect } from "react";
import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import { Header } from "@/components/Header";
import {
  PortfolioCanvas,
  type PortfolioHoverOverlayState,
} from "@/components/PortfolioCanvas";
import { PortfolioPreloader } from "@/components/PortfolioPreloader";

/** Tempo mínimo com o overlay visível após o canvas estar pronto (ms). */
const MIN_PRELOAD_MS = 3000;

export function PortfolioExperience() {
  const [tileHover, setTileHover] = useState<PortfolioHoverOverlayState | null>(
    null,
  );
  const [showLoader, setShowLoader] = useState(true);
  const pageLoadStartRef = useRef(Date.now());
  const canvasReadyRef = useRef(false);
  const dismissTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const reduceMotion = useReducedMotion();

  const exitTransition = reduceMotion
    ? { duration: 0.2 }
    : { duration: 0.65, ease: [0.22, 1, 0.36, 1] as const };

  const hoverFillTransition = reduceMotion
    ? { duration: 0.12 }
    : { duration: 0.48, ease: [0.22, 1, 0.36, 1] as const };

  const scheduleDismiss = useCallback(() => {
    if (!canvasReadyRef.current) return;
    if (dismissTimeoutRef.current !== null) {
      clearTimeout(dismissTimeoutRef.current);
    }
    const elapsed = Date.now() - pageLoadStartRef.current;
    const remaining = Math.max(0, MIN_PRELOAD_MS - elapsed);
    dismissTimeoutRef.current = setTimeout(() => {
      dismissTimeoutRef.current = null;
      setShowLoader(false);
    }, remaining);
  }, []);

  const handleCanvasReady = useCallback(() => {
    canvasReadyRef.current = true;
    scheduleDismiss();
  }, [scheduleDismiss]);

  useEffect(() => {
    return () => {
      if (dismissTimeoutRef.current !== null) {
        clearTimeout(dismissTimeoutRef.current);
      }
    };
  }, []);

  /** Se o WebGL nunca reportar ready, não prender o utilizador no roxo para sempre. */
  useEffect(() => {
    const maxWaitMs = 12000;
    const t = window.setTimeout(() => {
      if (!canvasReadyRef.current) {
        canvasReadyRef.current = true;
        scheduleDismiss();
      }
    }, maxWaitMs);
    return () => window.clearTimeout(t);
  }, [scheduleDismiss]);

  return (
    <main
      className="relative h-dvh w-full overflow-hidden bg-[#ebebeb]"
      aria-busy={showLoader}
    >
      <div
        className="absolute inset-0 overflow-hidden"
        style={{
          transform: "perspective(1800px) rotateX(4deg) scale(1.02)",
        }}
      >
        <PortfolioCanvas
          onReady={handleCanvasReady}
          onTileHover={setTileHover}
        />
        <AnimatePresence mode="popLayout">
          {tileHover ? (
            <motion.div
              key={tileHover.interactionKey}
              className="pointer-events-none absolute z-[20] flex min-h-0 min-w-0 flex-col items-center justify-center gap-2 overflow-hidden px-3 text-center text-white md:gap-3 md:px-4"
              style={{
                left: `${tileHover.x * 100}%`,
                top: `${tileHover.y * 100}%`,
                width: `${tileHover.w * 100}%`,
                height: `${tileHover.h * 100}%`,
                borderRadius: tileHover.borderRadiusCss,
                boxSizing: "border-box",
                backgroundColor: "#5B69C1",
                boxShadow: "inset 0 0 0 1px rgba(255,255,255,0.08)",
                fontFamily:
                  "var(--font-space-grotesk), ui-sans-serif, system-ui, sans-serif",
              }}
              initial={
                reduceMotion
                  ? { clipPath: "inset(0% 0% 0% 0%)" }
                  : { clipPath: "inset(0% 0% 100% 0%)" }
              }
              animate={{ clipPath: "inset(0% 0% 0% 0%)" }}
              exit={
                reduceMotion
                  ? { opacity: 0 }
                  : { clipPath: "inset(0% 0% 100% 0%)" }
              }
              transition={hoverFillTransition}
            >
              {tileHover.logoSrc ? (
                <img
                  src={tileHover.logoSrc}
                  alt=""
                  className="max-h-6 w-auto max-w-[58%] shrink-0 object-contain brightness-0 invert md:max-h-8"
                />
              ) : null}
              <p className="max-w-full text-[12px] font-medium leading-snug md:text-[15px]">
                {tileHover.headline}
              </p>
              <p className="max-w-full text-[8px] font-medium uppercase tracking-[0.2em] text-white/95 md:text-[10px]">
                {tileHover.tags}
              </p>
            </motion.div>
          ) : null}
        </AnimatePresence>
      </div>

      <Header activePage="portfolio" />

      <AnimatePresence>
        {showLoader && (
          <motion.div
            key="portfolio-preloader"
            className="pointer-events-auto fixed inset-x-0 top-0 z-[100] flex h-dvh items-center justify-center bg-[#7b86f8]"
            initial={{ y: 0 }}
            exit={{ y: "100%" }}
            transition={exitTransition}
            role="status"
            aria-live="polite"
            aria-label="A carregar o portfólio"
            style={{ willChange: "transform" }}
          >
            <PortfolioPreloader />
          </motion.div>
        )}
      </AnimatePresence>
    </main>
  );
}
