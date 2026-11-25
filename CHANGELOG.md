# Changelog & Identifikasi Perubahan (Backend Integration & Scoring Enhancements)

**Branch:** `feat/frontend-mvp`  
**Tanggal:** 2026-11-25  
**Ringkasan:** Integrasi penuh backend serverless Next.js (ekstraksi CV berbasis PDF + Google Gemini, database lowongan MongoDB Atlas, katalog skill dinamis, serta feedback relevansi), penambahan fitur perbandingan pengalaman dan proyek pada scoring engine, skrip import dataset lowongan, 15 sample CV PDF, serta pembaruan unit test dan copy UI.

---

## 1. Penambahan (Additions)

### 1.1 API Route Handlers (`src/app/api/`)
- **[src/app/api/cv/extract/route.ts](src/app/api/cv/extract/route.ts)** — Endpoint `POST /api/cv/extract`:
  - Memvalidasi payload `multipart/form-data` (keberadaan field `file`, tipe `application/pdf` atau ekstensi `.pdf` dengan status `400`, serta batas ukuran `MAX_CV_BYTES` 5 MB dengan status `413`).
  - Memproses buffer PDF secara *in-memory* menggunakan `extractTextFromPdf()` dan mengembalikan status `422` bila parsing gagal.
  - Mengekstrak profil terstruktur melalui `extractProfileWithGemini()` saat `isGeminiConfigured()` bernilai `true`, atau menggunakan fallback deterministik berbasis `sampleProfiles` di lingkungan development ketika `GEMINI_API_KEY` belum diatur.
- **[src/app/api/jobs/match/route.ts](src/app/api/jobs/match/route.ts)** — Endpoint `POST /api/jobs/match`:
  - Memvalidasi body JSON terhadap `profileSchema` (Zod) dan mengembalikan status `400` beserta detail validasi bila tidak valid.
  - Mengambil data lowongan melalui `getAllJobs()` dan melakukan pemeringkatan via `rankJobs(profile, jobs)`.
- **[src/app/api/jobs/feedback/route.ts](src/app/api/jobs/feedback/route.ts)** — Endpoint `POST /api/jobs/feedback`:
  - Memvalidasi `jobId` (`string`) dan `helpful` (`boolean`), mengembalikan `400` jika tidak lengkap.
  - Meng-hash alamat IP klien (`x-forwarded-for`) menggunakan potongan base64 16 karakter (`ipHash`) untuk pencegahan spam tanpa menyimpan IP mentah, lalu menyimpan melalui `saveFeedback()`.
- **[src/app/api/skills/route.ts](src/app/api/skills/route.ts)** — Endpoint `GET /api/skills`:
  - Mengagregasi daftar keterampilan unik terurut alfabetis (`canonical`) dan 12 keterampilan paling sering muncul (`popular`) dari `getAllJobs()`.
  - Menyertakan header HTTP cache `Cache-Control: public, s-maxage=3600, stale-while-revalidate=86400`.

### 1.2 Layanan Server & Database (`src/lib/server/`)
- **[src/lib/server/db/mongodb.ts](src/lib/server/db/mongodb.ts)**:
  - Koneksi MongoDB Serverless (`MONGODB_URI`, `MONGODB_DB_NAME` default `skillmatch_ai`) dengan *connection caching* (`globalThis._mongoClientPromise` di mode development dan `clientPromise` di production), `serverSelectionTimeoutMS: 5000`, serta `maxPoolSize: 10`.
  - Menyediakan helper `isMongoConfigured()`, `getMongoClient()`, `getDb()`, `getJobsCollection()`, `getFeedbackCollection()`, serta interface `FeedbackRecord`.
- **[src/lib/server/db/jobs.ts](src/lib/server/db/jobs.ts)**:
  - `getAllJobs()`: mengambil lowongan dari MongoDB dengan in-memory cache (`CACHE_TTL_MS = 60_000`) dan fallback otomatis ke `fallbackJobs` (`src/lib/mock-data/jobs.ts`).
  - `seedJobsIfEmpty()`: mengisi data awal jika koleksi `jobs` masih kosong dan membuat indeks unik pada `id`.
  - `clearJobsCache()` dan `saveFeedback()`: pencatatan feedback ke MongoDB dengan fallback log memori jika DB belum dikonfigurasi.
- **[src/lib/server/services/pdf.ts](src/lib/server/services/pdf.ts)**:
  - `extractTextFromPdf(buffer)`: parsing PDF secara *in-memory* menggunakan `PDFParse` (`pdf-parse`) tanpa menyimpan file ke disk.
  - Melakukan konfigurasi path `pdf.worker.mjs` (`ensureWorkerConfigured()`), validasi header `%PDF-` pada 1024 byte pertama, pembatasan panjang teks maksimal `50000` karakter, serta pembersihan resource via `parser.destroy()` di blok `finally`.
