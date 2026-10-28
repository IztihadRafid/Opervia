import { expect } from "@playwright/test";

export class ApplicationsPage {
  constructor(page) {
    this.page = page;
    this.heading = page.getByRole("heading", {
      name: "Applications",
      exact: true,
    });
    this.statusFilter = page.locator(
      "//select[@aria-label='Filter by status']",
    );
  }

  async open() {
    const applicationsLink = this.page.getByRole("link", {
      name: "Applications",
      exact: true,
    });

    await applicationsLink.click();
    // Wait for the Applications page
    await expect(this.page).toHaveURL(/\/applications$/, {
      timeout: 15000,
    });
    await expect(this.heading).toBeVisible({
      timeout: 15000,
    });
    await expect(this.statusFilter).toBeVisible({
      timeout: 15000,
    });
  }

  async verifyPageLoaded() {
    await expect(this.page).toHaveURL(/\/applications$/);
    await expect(this.heading).toBeVisible({
      timeout: 15000,
    });
    await expect(this.statusFilter).toBeVisible({
      timeout: 15000,
    });
  }

  async selectStatusFilter(status) {
    const statusValues = {
      Active: "active",
      Inactive: "inactive",
      Archived: "archived",
    };

    const expectedStatus = statusValues[status];

    if (!expectedStatus) {
      throw new Error(`Unsupported application status: ${status}`);
    }
    await this.statusFilter.selectOption(expectedStatus);
    await expect(this.page).toHaveURL(
      new RegExp(`[?&]status=${expectedStatus}(&|$)`),
      { timeout: 10000 },
    );
    await this.page.waitForTimeout(3000);
  }

  // creating application
  async openCreateForm() {
    await this.page
      .getByRole("button", { name: "Add application" })
      .first()
      .click();

    await expect(
      this.page.getByRole("heading", {
        name: "Add an application",
        exact: true,
      }),
    ).toBeVisible();
  }

  async fillCreateForm({ name }) {
    await this.page.getByPlaceholder("e.g. Slack").fill(name);
    await this.page.locator("(//select)[2]").selectOption({ label: "ASUS" });
    await this.page
      .locator("(//select)[3]")
      .selectOption({ label: "Hardware" });
  }

  async submitCreateForm() {
    await this.page.getByRole("button", { name: "Create application" }).click();
  }

  async editApplication({ currentName, updatedName }) {
    await this.page
      .locator(`(//button[@aria-label='Edit ${currentName}'])[1]`)
      .click();
    await this.page.getByPlaceholder("e.g. Slack").fill(updatedName);
    await this.page
      .locator("(//select)[2]")
      .selectOption({ label: "Dell Technologies" });
    await this.page
      .locator("(//select)[4]")
      .selectOption({ label: "Inactive" });
    await this.page
      .getByPlaceholder("What is this application used for?")
      .fill("edited data");
    await this.page
      .getByRole("button", {
        name: "Save changes",
        exact: true,
      })
      .click();
  }
}
