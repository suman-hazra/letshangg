import { test, expect } from "@playwright/test";

/**
 * Public-path E2E smoke tests.
 *
 * NOTE: Full happy-path E2E through Google OAuth (sign-in → onboarding →
 * preferences → match) requires automating the Google sign-in flow, which is
 * impractical for a portfolio project (TOTP, captcha, anti-bot). The honest
 * scope is: verify the public surface (landing, login, proxy redirect),
 * which catches design-system regressions and routing breaks.
 *
 * For a manual end-to-end demo, walk through the flow yourself in a real
 * browser with the live Supabase project. The unit tests in lib/*.test.ts
 * cover the matcher logic.
 */

test.describe("public paths", () => {
  test("landing page renders the editorial composition", async ({ page }) => {
    await page.goto("/");

    await expect(page.getByText("letshangg")).toBeVisible();
    await expect(
      page.getByRole("heading", { name: /plans that/i }),
    ).toBeVisible();
    await expect(
      page.getByRole("link", { name: /get started/i }),
    ).toBeVisible();
  });

  test("login page renders the Google CTA", async ({ page }) => {
    await page.goto("/login");

    await expect(
      page.getByRole("heading", { name: /sign in/i }),
    ).toBeVisible();
    await expect(
      page.getByRole("button", { name: /continue with google/i }),
    ).toBeVisible();
  });

  test("proxy redirects unauthenticated /home to /login", async ({ page }) => {
    await page.goto("/home");
    await expect(page).toHaveURL(/\/login$/);
  });

  test("proxy redirects unauthenticated /onboarding/profile to /login", async ({
    page,
  }) => {
    await page.goto("/onboarding/profile");
    await expect(page).toHaveURL(/\/login$/);
  });

  test("design system tokens render: warm background + DM Serif headline", async ({
    page,
  }) => {
    await page.goto("/");

    // Background is the warm off-white token.
    const bgColor = await page.evaluate(() =>
      getComputedStyle(document.body).backgroundColor,
    );
    // Either rgb(247, 245, 242) or the same hex resolved.
    expect(bgColor).toMatch(/247.*245.*242/);

    // Headline uses our DM Serif Display variable.
    const headlineFont = await page.evaluate(() => {
      const h1 = document.querySelector("h1");
      return h1 ? getComputedStyle(h1).fontFamily : "";
    });
    expect(headlineFont.toLowerCase()).toContain("dm serif");
  });
});
