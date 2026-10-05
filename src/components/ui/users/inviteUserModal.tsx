"use client";

import { useState } from "react";

import { useCreateInvitation } from "@/hooks/useCreateInvitation";

type InviteUserModalProps = {
  open: boolean;
  onClose: () => void;
};

export function InviteUserModal({ open, onClose }: InviteUserModalProps) {
  const [email, setEmail] = useState("");
  const [role, setRole] = useState<"admin" | "member" | "viewer">("member");

  const createInvitation = useCreateInvitation();

  if (!open) {
    return null;
  }

  const invitationUrl = createInvitation.data?.data?.invitationUrl;

  function handleSubmit(event: React.SubmitEvent<HTMLFormElement>) {
    event.preventDefault();

    createInvitation.mutate({
      email,
      role,
    });
  }

  function handleClose() {
    if (createInvitation.isPending) {
      return;
    }

    setEmail("");
    setRole("member");
    createInvitation.reset();
    onClose();
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 px-4 py-6 backdrop-blur-sm"
      role="dialog"
      aria-modal="true"
      aria-labelledby="invite-user-title"
    >
      <div className="relative w-full max-w-lg overflow-hidden rounded-3xl border border-border/60 bg-card shadow-2xl shadow-black/20">
        {/* Decorative glow */}
        <div
          aria-hidden="true"
          className="pointer-events-none absolute -right-20 -top-20 h-48 w-48 rounded-full bg-primary/15 blur-3xl"
        />

        <div className="relative">
          {/* Header */}
          <div className="border-b border-border/60 px-6 py-5">
            <div className="flex items-start justify-between gap-4">
              <div>
                <h2
                  id="invite-user-title"
                  className="text-xl font-semibold tracking-tight"
                >
                  Invite user
                </h2>

                <p className="mt-1 text-sm text-muted-foreground">
                  Invite someone to join your organization on Opervia.
                </p>
              </div>

              <button
                type="button"
                onClick={handleClose}
                disabled={createInvitation.isPending}
                aria-label="Close invitation dialog"
                className="rounded-lg p-2 text-muted-foreground transition hover:bg-muted hover:text-foreground disabled:cursor-not-allowed disabled:opacity-50"
              >
                ×
              </button>
            </div>
          </div>

          {/* Body */}
          <div className="p-6">
            {!invitationUrl ? (
              <form onSubmit={handleSubmit} className="space-y-5">
                <div className="space-y-2">
                  <label htmlFor="invite-email" className="text-sm font-medium">
                    Email address
                  </label>

                  <input
                    id="invite-email"
                    type="email"
                    value={email}
                    onChange={(event) => setEmail(event.target.value)}
                    placeholder="employee@company.com"
                    autoComplete="email"
                    required
                    className="h-11 w-full rounded-xl border border-border/70 bg-background px-3.5 text-sm outline-none transition placeholder:text-muted-foreground/60 focus:border-primary/50 focus:ring-4 focus:ring-primary/10"
                  />

                  <p className="text-xs text-muted-foreground">
                    An invitation will be sent to this email address.
                  </p>
                </div>

                <div className="space-y-2">
                  <label htmlFor="invite-role" className="text-sm font-medium">
                    Role
                  </label>

                  <select
                    id="invite-role"
                    value={role}
                    onChange={(event) =>
                      setRole(
                        event.target.value as "admin" | "member" | "viewer",
                      )
                    }
                    className="h-11 w-full rounded-xl border border-border/70 bg-background px-3.5 text-sm outline-none transition focus:border-primary/50 focus:ring-4 focus:ring-primary/10"
                  >
                    <option value="member">Member</option>
                    <option value="viewer">Viewer</option>
                    <option value="admin">Admin</option>
                  </select>
                </div>

                <div className="rounded-2xl border border-primary/15 bg-primary/[0.04] p-4">
                  <p className="text-sm font-medium">What happens next?</p>

                  <p className="mt-1 text-xs leading-5 text-muted-foreground">
                    The invited person will receive a secure invitation link.
                    They can use it to create their Opervia account and join
                    your organization with the selected role.
                  </p>
                </div>

                {createInvitation.isError && (
                  <div
                    role="alert"
                    className="rounded-xl border border-destructive/20 bg-destructive/5 px-3.5 py-3 text-sm text-destructive"
                  >
                    {createInvitation.error.message}
                  </div>
                )}

                <div className="flex justify-end gap-3 pt-2">
                  <button
                    type="button"
                    onClick={handleClose}
                    disabled={createInvitation.isPending}
                    className="rounded-xl border border-border px-4 py-2.5 text-sm font-medium transition hover:bg-muted disabled:cursor-not-allowed disabled:opacity-50"
                  >
                    Cancel
                  </button>

                  <button
                    type="submit"
                    disabled={createInvitation.isPending}
                    className="rounded-xl bg-primary px-5 py-2.5 text-sm font-medium text-primary-foreground shadow-lg shadow-primary/20 transition hover:-translate-y-0.5 hover:shadow-xl hover:shadow-primary/25 disabled:cursor-not-allowed disabled:opacity-60 disabled:hover:translate-y-0"
                  >
                    {createInvitation.isPending
                      ? "Creating invitation..."
                      : "Send invitation"}
                  </button>
                </div>
              </form>
            ) : (
              <div className="space-y-5">
                <div className="rounded-2xl border border-primary/20 bg-primary/[0.05] p-5">
                  <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary/10 text-primary">
                    ✓
                  </div>

                  <h3 className="mt-4 text-lg font-semibold">
                    Invitation created
                  </h3>

                  <p className="mt-1 text-sm text-muted-foreground">
                    The invitation for{" "}
                    <span className="font-medium text-foreground">
                      {createInvitation.data?.data?.email}
                    </span>{" "}
                    is ready.
                  </p>
                </div>

                <div className="space-y-2">
                  <label
                    htmlFor="invitation-url"
                    className="text-sm font-medium"
                  >
                    Invitation link
                  </label>

                  <input
                    id="invitation-url"
                    type="text"
                    value={invitationUrl}
                    readOnly
                    className="h-11 w-full rounded-xl border border-border/70 bg-muted/40 px-3.5 text-xs outline-none"
                  />
                </div>

                <div className="flex justify-end gap-3">
                  <button
                    type="button"
                    onClick={() => {
                      navigator.clipboard.writeText(invitationUrl);
                    }}
                    className="rounded-xl border border-border px-4 py-2.5 text-sm font-medium transition hover:bg-muted"
                  >
                    Copy link
                  </button>

                  <button
                    type="button"
                    onClick={handleClose}
                    className="rounded-xl bg-primary px-5 py-2.5 text-sm font-medium text-primary-foreground shadow-lg shadow-primary/20 transition hover:-translate-y-0.5 hover:shadow-xl hover:shadow-primary/25"
                  >
                    Done
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
