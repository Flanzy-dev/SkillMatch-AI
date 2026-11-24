"use client";

import { useEffect, useState } from "react";
import { useTranslations } from "next-intl";
import { Moon, Sun } from "lucide-react";

type Theme = "light" | "dark";

function readStored(): Theme | null {
  try {
    const v = localStorage.getItem("theme");
    return v === "light" || v === "dark" ? v : null;
  } catch {
    return null;
  }
}

export function ThemeToggle() {
  const t = useTranslations("Common");
  const [theme, setTheme] = useState<Theme | null>(null);

  useEffect(() => {
    const stored = readStored();
    const resolved: Theme =
      stored ?? (matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light");
    document.documentElement.dataset.theme = resolved;
    setTheme(resolved);
  }, []);

  function toggle() {
    const next: Theme = theme === "dark" ? "light" : "dark";
    document.documentElement.dataset.theme = next;
    setTheme(next);
    try {
      localStorage.setItem("theme", next);
    } catch {
      /* storage unavailable: theme applies for this session only */
    }
  }

  return (
    <button
      type="button"
      onClick={toggle}
      aria-label={`${t("theme")}: ${theme === "dark" ? t("themeDark") : t("themeLight")}`}
      className="inline-flex size-11 items-center justify-center rounded-md text-text"
    >
      {theme === "dark" ? <Moon aria-hidden className="size-5" /> : <Sun aria-hidden className="size-5" />}
    </button>
  );
}
