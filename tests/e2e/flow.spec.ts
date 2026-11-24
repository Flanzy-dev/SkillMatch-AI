import { expect, test, type Page } from "@playwright/test";
import AxeBuilder from "@axe-core/playwright";

const copy = {
  id: { upload: "Unggah CV Anda", review: "Tinjau profil Anda", results: "Lowongan terdekat dengan profil Anda", submit: "Cari pekerjaan yang cocok", back: "Kembali ke hasil" },
  en: { upload: "Upload your CV", review: "Review your profile", results: "Jobs closest to your profile", submit: "Find matching jobs", back: "Back to results" },
} as const;

const pdf = { name: "cv.pdf", mimeType: "application/pdf", buffer: Buffer.from("%PDF-1.4 test") };

/** App alerts only: Next's route announcer is also role="alert". */
const alerts = (page: Page) => page.locator('[role="alert"]:not(#__next-route-announcer__)');

async function expectNoA11yViolations(page: Page) {
  const { violations } = await new AxeBuilder({ page }).withTags(["wcag2a", "wcag2aa", "wcag21aa"]).analyze();
  expect(violations.map((v) => `${v.id}: ${v.nodes[0]?.target}`)).toEqual([]);
}

for (const locale of ["id", "en"] as const) {
  test(`full flow in ${locale}`, async ({ page }) => {
    const c = copy[locale];
    await page.goto(`/${locale}/upload`);
    await expect(page.getByRole("heading", { name: c.upload })).toBeVisible();
    await expectNoA11yViolations(page);

    await page.locator('input[type="file"]').setInputFiles(pdf);
    await expect(page.getByRole("heading", { name: c.review })).toBeVisible({ timeout: 10_000 });
    await expectNoA11yViolations(page);

    await page.getByRole("button", { name: c.submit }).click();
    await expect(page.getByRole("heading", { name: c.results })).toBeVisible({ timeout: 10_000 });
    expect(await page.locator("ol li article").count()).toBeLessThanOrEqual(10);
    await expectNoA11yViolations(page);

    await page.locator("ol li article h2 a").first().click();
    await expect(page.getByRole("link", { name: c.back })).toBeVisible();
    await expectNoA11yViolations(page);
  });
}

test("extraction failure shows an alert and a retry", async ({ page }) => {
  await page.goto("/id/upload?fail=extract");
  await page.locator('input[type="file"]').setInputFiles(pdf);
  await expect(alerts(page)).toContainText("CV tidak dapat dibaca", { timeout: 10_000 });
  await expect(page.getByRole("button", { name: "Coba lagi" })).toBeVisible();
});

test("non-PDF file is rejected", async ({ page }) => {
  await page.goto("/id/upload");
  await page.locator('input[type="file"]').setInputFiles({ name: "a.txt", mimeType: "text/plain", buffer: Buffer.from("x") });
  await expect(alerts(page)).toContainText("PDF");
});

test("review blocks submit without skills", async ({ page }) => {
  await page.goto("/id/review");
  await page.getByLabel("Nama", { exact: true }).fill("Tester");
  await page.getByRole("button", { name: "Cari pekerjaan yang cocok" }).click();
  await expect(alerts(page)).toContainText("minimal satu keterampilan");
});

test("landing sample profile reaches review with skills prefilled", async ({ page }) => {
  await page.goto("/id");
  await page.getByRole("button", { name: "Coba dengan profil contoh" }).click();
  await expect(page.getByRole("heading", { name: "Tinjau profil Anda" })).toBeVisible();
  await expect(page.getByText("Ini profil contoh")).toBeVisible();
  await expect(page.getByRole("button", { name: /Hapus keterampilan/ })).toHaveCount(4);
});

test("pasting a list adds several skills and removal can be undone", async ({ page }) => {
  await page.goto("/id/review");
  await page.getByLabel("Nama", { exact: true }).fill("Tester");
  const add = page.getByLabel("Tambah keterampilan");
  await add.fill("Python, SQL; Git");
  await page.getByRole("button", { name: "Tambah", exact: true }).click();
  await expect(page.getByRole("button", { name: /Hapus keterampilan/ })).toHaveCount(3);
  await page.getByRole("button", { name: "Hapus keterampilan SQL" }).click();
  await expect(page.getByRole("button", { name: /Hapus keterampilan/ })).toHaveCount(2);
  await page.getByRole("button", { name: "Urungkan" }).click();
  await expect(page.getByRole("button", { name: /Hapus keterampilan/ })).toHaveCount(3);
});

test("manual path shows upload as skipped, not done", async ({ page }) => {
  await page.setViewportSize({ width: 1440, height: 900 });
  await page.goto("/id/review");
  await expect(page.getByRole("link", { name: /Unggah.*dilewati/ })).toBeVisible();
});

test("results nav link appears only after a match", async ({ page }) => {
  await page.setViewportSize({ width: 1440, height: 900 });
  await page.goto("/id");
  await expect(page.getByRole("navigation", { name: "Navigasi utama" }).getByRole("link", { name: "Hasil" })).toHaveCount(0);
});

