import { test, expect } from "@playwright/test";
import { LoginPage } from "./pages/loginPage";
import { SubscriptionPage } from "./pages/subscriptionPage";

test("Subscriptions Bill status filters work", async ({ page }) => {
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
  await subscriptionPage.statusFilterBill.selectOption("");
  await page.waitForTimeout(3000);
  await expect(subscriptionPage.statusFilterBill).toHaveValue("");
  await subscriptionPage.selectStatusFilterBill("Monthly");
  await expect(subscriptionPage.statusFilterBill).toHaveValue("monthly");
  await subscriptionPage.selectStatusFilterBill("Quarterly");
  await expect(subscriptionPage.statusFilterBill).toHaveValue("quarterly");
  await subscriptionPage.selectStatusFilterBill("Yearly");
  await expect(subscriptionPage.statusFilterBill).toHaveValue("yearly");
});
