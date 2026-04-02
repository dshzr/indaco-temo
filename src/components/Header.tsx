"use client";

import {
  InstagramIcon,
  LinkedInIcon,
  FacebookIcon,
  VimeoIcon,
  ArrowRightIcon,
} from "@/components/icons";

const navLinks = [
  { label: "HOME", href: "/", active: true },
  { label: "PORTFOLIO", href: "/portfolio", active: false },
  { label: "ABOUT", href: "/about", active: false },
];

const socialLinks = [
  { icon: InstagramIcon, href: "https://www.instagram.com/indaco_agency/", label: "Instagram" },
  { icon: LinkedInIcon, href: "https://www.linkedin.com/company/indaco-srl/", label: "LinkedIn" },
  { icon: FacebookIcon, href: "https://www.facebook.com/indacoagency", label: "Facebook" },
  { icon: VimeoIcon, href: "https://vimeo.com/indaco", label: "Vimeo" },
];

export function Header() {
  return (
    <>
      {/* Top Logo */}
      <header className="fixed top-0 left-0 right-0 z-50 flex items-center justify-center py-6">
        <a href="/" className="text-black tracking-[0.5em] font-[800] text-[16px] uppercase"
          style={{ fontFamily: "var(--font-latino-gothic), Latino Gothic WdEx, sans-serif" }}>
          I N D Λ C O
        </a>
      </header>

      {/* Bottom Navigation Bar */}
      <nav className="fixed bottom-0 left-0 right-0 z-50 flex items-center justify-between px-8 py-5"
        style={{ fontFamily: "var(--font-latino-gothic), Latino Gothic WdEx, sans-serif" }}>
        
        {/* Social Links - Left */}
        <div className="flex items-center gap-4">
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

        {/* Nav Links - Center */}
        <div className="flex items-center gap-0">
          {navLinks.map((link) => (
            <a
              key={link.label}
              href={link.href}
              className={`
                px-8 py-2 text-[14px] font-[800] uppercase tracking-wider transition-all duration-300
                ${link.active
                  ? "bg-[var(--lime)] text-black rounded-full"
                  : "text-black hover:text-[var(--indaco)]"
                }
              `}
            >
              {link.label}
            </a>
          ))}
        </div>

        {/* CTA Button - Right */}
        <a
          href="/contact"
          className="flex items-center gap-2 bg-black text-white px-6 py-3 rounded-full text-[14px] font-[800] uppercase tracking-wider hover:scale-105 transition-transform duration-300"
        >
          Say hi!
          <ArrowRightIcon className="w-4 h-4" />
        </a>
      </nav>
    </>
  );
}
