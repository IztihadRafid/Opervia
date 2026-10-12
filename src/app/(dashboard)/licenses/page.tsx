"use client";

import { useEffect, useState } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import {
  CalendarClock,
  ChevronLeft,
  ChevronRight,
  KeyRound,
  Loader2,
  Pencil,
  Plus,
  Search,
  ShieldCheck,
  Trash2,
  X,
} from "lucide-react";

import { useApplications, type ApplicationItem } from "@/hooks/useApplications";
import {
  useCreateLicense,
  useDeleteLicense,
  useLicenses,
  useUpdateLicense,
  type CreateLicenseInput,
  type LicenseItem,
  type LicenseStatus,
  type LicenseType,
  type UpdateLicenseInput,
} from "@/hooks/useLicenses";
import LicenseForm from "@/components/ui/licenses/licenseForm";

const PAGE_SIZE = 10;

function getErrorMessage(error: unknown, fallback: string) {
  return error instanceof Error ? error.message : fallback;
}

function formatDate(date: string | null | undefined) {
  if (!date) return "—";

  const parsedDate = new Date(date);

  if (Number.isNaN(parsedDate.getTime())) return "—";

  return new Intl.DateTimeFormat("en", {
    month: "short",
    day: "numeric",
    year: "numeric",
  }).format(parsedDate);
}

function formatLicenseType(type: LicenseType) {
  const labels: Record<LicenseType, string> = {
    named_user: "Named user",
    concurrent: "Concurrent",
    site: "Site",
    device: "Device",
    subscription: "Subscription",
    perpetual: "Perpetual",
  };

  return labels[type];
}

