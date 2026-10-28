import { test, expect } from "@playwright/test";
import { LoginPage } from "./pages/loginPage";
import { ApplicationsPage } from "./pages/applicationsPage";

test("Edit application test", async ({ page }) => {
  await page.goto("https://opervia-five.vercel.app/login");
  const loginPage = new LoginPage(page);
  await loginPage.loginApplication();
  const applicationsPage = new ApplicationsPage(page);
  await applicationsPage.open();
  const currentName = "Test App 1793180292694";
  const updatedName = "Test App Edit 1793180292694";
  await applicationsPage.editApplication({
    currentName,
    updatedName,
  });
  const updatedRow = page.getByRole("row").filter({
    has: page.getByText(updatedName, { exact: true }),
  });

  await expect(updatedRow).toBeVisible({ timeout: 15000 });
  await expect(updatedRow).toContainText("Dell Technologies");
  await expect(updatedRow).toContainText("Inactive");
  await page.reload();
  const persistedRow = page.getByRole("row").filter({
    has: page.getByText(updatedName, { exact: true }),
  });
  await expect(persistedRow).toBeVisible({ timeout: 15000 });
  await expect(persistedRow).toContainText("Dell Technologies");
  await expect(persistedRow).toContainText("Inactive");
});
