"use client";

import { useState } from "react";
import { useUsers, type User } from "@/hooks/use-users";
import { UsersTable } from "@/components/ui/users/users-table";
import { UsersPagination } from "@/components/ui/users/users-pagination";
import { EditUserModal } from "@/components/ui/users/editUserModal";
import { DeleteUserDialog } from "@/components/ui/users/deleteUserDialog";
import { InviteUserModal } from "@/components/ui/users/inviteUserModal";
import { InvitationsTable } from "@/components/ui/users/invitationsTable";
import { useInvitations } from "@/hooks/useInvitations";

type UsersView = "users" | "invitations";

export default function UsersPage() {
  const [view, setView] = useState<UsersView>("users");

  const [search, setSearch] = useState("");
  const [role, setRole] = useState<
    "owner" | "admin" | "member" | "viewer" | ""
  >("");
  const [status, setStatus] = useState<"active" | "invited" | "suspended" | "">(
    "",
  );

  const [page, setPage] = useState(1);
  const [invitationPage, setInvitationPage] = useState(1);

  const [isInviteUserOpen, setIsInviteUserOpen] = useState(false);
  const [editingUser, setEditingUser] = useState<User | null>(null);
  const [deletingUser, setDeletingUser] = useState<User | null>(null);

  const usersQuery = useUsers({
    page,
    search,
    role: role || undefined,
    status: status || undefined,
  });

  const invitationsQuery = useInvitations({
    page: invitationPage,
    limit: 25,
  });

  const isUsersView = view === "users";

  const data = usersQuery.data;
  const invitations = invitationsQuery.data;

  if (isUsersView && usersQuery.isLoading) {
    return <div>Loading users...</div>;
  }

  if (isUsersView && usersQuery.isError) {
    return <div>Failed to load users.</div>;
  }

  if (!isUsersView && invitationsQuery.isLoading) {
    return <div>Loading invitations...</div>;
  }

  if (!isUsersView && invitationsQuery.isError) {
    return <div>Failed to load invitations.</div>;
  }

  const totalUserPages = data?.pagination.totalPages ?? 1;
  const totalInvitationPages = invitations?.pagination.totalPages ?? 1;

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <h1 className="text-3xl font-semibold tracking-tight">Users</h1>

          <p className="mt-1 text-sm text-muted-foreground">
            Manage users and invitations in your organization.
          </p>
        </div>

        <button
          type="button"
          onClick={() => setIsInviteUserOpen(true)}
          className="rounded-xl bg-primary px-4 py-2.5 text-sm font-medium text-primary-foreground shadow-lg shadow-primary/15 transition hover:-translate-y-0.5 hover:shadow-xl hover:shadow-primary/20"
        >
          + Invite User
        </button>
      </div>

      <div className="flex w-fit rounded-xl border border-border/60 bg-muted/30 p-1">
        <button
          type="button"
          onClick={() => setView("users")}
          className={`rounded-lg px-4 py-2 text-sm font-medium transition ${
            isUsersView
              ? "bg-background text-foreground shadow-sm"
              : "text-muted-foreground hover:text-foreground"
          }`}
        >
          Users
        </button>

        <button
          type="button"
          onClick={() => setView("invitations")}
          className={`rounded-lg px-4 py-2 text-sm font-medium transition ${
            !isUsersView
              ? "bg-background text-foreground shadow-sm"
              : "text-muted-foreground hover:text-foreground"
          }`}
        >
          Invitations
          {invitations?.pagination.total ? (
            <span className="ml-2 rounded-full bg-primary/10 px-2 py-0.5 text-xs text-primary">
              {invitations.pagination.total}
            </span>
          ) : null}
        </button>
      </div>

      {isUsersView ? (
        <>
          <div className="flex flex-col gap-3 md:flex-row">
            <input
              type="search"
              value={search}
              onChange={(event) => {
                setSearch(event.target.value);
                setPage(1);
              }}
              placeholder="Search by name or email..."
              className="w-full rounded-lg border bg-background px-4 py-2.5 text-sm outline-none transition focus:ring-2 focus:ring-primary/20 md:max-w-md"
            />

            <select
              value={role}
              onChange={(event) => {
                setRole(
                  event.target.value as
                    "owner" | "admin" | "member" | "viewer" | "",
                );
                setPage(1);
              }}
              className="rounded-lg border bg-background px-4 py-2.5 text-sm outline-none"
            >
              <option value="">All roles</option>
              <option value="owner">Owner</option>
              <option value="admin">Admin</option>
              <option value="member">Member</option>
              <option value="viewer">Viewer</option>
            </select>

            <select
              value={status}
              onChange={(event) => {
                setStatus(
                  event.target.value as "active" | "invited" | "suspended" | "",
                );
                setPage(1);
              }}
              className="rounded-lg border bg-background px-4 py-2.5 text-sm outline-none"
            >
              <option value="">All statuses</option>
              <option value="active">Active</option>
              <option value="suspended">Suspended</option>
            </select>
          </div>

          <UsersTable
            users={data?.data ?? []}
            onEditUser={(user) => setEditingUser(user)}
            onDeleteUser={(user) => setDeletingUser(user)}
          />

          {data?.data.length === 0 && (search || role || status) && (
            <div className="flex justify-center">
              <button
                type="button"
                onClick={() => {
                  setSearch("");
                  setRole("");
                  setStatus("");
                  setPage(1);
                }}
                className="rounded-lg border px-4 py-2 text-sm font-medium transition hover:bg-muted"
              >
                Clear filters
              </button>
            </div>
          )}

          <UsersPagination
            page={page}
            totalPages={totalUserPages}
            onPageChange={setPage}
          />
        </>
      ) : (
        <>
          {invitations?.data.length ? (
            <InvitationsTable invitations={invitations.data} />
          ) : (
            <div className="rounded-2xl border border-dashed border-border/70 bg-card/50 px-6 py-12 text-center">
              <h2 className="text-lg font-semibold">No pending invitations</h2>

              <p className="mx-auto mt-2 max-w-md text-sm text-muted-foreground">
                When you invite someone to your organization, their pending
                invitation will appear here.
              </p>

              <button
                type="button"
                onClick={() => setIsInviteUserOpen(true)}
                className="mt-5 rounded-xl bg-primary px-4 py-2.5 text-sm font-medium text-primary-foreground shadow-lg shadow-primary/15 transition hover:-translate-y-0.5 hover:shadow-xl hover:shadow-primary/20"
              >
                + Invite User
              </button>
            </div>
          )}

          <UsersPagination
            page={invitationPage}
            totalPages={totalInvitationPages}
            onPageChange={setInvitationPage}
          />
        </>
      )}

      <EditUserModal
        user={editingUser}
        open={editingUser !== null}
        onClose={() => setEditingUser(null)}
      />

      <InviteUserModal
        open={isInviteUserOpen}
        onClose={() => setIsInviteUserOpen(false)}
      />

      <DeleteUserDialog
        user={deletingUser}
        open={deletingUser !== null}
        onClose={() => setDeletingUser(null)}
      />
    </div>
  );
}
