"use client";
import { useState, type SubmitEvent } from "react";
import { Loader2, Receipt, X } from "lucide-react";

import type {
  CreateExpenseInput,
  ExpenseCategory,
  ExpenseItem,
  ExpensePaymentMethod,
  ExpenseStatus,
} from "@/hooks/useExpenses";
import type { VendorItem } from "@/hooks/useVendors";
import type { ApplicationItem } from "@/hooks/useApplications";

interface ExpenseFormProps {
  expense?: ExpenseItem | null;
  vendors: VendorItem[];
  applications: ApplicationItem[];
  isSubmitting?: boolean;
  submitError?: string | null;
  onSubmit: (input: CreateExpenseInput) => void | Promise<void>;
  onCancel: () => void;
}

const categories: { value: ExpenseCategory; label: string }[] = [
  { value: "software", label: "Software" },
  { value: "hardware", label: "Hardware" },
  { value: "cloud_hosting", label: "Cloud hosting" },
  { value: "marketing", label: "Marketing" },
  { value: "office", label: "Office" },
  { value: "travel", label: "Travel" },
  { value: "professional_services", label: "Professional services" },
  { value: "other", label: "Other" },
];

const statuses: { value: ExpenseStatus; label: string }[] = [
  { value: "paid", label: "Paid" },
  { value: "pending", label: "Pending" },
  { value: "overdue", label: "Overdue" },
  { value: "cancelled", label: "Cancelled" },
];

const paymentMethods: { value: ExpensePaymentMethod; label: string }[] = [
  { value: "credit_card", label: "Credit card" },
  { value: "debit_card", label: "Debit card" },
  { value: "bank_transfer", label: "Bank transfer" },
  { value: "cash", label: "Cash" },
  { value: "paypal", label: "PayPal" },
  { value: "other", label: "Other" },
];

function toDateInputValue(value?: string | null) {
  if (!value) return "";

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) return "";

  return date.toISOString().slice(0, 10);
}

function getInitialFormValues(expense?: ExpenseItem | null) {
  return {
    title: expense?.title ?? "",
    description: expense?.description ?? "",
    category: expense?.category ?? ("software" as ExpenseCategory),
    amount: expense ? String(expense.amount) : "",
    currency: expense?.currency ?? "USD",
    expenseDate: toDateInputValue(expense?.expenseDate),
    dueDate: toDateInputValue(expense?.dueDate),
    status: expense?.status ?? ("pending" as ExpenseStatus),
    paymentMethod: expense?.paymentMethod ?? "",
    vendorId: expense?.vendorId ?? "",
    applicationId: expense?.applicationId ?? "",
    invoiceNumber: expense?.invoiceNumber ?? "",
    notes: expense?.notes ?? "",
  };
}

const inputClassName =
  "w-full rounded-xl border border-border bg-background px-3.5 py-2.5 text-sm outline-none transition placeholder:text-muted-foreground focus-visible:ring-2 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-60";

const labelClassName = "mb-1.5 block text-sm font-medium";

function Field({
  label,
  children,
  required = false,
}: {
  label: string;
  children: React.ReactNode;
  required?: boolean;
}) {
  return (
    <div className="min-w-0">
      <label className={labelClassName}>
        {label}
        {required && <span className="ml-1 text-destructive">*</span>}
      </label>
      {children}
    </div>
  );
}

