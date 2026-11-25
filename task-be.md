# Daftar Task Backend (BE Work Breakdown Structure)
**Proyek:** AI Skill-to-Job Matching (SkillMatch AI)  
**Dokumen:** Spesifikasi Rencana Kerja dan Task Backend  
**Status Terkini:** Menggunakan Next.js Serverless Route Handlers, MongoDB Serverless, dan Google Gemini API.

---

## Daftar Isi
1. [Ringkasan Arsitektur & Prinsip Sistem](#1-ringkasan-arsitektur--prinsip-sistem)
2. [Status Implementasi Task](#2-status-implementasi-task)
3. [Rincian Lengkap Task Backend](#3-rincian-lengkap-task-backend)
   - [Milestone 1: Fondasi Proyek, Database Serverless, & Master Taksonomi](#milestone-1-fondasi-proyek-database-serverless--master-taksonomi)
   - [Milestone 2: Fitur Ekstraksi CV Berbasis AI](#milestone-2-fitur-ekstraksi-cv-berbasis-ai)
   - [Milestone 3: Fitur Pencocokan Lowongan & Scoring Engine](#milestone-3-fitur-pencocokan-lowongan--scoring-engine)
   - [Milestone 4: Fitur Umpan Balik, Keamanan, & Privasi](#milestone-4-fitur-umpan-balik-keamanan--privasi)
   - [Milestone 5: Integrasi FE-BE & Validasi Kontrak](#milestone-5-integrasi-fe-be--validasi-kontrak)
4. [Matriks Prioritas (P0, P1, P2)](#4-matriks-prioritas-p0-p1-p2)
5. [Pertanyaan Kunci dan Keputusan Teknis](#5-pertanyaan-kunci-dan-keputusan-teknis)

---

## 1. Ringkasan Arsitektur & Prinsip Sistem

### 1.1 Tumpukan Teknologi Backend
- **Platform/Runtime**: Next.js Serverless Route Handlers (`src/app/api/...`) berjalan di atas Node.js 20+ runtime.
- **Database**: MongoDB Serverless (MongoDB Atlas) melalui driver resmi `mongodb` dengan pola *connection pooling / client caching* yang ramah lingkungan serverless.
- **AI/LLM Provider**: Google Gemini (`gemini-3.5-flash` dengan fallback `gemini-3.5-flash-lite`) via SDK resmi `@google/genai` untuk ekstraksi entitas terstruktur JSON.
- **PDF Extraction**: `pdf-parse` (in-memory buffer parsing tanpa penulisan berkas ke disk).
- **Validasi Skema**: Zod (`zod`).

### 1.2 Prinsip Privasi dan Batasan Teknis
1. **Privasi Dokumen CV (Product Principle 3)**: Berkas CV pengguna **tidak disimpan** di database, tidak disimpan di disk server, dan teks mentah CV tidak dicatat ke dalam log file. Berkas hanya diproses secara *in-memory* sesaat selama proses ekstraksi teks.
2. **Scoring Transparan (Product Principle 1)**: Skor total 0–100 adalah penjumlahan eksak dari **Poin Keterampilan** (maksimal 60 poin) dan **Poin Kemiripan Teks** (maksimal 40 poin).
3. **Penyelarasan Taksonomi (ESCO-based)**: Normalisasi sinonim dan alias ejaan keahlian (misal: "JS" -> "JavaScript", "Postgres" -> "PostgreSQL") agar evaluasi berjalan adil.

---

## 2. Status Implementasi Task

| ID Task | Judul Task | Milestone | Prioritas | Status |
| :--- | :--- | :--- | :---: | :---: |
| **BE-01** | Inisialisasi Arsitektur Backend Serverless & Konfigurasi Lingkungan | M1 | P0 | ✅ Selesai |
| **BE-02** | Setup Koneksi MongoDB Serverless & Skema Lowongan Kerja | M1 | P0 | ✅ Selesai |
| **BE-03** | Master Taksonomi Keterampilan & Normalisasi Alias (ESCO-based) | M1 | P0 | ✅ Selesai |
| **BE-04** | Layanan Parsing PDF Ephemeral & Sanitasi Berkas | M2 | P0 | ✅ Selesai |
| **BE-05** | Integrasi LLM Google Gemini untuk Ekstraksi Profil Terstruktur | M2 | P0 | ✅ Selesai |
| **BE-06** | Endpoint API Ekstraksi CV (`POST /api/cv/extract`) | M2 | P0 | ✅ Selesai |
| **BE-07** | Mesin Perhitungan Skor Kecocokan Keterampilan (Maks 60 Poin) | M3 | P0 | ✅ Selesai |
| **BE-08** | Mesin Perhitungan Kemiripan Teks Bilingual (Maks 40 Poin) | M3 | P0 | ✅ Selesai |
| **BE-09** | Endpoint API Rekomendasi & Pemeringkatan Lowongan (`POST /api/jobs/match`) | M3 | P0 | ✅ Selesai |
| **BE-10** | Endpoint Katalog Keterampilan Dinamis (`GET /api/skills`) | M3 | P2 | ✅ Selesai |
| **BE-11** | Endpoint & Penyimpanan Umpan Balik Relevansi (`POST /api/jobs/feedback`) | M4 | P1 | ✅ Selesai |
| **BE-12** | Rate Limiting & Audit Kepatuhan Privasi Data | M4 | P1 | 📋 Siap Ditingkatkan (Edge) |
| **BE-13** | Pembuatan Adapter HTTP Client pada FE & Uji Integrasi E2E | M5 | P0 | ✅ Selesai |

---

## 3. Rincian Lengkap Task Backend

### Milestone 1: Fondasi Proyek, Database Serverless, & Master Taksonomi

#### Task BE-01: Inisialisasi Arsitektur Backend Serverless & Konfigurasi Lingkungan
- **ID & Judul**: `BE-01` - Inisialisasi Arsitektur Backend Serverless & Konfigurasi Lingkungan
- **Tujuan & Fitur FE**: Menyediakan fondasi serverless runtime di Next.js App Router, mengelola environment variables, dan memastikan konfigurasi build serta linting bersih.
- **Ruang Lingkup**:
  - Konfigurasi `.env.example` dan `.env.local` untuk `MONGODB_URI`, `MONGODB_DB_NAME`, `GEMINI_API_KEY`.
  - Penyesuaian `src/middleware.ts` agar route handler di `/api/*` tidak terblokir oleh middleware i18n (`next-intl`).
  - Verifikasi kompatibilitas TypeScript dan linting ESLint.
- **Dependensi**: Tidak ada.
- **API/Model/Service**: `.env.example`, `.env.local`, `src/middleware.ts`.
- **Acceptance Criteria**:
  1. File `.env.example` terdokumentasi rapi dan `.env.local` diabaikan oleh `.gitignore`.
  2. Middleware melewasi rute `/api/*` tanpa melakukan locale redirect.
  3. `npm run typecheck` dan `npm run lint` berjalan dengan 0 error dan 0 warning.
- **Skenario Verifikasi**:
  - Jalankan `npm run build` dan pastikan rute `/api/*` terdaftar sebagai dynamic server-rendered routes.
- **Risiko / Asumsi**:
  - Kredensial production harus disimpan di secrets manager platform hosting (misal Vercel Environment Variables).

---

#### Task BE-02: Setup Koneksi MongoDB Serverless & Skema Lowongan Kerja
- **ID & Judul**: `BE-02` - Setup Koneksi MongoDB Serverless & Skema Lowongan Kerja
- **Tujuan & Fitur FE**: Menghubungkan aplikasi ke MongoDB Serverless (MongoDB Atlas) dengan *connection pooling* ramah lambda dan menyediakan data lowongan kerja sintetis (Fitur F01, F12, F16).
- **Ruang Lingkup**:
  - Implementasi `src/lib/server/db/mongodb.ts` menggunakan pola `globalThis._mongoClientPromise` untuk mencegah koneksi berulang pada masa *hot-reload* dev dan *lambda warm instance*.
  - Implementasi modul `src/lib/server/db/jobs.ts` dengan fungsi `getAllJobs()` dan `seedJobsIfEmpty()`.
  - Otomatisasi *seeding* 14 lowongan kerja sintetis awal ke koleksi `jobs` jika koleksi masih kosong, lengkap dengan indeks unik pada field `id`.
  - Mekanisme *fallback* anggun jika `MONGODB_URI` belum diisi (menggunakan static seed data tanpa membuat server crash).
- **Dependensi**: BE-01.
- **API/Model/Service**: `src/lib/server/db/mongodb.ts`, `src/lib/server/db/jobs.ts`, skema `Job`.
- **Acceptance Criteria**:
  1. Ketika `MONGODB_URI` valid diberikan, aplikasi terhubung ke MongoDB Atlas Serverless dalam waktu < 2 detik.
  2. Koleksi `jobs` otomatis terisi 14 data lowongan kerja sintetis pada pemanggilan pertama.
  3. Jika `MONGODB_URI` kosong, fungsi `getAllJobs()` mengembalikan fallback data tanpa melempar unhandled exception.
- **Skenario Verifikasi**:
  - Panggil `getAllJobs()` saat DB kosong -> periksa log seeding dan jumlah dokumen lowongan yang kembali.
- **Risiko / Asumsi**:
  - Akses network ke MongoDB Atlas memerlukan whitelist IP (`0.0.0.0/0` untuk deployment serverless dinamis).

---

#### Task BE-03: Master Taksonomi Keterampilan & Normalisasi Alias (ESCO-based)
- **ID & Judul**: `BE-03` - Master Taksonomi Keterampilan & Normalisasi Alias (ESCO-based)
- **Tujuan & Fitur FE**: Menstandarisasi penamaan keahlian agar variasi penulisan seperti "JS", "Postgres", "React.js" dipetakan secara akurat ke label kanonikal lowongan kerja (Fitur F09, F10, F11).
- **Ruang Lingkup**:
  - Kamus alias normalisasi keahlian (20 alias umum di bidang teknologi).
  - Fungsi `normalizeSkill(s: string): string` yang melakukan trim, lowercase, dan substitusi alias.
  - Algoritma pencarian keahlian terdekat `closestSkill(s: string)` berbasis jarak Levenshtein untuk mendeteksi typo (misal: "Postgre" -> "PostgreSQL", "Pyhton" -> "Python").
  - Verifikasi keahlian yang dikenal melalui `isKnownSkill(s: string)`.
- **Dependensi**: BE-01.
- **API/Model/Service**: `src/lib/scoring.ts` (`ALIASES`, `normalizeSkill`), `src/lib/skills.ts`.
- **Acceptance Criteria**:
  1. Input variasi seperti `"js"`, `"ReactJS"`, `"psql"` dipetakan ke `"javascript"`, `"react"`, dan `"postgresql"`.
  2. Input dengan typo 1–2 karakter mengembalikan nama kanonikal yang tepat.
- **Skenario Verifikasi**:
  - Seluruh pengujian unit di `tests/unit/skills.test.ts` lulus 100%.
- **Risiko / Asumsi**:
  - Daftar alias dapat diperluas seiring bertambahnya lowongan non-IT di masa depan.

---

### Milestone 2: Fitur Ekstraksi CV Berbasis AI

#### Task BE-04: Layanan Parsing PDF Ephemeral & Sanitasi Berkas
- **ID & Judul**: `BE-04` - Layanan Parsing PDF Ephemeral & Sanitasi Berkas
- **Tujuan & Fitur FE**: Mengekstrak teks dari berkas PDF secara aman di dalam memori tanpa meninggalkan jejak di penyimpanan disk (Fitur F04, F05).
- **Ruang Lingkup**:
  - Implementasi `src/lib/server/services/pdf.ts` berbasis kelas `PDFParse`.
  - Pengecekan magic bytes binary PDF (`%PDF-`).
  - Pembersihan buffer memori via `parser.destroy()` setelah selesai parsing.
  - Pembatasan panjang teks maksimal (50.000 karakter) guna mencegah serangan *token exhaustion* / prompt injection.
- **Dependensi**: BE-01.
- **API/Model/Service**: `src/lib/server/services/pdf.ts`.
- **Acceptance Criteria**:
  1. File bukan PDF atau file PDF korup melempar error deskriptif yang tertangkap secara aman.
  2. Teks terekstrak bersih dari karakter kontrol yang merusak JSON parser.
  3. Tidak ada berkas sementara (*temporary files*) yang tersisa di disk server.
- **Skenario Verifikasi**:
  - Uji dengan buffer `%PDF-1.4 ...` -> teks terekstrak dengan benar.
  - Uji dengan buffer teks acak non-PDF -> melempar error `Invalid PDF header signature`.
- **Risiko / Asumsi**:
  - Dokumen PDF berupa scan murni tanpa text-layer memerlukan OCR di masa depan.

---

#### Task BE-05: Integrasi LLM Google Gemini untuk Ekstraksi Profil Terstruktur
- **ID & Judul**: `BE-05` - Integrasi LLM Google Gemini untuk Ekstraksi Profil Terstruktur
- **Tujuan & Fitur FE**: Mengonversi teks bebas riwayat hidup menjadi objek profil terstruktur (`Profile`) dengan nama, pendidikan, pengalaman, proyek, dan daftar keahlian (Fitur F05).
- **Ruang Lingkup**:
  - Integrasi SDK `@google/genai` dengan model `gemini-3.5-flash` (didukung fallback `gemini-3.5-flash-lite`, `gemini-3.8-flash`).
  - Perancangan System Prompt yang menginstruksikan ekstraksi field: `name`, `education`, `experience`, `projects`, dan `skills` (maksimal 50 item).
  - Konfigurasi parameter inferensi: `responseMimeType: "application/json"` dan `temperature: 0.1` untuk output deterministik.
  - Pembersihan array keahlian dan pemfilteran string kosong.
- **Dependensi**: BE-01, BE-04.
- **API/Model/Service**: `src/lib/server/services/gemini.ts`.
- **Acceptance Criteria**:
  1. Output yang dihasilkan selalu berupa objek JSON valid yang mematuhi skema `profileSchema`.
  2. Field `skills` berupa array string dengan maksimal 50 item.
  3. Jika `GEMINI_API_KEY` tidak tersedia, melempar error konfigurasi yang jelas.
- **Skenario Verifikasi**:
  - Berikan input teks CV mahasiswa -> Gemini menghasilkan JSON profil lengkap dalam waktu < 4 detik.
- **Risiko / Asumsi**:
  - Kuota Google AI Studio Free Tier (15 RPM / 1M TPM) memadai untuk tahap MVP.

---

#### Task BE-06: Endpoint API Ekstraksi CV (`POST /api/cv/extract`)
- **ID & Judul**: `BE-06` - Endpoint API Ekstraksi CV (`POST /api/cv/extract`)
- **Tujuan & Fitur FE**: Titik masuk HTTP untuk menerima file CV dari pengguna dan mengembalikan profil yang terekstrak (Fitur F04, F05).
- **Ruang Lingkup**:
  - Route handler `src/app/api/cv/extract/route.ts`.
  - Validasi form-data: keberadaan field `file`, mime-type (`application/pdf`), dan ukuran berkas (<= 5 MB / 5.242.880 bytes).
  - Orkestrasi `extractTextFromPdf()` dan `extractProfileWithGemini()`.
  - Fallback deterministik di lingkungan development jika `GEMINI_API_KEY` belum dipasang.
  - Penanganan error terstandarisasi dengan kode status HTTP yang tepat (400, 413, 422, 500).
- **Dependensi**: BE-04, BE-05.
- **API/Model/Service**: `POST /api/cv/extract`.
- **Acceptance Criteria**:
  1. Upload tanpa file mengembalikan HTTP 400.
  2. Upload file non-PDF mengembalikan HTTP 400.
  3. Upload file > 5 MB mengembalikan HTTP 413.
  4. Upload file PDF valid mengembalikan HTTP 200 dengan payload JSON profil lengkap.
- **Skenario Verifikasi**:
  - Jalankan pengujian unit di `tests/unit/api.test.ts`.
- **Risiko / Asumsi**:
  - Klien dapat membatalkan request melalui `AbortController` saat loading.

---

### Milestone 3: Fitur Pencocokan Lowongan & Scoring Engine

#### Task BE-07: Mesin Perhitungan Skor Kecocokan Keterampilan (Maks 60 Poin)
- **ID & Judul**: `BE-07` - Mesin Perhitungan Skor Kecocokan Keterampilan (Maks 60 Poin)
- **Tujuan & Fitur FE**: Menghitung porsi skor keahlian (bobot 60%) secara transparan antara profil pengguna dan syarat lowongan (Fitur F11, F12, F13).
- **Ruang Lingkup**:
  - Normalisasi setiap keahlian profil melalui `normalizeSkill()`.
  - Perhitungan irisan himpunan (*set intersection*):
    - $\text{matchedSkills} = \text{job.skills} \cap \text{profile.skills}$
    - $\text{missingSkills} = \text{job.skills} \setminus \text{profile.skills}$
    - $\text{overlap} = |\text{matchedSkills}| / |\text{job.skills}|$
    - $\text{skillPoints} = \text{round}(60 \times \text{overlap})$
- **Dependensi**: BE-03.
- **API/Model/Service**: `src/lib/scoring.ts` (`scoreJob`).
- **Acceptance Criteria**:
  1. Poin keahlian selalu berupa bilangan bulat dalam rentang 0 s.d. 60 poin.
  2. Lowongan dengan 100% keahlian cocok menghasilkan tepat 60 poin.
- **Skenario Verifikasi**:
  - Unit test `tests/unit/scoring.test.ts` (suite `scoreJob` dan `score breakdown`).
- **Risiko / Asumsi**:
  - Keahlian yang tidak cocok menjadi dasar rekomendasi pada fitur *Skill Gap*.

---

#### Task BE-08: Mesin Perhitungan Kemiripan Teks Bilingual (Maks 40 Poin)
- **ID & Judul**: `BE-08` - Mesin Perhitungan Kemiripan Teks Bilingual (Maks 40 Poin)
- **Tujuan & Fitur FE**: Menghitung porsi skor pengalaman dan proyek (bobot 40%) secara adil terhadap deskripsi lowongan bahasa Indonesia maupun bahasa Inggris (Fitur F11, F12, F13).
- **Ruang Lingkup**:
  - Penggabungan teks profil: `experience + projects + education`.
  - Ekstraksi token kata (panjang > 2 karakter, lowercase Unicode).
  - Perhitungan token overlap terhadap `job.title + job.summary.id` dan `job.title + job.summary.en`.
  - Pemilihan skor maksimal di antara kedua bahasa: $\text{Sim} = \max(\text{Sim}_{\text{id}}, \text{Sim}_{\text{en}})$.
  - Perhitungan poin: $\text{textPoints} = \text{round}(40 \times \text{Sim})$.
  - Penentuan enum `textLevel` (`"high"`, `"some"`, `"low"`, `"empty"`).
- **Dependensi**: BE-01.
- **API/Model/Service**: `src/lib/scoring.ts` (`textSimilarity`, `textLevelFor`).
- **Acceptance Criteria**:
  1. Poin teks selalu berupa bilangan bulat dalam rentang 0 s.d. 40 poin.
  2. Profil dengan teks kosong menghasilkan 0 poin dan `textLevel: "empty"`.
  3. Profil berbahasa Indonesia dinilai secara objektif terhadap `summary.id`.
- **Skenario Verifikasi**:
  - Unit test `tests/unit/scoring.test.ts` (suite `text similarity`).
- **Risiko / Asumsi**:
  - Algoritma token overlap leksikal dapat ditingkatkan menjadi dense vector embeddings pada fase berikutnya.

---

#### Task BE-09: Endpoint API Rekomendasi & Pemeringkatan Lowongan (`POST /api/jobs/match`)
- **ID & Judul**: `BE-09` - Endpoint API Rekomendasi & Pemeringkatan Lowongan (`POST /api/jobs/match`)
- **Tujuan & Fitur FE**: Menilai profil pengguna terhadap seluruh data lowongan kerja di MongoDB dan mengembalikan 10 lowongan teratas (Fitur F11, F12, F13, F14, F16).
- **Ruang Lingkup**:
  - Route handler `src/app/api/jobs/match/route.ts`.
  - Validasi payload request body menggunakan `profileSchema`.
  - Pengambilan data lowongan kerja via `getAllJobs()`.
  - Eksekusi fungsi `rankJobs(profile, jobs)`:
    - Pemfilteran lowongan dengan minimal 1 keahlian cocok (`matchedSkills.length >= 1`).
    - Penentuan label reason (`"strong"`, `"partial"`, `"weak"`).
    - Pengurutan menurun berdasarkan `score`, lalu alfabetis berdasarkan `title`.
    - Pembatasan maksimal 10 lowongan (`TOP_N = 10`).
- **Dependensi**: BE-02, BE-07, BE-08.
- **API/Model/Service**: `POST /api/jobs/match`, `matchResultSchema`.
- **Acceptance Criteria**:
  1. Payload profil valid mengembalikan HTTP 200 dengan array maksimal 10 `MatchResult`.
  2. Seluruh lowongan yang dikembalikan memiliki `matchedSkills.length >= 1`.
  3. Payload profil tidak valid mengembalikan HTTP 400 beserta rincian kesalahan Zod.
- **Skenario Verifikasi**:
  - Jalankan `tests/unit/api.test.ts` untuk route `POST /api/jobs/match`.
- **Risiko / Asumsi**:
  - Jika tidak ada lowongan yang cocok sama sekali, endpoint mengembalikan array kosong `[]` (memicu empty state FE).

---

#### Task BE-10: Endpoint Katalog Keterampilan Dinamis (`GET /api/skills`)
- **ID & Judul**: `BE-10` - Endpoint Katalog Keterampilan Dinamis (`GET /api/skills`)
- **Tujuan & Fitur FE**: Menyediakan daftar keahlian unik kanonikal dan keahlian populer dari database lowongan untuk mendukung datalist autocomplete dan saran keahlian di FE (Fitur F09, F10).
- **Ruang Lingkup**:
  - Route handler `src/app/api/skills/route.ts`.
  - Agregasi daftar keahlian unik terurut alfabetis (`canonical`).
  - Perhitungan frekuensi kemunculan keahlian di seluruh lowongan untuk menghasilkan 12 keahlian terpopuler (`popular`).
  - Penerapan HTTP cache header `Cache-Control: public, s-maxage=3600`.
- **Dependensi**: BE-02.
- **API/Model/Service**: `GET /api/skills`.
- **Acceptance Criteria**:
  1. Mengembalikan HTTP 200 dengan objek `{ canonical: string[], popular: string[] }`.
  2. Respon memiliki header Cache-Control yang sesuai.
- **Skenario Verifikasi**:
  - Jalankan `tests/unit/api.test.ts` untuk route `GET /api/skills`.
- **Risiko / Asumsi**:
  - Tidak ada risiko signifikan.

---

### Milestone 4: Fitur Umpan Balik, Keamanan, & Privasi

#### Task BE-11: Endpoint & Penyimpanan Umpan Balik Relevansi (`POST /api/jobs/feedback`)
- **ID & Judul**: `BE-11` - Endpoint & Penyimpanan Umpan Balik Relevansi (`POST /api/jobs/feedback`)
- **Tujuan & Fitur FE**: Mencatat umpan balik kepuasan pengguna terhadap hasil kecocokan suatu lowongan (Fitur F19).
- **Ruang Lingkup**:
  - Route handler `src/app/api/jobs/feedback/route.ts`.
  - Validasi payload: `jobId` (string) dan `helpful` (boolean).
  - Pengecekan IP klien untuk hashing anonymized (`ipHash`) guna pencegahan spam tanpa melanggar privasi pengguna.
  - Penyimpanan ke koleksi `feedback` di MongoDB via `saveFeedback()`.
- **Dependensi**: BE-02.
- **API/Model/Service**: `POST /api/jobs/feedback`, model `FeedbackRecord`.
- **Acceptance Criteria**:
  1. Payload valid mengembalikan HTTP 200 `{ "success": true }` dan data tercatat di MongoDB.
  2. Payload tanpa `jobId` atau `helpful` mengembalikan HTTP 400.
- **Skenario Verifikasi**:
  - Jalankan `tests/unit/api.test.ts` untuk route `POST /api/jobs/feedback`.
- **Risiko / Asumsi**:
  - Data feedback sepenuhnya terputus dari identitas pribadi kandidat.

---

#### Task BE-12: Rate Limiting & Audit Kepatuhan Privasi Data
- **ID & Judul**: `BE-12` - Rate Limiting & Audit Kepatuhan Privasi Data
- **Tujuan & Fitur FE**: Melindungi endpoint publik dari penyalahgunaan (DDoS dan pembengkakan kuota LLM) serta menjamin kepatuhan privasi (Prinsip Produk 3).
- **Ruang Lingkup**:
  - Pembatasan laju request (Rate Limiting) per IP:
    - `/api/cv/extract`: maksimal 5 request per menit.
    - `/api/jobs/match`: maksimal 30 request per menit.
    - `/api/jobs/feedback`: maksimal 20 request per menit.
  - Audit logging pada semua route handlers untuk memastikan tidak ada pencatatan body CV atau PII (Personally Identifiable Information).
- **Dependensi**: BE-06, BE-09, BE-11.
- **API/Model/Service**: Middleware proteksi / Edge rate limiting.
- **Acceptance Criteria**:
  1. Pengiriman berulang yang melebihi batas kuota ditolak dengan HTTP 429 Too Many Requests.
  2. File log server (stdout/stderr) bersih dari teks dokumen CV.
- **Skenario Verifikasi**:
  - Uji penembakan request berturut-turut pada endpoint ekstraksi CV.
- **Risiko / Asumsi**:
  - Di platform seperti Vercel, rate limiting tingkat lanjut dapat dikonfigurasi melalui Vercel Edge Middleware atau Upstash Redis.

---

### Milestone 5: Integrasi FE-BE & Validasi Kontrak

#### Task BE-13: Pembuatan Adapter HTTP Client pada FE & Uji Integrasi E2E
- **ID & Judul**: `BE-13` - Pembuatan Adapter HTTP Client pada FE & Uji Integrasi E2E
- **Tujuan & Fitur FE**: Mengalihkan antarmuka frontend dari data mock ke pemanggilan API Route Handlers backend nyata (Semua Fitur F01–F23).
- **Ruang Lingkup**:
  - Implementasi `src/lib/api/http.ts` yang mematuhi antarmuka `Api` di `src/lib/api/client.ts`.
  - Dukungan penanganan `opts.signal` (AbortController) dan error mapping ke `ApiError("extract_failed" | "match_failed" | "aborted")`.
  - Konfigurasi di `src/lib/api/mock.ts` agar secara default menggunakan `httpApi`, dengan opsi beralih ke `mockApi` jika `NEXT_PUBLIC_USE_MOCK === "true"`.
  - Eksekusi pengujian Playwright E2E dan Vitest.
- **Dependensi**: BE-06, BE-09, BE-11.
- **API/Model/Service**: `src/lib/api/http.ts`, `src/lib/api/mock.ts`.
- **Acceptance Criteria**:
  1. Frontend dapat melakukan alur lengkap: upload PDF -> review profil -> melihat rekomendasi lowongan -> membuka detail lowongan -> mengirim feedback.
  2. Seluruh 31 unit test di Vitest lulus 100%.
- **Skenario Verifikasi**:
  - Jalankan `npm run test` dan `npm run build` untuk memverifikasi seluruh komponen terintegrasi tanpa galat.
- **Risiko / Asumsi**:
  - Kompatibilitas browser modern terhadap FormData dan Fetch API.

---

## 4. Matriks Prioritas (P0, P1, P2)

### Prioritas P0 (Kritis / MVP Core)
Komponen yang mutlak diperlukan agar aplikasi berfungsi sebagai produk yang hidup:
- **BE-01**: Inisialisasi Serverless Runtime & Environment.
- **BE-02**: Koneksi MongoDB Serverless & Seeding Lowongan.
- **BE-03**: Master Taksonomi Keterampilan ESCO.
- **BE-04**: Parsing PDF Ephemeral in-memory.
- **BE-05**: Integrasi LLM Google Gemini.
- **BE-06**: Route Handler Ekstraksi CV (`POST /api/cv/extract`).
- **BE-07**: Mesin Poin Keterampilan (60 Poin).
- **BE-08**: Mesin Kemiripan Teks Bilingual (40 Poin).
- **BE-09**: Route Handler Matching Lowongan (`POST /api/jobs/match`).
- **BE-13**: Integrasi HTTP Client Frontend ke Backend.

### Prioritas P1 (Tinggi / Keamanan & Feedback)
Komponen yang menjaga ketahanan operasional dan pengumpulan data produk:
- **BE-11**: Route Handler Feedback Relevansi Lowongan (`POST /api/jobs/feedback`).
- **BE-12**: Rate Limiting & Audit Privasi Data.

### Prioritas P2 (Penyempurnaan & Skalabilitas)
Fitur pendukung dan optimasi performa jangka panjang:
- **BE-10**: Route Handler Katalog Keterampilan Dinamis (`GET /api/skills`).
- *Penyempurnaan Pasca-MVP*: Vector Embeddings untuk kalkulasi kemiripan semantik teks.

---

## 5. Pertanyaan Kunci dan Keputusan Teknis

1. **Arsitektur Tunggal vs Terpisah**:
   - *Keputusan*: Disatukan (*monolith serverless*) di dalam Next.js Route Handlers (`src/app/api/...`). Memudahkan *single deployment*, eliminasi isu CORS, dan berbagi tipe data/skema Zod secara langsung.
2. **Provider LLM**:
   - *Keputusan*: Dipilih **Google Gemini (`gemini-1.5-flash`)** karena memiliki Free Tier resmi di Google AI Studio (15 RPM / 1M TPM) dan latensi inferensi yang sangat cepat.
3. **Penyimpanan Database**:
   - *Keputusan*: **MongoDB Serverless / Atlas** dengan mekanisme auto-seed jika database baru pertama kali dijalankan. Terdapat graceful fallback jika kredensial DB belum diisi di lingkungan lokal.
4. **Privasi Dokumen CV**:
   - *Keputusan*: Dokumen CV diproses *ephemeral* di memori RAM dan segera dilepaskan setelah teks terekstrak. Tidak ada file PDF yang disimpan ke disk atau cloud bucket.
