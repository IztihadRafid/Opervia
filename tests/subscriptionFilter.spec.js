import { test, expect } from "@playwright/test";
import { LoginPage } from "./pages/loginPage";
import { SubscriptionPage } from "./pages/subscriptionPage";

test("Subscriptions status filters work", async ({ page }) => {
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
  const subscriptionPage = new SubscriptionPage(page);
  await subscriptionPage.open();
  await subscriptionPage.verifyPageLoaded();
  await page.waitForTimeout(4000);
  await subscriptionPage.statusFilter.selectOption("");
  await page.waitForTimeout(3000);
  await expect(subscriptionPage.statusFilter).toHaveValue("");
  await subscriptionPage.selectStatusFilter("Active");
  await expect(subscriptionPage.statusFilter).toHaveValue("active");
  await subscriptionPage.selectStatusFilter("Paused");
  await expect(subscriptionPage.statusFilter).toHaveValue("paused");
  await subscriptionPage.selectStatusFilter("Cancelled");
  await expect(subscriptionPage.statusFilter).toHaveValue("cancelled");
  await subscriptionPage.selectStatusFilter("Expired");
  await expect(subscriptionPage.statusFilter).toHaveValue("expired");
});
