import { test, expect } from "@playwright/test";
import { LoginPage } from "./pages/loginPage";
import { ApplicationsPage } from "./pages/applicationsPage";

test("Create application test", async ({ page }) => {
  await page.goto("https://opervia-five.vercel.app/login");

  const loginPage = new LoginPage(page);
  await loginPage.loginApplication();
  const applicationsPage = new ApplicationsPage(page);
  await applicationsPage.open();
  const applicationName = `Test App ${Date.now()}`;
  await applicationsPage.openCreateForm();

  await applicationsPage.fillCreateForm({
    name: applicationName,
  });

  await applicationsPage.submitCreateForm();

  // Verify successful creation
  await expect(
    page.getByRole("status").filter({
      hasText: "Application created successfully.",
    }),
  ).toBeVisible({ timeout: 15000 });

  await expect(
    page.getByRole("cell").filter({
      hasText: applicationName,
    }),
  ).toBeVisible({ timeout: 15000 });
  await page.reload();

  await expect(
    page.getByRole("cell").filter({
      hasText: applicationName,
    }),
  ).toBeVisible({ timeout: 15000 });
});
