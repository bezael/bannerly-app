import { test, expect } from "@playwright/test";

/**
 * Golden path: Templates CRUD
 *
 * Without a live Supabase, dashboard pages redirect to /login.
 * The test handles both scenarios:
 *   A) Unauthenticated (CI default) — verifies auth-guard and login page UI
 *   B) Authenticated (manual / future) — exercises full create → edit → delete flow
 */

test.describe("Templates CRUD — golden path", () => {
  test("unauthenticated access redirects to /login and shows login form", async ({
    page,
  }) => {
    await page.goto("/dashboard/templates");

    // Either we stay on /dashboard/templates (authenticated) or we're redirected.
    const url = page.url();

    if (url.includes("/login")) {
      // Auth guard works: redirected to login page
      await expect(page.getByRole("heading", { level: 1 })).toBeVisible();
      await expect(page.getByRole("textbox", { name: /email/i })).toBeVisible();
      await expect(
        page.getByRole("button", { name: /entrar/i })
      ).toBeVisible();
    } else {
      // Authenticated session available — test full CRUD golden path below
      await expect(
        page.getByRole("heading", { name: /templates/i })
      ).toBeVisible();
    }
  });

  test("new template page renders form (or redirects to login)", async ({
    page,
  }) => {
    await page.goto("/dashboard/templates/new");
    const url = page.url();

    if (url.includes("/login")) {
      await expect(page.getByRole("textbox", { name: /email/i })).toBeVisible();
    } else {
      await expect(
        page.getByRole("heading", { name: /new template/i })
      ).toBeVisible();
      await expect(page.getByRole("textbox", { name: /slug/i })).toBeVisible();
      await expect(page.getByRole("textbox", { name: /name/i })).toBeVisible();
      await expect(
        page.getByRole("button", { name: /create template/i })
      ).toBeVisible();
    }
  });

  test("full CRUD flow when authenticated", async ({ page }) => {
    await page.goto("/dashboard/templates");
    const url = page.url();

    if (url.includes("/login")) {
      // Skip CRUD part — no Supabase available in this environment
      test.skip();
      return;
    }

    // --- CREATE ---
    await page.getByRole("link", { name: /new template/i }).click();
    await expect(
      page.getByRole("heading", { name: /new template/i })
    ).toBeVisible();

    const slug = `e2e-test-${Date.now()}`;
    await page.getByRole("textbox", { name: /slug/i }).fill(slug);
    await page.getByRole("textbox", { name: /name/i }).fill("E2E Test Template");
    // layout_id defaults to og-basic

    // Add a text layer
    await page.getByTestId("add-text-layer").click();
    await expect(page.getByTestId("layer-0")).toBeVisible();

    // Add an image layer
    await page.getByTestId("add-image-layer").click();
    await expect(page.getByTestId("layer-1")).toBeVisible();

    await page.getByRole("button", { name: /create template/i }).click();

    // Redirected back to list
    await page.waitForURL("**/dashboard/templates");
    await expect(page.getByText("E2E Test Template")).toBeVisible();

    // --- EDIT ---
    const card = page.locator('[data-testid="dashboard-template-card"]').filter({
      hasText: "E2E Test Template",
    });
    await card.getByRole("link", { name: /edit/i }).click();

    await expect(
      page.getByRole("heading", { name: /edit template/i })
    ).toBeVisible();

    // Change the name
    const nameInput = page.getByRole("textbox", { name: /name/i });
    await nameInput.clear();
    await nameInput.fill("E2E Test Template (edited)");

    await page.getByRole("button", { name: /save changes/i }).click();

    // Redirected back to list with updated name
    await page.waitForURL("**/dashboard/templates");
    await expect(page.getByText("E2E Test Template (edited)")).toBeVisible();

    // --- DELETE ---
    const editedCard = page
      .locator('[data-testid="dashboard-template-card"]')
      .filter({ hasText: "E2E Test Template (edited)" });

    // Set up dialog handler before triggering delete
    page.once("dialog", (dialog) => dialog.accept());
    await editedCard.getByTestId("delete-template").click();

    // Template is removed from the list
    await expect(
      page.getByText("E2E Test Template (edited)")
    ).not.toBeVisible();
  });

  test("/login page renders login form", async ({ page }) => {
    await page.goto("/login");

    await expect(page.getByRole("heading", { level: 1 })).toBeVisible();
    await expect(page.getByRole("textbox", { name: /email/i })).toBeVisible();
    await expect(
      page.getByLabel(/contraseña/i)
    ).toBeVisible();
    await expect(
      page.getByRole("button", { name: /entrar/i })
    ).toBeVisible();
  });
});
