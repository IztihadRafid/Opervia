"use client";

import { useEffect, useState, type FormEvent } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import {
  useCreateSubscription,
  useDeleteSubscription,
  useSubscriptions,
  useUpdateSubscription,
  type BillingCycle,
  type SubscriptionItem,
  type SubscriptionStatus,
} from "@/hooks/useSubscriptions";
import { apiClient } from "@/lib/api-client";

import { CreditCard, Plus, Layers3, Wallet, Trash2 } from "lucide-react";

type ApplicationOption = {
  _id: string;
  name: string;
};

type ApplicationsResponse = {
  applications: ApplicationOption[];
};

type SubscriptionForm = {
  applicationId: string;
  plan: string;
  billingCycle: BillingCycle;
  amount: string;
  currency: string;
  renewalDate: string;
  status: SubscriptionStatus;
  startDate: string;
  endDate: string;
};

const PAGE_SIZE = 10;

const inputClass =
  "w-full rounded-xl border border-[#DC586D]/20 bg-white px-3.5 py-2.5 text-sm text-[#4C1D3D] outline-none transition placeholder:text-[#852E4E]/45 hover:border-[#DC586D]/40 focus:border-[#A33757] focus:ring-4 focus:ring-[#FB9590]/20";

const buttonClass =
  "inline-flex items-center justify-center gap-2 rounded-xl px-4 py-2.5 text-sm font-semibold transition duration-200 disabled:cursor-not-allowed disabled:opacity-50";

const initialForm: SubscriptionForm = {
  applicationId: "",
  plan: "",
  billingCycle: "monthly",
  amount: "",
  currency: "USD",
  renewalDate: "",
  status: "active",
  startDate: "",
  endDate: "",
};

function toDateInput(value?: string | null) {
  if (!value) return "";

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) return "";

  return `${date.getUTCFullYear()}-${String(date.getUTCMonth() + 1).padStart(2, "0")}-${String(date.getUTCDate()).padStart(2, "0")}`;
}

function toIsoDate(value: string) {
  return new Date(`${value}T00:00:00.000Z`).toISOString();
}

function formatDate(value?: string | null) {
  if (!value) return "—";

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) return "—";

  return new Intl.DateTimeFormat("en", {
    day: "numeric",
    month: "short",
    year: "numeric",
    timeZone: "UTC",
  }).format(date);
}

function formatMoney(amount: number, currency: string) {
  try {
    return new Intl.NumberFormat("en", {
      style: "currency",
      currency: currency || "USD",
      maximumFractionDigits: 2,
    }).format(amount);
  } catch {
    return `${currency} ${amount.toFixed(2)}`;
  }
}

function statusClass(status: SubscriptionStatus) {
  switch (status) {
    case "active":
      return "border-[#A33757]/20 bg-[#FFBB94]/30 text-[#852E4E]";
    case "cancelled":
      return "border-[#DC586D]/25 bg-[#DC586D]/10 text-[#A33757]";
    case "expired":
      return "border-[#852E4E]/15 bg-[#852E4E]/5 text-[#852E4E]/75";
    case "paused":
      return "border-[#FB9590]/40 bg-[#FB9590]/20 text-[#852E4E]";
    default:
      return "border-[#852E4E]/15 bg-[#852E4E]/5 text-[#852E4E]/75";
  }
}

function getErrorMessage(error: unknown) {
  return error instanceof Error
    ? error.message
    : "Something went wrong. Please try again.";
}