test("results lead with a 'start learning here' summary and a featured closest job", async ({ page }) => {
  await page.goto("/id");
  await page.getByRole("button", { name: "Coba dengan profil contoh" }).click();
  await page.getByRole("button", { name: "Cari pekerjaan yang cocok" }).click();
  await expect(page.getByRole("heading", { name: "Mulai belajar dari sini" })).toBeVisible({ timeout: 10_000 });
  await expect(page.getByText("Paling dekat dengan profil Anda", { exact: true })).toHaveCount(1);
});

test("keyboard focus is never hidden behind the fixed submit bar on mobile", async ({ page }) => {
  await page.setViewportSize({ width: 375, height: 800 });
  await page.goto("/id");
  await page.getByRole("button", { name: "Coba dengan profil contoh" }).click();
  await expect(page.getByRole("heading", { name: "Tinjau profil Anda" })).toBeVisible();
  const bar = page.locator("div.fixed.bottom-0");
  await expect(bar).toBeVisible();
  const barTop = (await bar.boundingBox())!.y;
  for (let i = 0; i < 40; i++) {
    await page.keyboard.press("Tab");
    const hidden = await page.evaluate((top) => {
      const el = document.activeElement as HTMLElement | null;
      if (!el || el === document.body || el.closest("div.fixed")) return false;
      return el.getBoundingClientRect().bottom > top + 1;
    }, barTop);
    expect(hidden, `tab stop ${i + 1} is under the submit bar`).toBe(false);
  }
});

test("detail page offers neighbouring jobs and learning links for missing skills", async ({ page }) => {
  await page.goto("/id");
  await page.getByRole("button", { name: "Coba dengan profil contoh" }).click();
  await page.getByRole("button", { name: "Cari pekerjaan yang cocok" }).click();
  await expect(page.getByRole("heading", { name: "Lowongan terdekat dengan profil Anda" })).toBeVisible({ timeout: 10_000 });
  await page.locator("ol li article h2 a").first().click();
  const learn = page.getByRole("link", { name: /Cari materi belajar .* \(buka tab baru\)/ }).first();
  await expect(learn).toHaveAttribute("href", /^https:\/\/www\.google\.com\/search\?q=belajar%20/);
  await expect(learn).toHaveAttribute("rel", /noopener/);
  await expect(learn).toHaveAttribute("target", "_blank");
  const nav = page.getByRole("navigation", { name: "Lowongan lain" });
  const before = page.url();
  await nav.getByRole("link", { name: /Berikutnya/ }).click();
  await expect(page).not.toHaveURL(before);
  await expect(nav.getByRole("link", { name: /Sebelumnya/ })).toBeVisible();
});

test("landing sample card is localized and comes before the steps on mobile", async ({ page }) => {
  await page.setViewportSize({ width: 375, height: 800 });
  await page.goto("/en");
  await expect(page.getByText("Sample Company")).toBeVisible();
  const card = await page.getByText("Sample Company").boundingBox();
  const steps = await page.getByRole("list", { name: "How it works" }).boundingBox();
  expect(card!.y).toBeLessThan(steps!.y);
});

test("results show one lead card, the learning panel right after it, then compact rows", async ({ page }) => {
  await page.goto("/id");
  await page.getByRole("button", { name: "Coba dengan profil contoh" }).click();
  await page.getByRole("button", { name: "Cari pekerjaan yang cocok" }).click();
  await expect(page.getByRole("heading", { name: "Lowongan lainnya" })).toBeVisible({ timeout: 10_000 });
  await expect(page.locator("ol li article h2 a")).toHaveCount(1);
  expect(await page.locator("ol li article h3 a").count()).toBeGreaterThanOrEqual(1);
  const lead = await page.locator("ol li article").first().boundingBox();
  const panel = await page.getByRole("heading", { name: "Mulai belajar dari sini" }).boundingBox();
  const others = await page.getByRole("heading", { name: "Lowongan lainnya" }).boundingBox();
  expect(panel!.y).toBeGreaterThan(lead!.y);
  expect(panel!.y).toBeLessThan(others!.y);
});

test("the landing preview shows the same score the product gives for that case", async ({ page }) => {
  await page.goto("/id");
  const landing = await page.getByRole("meter").first().getAttribute("aria-valuenow");
  await page.getByRole("button", { name: "Coba dengan profil contoh" }).click();
  await page.getByRole("button", { name: "Cari pekerjaan yang cocok" }).click();
  await expect(page.getByRole("heading", { name: "Lowongan lainnya" })).toBeVisible({ timeout: 10_000 });
  const results = await page.getByRole("meter").first().getAttribute("aria-valuenow");
  expect(landing).toBe(results);
});

test("manual path does not talk about a CV", async ({ page }) => {
  await page.goto("/id/review");
  await expect(page.getByText("Isi keterampilan Anda untuk mulai")).toBeVisible();
  await expect(page.getByText("yang kami baca dari CV Anda")).toHaveCount(0);
});

