"use client";

import { useState } from "react";

import type { Invitation } from "@/hooks/useInvitations";
import { useResendInvitation } from "@/hooks/useResendInvitation";

import { RevokeInvitationDialog } from "./revokeInvitationDialog";

type InvitationsTableProps = {
  invitations: Invitation[];
};

const statusStyles = {
  pending:
    "border-emerald-500/20 bg-emerald-500/10 text-emerald-600 dark:text-emerald-400",
  expired:
    "border-amber-500/20 bg-amber-500/10 text-amber-600 dark:text-amber-400",
  revoked: "border-destructive/20 bg-destructive/10 text-destructive",
} as const;
const emailStatusStyles = {
  sent: "border-emerald-500/20 bg-emerald-500/10 text-emerald-600 dark:text-emerald-400",
  failed: "border-destructive/20 bg-destructive/10 text-destructive",
  pending:
    "border-amber-500/20 bg-amber-500/10 text-amber-600 dark:text-amber-400",
} as const;
function formatDate(date: string) {
  return new Intl.DateTimeFormat("en", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  }).format(new Date(date));
}

export function InvitationsTable({ invitations }: InvitationsTableProps) {
  const [revokingInvitation, setRevokingInvitation] =
    useState<Invitation | null>(null);
  const [resendingInvitationId, setResendingInvitationId] = useState<
    string | null
  >(null);

  const [recentlyResentInvitationId, setRecentlyResentInvitationId] = useState<
    string | null
  >(null);
  const [feedback, setFeedback] = useState<{
    type: "success" | "error";
    message: string;
  } | null>(null);

  const resendInvitation = useResendInvitation();

  const handleResend = (invitationId: string) => {
    setFeedback(null);
    setResendingInvitationId(invitationId);

    resendInvitation.mutate(invitationId, {
      onSuccess: () => {
        setResendingInvitationId(null);
        setRecentlyResentInvitationId(invitationId);

        window.setTimeout(() => {
          setRecentlyResentInvitationId((current) =>
            current === invitationId ? null : current,
          );
        }, 3000);
      },

      onError: (error) => {
        setResendingInvitationId(null);

        setFeedback({
          type: "error",
          message:
            error instanceof Error
              ? error.message
              : "Failed to resend invitation.",
        });
      },
    });
  };

  return (
    <>
      <div className="space-y-4">
        {feedback ? (
          <div
            role="status"
            aria-live="polite"
            className={`rounded-xl border px-4 py-3 text-sm ${
              feedback.type === "success"
                ? "border-emerald-500/20 bg-emerald-500/10 text-emerald-600 dark:text-emerald-400"
                : "border-destructive/20 bg-destructive/10 text-destructive"
            }`}
          >
            {feedback.message}
          </div>
        ) : null}

        <div className="overflow-hidden rounded-2xl border border-border/60 bg-card shadow-sm">
          <div className="overflow-x-auto">
            <table className="w-full min-w-[900px] text-sm">
              <thead className="border-b border-border/60 bg-muted/30">
                <tr className="text-left">
                  <th className="px-5 py-3.5 font-medium text-muted-foreground">
                    Email
                  </th>

                  <th className="px-5 py-3.5 font-medium text-muted-foreground">
                    Role
                  </th>

                  <th className="px-5 py-3.5 font-medium text-muted-foreground">
                    Status
                  </th>
                  <th className="px-5 py-3.5 font-medium text-muted-foreground">
                    Delivery
                  </th>
                  <th className="px-5 py-3.5 font-medium text-muted-foreground">
                    Expires
                  </th>

                  <th className="px-5 py-3.5 font-medium text-muted-foreground">
                    Invited
                  </th>

                  <th className="px-5 py-3.5 font-medium text-muted-foreground">
                    Actions
                  </th>
                </tr>
              </thead>

              <tbody className="divide-y divide-border/60">
                {invitations.map((invitation) => {
                  const isResending = resendingInvitationId === invitation._id;

                  const wasRecentlyResent =
                    recentlyResentInvitationId === invitation._id;
                  return (
                    <tr
                      key={invitation._id}
                      className="transition-colors hover:bg-muted/20"
                    >
                      <td className="px-5 py-4 font-medium">
                        {invitation?.email}
                      </td>

                      <td className="px-5 py-4">
                        <span className="rounded-full border border-primary/20 bg-primary/10 px-2.5 py-1 text-xs font-medium capitalize text-primary">
                          {invitation?.role}
                        </span>
                      </td>

                      <td className="px-5 py-4">
                        <span
                          className={`inline-flex rounded-full border px-2.5 py-1 text-xs font-medium capitalize ${
                            statusStyles[invitation.status]
                          }`}
                        >
                          {invitation?.status}
                        </span>
                      </td>
                      <td className="px-5 py-4">
                        <span
                          className={`inline-flex rounded-full border px-2.5 py-1 text-xs font-medium capitalize ${
                            emailStatusStyles[invitation.emailStatus]
                          }`}
                        >
                          {invitation?.emailStatus}
                        </span>
                      </td>
                      <td className="px-5 py-4 text-muted-foreground">
                        {formatDate(invitation?.expiresAt)}
                      </td>

                      <td className="px-5 py-4 text-muted-foreground">
                        {formatDate(invitation?.createdAt)}
                      </td>

                      <td className="px-5 py-4">
                        <div className="flex items-center gap-2">
                          {invitation.status === "pending" ||
                          invitation.status === "expired" ? (
                            <button
                              type="button"
                              onClick={() => handleResend(invitation._id)}
                              disabled={isResending}
                              className="rounded-lg border border-primary/20 bg-primary/5 px-3 py-1.5 text-xs font-medium text-primary transition hover:bg-primary/10 disabled:cursor-not-allowed disabled:opacity-60"
                            >
                              {isResending
                                ? "Resending..."
                                : wasRecentlyResent
                                  ? "Sent"
                                  : "Resend"}
                            </button>
                          ) : null}

                          {invitation.status === "pending" ? (
                            <button
                              type="button"
                              onClick={() => setRevokingInvitation(invitation)}
                              className="rounded-lg border border-destructive/20 px-3 py-1.5 text-xs font-medium text-destructive transition hover:bg-destructive/10"
                            >
                              Revoke
                            </button>
                          ) : null}

                          {invitation.status === "revoked" ? (
                            <span className="text-xs text-muted-foreground">
                              —
                            </span>
                          ) : null}
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      <RevokeInvitationDialog
        invitation={revokingInvitation}
        open={revokingInvitation !== null}
        onClose={() => setRevokingInvitation(null)}
      />
    </>
  );
}