export default function ExpenseForm({
  expense,
  vendors,
  applications,
  isSubmitting = false,
  submitError,
  onSubmit,
  onCancel,
}: ExpenseFormProps) {
  const [form, setForm] = useState(() => getInitialFormValues(expense));
  const [validationError, setValidationError] = useState<string | null>(null);

  const isEditing = Boolean(expense);

  function updateField<K extends keyof typeof form>(
    field: K,
    value: (typeof form)[K],
  ) {
    setForm((current) => ({ ...current, [field]: value }));
    setValidationError(null);
  }

  async function handleSubmit(event: SubmitEvent<HTMLFormElement>) {
    event.preventDefault();
    setValidationError(null);

    const title = form.title.trim();
    const amount = Number(form.amount);

    if (title.length < 2) {
      setValidationError(
        "The expense title must contain at least 2 characters.",
      );
      return;
    }

    if (!form.amount.trim() || !Number.isFinite(amount) || amount <= 0) {
      setValidationError("Enter a valid amount greater than zero.");
      return;
    }

    if (!/^[A-Za-z]{3}$/.test(form.currency.trim())) {
      setValidationError(
        "Enter a valid three-letter currency code, such as USD.",
      );
      return;
    }

    if (!form.expenseDate) {
      setValidationError("Select the expense date.");
      return;
    }

    if (form.dueDate && form.dueDate < form.expenseDate) {
      setValidationError("The due date cannot be before the expense date.");
      return;
    }

    const input: CreateExpenseInput = {
      title,
      description: form.description.trim() || null,
      category: form.category,
      amount,
      currency: form.currency.trim().toUpperCase(),
      expenseDate: form.expenseDate,
      dueDate: form.dueDate || null,
      status: form.status,
      paymentMethod: form.paymentMethod
        ? (form.paymentMethod as ExpensePaymentMethod)
        : null,
      vendorId: form.vendorId || null,
      applicationId: form.applicationId || null,
      invoiceNumber: form.invoiceNumber.trim() || null,
      notes: form.notes.trim() || null,
    };

    try {
      await onSubmit(input);
    } catch {
      // The parent handles and displays API errors.
    }
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-3 backdrop-blur-sm sm:p-6"
      onMouseDown={(event) => {
        if (event.target === event.currentTarget && !isSubmitting) {
          onCancel();
        }
      }}
    >
      <section
        role="dialog"
        aria-modal="true"
        aria-labelledby="expense-form-title"
        className="flex max-h-[92vh] w-full max-w-3xl flex-col overflow-hidden rounded-2xl border border-border bg-background shadow-2xl"
      >
        {/* Modal header */}
        <div className="flex items-center justify-between gap-4 border-b border-border px-5 py-4 sm:px-6">
          <div className="flex min-w-0 items-center gap-3">
            <div className="flex size-11 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-primary">
              <Receipt className="size-5" />
            </div>

            <div>
              <h2
                id="expense-form-title"
                className="font-semibold tracking-tight"
              >
                {isEditing ? "Edit expense" : "Add expense"}
              </h2>
              <p className="mt-0.5 text-sm text-muted-foreground">
                {isEditing
                  ? "Update the expense record and payment details."
                  : "Record a business expense for your organization."}
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onCancel}
            disabled={isSubmitting}
            aria-label="Close expense form"
            className="flex size-9 shrink-0 items-center justify-center rounded-lg text-muted-foreground transition hover:bg-muted hover:text-foreground disabled:opacity-50"
          >
            <X className="size-5" />
          </button>
        </div>

        {/* Form body */}
        <form onSubmit={handleSubmit} className="flex min-h-0 flex-1 flex-col">
          <div className="flex-1 space-y-6 overflow-y-auto p-5 sm:p-6">
            <div>
              <h3 className="text-sm font-semibold">Expense details</h3>
              <p className="mt-1 text-xs text-muted-foreground">
                Provide the expense description and classification.
              </p>
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <div className="sm:col-span-2">
                <Field label="Expense title" required>
                  <input
                    value={form.title}
                    onChange={(event) =>
                      updateField("title", event.target.value)
                    }
                    required
                    minLength={2}
                    maxLength={150}
                    disabled={isSubmitting}
                    placeholder="e.g. Monthly cloud hosting"
                    className={inputClassName}
                  />
                </Field>
              </div>

              <Field label="Category" required>
                <select
                  value={form.category}
                  onChange={(event) =>
                    updateField(
                      "category",
                      event.target.value as ExpenseCategory,
                    )
                  }
                  required
                  disabled={isSubmitting}
                  className={inputClassName}
                >
                  {categories.map((category) => (
                    <option key={category.value} value={category.value}>
                      {category.label}
                    </option>
                  ))}
                </select>
              </Field>

              <Field label="Expense amount" required>
                <input
                  type="number"
                  value={form.amount}
                  onChange={(event) =>
                    updateField("amount", event.target.value)
                  }
                  required
                  min="0.01"
                  max="1000000000000"
                  step="any"
                  disabled={isSubmitting}
                  placeholder="0.00"
                  className={inputClassName}
                />
              </Field>

              <Field label="Currency" required>
                <input
                  value={form.currency}
                  onChange={(event) =>
                    updateField("currency", event.target.value.toUpperCase())
                  }
                  required
                  minLength={3}
                  maxLength={3}
                  pattern="[A-Za-z]{3}"
                  disabled={isSubmitting}
                  placeholder="USD"
                  className={inputClassName}
                />
                <p className="mt-1 text-xs text-muted-foreground">
                  Three-letter currency code, such as USD or BDT.
                </p>
              </Field>

              <Field label="Expense date" required>
                <input
                  type="date"
                  value={form.expenseDate}
                  onChange={(event) =>
                    updateField("expenseDate", event.target.value)
                  }
                  required
                  disabled={isSubmitting}
                  className={inputClassName}
                />
              </Field>

              <Field label="Due date">
                <input
                  type="date"
                  value={form.dueDate}
                  min={form.expenseDate || undefined}
                  onChange={(event) =>
                    updateField("dueDate", event.target.value)
                  }
                  disabled={isSubmitting}
                  className={inputClassName}
                />
              </Field>

              <div className="sm:col-span-2">
                <Field label="Description">
                  <textarea
                    value={form.description}
                    onChange={(event) =>
                      updateField("description", event.target.value)
                    }
                    maxLength={2000}
                    rows={3}
                    disabled={isSubmitting}
                    placeholder="Add context about this expense..."
                    className={`${inputClassName} resize-y`}
                  />
                </Field>
              </div>
            </div>

            <div className="border-t border-border pt-5">
              <h3 className="text-sm font-semibold">
                Associations and payment
              </h3>
              <p className="mt-1 text-xs text-muted-foreground">
                Optionally connect this expense to an existing vendor or
                application.
              </p>
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <Field label="Vendor">
                <select
                  value={form.vendorId}
                  onChange={(event) =>
                    updateField("vendorId", event.target.value)
                  }
                  disabled={isSubmitting}
                  className={inputClassName}
                >
                  <option value="">No vendor</option>
                  {vendors.map((vendor) => (
                    <option key={vendor._id} value={vendor._id}>
                      {vendor.name}
                    </option>
                  ))}
                </select>
              </Field>

              <Field label="Application">
                <select
                  value={form.applicationId}
                  onChange={(event) =>
                    updateField("applicationId", event.target.value)
                  }
                  disabled={isSubmitting}
                  className={inputClassName}
                >
                  <option value="">No application</option>
                  {applications.map((application) => (
                    <option key={application._id} value={application._id}>
                      {application.name}
                    </option>
                  ))}
                </select>
              </Field>

              <Field label="Payment status" required>
                <select
                  value={form.status}
                  onChange={(event) =>
                    updateField("status", event.target.value as ExpenseStatus)
                  }
                  required
                  disabled={isSubmitting}
                  className={inputClassName}
                >
                  {statuses.map((status) => (
                    <option key={status.value} value={status.value}>
                      {status.label}
                    </option>
                  ))}
                </select>
              </Field>

              <Field label="Payment method">
                <select
                  value={form.paymentMethod}
                  onChange={(event) =>
                    updateField(
                      "paymentMethod",
                      event.target.value as ExpensePaymentMethod | "",
                    )
                  }
                  disabled={isSubmitting}
                  className={inputClassName}
                >
                  <option value="">Not specified</option>
                  {paymentMethods.map((method) => (
                    <option key={method.value} value={method.value}>
                      {method.label}
                    </option>
                  ))}
                </select>
              </Field>

              <div className="sm:col-span-2">
                <Field label="Invoice number">
                  <input
                    value={form.invoiceNumber}
                    onChange={(event) =>
                      updateField("invoiceNumber", event.target.value)
                    }
                    maxLength={150}
                    disabled={isSubmitting}
                    placeholder="e.g. INV-2026-001"
                    className={inputClassName}
                  />
                </Field>
              </div>

              <div className="sm:col-span-2">
                <Field label="Internal notes">
                  <textarea
                    value={form.notes}
                    onChange={(event) =>
                      updateField("notes", event.target.value)
                    }
                    maxLength={2000}
                    rows={3}
                    disabled={isSubmitting}
                    placeholder="Add internal notes for your team..."
                    className={`${inputClassName} resize-y`}
                  />
                </Field>
              </div>
            </div>

            {(validationError || submitError) && (
              <div
                role="alert"
                className="rounded-xl border border-destructive/30 bg-destructive/5 px-4 py-3 text-sm text-destructive"
              >
                {validationError || submitError}
              </div>
            )}
          </div>

          {/* Modal footer */}
          <div className="flex flex-col-reverse gap-2 border-t border-border bg-muted/20 px-5 py-4 sm:flex-row sm:justify-end sm:px-6">
            <button
              type="button"
              onClick={onCancel}
              disabled={isSubmitting}
              className="rounded-xl border border-border px-4 py-2.5 text-sm font-medium transition hover:bg-muted disabled:cursor-not-allowed disabled:opacity-50"
            >
              Cancel
            </button>

            <button
              type="submit"
              disabled={isSubmitting}
              className="inline-flex items-center justify-center gap-2 rounded-xl bg-primary px-4 py-2.5 text-sm font-medium text-primary-foreground transition hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-60"
            >
              {isSubmitting && <Loader2 className="size-4 animate-spin" />}
              {isSubmitting
                ? "Saving..."
                : isEditing
                  ? "Save changes"
                  : "Create expense"}
            </button>
          </div>
        </form>
      </section>
    </div>
  );
}
