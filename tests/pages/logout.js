import { expect } from "@playwright/test";

export class LogoutPage {
  constructor(page) {
    this.page = page;
    this.menu = page.getByRole("button", { name: "Open user menu" });
    this.logout = page.getByRole("menuitem", { name: "Sign out" });
  }

  async logoutApplication() {
    await this.menu.click();
    await this.logout.click();
    await expect(this.page).toHaveURL(/\/login(?:\/|$|\?)/, {
      timeout: 15000,
    });
  }
}
