"use client";

import { useEffect, useState } from "react";
import { FloatingShapeMatter } from "@/components/FloatingShapeMatter";

const timelineItems = [
  {
    title: "Decode",
    description:
      "We approach briefs with curiosity, reading between the lines to grasp every need.",
  },
  {
    title: "Create",
    description:
      "Our multidisciplinary teams refine ideas with care and expertise.",
  },
  {
    title: "Achieve",
    description:
      "We close the loop with precise, timely, and quality outputs.",
  },
];

interface MethodSectionProps {
  isActive: boolean;
}

export function MethodSection({ isActive }: MethodSectionProps) {
  const [titleVisible, setTitleVisible] = useState(false);
  const [lineVisible, setLineVisible] = useState(false);
  const [dotsVisible, setDotsVisible] = useState([false, false, false]);
  const [textsVisible, setTextsVisible] = useState([false, false, false]);
  const [creatureVisible, setCreatureVisible] = useState(false);

  useEffect(() => {
    if (isActive) {
      // Staggered entrance animations
      setTimeout(() => setTitleVisible(true), 100);
      setTimeout(() => setLineVisible(true), 500);
      setTimeout(() => setDotsVisible([true, false, false]), 700);
      setTimeout(() => setTextsVisible([true, false, false]), 800);
      setTimeout(() => setDotsVisible([true, true, false]), 1000);
      setTimeout(() => setTextsVisible([true, true, false]), 1100);
      setTimeout(() => setDotsVisible([true, true, true]), 1300);
      setTimeout(() => setTextsVisible([true, true, true]), 1400);
      setTimeout(() => setCreatureVisible(true), 1200);
    } else {
      setTitleVisible(false);
      setLineVisible(false);
      setDotsVisible([false, false, false]);
      setTextsVisible([false, false, false]);
      setCreatureVisible(false);
    }
  }, [isActive]);

  return (
    <div className="relative w-full h-full flex flex-col items-center justify-center px-4 md:px-8">
      {/* Title */}
      <div className="relative z-10 text-center max-w-[900px] mb-12 md:mb-20">
        <h2
          style={{
            fontFamily:
              "var(--font-latino-gothic), Latino Gothic WdEx, sans-serif",
            fontWeight: 800,
            fontSize: "var(--font-text-animated)",
            lineHeight: 1.05,
            transform: titleVisible
              ? "translateY(0)"
              : "translateY(80px)",
            opacity: titleVisible ? 1 : 0,
            transition:
              "transform 1s cubic-bezier(0.22, 1, 0.36, 1), opacity 0.7s ease",
            clipPath: titleVisible
              ? "polygon(0 0, 100% 0, 100% 100%, 0 100%)"
              : "polygon(0 100%, 100% 100%, 100% 100%, 0 100%)",
          }}
          className="text-black"
        >
          Thinking isn&apos;t linear.
          <br />
          Our method is.
        </h2>
      </div>

      {/* Timeline */}
      <div className="relative flex flex-col md:flex-row items-center justify-evenly w-full max-w-[1100px]">
        {/* Horizontal Wave (desktop) */}
        <div className="hidden md:block absolute top-1/2 left-0 right-0 h-[200px] -translate-y-1/2 pointer-events-none z-0">
          <svg 
            width="100%" 
            height="100%" 
            viewBox="0 0 100 100" 
            preserveAspectRatio="none"
            className="overflow-visible"
          >
            <path 
              d="M -5,89 L 20,89 C 35,89 35,11 50,11 C 65,11 65,89 80,89 L 105,89"
              fill="none" 
              stroke="var(--indaco)" 
              strokeWidth="12" 
              strokeLinecap="round"
              vectorEffect="non-scaling-stroke"
              style={{
                strokeDasharray: 1500,
                strokeDashoffset: lineVisible ? 0 : 1500,
                transition: "stroke-dashoffset 2.5s cubic-bezier(0.22, 1, 0.36, 1)"
              }}
            />
          </svg>
        </div>

        {/* Vertical Line (mobile) */}
        <div
          className="md:hidden absolute top-[20px] bottom-[20px] left-1/2 w-[8px] rounded-full -translate-x-1/2"
          style={{
            backgroundColor: "var(--indaco)",
            transform: `scaleY(${lineVisible ? 1 : 0})`,
            transformOrigin: "top",
            transition: "transform 1.8s cubic-bezier(0.22, 1, 0.36, 1)",
          }}
        />

        {timelineItems.map((item, index) => {
          const isInvert = index === 1; // Middle item has inverted layout
          return (
            <div
              key={item.title}
              className="relative z-10 flex flex-col items-center gap-3 md:gap-4 mb-8 md:mb-0"
            >
              {/* Text content — above or below dot depending on invert */}
              <div
                className={`flex flex-col items-center gap-1.5 ${
                  isInvert 
                    ? "md:order-2 md:h-[140px] md:justify-start mt-2 md:mt-0" 
                    : "md:order-0 md:h-[140px] md:justify-end mb-2 md:mb-0"
                }`}
              >
                <h3
                  className="text-black text-center"
                  style={{
                    fontFamily:
                      "var(--font-latino-gothic), Latino Gothic WdEx, sans-serif",
                    fontWeight: 800,
                    fontSize: "var(--font-heading-lg)",
                    transform: textsVisible[index]
                      ? "translateY(0)"
                      : "translateY(30px)",
                    opacity: textsVisible[index] ? 1 : 0,
                    clipPath: textsVisible[index]
                      ? "polygon(0 0, 100% 0, 100% 100%, 0 100%)"
                      : "polygon(0 0, 0 0, 0 100%, 0 100%)",
                    transition:
                      "transform 1s cubic-bezier(0.22, 1, 0.36, 1), opacity 0.6s ease, clip-path 1s cubic-bezier(0.22, 1, 0.36, 1)",
                  }}
                >
                  {item.title}
                </h3>
                <p
                  className="text-black text-center max-w-[260px]"
                  style={{
                    fontFamily:
                      "var(--font-latino-gothic), Latino Gothic, sans-serif",
                    fontWeight: 500,
                    fontSize: "var(--font-body-lg)",
                    lineHeight: 1.3,
                    transform: textsVisible[index]
                      ? "translateY(0)"
                      : "translateY(20px)",
                    opacity: textsVisible[index] ? 1 : 0,
                    clipPath: textsVisible[index]
                      ? "polygon(0 0, 100% 0, 100% 100%, 0 100%)"
                      : "polygon(0 0, 0 0, 0 100%, 0 100%)",
                    transition:
                      "transform 1s cubic-bezier(0.22, 1, 0.36, 1) 0.1s, opacity 0.6s ease 0.1s, clip-path 1s cubic-bezier(0.22, 1, 0.36, 1) 0.1s",
                  }}
                >
                  {item.description}
                </p>
              </div>

              {/* Dot */}
              <div
                className="order-1 rounded-full border-[8px] border-black"
                style={{
                  width: "52px",
                  height: "52px",
                  backgroundColor: "var(--lime)",
                  transform: dotsVisible[index] ? "scale(1)" : "scale(0)",
                  transition:
                    "transform 0.8s cubic-bezier(0.22, 1, 0.36, 1)",
                }}
              />
            </div>
          );
        })}
      </div>

      {/* Shape — Matter.js via portal (zIndex); opaco, por cima do conteúdo da secção */}
      {isActive ? (
        <FloatingShapeMatter
          src="/images/shapes/3.png"
          alt="3D Shape"
          width={260}
          height={260}
          className="drop-shadow-xl"
        />
      ) : null}
    </div>
  );
}
