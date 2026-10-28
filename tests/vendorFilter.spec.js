import { test, expect } from "@playwright/test";
import { LoginPage } from "./pages/loginPage";
import { VendorPage } from "./pages/vendorPage";

test("Vendor status filters work", async ({ page }) => {
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
  const vendorPage = new VendorPage(page);
  await vendorPage.open();
  await vendorPage.verifyPageLoaded();
  await page.waitForTimeout(4000);
  await vendorPage.selectStatusFilter("All");
  await expect(vendorPage.statusFilter).toHaveValue("all");
  await vendorPage.selectStatusFilter("Active");
  await expect(vendorPage.statusFilter).toHaveValue("active");
  await vendorPage.selectStatusFilter("Inactive");
  await expect(vendorPage.statusFilter).toHaveValue("inactive");
});
