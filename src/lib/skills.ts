import { allSkills } from "./mock-data/jobs";
import { normalizeSkill } from "./scoring";

const defaultCanonical = allSkills();
const defaultKnown = new Map(defaultCanonical.map((s) => [normalizeSkill(s), s]));

export function buildKnownSkillsMap(catalog: string[]): Map<string, string> {
  const map = new Map(defaultKnown);
  for (const s of catalog) {
    map.set(normalizeSkill(s), s);
  }
  return map;
}

/** True when some listing asks for this skill (after alias normalization). */
export function isKnownSkill(skill: string, customKnown?: Map<string, string>): boolean {
  const map = customKnown || defaultKnown;
  return map.has(normalizeSkill(skill));
}

function distance(a: string, b: string): number {
  const row = Array.from({ length: b.length + 1 }, (_, i) => i);
  for (let i = 1; i <= a.length; i++) {
    let prev = row[0];
    row[0] = i;
    for (let j = 1; j <= b.length; j++) {
      const tmp = row[j];
      row[j] = Math.min(row[j] + 1, row[j - 1] + 1, prev + (a[i - 1] === b[j - 1] ? 0 : 1));
      prev = tmp;
    }
  }
  return row[b.length];
}

/**
 * The listing's name closest to an unknown skill, for a "did you mean" hint: a name that
 * contains it or is contained by it, else one or two typos away. Null when nothing is close.
 */
export function closestSkill(skill: string, customKnown?: Map<string, string>): string | null {
  const map = customKnown || defaultKnown;
  const s = normalizeSkill(skill);
  if (s.length < 2 || map.has(s)) return null;
  for (const [key, name] of map) {
    if (s.length >= 3 && (key.includes(s) || s.includes(key)) && key.length >= 2) return name;
  }
  let best: { name: string; d: number } | null = null;
  for (const [key, name] of map) {
    const d = distance(s, key);
    if (d <= (s.length >= 6 ? 2 : 1) && (!best || d < best.d)) best = { name, d };
  }
  return best?.name ?? null;
}
