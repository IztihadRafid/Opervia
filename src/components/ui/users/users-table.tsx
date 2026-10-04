"use client";

import type { User } from "@/hooks/use-users";
import { UserActionsMenu } from "./userActionsMenu";

interface UsersTableProps {
  users: User[];
  onEditUser?: (user: User) => void;
  onDeleteUser?: (user: User) => void;
}

export function UsersTable({
  users,
  onEditUser,
  onDeleteUser,
}: UsersTableProps) {
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
                  <UserActionsMenu
                    onEdit={() => onEditUser?.(user)}
                    onDelete={() => onDeleteUser?.(user)}
                  />
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
