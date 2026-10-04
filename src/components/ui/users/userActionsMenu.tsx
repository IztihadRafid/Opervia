"use client";

import { useState } from "react";

interface UserActionsMenuProps {
  onEdit?: () => void;
  onDelete?: () => void;
}

export function UserActionsMenu({ onEdit, onDelete }: UserActionsMenuProps) {
  const [open, setOpen] = useState(false);

  return (
    <div className="relative inline-block">
      <button
        type="button"
        onClick={() => setOpen((value) => !value)}
        aria-label="User actions"
        aria-expanded={open}
        className="rounded-lg border px-3 py-1.5 text-sm font-medium transition hover:bg-muted"
      >
        Manage
      </button>

      {open && (
        <div className="absolute right-0 top-full z-50 mt-2 w-40 rounded-xl border bg-background p-1.5 shadow-lg">
          <button
            type="button"
            onClick={() => {
              setOpen(false);
              onEdit?.();
            }}
            className="w-full rounded-lg px-3 py-2 text-left text-sm transition hover:bg-muted"
          >
            Edit user
          </button>

          <button
            type="button"
            onClick={() => {
              setOpen(false);
              onDelete?.();
            }}
            className="w-full rounded-lg px-3 py-2 text-left text-sm text-destructive transition hover:bg-destructive/10"
          >
            Delete user
          </button>
        </div>
      )}
    </div>
  );
}
