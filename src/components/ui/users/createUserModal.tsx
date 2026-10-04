"use client";

import { useEffect } from "react";

interface CreateUserModalProps {
  open: boolean;
  onClose: () => void;
  children: React.ReactNode;
}

export function CreateUserModal({
  open,
  onClose,
  children,
}: CreateUserModalProps) {
  useEffect(() => {
    if (!open) {
      return;
    }

    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") {
        onClose();
      }
    }

    document.addEventListener("keydown", handleKeyDown);

    return () => {
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, [open, onClose]);

  if (!open) {
    return null;
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 backdrop-blur-sm"
      onMouseDown={(event) => {
        if (event.target === event.currentTarget) {
          onClose();
        }
      }}
    >
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="create-user-title"
        className="w-full max-w-lg rounded-2xl border bg-background p-6 shadow-xl"
      >
        <div className="mb-6 flex items-start justify-between gap-4">
          <div>
            <h2
              id="create-user-title"
              className="text-xl font-semibold tracking-tight"
            >
              Create User
            </h2>

            <p className="mt-1 text-sm text-muted-foreground">
              Add a new user to your organization.
            </p>
          </div>

          <button
            type="button"
            onClick={onClose}
            aria-label="Close"
            className="rounded-lg p-2 text-muted-foreground transition hover:bg-muted hover:text-foreground"
          >
            x
          </button>
        </div>

        {children}
      </div>
    </div>
  );
}
