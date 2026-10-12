"use client";

import { Loader2, Receipt, Trash2, X } from "lucide-react";

import type { ExpenseItem } from "@/hooks/useExpenses";

interface DeleteExpenseDialogProps {
  expense: ExpenseItem;
  isDeleting?: boolean;
  error?: string | null;
  onConfirm: () => void | Promise<void>;
  onCancel: () => void;
}

export function DeleteExpenseDialog({
  expense,
  isDeleting = false,
  error,
  onConfirm,
  onCancel,
}: DeleteExpenseDialogProps) {
  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm"
      onMouseDown={(event) => {
        if (event.target === event.currentTarget && !isDeleting) {
          onCancel();
        }
      }}
    >
      <section
        role="alertdialog"
        aria-modal="true"
        aria-labelledby="delete-expense-title"
        aria-describedby="delete-expense-description"
        className="w-full max-w-md overflow-hidden rounded-2xl border border-border bg-background shadow-2xl"
      >
        <div className="flex items-start justify-between gap-4 border-b border-border p-5">
          <div className="flex items-start gap-3">
            <div className="flex size-11 shrink-0 items-center justify-center rounded-xl bg-destructive/10 text-destructive">
              <Trash2 className="size-5" />
            </div>

            <div>
              <h2
                id="delete-expense-title"
                className="font-semibold tracking-tight"
              >
                Delete expense?
              </h2>
              <p className="mt-1 text-sm text-muted-foreground">
                This action cannot be undone.
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onCancel}
            disabled={isDeleting}
            aria-label="Close delete confirmation"
            className="flex size-8 shrink-0 items-center justify-center rounded-lg text-muted-foreground transition hover:bg-muted hover:text-foreground disabled:opacity-50"
          >
            <X className="size-4" />
          </button>
        </div>

        <div className="space-y-4 p-5">
          <p
            id="delete-expense-description"
            className="text-sm leading-6 text-muted-foreground"
          >
            Are you sure you want to permanently delete this expense? Its record
            will be removed from your organization.
          </p>

          <div className="flex items-start gap-3 rounded-xl border border-border bg-muted/30 p-3.5">
            <div className="flex size-10 shrink-0 items-center justify-center rounded-lg border border-border bg-background">
              <Receipt className="size-4 text-muted-foreground" />
            </div>

            <div className="min-w-0 flex-1">
              <p className="break-words text-sm font-medium text-foreground">
                {expense.title}
              </p>
              <p className="mt-1 text-xs text-muted-foreground">
                {expense.currency}{" "}
                {expense.amount.toLocaleString("en-US", {
                  maximumFractionDigits: 2,
                })}
                {" · "}
                {expense.status.charAt(0).toUpperCase() +
                  expense.status.slice(1)}
              </p>
            </div>
          </div>

          {error && (
            <div
              role="alert"
              className="rounded-xl border border-destructive/30 bg-destructive/5 px-3.5 py-3 text-sm text-destructive"
            >
              {error}
            </div>
          )}
        </div>

        <div className="flex flex-col-reverse gap-2 border-t border-border bg-muted/20 p-5 sm:flex-row sm:justify-end">
          <button
            type="button"
            onClick={onCancel}
            disabled={isDeleting}
            className="rounded-xl border border-border px-4 py-2.5 text-sm font-medium transition hover:bg-muted disabled:cursor-not-allowed disabled:opacity-50"
          >
            Cancel
          </button>

          <button
            type="button"
            onClick={() => void onConfirm()}
            disabled={isDeleting}
            className="inline-flex items-center justify-center gap-2 rounded-xl bg-destructive px-4 py-2.5 text-sm font-medium text-destructive-foreground transition hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-60"
          >
            {isDeleting ? (
              <Loader2 className="size-4 animate-spin" />
            ) : (
              <Trash2 className="size-4" />
            )}
            {isDeleting ? "Deleting..." : "Delete expense"}
          </button>
        </div>
      </section>
    </div>
  );
}
