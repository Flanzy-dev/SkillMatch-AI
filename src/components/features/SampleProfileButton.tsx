"use client";

import { useTranslations } from "next-intl";
import { useRouter } from "@/i18n/routing";
import { useMatchFlow } from "@/hooks/useMatchFlow";
import { sampleProfiles } from "@/lib/mock-data/jobs";
import { buttonClass } from "@/components/ui/Button";

/** Skips the upload with a built-in profile so people can try the product without a PDF. */
export function SampleProfileButton() {
  const t = useTranslations("Landing");
  const router = useRouter();
  const { setProfile, setResults } = useMatchFlow();

  return (
    <button
      type="button"
      className={buttonClass("secondary")}
      onClick={() => {
        const p = sampleProfiles[0];
        setResults(null);
        setProfile({ ...p, skills: [...p.skills] }, "sample");
        router.push("/review");
      }}
    >
      {t("ctaSample")}
    </button>
  );
}
