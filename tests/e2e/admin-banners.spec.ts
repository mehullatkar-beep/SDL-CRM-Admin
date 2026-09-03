import { expect, test } from "@playwright/test";

test("admin can create a banner and see it on Active", async ({ page }, testInfo) => {
  test.skip(testInfo.project.name === "mobile", "Desktop banner admin flow");
  const name = `Diwali ${Date.now().toString().slice(-8)}`;

  await page.goto("/login");
  await page.getByLabel("Work email").fill("admin@sdl.local");
  await page.getByLabel("Password").fill("Admin123!");
  await page.getByRole("button", { name: "Continue" }).click();
  await expect(page).toHaveURL(/\/catalog\/tests/);

  await page.getByRole("link", { name: "Banners", exact: true }).click();
  await expect(page.getByRole("heading", { name: "Banners", exact: true })).toBeVisible();
  await page.getByRole("link", { name: "New banner" }).click();
  await expect(page.getByRole("heading", { name: "New banner" })).toBeVisible();

  await page.getByLabel("Name").fill(name);
  await page.getByLabel("Headline").fill("Happy Diwali from SDL");
  await page.getByRole("switch", { name: "In-app notification" }).click();
  await page.getByRole("button", { name: "Create banner" }).click();

  await expect(page).toHaveURL(/\/banners$/);
  await expect(page.getByText(name, { exact: true })).toBeVisible();
  await expect(page.getByText("Home and inbox", { exact: true })).toBeVisible();
});

test("CRM cannot create or save banners", async ({ page }, testInfo) => {
  test.skip(testInfo.project.name === "mobile", "Desktop CRM view-only");
  await page.goto("/login");
  await page.getByLabel("Work email").fill("crm@sdl.local");
  await page.getByLabel("Password").fill("Crm123!");
  await page.getByRole("button", { name: "Continue" }).click();
  await expect(page).toHaveURL(/\/catalog\/tests/);

  await page.getByRole("link", { name: "Banners", exact: true }).click();
  await expect(page.getByRole("heading", { name: "Banners", exact: true })).toBeVisible();
  await expect(page.getByRole("link", { name: "New banner" })).toHaveCount(0);

  await page.goto("/banners/new");
  await expect(page).toHaveURL(/\/banners$/);
});
