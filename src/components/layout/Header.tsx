"use client";

import { useState } from "react";
import { useLocale, useTranslations } from "next-intl";
import { Menu, X } from "lucide-react";
import { Link, usePathname } from "@/i18n/routing";
import { useMatchFlow } from "@/hooks/useMatchFlow";
import { LocaleSwitcher } from "./LocaleSwitcher";
import { ThemeToggle } from "./ThemeToggle";
import { Logo } from "@/components/brand/Logo";

const allLinks = [
  { href: "/", key: "home" },
  { href: "/upload", key: "upload" },
  { href: "/results", key: "results" },
] as const;

export function Header() {
  const t = useTranslations("Nav");
  const c = useTranslations("Common");
  const pathname = usePathname();
  const locale = useLocale();
  const [open, setOpen] = useState(false);
  const { results } = useMatchFlow();
  // "Results" only appears once there is something to show.
  const links = allLinks.filter((l) => l.key !== "results" || results);

  const isActive = (href: string) =>
    href === "/" ? pathname === "/" : pathname.startsWith(href);

  return (
    <header className="border-b border-border bg-surface">
      <div className="mx-auto flex max-w-6xl items-center justify-between gap-2 px-4 py-2 sm:gap-4 sm:px-6">
        <Link
          href="/"
          className="inline-flex min-h-11 items-center rounded-md"
        >
          {/* Below 370px the wordmark is sr-only: the link keeps its name and the mark stays 32px. */}
          <Logo wordmarkClassName="text-lg sm:text-xl max-[369px]:sr-only" />
        </Link>

        <nav aria-label={t("primary")} className="hidden items-center gap-1 md:flex">
          {links.map((l) => (
            <Link
              key={l.href}
              href={l.href}
              aria-current={isActive(l.href) ? "page" : undefined}
              className={`inline-flex min-h-11 items-center border-b-2 px-3 text-sm font-medium transition-colors ${
                isActive(l.href)
                  ? "border-brand text-brand-text"
                  : "border-transparent text-muted hover:text-text"
              }`}
            >
              {t(l.key)}
            </Link>
          ))}
        </nav>

        <div className="flex items-center gap-1">
          <LocaleSwitcher current={locale} />
          <ThemeToggle />
          <button
            type="button"
            className="inline-flex size-11 items-center justify-center rounded-md text-text md:hidden"
            aria-expanded={open}
            aria-controls="mobile-nav"
            aria-label={open ? c("closeMenu") : c("menu")}
            onClick={() => setOpen((v) => !v)}
          >
            {open ? <X aria-hidden className="size-5" /> : <Menu aria-hidden className="size-5" />}
          </button>
        </div>
      </div>

      {open && (
        <nav id="mobile-nav" aria-label={t("primary")} className="border-t border-border md:hidden">
          <ul className="mx-auto max-w-6xl px-4 py-2 sm:px-6">
            {links.map((l) => (
              <li key={l.href}>
                <Link
                  href={l.href}
                  onClick={() => setOpen(false)}
                  aria-current={isActive(l.href) ? "page" : undefined}
                  className={`flex min-h-11 items-center text-base ${
                    isActive(l.href) ? "font-semibold text-brand-text" : "text-text"
                  }`}
                >
                  {t(l.key)}
                </Link>
              </li>
            ))}
          </ul>
        </nav>
      )}
    </header>
  );
}
