"use client";

import Link from "next/link";
import { useLocale, usePathname, useTranslations } from "next-intl";
import { useState, useEffect, useRef } from "react";
import { Menu, X, Globe } from "lucide-react";
import { cn } from "@/lib/utils";

const LOCALES = [
  { code: "en", label: "English" },
  { code: "zh", label: "中文" },
];

export function Header() {
  const t = useTranslations("nav");
  const common = useTranslations("common");
  const locale = useLocale();
  const pathname = usePathname();
  const [mobileOpen, setMobileOpen] = useState(false);
  const [langOpen, setLangOpen] = useState(false);
  const langRef = useRef<HTMLDivElement>(null);

  // Click outside to close language dropdown
  useEffect(() => {
    if (!langOpen) return;
    function handleClick(e: MouseEvent) {
      if (langRef.current && !langRef.current.contains(e.target as Node)) {
        setLangOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, [langOpen]);

  /** 切换语言时保留当前路径：替换 locale 前缀 */
  function getLocaleHref(targetLocale: string): string {
    const segments = pathname.split("/");
    segments[1] = targetLocale;
    return segments.join("/") || `/${targetLocale}`;
  }

  const navLinks = [
    { href: `/${locale}`, label: t("home") },
    { href: `/${locale}/products`, label: t("products") },
    { href: `/${locale}/about`, label: t("about") },
    { href: `/${locale}/contact`, label: t("contact") },
  ];

  return (
    <header className="sticky top-0 z-50 border-b bg-white/95 backdrop-blur-sm">
      <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4">
        {/* Logo */}
        <Link href={`/${locale}`} className="text-xl font-bold text-[var(--color-primary)]">
          {common("siteName")}
        </Link>

        {/* Desktop Nav */}
        <nav className="hidden items-center gap-6 md:flex">
          {navLinks.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className="text-sm font-medium text-[var(--color-muted)] transition-colors hover:text-[var(--color-primary)]"
            >
              {link.label}
            </Link>
          ))}
        </nav>

        {/* Language Switcher + Mobile Toggle */}
        <div className="flex items-center gap-2">
          {/* Language Switcher */}
          <div className="relative" ref={langRef}>
            <button
              onClick={() => setLangOpen(!langOpen)}
              className="flex items-center gap-1 rounded-md px-2 py-1 text-sm text-[var(--color-muted)] hover:text-[var(--color-primary)]"
            >
              <Globe className="h-4 w-4" />
              <span className="uppercase">{locale}</span>
            </button>
            {langOpen && (
              <div className="absolute right-0 top-full mt-1 w-36 rounded-md border bg-white py-1 shadow-lg">
                {LOCALES.map((l) => (
                  <Link
                    key={l.code}
                    href={getLocaleHref(l.code)}
                    onClick={() => setLangOpen(false)}
                    className={cn(
                      "block px-3 py-2 text-sm hover:bg-[var(--color-accent)]",
                      l.code === locale && "font-medium text-[var(--color-primary)]"
                    )}
                  >
                    {l.label}
                  </Link>
                ))}
              </div>
            )}
          </div>

          {/* Mobile Menu Toggle */}
          <button
            onClick={() => setMobileOpen(!mobileOpen)}
            className="md:hidden rounded-md p-2 text-[var(--color-muted)]"
          >
            {mobileOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
          </button>
        </div>
      </div>

      {/* Mobile Nav */}
      {mobileOpen && (
        <nav className="border-t md:hidden">
          {navLinks.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              onClick={() => setMobileOpen(false)}
              className="block px-4 py-3 text-sm font-medium text-[var(--color-muted)] hover:bg-[var(--color-accent)]"
            >
              {link.label}
            </Link>
          ))}
        </nav>
      )}
    </header>
  );
}
