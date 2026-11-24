import type { Job } from "../schemas/match";

/** Synthetic listings for the prototype. Skill names mimic ESCO-normalized labels. */
export const jobs: Job[] = [
  { id: "job-01", title: "Junior Backend Developer", company: "Nusantara Tech", summary: { id: "Membangun REST API dan layanan basis data dengan Python.", en: "Build REST APIs and database services with Python." }, skills: ["Python", "SQL", "FastAPI", "PostgreSQL", "REST API"] },
  { id: "job-02", title: "Data Analyst Intern", company: "Insight Analytics", summary: { id: "Membersihkan data, menulis query SQL, dan membuat dasbor.", en: "Clean data, write SQL queries and build dashboards." }, skills: ["Python", "SQL", "Data Visualization", "Excel"] },
  { id: "job-03", title: "Frontend Developer", company: "Pixel Labs", summary: { id: "Membangun antarmuka web responsif dengan React dan TypeScript.", en: "Build responsive web interfaces with React and TypeScript." }, skills: ["JavaScript", "TypeScript", "React", "CSS", "HTML"] },
  { id: "job-04", title: "Full Stack Developer", company: "Kopi Digital", summary: { id: "Mengembangkan fitur web di frontend dan backend dengan Next.js.", en: "Develop web features across frontend and backend with Next.js." }, skills: ["TypeScript", "React", "Node.js", "PostgreSQL", "REST API"] },
  { id: "job-05", title: "Machine Learning Engineer Intern", company: "Cerdas AI", summary: { id: "Melatih dan mengevaluasi model machine learning dengan Python.", en: "Train and evaluate machine learning models in Python." }, skills: ["Python", "Machine Learning", "Pandas", "Scikit-learn", "SQL"] },
  { id: "job-06", title: "UI/UX Designer", company: "Warna Studio", summary: { id: "Merancang alur pengguna, wireframe, dan prototipe di Figma.", en: "Design user flows, wireframes and prototypes in Figma." }, skills: ["Figma", "User Research", "Prototyping", "Wireframing"] },
  { id: "job-07", title: "DevOps Engineer Trainee", company: "Cloud Garuda", summary: { id: "Mengotomatiskan pipeline deployment dan mengelola container.", en: "Automate deployment pipelines and manage containers." }, skills: ["Docker", "CI/CD", "Linux", "Git", "Cloud Computing"] },
  { id: "job-08", title: "Business Intelligence Analyst", company: "Data Mandiri", summary: { id: "Membuat laporan bisnis dan dasbor untuk para pemangku kepentingan.", en: "Create business reports and dashboards for stakeholders." }, skills: ["SQL", "Data Visualization", "Excel", "Power BI"] },
  { id: "job-09", title: "Mobile Developer", company: "Aplikasi Kita", summary: { id: "Membangun aplikasi mobile lintas platform dengan Flutter.", en: "Build cross-platform mobile apps with Flutter." }, skills: ["Dart", "Flutter", "REST API", "Git"] },
  { id: "job-10", title: "QA Engineer", company: "Teliti Software", summary: { id: "Merancang dan mengotomatiskan pengujian perangkat lunak untuk aplikasi web.", en: "Design and automate software tests for web applications." }, skills: ["Test Automation", "JavaScript", "SQL", "Git"] },
  { id: "job-11", title: "Digital Marketing Associate", company: "Ruang Brand", summary: { id: "Merencanakan kampanye dan menganalisis data kinerja pemasaran.", en: "Plan campaigns and analyze marketing performance data." }, skills: ["Content Marketing", "SEO", "Data Analysis", "Excel"] },
  { id: "job-12", title: "Cybersecurity Analyst Trainee", company: "Benteng Siber", summary: { id: "Memantau sistem dari ancaman dan menilai kerentanan.", en: "Monitor systems for threats and assess vulnerabilities." }, skills: ["Network Security", "Linux", "Python", "Risk Assessment"] },
  { id: "job-13", title: "Software Engineer (Java)", company: "Bank Digital Nusa", summary: { id: "Mengembangkan layanan backend untuk produk keuangan.", en: "Develop backend services for financial products." }, skills: ["Java", "Spring Boot", "SQL", "REST API", "Git"] },
  { id: "job-14", title: "Product Analyst", company: "Toko Online ID", summary: { id: "Menganalisis data penggunaan produk dan merekomendasikan perbaikan.", en: "Analyze product usage data and recommend improvements." }, skills: ["SQL", "Data Analysis", "Data Visualization", "A/B Testing"] },
];

export const sampleProfiles = [
  {
    name: "Rina Pratama",
    education: "S1 Teknik Informatika, 2025",
    experience: "Magang backend developer: membangun REST API dan database dengan Python.",
    projects: "Aplikasi inventaris toko dengan Python dan SQL.",
    skills: ["Python", "SQL", "REST API", "Git"],
  },
  {
    name: "Dimas Saputra",
    education: "S1 Sistem Informasi, 2024",
    experience: "Frontend developer lepas: membangun antarmuka web responsif.",
    projects: "Portofolio dan dasbor dengan React dan TypeScript.",
    skills: ["JavaScript", "TypeScript", "React", "CSS", "HTML"],
  },
] as const;

/** Every skill the listings ask for, alphabetical. Used to suggest canonical names. */
export function allSkills(): string[] {
  return [...new Set(jobs.flatMap((j) => j.skills))].sort((a, b) => a.localeCompare(b));
}

/** Skills ordered by how many listings ask for them (ties alphabetical). */
export function popularSkills(limit: number): string[] {
  const count = new Map<string, number>();
  for (const j of jobs) for (const s of j.skills) count.set(s, (count.get(s) ?? 0) + 1);
  return [...count.entries()]
    .sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0]))
    .slice(0, limit)
    .map(([s]) => s);
}
