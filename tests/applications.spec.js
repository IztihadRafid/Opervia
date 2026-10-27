import { test, expect } from "@playwright/test";
import { LoginPage } from "./pages/loginPage";
import { ApplicationsPage } from "./pages/applicationsPage";

test("Application status filters work", async ({ page }) => {
  await page.goto("https://opervia-five.vercel.app/login");

  const loginPage = new LoginPage(page);
  await loginPage.loginApplication();

  await expect(page).toHaveURL(/\/dashboard$/);
  await expect(
    page.getByRole("heading", {
      name: "Dashboard",
      exact: true,
    }),
  ).toBeVisible({ timeout: 15000 });

  await page.waitForTimeout(4000);
  const applicationsPage = new ApplicationsPage(page);
  await applicationsPage.open();

  // Application page render
  await applicationsPage.verifyPageLoaded();
  await page.waitForTimeout(4000);

  // Select All statuses and wait 3 seconds
  await applicationsPage.statusFilter.selectOption("");
  await page.waitForTimeout(3000);
  await expect(applicationsPage.statusFilter).toHaveValue("");

  //  Select Active and wait 3 seconds
  await applicationsPage.selectStatusFilter("Active");
  await expect(applicationsPage.statusFilter).toHaveValue("active");

  //  Select Inactive and wait 3 seconds
  await applicationsPage.selectStatusFilter("Inactive");
  await expect(applicationsPage.statusFilter).toHaveValue("inactive");

  // Select Archived and wait 3 seconds
  await applicationsPage.selectStatusFilter("Archived");
  await expect(applicationsPage.statusFilter).toHaveValue("archived");
});
