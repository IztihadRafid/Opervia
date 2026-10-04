"use client";

import { useState } from "react";

import { useDeleteUser } from "@/hooks/useDeleteUser";
import type { User } from "@/hooks/use-users";

interface DeleteUserDialogProps {
  user: User | null;
  open: boolean;
  onClose: () => void;
}

export function DeleteUserDialog({
  user,
  open,
  onClose,
}: DeleteUserDialogProps) {
  const deleteUserMutation = useDeleteUser();
  const [confirmation, setConfirmation] = useState("");

  if (!open || !user) {
    return null;
  }

  const canDelete = confirmation === "DELETE";

  async function handleDelete() {
    if (!canDelete) {
      return;
    }

    try {
      await deleteUserMutation.mutateAsync(user._id);
      setConfirmation("");
      onClose();
    } catch {
      // The mutation error is displayed below.
    }
  }

  function handleClose() {
    if (deleteUserMutation.isPending) {
      return;
    }

    setConfirmation("");
    onClose();
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 backdrop-blur-sm"
      onMouseDown={(event) => {
        if (event.target === event.currentTarget) {
          handleClose();
        }
      }}
    >
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="delete-user-title"
        className="w-full max-w-md rounded-2xl border bg-background p-6 shadow-xl"
      >
        <div className="space-y-2">
          <h2
            id="delete-user-title"
            className="text-xl font-semibold tracking-tight"
          >
            Delete User
          </h2>

          <p className="text-sm text-muted-foreground">
            This will permanently remove{" "}
            <span className="font-medium text-foreground">{user.name}</span>{" "}
            from the organization.
          </p>
        </div>

        <div className="mt-5 space-y-2">
          <label
            htmlFor="delete-user-confirmation"
            className="text-sm font-medium"
          >
            Type <span className="font-semibold">DELETE</span> to confirm
          </label>

          <input
            id="delete-user-confirmation"
            type="text"
            value={confirmation}
            onChange={(event) => setConfirmation(event.target.value)}
            disabled={deleteUserMutation.isPending}
            placeholder="DELETE"
            className="w-full rounded-lg border bg-background px-4 py-2.5 text-sm outline-none transition focus:ring-2 focus:ring-primary/20 disabled:cursor-not-allowed disabled:opacity-60"
          />
        </div>

        {deleteUserMutation.isError && (
          <div className="mt-4 rounded-lg border border-destructive/20 bg-destructive/5 px-4 py-3">
            <p className="text-sm text-destructive">
              {deleteUserMutation.error.message}
            </p>
          </div>
        )}

        <div className="mt-6 flex justify-end gap-3">
          <button
            type="button"
            onClick={handleClose}
            disabled={deleteUserMutation.isPending}
            className="rounded-lg border px-4 py-2 text-sm font-medium transition hover:bg-muted disabled:cursor-not-allowed disabled:opacity-50"
          >
            Cancel
          </button>

          <button
            type="button"
            onClick={handleDelete}
            disabled={!canDelete || deleteUserMutation.isPending}
            className="rounded-lg bg-destructive px-4 py-2 text-sm font-medium text-destructive-foreground transition hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-50"
          >
            {deleteUserMutation.isPending ? "Deleting..." : "Delete User"}
          </button>
        </div>
      </div>
    </div>
  );
}
