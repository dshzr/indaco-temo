"use client";

import { useState, useEffect, useCallback } from "react";
import { motion, AnimatePresence, useMotionValue, useSpring } from "motion/react";
import { cn } from "@/lib/utils";

interface IntroSectionProps {
  onEnter: () => void;
}

export function IntroSection({ onEnter }: IntroSectionProps) {
  const [isReady, setIsReady] = useState(false);
  const [isExiting, setIsExiting] = useState(false);

  const followSpring = { stiffness: 42, damping: 28, mass: 0.9 };
  const tiltSpring = { stiffness: 58, damping: 22, mass: 0.75 };

  // Deslocamento limitado em px: o círculo “segue” o rato mas permanece na zona central
  const rawOffsetX = useMotionValue(0);
  const rawOffsetY = useMotionValue(0);
  const offsetX = useSpring(rawOffsetX, followSpring);
  const offsetY = useSpring(rawOffsetY, followSpring);

  const rawRotateX = useMotionValue(0);
  const rawRotateY = useMotionValue(0);
  const rotateX = useSpring(rawRotateX, tiltSpring);
  const rotateY = useSpring(rawRotateY, tiltSpring);

  useEffect(() => {
    const onMove = (e: MouseEvent) => {
      const vw = window.innerWidth;
      const vh = window.innerHeight;
      const cx = vw / 2;
      const cy = vh / 2;
      const nx = (e.clientX - cx) / cx;
      const ny = (e.clientY - cy) / cy;

      const maxShift = Math.min(vw, vh) * 0.065;
      rawOffsetX.set(nx * maxShift);
      rawOffsetY.set(ny * maxShift);

      rawRotateY.set(nx * 14);
      rawRotateX.set(-ny * 10);
    };
    window.addEventListener("mousemove", onMove, { passive: true });
    return () => window.removeEventListener("mousemove", onMove);
  }, [rawOffsetX, rawOffsetY, rawRotateX, rawRotateY]);

  useEffect(() => {
    const t = setTimeout(() => setIsReady(true), 400);
    return () => clearTimeout(t);
  }, []);

  const handleClick = useCallback(() => {
    if (isExiting) return;
    setIsExiting(true);
    setTimeout(() => onEnter(), 1000);
  }, [isExiting, onEnter]);

  return (
    <AnimatePresence>
      {!isExiting ? (
        <motion.div
          key="intro"
          role="button"
          tabIndex={0}
          aria-label="Entrar no site"
          className="fixed inset-0 z-[100] flex select-none overflow-hidden items-center justify-center"
          style={{ backgroundColor: "#000" }}
          onClick={handleClick}
          onKeyDown={(e) => {
            if (e.key === "Enter" || e.key === " ") {
              e.preventDefault();
              handleClick();
            }
          }}
          initial={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 1, ease: [0.22, 1, 0.36, 1] }}
        >
          {/* Background video — local file */}
          <video
            className="absolute inset-0 z-0 h-full w-full object-cover"
            src="/videos/bg-intro.mp4"
            poster="/images/intro-frame.webp"
            autoPlay
            muted
            loop
            playsInline
            preload="metadata"
            disablePictureInPicture
          />

          {/* Subtle dark vignette overlay */}
          <div
            className="absolute inset-0 z-[1] pointer-events-none"
            style={{
              background:
                "radial-gradient(ellipse at center, transparent 30%, rgba(0,0,0,0.45) 100%)",
            }}
          />

          {/* Sphere — centro da área; segue o rato com offset limitado + inclinação suave */}
          <motion.div
            className={cn(
              "relative z-10 flex items-center justify-center will-change-transform",
              "transition-opacity duration-700",
              isReady ? "opacity-100" : "opacity-0"
            )}
            style={{
              x: offsetX,
              y: offsetY,
              rotateX,
              rotateY,
              transformPerspective: 800,
              transformStyle: "preserve-3d",
            }}
          >
            <div
              className="relative flex h-[clamp(260px,36vw,520px)] w-[clamp(260px,36vw,520px)] items-center justify-center overflow-hidden [clip-path:inset(0_2mm_0_0)]"
            >
              <video
                className="h-full w-full translate-x-[1mm] object-contain object-center"
                src="/videos/hello-sphere.webm"
                autoPlay
                muted
                loop
                playsInline
                preload="metadata"
                disablePictureInPicture
              />
            </div>
          </motion.div>

          {/* Bottom text */}
          <motion.p
            className="absolute bottom-[6%] left-0 right-0 z-20 text-center font-sans leading-snug tracking-wide md:leading-relaxed"
            style={{ fontSize: "clamp(16px, 1.35vw, 26px)" }}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: isReady ? 0.75 : 0, y: isReady ? 0 : 10 }}
            transition={{ duration: 0.8, delay: 1.0, ease: [0.22, 1, 0.36, 1] }}
          >
            <span className="text-white">Click anywhere</span>
            <br />
            <span className="text-white/60">to discover the website</span>
          </motion.p>
        </motion.div>
      ) : (
        <motion.div
          key="intro-exit"
          className="fixed inset-0 z-[100]"
          style={{ backgroundColor: "#f5f5f5" }}
          initial={{ opacity: 1 }}
          animate={{ opacity: 0 }}
          transition={{ duration: 1, ease: [0.22, 1, 0.36, 1] }}
        />
      )}
    </AnimatePresence>
  );
}
