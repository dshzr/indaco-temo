"use client";

import Image from "next/image";
import Link from "next/link";
import { X } from "lucide-react";
import { Header } from "@/components/Header";
import { DetailHeroHeading } from "@/components/DetailHeroHeading";
import { RichTextBold } from "@/components/RichTextBold";
import {
  getRelatedProjects,
  type PortfolioProject,
} from "@/lib/portfolio-projects";

interface ProjectDetailViewProps {
  project: PortfolioProject;
}

export function ProjectDetailView({ project }: ProjectDetailViewProps) {
  const related = getRelatedProjects(project.slug);
  const nextSlug = related[0]?.slug ?? "pollini";

  return (
    <main className="min-h-dvh bg-black text-white">
      <Header activePage="portfolio" footerSurface="light" />

      <Link
        href="/portfolio"
        className="fixed right-4 top-20 z-[60] flex h-11 w-11 items-center justify-center rounded-full border border-white/35 bg-black/40 text-white backdrop-blur-sm transition-colors hover:bg-white/10 md:right-8 md:top-24"
        aria-label="Fechar e voltar ao portfólio"
      >
        <X className="h-5 w-5" strokeWidth={1.75} />
      </Link>

      {/* Hero vídeo + título (efeito igual à index) */}
      <section className="relative min-h-[min(92vh,920px)] w-full overflow-hidden bg-black pb-6 md:min-h-[88vh]">
        <div className="absolute inset-0 top-14 md:top-16">
          <video
            className="h-full w-full object-cover"
            src={project.videoSrc}
            poster={project.posterSrc}
            controls
            playsInline
            preload="metadata"
          />
          <div
            className="pointer-events-none absolute inset-0 bg-gradient-to-t from-black via-black/55 to-transparent"
            aria-hidden
          />
        </div>

        <div className="relative z-10 mx-auto flex min-h-[min(92vh,920px)] max-w-[1200px] flex-col justify-end px-4 pb-28 pt-32 md:min-h-[88vh] md:px-10 md:pb-36">
          <p
            className="mb-3 text-[10px] font-[800] uppercase tracking-[0.35em] text-white/80 md:text-[11px]"
            style={{
              fontFamily:
                "var(--font-latino-gothic), Latino Gothic WdEx, sans-serif",
            }}
          >
            {project.brandLockup}
          </p>
          <DetailHeroHeading
            line1={project.detailTitleLine1}
            highlight={project.detailHighlight}
          />
          <p
            className="mt-6 max-w-xl text-[11px] font-[600] uppercase tracking-[0.22em] text-white/90 md:text-xs"
            style={{
              fontFamily: "var(--font-space-grotesk), sans-serif",
            }}
          >
            {project.tagsLine}
          </p>
        </div>
      </section>

      {/* Intro + serviços */}
      <section className="bg-white px-4 py-16 text-black md:px-12 md:py-24">
        <div className="mx-auto grid max-w-6xl gap-12 md:grid-cols-2 md:gap-16">
          <RichTextBold
            text={project.introMarkdown}
            className="text-[clamp(15px,1.4vw,20px)] font-[600] leading-snug tracking-tight"
            style={{
              fontFamily: "var(--font-space-grotesk), sans-serif",
            }}
          />
          <ul
            className="divide-y divide-neutral-200 text-[11px] font-[600] uppercase tracking-[0.16em] md:text-xs"
            style={{
              fontFamily: "var(--font-space-grotesk), sans-serif",
            }}
          >
            {project.services.map((s) => (
              <li key={s} className="py-4 text-neutral-800">
                {s}
              </li>
            ))}
          </ul>
        </div>
      </section>

      {/* Impact */}
      <section className="bg-white px-4 pb-20 text-black md:px-12 md:pb-28">
        <div className="mx-auto max-w-6xl">
          <h2
            className="mb-8 text-[clamp(28px,4vw,48px)] font-[800] leading-none tracking-tight"
            style={{
              fontFamily:
                "var(--font-latino-gothic), Latino Gothic WdEx, sans-serif",
            }}
          >
            {project.impactTitle}
          </h2>
          <RichTextBold
            text={project.impactMarkdown}
            className="max-w-3xl text-[clamp(14px,1.2vw,18px)] font-[500] leading-relaxed text-neutral-800"
            style={{
              fontFamily: "var(--font-space-grotesk), sans-serif",
            }}
          />
          <div className="relative mt-12 aspect-video w-full overflow-hidden rounded-lg bg-neutral-200 md:rounded-xl">
            <Image
              src={project.coverSrc}
              alt=""
              fill
              className="object-cover"
              sizes="(max-width: 768px) 100vw, min(1200px, 90vw)"
              priority={false}
            />
          </div>
        </div>
      </section>

      {/* Related */}
      <section className="bg-black px-4 py-16 text-white md:px-12 md:py-24">
        <div className="mx-auto max-w-6xl">
          <h2
            className="mb-10 text-[clamp(36px,7vw,96px)] font-[800] leading-none tracking-tight"
            style={{
              fontFamily:
                "var(--font-latino-gothic), Latino Gothic WdEx, sans-serif",
            }}
          >
            Related
          </h2>
          <div className="grid gap-4 md:grid-cols-3 md:gap-6">
            {related.map((p) => (
              <Link
                key={p.slug}
                href={`/portfolio/${p.slug}`}
                className="group relative aspect-video overflow-hidden rounded-lg md:rounded-xl"
              >
                <Image
                  src={p.coverSrc}
                  alt=""
                  fill
                  className="object-cover transition-transform duration-500 group-hover:scale-[1.03]"
                  sizes="(max-width: 768px) 100vw, 33vw"
                />
              </Link>
            ))}
          </div>
          <div
            className="mt-12 flex flex-wrap items-center justify-between gap-6 text-lg font-[800] uppercase tracking-wide md:text-2xl"
            style={{
              fontFamily:
                "var(--font-latino-gothic), Latino Gothic WdEx, sans-serif",
            }}
          >
            <Link href="/portfolio" className="hover:text-[var(--lime)]">
              ← portfolio
            </Link>
            <Link
              href={`/portfolio/${nextSlug}`}
              className="hover:text-[var(--lime)]"
            >
              next →
            </Link>
          </div>
        </div>
      </section>
    </main>
  );
}
