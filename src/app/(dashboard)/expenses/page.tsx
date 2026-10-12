"use client";

import { useEffect, useState } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import {
  ChevronLeft,
  ChevronRight,
  CircleDollarSign,
  CreditCard,
  Loader2,
  Receipt,
  Search,
  TrendingDown,
  Pencil,
  Plus,
  Trash2,
} from "lucide-react";
import {
  useExpenses,
  useCreateExpense,
  useUpdateExpense,
  useDeleteExpense,
  type CreateExpenseInput,
  type ExpenseItem,
  type ExpenseCategory,
  type ExpenseStatus,
} from "@/hooks/useExpenses";
import ExpenseForm from "@/components/ui/expenses/expenseForm";
import { DeleteExpenseDialog } from "@/components/ui/expenses/deleteExpenseDialog";
import { useVendors } from "@/hooks/useVendors";
import { useApplications } from "@/hooks/useApplications";

const PAGE_SIZE = 10;

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

function getErrorMessage(error: unknown, fallback: string) {
  return error instanceof Error ? error.message : fallback;
}

function formatDate(date: string | null | undefined) {
  if (!date) return "—";

  const parsed = new Date(date);

  if (Number.isNaN(parsed.getTime())) return "—";

  return new Intl.DateTimeFormat("en", {
    month: "short",
    day: "numeric",
    year: "numeric",
    timeZone: "UTC",
  }).format(parsed);
}

function formatCurrency(amount: number, currency: string) {
  try {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency,
      maximumFractionDigits: 2,
    }).format(amount);
  } catch {
    return `${currency} ${amount.toLocaleString("en-US", {
      maximumFractionDigits: 2,
    })}`;
  }
}

function formatCategory(category: ExpenseCategory) {
  return categories.find((item) => item.value === category)?.label ?? category;
}

function StatusBadge({ status }: { status: ExpenseStatus }) {
  const styles: Record<ExpenseStatus, string> = {
    paid: "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400",
    pending: "bg-amber-500/10 text-amber-600 dark:text-amber-400",
    overdue: "bg-red-500/10 text-red-600 dark:text-red-400",
    cancelled: "bg-muted text-muted-foreground",
  };

  const labels: Record<ExpenseStatus, string> = {
    paid: "Paid",
    pending: "Pending",
    overdue: "Overdue",
    cancelled: "Cancelled",
  };

  const dotStyles: Record<ExpenseStatus, string> = {
    paid: "bg-emerald-500",
    pending: "bg-amber-500",
    overdue: "bg-red-500",
    cancelled: "bg-muted-foreground/60",
  };

  return (
    <span
      className={`inline-flex items-center gap-1.5 whitespace-nowrap rounded-full px-2.5 py-1 text-xs font-medium ${styles[status]}`}
    >
      <span className={`size-1.5 rounded-full ${dotStyles[status]}`} />
      {labels[status]}
    </span>
  );
}

