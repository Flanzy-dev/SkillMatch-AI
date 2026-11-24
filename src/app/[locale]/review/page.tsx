"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useTranslations } from "next-intl";
import { AlertCircle, ChevronDown, Info, Plus } from "lucide-react";
import { z } from "zod";
import { useRouter } from "@/i18n/routing";
import { api, DEMO_EXTRACTION } from "@/lib/api/mock";
import { closestSkill, isKnownSkill } from "@/lib/skills";
import { allSkills, popularSkills } from "@/lib/mock-data/jobs";
import { emptyProfile, profileSchema, type Profile } from "@/lib/schemas/profile";
import { useMatchFlow } from "@/hooks/useMatchFlow";
import { Button } from "@/components/ui/Button";
import { Field, inputClass } from "@/components/ui/Field";
import { SkillChip } from "@/components/ui/SkillChip";
import { Stepper } from "@/components/ui/Stepper";

const formSchema = profileSchema.extend({
  skills: z.array(z.string().trim().min(1)).min(1, "skills").max(50),
});

const has = (list: string[], s: string) => list.some((x) => x.toLowerCase() === s.toLowerCase());

export default function ReviewPage() {
  const t = useTranslations("Review");
  const router = useRouter();
  const { profile, source, ready, setProfile, setResults } = useMatchFlow();
  const [newSkill, setNewSkill] = useState("");
  const [removed, setRemoved] = useState<{ skill: string; index: number } | null>(null);
  const [submitError, setSubmitError] = useState(false);
  const [busy, setBusy] = useState(false);
  const skillInput = useRef<HTMLInputElement>(null);

  const form = useForm<Profile>({ resolver: zodResolver(formSchema), defaultValues: emptyProfile });
  const { register, handleSubmit, setValue, watch, reset, formState } = form;
  const skills = watch("skills");

  useEffect(() => {
    if (ready) reset(profile ?? emptyProfile);
  }, [ready, profile, reset]);

  // The undo hint disappears by itself.
  useEffect(() => {
    if (!removed) return;
    const id = setTimeout(() => setRemoved(null), 8000);
    return () => clearTimeout(id);
  }, [removed]);

  // Anything but a real CV upload means the upload step was skipped; copy follows the source.
  const skippedUpload = ready && source !== "cv";
  const sample = ready && source === "sample";
  const manual = skippedUpload && !sample;
  // While extraction is mocked, a "CV" profile is really a sample: say so.
  const demoCv = ready && source === "cv" && DEMO_EXTRACTION;
  const unknown = skills.filter((s) => !isKnownSkill(s));
  const [education, experience, projects] = watch(["education", "experience", "projects"]);
  const hasDetails = Boolean(`${education}${experience}${projects}`.trim());
  const skillOptions = useMemo(() => allSkills().filter((s) => !has(skills, s)), [skills]);
  const suggestions = useMemo(
    () => popularSkills(12).filter((s) => !has(skills, s)).slice(0, 6),
    [skills],
  );

  function setSkills(next: string[]) {
    setValue("skills", next, { shouldValidate: formState.isSubmitted, shouldDirty: true });
  }

  /** Accepts one skill or a pasted list separated by commas, semicolons, or new lines. */
  function addSkills(raw: string) {
    const next = [...skills];
    for (const part of raw.split(/[,;\n]/)) {
      const s = part.trim();
      if (s && !has(next, s) && next.length < 50) next.push(s);
    }
    if (next.length !== skills.length) setSkills(next);
    setNewSkill("");
  }

  function replaceSkill(from: string, to: string) {
    setSkills(has(skills, to) ? skills.filter((x) => x !== from) : skills.map((x) => (x === from ? to : x)));
  }

  function removeSkill(skill: string) {
    setRemoved({ skill, index: skills.indexOf(skill) });
    setSkills(skills.filter((x) => x !== skill));
  }

  function undoRemove() {
    if (!removed) return;
    const next = [...skills];
    next.splice(Math.min(removed.index, next.length), 0, removed.skill);
    setSkills(next);
    setRemoved(null);
  }

  async function onSubmit(values: Profile) {
    setBusy(true);
    setSubmitError(false);
    try {
      const fail = new URLSearchParams(window.location.search).get("fail");
      const results = await api.matchJobs(values, { fail: fail === "match" ? "match" : undefined });
      setProfile(values, source ?? "manual");
      setResults(results);
      router.push("/results");
    } catch {
      setSubmitError(true);
      setBusy(false);
    }
  }

  const err = (key?: string) => (key ? t(`errors.${key}`) : undefined);
  const skillsError = formState.errors.skills
    ? err(formState.errors.skills.message ?? formState.errors.skills.root?.message)
    : undefined;
  const title = skippedUpload || demoCv
    ? t("manualTitle")
    : skills.length
      ? t("foundTitle", { count: skills.length })
      : t("emptyTitle");

  return (
    <div className="mx-auto max-w-3xl">
      <Stepper current={2} skipFirst={skippedUpload} />
      <h1 className="font-display text-3xl font-bold tracking-tight">{t("title")}</h1>
      <p className="mt-2 text-muted">
        {sample
          ? t("subtitleSample")
          : manual
            ? t("subtitleManual")
            : demoCv
              ? t("subtitleDemo")
              : t("subtitle")}
      </p>

      <form
        onSubmit={handleSubmit(onSubmit, (errs) => {
          if (errs.skills) skillInput.current?.focus();
        })}
        noValidate
        className="mt-6 flex flex-col gap-6 pb-24 sm:pb-0"
      >
        <Field
          label={t("name")}
          helper={t("nameHelper")}
          inputProps={{ autoComplete: "name", ...register("name") }}
        />

        <section aria-labelledby="skills-title" className="rounded-xl border border-border bg-surface p-5">
          <h2 id="skills-title" className="font-display text-xl font-bold tracking-tight">
            {title}
          </h2>
          <p className="mt-1 text-sm text-muted">{t("skillsHint")}</p>

          {skills.length > 0 && (
            <ul className="mt-4 flex flex-wrap gap-2">
              {skills.map((s) => (
                <li key={s}>
                  <SkillChip
                    size="lg"
                    unknown={!isKnownSkill(s)}
                    unknownLabel={t("unknownSr")}
                    label={s}
                    removeLabel={t("removeSkill", { skill: s })}
                    onRemove={() => removeSkill(s)}
                  />
                </li>
              ))}
            </ul>
          )}
          {skills.length === 0 && !skillsError && <p className="mt-4 text-sm">{t("noSkills")}</p>}
          {unknown.length > 0 && (
            <div className="mt-3 flex items-start gap-2 text-sm">
              <Info aria-hidden className="mt-0.5 size-4 shrink-0 text-muted" />
              <div>
                <p>
                  {t("unknownNote", { skills: unknown.join(", ") })} {t("unknownScope")}
                </p>
                <ul className="-ml-2 flex flex-wrap gap-x-1">
                  {unknown.map((s) => {
                    const near = closestSkill(s);
                    return near ? (
                      <li key={s}>
                        <button
                          type="button"
                          onClick={() => replaceSkill(s, near)}
                          className="inline-flex min-h-11 items-center rounded-md px-2 font-medium text-brand-text hover:bg-brand-tint"
                        >
                          {t("didYouMean", { skill: s, suggestion: near })}
                        </button>
                      </li>
                    ) : null;
                  })}
                </ul>
              </div>
            </div>
          )}
          <div role="status" aria-live="polite" className="min-h-0">
            {removed && (
              <p className="mt-3 flex flex-wrap items-center gap-2 text-sm">
                {t("removed", { skill: removed.skill })}
                <button
                  type="button"
                  onClick={undoRemove}
                  className="inline-flex min-h-11 items-center rounded-md px-2 font-medium text-brand-text"
                >
                  {t("undo")}
                </button>
              </p>
            )}
          </div>

          <div className="mt-4 flex flex-col gap-1.5">
            <label htmlFor="add-skill" className="text-sm font-medium">
              {t("addSkillLabel")}
            </label>
            <div className="flex gap-2">
              <input
                id="add-skill"
                ref={skillInput}
                value={newSkill}
                onChange={(e) => setNewSkill(e.target.value)}
                onPaste={(e) => {
                  const text = e.clipboardData.getData("text");
                  if (/[,;\n]/.test(text)) {
                    e.preventDefault();
                    addSkills(text);
                  }
                }}
                onKeyDown={(e) => {
                  if (e.key === "Enter") {
                    e.preventDefault();
                    addSkills(newSkill);
                  }
                }}
                aria-describedby="add-skill-help"
                list="skill-options"
                autoComplete="off"
                aria-invalid={skillsError ? true : undefined}
                className={`${inputClass(Boolean(skillsError))} flex-1`}
              />
              <Button variant="secondary" onClick={() => addSkills(newSkill)}>
                {t("addSkill")}
              </Button>
            </div>
            <p id="add-skill-help" className="text-sm text-muted">
              {t("addSkillHelper")}
            </p>
            {/* Offers the canonical names the listings use, so near-misses like "Postgres" are easy to avoid. */}
            <datalist id="skill-options" aria-label={t("skillOptions")}>
              {skillOptions.map((s) => (
                <option key={s} value={s} />
              ))}
            </datalist>
          </div>

          {skillsError && (
            <p role="alert" className="mt-3 flex items-center gap-1.5 text-sm text-danger">
              <AlertCircle aria-hidden className="size-4 shrink-0" />
              {skillsError}
            </p>
          )}

          {suggestions.length > 0 && (
            <div className="mt-5">
              <p className="text-sm font-medium text-muted">{t("suggestions")}</p>
              <ul className="-ml-2 mt-1 flex flex-wrap gap-x-1">
                {suggestions.map((s) => (
                  <li key={s}>
                    <button
                      type="button"
                      onClick={() => addSkills(s)}
                      aria-label={t("addSuggestion", { skill: s })}
                      className="inline-flex min-h-11 items-center gap-1 rounded-md px-2 text-sm font-medium text-brand-text hover:bg-brand-tint"
                    >
                      <Plus aria-hidden className="size-3.5" />
                      {s}
                    </button>
                  </li>
                ))}
              </ul>
            </div>
          )}
        </section>

        {/* Worth up to 40 points, so it opens by itself when it already has content. */}
        <details open={hasDetails} className="group rounded-xl border border-border bg-surface px-5">
          <summary className="flex min-h-14 cursor-pointer items-center justify-between gap-3 py-3">
            <span>
              <span className="block font-medium">{t("details")}</span>
              <span className="block text-sm text-muted">{t("detailsHint")}</span>
            </span>
            <ChevronDown aria-hidden className="size-5 shrink-0 transition-transform group-open:rotate-180" />
          </summary>
          <div className="flex flex-col gap-5 pb-5">
            <Field label={t("education")} inputProps={register("education")} />
            <Field label={t("experience")} multiline inputProps={register("experience")} />
            <Field label={t("projects")} multiline inputProps={register("projects")} />
          </div>
        </details>

        {submitError && (
          <p role="alert" className="flex items-center gap-1.5 text-sm text-danger">
            <AlertCircle aria-hidden className="size-4 shrink-0" />
            {t("matchFailed")}
          </p>
        )}

        <div className="fixed inset-x-0 bottom-0 z-10 border-t border-border bg-canvas p-3 sm:static sm:z-auto sm:border-0 sm:bg-transparent sm:p-0">
          <Button type="submit" loading={busy} loadingLabel={t("matching")} className="w-full sm:w-auto">
            {submitError ? t("retry") : t("submit")}
          </Button>
        </div>
      </form>
    </div>
  );
}
