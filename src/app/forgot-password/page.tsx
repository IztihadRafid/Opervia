"use client";

import { FormEvent, useState } from "react";
import Link from "next/link";

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    setLoading(true);
    setMessage("");

    try {
      const response = await fetch("/api/auth/forgot-password", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ email }),
      });

      const data = await response.json();

      setMessage(
        data.message ??
          "If an account exists with this email, a password reset link has been sent.",
      );
    } catch {
      setMessage("Unable to process your request. Please try again later.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="flex min-h-screen items-center justify-center px-6 py-12">
      <div className="w-full max-w-md">
        <Link
          href="/login"
          className="text-sm text-muted-foreground hover:text-foreground"
        >
          ← Back to login
        </Link>

        <div className="mt-6 rounded-2xl border bg-card p-8 shadow-sm">
          <h1 className="text-2xl font-semibold tracking-tight">
            Forgot your password?
          </h1>

          <p className="mt-2 text-sm text-muted-foreground">
            Enter your email address and we&apos;ll send you a password reset
            link.
          </p>

          <form onSubmit={handleSubmit} className="mt-8 space-y-5">
            <div className="space-y-2">
              <label htmlFor="email" className="text-sm font-medium">
                Email address
              </label>

              <input
                id="email"
                type="email"
                autoComplete="email"
                required
                value={email}
                onChange={(event) => setEmail(event.target.value)}
                placeholder="you@example.com"
                className="flex h-10 w-full rounded-md border bg-background px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-ring"
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className="flex h-10 w-full items-center justify-center rounded-md bg-primary px-4 text-sm font-medium text-primary-foreground disabled:cursor-not-allowed disabled:opacity-50"
            >
              {loading ? "Sending..." : "Send reset link"}
            </button>
          </form>

          {message && (
            <p className="mt-5 text-sm text-muted-foreground">{message}</p>
          )}
        </div>
      </div>
    </main>
  );
}
