"use client";

import type { User } from "@/hooks/use-users";

interface UsersTableProps {
  users: User[];
}

export function UsersTable({ users }: UsersTableProps) {
  return (
    <div className="overflow-hidden rounded-xl border bg-card">
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead className="border-b bg-muted/30">
            <tr>
              <th className="px-6 py-4 text-left font-medium">User</th>

              <th className="px-6 py-4 text-left font-medium">Role</th>

              <th className="px-6 py-4 text-left font-medium">Status</th>

              <th className="px-6 py-4 text-left font-medium">Joined</th>

              <th className="px-6 py-4 text-right font-medium">Actions</th>
            </tr>
          </thead>

          <tbody className="divide-y">
            {users.map((user) => (
              <tr
                key={user._id}
                className="transition-colors hover:bg-muted/30"
              >
                <td className="px-6 py-4">
                  <div>
                    <p className="font-medium">{user.name}</p>

                    <p className="text-muted-foreground">{user.email}</p>
                  </div>
                </td>

                <td className="px-6 py-4 capitalize">{user.role}</td>

                <td className="px-6 py-4 capitalize">{user.status}</td>

                <td className="px-6 py-4 text-muted-foreground">
                  {new Date(user.createdAt).toLocaleDateString()}
                </td>

                <td className="px-6 py-4 text-right">
                  <button
                    type="button"
                    className="text-sm font-medium text-muted-foreground hover:text-foreground"
                  >
                    Manage
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
