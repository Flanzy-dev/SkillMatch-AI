"use client";

import { useTranslations } from "next-intl";
import { usePathname, useRouter, routing } from "@/i18n/routing";

export function LocaleSwitcher({ current }: { current: string }) {
  const t = useTranslations("Common");
  const router = useRouter();
  const pathname = usePathname();

  return (
    <div role="group" aria-label={t("language")} className="flex items-center">
      {routing.locales.map((l) => (
        <button
          key={l}
          type="button"
          lang={l}
          aria-pressed={l === current}
          onClick={() => router.replace(pathname, { locale: l })}
          className={`inline-flex min-h-11 min-w-11 items-center justify-center rounded-md px-2 text-sm font-medium uppercase ${
            l === current ? "text-brand-text" : "text-muted hover:text-text"
          }`}
        >
          {l}
        </button>
      ))}
    </div>
  );
}