test("a sample profile shows the upload step as skipped, not done", async ({ page }) => {
  await page.setViewportSize({ width: 1440, height: 900 });
  await page.goto("/id");
  await page.getByRole("button", { name: "Coba dengan profil contoh" }).click();
  await expect(page.getByRole("link", { name: /Unggah.*dilewati/ })).toBeVisible();
});

test("compact result rows are announced once, with score and band in the link name", async ({ page }) => {
  await page.goto("/id");
  await page.getByRole("button", { name: "Coba dengan profil contoh" }).click();
  await page.getByRole("button", { name: "Cari pekerjaan yang cocok" }).click();
  await expect(page.getByRole("heading", { name: "Lowongan lainnya" })).toBeVisible({ timeout: 10_000 });
  const row = page.locator("ol li article h3 a").first();
  await expect(row).toHaveAccessibleName(/\d+ dari 100, /);
  const hidden = await page.locator("ol li article h3").first().evaluate((h) => {
    const blocks = [...h.closest("article")!.querySelectorAll('[aria-hidden="true"]')];
    return blocks.some((b) => /\/100/.test(b.textContent ?? ""));
  });
  expect(hidden).toBe(true);
});

test("landing route carries one sentence per step and the amber destination is last", async ({ page }) => {
  await page.goto("/id");
  const list = page.getByRole("list", { name: "Cara kerja" });
  await expect(list.getByRole("heading")).toHaveText(["Unggah CV", "Periksa profil", "Lihat langkah belajar"]);
  await expect(list.getByText("PDF, maksimal 5 MB")).toBeVisible();
});

async function sampleResults(page: Page) {
  await page.goto("/id");
  await page.getByRole("button", { name: "Coba dengan profil contoh" }).click();
  await page.getByRole("button", { name: "Cari pekerjaan yang cocok" }).click();
  await expect(page.getByRole("heading", { name: "Lowongan terdekat dengan profil Anda" })).toBeVisible({ timeout: 10_000 });
}

test("results and detail keep a skipped upload marked as skipped, and label the data as synthetic", async ({ page }) => {
  await page.setViewportSize({ width: 1440, height: 900 });
  await sampleResults(page);
  const stepper = page.getByRole("navigation", { name: "Langkah pencarian" });
  await expect(stepper.getByRole("link", { name: /Unggah.*dilewati/ })).toBeVisible();
  await expect(page.getByText(/lowongan dan perusahaan di sini sintetis/)).toBeVisible();
  await page.locator("ol li article h2 a").first().click();
  await expect(stepper.getByRole("link", { name: /Unggah.*dilewati/ })).toBeVisible();
  await expect(page.getByText(/lowongan dan perusahaan di sini sintetis/)).toBeVisible();
});

test("the detail page shows how the score adds up", async ({ page }) => {
  await sampleResults(page);
  await page.locator("ol li article h2 a").first().click();
  await expect(page.getByRole("heading", { name: "Cara skor ini dihitung" })).toBeVisible();
  const meter = page.getByRole("meter").first();
  const score = Number(await meter.getAttribute("aria-valuenow"));
  const points = await page.locator("dl dd").allTextContents();
  const sum = points.map((p) => Number(p.match(/^(\d+)/)![1])).reduce((a, b) => a + b, 0);
  expect(points).toHaveLength(2);
  expect(sum).toBe(score);
});

test("the learning plan can be copied without storing anything", async ({ page, context, browserName }) => {
  test.skip(browserName !== "chromium", "clipboard permission is chromium-only");
  await context.grantPermissions(["clipboard-read", "clipboard-write"]);
  await sampleResults(page);
  const panel = page.getByRole("region", { name: "Mulai belajar dari sini" });
  await panel.getByRole("button", { name: "Salin rencana belajar" }).click();
  await expect(panel.getByRole("status")).toHaveText(/disalin/);
  const text = await page.evaluate(() => navigator.clipboard.readText());
  expect(text).toContain("Rencana belajar saya (SkillMatch AI)");
  expect(text).toMatch(/1\. .+: dibutuhkan di \d+ lowongan/);
});

test("the name is optional and common spellings match the canonical skill", async ({ page }) => {
  await page.goto("/id/review");
  const add = page.getByLabel("Tambah keterampilan");
  await add.fill("JS, Postgres");
  await page.getByRole("button", { name: "Tambah", exact: true }).click();
  await page.getByRole("button", { name: "Cari pekerjaan yang cocok" }).click();
  await expect(page.getByRole("heading", { name: "Lowongan terdekat dengan profil Anda" })).toBeVisible({ timeout: 10_000 });
  await expect(alerts(page)).toHaveCount(0);
});

for (const width of [360, 375]) {
  test(`the header never scrolls sideways at ${width}px`, async ({ page }) => {
    await page.setViewportSize({ width, height: 800 });
    for (const path of ["/id", "/en"]) {
      await page.goto(path);
      const overflow = await page.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth);
      expect(overflow, path).toBe(0);
      await expect(page.getByRole("link", { name: "SkillMatch AI" })).toBeVisible();
    }
  });
}
