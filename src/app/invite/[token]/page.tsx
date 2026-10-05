"use client";

import { use, useState } from "react";
import { useRouter } from "next/navigation";

import { useAcceptInvitation } from "@/hooks/useAcceptInvitation";

type InvitePageProps = {
  params: Promise<{
    token: string;
  }>;
};

export default function InvitePage({ params }: InvitePageProps) {
  const { token } = use(params);
  const router = useRouter();

  const [name, setName] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");

  const acceptInvitation = useAcceptInvitation();

  function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
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
    <main className="flex min-h-screen items-center justify-center bg-background px-6">
      <div className="w-full max-w-md">
        <div className="mb-8">
          <h1 className="text-3xl font-semibold tracking-tight">
            Join Opervia
          </h1>

          <p className="mt-2 text-sm text-muted-foreground">
            Create your account to accept the invitation.
          </p>
        </div>

        <form
          onSubmit={handleSubmit}
          className="space-y-5 rounded-2xl border bg-card p-6 shadow-sm"
        >
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
              className="w-full rounded-lg border bg-background px-3 py-2.5 text-sm outline-none transition focus:ring-2 focus:ring-ring"
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
              className="w-full rounded-lg border bg-background px-3 py-2.5 text-sm outline-none transition focus:ring-2 focus:ring-ring"
            />
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
              className="w-full rounded-lg border bg-background px-3 py-2.5 text-sm outline-none transition focus:ring-2 focus:ring-ring"
            />
          </div>

          {acceptInvitation.isError && (
            <p role="alert" className="text-sm text-destructive">
              {acceptInvitation.error.message}
            </p>
          )}

          <button
            type="submit"
            disabled={acceptInvitation.isPending}
            className="w-full rounded-lg bg-primary px-4 py-2.5 text-sm font-medium text-primary-foreground transition hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-60"
          >
            {acceptInvitation.isPending
              ? "Creating account..."
              : "Accept invitation"}
          </button>
        </form>
      </div>
    </main>
  );
}
