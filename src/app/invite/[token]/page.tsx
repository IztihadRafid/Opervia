"use client";

import { use, useState } from "react";
import { useRouter } from "next/navigation";

import { useAcceptInvitation } from "@/hooks/useAcceptInvitation";
import { useInvitation } from "@/hooks/useInvitation";

type InvitePageProps = {
  params: Promise<{
    token: string;
  }>;
};

export default function InvitePage({ params }: InvitePageProps) {
  const { token } = use(params);
  const router = useRouter();

  const invitation = useInvitation(token);

  const [name, setName] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");

  const acceptInvitation = useAcceptInvitation();

  if (invitation.isLoading) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-background px-6">
        <div className="w-full max-w-md">
          <div className="rounded-2xl border bg-card p-6 shadow-sm">
            <p className="text-sm text-muted-foreground">
              Loading invitation...
            </p>
          </div>
        </div>
      </main>
    );
  }

  if (invitation.isError || !invitation.data) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-background px-6">
        <div className="w-full max-w-md">
          <div className="rounded-2xl border bg-card p-6 shadow-sm">
            <h1 className="text-2xl font-semibold tracking-tight">
              Invitation unavailable
            </h1>

            <p className="mt-2 text-sm text-muted-foreground">
              {invitation.error?.message ??
                "This invitation is invalid or has expired."}
            </p>

            <button
              type="button"
              onClick={() => router.push("/login")}
              className="mt-6 w-full rounded-lg bg-primary px-4 py-2.5 text-sm font-medium text-primary-foreground transition hover:opacity-90"
            >
              Go to login
            </button>
          </div>
        </div>
      </main>
    );
  }

  function handleSubmit(event: React.SubmitEvent<HTMLFormElement>) {
    event.preventDefault();

    acceptInvitation.mutate(
      {
        token,
        name,
        password,
        confirmPassword,
      },
      {
        onSuccess: () => {
          router.push("/login?invited=success");
        },
      },
    );
  }

  return (
    <main className="relative flex min-h-screen items-center justify-center overflow-hidden bg-background px-6 py-12">
      {/* Ambient background */}
      <div aria-hidden="true" className="pointer-events-none absolute inset-0">
        <div className="absolute left-1/2 top-[-20%] h-[500px] w-[700px] -translate-x-1/2 rounded-full bg-primary/15 blur-[120px]" />
        <div className="absolute bottom-[-20%] left-[-10%] h-[400px] w-[400px] rounded-full bg-blue-500/10 blur-[120px]" />
        <div className="absolute right-[-10%] top-[20%] h-[350px] w-[350px] rounded-full bg-violet-500/10 blur-[120px]" />
      </div>

      <div className="relative z-10 w-full max-w-md">
        {/* Brand */}
        <div className="mb-8 text-center">
          <div className="mx-auto mb-5 flex h-12 w-12 items-center justify-center rounded-2xl bg-primary text-lg font-bold text-primary-foreground shadow-lg shadow-primary/20">
            O
          </div>

          <h1 className="text-3xl font-semibold tracking-tight">
            Join Opervia
          </h1>

          <p className="mx-auto mt-2 max-w-sm text-sm leading-6 text-muted-foreground">
            You&apos;ve been invited to join your organization on Opervia.
          </p>
        </div>

        {/* Invitation card */}
        <form
          onSubmit={handleSubmit}
          className="rounded-3xl border border-border/60 bg-card/80 p-6 shadow-2xl shadow-black/10 backdrop-blur-xl sm:p-7"
        >
          {/* Invitation summary */}
          <div className="rounded-2xl border border-primary/15 bg-primary/[0.04] p-4">
            <p className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
              Invitation for
            </p>

            <p className="mt-1 break-all text-sm font-semibold">
              {invitation.data.email}
            </p>

            <div className="mt-4 flex items-center justify-between border-t border-border/60 pt-4">
              <span className="text-xs text-muted-foreground">
                Organization role
              </span>

              <span className="rounded-full border border-primary/20 bg-primary/10 px-2.5 py-1 text-xs font-medium capitalize text-primary">
                {invitation.data.role}
              </span>
            </div>
          </div>

          {/* Account details */}
          <div className="mt-6 space-y-5">
            <div className="space-y-2">
              <label htmlFor="name" className="text-sm font-medium">
                Full name
              </label>

              <input
                id="name"
                type="text"
                value={name}
                onChange={(event) => setName(event.target.value)}
                placeholder="John Doe"
                autoComplete="name"
                required
                className="h-11 w-full rounded-xl border border-border/70 bg-background/70 px-3.5 text-sm outline-none transition placeholder:text-muted-foreground/60 focus:border-primary/50 focus:ring-4 focus:ring-primary/10"
              />
            </div>

            <div className="space-y-2">
              <label htmlFor="password" className="text-sm font-medium">
                Password
              </label>

              <input
                id="password"
                type="password"
                value={password}
                onChange={(event) => setPassword(event.target.value)}
                placeholder="Create a password"
                autoComplete="new-password"
                required
                className="h-11 w-full rounded-xl border border-border/70 bg-background/70 px-3.5 text-sm outline-none transition placeholder:text-muted-foreground/60 focus:border-primary/50 focus:ring-4 focus:ring-primary/10"
              />

              <p className="text-xs text-muted-foreground">
                Use at least 8 characters.
              </p>
            </div>

            <div className="space-y-2">
              <label htmlFor="confirmPassword" className="text-sm font-medium">
                Confirm password
              </label>

              <input
                id="confirmPassword"
                type="password"
                value={confirmPassword}
                onChange={(event) => setConfirmPassword(event.target.value)}
                placeholder="Confirm your password"
                autoComplete="new-password"
                required
                className="h-11 w-full rounded-xl border border-border/70 bg-background/70 px-3.5 text-sm outline-none transition placeholder:text-muted-foreground/60 focus:border-primary/50 focus:ring-4 focus:ring-primary/10"
              />
            </div>

            {acceptInvitation.isError && (
              <div
                role="alert"
                className="rounded-xl border border-destructive/20 bg-destructive/5 px-3.5 py-3 text-sm text-destructive"
              >
                {acceptInvitation.error.message}
              </div>
            )}

            <button
              type="submit"
              disabled={acceptInvitation.isPending}
              className="h-11 w-full rounded-xl bg-primary px-4 text-sm font-medium text-primary-foreground shadow-lg shadow-primary/20 transition hover:-translate-y-0.5 hover:shadow-xl hover:shadow-primary/25 disabled:cursor-not-allowed disabled:opacity-60 disabled:hover:translate-y-0"
            >
              {acceptInvitation.isPending
                ? "Creating account..."
                : "Accept invitation"}
            </button>
          </div>
        </form>

        <p className="mt-6 text-center text-xs text-muted-foreground">
          By continuing, you&apos;ll create your Opervia account and join the
          organization associated with this invitation.
        </p>
      </div>
    </main>
  );
}
