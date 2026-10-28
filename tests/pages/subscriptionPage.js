import { expect } from "@playwright/test";
export class SubscriptionPage {
  constructor(page) {
    this.page = page;
    this.heading = page.getByRole("heading", {
      name: "Subscriptions",
      exact: true,
    });
    this.statusFilter = page.locator(
      "//select[@aria-label='Filter by status']",
    );
    this.statusFilterBill = page.locator(
      "(//select[@aria-label='Filter by billing cycle'])[1]",
    );
  }
  async open() {
    const subscriptionLink = this.page.getByRole("link", {
      name: "Subscriptions",
      exact: true,
    });

    await subscriptionLink.click();
    // Wait for the Subscription page
    await expect(this.page).toHaveURL(/\/subscriptions$/, { timeout: 15000 });
    await expect(this.heading).toBeVisible({ timeout: 15000 });
    await expect(this.statusFilter).toBeVisible({ timeout: 15000 });
    await expect(this.statusFilterBill).toBeVisible({ timeout: 15000 });
  }

  async verifyPageLoaded() {
    await expect(this.page).toHaveURL(/\/subscriptions$/);
    await expect(this.heading).toBeVisible({ timeout: 15000 });
    await expect(this.statusFilter).toBeVisible({ timeout: 15000 });
    await expect(this.statusFilterBill).toBeVisible({ timeout: 15000 });
  }

  //   Select status Filter
  async selectStatusFilter(status) {
    const statusValues = {
      Active: "active",
      Paused: "paused",
      Cancelled: "cancelled",
      Expired: "expired",
    };

    const expectedStatus = statusValues[status];

    if (!expectedStatus) {
      throw new Error(`Unsupported Subscription status: ${status}`);
    }
    await this.statusFilter.selectOption(expectedStatus);
    await expect(this.page).toHaveURL(
      new RegExp(`[?&]status=${expectedStatus}(&|$)`),
      { timeout: 10000 },
    );
    await this.page.waitForTimeout(3000);
  }

  //   Select status Filter Bill
  async selectStatusFilterBill(status) {
    const statusValues = {
      Monthly: "monthly",
      Quarterly: "quarterly",
      Yearly: "yearly",
    };

    const expectedStatus = statusValues[status];
    if (!expectedStatus) {
      throw new Error(`Unsupported Subscription bill filter status: ${status}`);
    }
    await this.statusFilterBill.selectOption(expectedStatus);
    await expect(this.page).toHaveURL(
      new RegExp(`[?&]billingCycle=${expectedStatus}(&|$)`),
      { timeout: 10000 },
    );
    await this.page.waitForTimeout(3000);
  }
}
