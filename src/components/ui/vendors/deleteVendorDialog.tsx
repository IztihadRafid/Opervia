"use client";

import { useState } from "react";
import { AlertTriangle, Loader2, Trash2 } from "lucide-react";

import { useDeleteVendor, type VendorItem } from "@/hooks/useVendors";

interface DeleteVendorDialogProps {
  vendor: VendorItem | null;
  open: boolean;
  onClose: () => void;
  onDeleted?: (vendorName: string) => void;
}

export function DeleteVendorDialog({
  vendor,
  open,
  onClose,
  onDeleted,
}: DeleteVendorDialogProps) {
  const [confirmation, setConfirmation] = useState("");
  const deleteVendorMutation = useDeleteVendor();

  if (!open || !vendor) {
    return null;
  }

  const isDeleting = deleteVendorMutation.isPending;
  const isConfirmed = confirmation.trim() === "DELETE";

  function handleClose() {
    if (isDeleting) return;

    setConfirmation("");
    deleteVendorMutation.reset();
    onClose();
  }

  function handleDelete() {
    if (!vendor || !isConfirmed || isDeleting) return;
    const deletedName = vendor.name;
    deleteVendorMutation.mutate(vendor._id, {
      onSuccess: () => {
        setConfirmation("");
        deleteVendorMutation.reset();
        onClose();
        onDeleted?.(deletedName);
      },
    });
  }

  const errorMessage = deleteVendorMutation.error
    ? deleteVendorMutation.error instanceof Error
      ? deleteVendorMutation.error.message
      : "Unable to delete this vendor. Please try again."
    : null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm"
      onMouseDown={(event) => {
        if (event.target === event.currentTarget) {
          handleClose();
        }
      }}
    >
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="delete-vendor-title"
        aria-describedby="delete-vendor-description"
        className="w-full max-w-md rounded-2xl border border-border bg-background p-6 shadow-2xl"
      >
        <div className="mb-5 flex items-start gap-4">
          <div className="flex size-11 shrink-0 items-center justify-center rounded-xl bg-destructive/10 text-destructive">
            <AlertTriangle className="size-5" />
          </div>

          <div className="min-w-0 flex-1">
            <h2
              id="delete-vendor-title"
              className="text-lg font-semibold tracking-tight"
            >
              Delete vendor
            </h2>

            <p
              id="delete-vendor-description"
              className="mt-1 text-sm leading-6 text-muted-foreground"
            >
              This action cannot be undone. The vendor will be permanently
              removed from your organization.
            </p>
          </div>
        </div>

        <div className="mb-5 rounded-xl border border-border bg-muted/40 p-4">
          <p className="truncate text-sm font-semibold">{vendor.name}</p>

          {vendor.contactEmail && (
            <p className="mt-1 truncate text-sm text-muted-foreground">
              {vendor.contactEmail}
            </p>
          )}

          {vendor.applicationCount > 0 && (
            <p className="mt-3 text-sm text-amber-600 dark:text-amber-400">
              This vendor is linked to {vendor.applicationCount}{" "}
              {vendor.applicationCount === 1 ? "application" : "applications"}.
              Check the server response if deletion is blocked by these links.
            </p>
          )}
        </div>

        <div className="space-y-2">
          <label
            htmlFor="delete-vendor-confirmation"
            className="text-sm font-medium"
          >
            Type <span className="font-semibold">DELETE</span> to confirm
          </label>

          <input
            id="delete-vendor-confirmation"
            type="text"
            value={confirmation}
            onChange={(event) => setConfirmation(event.target.value)}
            disabled={isDeleting}
            placeholder="DELETE"
            autoComplete="off"
            className="w-full rounded-lg border border-border bg-background px-4 py-2.5 text-sm outline-none transition focus:border-primary focus:ring-2 focus:ring-primary/20 disabled:cursor-not-allowed disabled:opacity-60"
          />
        </div>

        {errorMessage && (
          <div
            role="alert"
            className="mt-4 rounded-lg border border-destructive/30 bg-destructive/5 px-3 py-2.5 text-sm text-destructive"
          >
            {errorMessage}
          </div>
        )}

        <div className="mt-6 flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
          <button
            type="button"
            onClick={handleClose}
            disabled={isDeleting}
            className="inline-flex items-center justify-center rounded-lg border border-border px-4 py-2.5 text-sm font-medium transition hover:bg-muted disabled:cursor-not-allowed disabled:opacity-60"
          >
            Cancel
          </button>

          <button
            type="button"
            onClick={handleDelete}
            disabled={!isConfirmed || isDeleting}
            className="inline-flex items-center justify-center gap-2 rounded-lg bg-[#A33757] px-4 py-2.5 text-sm font-medium text-white transition hover:bg-[#852E4E] disabled:cursor-not-allowed disabled:opacity-50"
          >
            {isDeleting ? (
              <>
                <Loader2 className="size-4 animate-spin" />
                Deleting...
              </>
            ) : (
              <>
                <Trash2 className="size-4" />
                Delete vendor
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
