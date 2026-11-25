import type { Job, MatchResult, ReasonCode, TextLevel } from "./schemas/match";
import type { Profile } from "./schemas/profile";

/**
 * PLACEHOLDER scoring. Real weighting is an open PRD question (13.3).
 * score = 100 * (0.6 * skillOverlap + 0.4 * textSimilarity)
 */
export const WEIGHTS = { skill: 0.6, text: 0.4 } as const;
/** A job is listed when the profile has at least this many of its skills. */
export const MIN_MATCHED = 1;
export const TOP_N = 10;

/**
 * Common spellings mapped to the canonical (ESCO-style) label used in the listings, so
 * "JS" and "JavaScript" count as the same skill. Keys and values are lowercase.
 */
const ALIASES: Record<string, string> = {
  js: "javascript",
  ts: "typescript",
  py: "python",
  postgres: "postgresql",
  psql: "postgresql",
  reactjs: "react",
  "react.js": "react",
  node: "node.js",
  nodejs: "node.js",
  ml: "machine learning",
  sklearn: "scikit-learn",
  "scikit learn": "scikit-learn",
  "ci-cd": "ci/cd",
  cicd: "ci/cd",
  rest: "rest api",
  "restful api": "rest api",
  springboot: "spring boot",
  "ms excel": "excel",
  "microsoft excel": "excel",
  powerbi: "power bi",
  "data viz": "data visualization",
};

export const normalizeSkill = (s: string) => {
  const key = s.trim().toLowerCase().replace(/\s+/g, " ");
  return ALIASES[key] ?? key;
};

