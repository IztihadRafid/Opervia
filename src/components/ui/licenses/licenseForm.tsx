"use client";

import { useState } from "react";
import { useApplications } from "@/hooks/useApplications";
import type {
  CreateLicenseInput,
  LicenseItem,
  LicenseStatus,
  LicenseType,
  UpdateLicenseInput,
} from "@/hooks/useLicenses";

interface LicenseFormProps {
  license?: LicenseItem | null;
  isSaving: boolean;
  errorMessage?: string;
  onSubmit: (input: CreateLicenseInput | UpdateLicenseInput) => Promise<void>;
  onCancel: () => void;
}

const inputClass =
  "w-full rounded-lg border border-border bg-background px-3 py-2.5 text-sm text-foreground outline-none transition placeholder:text-muted-foreground focus-visible:ring-2 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-60";

const labelClass = "mb-1.5 block text-sm font-medium text-foreground";

const licenseTypes: { value: LicenseType; label: string }[] = [
  { value: "named_user", label: "Named user" },
  { value: "concurrent", label: "Concurrent" },
  { value: "site", label: "Site license" },
  { value: "device", label: "Device" },
  { value: "subscription", label: "Subscription" },
  { value: "perpetual", label: "Perpetual" },
];

const licenseStatuses: { value: LicenseStatus; label: string }[] = [
  { value: "active", label: "Active" },
  { value: "expired", label: "Expired" },
  { value: "suspended", label: "Suspended" },
  { value: "cancelled", label: "Cancelled" },
];

function toDateInputValue(value?: string | null) {
  if (!value) return "";

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) return "";

  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");

  return `${year}-${month}-${day}`;
}