export default function SubscriptionsPage() {
  const router = useRouter();
  const searchParams = useSearchParams();

  const [page, setPage] = useState(() => {
    const value = Number(searchParams.get("page"));
    return Number.isInteger(value) && value > 0 ? value : 1;
  });

  const [searchInput, setSearchInput] = useState(
    () => searchParams.get("search") ?? "",
  );
  const [search, setSearch] = useState(() => searchParams.get("search") ?? "");
  const [statusFilter, setStatusFilter] = useState(
    () => searchParams.get("status") ?? "",
  );
  const [billingFilter, setBillingFilter] = useState(
    () => searchParams.get("billingCycle") ?? "",
  );

  const [applications, setApplications] = useState<ApplicationOption[]>([]);
  const [applicationsError, setApplicationsError] = useState("");
  const [loadingApplications, setLoadingApplications] = useState(true);

  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingSubscription, setEditingSubscription] =
    useState<SubscriptionItem | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<SubscriptionItem | null>(
    null,
  );

  const [form, setForm] = useState<SubscriptionForm>(initialForm);
  const [formError, setFormError] = useState("");
  const [deleteError, setDeleteError] = useState("");
  const [notice, setNotice] = useState("");

  const subscriptionsQuery = useSubscriptions({
    page,
    limit: PAGE_SIZE,
    search: search || undefined,
    status: (statusFilter || undefined) as SubscriptionStatus | undefined,
    billingCycle: (billingFilter || undefined) as BillingCycle | undefined,
  });

  const createMutation = useCreateSubscription();
  const updateMutation = useUpdateSubscription();
  const deleteMutation = useDeleteSubscription();

  const subscriptions = subscriptionsQuery.data?.subscriptions ?? [];
  const pagination = subscriptionsQuery.data?.pagination;
  const total = pagination?.total ?? 0;
  const totalPages = Math.max(1, pagination?.totalPages ?? 1);
  const saving = createMutation.isPending || updateMutation.isPending;
  const deleting = deleteMutation.isPending;
  useEffect(() => {
    const params = new URLSearchParams();

    if (page > 1) params.set("page", String(page));
    if (search) params.set("search", search);
    if (statusFilter) params.set("status", statusFilter);
    if (billingFilter) params.set("billingCycle", billingFilter);

    const query = params.toString();
    const nextUrl = query ? `/subscriptions?${query}` : "/subscriptions";

    const currentUrl = `${window.location.pathname}${window.location.search}`;

    if (currentUrl !== nextUrl) {
      router.replace(nextUrl, { scroll: false });
    }
  }, [page, search, statusFilter, billingFilter, router]);

  // Debounce search input to avoid an API request on every keystroke.
  useEffect(() => {
    const timeout = setTimeout(() => {
      setSearch(searchInput.trim());
      setPage(1);
    }, 300);

    return () => clearTimeout(timeout);
  }, [searchInput]);

  // Load applications for the create form.
  useEffect(() => {
    let cancelled = false;

    async function loadApplications() {
      setLoadingApplications(true);
      setApplicationsError("");

      try {
        const response = await apiClient<ApplicationsResponse>(
          "/api/applications?page=1&limit=100",
        );

        if (!cancelled) {
          setApplications(
            (response.applications ?? []).map((app) => ({
              _id: app._id,
              name: app.name,
            })),
          );
        }
      } catch (error) {
        if (!cancelled) {
          setApplicationsError(getErrorMessage(error));
        }
      } finally {
        if (!cancelled) {
          setLoadingApplications(false);
        }
      }
    }

    void loadApplications();

    return () => {
      cancelled = true;
    };
  }, []);

  function openCreateDialog() {
    setEditingSubscription(null);
    setForm({
      ...initialForm,
      applicationId: applications[0]?._id ?? "",
    });
    setFormError("");
    setNotice("");
    setDialogOpen(true);
  }

  function openEditDialog(subscription: SubscriptionItem) {
    setEditingSubscription(subscription);

    setForm({
      applicationId: subscription.applicationId,
      plan: subscription.plan,
      billingCycle: subscription.billingCycle,
      amount: String(subscription.amount),
      currency: subscription.currency,
      renewalDate: toDateInput(subscription.renewalDate),
      status: subscription.status,
      startDate: toDateInput(subscription.startDate),
      endDate: toDateInput(subscription.endDate),
    });

    setFormError("");
    setNotice("");
    setDialogOpen(true);
  }

  function updateForm<K extends keyof SubscriptionForm>(
    key: K,
    value: SubscriptionForm[K],
  ) {
    setForm((current) => ({ ...current, [key]: value }));
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    setFormError("");
    setNotice("");

    if (!form.applicationId) {
      setFormError("Please select an application.");
      return;
    }

    if (
      !form.plan.trim() ||
      !form.startDate ||
      !form.renewalDate ||
      form.amount.trim() === ""
    ) {
      setFormError("Please complete all required fields.");
      return;
    }

    const amount = Number(form.amount);

    if (!Number.isFinite(amount) || amount < 0) {
      setFormError("Enter a valid amount greater than or equal to zero.");
      return;
    }

    if (form.endDate && form.endDate < form.startDate) {
      setFormError("End date cannot be before the start date.");
      return;
    }

    if (!/^[A-Za-z]{3}$/.test(form.currency.trim())) {
      setFormError("Currency must be a three-letter code, such as USD.");
      return;
    }

    const payload = {
      applicationId: form.applicationId,
      plan: form.plan.trim(),
      billingCycle: form.billingCycle,
      amount,
      currency: form.currency.trim().toUpperCase(),
      renewalDate: toIsoDate(form.renewalDate),
      status: form.status,
      startDate: toIsoDate(form.startDate),
      endDate: form.endDate ? toIsoDate(form.endDate) : null,
    };

    try {
      if (editingSubscription) {
        await updateMutation.mutateAsync({
          id: editingSubscription._id,
          input: payload,
        });
        setNotice("Subscription updated successfully.");
      } else {
        await createMutation.mutateAsync(payload);
        setNotice("Subscription created successfully.");
      }

      setDialogOpen(false);
    } catch (error) {
      setFormError(getErrorMessage(error));
    }
  }

  async function confirmDelete() {
    if (!deleteTarget) return;

    setDeleteError("");
    setNotice("");

    try {
      await deleteMutation.mutateAsync(deleteTarget._id);

      setNotice("Subscription deleted successfully.");
      setDeleteTarget(null);

      if (subscriptions.length === 1 && page > 1) {
        setPage((current) => current - 1);
      }
    } catch (error) {
      setDeleteError(getErrorMessage(error));
    }
  }

  function clearFilters() {
    setSearchInput("");
    setSearch("");
    setStatusFilter("");
    setBillingFilter("");
    setPage(1);
  }

  const activeCount = subscriptions.filter(
    (subscription) => subscription.status === "active",
  ).length;

  const monthlySpend = subscriptions
    .filter((subscription) => subscription.status === "active")
    .reduce((sum, subscription) => {
      const multiplier =
        subscription.billingCycle === "yearly"
          ? 1 / 12
          : subscription.billingCycle === "quarterly"
            ? 1 / 3
            : 1;

      return sum + subscription.amount * multiplier;
    }, 0);

  return (
    <div className="space-y-6 p-4 sm:p-6 lg:p-8">
      <header className="relative overflow-hidden rounded-3xl border border-[#DC586D]/25 bg-[#FBE7EC] p-5 shadow-sm sm:p-7 lg:p-8">
        <div className="relative flex flex-col gap-5 sm:flex-row sm:items-center sm:justify-between">
          <div className="min-w-0">
            <div className="mb-3 inline-flex items-center gap-2 rounded-full border border-[#A33757]/20 bg-[#FFF9F7] px-3 py-1.5 text-xs font-semibold text-[#852E4E]">
              <CreditCard className="size-4" aria-hidden="true" />
              BILLING MANAGEMENT
            </div>

            <h1 className="text-2xl font-bold tracking-tight text-[#4C1D3D] sm:text-3xl">
              Subscriptions
            </h1>

            <p className="mt-2 max-w-2xl text-sm leading-6 text-[#4C1D3D]/85 sm:text-base">
              Manage recurring software costs, billing cycles, renewal dates,
              and subscription status in one place.
            </p>
          </div>

          <button
            type="button"
            onClick={openCreateDialog}
            disabled={loadingApplications || applications.length === 0}
            className={`${buttonClass} shrink-0 bg-[#4C1D3D] text-white shadow-sm hover:bg-[#852E4E]`}
          >
            <Plus className="size-4" aria-hidden="true" />
            Add subscription
          </button>
        </div>
      </header>

      {notice && (
        <div
          role="status"
          className="rounded-lg border border-emerald-500/20 bg-emerald-500/10 px-4 py-3 text-sm text-emerald-700 dark:text-emerald-400"
        >
          {notice}
        </div>
      )}
      {deleteError && (
        <div
          role="alert"
          className="rounded-lg border border-destructive/20 bg-destructive/10 px-4 py-3 text-sm text-destructive"
        >
          {deleteError}
        </div>
      )}

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        <div className="relative overflow-hidden rounded-2xl border border-[#DC586D]/15 bg-white p-5 shadow-sm transition hover:-translate-y-0.5 hover:shadow-md">
          <div className="absolute inset-x-0 top-0 h-1 bg-[#FFBB94]" />
          <div className="flex items-center justify-between">
            <p className="text-sm font-medium text-[#852E4E]/80">
              Total subscriptions
            </p>
            <div className="rounded-xl bg-[#FFBB94]/30 p-2.5 text-[#852E4E]">
              <Layers3 className="size-5" aria-hidden="true" />
            </div>
          </div>
          <p className="mt-4 text-3xl font-bold tabular-nums text-[#4C1D3D]">
            {total}
          </p>
          <p className="mt-2 text-xs text-[#852E4E]/65">
            Across your current filters
          </p>
        </div>

        <div className="relative overflow-hidden rounded-2xl border border-[#DC586D]/15 bg-white p-5 shadow-sm transition hover:-translate-y-0.5 hover:shadow-md">
          <div className="absolute inset-x-0 top-0 h-1 bg-[#DC586D]" />
          <div className="flex items-center justify-between">
            <p className="text-sm font-medium text-[#852E4E]/80">
              Active on this page
            </p>
            <div className="rounded-xl bg-[#DC586D]/10 p-2.5 text-[#A33757]">
              <CreditCard className="size-5" aria-hidden="true" />
            </div>
          </div>
          <p className="mt-4 text-3xl font-bold tabular-nums text-[#4C1D3D]">
            {activeCount}
          </p>
          <p className="mt-2 text-xs text-[#852E4E]/65">
            Currently active subscriptions
          </p>
        </div>

        <div className="relative overflow-hidden rounded-2xl border border-[#DC586D]/15 bg-white p-5 shadow-sm transition hover:-translate-y-0.5 hover:shadow-md">
          <div className="absolute inset-x-0 top-0 h-1 bg-[#A33757]" />
          <div className="flex items-center justify-between gap-2">
            <p className="text-sm font-medium text-[#852E4E]/80">
              Estimated monthly spend
            </p>
            <div className="rounded-xl bg-[#A33757]/10 p-2.5 text-[#A33757]">
              <Wallet className="size-5" aria-hidden="true" />
            </div>
          </div>
          <p className="mt-4 break-words text-2xl font-bold tabular-nums text-[#4C1D3D] sm:text-3xl">
            {formatMoney(monthlySpend, "USD")}
          </p>
          <p className="mt-2 text-xs leading-5 text-[#852E4E]/65">
            Active subscriptions on this page, normalized to monthly cost
          </p>
        </div>
      </div>

      <>
        {/* Heading and filters — separate card */}
        <div className="mb-5 rounded-2xl border border-[#DC586D]/15 bg-white shadow-sm">
          <div className="flex flex-col gap-4 p-4 sm:p-6">
            <div>
              <h2 className="font-semibold text-[#4C1D3D]">
                All subscriptions
              </h2>
              <p className="mt-1 text-sm text-[#852E4E]/70">
                Search and filter your subscriptions.
              </p>
            </div>

            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-[minmax(200px,1fr)_180px_180px_auto]">
              <input
                type="search"
                value={searchInput}
                onChange={(event) => setSearchInput(event.target.value)}
                placeholder="Search plans or applications..."
                aria-label="Search subscriptions"
                className={inputClass}
              />

              <select
                value={statusFilter}
                onChange={(event) => {
                  setStatusFilter(event.target.value);
                  setPage(1);
                }}
                aria-label="Filter by status"
                className={inputClass}
              >
                <option value="">All statuses</option>
                <option value="active">Active</option>
                <option value="paused">Paused</option>
                <option value="cancelled">Cancelled</option>
                <option value="expired">Expired</option>
              </select>

              <select
                value={billingFilter}
                onChange={(event) => {
                  setBillingFilter(event.target.value);
                  setPage(1);
                }}
                aria-label="Filter by billing cycle"
                className={inputClass}
              >
                <option value="">All billing cycles</option>
                <option value="monthly">Monthly</option>
                <option value="quarterly">Quarterly</option>
                <option value="yearly">Yearly</option>
              </select>

              <button
                type="button"
                onClick={clearFilters}
                className={`${buttonClass} border border-[#DC586D]/20 bg-white text-[#852E4E] hover:bg-[#FFF9F7]`}
              >
                Clear filters
              </button>
            </div>
          </div>
        </div>

        {/* Subscription results — separate card */}
        <div className="overflow-hidden rounded-2xl border border-[#DC586D]/15 bg-white shadow-sm">
          {subscriptionsQuery.isError ? (
            <div className="p-8 text-center">
              <p className="font-medium text-[#4C1D3D]">
                Could not load subscriptions
              </p>
              <p className="mt-2 text-sm text-[#852E4E]/70">
                {getErrorMessage(subscriptionsQuery.error)}
              </p>
              <button
                type="button"
                onClick={() => void subscriptionsQuery.refetch()}
                className={`${buttonClass} mt-4 bg-[#4C1D3D] text-white hover:bg-[#852E4E]`}
              >
                Try again
              </button>
            </div>
          ) : subscriptionsQuery.isPending ? (
            <div className="space-y-3 p-5">
              {Array.from({ length: 5 }).map((_, index) => (
                <div
                  key={index}
                  className="h-12 animate-pulse rounded-lg bg-[#FFF9F7]"
                />
              ))}
            </div>
          ) : subscriptions.length === 0 ? (
            <div className="px-5 py-16 text-center">
              <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-xl border border-[#DC586D]/15 bg-[#FFF9F7] text-xl text-[#A33757]">
                $
              </div>
              <h3 className="mt-4 font-semibold text-[#4C1D3D]">
                No subscriptions found
              </h3>
              <p className="mx-auto mt-2 max-w-sm text-sm text-[#852E4E]/70">
                {search || statusFilter || billingFilter
                  ? "Try changing your search or filters."
                  : "Add your first subscription to start tracking your software costs."}
              </p>
              {!search && !statusFilter && !billingFilter && (
                <button
                  type="button"
                  onClick={openCreateDialog}
                  disabled={loadingApplications || applications.length === 0}
                  className={`${buttonClass} mt-5 bg-[#4C1D3D] text-white hover:bg-[#852E4E]`}
                >
                  Add subscription
                </button>
              )}
            </div>
          ) : (
            <>
              <div className="overflow-x-auto">
                <table className="w-full min-w-[900px] text-left text-sm">
                  <thead className="bg-[#FFF9F7] text-xs uppercase tracking-wide text-[#852E4E]">
                    <tr>
                      <th className="px-5 py-3 font-medium">
                        Application / plan
                      </th>
                      <th className="px-5 py-3 font-medium">Amount</th>
                      <th className="px-5 py-3 font-medium">Billing cycle</th>
                      <th className="px-5 py-3 font-medium">Next renewal</th>
                      <th className="px-5 py-3 font-medium">Status</th>
                      <th className="px-5 py-3 text-right font-medium">
                        Actions
                      </th>
                    </tr>
                  </thead>

                  <tbody className="divide-y divide-[#DC586D]/10">
                    {subscriptions.map((subscription) => (
                      <tr
                        key={subscription._id}
                        className="transition-colors hover:bg-[#FFF9F7]"
                      >
                        <td className="px-5 py-4">
                          <p className="font-medium text-[#4C1D3D]">
                            {subscription.applicationName || "Application"}
                          </p>
                          <p className="mt-1 text-xs text-[#852E4E]/70">
                            {subscription.plan}
                          </p>
                        </td>

                        <td className="px-5 py-4 font-medium tabular-nums text-[#4C1D3D]">
                          {formatMoney(
                            subscription.amount,
                            subscription.currency,
                          )}
                        </td>

                        <td className="px-5 py-4 capitalize text-[#852E4E]/80">
                          {subscription.billingCycle}
                        </td>

                        <td className="px-5 py-4 text-[#4C1D3D]">
                          {formatDate(subscription.renewalDate)}
                        </td>

                        <td className="px-5 py-4">
                          <span
                            className={`inline-flex rounded-full border px-2.5 py-1 text-xs font-medium capitalize ${statusClass(subscription.status)}`}
                          >
                            {subscription.status}
                          </span>
                        </td>

                        <td className="px-5 py-4">
                          <div className="flex justify-end gap-2">
                            <button
                              type="button"
                              onClick={() => openEditDialog(subscription)}
                              className="rounded-lg border border-[#DC586D]/20 px-3 py-1.5 text-xs font-medium text-[#852E4E] transition hover:bg-[#FFF9F7]"
                            >
                              Edit
                            </button>

                            <button
                              type="button"
                              onClick={() => {
                                setDeleteTarget(subscription);
                                setDeleteError("");
                                setNotice("");
                              }}
                              disabled={deleting}
                              className="rounded-lg border border-red-200 px-3 py-1.5 text-xs font-medium text-red-700 transition hover:bg-red-50 disabled:opacity-40"
                            >
                              Delete
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* Pagination stays inside the results card */}
              <div className="flex flex-col gap-4 border-t border-[#DC586D]/15 bg-[#FFF9F7] px-4 py-4 sm:flex-row sm:items-center sm:justify-between sm:px-5">
                <p className="text-sm text-[#852E4E]/75">
                  Showing{" "}
                  <span className="font-semibold tabular-nums text-[#4C1D3D]">
                    {(page - 1) * PAGE_SIZE + 1}–
                    {Math.min(page * PAGE_SIZE, total)}
                  </span>{" "}
                  of{" "}
                  <span className="font-semibold tabular-nums text-[#4C1D3D]">
                    {total}
                  </span>{" "}
                  subscriptions
                </p>

                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    disabled={page <= 1 || subscriptionsQuery.isFetching}
                    onClick={() =>
                      setPage((current) => Math.max(1, current - 1))
                    }
                    className={`${buttonClass} border border-[#DC586D]/20 bg-white text-[#852E4E] shadow-sm hover:border-[#A33757]/40 hover:bg-[#FFF0E8] disabled:opacity-40`}
                  >
                    Previous
                  </button>

                  <span className="rounded-xl border border-[#DC586D]/15 bg-white px-3 py-2.5 text-sm font-semibold tabular-nums text-[#4C1D3D]">
                    {page}
                    <span className="mx-1.5 text-[#DC586D]">/</span>
                    {totalPages}
                  </span>

                  <button
                    type="button"
                    disabled={
                      page >= totalPages || subscriptionsQuery.isFetching
                    }
                    onClick={() =>
                      setPage((current) => Math.min(totalPages, current + 1))
                    }
                    className={`${buttonClass} border border-[#4C1D3D] bg-[#4C1D3D] text-white shadow-sm hover:bg-[#852E4E] disabled:opacity-40`}
                  >
                    Next
                  </button>
                </div>
              </div>
            </>
          )}
        </div>
      </>

      {/* Create / edit subscription modal */}
      {dialogOpen && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center overflow-y-auto bg-foreground/40 p-4 backdrop-blur-sm"
          onMouseDown={(event) => {
            if (event.target === event.currentTarget && !saving) {
              setDialogOpen(false);
            }
          }}
        >
          <div
            role="dialog"
            aria-modal="true"
            aria-labelledby="subscription-dialog-title"
            className="my-auto max-h-[90vh] w-full max-w-2xl overflow-y-auto rounded-2xl border border-border bg-card text-foreground shadow-xl"
          >
            <div className="flex items-start justify-between border-b border-border p-5 sm:p-6">
              <div>
                <h2
                  id="subscription-dialog-title"
                  className="text-lg font-semibold"
                >
                  {editingSubscription
                    ? "Edit subscription"
                    : "Add subscription"}
                </h2>
                <p className="mt-1 text-sm text-muted-foreground">
                  Enter the plan and billing details below.
                </p>
              </div>

              <button
                type="button"
                disabled={saving}
                onClick={() => setDialogOpen(false)}
                aria-label="Close dialog"
                className="rounded-md px-2 py-1 text-xl text-muted-foreground hover:bg-muted hover:text-foreground"
              >
                ×
              </button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-5 p-5 sm:p-6">
              {formError && (
                <div
                  role="alert"
                  className="rounded-lg border border-destructive/20 bg-destructive/10 px-3 py-2 text-sm text-destructive"
                >
                  {formError}
                </div>
              )}

              {applicationsError && (
                <div
                  role="alert"
                  className="rounded-lg border border-destructive/20 bg-destructive/10 px-3 py-2 text-sm text-destructive"
                >
                  Could not load applications: {applicationsError}
                </div>
              )}

              {loadingApplications ? (
                <p className="text-sm text-muted-foreground">
                  Loading applications...
                </p>
              ) : applications.length === 0 ? (
                <p className="rounded-lg border border-border bg-muted/50 p-3 text-sm text-muted-foreground">
                  No applications are available. Create an application first.
                </p>
              ) : (
                <div className="grid gap-4 sm:grid-cols-2">
                  <label className="space-y-1.5 text-sm">
                    <span className="font-medium">Application *</span>
                    <select
                      required
                      value={form.applicationId}
                      onChange={(event) =>
                        updateForm("applicationId", event.target.value)
                      }
                      className={inputClass}
                    >
                      <option value="" disabled>
                        Select an application
                      </option>
                      {applications.map((app) => (
                        <option key={app._id} value={app._id}>
                          {app.name}
                        </option>
                      ))}
                    </select>
                  </label>

                  <label className="space-y-1.5 text-sm">
                    <span className="font-medium">Plan name *</span>
                    <input
                      required
                      maxLength={150}
                      value={form.plan}
                      onChange={(event) =>
                        updateForm("plan", event.target.value)
                      }
                      placeholder="e.g. Pro"
                      className={inputClass}
                    />
                  </label>

                  <label className="space-y-1.5 text-sm">
                    <span className="font-medium">Amount *</span>
                    <input
                      required
                      type="number"
                      min="0"
                      step="0.01"
                      value={form.amount}
                      onChange={(event) =>
                        updateForm("amount", event.target.value)
                      }
                      placeholder="0.00"
                      className={inputClass}
                    />
                  </label>

                  <label className="space-y-1.5 text-sm">
                    <span className="font-medium">Currency *</span>
                    <input
                      required
                      minLength={3}
                      maxLength={3}
                      value={form.currency}
                      onChange={(event) =>
                        updateForm("currency", event.target.value.toUpperCase())
                      }
                      placeholder="USD"
                      className={inputClass}
                    />
                  </label>

                  <label className="space-y-1.5 text-sm">
                    <span className="font-medium">Billing cycle *</span>
                    <select
                      value={form.billingCycle}
                      onChange={(event) =>
                        updateForm(
                          "billingCycle",
                          event.target.value as BillingCycle,
                        )
                      }
                      className={inputClass}
                    >
                      <option value="monthly">Monthly</option>
                      <option value="quarterly">Quarterly</option>
                      <option value="yearly">Yearly</option>
                    </select>
                  </label>

                  <label className="space-y-1.5 text-sm">
                    <span className="font-medium">Status *</span>
                    <select
                      value={form.status}
                      onChange={(event) =>
                        updateForm(
                          "status",
                          event.target.value as SubscriptionStatus,
                        )
                      }
                      className={inputClass}
                    >
                      <option value="active">Active</option>
                      <option value="paused">Paused</option>
                      <option value="cancelled">Cancelled</option>
                      <option value="expired">Expired</option>
                    </select>
                  </label>

                  <label className="space-y-1.5 text-sm">
                    <span className="font-medium">Start date *</span>
                    <input
                      required
                      type="date"
                      value={form.startDate}
                      onChange={(event) =>
                        updateForm("startDate", event.target.value)
                      }
                      className={inputClass}
                    />
                  </label>

                  <label className="space-y-1.5 text-sm">
                    <span className="font-medium">Renewal date *</span>
                    <input
                      required
                      type="date"
                      value={form.renewalDate}
                      onChange={(event) =>
                        updateForm("renewalDate", event.target.value)
                      }
                      className={inputClass}
                    />
                  </label>

                  <label className="space-y-1.5 text-sm sm:col-span-2">
                    <span className="font-medium">End date (optional)</span>
                    <input
                      type="date"
                      value={form.endDate}
                      onChange={(event) =>
                        updateForm("endDate", event.target.value)
                      }
                      className={inputClass}
                    />
                  </label>
                </div>
              )}

              <div className="flex flex-col-reverse gap-3 border-t border-border pt-5 sm:flex-row sm:justify-end">
                <button
                  type="button"
                  disabled={saving}
                  onClick={() => setDialogOpen(false)}
                  className={`${buttonClass} border border-border bg-background text-foreground hover:bg-muted`}
                >
                  Cancel
                </button>

                <button
                  type="submit"
                  disabled={
                    saving || loadingApplications || applications.length === 0
                  }
                  className={`${buttonClass} text-white bg-[#4C1D3D]  hover:bg-primary/90`}
                >
                  {saving
                    ? "Saving..."
                    : editingSubscription
                      ? "Save changes"
                      : "Create subscription"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
      {/* Delete confirmation modal */}
      {deleteTarget && (
        <div
          className="fixed inset-0 z-[60] flex items-center justify-center bg-foreground/40 p-4 backdrop-blur-sm"
          onMouseDown={(event) => {
            if (event.target === event.currentTarget && !deleting) {
              setDeleteTarget(null);
            }
          }}
        >
          <div
            role="alertdialog"
            aria-modal="true"
            aria-labelledby="delete-subscription-title"
            aria-describedby="delete-subscription-description"
            className="w-full max-w-md rounded-2xl border border-border bg-card p-6 text-foreground shadow-xl"
          >
            <div className="flex h-12 w-12 items-center justify-center rounded-full bg-destructive/10 text-destructive">
              <Trash2 className="h-6 w-6" aria-hidden="true" />
            </div>

            <h2
              id="delete-subscription-title"
              className="mt-4 text-lg font-semibold"
            >
              Delete subscription?
            </h2>

            <p
              id="delete-subscription-description"
              className="mt-2 text-sm leading-6 text-muted-foreground"
            >
              You are about to delete the{" "}
              <span className="font-medium text-foreground">
                {deleteTarget.plan}
              </span>{" "}
              subscription for{" "}
              <span className="font-medium text-foreground">
                {deleteTarget.applicationName || "this application"}
              </span>
              . This action cannot be undone.
            </p>

            {deleteError && (
              <div
                role="alert"
                className="mt-4 rounded-lg border border-destructive/20 bg-destructive/10 px-3 py-2 text-sm text-destructive"
              >
                {deleteError}
              </div>
            )}

            <div className="mt-6 flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
              <button
                type="button"
                disabled={deleting}
                onClick={() => {
                  setDeleteTarget(null);
                  setDeleteError("");
                }}
                className={`${buttonClass} border border-border bg-background text-foreground hover:bg-muted`}
              >
                Cancel
              </button>

              <button
                type="button"
                disabled={deleting}
                onClick={() => void confirmDelete()}
                className={`${buttonClass} text-white bg-primary hover:bg-primary/90`}
              >
                {deleting ? "Deleting..." : "Delete subscription"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
