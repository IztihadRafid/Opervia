"use client";

import type { Invitation } from "@/hooks/useInvitations";

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

function formatDate(date: string) {
  return new Intl.DateTimeFormat("en", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  }).format(new Date(date));
}

export function InvitationsTable({ invitations }: InvitationsTableProps) {
  return (
    <div className="overflow-hidden rounded-2xl border border-border/60 bg-card shadow-sm">
      <div className="overflow-x-auto">
        <table className="w-full min-w-[820px] text-sm">
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
                Expires
              </th>

              <th className="px-5 py-3.5 font-medium text-muted-foreground">
                Invited
              </th>
            </tr>
          </thead>

          <tbody className="divide-y divide-border/60">
            {invitations.map((invitation) => (
              <tr
                key={invitation._id}
                className="transition-colors hover:bg-muted/20"
              >
                <td className="px-5 py-4 font-medium">{invitation.email}</td>

                <td className="px-5 py-4">
                  <span className="rounded-full border border-primary/20 bg-primary/10 px-2.5 py-1 text-xs font-medium capitalize text-primary">
                    {invitation.role}
                  </span>
                </td>

                <td className="px-5 py-4">
                  <span
                    className={`inline-flex rounded-full border px-2.5 py-1 text-xs font-medium capitalize ${
                      statusStyles[invitation.status]
                    }`}
                  >
                    {invitation.status}
                  </span>
                </td>

                <td className="px-5 py-4 text-muted-foreground">
                  {formatDate(invitation.expiresAt)}
                </td>

                <td className="px-5 py-4 text-muted-foreground">
                  {formatDate(invitation.createdAt)}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
