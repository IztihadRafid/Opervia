"use client";

import { useEffect, useState } from "react";
import { useUsers } from "@/hooks/use-users";
import { UsersTable } from "@/components/ui/users/users-table";
import { UsersPagination } from "@/components/ui/users/users-pagination";

export default function UsersPage() {
  const [search, setSearch] = useState("");
  const [role, setRole] = useState<
    "owner" | "admin" | "member" | "viewer" | ""
  >("");
  const [status, setStatus] = useState<"active" | "invited" | "suspended" | "">(
    "",
  );
  const [page, setPage] = useState(1);

  const { data, isLoading, isError } = useUsers({
    page,
    search,
    role: role || undefined,
    status: status || undefined,
  });

  useEffect(() => {
    setPage(1);
  }, [search, role, status]);

  if (isLoading) {
    return <div>Loading users...</div>;
  }

  if (isError) {
    return <div>Failed to load users.</div>;
  }

  const totalPages = data?.pagination.totalPages ?? 1;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-semibold tracking-tight">Users</h1>

        <p className="mt-1 text-sm text-muted-foreground">
          Manage users in your organization.
        </p>
      </div>

      <div className="flex flex-col gap-3 md:flex-row">
        <input
          type="search"
          value={search}
          onChange={(event) => setSearch(event.target.value)}
          placeholder="Search by name or email..."
          className="w-full rounded-lg border bg-background px-4 py-2.5 text-sm outline-none transition focus:ring-2 focus:ring-primary/20 md:max-w-md"
        />

        <select
          value={role}
          onChange={(event) =>
            setRole(
              event.target.value as
                "owner" | "admin" | "member" | "viewer" | "",
            )
          }
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
          onChange={(event) =>
            setStatus(
              event.target.value as "active" | "invited" | "suspended" | "",
            )
          }
          className="rounded-lg border bg-background px-4 py-2.5 text-sm outline-none"
        >
          <option value="">All statuses</option>
          <option value="active">Active</option>
          <option value="invited">Invited</option>
          <option value="suspended">Suspended</option>
        </select>
      </div>

      <UsersTable users={data?.data ?? []} />

      <UsersPagination
        page={page}
        totalPages={totalPages}
        onPageChange={setPage}
      />
    </div>
  );
}
