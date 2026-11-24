import { use } from "react";
import { useTranslations } from "next-intl";
import { setRequestLocale } from "next-intl/server";
import { FileUp, Flag, ListChecks, Lock } from "lucide-react";
import { Link } from "@/i18n/routing";
import { buttonClass } from "@/components/ui/Button";
import { JobCard } from "@/components/ui/JobCard";
import { SampleProfileButton } from "@/components/features/SampleProfileButton";
import { jobs, sampleProfiles } from "@/lib/mock-data/jobs";
import { scoreJob } from "@/lib/scoring";

/**
 * The preview is the real thing: the first built-in sample profile scored against the first
 * listing by the same function the results use, so the landing never promises more than the
 * product delivers.
 */
const sampleProfile = { ...sampleProfiles[0], skills: [...sampleProfiles[0].skills] };
const sampleJob = jobs.find((j) => j.id === "job-01")!;
const sample = scoreJob(sampleProfile, sampleJob);

const route = [
  { key: "step1", icon: FileUp },
  { key: "step2", icon: ListChecks },
  { key: "step3", icon: Flag },
] as const;

export default function LandingPage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = use(params);
  setRequestLocale(locale);
  const t = useTranslations("Landing");
  const preview = { ...sample, company: t("sampleCompany") };

  return (
    <div className="grid gap-12 py-4 lg:grid-cols-[1.1fr_1fr] lg:gap-x-16 lg:gap-y-14 lg:py-12">
      <section className="lg:col-start-1 lg:row-start-1 lg:self-center">
        <h1 className="font-display text-4xl font-extrabold leading-[1.2] tracking-[-0.02em] sm:text-5xl">
          {t.rich("title", {
            mark: (chunks) => (
              <mark className="rounded-sm bg-accent px-1.5 text-on-accent [box-decoration-break:clone]">
                {chunks}
              </mark>
            ),
          })}
        </h1>
        <p className="mt-5 max-w-xl text-lg text-muted">{t("subtitle")}</p>

        <div className="mt-8 flex flex-col gap-3 sm:flex-row sm:flex-wrap">
          <Link href="/upload" className={buttonClass("primary")}>
            {t("ctaPrimary")}
          </Link>
          <SampleProfileButton />
          <Link href="/review" className={buttonClass("ghost")}>
            {t("ctaManual")}
          </Link>
        </div>
        <p className="mt-4 flex items-center gap-1.5 text-sm text-muted">
          <Lock aria-hidden className="size-4 shrink-0" />
          {t("privacy")}
        </p>
      </section>

      <section
        aria-label={t("previewLabel")}
        className="lg:col-start-2 lg:row-start-1 lg:self-center"
      >
        <ul>
          <JobCard result={preview} preview />
        </ul>
        <p className="mt-3 text-sm text-muted">{t("previewLabel")}</p>
      </section>

      {/*
        The route as page structure: three stops along a dashed road, ending at the amber
        destination. Vertical on phones, horizontal from lg up. Same grammar as the score meter.
      */}
      <ol aria-label={t("stepsLabel")} className="lg:col-span-2 lg:row-start-2 lg:grid lg:grid-cols-3 lg:gap-8">
        {route.map(({ key, icon: Icon }, i) => {
          const last = i === route.length - 1;
          return (
            <li key={key} className="relative pb-10 pl-16 last:pb-0 lg:pb-0 lg:pl-0 lg:pt-16">
              <span
                aria-hidden
                className={`absolute left-0 top-0 flex size-11 items-center justify-center rounded-full ring-4 ring-canvas ${
                  last ? "bg-accent text-on-accent" : "bg-brand text-white"
                }`}
              >
                <Icon className="size-5" />
              </span>
              {!last && (
                <>
                  {/* phone: road running down to the next stop */}
                  <span
                    aria-hidden
                    className="absolute bottom-1 left-[1.35rem] top-12 border-l-2 border-dashed border-border-strong lg:hidden"
                  />
                  {/* desktop: road running across to the next stop */}
                  <span
                    aria-hidden
                    className="absolute left-14 right-4 top-[1.35rem] hidden border-t-2 border-dashed border-border-strong lg:block"
                  />
                </>
              )}
              <h2 className="font-display text-lg font-bold tracking-tight">{t(key)}</h2>
              <p className="mt-1 max-w-xs text-sm text-muted">{t(`${key}Desc`)}</p>
            </li>
          );
        })}
      </ol>
    </div>
  );
}
