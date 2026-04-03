import type { Metadata } from "next";
import { Header } from "@/components/Header";
import { PortfolioCanvas } from "@/components/PortfolioCanvas";

export const metadata: Metadata = {
  title: "Indaco - Portfolio",
  description:
    "Indaco Portfolio — Video Production, Live Streaming, Media Strategy",
};

export default function PortfolioPage() {
  return (
    <main className="relative w-full h-dvh overflow-hidden bg-[#ebebeb]">
      {/* Container fluído com a inclinação 3D pra dentro */}
      <div 
        className="absolute inset-0 overflow-hidden"
        style={{ transform: "perspective(1800px) rotateX(4deg) scale(1.02)" }}
      >
        {/* WebGL fisheye canvas (background layer) */}
        <PortfolioCanvas />
      </div>

      {/* UI overlay */}
      <Header activePage="portfolio" />
    </main>
  );
}
