import { test, expect } from "@playwright/test";
import { LoginPage } from "./pages/loginPage";
import { VendorPage } from "./pages/vendorPage";

test("Vendor search filters work", async ({ page }) => {
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

  const searchTerm = "test search vendor";
  await vendorPage.searchVendors(searchTerm);
  await expect(vendorPage.searchInput).toHaveValue(searchTerm);
  await expect(
    page.getByRole("heading", {
      name: "No matching vendors",
      exact: true,
    }),
  ).toBeVisible({ timeout: 15000 });
  await vendorPage.searchVendors("");
  await expect(vendorPage.searchInput).toHaveValue("");
  await expect(page).not.toHaveURL(/[?&]search=/);
});
