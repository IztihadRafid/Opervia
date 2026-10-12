"use client";

import { useEffect, useState } from "react";

import type {
  CreateVendorInput,
  VendorItem,
  VendorStatus,
} from "@/hooks/useVendors";

interface VendorFormProps {
  vendor?: VendorItem | null;
  isSaving: boolean;
  errorMessage?: string;
  onSubmit: (input: CreateVendorInput) => Promise<void>;
  onCancel: () => void;
}

const inputClass =
  "w-full rounded-lg border border-border bg-background px-3 py-2.5 text-sm text-foreground outline-none transition placeholder:text-muted-foreground focus-visible:ring-2 focus-visible:ring-ring disabled:opacity-60";

const labelClass = "mb-1.5 block text-sm font-medium text-foreground";

export default function VendorForm({
  vendor,
  isSaving,
  errorMessage,
  onSubmit,
  onCancel,
}: VendorFormProps) {
  const [name, setName] = useState("");
  const [website, setWebsite] = useState("");
  const [contactName, setContactName] = useState("");
  const [contactEmail, setContactEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [notes, setNotes] = useState("");
  const [status, setStatus] = useState<VendorStatus>("active");

  useEffect(() => {
    setName(vendor?.name ?? "");
    setWebsite(vendor?.website ?? "");
    setContactName(vendor?.contactName ?? "");
    setContactEmail(vendor?.contactEmail ?? "");
    setPhone(vendor?.phone ?? "");
    setNotes(vendor?.notes ?? "");
    setStatus(vendor?.status ?? "active");
  }, [vendor]);

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();

    const input: CreateVendorInput = {
      name: name.trim(),
      website: website.trim() || undefined,
      contactName: contactName.trim() || undefined,
      contactEmail: contactEmail.trim() || undefined,
      phone: phone.trim() || undefined,
      notes: notes.trim() || undefined,
      status,
    };

    await onSubmit(input);
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-5">
      <div>
        <h2 className="text-xl font-semibold tracking-tight">
          {vendor ? "Edit vendor" : "Add a vendor"}
        </h2>
        <p className="mt-1 text-sm text-muted-foreground">
          Keep your supplier and software provider information organized.
        </p>
      </div>

      {errorMessage && (
        <div
          role="alert"
          className="rounded-lg border border-destructive/30 bg-destructive/10 px-4 py-3 text-sm text-destructive"
        >
          {errorMessage}
        </div>
      )}

      <div className="grid gap-4 sm:grid-cols-2">
        <div className="sm:col-span-2">
          <label htmlFor="vendor-name" className={labelClass}>
            Vendor name *
          </label>
          <input
            id="vendor-name"
            name="name"
            required
            minLength={2}
            maxLength={150}
            value={name}
            onChange={(event) => setName(event.target.value)}
            placeholder="e.g. Microsoft"
            className={inputClass}
            disabled={isSaving}
          />
        </div>

        <div className="sm:col-span-2">
          <label htmlFor="vendor-website" className={labelClass}>
            Website
          </label>
          <input
            id="vendor-website"
            name="website"
            type="url"
            maxLength={500}
            value={website}
            onChange={(event) => setWebsite(event.target.value)}
            placeholder="https://example.com"
            className={inputClass}
            disabled={isSaving}
          />
        </div>

        <div>
          <label htmlFor="vendor-contact-name" className={labelClass}>
            Contact person
          </label>
          <input
            id="vendor-contact-name"
            name="contactName"
            maxLength={150}
            value={contactName}
            onChange={(event) => setContactName(event.target.value)}
            placeholder="Contact name"
            className={inputClass}
            disabled={isSaving}
          />
        </div>

        <div>
          <label htmlFor="vendor-contact-email" className={labelClass}>
            Contact email
          </label>
          <input
            id="vendor-contact-email"
            name="contactEmail"
            type="email"
            maxLength={254}
            value={contactEmail}
            onChange={(event) => setContactEmail(event.target.value)}
            placeholder="contact@example.com"
            className={inputClass}
            disabled={isSaving}
          />
        </div>

        <div>
          <label htmlFor="vendor-phone" className={labelClass}>
            Phone
          </label>
          <input
            id="vendor-phone"
            name="phone"
            type="tel"
            maxLength={50}
            value={phone}
            onChange={(event) => setPhone(event.target.value)}
            placeholder="Phone number"
            className={inputClass}
            disabled={isSaving}
          />
        </div>

        <div>
          <label htmlFor="vendor-status" className={labelClass}>
            Status
          </label>
          <select
            id="vendor-status"
            name="status"
            value={status}
            onChange={(event) => setStatus(event.target.value as VendorStatus)}
            className={inputClass}
            disabled={isSaving}
          >
            <option value="active">Active</option>
            <option value="inactive">Inactive</option>
          </select>
        </div>

        <div className="sm:col-span-2">
          <label htmlFor="vendor-notes" className={labelClass}>
            Notes
          </label>
          <textarea
            id="vendor-notes"
            name="notes"
            rows={4}
            maxLength={2000}
            value={notes}
            onChange={(event) => setNotes(event.target.value)}
            placeholder="Contract details, renewal notes, or other information..."
            className={`${inputClass} resize-y`}
            disabled={isSaving}
          />
          <p className="mt-1 text-xs text-muted-foreground">
            {notes.length}/2000 characters
          </p>
        </div>
      </div>

      <div className="flex flex-col-reverse gap-2 border-t border-border pt-4 sm:flex-row sm:justify-end">
        <button
          type="button"
          onClick={onCancel}
          disabled={isSaving}
          className="rounded-lg border border-border px-4 py-2.5 text-sm font-medium transition hover:bg-muted disabled:opacity-50"
        >
          Cancel
        </button>

        <button
          type="submit"
          disabled={isSaving || name.trim().length < 2}
          className="rounded-lg bg-primary px-4 py-2.5 text-sm font-medium text-primary-foreground transition hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-50"
        >
          {isSaving ? "Saving..." : vendor ? "Save changes" : "Create vendor"}
        </button>
      </div>
    </form>
  );
}
