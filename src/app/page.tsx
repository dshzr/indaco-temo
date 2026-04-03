"use client";

import dynamic from "next/dynamic";
import { useState, useCallback, useEffect, useRef } from "react";
import { Header } from "@/components/Header";
import type { FloatingGeometricKind } from "@/components/FloatingShapeMatter";

const IntroSection = dynamic(
  () =>
    import("@/components/IntroSection").then((m) => ({
      default: m.IntroSection,
    })),
  { ssr: false },
);

const HeroSlide = dynamic(() =>
  import("@/components/HeroSection").then((m) => ({ default: m.HeroSlide })),
);

const MethodSection = dynamic(() =>
  import("@/components/MethodSection").then((m) => ({
    default: m.MethodSection,
  })),
);

const WorkSection = dynamic(() =>
  import("@/components/WorkSection").then((m) => ({ default: m.WorkSection })),
);

const TOTAL_SECTIONS = 5;

const heroSlides: {
  before: string;
  highlight: string;
  after: string;
  multiline: boolean;
  shape: { alt: string; geometry: FloatingGeometricKind };
}[] = [
  {
    before: "It's",
    highlight: "Indaco",
    after: "isn't it?",
    multiline: true,
    shape: { alt: "Forma rectangular", geometry: "rectangle" },
  },
  {
    before: "Next time you wonder who to trust, the answer will be",
    highlight: "the same.",
    after: "",
    multiline: false,
    shape: { alt: "Forma triangular", geometry: "triangle" },
  },
  {
    before: "We're a digital content agency with a",
    highlight: "strategic",
    after: "approach.",
    multiline: true,
    shape: { alt: "Forma circular", geometry: "circle" },
  },
];

