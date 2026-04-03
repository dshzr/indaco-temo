"use client";

import { useEffect, useRef, useState } from "react";
import Image from "next/image";
import { FloatingShapeMatter } from "@/components/FloatingShapeMatter";

interface PortfolioItem {
  title: string;
  tags: string;
  coverSrc: string;
  logoSrc: string;
  href: string;
}

const portfolioItems: PortfolioItem[] = [
  {
    title: "The power of year-round digital advertising",
    tags: "DIGITAL + CAMPAIGN + CONTENT",
    coverSrc: "/images/portfolio/pollini-cover.webp",
    logoSrc: "/images/portfolio/pollini-logo.png",
    href: "/portfolio/pollini",
  },
  {
    title: "Entra in modalità Dorelan",
    tags: "CREATIVE + PRODUCTION + VIDEO",
    coverSrc: "/images/portfolio/dorelan-cover.webp",
    logoSrc: "/images/portfolio/dorelan-logo.png",
    href: "/portfolio/dorelan",
  },
  {
    title: "Sono i sognatori a muovere il mondo",
    tags: "CONCEPT + DIRECTION + PRODUCTION",
    coverSrc: "/images/portfolio/pagani-cover.webp",
    logoSrc: "/images/portfolio/pagani-logo.png",
    href: "/portfolio/pagani",
  },
  {
    title: "Redbull 64 Bars Live",
    tags: "LIVE + PRODUCTION + DIRECTION",
    coverSrc: "/images/portfolio/redbull-cover.webp",
    logoSrc: "/images/portfolio/redbull-logo.png",
    href: "/portfolio/redbull",
  },
  {
    title: "Ritratto di famiglia",
    tags: "DIRECTION + FILMING + SET DESIGN",
    coverSrc: "/images/portfolio/adidas-cover.webp",
    logoSrc: "/images/portfolio/adidas-logo.png",
    href: "/portfolio/adidas",
  },
];

interface WorkSectionProps {
  isActive: boolean;
  /** Pré-monta imagens já na secção Method (índice 3) para transição mais suave. */
  prefetchPortfolioAssets?: boolean;
}

