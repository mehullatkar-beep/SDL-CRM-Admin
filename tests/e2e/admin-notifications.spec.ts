import { expect, test } from "@playwright/test";

test("admin can turn a notification trigger off", async ({ page }, testInfo) => {
  test.skip(testInfo.project.name === "mobile", "Desktop notification admin flow");

  await page.goto("/login");
  await page.getByLabel("Work email").fill("admin@sdl.local");
  await page.getByLabel("Password").fill("Admin123!");
  await page.getByRole("button", { name: "Continue" }).click();
  await expect(page).toHaveURL(/\/catalog\/tests/);

  await page.getByRole("link", { name: "Notifications", exact: true }).click();
  await expect(page.getByRole("heading", { name: "Notifications", exact: true })).toBeVisible();
  await expect(page.getByText("Common", { exact: true })).toBeVisible();

  const resultsReady = page.getByRole("switch", { name: "Results ready" });
  if (!(await resultsReady.isChecked())) {
    await resultsReady.click();
  }
  await expect(resultsReady).toBeChecked();
  await resultsReady.click();
  await expect(resultsReady).not.toBeChecked();

  await page.reload();
  await expect(page.getByRole("switch", { name: "Results ready" })).not.toBeChecked();
});

test("CRM cannot change notification triggers", async ({ page }, testInfo) => {
  test.skip(testInfo.project.name === "mobile", "Desktop CRM view-only");
  await page.goto("/login");
  await page.getByLabel("Work email").fill("crm@sdl.local");
  await page.getByLabel("Password").fill("Crm123!");
  await page.getByRole("button", { name: "Continue" }).click();
  await expect(page).toHaveURL(/\/catalog\/tests/);

  await page.getByRole("link", { name: "Notifications", exact: true }).click();
  await expect(page.getByRole("heading", { name: "Notifications", exact: true })).toBeVisible();
  await expect(page.getByRole("switch", { name: "Results ready" })).toBeDisabled();
});