function StatusBadge({ status }: { status: LicenseStatus }) {
  const styles: Record<LicenseStatus, string> = {
    active: "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400",
    expired: "bg-amber-500/10 text-amber-600 dark:text-amber-400",
    suspended: "bg-orange-500/10 text-orange-600 dark:text-orange-400",
    cancelled: "bg-muted text-muted-foreground",
  };

  const labels: Record<LicenseStatus, string> = {
    active: "Active",
    expired: "Expired",
    suspended: "Suspended",
    cancelled: "Cancelled",
  };

  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-medium ${styles[status]}`}
    >
      <span
        className={`size-1.5 rounded-full ${
          status === "active"
            ? "bg-emerald-500"
            : status === "expired"
              ? "bg-amber-500"
              : status === "suspended"
                ? "bg-orange-500"
                : "bg-muted-foreground/60"
        }`}
      />
      {labels[status]}
    </span>
  );
}

function SeatUsage({ used, total }: { used: number; total: number }) {
  const percentage = total > 0 ? Math.min(100, (used / total) * 100) : 0;

  return (
    <div className="min-w-28 space-y-1.5">
      <div className="flex items-center justify-between gap-2 text-xs">
        <span className="font-medium tabular-nums">
          {used} / {total}
        </span>
        <span className="text-muted-foreground tabular-nums">
          {Math.round(percentage)}%
        </span>
      </div>

      <div
        className="h-1.5 overflow-hidden rounded-full bg-muted"
        role="progressbar"
        aria-label="License seat usage"
        aria-valuemin={0}
        aria-valuemax={total}
        aria-valuenow={Math.min(used, total)}
      >
        <div
          className={`h-full rounded-full transition-all ${
            percentage >= 90 ? "bg-amber-500" : "bg-primary"
          }`}
          style={{ width: `${percentage}%` }}
        />
      </div>
    </div>
  );
}

export default function LicensesPage() {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  const [page, setPage] = useState(() => {
    const value = Number(searchParams.get("page"));
    return Number.isInteger(value) && value > 0 ? value : 1;
  });

  const [search, setSearch] = useState(() => searchParams.get("search") ?? "");

  const [statusFilter, setStatusFilter] = useState<LicenseStatus | "all">(
    () => {
      const status = searchParams.get("status");

      return status === "active" ||
        status === "expired" ||
        status === "suspended" ||
        status === "cancelled"
        ? status
        : "all";
    },
  );

  const [applicationFilter, setApplicationFilter] = useState(
    () => searchParams.get("applicationId") ?? "all",
  );

  const [successMessage, setSuccessMessage] = useState("");
  const [formOpen, setFormOpen] = useState(false);
  const [editingLicense, setEditingLicense] = useState<LicenseItem | null>(
    null,
  );
  const [deletingLicense, setDeletingLicense] = useState<LicenseItem | null>(
    null,
  );
  const [deleteError, setDeleteError] = useState("");

  useEffect(() => {
    if (!successMessage) return;

    const timeoutId = setTimeout(() => {
      setSuccessMessage("");
    }, 3000);

    return () => clearTimeout(timeoutId);
  }, [successMessage]);

  useEffect(() => {
    const params = new URLSearchParams();

    if (search.trim()) {
      params.set("search", search.trim());
    }

    if (statusFilter !== "all") {
      params.set("status", statusFilter);
    }

    if (applicationFilter !== "all") {
      params.set("applicationId", applicationFilter);
    }

    if (page > 1) {
      params.set("page", String(page));
    }

    const queryString = params.toString();
    const nextUrl = queryString ? `${pathname}?${queryString}` : pathname;
    const currentUrl = `${pathname}${window.location.search}`;

    if (nextUrl !== currentUrl) {
      router.push(nextUrl, { scroll: false });
    }
  }, [page, search, statusFilter, applicationFilter, pathname, router]);

  useEffect(() => {
    function handlePopState() {
      const params = new URLSearchParams(window.location.search);
      const nextStatus = params.get("status");
      const nextPage = Number(params.get("page"));

      setSearch(params.get("search") ?? "");
      setApplicationFilter(params.get("applicationId") ?? "all");

      setStatusFilter(
        nextStatus === "active" ||
          nextStatus === "expired" ||
          nextStatus === "suspended" ||
          nextStatus === "cancelled"
          ? nextStatus
          : "all",
      );

      setPage(Number.isInteger(nextPage) && nextPage > 0 ? nextPage : 1);
    }

    window.addEventListener("popstate", handlePopState);

    return () => {
      window.removeEventListener("popstate", handlePopState);
    };
  }, []);

  const licensesQuery = useLicenses({
    page,
    limit: PAGE_SIZE,
    search: search.trim() || undefined,
    status: statusFilter === "all" ? undefined : statusFilter,
    applicationId: applicationFilter === "all" ? undefined : applicationFilter,
  });

  const applicationsQuery = useApplications({
    page: 1,
    limit: 100,
  });

  const createLicenseMutation = useCreateLicense();
  const updateLicenseMutation = useUpdateLicense();
  const deleteLicenseMutation = useDeleteLicense();

  const licenses = licensesQuery.data?.licenses ?? [];
  const pagination = licensesQuery.data?.pagination;
  const applications = applicationsQuery.data?.applications ?? [];

  const applicationNames = new Map(
    applications.map((application: ApplicationItem) => [
      application._id,
      application.name,
    ]),
  );

  const isSaving =
    createLicenseMutation.isPending || updateLicenseMutation.isPending;

  const formError = editingLicense
    ? updateLicenseMutation.error
      ? getErrorMessage(
          updateLicenseMutation.error,
          "Unable to update this license. Please try again.",
        )
      : undefined
    : createLicenseMutation.error
      ? getErrorMessage(
          createLicenseMutation.error,
          "Unable to create this license. Please try again.",
        )
      : undefined;

  function openCreateForm() {
    createLicenseMutation.reset();
    updateLicenseMutation.reset();
    setEditingLicense(null);
    setFormOpen(true);
    setSuccessMessage("");
  }

  function openEditForm(license: LicenseItem) {
    createLicenseMutation.reset();
    updateLicenseMutation.reset();
    setEditingLicense(license);
    setFormOpen(true);
    setSuccessMessage("");
  }

  function closeForm() {
    if (isSaving) return;

    setFormOpen(false);
    setEditingLicense(null);
    createLicenseMutation.reset();
    updateLicenseMutation.reset();
  }

  async function handleFormSubmit(
    input: CreateLicenseInput | UpdateLicenseInput,
  ) {
    setSuccessMessage("");

    try {
      if (editingLicense) {
        await updateLicenseMutation.mutateAsync({
          id: editingLicense.id,
          input: input as UpdateLicenseInput,
        });

        setSuccessMessage("License updated successfully.");
      } else {
        await createLicenseMutation.mutateAsync(input as CreateLicenseInput);

        setSuccessMessage("License created successfully.");
        setPage(1);
      }

      setFormOpen(false);
      setEditingLicense(null);
    } catch {
      // The mutation error is displayed inside LicenseForm.
    }
  }

  function handleSearchChange(value: string) {
    setSearch(value);
    setPage(1);
  }

  function handleStatusChange(value: LicenseStatus | "all") {
    setStatusFilter(value);
    setPage(1);
  }

  function handleApplicationChange(value: string) {
    setApplicationFilter(value);
    setPage(1);
  }

  async function handleDelete() {
    if (!deletingLicense) return;

    setDeleteError("");

    try {
      await deleteLicenseMutation.mutateAsync(deletingLicense.id);

      setSuccessMessage(`"${deletingLicense.name}" was deleted successfully.`);

      setDeletingLicense(null);
      setPage((current) =>
        current > 1 && licenses.length === 1 ? current - 1 : current,
      );
    } catch (error) {
      setDeleteError(
        getErrorMessage(
          error,
          "Unable to delete this license. Please try again.",
        ),
      );
    }
  }

  const isInitialLoading = licensesQuery.isPending && !licensesQuery.data;

  const queryError = licensesQuery.error
    ? getErrorMessage(
        licensesQuery.error,
        "Unable to load licenses. Please try again.",
      )
    : null;

  const activeCount = licenses.filter(
    (license) => license.status === "active",
  ).length;

  const usedSeats = licenses.reduce(
    (total, license) => total + license.usedSeats,
    0,
  );

  const totalSeats = licenses.reduce(
    (total, license) => total + license.totalSeats,
    0,
  );

  const hasFilters =
    Boolean(search.trim()) ||
    statusFilter !== "all" ||
    applicationFilter !== "all";

  return (
    <div className="mx-auto w-full max-w-[1600px] space-y-6 p-4 sm:p-6 lg:p-8">
      {/* Page header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-start gap-3">
          <div className="flex size-12 shrink-0 items-center justify-center rounded-2xl border border-border bg-card shadow-sm">
            <KeyRound className="size-6 text-primary" />
          </div>

          <div>
            <h1 className="text-2xl font-semibold tracking-tight sm:text-3xl">
              Licenses
            </h1>
            <p className="mt-1 max-w-2xl text-sm leading-6 text-muted-foreground">
              Manage software licenses, seat allocations, and expiration dates
              across your applications.
            </p>
          </div>
        </div>

        <button
          type="button"
          onClick={openCreateForm}
          className="inline-flex shrink-0 items-center justify-center gap-2 rounded-xl bg-primary px-4 py-2.5 text-sm font-medium text-primary-foreground shadow-sm transition hover:opacity-90"
        >
          <Plus className="size-4" />
          Add license
        </button>
      </div>

      {successMessage && (
        <div
          role="status"
          className="rounded-lg border border-green-500/20 bg-green-500/10 px-4 py-3 text-sm text-green-700 dark:text-green-400"
        >
          {successMessage}
        </div>
      )}

      {/* Summary */}
      <div className="grid gap-4 sm:grid-cols-3">
        <div className="rounded-2xl border border-border bg-card p-5">
          <div className="flex items-center justify-between gap-3">
            <div>
              <p className="text-sm text-muted-foreground">Licenses found</p>
              <p className="mt-2 text-2xl font-semibold tracking-tight tabular-nums">
                {pagination?.total ?? "—"}
              </p>
            </div>

            <div className="flex size-11 items-center justify-center rounded-xl bg-primary/10 text-primary">
              <KeyRound className="size-5" />
            </div>
          </div>
          <p className="mt-2 text-xs text-muted-foreground">
            Based on your current search and filters
          </p>
        </div>

        <div className="rounded-2xl border border-border bg-card p-5">
          <div className="flex items-center justify-between gap-3">
            <div>
              <p className="text-sm text-muted-foreground">
                Active licenses on page
              </p>
              <p className="mt-2 text-2xl font-semibold tracking-tight tabular-nums">
                {isInitialLoading ? "—" : activeCount}
              </p>
            </div>

            <div className="flex size-11 items-center justify-center rounded-xl bg-emerald-500/10 text-emerald-500">
              <ShieldCheck className="size-5" />
            </div>
          </div>
          <p className="mt-2 text-xs text-muted-foreground">
            Active licenses in the current results
          </p>
        </div>

        <div className="rounded-2xl border border-border bg-card p-5">
          <div className="flex items-center justify-between gap-3">
            <div>
              <p className="text-sm text-muted-foreground">
                Seats allocated on page
              </p>
              <p className="mt-2 text-2xl font-semibold tracking-tight tabular-nums">
                {isInitialLoading ? "—" : `${usedSeats} / ${totalSeats}`}
              </p>
            </div>

            <div className="flex size-11 items-center justify-center rounded-xl bg-violet-500/10 text-violet-500">
              <CalendarClock className="size-5" />
            </div>
          </div>
          <p className="mt-2 text-xs text-muted-foreground">
            Used seats versus total seats in the current results
          </p>
        </div>
      </div>

      {/* Licenses table */}
      <section className="overflow-hidden rounded-2xl border border-border bg-card">
        <div className="flex flex-col gap-4 border-b border-border p-4 sm:p-5 lg:flex-row lg:items-center lg:justify-between">
          <div>
            <h2 className="font-semibold tracking-tight">All licenses</h2>
            <p className="mt-1 text-sm text-muted-foreground">
              View and manage license records for your organization.
            </p>
          </div>

          <div className="flex flex-col gap-3 sm:flex-row sm:flex-wrap sm:items-center">
            <div className="relative min-w-0 sm:w-64">
              <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
              <input
                type="search"
                value={search}
                onChange={(event) => handleSearchChange(event.target.value)}
                placeholder="Search licenses..."
                aria-label="Search licenses"
                className="w-full rounded-xl border border-border bg-background py-2.5 pl-9 pr-3 text-sm outline-none transition placeholder:text-muted-foreground focus-visible:ring-2 focus-visible:ring-ring"
              />
            </div>

            <select
              value={statusFilter}
              onChange={(event) =>
                handleStatusChange(event.target.value as LicenseStatus | "all")
              }
              aria-label="Filter licenses by status"
              className="rounded-xl border border-border bg-background px-3 py-2.5 text-sm outline-none transition focus-visible:ring-2 focus-visible:ring-ring"
            >
              <option value="all">All statuses</option>
              <option value="active">Active</option>
              <option value="expired">Expired</option>
              <option value="suspended">Suspended</option>
              <option value="cancelled">Cancelled</option>
            </select>

            <select
              value={applicationFilter}
              onChange={(event) => handleApplicationChange(event.target.value)}
              aria-label="Filter licenses by application"
              className="max-w-full rounded-xl border border-border bg-background px-3 py-2.5 text-sm outline-none transition focus-visible:ring-2 focus-visible:ring-ring sm:max-w-56"
            >
              <option value="all">All applications</option>
              {applications.map((application) => (
                <option key={application._id} value={application._id}>
                  {application.name}
                </option>
              ))}
            </select>
          </div>
        </div>

        {applicationsQuery.error && (
          <div
            role="alert"
            className="border-b border-amber-500/20 bg-amber-500/5 px-5 py-3 text-sm text-amber-700 dark:text-amber-400"
          >
            Application names may be unavailable because the applications list
            could not be loaded.
          </div>
        )}

        {queryError && !licensesQuery.data && (
          <div className="m-5 rounded-xl border border-destructive/30 bg-destructive/5 p-4">
            <p className="text-sm font-medium text-destructive">
              Could not load licenses
            </p>
            <p className="mt-1 text-sm text-muted-foreground">{queryError}</p>
            <button
              type="button"
              onClick={() => licensesQuery.refetch()}
              className="mt-3 rounded-lg border border-border px-3 py-2 text-sm font-medium transition hover:bg-muted"
            >
              Try again
            </button>
          </div>
        )}

        {queryError && licensesQuery.data && (
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
            <p className="text-sm text-muted-foreground">Loading licenses...</p>
          </div>
        ) : !queryError || licensesQuery.data ? (
          licenses.length === 0 ? (
            <div className="flex min-h-72 flex-col items-center justify-center px-5 py-12 text-center">
              <div className="flex size-14 items-center justify-center rounded-2xl border border-border bg-muted/50">
                {hasFilters ? (
                  <Search className="size-6 text-muted-foreground" />
                ) : (
                  <KeyRound className="size-6 text-muted-foreground" />
                )}
              </div>

              <h3 className="mt-4 font-semibold">
                {hasFilters ? "No matching licenses" : "No licenses yet"}
              </h3>

              <p className="mt-2 max-w-sm text-sm leading-6 text-muted-foreground">
                {hasFilters
                  ? "Try changing your search or filters to find a license."
                  : "Add your first license to start tracking software access, seat usage, and renewals."}
              </p>

              {hasFilters ? (
                <button
                  type="button"
                  onClick={() => {
                    setSearch("");
                    setStatusFilter("all");
                    setApplicationFilter("all");
                    setPage(1);
                  }}
                  className="mt-4 rounded-lg border border-border px-4 py-2 text-sm font-medium transition hover:bg-muted"
                >
                  Clear filters
                </button>
              ) : (
                <button
                  type="button"
                  onClick={openCreateForm}
                  className="mt-4 inline-flex items-center gap-2 rounded-lg bg-primary px-4 py-2.5 text-sm font-medium text-primary-foreground transition hover:opacity-90"
                >
                  <Plus className="size-4" />
                  Add your first license
                </button>
              )}
            </div>
          ) : (
            <>
              <div className="overflow-x-auto">
                <table className="w-full min-w-[1050px] text-left text-sm">
                  <thead className="bg-muted/30 text-xs uppercase tracking-wide text-muted-foreground">
                    <tr>
                      <th className="px-5 py-3.5 font-medium">License</th>
                      <th className="px-5 py-3.5 font-medium">Application</th>
                      <th className="px-5 py-3.5 font-medium">Type</th>
                      <th className="px-5 py-3.5 font-medium">Seat usage</th>
                      <th className="px-5 py-3.5 font-medium">Status</th>
                      <th className="px-5 py-3.5 font-medium">Expiry date</th>
                      <th className="px-5 py-3.5 text-right font-medium">
                        Actions
                      </th>
                    </tr>
                  </thead>

                  <tbody className="divide-y divide-border">
                    {licenses.map((license) => (
                      <tr
                        key={license.id}
                        className="transition-colors hover:bg-muted/20"
                      >
                        <td className="px-5 py-4">
                          <div className="flex items-center gap-3">
                            <div className="flex size-10 shrink-0 items-center justify-center rounded-xl border border-border bg-muted/70">
                              <KeyRound className="size-4 text-primary" />
                            </div>

                            <div className="min-w-0">
                              <p className="max-w-56 truncate font-medium text-foreground">
                                {license.name}
                              </p>
                              <p className="mt-1 text-xs text-muted-foreground">
                                Started {formatDate(license.startDate)}
                              </p>
                            </div>
                          </div>
                        </td>

                        <td className="px-5 py-4">
                          <span className="block max-w-48 truncate font-medium">
                            {applicationNames.get(license.applicationId) ??
                              "Application unavailable"}
                          </span>
                        </td>

                        <td className="px-5 py-4">
                          <span className="inline-flex rounded-lg border border-border px-2.5 py-1.5 text-xs">
                            {formatLicenseType(license.licenseType)}
                          </span>
                        </td>

                        <td className="px-5 py-4">
                          <SeatUsage
                            used={license.usedSeats}
                            total={license.totalSeats}
                          />
                          <p className="mt-1 text-xs text-muted-foreground">
                            {license.availableSeats} seats available
                          </p>
                        </td>

                        <td className="px-5 py-4">
                          <StatusBadge status={license.status} />
                        </td>

                        <td className="px-5 py-4 whitespace-nowrap">
                          <p className="font-medium">
                            {formatDate(license.expiryDate)}
                          </p>
                          <p className="mt-1 text-xs text-muted-foreground">
                            {license.expiryDate
                              ? license.status === "expired"
                                ? "Expired"
                                : "Expiry date"
                              : "No expiry date"}
                          </p>
                        </td>

                        <td className="px-5 py-4">
                          <div className="flex items-center justify-end gap-1.5">
                            <button
                              type="button"
                              onClick={() => openEditForm(license)}
                              aria-label={`Edit ${license.name}`}
                              title="Edit license"
                              className="inline-flex size-9 items-center justify-center rounded-lg border border-transparent text-muted-foreground transition hover:border-border hover:bg-muted hover:text-foreground"
                            >
                              <Pencil className="size-4" />
                            </button>

                            <button
                              type="button"
                              onClick={() => {
                                setDeleteError("");
                                deleteLicenseMutation.reset();
                                setDeletingLicense(license);
                              }}
                              aria-label={`Delete ${license.name}`}
                              title="Delete license"
                              className="inline-flex size-9 items-center justify-center rounded-lg border border-transparent text-muted-foreground transition hover:border-destructive/20 hover:bg-destructive/10 hover:text-destructive"
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
                      licenses
                    </>
                  ) : (
                    "No licenses to display"
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
                        setPage((current) => Math.max(1, current - 1))
                      }
                      disabled={
                        page <= 1 ||
                        licensesQuery.isFetching ||
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
                        setPage((current) =>
                          Math.min(
                            pagination?.totalPages ?? current,
                            current + 1,
                          ),
                        )
                      }
                      disabled={
                        !pagination ||
                        page >= pagination.totalPages ||
                        licensesQuery.isFetching
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

      {/* Create / Edit License Modal */}
      {formOpen && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm"
          onMouseDown={(event) => {
            if (event.target === event.currentTarget) {
              closeForm();
            }
          }}
        >
          <div
            role="dialog"
            aria-modal="true"
            aria-labelledby="license-form-modal-title"
            className="relative max-h-[90vh] w-full max-w-2xl overflow-y-auto rounded-2xl border border-border bg-background p-5 shadow-2xl sm:p-7"
          >
            <div className="mb-5 flex justify-end">
              <button
                type="button"
                onClick={closeForm}
                disabled={isSaving}
                aria-label="Close license form"
                className="inline-flex size-9 items-center justify-center rounded-lg text-muted-foreground transition hover:bg-muted hover:text-foreground disabled:opacity-50"
              >
                <X className="size-5" />
              </button>
            </div>

            <div id="license-form-modal-title" className="sr-only">
              {editingLicense ? "Edit license" : "Add a license"}
            </div>

            <LicenseForm
              key={editingLicense?.id ?? "new-license"}
              license={editingLicense}
              isSaving={isSaving}
              errorMessage={formError}
              onSubmit={handleFormSubmit}
              onCancel={closeForm}
            />
          </div>
        </div>
      )}

      {/* Delete License Confirmation */}
      {deletingLicense && (
        <div
          className="fixed inset-0 z-[60] flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm"
          onMouseDown={(event) => {
            if (
              event.target === event.currentTarget &&
              !deleteLicenseMutation.isPending
            ) {
              setDeletingLicense(null);
              setDeleteError("");
            }
          }}
        >
          <div
            role="alertdialog"
            aria-modal="true"
            aria-labelledby="delete-license-title"
            aria-describedby="delete-license-description"
            className="w-full max-w-md rounded-2xl border border-border bg-background p-6 shadow-2xl"
          >
            <div className="flex items-start gap-4">
              <div className="flex size-11 shrink-0 items-center justify-center rounded-xl bg-destructive/10 text-destructive">
                <Trash2 className="size-5" />
              </div>

              <div className="min-w-0 flex-1">
                <h2
                  id="delete-license-title"
                  className="font-semibold tracking-tight"
                >
                  Delete license?
                </h2>
                <p
                  id="delete-license-description"
                  className="mt-2 text-sm leading-6 text-muted-foreground"
                >
                  This will permanently delete{" "}
                  <span className="font-medium text-foreground">
                    {deletingLicense.name}
                  </span>
                  . This action cannot be undone.
                </p>
              </div>

              <button
                type="button"
                onClick={() => {
                  setDeletingLicense(null);
                  setDeleteError("");
                }}
                disabled={deleteLicenseMutation.isPending}
                aria-label="Close delete confirmation"
                className="inline-flex size-8 shrink-0 items-center justify-center rounded-lg text-muted-foreground transition hover:bg-muted disabled:opacity-50"
              >
                <X className="size-4" />
              </button>
            </div>

            {deleteError && (
              <p
                role="alert"
                className="mt-4 rounded-lg border border-destructive/20 bg-destructive/5 p-3 text-sm text-destructive"
              >
                {deleteError}
              </p>
            )}

            <div className="mt-6 flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
              <button
                type="button"
                onClick={() => {
                  setDeletingLicense(null);
                  setDeleteError("");
                }}
                disabled={deleteLicenseMutation.isPending}
                className="rounded-xl border border-border px-4 py-2.5 text-sm font-medium transition hover:bg-muted disabled:cursor-not-allowed disabled:opacity-50"
              >
                Cancel
              </button>

              <button
                type="button"
                onClick={handleDelete}
                disabled={deleteLicenseMutation.isPending}
                className="inline-flex items-center justify-center gap-2 rounded-xl bg-destructive px-4 py-2.5 text-sm font-medium text-destructive-foreground transition hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-60"
              >
                {deleteLicenseMutation.isPending && (
                  <Loader2 className="size-4 animate-spin" />
                )}
                {deleteLicenseMutation.isPending
                  ? "Deleting..."
                  : "Delete license"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
