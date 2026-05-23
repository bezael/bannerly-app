import { test, expect } from "@playwright/test";

// Smoke test de referencia. El agente debe AÑADIR un spec nuevo para el
// feature que implemente, ejercitando su golden path para que quede grabado.
test("home renders the Bannerly heading", async ({ page }) => {
  await page.goto("/");
  await expect(page.getByRole("heading", { level: 1 })).toBeVisible();
});
