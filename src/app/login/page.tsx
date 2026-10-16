"use client";

import { useState } from "react";
import { Eye, EyeOff, ShieldCheck, Boxes } from "lucide-react";
import { signIn } from "next-auth/react";
import { useRouter } from "next/navigation";
import Link from "next/link";

export default function LoginPage() {
  const router = useRouter();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (event: React.SubmitEvent<HTMLFormElement>) => {
    event.preventDefault();

    setError("");
    setIsLoading(true);

    try {
      const result = await signIn("credentials", {
        email,
        password,
        redirect: false,
      });

      if (!result || result.error) {
        setError("Invalid email or password.");
        return;
      }

      router.push("/dashboard");
      router.refresh();
    } catch {
      setError("Unable to sign in. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <main className="min-h-screen bg-[#FFF9F7] lg:grid lg:grid-cols-[0.9fr_1.1fr]">
      {/* Left branding panel */}
      <section className="relative flex min-h-[300px] flex-col justify-between overflow-hidden bg-[#4C1D3D] px-7 py-8 text-white sm:px-12 sm:py-10 lg:min-h-screen lg:px-14 lg:py-14 xl:px-20">
        <div
          aria-hidden="true"
          className="pointer-events-none absolute -right-20 top-24 size-72 rounded-full border border-white/10"
        />
        <div
          aria-hidden="true"
          className="pointer-events-none absolute -right-10 top-34 size-52 rounded-full border border-white/10"
        />
        <div
          aria-hidden="true"
          className="pointer-events-none absolute -bottom-28 -left-24 size-80 rounded-full border border-white/10"
        />

        <div className="relative z-10 flex items-center gap-3">
          <div className="flex size-11 items-center justify-center rounded-xl bg-[#DC586D] text-white shadow-sm">
            <Boxes className="size-6" aria-hidden="true" />
          </div>
          <span className="text-2xl font-semibold tracking-tight">Opervia</span>
        </div>

        <div className="relative z-10 my-10 max-w-xl lg:my-0">
          <div className="mb-5 inline-flex items-center gap-2 rounded-full border border-white/20 px-3.5 py-2 text-xs font-medium text-white/90">
            <ShieldCheck className="size-4 text-[#FFBB94]" aria-hidden="true" />
            Your workspace, organized
          </div>

          <h2 className="max-w-lg text-3xl font-semibold leading-tight tracking-tight sm:text-4xl lg:text-5xl xl:text-6xl">
            Everything your software business needs.
          </h2>

          <p className="mt-5 max-w-md text-sm leading-7 text-white/75 sm:text-base">
            Manage applications, subscriptions, vendors, licenses, and expenses
            from one organized workspace.
          </p>

          <div className="mt-8 flex items-center gap-3">
            <span className="h-1.5 w-10 rounded-full bg-[#FFBB94]" />
            <span className="h-1.5 w-5 rounded-full bg-[#FB9590]" />
            <span className="h-1.5 w-5 rounded-full bg-[#DC586D]" />
          </div>
        </div>

        <p className="relative z-10 hidden text-xs text-white/55 lg:block">
          © {new Date().getFullYear()} Opervia. Built for better software
          management.
        </p>
      </section>

      {/* Right login panel */}
      <section className="flex min-h-[calc(100vh-300px)] items-center justify-center px-5 py-10 sm:px-10 lg:min-h-screen lg:px-12 xl:px-20">
        <div className="w-full max-w-md">
          <div className="mb-8">
            <p className="mb-3 text-sm font-semibold text-[#A33757]">
              WELCOME BACK
            </p>

            <h1 className="text-3xl font-semibold tracking-tight text-[#4C1D3D] sm:text-4xl">
              Sign in to Opervia
            </h1>

            <p className="mt-3 text-sm leading-6 text-[#852E4E]/75">
              Enter your account details to access your workspace.
            </p>
          </div>

          <form
            onSubmit={handleSubmit}
            className="space-y-5 rounded-2xl border border-[#DC586D]/15 bg-white p-5 shadow-[0_12px_40px_rgba(76,29,61,0.06)] sm:p-8"
          >
            <div className="space-y-2">
              <label
                htmlFor="email"
                className="text-sm font-medium text-[#4C1D3D]"
              >
                Email address
              </label>

              <input
                id="email"
                type="email"
                value={email}
                onChange={(event) => setEmail(event.target.value)}
                placeholder="you@example.com"
                autoComplete="email"
                required
                className="w-full rounded-xl border border-[#852E4E]/20 bg-[#FFF9F7] px-4 py-3 text-sm text-[#4C1D3D] outline-none transition placeholder:text-[#852E4E]/40 focus:border-[#DC586D] focus:ring-4 focus:ring-[#DC586D]/10"
              />
            </div>

            <div className="space-y-2">
              <label
                htmlFor="password"
                className="text-sm font-medium text-[#4C1D3D]"
              >
                Password
              </label>

              <div className="relative">
                <input
                  id="password"
                  type={showPassword ? "text" : "password"}
                  value={password}
                  onChange={(event) => setPassword(event.target.value)}
                  placeholder="Enter your password"
                  autoComplete="current-password"
                  required
                  className="w-full rounded-xl border border-[#852E4E]/20 bg-[#FFF9F7] px-4 py-3 pr-12 text-sm text-[#4C1D3D] outline-none transition placeholder:text-[#852E4E]/40 focus:border-[#DC586D] focus:ring-4 focus:ring-[#DC586D]/10"
                />

                <button
                  type="button"
                  onClick={() => setShowPassword((value) => !value)}
                  aria-label={showPassword ? "Hide password" : "Show password"}
                  className="absolute right-3 top-1/2 -translate-y-1/2 rounded-lg p-2 text-[#852E4E]/65 transition hover:bg-[#FFBB94]/20 hover:text-[#4C1D3D]"
                >
                  {showPassword ? (
                    <EyeOff className="size-4" aria-hidden="true" />
                  ) : (
                    <Eye className="size-4" aria-hidden="true" />
                  )}
                </button>
              </div>
            </div>

            {error && (
              <p
                role="alert"
                className="rounded-lg border border-[#DC586D]/25 bg-[#FB9590]/10 px-3 py-2.5 text-sm text-[#A33757]"
              >
                {error}
              </p>
            )}

            <button
              type="submit"
              disabled={isLoading}
              className="w-full rounded-xl bg-[#A33757] px-4 py-3 text-sm font-semibold text-white shadow-sm transition hover:bg-[#852E4E] focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-[#DC586D]/25 disabled:cursor-not-allowed disabled:opacity-60"
            >
              {isLoading ? "Signing in..." : "Sign in"}
            </button>

            <div className="flex justify-end border-t border-[#DC586D]/10 pt-4">
              <Link
                href="/forgot-password"
                className="text-sm font-medium text-[#A33757] transition hover:text-[#4C1D3D] hover:underline"
              >
                Forgot password?
              </Link>
            </div>
          </form>

          <p className="mt-6 text-center text-xs leading-5 text-[#852E4E]/60">
            Secure access to your organization workspace.
          </p>
        </div>
      </section>
    </main>
  );
}
