# Product

<!-- impeccable:product-schema 1 -->

## Platform

web

## Users

University students, fresh graduates, and early job seekers in Indonesia who are unsure which of their skills the job market actually asks for. They arrive with a CV (PDF) or a rough list of skills, and want to know which jobs fit and what to learn next.

## Product Purpose

SkillMatch AI matches a person's skills to job listings and shows where to grow. The user uploads a CV or enters a profile; the app extracts structured information with an LLM, ranks the Top 10 jobs with a 0 to 100 score, and explains each result. Success means the user understands why a job fits and which skills to build, not only that a list was returned.

## Positioning

Every result shows the skill gap (matching skills vs skills to learn) and a plain reason for the score, with skill names normalized to the ESCO taxonomy so equivalent terms compare equal. A generic job portal lists openings; this product explains the fit and points to what to learn.

## Operating Context

Four steps, each its own URL: upload CV (or enter a profile manually), review and correct the extracted profile, see the Top 10 results, open a job for its detail and skill gap. CV extraction uses an LLM (Gemini or OpenAI, undecided). Matching combines skill overlap, semantic similarity, and ranking against a static job dataset in MongoDB. No real-time job feeds.

## Capabilities and Constraints

- CV upload: PDF only, max 5 MB. Extraction failure must offer retry and manual input.
- Results: Top 10 jobs, score 0 to 100, matching skills, skills to learn, short reason.
- Out of scope for the MVP: job-portal integration, auto-apply, acceptance prediction, career chatbot, fine-tuning, real-time recommendations.
- Stack: Next.js, TypeScript, Tailwind CSS; frontend currently runs on mock data behind a typed API layer (`web/src/lib/api`).
- Undecided: LLM provider, where embeddings run, final scoring formula, dataset sufficiency, authentication for match history.

## Brand Commitments

- Product name: SkillMatch AI (working name; it lives only in `messages/*.json`, so it can change).
- Tagline: "Tahu yang cocok. Tahu yang perlu dipelajari." / "Know what fits. Know what to learn next."
- Identity, voice, logo usage, and assets: see `BRAND.md` at the project root.
- UI languages: Indonesian (default) and English, kept in parity.

## Evidence on Hand

`PRD.md`, `UX-AUDIT.md`, the Figma file (Direction A, Trust Blue), and the working prototype in `web/`. There are no testimonials, user counts, real employers, or real job listings. Prototype listings are synthetic and must never be presented as real openings; do not invent proof, customers, or statistics.

## Product Principles

1. Explain the score; never show a number without a reason.
2. Frame the skill gap as direction for learning, not as a judgment of the person.
3. Treat the CV as private: not stored, not logged, held only in the browser session.
4. Be honest about synthetic data and the limits of the AI.

## Accessibility & Inclusion

WCAG 2.1 AA is the required standard: sufficient contrast, visible focus, 44px touch targets, no meaning carried by color alone, errors announced to assistive technology. Many users are on phones, so mobile use is first-class.