- **[src/lib/server/services/gemini.ts](src/lib/server/services/gemini.ts)**:
  - Integrasi `@google/genai` (`extractProfileWithGemini()`, `getGeminiApiKey()`, `isGeminiConfigured()`).
  - Mendukung `GEMINI_MODEL` kustom dengan urutan fallback model (`gemini-3.5-flash`, `gemini-3.5-flash-lite`, `gemini-3.8-flash`, `gemini-flash-latest`), `responseMimeType: "application/json"`, `temperature: 0.1`, pembersihan markdown code fence JSON, dan pembatasan maksimal 50 item pada `skills`.

### 1.3 HTTP Client & Barrel API (`src/lib/api/`)
- **[src/lib/api/http.ts](src/lib/api/http.ts)**:
  - Implementasi `httpApi: Api` (`extractCv`, `matchJobs`, `submitFeedback`, `getSkillsCatalog`) untuk berkomunikasi dengan Route Handlers `/api/*`, mendukung `AbortSignal` (`ApiError("aborted")`) dan error mapping (`extract_failed`, `match_failed`).
- **[src/lib/api/index.ts](src/lib/api/index.ts)**:
  - Barrel export untuk `client`, `httpApi`, `mockApi`, `DEMO_EXTRACTION` (`NEXT_PUBLIC_DEMO_EXTRACTION !== "false"`), dan `api` (menggunakan `httpApi` secara default, atau `mockApi` jika `NEXT_PUBLIC_USE_MOCK === "true"`).

### 1.4 Skrip Import Dataset, Sample CV, Dokumentasi, & Unit Test API
- **[scripts/import_jobs.py](scripts/import_jobs.py)**:
  - Skrip Python (`pymongo`, `python-dotenv`) untuk mengimpor dataset lowongan kerja CSV (Glints, Simaremare, Jobstreet Kaggle) ke koleksi `jobs` MongoDB Atlas.
  - Mencakup pembersihan teks HTML/whitespace, ekstraksi keahlian, pembuatan ringkasan bilingual (`id` dan `en`), deduplikasi `(title, company)`, prioritas komposisi role tech (~65%) vs non-tech (~35%), opsi CLI `--file`, `--limit`, `--append`, `--tech-priority`, serta pembuatan indeks (`id` unique, `skills`, `title`).
- **[sample_cvs/](sample_cvs/)**:
  - Penambahan 15 berkas CV PDF contoh (`CV_01_Ahmad_Rizky_Pratama_Frontend_Developer.pdf` s.d. `CV_15_Aditya_Kusuma_Customer_Success_Manager.pdf`) yang mencakup berbagai bidang peran (Frontend, Backend, Data Scientist, UI/UX, DevOps/Cloud, Data Analyst, Mobile, QA Automation, Product Manager, Digital Marketing, Cybersecurity, HR Talent Acquisition, Financial Analyst, Content Writer SEO, dan Customer Success Manager).
- **[task-be.md](task-be.md)**:
  - Dokumentasi Work Breakdown Structure (WBS) backend (`BE-01` s.d. `BE-13`), rincian Milestone 1–5, matriks prioritas (P0–P2), serta catatan keputusan arsitektur.
- **[tests/unit/api.test.ts](tests/unit/api.test.ts)**:
  - 9 unit test untuk memverifikasi Route Handlers: validasi error input pada `POST /api/cv/extract` (tanpa file, file non-PDF), ekstraksi PDF valid (fallback & mode Gemini), `GET /api/skills`, `POST /api/jobs/match` (ranking valid & payload invalid 400), serta `POST /api/jobs/feedback` (sukses & payload invalid 400).

---

## 2. Perubahan & Peningkatan (Modifications)

### 2.1 Konfigurasi & Dependensi
- **[package.json](package.json)** & **[package-lock.json](package-lock.json)**:
  - Penambahan dependensi produksi: `@google/genai` (`^2.32.0`), `mongodb` (`^7.9.1`), `pdf-parse` (`^2.4.5`).
  - Penambahan dependensi pengembangan: `@types/pdf-parse` (`^1.1.5`).
- **[.gitignore](.gitignore)**:
  - Menambahkan aturan `*.csv` agar file dataset mentah berformat CSV tidak ikut ter-commit ke repositori.

### 2.2 Skema, Mesin Skor, & Taksonomi Keterampilan
- **[src/lib/schemas/match.ts](src/lib/schemas/match.ts)**:
  - Menambahkan `textComparisonSchema` (`experience` dan `projects` bertipe `localizedText`), tipe `TextComparison`, serta field opsional `textComparison` pada `breakdownSchema`.
- **[src/lib/scoring.ts](src/lib/scoring.ts)**:
  - Menambahkan fungsi `detectJobDomain()`, `detectJobExpReq()`, `extractCandidateYears()`, dan `generateTextComparison(profile, job)` untuk menghasilkan analisis perbandingan pengalaman kerja (durasi tahun, pengalaman magang/pemula, atau relevansi teks) dan relevansi portofolio proyek dalam bahasa Indonesia dan Inggris.
  - Menyisipkan hasil `generateTextComparison(profile, job)` ke `breakdown.textComparison` pada fungsi `scoreJob()`.
