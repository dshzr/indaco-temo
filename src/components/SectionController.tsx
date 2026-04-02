"use client";

import {
  useState,
  useEffect,
  useCallback,
  useRef,
  type ReactNode,
} from "react";

interface SectionControllerProps {
  children: ReactNode[];
  /** Total number of sections */
  totalSections: number;
}

export function SectionController({
  children,
  totalSections,
}: SectionControllerProps) {
  const [activeSection, setActiveSection] = useState(0);
  const [isTransitioning, setIsTransitioning] = useState(false);
  const [isDragging, setIsDragging] = useState(false);
  const scrollbarRef = useRef<HTMLDivElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const lastWheelTime = useRef(0);

  const goToSection = useCallback(
    (index: number) => {
      if (isTransitioning) return;
      const clamped = Math.max(0, Math.min(totalSections - 1, index));
      if (clamped === activeSection) return;

      setIsTransitioning(true);
      setActiveSection(clamped);

      // Allow transition to complete before accepting new input
      setTimeout(() => {
        setIsTransitioning(false);
      }, 900);
    },
    [activeSection, isTransitioning, totalSections]
  );

  // Wheel handler — scroll up/down to change section
  useEffect(() => {
    const handleWheel = (e: WheelEvent) => {
      e.preventDefault();

      const now = Date.now();
      if (now - lastWheelTime.current < 800) return;
      lastWheelTime.current = now;

      if (e.deltaY > 0) {
        goToSection(activeSection + 1);
      } else if (e.deltaY < 0) {
        goToSection(activeSection - 1);
      }
    };

    const el = containerRef.current;
    if (el) {
      el.addEventListener("wheel", handleWheel, { passive: false });
    }
    return () => {
      if (el) {
        el.removeEventListener("wheel", handleWheel);
      }
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

  // Touch handler for mobile swipe
  useEffect(() => {
    let touchStartY = 0;

    const handleTouchStart = (e: TouchEvent) => {
      touchStartY = e.touches[0].clientY;
    };

    const handleTouchEnd = (e: TouchEvent) => {
      const touchEndY = e.changedTouches[0].clientY;
      const diff = touchStartY - touchEndY;
      if (Math.abs(diff) > 50) {
        if (diff > 0) {
          goToSection(activeSection + 1);
        } else {
          goToSection(activeSection - 1);
        }
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

  // Scrollbar drag handler
  const handleScrollbarDrag = useCallback(
    (clientY: number) => {
      if (!scrollbarRef.current) return;
      const rect = scrollbarRef.current.getBoundingClientRect();
      const ratio = (clientY - rect.top) / rect.height;
      const section = Math.round(ratio * (totalSections - 1));
      goToSection(section);
    },
    [totalSections, goToSection]
  );

  useEffect(() => {
    if (!isDragging) return;

    const handleMouseMove = (e: MouseEvent) => {
      e.preventDefault();
      handleScrollbarDrag(e.clientY);
    };

    const handleMouseUp = () => {
      setIsDragging(false);
    };

    window.addEventListener("mousemove", handleMouseMove);
    window.addEventListener("mouseup", handleMouseUp);
    return () => {
      window.removeEventListener("mousemove", handleMouseMove);
      window.removeEventListener("mouseup", handleMouseUp);
    };
  }, [isDragging, handleScrollbarDrag]);

  const scrollProgress = activeSection / (totalSections - 1);

  return (
    <div
      ref={containerRef}
      className="relative w-full h-screen overflow-hidden"
      style={{ backgroundColor: "var(--bg-light)" }}
    >
      {/* Sections container */}
      <div className="relative w-full h-full">
        {Array.isArray(children) &&
          children.map((child, index) => (
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
              {child}
            </div>
          ))}
      </div>

      {/* Custom Scrollbar — Right Side */}
      <div
        className="fixed right-6 top-1/2 -translate-y-1/2 z-[60] flex flex-col items-center"
        style={{ cursor: "var(--pointer)" }}
      >
        <div
          ref={scrollbarRef}
          className="relative w-[6px] rounded-full overflow-hidden"
          style={{
            height: "120px",
            backgroundColor: "rgba(0, 0, 0, 0.12)",
          }}
          onMouseDown={(e) => {
            setIsDragging(true);
            handleScrollbarDrag(e.clientY);
          }}
        >
          {/* Progress fill */}
          <div
            className="absolute top-0 left-0 w-full rounded-full transition-all duration-700"
            style={{
              backgroundColor: "var(--indaco)",
              height: `${scrollProgress * 100}%`,
              transitionTimingFunction: "var(--spring-easing)",
            }}
          />

          {/* Thumb / handle */}
          <div
            className="absolute left-1/2 -translate-x-1/2 w-[10px] h-[10px] rounded-full transition-all duration-700"
            style={{
              backgroundColor: "var(--indaco)",
              top: `calc(${scrollProgress * 100}% - 5px)`,
              transitionTimingFunction: "var(--spring-easing)",
              boxShadow: "0 0 8px rgba(106, 119, 244, 0.5)",
            }}
          />
        </div>
      </div>
    </div>
  );
}

/** Props passed to each section by the page */
export interface SectionProps {
  isActive: boolean;
}
