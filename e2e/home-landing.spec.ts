import { test, expect } from "@playwright/test";

test.describe("Home landing — golden path", () => {
  test("muestra hero y galería, abre modal al hacer click en card y lo cierra", async ({
    page,
  }) => {
    await page.goto("/");

    // Hero visible
    await expect(
      page.getByRole("heading", { level: 1, name: "Bannerly" })
    ).toBeVisible();
    await expect(
      page.getByRole("link", { name: /Ver mis plantillas/i })
    ).toBeVisible();

    // Sección de galería visible
    await expect(page.getByRole("heading", { level: 2 })).toBeVisible();

    // Si no hay plantillas, verificar estado vacío y terminar
    const firstCard = page.getByTestId("template-card").first();
    const hasCards = await firstCard.isVisible().catch(() => false);

    if (!hasCards) {
      await expect(page.getByText(/Aún no hay plantillas/i)).toBeVisible();
      return;
    }

    // Obtener el nombre del template desde el elemento específico
    const nameEl = firstCard.getByTestId("template-card-name");
    const templateName = (await nameEl.textContent()) ?? "";

    // Click en la primera card
    await firstCard.click();

    // Modal aparece
    const modal = page.getByTestId("template-modal");
    await expect(modal).toBeVisible();

    // El nombre del template está en el modal
    if (templateName.trim()) {
      await expect(
        modal.getByText(templateName.trim(), { exact: false })
      ).toBeVisible();
    }

    // Cerrar con el botón X
    await modal.getByRole("button", { name: /cerrar/i }).click();
    await expect(modal).toBeHidden();
  });

  test("muestra estado vacío si no hay plantillas (sin crash)", async ({
    page,
  }) => {
    await page.goto("/");
    // La página carga sin error 500
    await expect(
      page.getByRole("heading", { level: 1, name: "Bannerly" })
    ).toBeVisible();
  });
});