export function WorkSection({
  isActive,
  prefetchPortfolioAssets = false,
}: WorkSectionProps) {
  const [titleVisible, setTitleVisible] = useState(false);
  const [cardsVisible, setCardsVisible] = useState(false);
  const [hoveredCard, setHoveredCard] = useState<number | null>(null);
  /** Sticky sem setState em efeito: liberta imagens só quando a Method+ está “desbloqueada” ou Work ativa. */
  const portfolioAssetsMountedRef = useRef(false);
  if (isActive || prefetchPortfolioAssets) portfolioAssetsMountedRef.current = true;
  const portfolioAssetsMounted = portfolioAssetsMountedRef.current;

  useEffect(() => {
    if (isActive) {
      setTimeout(() => setTitleVisible(true), 100);
      setTimeout(() => setCardsVisible(true), 500);
    } else {
      setTitleVisible(false);
      setCardsVisible(false);
      setHoveredCard(null);
    }
  }, [isActive]);

  const rotations = [-12, 8, -6, 14, -10];

  return (
    <div className="relative w-full h-full flex flex-col items-center justify-center px-4 md:px-8">
      {/* Title */}
      <div className="relative z-10 text-center max-w-[900px] mb-8 md:mb-16">
        <h2
          className="text-black"
          style={{
            fontFamily:
              "var(--font-latino-gothic), Latino Gothic WdEx, sans-serif",
            fontWeight: 800,
            fontSize: "var(--font-text-animated)",
            lineHeight: 1.05,
            transform: titleVisible ? "translateY(0)" : "translateY(80px)",
            opacity: titleVisible ? 1 : 0,
            clipPath: titleVisible
              ? "polygon(0 0, 100% 0, 100% 100%, 0 100%)"
              : "polygon(0 100%, 100% 100%, 100% 100%, 0 100%)",
            transition:
              "transform 1s cubic-bezier(0.22, 1, 0.36, 1), opacity 0.7s ease, clip-path 0.8s cubic-bezier(0.22, 1, 0.36, 1)",
          }}
        >
          We let the work
          <br />
          do the talking.
        </h2>
      </div>

      {/* Cards Grid — tilted perspective carousel */}
      <div className="relative z-10 flex items-center justify-center gap-0 w-full max-w-[1400px] overflow-visible">
        {portfolioAssetsMounted &&
          portfolioItems.map((item, index) => {
          const isHovered = hoveredCard === index;
          const baseRotation = rotations[index % rotations.length];

          return (
            <a
              key={item.title}
              href={item.href}
              className="relative block flex-shrink-0 overflow-hidden group"
              style={{
                width: "clamp(120px, 20vw, 240px)",
                aspectRatio: "16/9",
                borderRadius: "20px",
                marginLeft: index === 0 ? 0 : "clamp(-40px, -8vw, -2%)",
                transform: cardsVisible
                  ? `rotate(${isHovered ? 0 : baseRotation}deg) scale(${isHovered ? 1.15 : 0.75}) translateY(${isHovered ? "-8%" : "0"})`
                  : "translateY(120vh) rotate(-30deg)",
                opacity: cardsVisible ? 1 : 0,
                transition: `transform 0.7s cubic-bezier(0.22, 1, 0.36, 1), opacity 0.6s ease`,
                transitionDelay: cardsVisible ? `${index * 0.1}s` : "0s",
                zIndex: isHovered ? 20 : 10 - index,
              }}
              onMouseEnter={() => setHoveredCard(index)}
              onMouseLeave={() => setHoveredCard(null)}
            >
              <Image
                src={item.coverSrc}
                alt={item.title}
                fill
                className="object-cover"
                sizes="(max-width: 768px) 50vw, 20vw"
              />

              {/* Hover overlay */}
              <div
                className="absolute inset-0 flex flex-col items-center justify-between p-3 md:p-5"
                style={{
                  backgroundColor: "var(--indaco)",
                  opacity: isHovered ? 1 : 0,
                  transition: "opacity 0.4s ease-out",
                }}
              >
                <div className="relative w-[50%] h-[25%]">
                  <Image
                    src={item.logoSrc}
                    alt={`${item.title} logo`}
                    fill
                    className="object-contain brightness-0 invert"
                    sizes="120px"
                  />
                </div>
                <div className="text-center">
                  <p
                    className="text-white text-[10px] md:text-[13px] leading-tight mb-1"
                    style={{
                      fontFamily:
                        "var(--font-latino-gothic), Latino Gothic, sans-serif",
                      fontWeight: 400,
                    }}
                  >
                    {item.title}
                  </p>
                  <span
                    className="text-white/60 text-[7px] md:text-[9px]"
                    style={{
                      fontFamily:
                        "var(--font-latino-gothic), Latino Gothic, sans-serif",
                    }}
                  >
                    {item.tags}
                  </span>
                </div>
              </div>
            </a>
          );
        })}

        {/* CTA card */}
        {portfolioAssetsMounted ? (
        <a
          href="/portfolio"
          className="relative flex-shrink-0 flex items-center justify-center overflow-hidden"
          style={{
            width: "clamp(120px, 20vw, 240px)",
            aspectRatio: "16/9",
            borderRadius: "20px",
            backgroundColor: "var(--indaco)",
            marginLeft: "clamp(-40px, -8vw, -2%)",
            transform: cardsVisible
              ? `rotate(${hoveredCard === portfolioItems.length ? 0 : -12}deg) scale(${hoveredCard === portfolioItems.length ? 1.15 : 0.75})`
              : "translateY(120vh) rotate(-30deg)",
            opacity: cardsVisible ? 1 : 0,
            transition:
              "transform 0.7s cubic-bezier(0.22, 1, 0.36, 1), opacity 0.6s ease",
            transitionDelay: cardsVisible
              ? `${portfolioItems.length * 0.1}s`
              : "0s",
            zIndex: hoveredCard === portfolioItems.length ? 20 : 4,
          }}
          onMouseEnter={() => setHoveredCard(portfolioItems.length)}
          onMouseLeave={() => setHoveredCard(null)}
        >
          <span
            className="text-white text-center px-3"
            style={{
              fontFamily:
                "var(--font-latino-gothic), Latino Gothic WdEx, sans-serif",
              fontWeight: 800,
              fontSize: "clamp(14px, 1.8vw, 28px)",
            }}
          >
            See for yourself &gt;
          </span>
        </a>
        ) : null}
      </div>

      {isActive ? (
        <FloatingShapeMatter
          geometry="rectangle"
          alt="Forma rectangular"
          width={170}
          height={170}
          className="drop-shadow-lg"
        />
      ) : null}
    </div>
  );
}