export default function ExpensesPage() {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  const pageParam = searchParams.get("page");
  const parsedPage = Number(pageParam);
  const page =
    pageParam !== null && Number.isInteger(parsedPage) && parsedPage > 0
      ? parsedPage
      : 1;

  const search = searchParams.get("search") ?? "";

  const statusParam = searchParams.get("status");
  const statusFilter: ExpenseStatus | "all" = statuses.some(
    (item) => item.value === statusParam,
  )
    ? (statusParam as ExpenseStatus)
    : "all";

  const categoryParam = searchParams.get("category");
  const categoryFilter: ExpenseCategory | "all" = categories.some(
    (item) => item.value === categoryParam,
  )
    ? (categoryParam as ExpenseCategory)
    : "all";

  const [isFormOpen, setIsFormOpen] = useState(false);
  const [selectedExpense, setSelectedExpense] = useState<ExpenseItem | null>(
    null,
  );
  const [deletingExpense, setDeletingExpense] = useState<ExpenseItem | null>(
    null,
  );
  const [successMessage, setSuccessMessage] = useState("");

  const createExpenseMutation = useCreateExpense();
  const updateExpenseMutation = useUpdateExpense();
  const deleteExpenseMutation = useDeleteExpense();

  const isSaving =
    createExpenseMutation.isPending || updateExpenseMutation.isPending;

  const formError = selectedExpense
    ? updateExpenseMutation.error
    : createExpenseMutation.error;

  const formErrorMessage = formError
    ? getErrorMessage(
        formError,
        "Unable to save the expense. Please try again.",
      )
    : null;

  const deleteErrorMessage = deleteExpenseMutation.error
    ? getErrorMessage(
        deleteExpenseMutation.error,
        "Unable to delete the expense. Please try again.",
      )
    : null;

  // Keep the success message visible for three seconds.
  useEffect(() => {
    if (!successMessage) return;

    const timeoutId = window.setTimeout(() => setSuccessMessage(""), 3000);

    return () => window.clearTimeout(timeoutId);
  }, [successMessage]);

  function updateFilterUrl(next: {
    page?: number;
    search?: string;
    status?: ExpenseStatus | "all";
    category?: ExpenseCategory | "all";
  }) {
    const params = new URLSearchParams(searchParams.toString());

    const nextPage = next.page ?? page;
    const nextSearch = next.search ?? search;
    const nextStatus = next.status ?? statusFilter;
    const nextCategory = next.category ?? categoryFilter;

    if (nextPage > 1) {
      params.set("page", String(nextPage));
    } else {
      params.delete("page");
    }

    if (nextSearch.trim()) {
      params.set("search", nextSearch.trim());
    } else {
      params.delete("search");
    }

    if (nextStatus !== "all") {
      params.set("status", nextStatus);
    } else {
      params.delete("status");
    }

    if (nextCategory !== "all") {
      params.set("category", nextCategory);
    } else {
      params.delete("category");
    }

    const query = params.toString();
    router.replace(query ? `${pathname}?${query}` : pathname, {
      scroll: false,
    });
  }

  function openCreateForm() {
    createExpenseMutation.reset();
    updateExpenseMutation.reset();
    setSelectedExpense(null);
    setIsFormOpen(true);
  }

  function openEditForm(expense: ExpenseItem) {
    createExpenseMutation.reset();
    updateExpenseMutation.reset();
    setSelectedExpense(expense);
    setIsFormOpen(true);
  }

  function closeExpenseForm() {
    if (isSaving) return;

    setIsFormOpen(false);
    setSelectedExpense(null);
  }

  async function handleSaveExpense(input: CreateExpenseInput) {
    if (selectedExpense) {
      await updateExpenseMutation.mutateAsync({
        id: selectedExpense.id,
        input,
      });

      setSuccessMessage("Expense updated successfully.");
    } else {
      await createExpenseMutation.mutateAsync(input);
      setSuccessMessage("Expense created successfully.");
    }

    setIsFormOpen(false);
    setSelectedExpense(null);
  }

  async function handleDeleteExpense() {
    if (!deletingExpense) return;

    await deleteExpenseMutation.mutateAsync(deletingExpense.id);

    setDeletingExpense(null);
    setSuccessMessage("Expense deleted successfully.");
  }

  const expensesQuery = useExpenses({
    page,
    limit: PAGE_SIZE,
    search: search.trim() || undefined,
    status: statusFilter === "all" ? undefined : statusFilter,
    category: categoryFilter === "all" ? undefined : categoryFilter,
  });

  const vendorsQuery = useVendors({
    page: 1,
    limit: 100,
  });

  const applicationsQuery = useApplications({
    page: 1,
    limit: 100,
  });

  const expenses = expensesQuery.data?.expenses ?? [];
  const pagination = expensesQuery.data?.pagination;

  const vendorNames = new Map(
    (vendorsQuery.data?.vendors ?? []).map((vendor) => [
      vendor._id,
      vendor.name,
    ]),
  );

  const applicationNames = new Map(
    (applicationsQuery.data?.applications ?? []).map((application) => [
      application._id,
      application.name,
    ]),
  );

  const isInitialLoading = expensesQuery.isPending && !expensesQuery.data;

  const queryError = expensesQuery.error
    ? getErrorMessage(
        expensesQuery.error,
        "Unable to load expenses. Please try again.",
      )
    : null;

  const paidExpenses = expenses.filter((expense) => expense.status === "paid");
  const pendingExpenses = expenses.filter(
    (expense) => expense.status === "pending",
  );

  // Avoid adding amounts with different currencies together.
  const paidCurrencies = new Set(
    paidExpenses.map((expense) => expense.currency),
  );
  const pendingCurrencies = new Set(
    pendingExpenses.map((expense) => expense.currency),
  );

  const paidTotal =
    paidCurrencies.size <= 1
      ? paidExpenses.reduce((total, expense) => total + expense.amount, 0)
      : null;

  const pendingTotal =
    pendingCurrencies.size <= 1
      ? pendingExpenses.reduce((total, expense) => total + expense.amount, 0)
      : null;

  const paidCurrency = paidExpenses[0]?.currency ?? "USD";
  const pendingCurrency = pendingExpenses[0]?.currency ?? "USD";

  const overdueCount = expenses.filter(
    (expense) => expense.status === "overdue",
  ).length;

  const hasFilters =
    Boolean(search.trim()) ||
    statusFilter !== "all" ||
    categoryFilter !== "all";

  function clearFilters() {
    updateFilterUrl({
      page: 1,
      search: "",
      status: "all",
      category: "all",
    });
  }

  function handleSearchChange(value: string) {
    updateFilterUrl({ page: 1, search: value });
  }

  function handleStatusChange(value: ExpenseStatus | "all") {
    updateFilterUrl({ page: 1, status: value });
  }

  function handleCategoryChange(value: ExpenseCategory | "all") {
    updateFilterUrl({ page: 1, category: value });
  }

  return (
    <div className="mx-auto w-full max-w-[1600px] space-y-6 p-4 sm:p-6 lg:p-8">
      {/* Page header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-start gap-3">
          <div className="flex size-12 shrink-0 items-center justify-center rounded-2xl border border-border bg-card shadow-sm">
            <Receipt className="size-6 text-primary" />
          </div>

          <div>
            <h1 className="text-2xl font-semibold tracking-tight sm:text-3xl">
              Expenses
            </h1>
            <p className="mt-1 max-w-2xl text-sm leading-6 text-muted-foreground">
              Track software spending, vendor payments, invoices, and expenses
              across your organization.
            </p>
          </div>
        </div>

        <button
          type="button"
          onClick={openCreateForm}
          className="inline-flex items-center justify-center gap-2 rounded-xl bg-primary px-4 py-2.5 text-sm font-medium text-primary-foreground transition hover:opacity-90"
        >
          <Plus className="size-4" />
          Add expense
        </button>
      </div>

      {successMessage && (
        <div
          role="status"
          className="rounded-xl border border-emerald-500/20 bg-emerald-500/5 px-4 py-3 text-sm text-emerald-600 dark:text-emerald-400"
        >
          {successMessage}
        </div>
      )}

      {/* Summary cards */}
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <div className="rounded-2xl border border-border bg-card p-5">
          <div className="flex items-center justify-between gap-3">
            <div>
              <p className="text-sm text-muted-foreground">Expenses found</p>
              <p className="mt-2 text-2xl font-semibold tracking-tight tabular-nums">
                {pagination?.total ?? "—"}
              </p>
            </div>
            <div className="flex size-11 items-center justify-center rounded-xl bg-primary/10 text-primary">
              <Receipt className="size-5" />
            </div>
          </div>
          <p className="mt-2 text-xs text-muted-foreground">
            Matching your current filters
          </p>
        </div>

        <div className="rounded-2xl border border-border bg-card p-5">
          <div className="flex items-center justify-between gap-3">
            <div>
              <p className="text-sm text-muted-foreground">Paid on this page</p>
              <p className="mt-2 text-2xl font-semibold tracking-tight">
                {isInitialLoading
                  ? "—"
                  : paidTotal === null
                    ? "Multiple currencies"
                    : formatCurrency(paidTotal, paidCurrency)}
              </p>
            </div>
            <div className="flex size-11 items-center justify-center rounded-xl bg-emerald-500/10 text-emerald-500">
              <CircleDollarSign className="size-5" />
            </div>
          </div>
          <p className="mt-2 text-xs text-muted-foreground">
            Paid expense amount on the current page
          </p>
        </div>

        <div className="rounded-2xl border border-border bg-card p-5">
          <div className="flex items-center justify-between gap-3">
            <div>
              <p className="text-sm text-muted-foreground">
                Pending on this page
              </p>
              <p className="mt-2 text-2xl font-semibold tracking-tight">
                {isInitialLoading
                  ? "—"
                  : pendingTotal === null
                    ? "Multiple currencies"
                    : formatCurrency(pendingTotal, pendingCurrency)}
              </p>
            </div>
            <div className="flex size-11 items-center justify-center rounded-xl bg-amber-500/10 text-amber-500">
              <CreditCard className="size-5" />
            </div>
          </div>
          <p className="mt-2 text-xs text-muted-foreground">
            Pending expense amount on the current page
          </p>
        </div>

        <div className="rounded-2xl border border-border bg-card p-5">
          <div className="flex items-center justify-between gap-3">
            <div>
              <p className="text-sm text-muted-foreground">
                Overdue on this page
              </p>
              <p className="mt-2 text-2xl font-semibold tracking-tight tabular-nums">
                {isInitialLoading ? "—" : overdueCount}
              </p>
            </div>
            <div className="flex size-11 items-center justify-center rounded-xl bg-red-500/10 text-red-500">
              <TrendingDown className="size-5" />
            </div>
          </div>
          <p className="mt-2 text-xs text-muted-foreground">
            Expenses marked overdue in the current results
          </p>
        </div>
      </div>

      {/* Expenses table */}
      <section className="overflow-hidden rounded-2xl border border-border bg-card">
        <div className="flex flex-col gap-4 border-b border-border p-4 sm:p-5">
          <div>
            <h2 className="font-semibold tracking-tight">All expenses</h2>
            <p className="mt-1 text-sm text-muted-foreground">
              Review spending and manage expense records.
            </p>
          </div>

          <div className="flex flex-col gap-3 sm:flex-row sm:flex-wrap sm:items-center">
            <div className="relative min-w-0 sm:w-72">
              <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
              <input
                type="search"
                value={search}
                onChange={(event) => handleSearchChange(event.target.value)}
                placeholder="Search expenses..."
                aria-label="Search expenses"
                className="w-full rounded-xl border border-border bg-background py-2.5 pl-9 pr-3 text-sm outline-none transition placeholder:text-muted-foreground focus-visible:ring-2 focus-visible:ring-ring"
              />
            </div>

            <select
              value={statusFilter}
              onChange={(event) =>
                handleStatusChange(event.target.value as ExpenseStatus | "all")
              }
              aria-label="Filter expenses by status"
              className="rounded-xl border border-border bg-background px-3 py-2.5 text-sm outline-none transition focus-visible:ring-2 focus-visible:ring-ring"
            >
              <option value="all">All statuses</option>
              {statuses.map((status) => (
                <option key={status.value} value={status.value}>
                  {status.label}
                </option>
              ))}
            </select>

            <select
              value={categoryFilter}
              onChange={(event) =>
                handleCategoryChange(
                  event.target.value as ExpenseCategory | "all",
                )
              }
              aria-label="Filter expenses by category"
              className="max-w-full rounded-xl border border-border bg-background px-3 py-2.5 text-sm outline-none transition focus-visible:ring-2 focus-visible:ring-ring sm:max-w-64"
            >
              <option value="all">All categories</option>
              {categories.map((category) => (
                <option key={category.value} value={category.value}>
                  {category.label}
                </option>
              ))}
            </select>
          </div>
        </div>

        {(vendorsQuery.error || applicationsQuery.error) && (
          <div
            role="status"
            className="border-b border-amber-500/20 bg-amber-500/5 px-5 py-3 text-sm text-amber-700 dark:text-amber-400"
          >
            Some linked vendor or application names may be unavailable.
          </div>
        )}

        {queryError && !expensesQuery.data && (
          <div className="m-5 rounded-xl border border-destructive/30 bg-destructive/5 p-4">
            <p className="text-sm font-medium text-destructive">
              Could not load expenses
            </p>
            <p className="mt-1 text-sm text-muted-foreground">{queryError}</p>
            <button
              type="button"
              onClick={() => expensesQuery.refetch()}
              className="mt-3 rounded-lg border border-border px-3 py-2 text-sm font-medium transition hover:bg-muted"
            >
              Try again
            </button>
          </div>
        )}

        {queryError && expensesQuery.data && (
          <div
            role="alert"
            className="border-b border-destructive/20 bg-destructive/5 px-5 py-3 text-sm text-destructive"
          >
            Refresh failed: {queryError}. Previously loaded data is still
            displayed.
          </div>
        )}

        {isInitialLoading ? (
          <div className="flex min-h-72 flex-col items-center justify-center gap-3 p-8">
            <Loader2 className="size-7 animate-spin text-primary" />
            <p className="text-sm text-muted-foreground">Loading expenses...</p>
          </div>
        ) : !queryError || expensesQuery.data ? (
          expenses.length === 0 ? (
            <div className="flex min-h-72 flex-col items-center justify-center px-5 py-12 text-center">
              <div className="flex size-14 items-center justify-center rounded-2xl border border-border bg-muted/50">
                {hasFilters ? (
                  <Search className="size-6 text-muted-foreground" />
                ) : (
                  <Receipt className="size-6 text-muted-foreground" />
                )}
              </div>

              <h3 className="mt-4 font-semibold">
                {hasFilters ? "No matching expenses" : "No expenses yet"}
              </h3>

              <p className="mt-2 max-w-sm text-sm leading-6 text-muted-foreground">
                {hasFilters
                  ? "Try changing your search or filters to find an expense."
                  : "Create an expense record to start tracking vendor payments, software spending, and invoices."}
              </p>

              {hasFilters && (
                <button
                  type="button"
                  onClick={clearFilters}
                  className="mt-4 rounded-lg border border-border px-4 py-2 text-sm font-medium transition hover:bg-muted"
                >
                  Clear filters
                </button>
              )}
            </div>
          ) : (
            <>
              <div className="overflow-x-auto">
                <table className="w-full min-w-[1100px] text-left text-sm">
                  <thead className="bg-muted/30 text-xs uppercase tracking-wide text-muted-foreground">
                    <tr>
                      <th className="px-5 py-3.5 font-medium">Expense</th>
                      <th className="px-5 py-3.5 font-medium">Category</th>
                      <th className="px-5 py-3.5 font-medium">Vendor</th>
                      <th className="px-5 py-3.5 font-medium">Application</th>
                      <th className="px-5 py-3.5 font-medium">Date</th>
                      <th className="px-5 py-3.5 font-medium">Amount</th>
                      <th className="px-5 py-3.5 font-medium">Status</th>
                      <th className="px-5 py-3.5 text-right font-medium">
                        Actions
                      </th>
                    </tr>
                  </thead>

                  <tbody className="divide-y divide-border">
                    {expenses.map((expense) => (
                      <tr
                        key={expense.id}
                        className="transition-colors hover:bg-muted/20"
                      >
                        <td className="px-5 py-4">
                          <div className="flex items-center gap-3">
                            <div className="flex size-10 shrink-0 items-center justify-center rounded-xl border border-border bg-muted/70">
                              <Receipt className="size-4 text-primary" />
                            </div>
                            <div className="min-w-0">
                              <p className="max-w-64 truncate font-medium text-foreground">
                                {expense.title}
                              </p>
                              <p className="mt-1 max-w-64 truncate text-xs text-muted-foreground">
                                {expense.invoiceNumber
                                  ? `Invoice ${expense.invoiceNumber}`
                                  : expense.description ||
                                    "No additional details"}
                              </p>
                            </div>
                          </div>
                        </td>

                        <td className="px-5 py-4">
                          <span className="inline-flex whitespace-nowrap rounded-lg border border-border px-2.5 py-1.5 text-xs">
                            {formatCategory(expense.category)}
                          </span>
                        </td>

                        <td className="px-5 py-4">
                          <span className="block max-w-40 truncate font-medium">
                            {expense.vendorId
                              ? (vendorNames.get(expense.vendorId) ??
                                "Vendor unavailable")
                              : "—"}
                          </span>
                        </td>

                        <td className="px-5 py-4">
                          <span className="block max-w-44 truncate">
                            {expense.applicationId
                              ? (applicationNames.get(expense.applicationId) ??
                                "Application unavailable")
                              : "—"}
                          </span>
                        </td>

                        <td className="px-5 py-4 whitespace-nowrap">
                          <p className="font-medium">
                            {formatDate(expense.expenseDate)}
                          </p>
                          {expense.dueDate && (
                            <p className="mt-1 text-xs text-muted-foreground">
                              Due {formatDate(expense.dueDate)}
                            </p>
                          )}
                        </td>

                        <td className="px-5 py-4 whitespace-nowrap">
                          <span className="font-semibold tabular-nums">
                            {formatCurrency(expense.amount, expense.currency)}
                          </span>
                        </td>

                        <td className="px-5 py-4">
                          <StatusBadge status={expense.status} />
                        </td>

                        <td className="px-5 py-4">
                          <div className="flex items-center justify-end gap-1.5">
                            <button
                              type="button"
                              onClick={() => openEditForm(expense)}
                              aria-label={`Edit ${expense.title}`}
                              title="Edit expense"
                              className="inline-flex size-9 items-center justify-center rounded-lg border border-border transition hover:bg-muted"
                            >
                              <Pencil className="size-4" />
                            </button>

                            <button
                              type="button"
                              onClick={() => {
                                deleteExpenseMutation.reset();
                                setDeletingExpense(expense);
                              }}
                              aria-label={`Delete ${expense.title}`}
                              title="Delete expense"
                              className="inline-flex size-9 items-center justify-center rounded-lg border border-destructive/20 text-destructive transition hover:bg-destructive/10"
                            >
                              <Trash2 className="size-4" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* Pagination */}
              <div className="flex flex-col gap-3 border-t border-border px-4 py-4 sm:flex-row sm:items-center sm:justify-between sm:px-5">
                <p className="text-sm text-muted-foreground">
                  {pagination && pagination.total > 0 ? (
                    <>
                      Showing{" "}
                      <span className="font-medium text-foreground">
                        {(pagination.page - 1) * pagination.limit + 1}
                      </span>
                      {"–"}
                      <span className="font-medium text-foreground">
                        {Math.min(
                          pagination.page * pagination.limit,
                          pagination.total,
                        )}
                      </span>{" "}
                      of{" "}
                      <span className="font-medium text-foreground">
                        {pagination.total}
                      </span>{" "}
                      expenses
                    </>
                  ) : (
                    "No expenses to display"
                  )}
                </p>

                <div className="flex items-center justify-between gap-3 sm:justify-end">
                  <span className="text-sm text-muted-foreground">
                    Page {pagination?.page ?? page} of{" "}
                    {pagination?.totalPages ?? 0}
                  </span>

                  <div className="flex items-center gap-1.5">
                    <button
                      type="button"
                      onClick={() =>
                        updateFilterUrl({ page: Math.max(1, page - 1) })
                      }
                      disabled={
                        page <= 1 ||
                        expensesQuery.isFetching ||
                        !pagination ||
                        pagination.totalPages <= 1
                      }
                      aria-label="Previous page"
                      className="inline-flex size-9 items-center justify-center rounded-lg border border-border transition hover:bg-muted disabled:cursor-not-allowed disabled:opacity-40"
                    >
                      <ChevronLeft className="size-4" />
                    </button>

                    <button
                      type="button"
                      onClick={() =>
                        updateFilterUrl({
                          page: Math.min(
                            pagination?.totalPages ?? page,
                            page + 1,
                          ),
                        })
                      }
                      disabled={
                        !pagination ||
                        page >= pagination.totalPages ||
                        expensesQuery.isFetching
                      }
                      aria-label="Next page"
                      className="inline-flex size-9 items-center justify-center rounded-lg border border-border transition hover:bg-muted disabled:cursor-not-allowed disabled:opacity-40"
                    >
                      <ChevronRight className="size-4" />
                    </button>
                  </div>
                </div>
              </div>
            </>
          )
        ) : null}
      </section>

      {isFormOpen && (
        <ExpenseForm
          key={selectedExpense?.id ?? "new-expense"}
          expense={selectedExpense}
          vendors={vendorsQuery.data?.vendors ?? []}
          applications={applicationsQuery.data?.applications ?? []}
          isSubmitting={isSaving}
          submitError={formErrorMessage}
          onSubmit={handleSaveExpense}
          onCancel={closeExpenseForm}
        />
      )}

      {deletingExpense && (
        <DeleteExpenseDialog
          expense={deletingExpense}
          isDeleting={deleteExpenseMutation.isPending}
          error={deleteErrorMessage}
          onConfirm={handleDeleteExpense}
          onCancel={() => {
            if (deleteExpenseMutation.isPending) return;

            setDeletingExpense(null);
            deleteExpenseMutation.reset();
          }}
        />
      )}
    </div>
  );
}
