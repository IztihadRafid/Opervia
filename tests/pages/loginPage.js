import { expect } from "@playwright/test";

export class LoginPage {
  constructor(page) {
    this.page = page;
    this.email = "//input[@id='email']";
    this.password = "//input[@id='password']";
    this.loginButton = "//button[normalize-space()='Sign in']";
  }

  async loginApplication() {
    await this.page.locator(this.email).fill(process.env.EMAIL_OWNER);
    await this.page.locator(this.password).fill(process.env.PASSWORD_OWNER);
    await this.page.locator(this.loginButton).click();

    await expect(this.page).toHaveURL(/\/dashboard/, {
      timeout: 15000,
    });
  }
}
