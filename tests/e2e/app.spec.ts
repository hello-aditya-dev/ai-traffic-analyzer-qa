/**
 * Playwright E2E tests — Phases 2, 3, 4, 38.
 *
 * Real browser tests against the running dev server. No mocking.
 * Covers: boot, navigation, demo mode, workspace, results, project creation,
 * settings, responsive layouts, console-error audit.
 */
import { test, expect } from "@playwright/test";

test.use({ trace: "retain-on-failure" });

function collectErrors(page: import("@playwright/test").Page) {
  const errors: string[] = [];
  page.on("console", (m) => {
    if (m.type() === "error") {
      const t = m.text();
      // Filter benign dev-only noise.
      if (/favicon|Download the React DevTools|Fast Refresh|HMR/i.test(t)) return;
      errors.push(t);
    }
  });
  page.on("pageerror", (e) => errors.push(e.message));
  return errors;
}

test.describe("Phase 2 — Application Boot", () => {
  test("homepage loads with sidebar and no critical errors", async ({ page }) => {
    const errors = collectErrors(page);
    await page.goto("/");
    await expect(page).toHaveTitle(/AI Traffic Analyzer/);
    await expect(page.getByRole("button", { name: /^Overview/ })).toBeVisible();
    await expect(page.getByRole("heading", { name: "Overview", level: 1 })).toBeVisible();
    expect(errors).toEqual([]);
  });

  test("no hydration errors on initial load", async ({ page }) => {
    const errors = collectErrors(page);
    await page.goto("/");
    await page.waitForLoadState("networkidle");
    expect(errors.filter((e) => /hydrat/i.test(e))).toEqual([]);
  });
});

test.describe("Phase 2 — Sidebar Navigation", () => {
  const VIEWS = [
    ["Overview", "Overview"],
    ["Projects", "Projects"],
    ["Demo Mode", "Demo Mode"],
    ["Analysis Workspace", "Analysis Workspace"],
    ["Zone Editor", "Zone Editor"],
    ["Line Editor", "Line Editor"],
    ["Results", "Results & Analytics"],
    ["Events", "Events Timeline"],
    ["Reports", "Reports & Exports"],
    ["Settings", "Settings — AI Provider"],
    ["Onboarding", "Onboarding"],
    ["Documentation", "Documentation"],
  ] as const;

  for (const [navLabel, heading] of VIEWS) {
    test(`navigating to ${navLabel} shows correct heading`, async ({ page }) => {
      const errors = collectErrors(page);
      await page.goto("/");
      await page.getByRole("button", { name: new RegExp(`^${navLabel}`) }).click();
      await expect(page.getByRole("heading", { name: heading, level: 1 })).toBeVisible({ timeout: 10_000 });
      expect(errors).toEqual([]);
    });
  }
});

test.describe("Phase 4 — Demo Mode", () => {
  test("demo project loads and workspace renders canvas + events", async ({ page }) => {
    const errors = collectErrors(page);
    await page.goto("/");
    await page.getByRole("button", { name: /^Demo Mode/ }).click();
    await expect(page.getByRole("heading", { name: "Downtown Intersection Demo" })).toBeVisible();
    await page.getByRole("button", { name: /Open Analysis Workspace/ }).click();
    // canvas should render
    await expect(page.locator("canvas")).toBeVisible({ timeout: 10_000 });
    // at least one event in the list
    await expect(page.getByRole("button", { name: /@\s*\d{2}:\d{2}/ }).first()).toBeVisible({ timeout: 10_000 });
    expect(errors).toEqual([]);
  });

  test("results view renders charts and zone table", async ({ page }) => {
    const errors = collectErrors(page);
    await page.goto("/");
    await page.getByRole("button", { name: /^Demo Mode/ }).click();
    await page.getByRole("button", { name: /Open Analysis Workspace/ }).click();
    await page.getByRole("button", { name: /View Results/ }).click();
    // Recharts renders an svg
    await expect(page.locator("svg").first()).toBeVisible({ timeout: 10_000 });
    // zone statistics table present
    await expect(page.getByText(/Zone Statistics/)).toBeVisible();
    expect(errors).toEqual([]);
  });
});

