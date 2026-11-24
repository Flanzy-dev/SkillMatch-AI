import { useTranslations } from "next-intl";
import { Logo } from "@/components/brand/Logo";

export function Footer() {
  const t = useTranslations("Footer");
  const c = useTranslations("Common");
  return (
    <footer className="border-t border-border bg-surface">
      <div className="mx-auto flex max-w-6xl flex-col gap-3 px-4 py-6 sm:flex-row sm:items-center sm:justify-between sm:px-6">
        <div className="flex flex-col gap-1">
          <Logo markClassName="size-6" />
          <p className="text-sm text-text">{c("tagline")}</p>
        </div>
        <p className="text-sm text-muted sm:max-w-sm sm:text-right">{t("note")}</p>
      </div>
    </footer>
  );
}
