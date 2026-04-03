import type { Metadata } from "next";
import localFont from "next/font/local";
import { Space_Grotesk } from "next/font/google";
import { ClickSound } from "@/components/ClickSound";
import "./globals.css";

const latinoGothic = localFont({
  src: [
    {
      path: "../../public/fonts/LatinoGothic-ExpRegular.woff2",
      weight: "400",
      style: "normal",
    },
    {
      path: "../../public/fonts/LatinoGothic-Medium.woff2",
      weight: "500",
      style: "normal",
    },
    {
      path: "../../public/fonts/LatinoGothic-ExpSemiBold.woff2",
      weight: "600",
      style: "normal",
    },
    {
      path: "../../public/fonts/LatinoGothic-WdExBold.woff2",
      weight: "800",
      style: "normal",
    },
  ],
  variable: "--font-latino-gothic",
  display: "swap",
});

const spaceGrotesk = Space_Grotesk({
  subsets: ["latin"],
  variable: "--font-space-grotesk",
  display: "swap",
});

export const metadata: Metadata = {
  title: "Indaco - Homepage",
  description: "Indaco - Video Production, Live Streaming, Media Strategy",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      className={`${latinoGothic.variable} ${spaceGrotesk.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col">
        <ClickSound />
        {children}
      </body>
    </html>
  );
}