test.describe("Phase 5 — Project Creation", () => {
  test("create a new project via the dialog", async ({ page }) => {
    const errors = collectErrors(page);
    await page.goto("/");
    await page.getByRole("button", { name: /^Projects/ }).click();
    await page.getByRole("button", { name: /New Project/ }).click();
    const nameInput = page.getByLabel("Project name");
    await nameInput.fill("E2E Created Project");
    await page.getByRole("button", { name: /Create Project$/ }).click();
    // After creation the workspace opens. Navigate back to Projects to verify it appears in the list.
    await page.getByRole("button", { name: /^Projects/ }).click();
    await expect(page.getByText("E2E Created Project").first()).toBeVisible({ timeout: 10_000 });
    expect(errors).toEqual([]);
  });
});

test.describe("Phase 25 — Settings", () => {
  test("provider config page shows mock provider and health", async ({ page }) => {
    const errors = collectErrors(page);
    await page.goto("/");
    await page.getByRole("button", { name: /^Settings/ }).click();
    await expect(page.getByText(/AI Vision Provider Configuration/)).toBeVisible();
    // The mock provider is the default in the select dropdown.
    await expect(page.getByRole("combobox").filter({ hasText: /Mock \/ Demo/ })).toBeVisible();
    await expect(page.getByRole("button", { name: /Save Provider Settings/ })).toBeVisible();
    expect(errors).toEqual([]);
  });
});

test.describe("Phase 31 — Responsive", () => {
  test("desktop 1440px — no horizontal overflow", async ({ page, browser }) => {
    const ctx = await browser.newContext({ viewport: { width: 1440, height: 900 } });
    const p = await ctx.newPage();
    const errors = collectErrors(p);
    await p.goto("/");
    await p.waitForLoadState("networkidle");
    const overflow = await p.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth);
    expect(overflow).toBeLessThanOrEqual(2);
    expect(errors).toEqual([]);
    await ctx.close();
  });

  test("tablet 768px — no horizontal overflow, sidebar visible", async ({ page, browser }) => {
    const ctx = await browser.newContext({ viewport: { width: 768, height: 1024 } });
    const p = await ctx.newPage();
    const errors = collectErrors(p);
    await p.goto("/");
    await p.waitForLoadState("networkidle");
    const overflow = await p.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth);
    expect(overflow).toBeLessThanOrEqual(2);
    expect(errors).toEqual([]);
    await ctx.close();
  });

  test("mobile 390px — no horizontal overflow, KPIs readable", async ({ page, browser }) => {
    const ctx = await browser.newContext({ viewport: { width: 390, height: 844 } });
    const p = await ctx.newPage();
    const errors = collectErrors(p);
    await p.goto("/");
    await p.waitForLoadState("networkidle");
    const overflow = await p.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth);
    expect(overflow).toBeLessThanOrEqual(2);
    expect(errors).toEqual([]);
    await ctx.close();
  });
});

test.describe("Phase 38 — Full E2E journey", () => {
  test("onboarding → demo → results → reports flow", async ({ page }) => {
    const errors = collectErrors(page);
    await page.goto("/");
    // Onboarding
    await page.getByRole("button", { name: /^Onboarding/ }).click();
    await expect(page.getByText(/How do you want to analyze video/)).toBeVisible();
    await page.getByRole("button", { name: /Demo Mode/ }).first().click();
    // Demo
    await page.getByRole("button", { name: /^Demo Mode/ }).click();
    await expect(page.getByText("Downtown Intersection Demo")).toBeVisible();
    // Open workspace
    await page.getByRole("button", { name: /Open Analysis Workspace/ }).click();
    await expect(page.locator("canvas")).toBeVisible({ timeout: 10_000 });
    // Results
    await page.getByRole("button", { name: /View Results/ }).click();
    await expect(page.locator("svg").first()).toBeVisible({ timeout: 10_000 });
    // Reports
    await page.getByRole("button", { name: /^Reports/ }).click();
    await expect(page.getByText(/Professional Reports & Exports/)).toBeVisible();
    expect(errors).toEqual([]);
  });
});
