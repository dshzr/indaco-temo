"use client";

import { motion } from "framer-motion";
import {
  InstagramIcon,
  LinkedInIcon,
  FacebookIcon,
  VimeoIcon,
  ArrowRightIcon,
} from "@/components/icons";

const navLinks = [
  { label: "HOME", href: "/", key: "home" },
  { label: "PORTFOLIO", href: "/portfolio", key: "portfolio" },
  { label: "ABOUT", href: "/about", key: "about" },
];

const socialLinks = [
  { icon: InstagramIcon, href: "https://www.instagram.com/indaco_agency/", label: "Instagram" },
  { icon: LinkedInIcon, href: "https://www.linkedin.com/company/indaco-srl/", label: "LinkedIn" },
  { icon: FacebookIcon, href: "https://www.facebook.com/indacoagency", label: "Facebook" },
  { icon: VimeoIcon, href: "https://vimeo.com/indaco", label: "Vimeo" },
];

interface HeaderProps {
  activePage?: "home" | "portfolio" | "about";
}

export function Header({ activePage = "home" }: HeaderProps) {
  return (
    <>
      {/* Top Logo */}
      <header className="fixed top-0 left-0 right-0 z-50 flex items-center justify-center py-4 md:py-6">
        <motion.a 
          href="/" 
          initial={{ opacity: 0, y: -20, filter: "blur(4px)" }}
          animate={{ opacity: 1, y: 0, filter: "blur(0px)" }}
          transition={{ duration: 1.2, ease: [0.16, 1, 0.3, 1] }}
          className="text-white tracking-[0.3em] md:tracking-[0.5em] font-[800] text-[14px] md:text-[16px] uppercase"
          style={{ fontFamily: "var(--font-latino-gothic), Latino Gothic WdEx, sans-serif" }}
        >
          I N D Λ C O
        </motion.a>
      </header>

      {/* Bottom Navigation Bar */}
      <nav className="fixed bottom-0 left-0 right-0 z-50 flex items-center justify-between px-3 md:px-8 py-3 md:py-5"
        style={{ fontFamily: "var(--font-latino-gothic), Latino Gothic WdEx, sans-serif" }}>
        
        {/* Social Links - Left */}
        <div className="hidden md:flex items-center gap-4 flex-1">
          {socialLinks.map((social) => (
            <a
              key={social.label}
              href={social.href}
              target="_blank"
              rel="noopener noreferrer"
              aria-label={social.label}
              className="text-black hover:text-[var(--indaco)] transition-colors duration-300"
            >
              <social.icon className="w-6 h-6" />
            </a>
          ))}
        </div>
        
        {/* Mobile Left Spacer */}
        <div className="flex-1 md:hidden" />

        {/* Nav Links - Center */}
        <div className="flex items-center justify-center gap-0 overflow-x-auto no-scrollbar">
          {navLinks.map((link) => (
            <a
              key={link.label}
              href={link.href}
              className={`
                px-2 sm:px-3 md:px-8 py-1.5 md:py-2 text-[9px] sm:text-[11px] md:text-[14px] font-[800] uppercase tracking-wider transition-all duration-300 whitespace-nowrap
                ${link.key === activePage
                  ? "bg-[var(--lime)] text-black rounded-full"
                  : activePage === "portfolio"
                    ? "text-white hover:text-[var(--lime)]"
                    : "text-black hover:text-[var(--indaco)]"
                }
              `}
            >
              {link.label}
            </a>
          ))}
        </div>

        {/* CTA Button - Right */}
        <div className="flex justify-end flex-1">
          <a
            href="/contact"
            className="flex items-center gap-1 md:gap-2 bg-black text-white px-3 md:px-6 py-1.5 md:py-3 rounded-full text-[9px] sm:text-[11px] md:text-[14px] font-[800] uppercase tracking-wider hover:scale-105 transition-transform duration-300 whitespace-nowrap"
          >
            <span className="hidden sm:inline">Say hi!</span>
            <span className="sm:hidden">Hi</span>
            <ArrowRightIcon className="w-3 h-3 md:w-4 md:h-4" />
          </a>
        </div>
      </nav>
    </>
  );
}
