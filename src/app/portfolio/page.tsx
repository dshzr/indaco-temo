import type { Metadata } from "next";
import { PortfolioClientLoader } from "./PortfolioClientLoader";

export const metadata: Metadata = {
  title: "Indaco - Portfolio",
  description:
    "Indaco Portfolio — Video Production, Live Streaming, Media Strategy",
};

export default function PortfolioPage() {
  return <PortfolioClientLoader />;
}
