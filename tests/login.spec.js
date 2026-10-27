import { test } from "@playwright/test";
import { LoginPage } from "./pages/loginPage";
import { LogoutPage } from "./pages/logout";

test("Login to Opervia test", async ({ page }) => {
  await page.goto("https://opervia-five.vercel.app/login");
  await new LoginPage(page).loginApplication();
  await new LogoutPage(page).logoutApplication();
});
