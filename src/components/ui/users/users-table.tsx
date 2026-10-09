"use client";

import type { User } from "@/hooks/use-users";

import { UserActionsMenu } from "./userActionsMenu";

interface UsersTableProps {
  users: User[];
  onEditUser?: (user: User) => void;
  onDeleteUser?: (user: User) => void;
}

const roleStyles = {
  owner: "border-blue-500/20 bg-blue-500/10 text-blue-600 dark:text-blue-400",
  admin:
    "border-indigo-500/20 bg-indigo-500/10 text-indigo-600 dark:text-indigo-400",
  member:
    "border-slate-500/20 bg-slate-500/10 text-slate-600 dark:text-slate-400",
  viewer: "border-cyan-500/20 bg-cyan-500/10 text-cyan-600 dark:text-cyan-400",
} as const;

const statusStyles = {
  active:
    "border-emerald-500/20 bg-emerald-500/10 text-emerald-600 dark:text-emerald-400",
  invited:
    "border-amber-500/20 bg-amber-500/10 text-amber-600 dark:text-amber-400",
  suspended: "border-destructive/20 bg-destructive/10 text-destructive",
} as const;

function getInitials(name: string) {
  return name
    .split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase())
    .join("");
}

const dateFormatter = new Intl.DateTimeFormat("en", {
  day: "2-digit",
  month: "short",
  year: "numeric",
});

function formatDate(date: string) {
  return dateFormatter.format(new Date(date));
}

export function UsersTable({
  users,
  onEditUser,
  onDeleteUser,
}: UsersTableProps) {
  return (
    <div className="overflow-hidden rounded-2xl border border-border/60 bg-card shadow-sm">
      <div className="overflow-x-auto">
        <table className="w-full min-w-[820px] text-sm">
          <thead className="border-b border-border/60 bg-muted/30">
            <tr className="text-left">
              <th className="px-5 py-3.5 font-medium text-muted-foreground">
                User
              </th>

              <th className="px-5 py-3.5 font-medium text-muted-foreground">
                Role
              </th>

              <th className="px-5 py-3.5 font-medium text-muted-foreground">
                Status
              </th>

              <th className="px-5 py-3.5 font-medium text-muted-foreground">
                Joined
              </th>

              <th className="px-5 py-3.5 text-right font-medium text-muted-foreground">
                Actions
              </th>
            </tr>
          </thead>

          <tbody className="divide-y divide-border/60">
            {users.length === 0 ? (
              <tr>
                <td colSpan={5} className="px-6 py-14 text-center">
                  <div className="mx-auto max-w-sm space-y-2">
                    <div className="mx-auto flex h-11 w-11 items-center justify-center rounded-full border border-border/60 bg-muted/40 text-muted-foreground">
                      —
                    </div>

                    <p className="text-sm font-semibold">No users found</p>

                    <p className="text-sm leading-6 text-muted-foreground">
                      Try adjusting your search or filters to find the user
                      you&apos;re looking for.
                    </p>
                  </div>
                </td>
              </tr>
            ) : (
              users.map((user) => (
                <tr
                  key={user._id}
                  className="group transition-colors hover:bg-primary/[0.03]"
                >
                  <td className="px-5 py-4">
                    <div className="flex items-center gap-3">
                      <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-primary/15 bg-primary/10 text-sm font-semibold text-primary">
                        {getInitials(user.name)}
                      </div>

                      <div className="min-w-0">
                        <p className="truncate font-medium text-foreground">
                          {user.name}
                        </p>

                        <p className="truncate text-sm text-muted-foreground">
                          {user.email}
                        </p>
                      </div>
                    </div>
                  </td>

                  <td className="px-5 py-4">
                    <span
                      className={`inline-flex rounded-full border px-2.5 py-1 text-xs font-medium capitalize ${
                        roleStyles[user.role]
                      }`}
                    >
                      {user.role}
                    </span>
                  </td>

                  <td className="px-5 py-4">
                    <span
                      className={`inline-flex rounded-full border px-2.5 py-1 text-xs font-medium capitalize ${
                        statusStyles[user.status]
                      }`}
                    >
                      {user.status}
                    </span>
                  </td>

                  <td className="px-5 py-4 text-muted-foreground">
                    {formatDate(user.createdAt)}
                  </td>

                  <td className="px-5 py-4 text-right">
                    <div className="flex justify-end opacity-80 transition-opacity group-hover:opacity-100">
                      <UserActionsMenu
                        onEdit={() => onEditUser?.(user)}
                        onDelete={() => onDeleteUser?.(user)}
                      />
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
