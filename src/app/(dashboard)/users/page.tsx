"use client";

import { useState } from "react";
import { User, useUsers } from "@/hooks/use-users";
import { UsersTable } from "@/components/ui/users/users-table";
import { UsersPagination } from "@/components/ui/users/users-pagination";
import { UserForm } from "@/components/ui/users/userForm";
import { CreateUserModal } from "@/components/ui/users/createUserModal";
import { EditUserModal } from "@/components/ui/users/editUserModal";
import { DeleteUserDialog } from "@/components/ui/users/deleteUserDialog";

export default function UsersPage() {
  const [search, setSearch] = useState("");
  const [role, setRole] = useState<
    "owner" | "admin" | "member" | "viewer" | ""
  >("");
  const [status, setStatus] = useState<"active" | "invited" | "suspended" | "">(
    "",
  );
  const [page, setPage] = useState(1);
  const [isCreateUserOpen, setIsCreateUserOpen] = useState(false);
  const [editingUser, setEditingUser] = useState<User | null>(null);
  const [deletingUser, setDeletingUser] = useState<User | null>(null);
  const { data, isLoading, isError } = useUsers({
    page,
    search,
    role: role || undefined,
    status: status || undefined,
  });

  if (isLoading) {
    return <div>Loading users...</div>;
  }

  if (isError) {
    return <div>Failed to load users.</div>;
  }

  const totalPages = data?.pagination.totalPages ?? 1;

  return (
    <div className="space-y-6">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-3xl font-semibold tracking-tight">Users</h1>

          <p className="mt-1 text-sm text-muted-foreground">
            Manage users in your organization.
          </p>
        </div>

        <button
          type="button"
          onClick={() => setIsCreateUserOpen(true)}
          className="rounded-lg bg-primary px-4 py-2.5 text-sm font-medium text-primary-foreground transition hover:opacity-90"
        >
          + Create User
        </button>
      </div>

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
          <option value="invited">Invited</option>
          <option value="suspended">Suspended</option>
        </select>
      </div>

      <UsersTable
        users={data?.data ?? []}
        onEditUser={(user) => setEditingUser(user)}
        onDeleteUser={(user) => setDeletingUser(user)}
      />

      <UsersPagination
        page={page}
        totalPages={totalPages}
        onPageChange={setPage}
      />
      <EditUserModal
        user={editingUser}
        open={editingUser !== null}
        onClose={() => setEditingUser(null)}
      />
      <CreateUserModal
        open={isCreateUserOpen}
        onClose={() => setIsCreateUserOpen(false)}
      >
        <UserForm
          onSuccess={() => setIsCreateUserOpen(false)}
          onCancel={() => setIsCreateUserOpen(false)}
        />
      </CreateUserModal>
      <DeleteUserDialog
        user={deletingUser}
        open={deletingUser !== null}
        onClose={() => setDeletingUser(null)}
      />
    </div>
  );
}
