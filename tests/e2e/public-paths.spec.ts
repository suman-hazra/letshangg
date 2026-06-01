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

    await expect(
      page.getByRole("heading", {
        name: /plans feel easier\s+when they're mutual/i,
      }),
    ).toBeVisible();
    await expect(
      page.getByRole("link", { name: /find a hang/i }),
    ).toBeVisible();
  });

  test("PWA manifest is public and installable", async ({ page }) => {
    const response = await page.goto("/manifest.webmanifest");

    expect(response?.ok()).toBe(true);
    expect(await response?.headerValue("content-type")).toContain(
      "application/manifest+json",
    );

    const manifest = JSON.parse(await page.locator("body").innerText());
    expect(manifest).toMatchObject({
      name: "letshangg",
      short_name: "letshangg",
      start_url: "/",
      display: "standalone",
    });
    expect(manifest.icons).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          src: "/pwa-icon-192.png",
          sizes: "192x192",
        }),
        expect.objectContaining({
          src: "/pwa-maskable-512.png",
          sizes: "512x512",
          purpose: "maskable",
        }),
      ]),
    );
  });

  test("desktop pages do not advertise PWA install", async ({ page }) => {
    await page.setViewportSize({ width: 1280, height: 900 });
    await page.goto("/");

    await expect(page.locator('head link[rel="manifest"]')).toHaveCount(0);
  });

  test("mobile pages advertise PWA install", async ({ page }) => {
    await page.setViewportSize({ width: 390, height: 844 });
    await page.goto("/");

    await expect(page.locator('head link[rel="manifest"]')).toHaveAttribute(
      "href",
      "/manifest.webmanifest",
    );
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
    await expect(page).toHaveURL(/\/login(\?next=.*)?$/);
  });

  test("proxy redirects unauthenticated /onboarding/profile to /login", async ({
    page,
  }) => {
    await page.goto("/onboarding/profile");
    await expect(page).toHaveURL(/\/login(\?next=.*)?$/);
  });

  test("proxy redirects unauthenticated /friends to /login with next= param", async ({
    page,
  }) => {
    await page.goto("/friends");
    // Should land on /login with the original path preserved
    await expect(page).toHaveURL(/\/login\?next=%2Ffriends$/);
  });

  test("proxy redirects unauthenticated /i/anyone to /login with next= preserved", async ({
    page,
  }) => {
    await page.goto("/i/dustin");
    await expect(page).toHaveURL(/\/login\?next=%2Fi%2Fdustin$/);
  });

  test("design system tokens render: warm background + DM Serif headline", async ({
    page,
  }) => {
    await page.goto("/");

    // Landing uses the bright PWA opening-screen gradient.
    const bgImage = await page.evaluate(() =>
      getComputedStyle(document.querySelector("main")!).backgroundImage,
    );
    expect(bgImage).toContain("linear-gradient");

    // Headline uses the landing Poppins variable.
    const headlineFont = await page.evaluate(() => {
      const h1 = document.querySelector("h1");
      return h1 ? getComputedStyle(h1).fontFamily : "";
    });
    expect(headlineFont.toLowerCase()).toContain("poppins");
  });
});
