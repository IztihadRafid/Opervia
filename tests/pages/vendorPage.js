import { expect } from "@playwright/test";

export class VendorPage {
  constructor(page) {
    this.page = page;
    this.heading = page.getByRole("heading", {
      name: "Vendors",
      exact: true,
    });
    this.statusFilter = page.locator(
      "//select[@aria-label='Filter vendors by status']",
    );
    this.searchInput = page.getByRole("searchbox", {
      name: "Search vendors",
    });
  }

  async open() {
    const vendorsLink = this.page.getByRole("link", {
      name: "Vendors",
      exact: true,
    });

    await vendorsLink.click();
    // Wait for the Vendors page
    await expect(this.page).toHaveURL(/\/vendors$/, { timeout: 15000 });
    await this.verifyPageLoaded();
  }

  async verifyPageLoaded() {
    await expect(this.page).toHaveURL(/\/vendors$/, { timeout: 15000 });
    await expect(this.heading).toBeVisible({ timeout: 15000 });
    await expect(this.statusFilter).toBeVisible({ timeout: 15000 });
    await expect(this.searchInput).toBeVisible({ timeout: 15000 });
  }

  //   Select status Filter
  async selectStatusFilter(status) {
    const statusValues = {
      All: "all",
      Active: "active",
      Inactive: "inactive",
    };

    const expectedStatus = statusValues[status];

    if (!expectedStatus) {
      throw new Error(`Unsupported vendor status: ${status}`);
    }

    await this.statusFilter.selectOption(expectedStatus);

    if (expectedStatus === "all") {
      await expect(this.page).not.toHaveURL(/[?&]status=/, {
        timeout: 10000,
      });
    } else {
      await expect(this.page).toHaveURL(
        new RegExp(`[?&]status=${expectedStatus}(&|$)`),
        { timeout: 10000 },
      );
    }

    await this.page.waitForTimeout(3000);
  }

  //   Type a search term and wait for the URL
  async searchVendors(term) {
    await this.searchInput.fill(term);

    if (term) {
      await expect(this.page).toHaveURL(
        new RegExp(`[?&]search=${encodeURIComponent(term)}(&|$)`),
        { timeout: 10000 },
      );
    } else {
      await expect(this.page).not.toHaveURL(/[?&]search=/, {
        timeout: 10000,
      });
    }

    await this.page.waitForTimeout(3000);
  }
}
