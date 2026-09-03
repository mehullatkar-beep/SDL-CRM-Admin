import { expect, test } from "@playwright/test";

test("admin can create a coupon and see it on Active", async ({ page }, testInfo) => {
  test.skip(testInfo.project.name === "mobile", "Desktop coupon admin flow");
  const code = `E2E${Date.now().toString().slice(-8)}`;
  const name = `Welcome ${code}`;

  await page.goto("/login");
  await page.getByLabel("Work email").fill("admin@sdl.local");
  await page.getByLabel("Password").fill("Admin123!");
  await page.getByRole("button", { name: "Continue" }).click();
  await expect(page).toHaveURL(/\/catalog\/tests/);

  await page.getByRole("link", { name: "Coupons", exact: true }).click();
  await expect(page.getByRole("heading", { name: "Coupons", exact: true })).toBeVisible();
  await page.getByRole("link", { name: "New coupon" }).click();
  await expect(page.getByRole("heading", { name: "New coupon" })).toBeVisible();

  await page.getByLabel("Name").fill(name);
  await page.getByLabel("Code").fill(code);
  await page.getByRole("button", { name: "Create coupon" }).click();

  await expect(page).toHaveURL(/\/coupons$/);
  await expect(page.getByText(name, { exact: true })).toBeVisible();
  await expect(page.getByText(code, { exact: true })).toBeVisible();
});

test("CRM cannot create or save coupons", async ({ page }, testInfo) => {
  test.skip(testInfo.project.name === "mobile", "Desktop CRM view-only");
  await page.goto("/login");
  await page.getByLabel("Work email").fill("crm@sdl.local");
  await page.getByLabel("Password").fill("Crm123!");
  await page.getByRole("button", { name: "Continue" }).click();
  await expect(page).toHaveURL(/\/catalog\/tests/);

  await page.getByRole("link", { name: "Coupons", exact: true }).click();
  await expect(page.getByRole("heading", { name: "Coupons", exact: true })).toBeVisible();
  await expect(page.getByRole("link", { name: "New coupon" })).toHaveCount(0);

  await page.goto("/coupons/new");
  await expect(page).toHaveURL(/\/coupons$/);
});
