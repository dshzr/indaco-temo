import type { Metadata } from "next";
import { notFound } from "next/navigation";
import {
  getProjectBySlug,
  portfolioProjectSlugs,
} from "@/lib/portfolio-projects";
import { ProjectDetailView } from "@/components/ProjectDetailView";

type Props = { params: Promise<{ slug: string }> };

export function generateStaticParams() {
  return portfolioProjectSlugs.map((slug) => ({ slug }));
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const p = getProjectBySlug(slug);
  if (!p) return { title: "Project — Indaco" };
  return {
    title: `${p.detailHighlight} — ${p.brandLockup} | Indaco`,
    description: p.introMarkdown.replaceAll("**", "").slice(0, 155),
  };
}

export default async function PortfolioProjectPage({ params }: Props) {
  const { slug } = await params;
  const project = getProjectBySlug(slug);
  if (!project) notFound();
  return <ProjectDetailView project={project} />;
}