export default function Home() {
  const [showIntro, setShowIntro] = useState(true);
  const [siteReady, setSiteReady] = useState(false);
  const [activeSection, setActiveSection] = useState(0);
  const [isTransitioning, setIsTransitioning] = useState(false);
  const [isDragging, setIsDragging] = useState(false);
  const scrollbarRef = useRef<HTMLDivElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const lastWheelTime = useRef(0);
  /** Evita avanço por clique no centro logo após wheel ou swipe (duplo disparo no mobile/desktop). */
  const suppressCenterAdvanceUntil = useRef(0);

  const handleIntroEnter = useCallback(() => {
    setShowIntro(false);
    // Small delay to let the main content appear smoothly
    setTimeout(() => {
      setSiteReady(true);
    }, 100);
  }, []);

  const goToSection = useCallback(
    (index: number) => {
      if (isTransitioning) return;
      const clamped = Math.max(0, Math.min(TOTAL_SECTIONS - 1, index));
      if (clamped === activeSection) return;

      setIsTransitioning(true);
      setActiveSection(clamped);

      setTimeout(() => {
        setIsTransitioning(false);
      }, 900);
    },
    [activeSection, isTransitioning]
  );

  // Wheel handler
  useEffect(() => {
    if (showIntro) return;

    const handleWheel = (e: WheelEvent) => {
      e.preventDefault();
      const now = Date.now();
      if (now - lastWheelTime.current < 800) return;
      lastWheelTime.current = now;

      if (e.deltaY > 0) {
        suppressCenterAdvanceUntil.current = Date.now() + 400;
        goToSection(activeSection + 1);
      } else if (e.deltaY < 0) {
        suppressCenterAdvanceUntil.current = Date.now() + 400;
        goToSection(activeSection - 1);
      }
    };

    const el = containerRef.current;
    if (el) el.addEventListener("wheel", handleWheel, { passive: false });
    return () => {
      if (el) el.removeEventListener("wheel", handleWheel);
    };
  }, [activeSection, goToSection, showIntro]);

  // Keyboard handler
  useEffect(() => {
    if (showIntro) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "ArrowDown" || e.key === "PageDown") {
        e.preventDefault();
        goToSection(activeSection + 1);
      } else if (e.key === "ArrowUp" || e.key === "PageUp") {
        e.preventDefault();
        goToSection(activeSection - 1);
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [activeSection, goToSection, showIntro]);

  // Touch handler
  useEffect(() => {
    if (showIntro) return;

    let touchStartY = 0;
    const handleTouchStart = (e: TouchEvent) => {
      touchStartY = e.touches[0].clientY;
    };
    const handleTouchEnd = (e: TouchEvent) => {
      const diff = touchStartY - e.changedTouches[0].clientY;
      if (Math.abs(diff) > 50) {
        suppressCenterAdvanceUntil.current = Date.now() + 400;
        if (diff > 0) goToSection(activeSection + 1);
        else goToSection(activeSection - 1);
      }
    };
    const el = containerRef.current;
    if (el) {
      el.addEventListener("touchstart", handleTouchStart, { passive: true });
      el.addEventListener("touchend", handleTouchEnd, { passive: true });
    }
    return () => {
      if (el) {
        el.removeEventListener("touchstart", handleTouchStart);
        el.removeEventListener("touchend", handleTouchEnd);
      }
    };
  }, [activeSection, goToSection, showIntro]);

  // Scrollbar drag
  const handleScrollbarDrag = useCallback(
    (clientY: number) => {
      if (!scrollbarRef.current) return;
      const rect = scrollbarRef.current.getBoundingClientRect();
      const ratio = (clientY - rect.top) / rect.height;
      const section = Math.round(ratio * (TOTAL_SECTIONS - 1));
      goToSection(section);
    },
    [goToSection]
  );

  useEffect(() => {
    if (!isDragging) return;
    const handleMouseMove = (e: MouseEvent) => {
      e.preventDefault();
      handleScrollbarDrag(e.clientY);
    };
    const handleMouseUp = () => setIsDragging(false);
    window.addEventListener("mousemove", handleMouseMove);
    window.addEventListener("mouseup", handleMouseUp);
    return () => {
      window.removeEventListener("mousemove", handleMouseMove);
      window.removeEventListener("mouseup", handleMouseUp);
    };
  }, [isDragging, handleScrollbarDrag]);

  // Avançar secção só com clique/toque na zona central (evita links, barra e conflito com scroll).
  useEffect(() => {
    if (showIntro) return;

    const interactiveSelector =
      "a[href], button, [role='button'], input, textarea, select, label, [data-no-section-advance]";

    const isInteractiveTarget = (target: EventTarget | null) => {
      if (!(target instanceof Element)) return false;
      return Boolean(target.closest(interactiveSelector));
    };

    const inCenterZone = (clientX: number, clientY: number) => {
      const vw = window.innerWidth;
      const vh = window.innerHeight;
      const xMin = vw * 0.22;
      const xMax = vw * 0.78;
      const yMin = vh * 0.18;
      const yMax = vh * 0.82;
      const scrollbarReservePx = Math.min(96, vw * 0.24);
      if (clientX >= vw - scrollbarReservePx) return false;
      return (
        clientX >= xMin &&
        clientX <= xMax &&
        clientY >= yMin &&
        clientY <= yMax
      );
    };

    const onClick = (e: Event) => {
      if (!(e instanceof MouseEvent) || e.button !== 0) return;
      if (Date.now() < suppressCenterAdvanceUntil.current) return;
      if (isInteractiveTarget(e.target)) return;
      const el = e.target;
      if (!(el instanceof Element)) return;
      if (el.closest("[data-section-scrollbar]")) return;
      if (!inCenterZone(e.clientX, e.clientY)) return;
      goToSection(activeSection + 1);
    };

    document.addEventListener("click", onClick);
    return () => document.removeEventListener("click", onClick);
  }, [showIntro, activeSection, goToSection]);

  const scrollProgress = activeSection / (TOTAL_SECTIONS - 1);

  // Build sections array: 3 hero slides + method + work
  const sections = [
    ...heroSlides.map((slide, i) => (
      <HeroSlide
        key={`hero-${i}`}
        isActive={activeSection === i && siteReady}
        before={slide.before}
        highlight={slide.highlight}
        after={slide.after}
        multiline={slide.multiline}
        shapeAlt={slide.shape.alt}
        shapeGeometry={slide.shape.geometry}
      />
    )),
    <MethodSection key="method" isActive={activeSection === 3} />,
    <WorkSection
      key="work"
      isActive={activeSection === 4}
      prefetchPortfolioAssets={!showIntro && activeSection >= 3}
    />,
  ];

  return (
    <>
      {/* Intro Overlay */}
      {showIntro && <IntroSection onEnter={handleIntroEnter} />}

      {/* Header — hidden during intro */}
      <div
        style={{
          opacity: showIntro ? 0 : 1,
          transition: "opacity 0.8s ease 0.3s",
          pointerEvents: showIntro ? "none" : "auto",
        }}
      >
        <Header />
      </div>

      {/* Main Site */}
      <div
        ref={containerRef}
        className="relative w-full h-screen overflow-hidden"
        style={{
          backgroundColor: "var(--bg-light)",
          opacity: showIntro ? 0 : 1,
          transition: "opacity 1s ease",
        }}
      >
        {sections.map((section, index) => (
          <div
            key={index}
            className="absolute inset-0 w-full h-full"
            style={{
              opacity: index === activeSection ? 1 : 0,
              pointerEvents: index === activeSection ? "auto" : "none",
              transition: "opacity 0.7s cubic-bezier(0.22, 1, 0.36, 1)",
              zIndex: index === activeSection ? 10 : 1,
            }}
          >
            {section}
          </div>
        ))}

        {/* Custom Scrollbar */}
        <div
          data-section-scrollbar
          className="fixed right-6 top-1/2 -translate-y-1/2 z-[60]"
          style={{
            opacity: showIntro ? 0 : 1,
            transition: "opacity 0.5s ease 0.5s",
          }}
        >
          <div
            ref={scrollbarRef}
            className="relative w-[6px] rounded-full overflow-visible"
            style={{
              height: "120px",
              backgroundColor: "rgba(0, 0, 0, 0.10)",
            }}
            onMouseDown={(e) => {
              setIsDragging(true);
              handleScrollbarDrag(e.clientY);
            }}
          >
            {/* Track fill */}
            <div
              className="absolute top-0 left-0 w-full rounded-full"
              style={{
                backgroundColor: "var(--indaco)",
                height: `${scrollProgress * 100}%`,
                transition: "height 0.7s cubic-bezier(0.22, 1, 0.36, 1)",
              }}
            />
            {/* Thumb */}
            <div
              className="absolute left-1/2 -translate-x-1/2 w-[12px] h-[12px] rounded-full"
              style={{
                backgroundColor: "var(--indaco)",
                top: `calc(${scrollProgress * 100}% - 6px)`,
                transition: "top 0.7s cubic-bezier(0.22, 1, 0.36, 1)",
                boxShadow: "0 0 10px rgba(106, 119, 244, 0.4)",
              }}
            />
          </div>
        </div>
      </div>
    </>
  );
}
