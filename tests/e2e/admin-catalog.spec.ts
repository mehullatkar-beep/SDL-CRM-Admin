import { expect, test } from "@playwright/test";

test("admin shell is aligned and catalog navigation works", async ({ page }, testInfo) => {
  test.skip(testInfo.project.name === "mobile", "Desktop shell alignment");
  await page.goto("/login");
  await page.getByLabel("Work email").fill("admin@sdl.local");
  await page.getByLabel("Password").fill("Admin123!");
  await page.getByRole("button", { name: "Continue" }).click();
  await expect(page).toHaveURL(/\/catalog\/tests/);

  const header = page.locator("header").first();
  const sidebarHeader = page.locator('[data-slot="sidebar-header"]');
  await expect(header).toBeVisible();
  await expect(sidebarHeader).toBeVisible();
  expect(await header.evaluate((node) => node.getBoundingClientRect().height)).toBe(64);
  expect(await sidebarHeader.evaluate((node) => node.getBoundingClientRect().height)).toBe(64);

  await page.getByRole("link", { name: "Packages" }).click();
  await expect(page.getByRole("heading", { name: "Packages" })).toBeVisible();
});

test("mobile navigation and public catalog contract respond", async ({ page }, testInfo) => {
  test.skip(testInfo.project.name !== "mobile", "Mobile flow");
  await page.goto("/login");
  await page.getByLabel("Work email").fill("crm@sdl.local");
  await page.getByLabel("Password").fill("Crm123!");
  await page.getByRole("button", { name: "Continue" }).click();
  await expect(page).toHaveURL(/\/catalog\/tests/);
  await page.locator('[data-slot="sidebar-trigger"]').click();
  const mobileSidebar = page.locator('[data-mobile="true"]');
  if ((await mobileSidebar.count()) === 0) {
    const diagnostics = await page.evaluate(() => ({
      innerWidth,
      mediaMatches: matchMedia("(max-width: 767px)").matches,
      sidebarSlots: Array.from(document.querySelectorAll('[data-slot="sidebar"]')).map((node) => ({
        mobile: node.getAttribute("data-mobile"),
        state: node.getAttribute("data-state"),
        className: node.className,
      })),
    }));
    throw new Error(`Mobile sidebar was not mounted: ${JSON.stringify(diagnostics)}`);
  }
  await expect(mobileSidebar).toBeVisible();
  await expect(mobileSidebar.getByRole("link", { name: "Packages" })).toBeVisible();

  const response = await page.request.get("/api/v1/catalog/packages?page=1&pageSize=10");
  expect(response.ok()).toBeTruthy();
  const body = await response.json();
  expect(body).toMatchObject({ data: expect.any(Array), meta: { page: 1, pageSize: 10 } });
});
