import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  output: "standalone",
  /** Menos JS legado no cliente: SWC usa o `browserslist` do package.json. */
  experimental: {
    optimizePackageImports: ["lucide-react", "motion"],
    /**
     * Inline do CSS global no HTML em produção (App Router) — elimina o segundo
     * salto da cadeia crítica documento → stylesheet e reduz atraso até LCP.
     */
    inlineCss: true,
  },
};

export default nextConfig;
