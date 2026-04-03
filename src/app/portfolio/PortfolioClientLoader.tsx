"use client";

import dynamic from "next/dynamic";

const PortfolioExperience = dynamic(
  () =>
    import("@/components/PortfolioExperience").then((m) => ({
      default: m.PortfolioExperience,
    })),
  {
    ssr: false,
    loading: () => (
      <main
        className="relative flex h-dvh w-full items-center justify-center overflow-hidden bg-[#ebebeb]"
        aria-busy="true"
      >
        <span className="sr-only">A carregar o portfólio…</span>
        <div
          className="size-10 animate-spin rounded-full border-2 border-solid border-[#7b86f8] border-t-transparent motion-reduce:animate-none"
          aria-hidden
        />
      </main>
    ),
  },
);

export function PortfolioClientLoader() {
  return <PortfolioExperience />;
}
