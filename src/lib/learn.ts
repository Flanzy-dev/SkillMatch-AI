/**
 * A web search for learning material on a skill. It is a plain link the user opens on
 * purpose; nothing about the user or their CV is sent, only the skill name they click.
 */
export function learnUrl(skill: string, locale: "id" | "en"): string {
  const query = `${locale === "id" ? "belajar" : "learn"} ${skill}`;
  return `https://www.google.com/search?q=${encodeURIComponent(query)}`;
}
