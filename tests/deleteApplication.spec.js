import { test, expect } from "@playwright/test";
import { LoginPage } from "./pages/loginPage";
import { ApplicationsPage } from "./pages/applicationsPage";

test("Delete application test", async ({ page }) => {
  await page.goto("https://opervia-five.vercel.app/login");
  const loginPage = new LoginPage(page);
  await loginPage.loginApplication();
  const applicationsPage = new ApplicationsPage(page);
  await applicationsPage.open();
  const applicationName = "Test App Edit 1793180292694";
  await applicationsPage.deleteApplication(applicationName);
  await page.reload();
  await expect(
    page.getByRole("row").filter({
      has: page.getByText(applicationName, {
        exact: true,
      }),
    }),
  ).toHaveCount(0, { timeout: 15000 });
});
