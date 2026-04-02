"use client";

import { useState, useCallback, useEffect, useRef } from "react";
import { Header } from "@/components/Header";
import { HeroSlide } from "@/components/HeroSection";
import { MethodSection } from "@/components/MethodSection";
import { WorkSection } from "@/components/WorkSection";

const TOTAL_SECTIONS = 5;

const heroSlides = [
  {
    before: "It's",
    highlight: "Indaco",
    after: "isn't it?",
    multiline: true,
    creature: { src: "/images/bunny.png", alt: "3D Bunny" },
  },
  {
    before: "Next time you wonder who to trust, the answer will be",
    highlight: "the same.",
    after: "",
    multiline: false,
    creature: { src: "/images/mosquito.png", alt: "3D Creature" },
  },
  {
    before: "We're a digital content agency with a",
    highlight: "strategic",
    after: "approach.",
    multiline: true,
    creature: { src: "/images/shapes/1.png", alt: "3D Shape" },
  },
];

export default function Home() {
  const [activeSection, setActiveSection] = useState(0);
  const [isTransitioning, setIsTransitioning] = useState(false);
  const [isDragging, setIsDragging] = useState(false);
  const scrollbarRef = useRef<HTMLDivElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const lastWheelTime = useRef(0);

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
    const handleWheel = (e: WheelEvent) => {
      e.preventDefault();
      const now = Date.now();
      if (now - lastWheelTime.current < 800) return;
      lastWheelTime.current = now;

      if (e.deltaY > 0) goToSection(activeSection + 1);
      else if (e.deltaY < 0) goToSection(activeSection - 1);
    };

    const el = containerRef.current;
    if (el) el.addEventListener("wheel", handleWheel, { passive: false });
    return () => {
      if (el) el.removeEventListener("wheel", handleWheel);
    };
  }, [activeSection, goToSection]);

  // Keyboard handler
  useEffect(() => {
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
  }, [activeSection, goToSection]);

  // Touch handler
  useEffect(() => {
    let touchStartY = 0;
    const handleTouchStart = (e: TouchEvent) => {
      touchStartY = e.touches[0].clientY;
    };
    const handleTouchEnd = (e: TouchEvent) => {
      const diff = touchStartY - e.changedTouches[0].clientY;
      if (Math.abs(diff) > 50) {
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
  }, [activeSection, goToSection]);

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

  const scrollProgress = activeSection / (TOTAL_SECTIONS - 1);

  // Build sections array: 3 hero slides + method + work
  const sections = [
    ...heroSlides.map((slide, i) => (
      <HeroSlide
        key={`hero-${i}`}
        isActive={activeSection === i}
        before={slide.before}
        highlight={slide.highlight}
        after={slide.after}
        multiline={slide.multiline}
        creatureSrc={slide.creature.src}
        creatureAlt={slide.creature.alt}
      />
    )),
    <MethodSection key="method" isActive={activeSection === 3} />,
    <WorkSection key="work" isActive={activeSection === 4} />,
  ];

  return (
    <>
      <Header />
      <div
        ref={containerRef}
        className="relative w-full h-screen overflow-hidden"
        style={{ backgroundColor: "var(--bg-light)" }}
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
          className="fixed right-6 top-1/2 -translate-y-1/2 z-[60]"
          style={{ cursor: "var(--pointer)" }}
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