- **[src/lib/skills.ts](src/lib/skills.ts)**:
  - Menambahkan `buildKnownSkillsMap(catalog)` dan parameter opsional `customKnown` pada `isKnownSkill()` serta `closestSkill()` agar pencocokan dan saran typo keahlian dapat memanfaatkan katalog skill dinamis dari backend.

### 2.3 Kontrak API & Halaman Frontend
- **[src/lib/api/client.ts](src/lib/api/client.ts)**:
  - Menambahkan interface `SkillsCatalog` (`canonical`, `popular`) dan method `getSkillsCatalog()` pada kontrak `Api`.
- **[src/lib/api/mock.ts](src/lib/api/mock.ts)**:
  - Menambahkan implementasi `getSkillsCatalog()` pada `mockApi`.
  - Mengubah `DEMO_EXTRACTION` menjadi `process.env.NEXT_PUBLIC_DEMO_EXTRACTION !== "false"`.
  - Mengubah ekspor `api` agar default menggunakan `httpApi` (hanya memakai `mockApi` jika `NEXT_PUBLIC_USE_MOCK === "true"`).
- **[src/components/ui/ScoreBreakdown.tsx](src/components/ui/ScoreBreakdown.tsx)**:
  - Menggunakan `useLocale()` untuk menampilkan panel rincian `textComparison` (`experience` dan `projects`) tepat di bawah skor kemiripan teks pada tampilan breakdown penuh.
- **[src/app/[locale]/review/page.tsx](src/app/[locale]/review/page.tsx)**:
  - Mengalihkan impor API dari `@/lib/api/mock` ke `@/lib/api`.
  - Mengambil katalog keahlian dinamis melalui `api.getSkillsCatalog()` pada `useEffect` (dengan state awal dari `allSkills()` dan `popularSkills(12)`).
  - Memanfaatkan `buildKnownSkillsMap(catalog.canonical)` untuk menghitung `unknown`, `skillOptions`, `suggestions`, `SkillChip`, dan `closestSkill`.
- **[src/app/[locale]/upload/page.tsx](src/app/[locale]/upload/page.tsx)** & **[src/app/[locale]/results/[jobId]/page.tsx](src/app/[locale]/results/[jobId]/page.tsx)**:
  - Memperbarui sumber impor `api`, `DEMO_EXTRACTION`, dan `ApiError` agar mengarah ke `@/lib/api`.

### 2.4 Lokalisasi & Pengujian Unit
- **[messages/en.json](messages/en.json)** & **[messages/id.json](messages/id.json)**:
  - Memperbarui salinan UI pada `Header.synthetic`, `Footer.note`, `Landing.previewLabel`, dan `Results.planNote` dari klaim data sintetis menjadi informasi bahwa lowongan dikurasi dari lowongan kerja nyata di Indonesia serta platform SkillMatch AI.
  - Menambahkan kunci terjemahan `Match.comparisonTitle`, `Match.experienceComparisonLabel`, dan `Match.projectsComparisonLabel`.
- **[tests/unit/scoring.test.ts](tests/unit/scoring.test.ts)**:
  - Menambahkan suite pengujian `generateTextComparison` (2 test case) untuk memverifikasi perbandingan durasi pengalaman kandidat terhadap syarat lowongan serta deteksi kesesuaian proyek.

---

## 3. Perbaikan (Fixes)

- **Keamanan & Determinisme Pengujian ([tests/unit/api.test.ts](tests/unit/api.test.ts))**:
  - Menghapus fallback API key hardcoded pada test ekstraksi CV Gemini dan menggantinya dengan `vi.spyOn(geminiService, "extractProfileWithGemini")` saat `GEMINI_API_KEY` tidak diatur di environment, sehingga tidak ada kredensial sensitif yang ikut ter-commit ke repositori dan unit test tetap berjalan deterministik secara offline.
- **Resolusi Worker & Cleanup Memori PDF ([src/lib/server/services/pdf.ts](src/lib/server/services/pdf.ts))**:
  - Menambahkan resolusi eksplisit path `pdf.worker.mjs` (via `createRequire` dan fallback `node_modules`) untuk mencegah kegagalan worker `pdfjs-dist` di runtime Next.js server, serta memastikan `parser.destroy()` selalu dipanggil pada blok `finally`.
- **Ketahanan Parsing JSON & Fallback Model Gemini ([src/lib/server/services/gemini.ts](src/lib/server/services/gemini.ts))**:
  - Menambahkan iterasi multi-model fallback serta ekstraksi substring JSON (`{...}`) dan penghapusan markdown fence agar respons LLM tetap terurai stabil.
- **Graceful Degradation saat Layanan Eksternal Tidak Terkonfigurasi**:
  - Menambahkan fallback statis di `src/lib/server/db/jobs.ts` (`fallbackJobs` & log feedback memori) ketika `MONGODB_URI` kosong/gagal terhubung, serta fallback `sampleProfiles` di `src/app/api/cv/extract/route.ts` bila `GEMINI_API_KEY` belum dipasang.