const tokens = (text: string) =>
  new Set(
    text
      .toLowerCase()
      .split(/[^\p{L}\p{N}+#.]+/u)
      .filter((t) => t.length > 2),
  );

function overlap(source: Set<string>, target: Set<string>): number {
  if (target.size === 0) return 0;
  let hit = 0;
  for (const t of target) if (source.has(t)) hit++;
  return Math.min(1, hit / target.size);
}

/**
 * Compares the profile text with the listing in both languages and keeps the better match,
 * so a profile written in Indonesian (the default locale) is not penalised.
 */
function textSimilarity(profile: Profile, job: Job): number {
  const source = tokens(`${profile.experience} ${profile.projects} ${profile.education}`);
  return Math.max(
    overlap(source, tokens(`${job.title} ${job.summary.id}`)),
    overlap(source, tokens(`${job.title} ${job.summary.en}`)),
  );
}

export function reasonFor(score: number): ReasonCode {
  if (score >= 70) return "strong";
  if (score >= 40) return "partial";
  return "weak";
}

/** How the experience and projects text compares with the listing; a code, worded in the UI. */
function textLevelFor(points: number, hasText: boolean): TextLevel {
  if (!hasText) return "empty";
  const share = points / (100 * WEIGHTS.text);
  if (share >= 0.5) return "high";
  if (share >= 0.2) return "some";
  return "low";
}

interface DomainInfo {
  id: string;
  en: string;
  projectType: { id: string; en: string };
}

function detectJobDomain(job: Job): DomainInfo {
  const text = `${job.title} ${job.skills.join(" ")}`.toLowerCase();

  if (/mobile|flutter|dart|android|ios|react native/i.test(text)) {
    return {
      id: "pengembangan aplikasi mobile",
      en: "mobile application development",
      projectType: {
        id: "aplikasi mobile (Android/iOS/Flutter)",
        en: "mobile applications (Android/iOS/Flutter)",
      },
    };
  }
  if (/full\s*stack|next\.js/i.test(text)) {
    return {
      id: "pengembangan web full-stack",
      en: "full-stack web development",
      projectType: {
        id: "aplikasi full-stack (frontend dan backend)",
        en: "full-stack applications (frontend and backend)",
      },
    };
  }
  if (/frontend|front-end|react|vue|angular|css|html/i.test(text)) {
    return {
      id: "pengembangan web frontend",
      en: "frontend web development",
      projectType: {
        id: "antarmuka web responsif atau aplikasi frontend",
        en: "responsive web interfaces or frontend applications",
      },
    };
  }
  if (/backend|back-end|fastapi|spring boot|django|express|laravel|golang|api/i.test(text)) {
    return {
      id: "pengembangan backend dan API",
      en: "backend and API development",
      projectType: {
        id: "layanan backend, REST API, atau basis data",
        en: "backend services, REST APIs, or databases",
      },
    };
  }
  if (/machine learning|deep learning|data scientist|ai|scikit|pytorch|tensorflow/i.test(text)) {
    return {
      id: "machine learning dan kecerdasan buatan (AI)",
      en: "machine learning and artificial intelligence (AI)",
      projectType: {
        id: "pelatihan model machine learning atau AI",
        en: "machine learning or AI model training",
      },
    };
  }
  if (/data analyst|business intelligence|bi analyst|tableau|power bi|sql|data viz/i.test(text)) {
    return {
      id: "analisis data dan Business Intelligence",
      en: "data analysis and Business Intelligence",
      projectType: {
        id: "analisis data bisnis, SQL query, atau dashboard",
        en: "business data analysis, SQL queries, or dashboards",
      },
    };
  }
  if (/devops|cloud|docker|kubernetes|ci\/cd|infrastructure/i.test(text)) {
    return {
      id: "DevOps dan infrastruktur cloud",
      en: "DevOps and cloud infrastructure",
      projectType: {
        id: "otomasi CI/CD pipeline atau container cloud",
        en: "CI/CD pipeline automation or cloud containers",
      },
    };
  }
  if (/ui\/ux|designer|product design|figma/i.test(text)) {
    return {
      id: "desain UI/UX",
      en: "UI/UX design",
      projectType: {
        id: "alur kerja pengguna, wireframe, atau prototipe Figma",
        en: "user workflows, wireframes, or Figma prototypes",
      },
    };
  }
  if (/qa|quality assurance|tester|test automation/i.test(text)) {
    return {
      id: "quality assurance dan software testing",
      en: "quality assurance and software testing",
      projectType: {
        id: "pengujian perangkat lunak atau automated testing",
        en: "software testing or automated testing",
      },
    };
  }

  const topSkills = job.skills.slice(0, 2).join(" & ") || job.title;
  return {
    id: job.title,
    en: job.title,
    projectType: {
      id: `proyek yang relevan dengan ${topSkills}`,
      en: `projects relevant to ${topSkills}`,
    },
  };
}

interface ExpReq {
  years: number;
  label: { id: string; en: string };
}

function detectJobExpReq(job: Job): ExpReq {
  const fullText = `${job.title} ${job.summary.id} ${job.summary.en}`.toLowerCase();

  const match = fullText.match(
    /(?:minimal|min|pengalaman|experience|setidaknya)\s*(\d+)(?:\s*(?:-|sampai|to)\s*(\d+))?\s*(?:tahun|thn|years?|th)/i,
  );
  if (match) {
    const y = parseInt(match[1], 10);
    return {
      years: y,
      label: { id: `minimal ${y} tahun`, en: `at least ${y} year(s)` },
    };
  }

  const titleLower = job.title.toLowerCase();
  if (/senior|lead|principal|head|manager/i.test(titleLower)) {
    return {
      years: 5,
      label: { id: "sekitar 4–5 tahun (tingkat Senior)", en: "around 4–5 years (Senior level)" },
    };
  }
  if (/intern|magang|trainee|fresh graduate/i.test(titleLower)) {
    return {
      years: 1,
      label: { id: "0–1 tahun (Fresh Graduate / Magang)", en: "0–1 year (Fresh Graduate / Intern)" },
    };
  }
  if (/junior|associate/i.test(titleLower)) {
    return {
      years: 2,
      label: { id: "minimal 1–2 tahun (tingkat Junior)", en: "at least 1–2 years (Junior level)" },
    };
  }

  return {
    years: 2,
    label: { id: "sekitar 2–3 tahun", en: "around 2–3 years" },
  };
}

function extractCandidateYears(experienceText: string): number | null {
  const match = experienceText.match(/(\d+)\+?\s*(?:tahun|thn|years?|yrs?|th)\b/i);
  if (match) {
    return parseInt(match[1], 10);
  }
  return null;
}

export function generateTextComparison(
  profile: Profile,
  job: Job,
): { experience: { id: string; en: string }; projects: { id: string; en: string } } {
  const domain = detectJobDomain(job);
  const expReq = detectJobExpReq(job);

  // 1. Compare Experience
  let expComparison: { id: string; en: string };
  const expText = profile.experience.trim();

  if (!expText) {
    expComparison = {
      id: `Lowongan ini mensyaratkan pengalaman ${expReq.label.id} di bidang ${domain.id}, namun Anda belum mengisi riwayat pengalaman kerja di profil.`,
      en: `This job requires ${expReq.label.en} of experience in ${domain.en}, but you have not added work experience to your profile yet.`,
    };
  } else {
    const candYears = extractCandidateYears(expText);
    const isInternCandidate = /magang|intern|fresh graduate|lulusan baru/i.test(expText);

    if (candYears !== null) {
      if (candYears < expReq.years) {
        expComparison = {
          id: `Lowongan ini mensyaratkan pengalaman ${expReq.label.id}, namun profil Anda baru memiliki sekitar ${candYears} tahun pengalaman.`,
          en: `This job requires ${expReq.label.en} of experience, but your profile currently has around ${candYears} year(s) of experience.`,
        };
      } else {
        expComparison = {
          id: `Riwayat pengalaman kerja Anda (${candYears} tahun) telah memenuhi syarat durasi pengalaman yang dicari posisi ini (${expReq.label.id}).`,
          en: `Your work experience (${candYears} year(s)) satisfies the required duration for this role (${expReq.label.en}).`,
        };
      }
    } else if (isInternCandidate) {
      if (expReq.years > 1) {
        expComparison = {
          id: `Lowongan ini mensyaratkan pengalaman kerja ${expReq.label.id}, sedangkan profil Anda baru mencantumkan pengalaman magang atau pemula.`,
          en: `This job requires ${expReq.label.en} of professional experience, whereas your profile currently reflects internship or entry-level experience.`,
        };
      } else {
        expComparison = {
          id: `Latar belakang magang atau pemula Anda selaras dengan kualifikasi awal yang dicari posisi ini.`,
          en: `Your internship or entry-level background aligns well with the starting qualifications for this role.`,
        };
      }
    } else {
      const expTokens = tokens(expText);
      const jobTokens = tokens(`${job.title} ${job.summary.id}`);
      const matchOverlap = overlap(expTokens, jobTokens);

      if (matchOverlap >= 0.25) {
        expComparison = {
          id: `Riwayat pengalaman Anda relevan dengan bidang ${domain.id}, namun belum merinci spesifik total tahun masa kerja.`,
          en: `Your work experience is relevant to ${domain.en}, but does not explicitly state the total years of duration.`,
        };
      } else {
        expComparison = {
          id: `Lowongan ini mengutamakan pengalaman ${expReq.label.id} di bidang ${domain.id}, sedangkan pengalaman Anda saat ini masih terbatas atau berfokus pada bidang lain.`,
          en: `This job prioritizes ${expReq.label.en} in ${domain.en}, while your experience is limited or focused on a different area.`,
        };
      }
    }
  }

  // 2. Compare Projects
  let projComparison: { id: string; en: string };
  const projText = profile.projects.trim();

  if (!projText) {
    projComparison = {
      id: `Lowongan ini mensyaratkan keterlibatan setidaknya dalam 1 proyek ${domain.projectType.id}, namun Anda belum mencantumkan riwayat proyek di profil.`,
      en: `This job requires involvement in at least 1 project involving ${domain.projectType.en}, but you have not listed any projects in your profile.`,
    };
  } else {
    const projTokens = tokens(projText);
    const jobReqTokens = tokens(
      `${job.title} ${domain.projectType.id} ${domain.projectType.en} ${job.skills.join(" ")}`,
    );
    const matchOverlap = overlap(projTokens, jobReqTokens);

    if (matchOverlap >= 0.2) {
      projComparison = {
        id: `Portofolio proyek Anda telah mencakup proyek yang relevan dengan kebutuhan posisi ini (${domain.projectType.id}).`,
        en: `Your project portfolio includes projects relevant to this role's needs (${domain.projectType.en}).`,
      };
    } else {
      projComparison = {
        id: `Lowongan ini mensyaratkan keterlibatan dalam proyek ${domain.projectType.id}, namun proyek Anda saat ini belum mencakup bidang tersebut.`,
        en: `This job requires experience in ${domain.projectType.en} projects, but your current projects do not yet cover this area.`,
      };
    }
  }

  return {
    experience: expComparison,
    projects: projComparison,
  };
}

export function scoreJob(profile: Profile, job: Job): MatchResult {
  const have = new Set(profile.skills.map(normalizeSkill));
  const matchedSkills = job.skills.filter((s) => have.has(normalizeSkill(s)));
  const missingSkills = job.skills.filter((s) => !have.has(normalizeSkill(s)));
  const overlap = job.skills.length ? matchedSkills.length / job.skills.length : 0;
  // The two parts are rounded separately so the UI can show them adding up to the score.
  const skillPoints = Math.round(100 * WEIGHTS.skill * overlap);
  const textPoints = Math.round(100 * WEIGHTS.text * textSimilarity(profile, job));
  const score = skillPoints + textPoints;
  const hasText = Boolean(`${profile.experience}${profile.projects}${profile.education}`.trim());
  return {
    breakdown: {
      skillPoints,
      textPoints,
      textLevel: textLevelFor(textPoints, hasText),
      textComparison: generateTextComparison(profile, job),
    },
    jobId: job.id,
    title: job.title,
    company: job.company,
    summary: job.summary,
    score,
    jobSkills: job.skills,
    matchedSkills,
    missingSkills,
    reason: reasonFor(score),
  };
}

export function rankJobs(profile: Profile, jobs: Job[]): MatchResult[] {
  return jobs
    .map((j) => scoreJob(profile, j))
    // Every listing with at least one matching skill is shown; a low score is a direction, not a reason to hide it.
    .filter((r) => r.matchedSkills.length >= MIN_MATCHED)
    .sort((a, b) => b.score - a.score || a.title.localeCompare(b.title))
    .slice(0, TOP_N);
}