export default function LicenseForm({
  license,
  isSaving,
  errorMessage,
  onSubmit,
  onCancel,
}: LicenseFormProps) {
  const { data: applicationsData, isPending: isLoadingApplications } =
    useApplications({ page: 1, limit: 100 });

  const applications = applicationsData?.applications ?? [];

  const [applicationId, setApplicationId] = useState(
    () => license?.applicationId ?? "",
  );
  const [name, setName] = useState(() => license?.name ?? "");
  const [licenseType, setLicenseType] = useState<LicenseType>(
    () => license?.licenseType ?? "named_user",
  );
  const [totalSeats, setTotalSeats] = useState(() =>
    String(license?.totalSeats ?? 1),
  );
  const [usedSeats, setUsedSeats] = useState(() =>
    String(license?.usedSeats ?? 0),
  );
  const [status, setStatus] = useState<LicenseStatus>(
    () => license?.status ?? "active",
  );
  const [startDate, setStartDate] = useState(() =>
    toDateInputValue(license?.startDate),
  );
  const [expiryDate, setExpiryDate] = useState(() =>
    toDateInputValue(license?.expiryDate),
  );
  const [notes, setNotes] = useState(() => license?.notes ?? "");
  const [validationError, setValidationError] = useState("");

  async function handleSubmit(event: React.SubmitEvent<HTMLFormElement>) {
    event.preventDefault();
    setValidationError("");

    const parsedTotalSeats = Number(totalSeats);
    const parsedUsedSeats = Number(usedSeats);

    if (!applicationId) {
      setValidationError("Please select an application.");
      return;
    }

    if (!Number.isInteger(parsedTotalSeats) || parsedTotalSeats < 1) {
      setValidationError(
        "Total seats must be a whole number greater than zero.",
      );
      return;
    }

    if (!Number.isInteger(parsedUsedSeats) || parsedUsedSeats < 0) {
      setValidationError("Used seats must be a non-negative whole number.");
      return;
    }

    if (parsedUsedSeats > parsedTotalSeats) {
      setValidationError("Used seats cannot exceed total seats.");
      return;
    }

    if (!startDate) {
      setValidationError("Please select a start date.");
      return;
    }

    if (expiryDate && expiryDate < startDate) {
      setValidationError("Expiry date cannot be before the start date.");
      return;
    }

    const input: CreateLicenseInput | UpdateLicenseInput = {
      applicationId,
      name: name.trim(),
      licenseType,
      totalSeats: parsedTotalSeats,
      usedSeats: parsedUsedSeats,
      status,
      startDate,
      ...(expiryDate ? { expiryDate } : license ? { expiryDate: null } : {}),
      notes: notes.trim() || "",
    };

    await onSubmit(input);
  }

  const isDisabled = isSaving || isLoadingApplications;

  return (
    <form onSubmit={handleSubmit} className="space-y-5">
      <div>
        <h2 className="text-xl font-semibold tracking-tight">
          {license ? "Edit license" : "Add a license"}
        </h2>
        <p className="mt-1 text-sm text-muted-foreground">
          Track software entitlements, seat usage, and license expiry.
        </p>
      </div>

      {(errorMessage || validationError) && (
        <div
          role="alert"
          className="rounded-lg border border-destructive/30 bg-destructive/10 px-4 py-3 text-sm text-destructive"
        >
          {validationError || errorMessage}
        </div>
      )}

      <div>
        <label htmlFor="license-application" className={labelClass}>
          Application *
        </label>
        <select
          id="license-application"
          name="applicationId"
          required
          value={applicationId}
          onChange={(event) => setApplicationId(event.target.value)}
          className={inputClass}
          disabled={isDisabled}
        >
          <option value="">
            {isLoadingApplications
              ? "Loading applications..."
              : "Select an application"}
          </option>
          {applications.map((application) => (
            <option key={application._id} value={application._id}>
              {application.name}
              {application.vendor ? ` — ${application.vendor}` : ""}
            </option>
          ))}
        </select>
        {!isLoadingApplications && applications.length === 0 && (
          <p className="mt-1.5 text-xs text-muted-foreground">
            No applications found. Create an application before adding a
            license.
          </p>
        )}
      </div>

      <div>
        <label htmlFor="license-name" className={labelClass}>
          License name *
        </label>
        <input
          id="license-name"
          name="name"
          required
          minLength={2}
          maxLength={150}
          value={name}
          onChange={(event) => setName(event.target.value)}
          placeholder="e.g. Microsoft 365 Business"
          className={inputClass}
          disabled={isSaving}
        />
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <div>
          <label htmlFor="license-type" className={labelClass}>
            License type *
          </label>
          <select
            id="license-type"
            name="licenseType"
            required
            value={licenseType}
            onChange={(event) =>
              setLicenseType(event.target.value as LicenseType)
            }
            className={inputClass}
            disabled={isSaving}
          >
            {licenseTypes.map((type) => (
              <option key={type.value} value={type.value}>
                {type.label}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label htmlFor="license-status" className={labelClass}>
            Status *
          </label>
          <select
            id="license-status"
            name="status"
            required
            value={status}
            onChange={(event) => setStatus(event.target.value as LicenseStatus)}
            className={inputClass}
            disabled={isSaving}
          >
            {licenseStatuses.map((item) => (
              <option key={item.value} value={item.value}>
                {item.label}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label htmlFor="license-total-seats" className={labelClass}>
            Total seats *
          </label>
          <input
            id="license-total-seats"
            name="totalSeats"
            type="number"
            required
            min={1}
            step={1}
            value={totalSeats}
            onChange={(event) => setTotalSeats(event.target.value)}
            className={inputClass}
            disabled={isSaving}
          />
        </div>

        <div>
          <label htmlFor="license-used-seats" className={labelClass}>
            Used seats *
          </label>
          <input
            id="license-used-seats"
            name="usedSeats"
            type="number"
            required
            min={0}
            step={1}
            value={usedSeats}
            onChange={(event) => setUsedSeats(event.target.value)}
            className={inputClass}
            disabled={isSaving}
          />
          <p className="mt-1 text-xs text-muted-foreground">
            Available seats:{" "}
            {Math.max(0, (Number(totalSeats) || 0) - (Number(usedSeats) || 0))}
          </p>
        </div>

        <div>
          <label htmlFor="license-start-date" className={labelClass}>
            Start date *
          </label>
          <input
            id="license-start-date"
            name="startDate"
            type="date"
            required
            value={startDate}
            onChange={(event) => setStartDate(event.target.value)}
            className={inputClass}
            disabled={isSaving}
          />
        </div>

        <div>
          <label htmlFor="license-expiry-date" className={labelClass}>
            Expiry date
          </label>
          <input
            id="license-expiry-date"
            name="expiryDate"
            type="date"
            min={startDate || undefined}
            value={expiryDate}
            onChange={(event) => setExpiryDate(event.target.value)}
            className={inputClass}
            disabled={isSaving}
          />
          <p className="mt-1 text-xs text-muted-foreground">
            Leave blank for licenses without an expiry date.
          </p>
        </div>
      </div>

      <div>
        <label htmlFor="license-notes" className={labelClass}>
          Notes
        </label>
        <textarea
          id="license-notes"
          name="notes"
          rows={3}
          maxLength={1000}
          value={notes}
          onChange={(event) => setNotes(event.target.value)}
          placeholder="Optional details about this license..."
          className={inputClass}
          disabled={isSaving}
        />
        <p className="mt-1 text-right text-xs text-muted-foreground">
          {notes.length}/1000
        </p>
      </div>

      <div className="flex flex-col-reverse gap-3 border-t border-border pt-4 sm:flex-row sm:justify-end">
        <button
          type="button"
          onClick={onCancel}
          disabled={isSaving}
          className="rounded-lg border border-border px-4 py-2.5 text-sm font-medium transition hover:bg-muted disabled:cursor-not-allowed disabled:opacity-60"
        >
          Cancel
        </button>
        <button
          type="submit"
          disabled={isDisabled || applications.length === 0}
          className="rounded-lg bg-primary px-4 py-2.5 text-sm font-medium text-primary-foreground transition hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-60"
        >
          {isSaving ? "Saving..." : license ? "Save changes" : "Create license"}
        </button>
      </div>
    </form>
  );
}
