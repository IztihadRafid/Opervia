"use client";

import { use, useState } from "react";
import { useRouter } from "next/navigation";
import { Boxes, ShieldCheck, Users, Mail, ArrowRight } from "lucide-react";
import Link from "next/link";
import { useAcceptInvitation } from "@/hooks/useAcceptInvitation";
import { useInvitation } from "@/hooks/useInvitations";

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
      <main className="flex min-h-screen items-center justify-center bg-[#FFF9F7] px-6">
        <div className="w-full max-w-md rounded-2xl border border-[#F0DED9] bg-white p-8 shadow-sm">
          <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-xl bg-[#FFF0E8] text-[#A33757]">
            <Boxes size={23} />
          </div>
          <p className="text-center text-sm text-[#785F69]">
            Loading invitation...
          </p>
          <div className="mt-5 h-1.5 overflow-hidden rounded-full bg-[#F7E8E3]">
            <div className="h-full w-1/2 animate-pulse rounded-full bg-[#DC586D]" />
          </div>
        </div>
      </main>
    );
  }

  if (invitation.isError || !invitation.data) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-[#FFF9F7] px-6 py-12">
        <div className="w-full max-w-md rounded-3xl border border-[#F0DED9] bg-white p-8 shadow-sm">
          <div className="mb-5 flex h-12 w-12 items-center justify-center rounded-xl bg-[#FFF0E8] text-[#A33757]">
            <Mail size={22} />
          </div>
          <h1 className="text-2xl font-semibold tracking-tight text-[#4C1D3D]">
            Invitation unavailable
          </h1>
          <p className="mt-3 text-sm leading-6 text-[#785F69]">
            {invitation.error?.message ??
              "This invitation is invalid or has expired."}
          </p>
          <button
            type="button"
            onClick={() => router.push("/login")}
            className="mt-7 h-11 w-full rounded-xl bg-[#4C1D3D] px-4 text-sm font-semibold text-white transition hover:bg-[#852E4E]"
          >
            Go to login
          </button>
        </div>
      </main>
    );
  }

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
    <main className="min-h-screen bg-[#FFF9F7] lg:grid lg:grid-cols-[0.9fr_1.1fr]">
      {/* Left brand panel */}
      <section className="relative hidden min-h-screen flex-col justify-between overflow-hidden bg-[#4C1D3D] p-10 text-white lg:flex xl:p-14">
        <div
          aria-hidden="true"
          className="pointer-events-none absolute -right-28 top-24 h-80 w-80 rounded-full border border-white/10"
        />
        <div
          aria-hidden="true"
          className="pointer-events-none absolute -right-12 top-40 h-64 w-64 rounded-full border border-white/10"
        />
        <div
          aria-hidden="true"
          className="pointer-events-none absolute -bottom-24 -left-24 h-80 w-80 rounded-full border border-white/10"
        />

        <Link
          href="/login"
          className="relative z-10 inline-flex items-center gap-3"
        >
          <span className="flex h-11 w-11 items-center justify-center rounded-xl bg-[#DC586D] text-white">
            <Boxes size={24} />
          </span>
          <span className="text-2xl font-semibold tracking-tight">Opervia</span>
        </Link>

        <div className="relative z-10 max-w-lg py-12">
          <div className="mb-6 inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/5 px-3.5 py-2 text-sm text-[#FFBB94]">
            <Users size={16} />
            Your team starts here
          </div>

          <h1 className="text-4xl font-semibold leading-tight tracking-tight xl:text-5xl">
            Great work happens
            <span className="mt-2 block text-[#FFBB94]">
              when teams connect.
            </span>
          </h1>

          <p className="mt-6 max-w-md text-base leading-7 text-white/70">
            You’ve been invited to join an organization on Opervia. Set up your
            account to collaborate with your team and manage your work in one
            place.
          </p>

          <div className="mt-10 space-y-5">
            <div className="flex items-start gap-3">
              <span className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-white/10 text-[#FFBB94]">
                <ShieldCheck size={17} />
              </span>
              <div>
                <p className="text-sm font-medium">Your own secure account</p>
                <p className="mt-1 text-sm leading-5 text-white/60">
                  Create your credentials to get started.
                </p>
              </div>
            </div>

            <div className="flex items-start gap-3">
              <span className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-white/10 text-[#FFBB94]">
                <Users size={17} />
              </span>
              <div>
                <p className="text-sm font-medium">Connected to your team</p>
                <p className="mt-1 text-sm leading-5 text-white/60">
                  Join using the invitation sent to your email.
                </p>
              </div>
            </div>
          </div>
        </div>

        <p className="relative z-10 text-xs text-white/45">
          © {new Date().getFullYear()} Opervia. All rights reserved.
        </p>
      </section>

      {/* Invitation form */}
      <section className="flex min-h-screen items-center justify-center px-5 py-10 sm:px-8 lg:px-12">
        <div className="w-full max-w-lg">
          <Link
            href="/login"
            className="mb-8 inline-flex items-center gap-2 text-sm font-semibold text-[#852E4E] lg:hidden"
          >
            <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-[#4C1D3D] text-white">
              <Boxes size={19} />
            </span>
            Opervia
          </Link>

          <div className="mb-7">
            <div className="mb-5 flex h-12 w-12 items-center justify-center rounded-2xl bg-[#FFF0E8] text-[#A33757]">
              <Users size={23} />
            </div>

            <p className="mb-2 text-xs font-semibold uppercase tracking-[0.18em] text-[#A33757]">
              Team invitation
            </p>

            <h2 className="text-3xl font-semibold tracking-tight text-[#4C1D3D] sm:text-4xl">
              Join your team
            </h2>

            <p className="mt-3 text-sm leading-6 text-[#785F69]">
              Create your account to accept the invitation and get started with
              Opervia.
            </p>
          </div>

          <form
            onSubmit={handleSubmit}
            className="rounded-3xl border border-[#F0DED9] bg-white p-5 shadow-[0_12px_45px_rgba(76,29,61,0.06)] sm:p-7"
          >
            {/* Invitation summary */}
            <div className="rounded-2xl border border-[#F0DED9] bg-[#FFF9F7] p-4">
              <div className="flex items-start gap-3">
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-[#FFE8DD] text-[#A33757]">
                  <Mail size={19} />
                </div>
                <div className="min-w-0 flex-1">
                  <p className="text-xs font-medium uppercase tracking-wider text-[#987A85]">
                    Invitation sent to
                  </p>
                  <p className="mt-1 break-all text-sm font-semibold text-[#4C1D3D]">
                    {invitation.data.email}
                  </p>
                </div>
              </div>

              <div className="mt-4 flex items-center justify-between gap-3 border-t border-[#EEDDD8] pt-4">
                <span className="text-xs text-[#785F69]">
                  Organization role
                </span>
                <span className="rounded-full border border-[#E9C4C8] bg-[#FFF0E8] px-3 py-1 text-xs font-semibold capitalize text-[#852E4E]">
                  {invitation.data.role}
                </span>
              </div>
            </div>

            {/* Account details */}
            <div className="mt-6 space-y-5">
              <div className="space-y-2">
                <label
                  htmlFor="name"
                  className="block text-sm font-medium text-[#4C1D3D]"
                >
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
                  className="h-12 w-full rounded-xl border border-[#E8D8D5] bg-white px-4 text-sm text-[#4C1D3D] outline-none transition placeholder:text-[#B39DA5] focus:border-[#DC586D] focus:ring-4 focus:ring-[#DC586D]/10"
                />
              </div>

              <div className="space-y-2">
                <label
                  htmlFor="password"
                  className="block text-sm font-medium text-[#4C1D3D]"
                >
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
                  className="h-12 w-full rounded-xl border border-[#E8D8D5] bg-white px-4 text-sm text-[#4C1D3D] outline-none transition placeholder:text-[#B39DA5] focus:border-[#DC586D] focus:ring-4 focus:ring-[#DC586D]/10"
                />
                <p className="text-xs text-[#987A85]">
                  Use at least 8 characters.
                </p>
              </div>

              <div className="space-y-2">
                <label
                  htmlFor="confirmPassword"
                  className="block text-sm font-medium text-[#4C1D3D]"
                >
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
                  className="h-12 w-full rounded-xl border border-[#E8D8D5] bg-white px-4 text-sm text-[#4C1D3D] outline-none transition placeholder:text-[#B39DA5] focus:border-[#DC586D] focus:ring-4 focus:ring-[#DC586D]/10"
                />
              </div>

              {acceptInvitation.isError && (
                <div
                  role="alert"
                  className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700"
                >
                  {acceptInvitation.error.message}
                </div>
              )}

              <button
                type="submit"
                disabled={acceptInvitation.isPending}
                className="flex h-12 w-full items-center justify-center gap-2 rounded-xl bg-[#4C1D3D] px-4 text-sm font-semibold text-white shadow-sm transition hover:bg-[#852E4E] disabled:cursor-not-allowed disabled:opacity-60"
              >
                {acceptInvitation.isPending
                  ? "Creating account..."
                  : "Accept invitation"}
                {!acceptInvitation.isPending && <ArrowRight size={17} />}
              </button>

              <p className="text-center text-sm text-[#785F69]">
                Already have an account?{" "}
                <Link
                  href="/login"
                  className="font-semibold text-[#A33757] underline-offset-4 transition hover:text-[#4C1D3D] hover:underline"
                >
                  Log in
                </Link>
              </p>
            </div>
          </form>

          <p className="mt-6 text-center text-xs leading-5 text-[#987A85]">
            By continuing, you’ll create your Opervia account and join the
            organization associated with this invitation.
          </p>
        </div>
      </section>
    </main>
  );
}
