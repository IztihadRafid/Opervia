"use client";

import { useEffect, useState } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import {
  Building2,
  ChevronLeft,
  ChevronRight,
  ExternalLink,
  Globe,
  Loader2,
  Mail,
  Pencil,
  Plus,
  Search,
  Trash2,
  Users,
  X,
} from "lucide-react";

import {
  useCreateVendor,
  useUpdateVendor,
  useVendors,
  type CreateVendorInput,
  type VendorItem,
  type VendorStatus,
} from "@/hooks/useVendors";
import VendorForm from "@/components/ui/vendors/vendorForm";
import { DeleteVendorDialog } from "@/components/ui/vendors/deleteVendorDialog";

const PAGE_SIZE = 10;

function getErrorMessage(error: unknown, fallback: string) {
  return error instanceof Error ? error.message : fallback;
}

function formatDate(date: string) {
  if (!date) return "—";

  const parsedDate = new Date(date);

  if (Number.isNaN(parsedDate.getTime())) return "—";

  return new Intl.DateTimeFormat("en", {
    month: "short",
    day: "numeric",
    year: "numeric",
  }).format(parsedDate);
}

function getWebsiteUrl(website: string) {
  const trimmed = website.trim();

  if (!trimmed) return null;

  try {
    const url = new URL(
      /^https?:\/\//i.test(trimmed) ? trimmed : `https://${trimmed}`,
    );

    if (url.protocol !== "http:" && url.protocol !== "https:") {
      return null;
    }

    return url.toString();
  } catch {
    return null;
  }
}

function StatusBadge({ status }: { status: VendorStatus }) {
  const active = status === "active";

  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-medium ${
        active
          ? "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400"
          : "bg-muted text-muted-foreground"
      }`}
    >
      <span
        className={`size-1.5 rounded-full ${
          active ? "bg-emerald-500" : "bg-muted-foreground/60"
        }`}
      />
      {active ? "Active" : "Inactive"}
    </span>
  );
}

function VendorInitial({ name }: { name: string }) {
  const initials = name
    .trim()
    .split(/\s+/)
    .slice(0, 2)
    .map((part) => part.charAt(0))
    .join("")
    .toUpperCase();

  return (
    <div className="flex size-10 shrink-0 items-center justify-center rounded-xl border border-border bg-muted/70 text-sm font-semibold text-foreground">
      {initials || "V"}
    </div>
  );
}

export default function VendorsPage() {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [page, setPage] = useState(() => {
    const value = Number(searchParams.get("page"));
    return Number.isInteger(value) && value > 0 ? value : 1;
  });
  const [successMessage, setSuccessMessage] = useState("");
  const [search, setSearch] = useState(() => searchParams.get("search") ?? "");
  const [statusFilter, setStatusFilter] = useState<VendorStatus | "all">(() => {
    const status = searchParams.get("status");
    return status === "active" || status === "inactive" ? status : "all";
  });

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

    if (page > 1) {
      params.set("page", String(page));
    }

    const queryString = params.toString();
    const nextUrl = queryString ? `${pathname}?${queryString}` : pathname;
    const currentUrl = `${pathname}${window.location.search}`;
    if (nextUrl !== currentUrl) {
      router.push(nextUrl, { scroll: false });
    }
  }, [page, search, statusFilter, pathname, router]);

  useEffect(() => {
    function handlePopState() {
      const params = new URLSearchParams(window.location.search);
      const nextSearch = params.get("search") ?? "";
      const nextStatus = params.get("status");
      const nextPage = Number(params.get("page"));
      setSearch(nextSearch);
      setStatusFilter(
        nextStatus === "active" || nextStatus === "inactive"
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

  const [formOpen, setFormOpen] = useState(false);
  const [editingVendor, setEditingVendor] = useState<VendorItem | null>(null);
  const [deletingVendor, setDeletingVendor] = useState<VendorItem | null>(null);
  const vendorsQuery = useVendors({
    page,
    limit: PAGE_SIZE,
    search: search.trim() || undefined,
    status: statusFilter === "all" ? undefined : statusFilter,
  });

  const createVendorMutation = useCreateVendor();
  const updateVendorMutation = useUpdateVendor();
  const vendors = vendorsQuery.data?.vendors ?? [];
  const pagination = vendorsQuery.data?.pagination;
  const isSaving =
    createVendorMutation.isPending || updateVendorMutation.isPending;
  const formError = editingVendor
    ? updateVendorMutation.error
      ? getErrorMessage(
          updateVendorMutation.error,
          "Unable to update this vendor. Please try again.",
        )
      : undefined
    : createVendorMutation.error
      ? getErrorMessage(
          createVendorMutation.error,
          "Unable to create this vendor. Please try again.",
        )
      : undefined;

  function openCreateForm() {
    createVendorMutation.reset();
    updateVendorMutation.reset();
    setEditingVendor(null);
    setFormOpen(true);
    setSuccessMessage("");
  }

  function openEditForm(vendor: VendorItem) {
    createVendorMutation.reset();
    updateVendorMutation.reset();
    setEditingVendor(vendor);
    setFormOpen(true);
    setSuccessMessage("");
  }

  function closeForm() {
    if (isSaving) return;

    setFormOpen(false);
    setEditingVendor(null);
    createVendorMutation.reset();
    updateVendorMutation.reset();
  }

  async function handleFormSubmit(input: CreateVendorInput) {
    setSuccessMessage("");

    try {
      if (editingVendor) {
        await updateVendorMutation.mutateAsync({
          id: editingVendor._id,
          input,
        });

        setSuccessMessage("Vendor updated successfully.");
      } else {
        await createVendorMutation.mutateAsync(input);
        setSuccessMessage("Vendor created successfully.");
        setPage(1);
      }

      setFormOpen(false);
      setEditingVendor(null);
    } catch {
      // The mutation error is displayed inside VendorForm.
    }
  }

  function handleSearchChange(value: string) {
    setSearch(value);
    setPage(1);
  }

  function handleStatusChange(value: VendorStatus | "all") {
    setStatusFilter(value);
    setPage(1);
  }

  const isInitialLoading = vendorsQuery.isPending && !vendorsQuery.data;

  const queryError = vendorsQuery.error
    ? getErrorMessage(
        vendorsQuery.error,
        "Unable to load vendors. Please try again.",
      )
    : null;

  return (
    <div className="mx-auto w-full max-w-[1600px] space-y-6 p-4 sm:p-6 lg:p-8">
      {/* Page header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-start gap-3">
          <div className="flex size-12 shrink-0 items-center justify-center rounded-2xl border border-border bg-card shadow-sm">
            <Building2 className="size-6 text-primary" />
          </div>

          <div>
            <h1 className="text-2xl font-semibold tracking-tight sm:text-3xl">
              Vendors
            </h1>
            <p className="mt-1 max-w-2xl text-sm leading-6 text-muted-foreground">
              Manage your software providers, supplier contacts, and vendor
              relationships in one place.
            </p>
          </div>
        </div>

        <button
          type="button"
          onClick={openCreateForm}
          className="inline-flex shrink-0 items-center justify-center gap-2 rounded-xl bg-primary px-4 py-2.5 text-sm font-medium text-primary-foreground shadow-sm transition hover:opacity-90"
        >
          <Plus className="size-4" />
          Add vendor
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
      <div className="grid gap-4 sm:grid-cols-2">
        <div className="rounded-2xl border border-border bg-card p-5">
          <div className="flex items-center justify-between gap-3">
            <div>
              <p className="text-sm text-muted-foreground">Vendors found</p>
              <p className="mt-2 text-2xl font-semibold tracking-tight tabular-nums">
                {pagination?.total ?? "—"}
              </p>
            </div>

            <div className="flex size-11 items-center justify-center rounded-xl bg-primary/10 text-primary">
              <Building2 className="size-5" />
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
                Linked applications
              </p>
              <p className="mt-2 text-2xl font-semibold tracking-tight tabular-nums">
                {vendorsQuery.isPending && !vendorsQuery.data
                  ? "—"
                  : vendors.reduce(
                      (total, vendor) => total + vendor.applicationCount,
                      0,
                    )}
              </p>
            </div>

            <div className="flex size-11 items-center justify-center rounded-xl bg-violet-500/10 text-violet-500">
              <Users className="size-5" />
            </div>
          </div>
          <p className="mt-2 text-xs text-muted-foreground">
            Across vendors on this page
          </p>
        </div>
      </div>

      {/* Vendors table container */}
      <section className="overflow-hidden rounded-2xl border border-border bg-card">
        <div className="flex flex-col gap-4 border-b border-border p-4 sm:p-5 lg:flex-row lg:items-center lg:justify-between">
          <div>
            <h2 className="font-semibold tracking-tight">All vendors</h2>
            <p className="mt-1 text-sm text-muted-foreground">
              View and manage your organization's vendors.
            </p>
          </div>

          <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
            <div className="relative min-w-0 sm:w-72">
              <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
              <input
                type="search"
                value={search}
                onChange={(event) => handleSearchChange(event.target.value)}
                placeholder="Search vendors..."
                aria-label="Search vendors"
                className="w-full rounded-xl border border-border bg-background py-2.5 pl-9 pr-3 text-sm outline-none transition placeholder:text-muted-foreground focus-visible:ring-2 focus-visible:ring-ring"
              />
            </div>

            <select
              value={statusFilter}
              onChange={(event) =>
                handleStatusChange(event.target.value as VendorStatus | "all")
              }
              aria-label="Filter vendors by status"
              className="rounded-xl border border-border bg-background px-3 py-2.5 text-sm outline-none transition focus-visible:ring-2 focus-visible:ring-ring"
            >
              <option value="all">All statuses</option>
              <option value="active">Active</option>
              <option value="inactive">Inactive</option>
            </select>
          </div>
        </div>

        {queryError && !vendorsQuery.data && (
          <div className="m-5 rounded-xl border border-destructive/30 bg-destructive/5 p-4">
            <p className="text-sm font-medium text-destructive">
              Could not load vendors
            </p>
            <p className="mt-1 text-sm text-muted-foreground">{queryError}</p>
            <button
              type="button"
              onClick={() => vendorsQuery.refetch()}
              className="mt-3 rounded-lg border border-border px-3 py-2 text-sm font-medium transition hover:bg-muted"
            >
              Try again
            </button>
          </div>
        )}

        {queryError && vendorsQuery.data && (
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
            <p className="text-sm text-muted-foreground">Loading vendors...</p>
          </div>
        ) : !queryError || vendorsQuery.data ? (
          vendors.length === 0 ? (
            <div className="flex min-h-72 flex-col items-center justify-center px-5 py-12 text-center">
              <div className="flex size-14 items-center justify-center rounded-2xl border border-border bg-muted/50">
                {search || statusFilter !== "all" ? (
                  <Search className="size-6 text-muted-foreground" />
                ) : (
                  <Building2 className="size-6 text-muted-foreground" />
                )}
              </div>

              <h3 className="mt-4 font-semibold">
                {search || statusFilter !== "all"
                  ? "No matching vendors"
                  : "No vendors yet"}
              </h3>

              <p className="mt-2 max-w-sm text-sm leading-6 text-muted-foreground">
                {search || statusFilter !== "all"
                  ? "Try changing your search or status filter to find a vendor."
                  : "Add your first vendor to start organizing supplier information and provider relationships."}
              </p>

              {search || statusFilter !== "all" ? (
                <button
                  type="button"
                  onClick={() => {
                    setSearch("");
                    setStatusFilter("all");
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
                  Add your first vendor
                </button>
              )}
            </div>
          ) : (
            <>
              <div className="overflow-x-auto">
                <table className="w-full min-w-[850px] text-left text-sm">
                  <thead className="bg-muted/30 text-xs uppercase tracking-wide text-muted-foreground">
                    <tr>
                      <th className="px-5 py-3.5 font-medium">Vendor</th>
                      <th className="px-5 py-3.5 font-medium">Contact</th>
                      <th className="px-5 py-3.5 font-medium">Website</th>
                      <th className="px-5 py-3.5 font-medium">Applications</th>
                      <th className="px-5 py-3.5 font-medium">Status</th>
                      <th className="px-5 py-3.5 font-medium">Added</th>
                      <th className="px-5 py-3.5 text-right font-medium">
                        Actions
                      </th>
                    </tr>
                  </thead>

                  <tbody className="divide-y divide-border">
                    {vendors.map((vendor) => {
                      const website = vendor.website
                        ? getWebsiteUrl(vendor.website)
                        : null;

                      return (
                        <tr
                          key={vendor._id}
                          className="transition-colors hover:bg-muted/20"
                        >
                          <td className="px-5 py-4">
                            <div className="flex items-center gap-3">
                              <VendorInitial name={vendor.name} />
                              <div className="min-w-0">
                                <p className="max-w-52 truncate font-medium text-foreground">
                                  {vendor.name}
                                </p>
                                <p className="mt-1 text-xs text-muted-foreground">
                                  Updated {formatDate(vendor.updatedAt)}
                                </p>
                              </div>
                            </div>
                          </td>

                          <td className="px-5 py-4">
                            <div className="space-y-1.5">
                              {vendor.contactName && (
                                <p className="max-w-48 truncate font-medium">
                                  {vendor.contactName}
                                </p>
                              )}

                              {vendor.contactEmail ? (
                                <a
                                  href={`mailto:${vendor.contactEmail}`}
                                  className="inline-flex max-w-52 items-center gap-1.5 truncate text-muted-foreground transition hover:text-foreground"
                                >
                                  <Mail className="size-3.5 shrink-0" />
                                  <span className="truncate">
                                    {vendor.contactEmail}
                                  </span>
                                </a>
                              ) : vendor.phone ? (
                                <p className="text-muted-foreground">
                                  {vendor.phone}
                                </p>
                              ) : (
                                !vendor.contactName && (
                                  <span className="text-muted-foreground">
                                    No contact details
                                  </span>
                                )
                              )}

                              {vendor.contactEmail && vendor.phone && (
                                <p className="text-xs text-muted-foreground">
                                  {vendor.phone}
                                </p>
                              )}
                            </div>
                          </td>

                          <td className="px-5 py-4">
                            {website ? (
                              <a
                                href={website}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="inline-flex max-w-44 items-center gap-1.5 text-primary transition hover:underline"
                              >
                                <Globe className="size-3.5 shrink-0" />
                                <span className="truncate">
                                  {website
                                    .replace(/^https?:\/\//, "")
                                    .replace(/\/$/, "")}
                                </span>
                                <ExternalLink className="size-3 shrink-0" />
                              </a>
                            ) : (
                              <span className="text-muted-foreground">—</span>
                            )}
                          </td>

                          <td className="px-5 py-4">
                            <span className="inline-flex items-center gap-2 rounded-lg border border-border px-2.5 py-1.5 tabular-nums">
                              <Building2 className="size-3.5 text-muted-foreground" />
                              {vendor.applicationCount}
                            </span>
                          </td>

                          <td className="px-5 py-4">
                            <StatusBadge status={vendor.status} />
                          </td>

                          <td className="px-5 py-4 whitespace-nowrap text-muted-foreground">
                            {formatDate(vendor.createdAt)}
                          </td>

                          <td className="px-5 py-4">
                            <div className="flex items-center justify-end gap-1.5">
                              <button
                                type="button"
                                onClick={() => openEditForm(vendor)}
                                aria-label={`Edit ${vendor.name}`}
                                title="Edit vendor"
                                className="inline-flex size-9 items-center justify-center rounded-lg border border-transparent text-muted-foreground transition hover:border-border hover:bg-muted hover:text-foreground"
                              >
                                <Pencil className="size-4" />
                              </button>

                              <button
                                type="button"
                                onClick={() => setDeletingVendor(vendor)}
                                aria-label={`Delete ${vendor.name}`}
                                title="Delete vendor"
                                className="inline-flex size-9 items-center justify-center rounded-lg border border-transparent text-muted-foreground transition hover:border-destructive/20 hover:bg-destructive/10 hover:text-destructive"
                              >
                                <Trash2 className="size-4" />
                              </button>
                            </div>
                          </td>
                        </tr>
                      );
                    })}
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
                      vendors
                    </>
                  ) : (
                    "No vendors to display"
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
                        vendorsQuery.isFetching ||
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
                        vendorsQuery.isFetching
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

      {/* Create / Edit Vendor Modal */}
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
            aria-labelledby="vendor-form-modal-title"
            className="relative max-h-[90vh] w-full max-w-2xl overflow-y-auto rounded-2xl border border-border bg-background p-5 shadow-2xl sm:p-7"
          >
            <div className="mb-5 flex justify-end">
              <button
                type="button"
                onClick={closeForm}
                disabled={isSaving}
                aria-label="Close vendor form"
                className="inline-flex size-9 items-center justify-center rounded-lg text-muted-foreground transition hover:bg-muted hover:text-foreground disabled:opacity-50"
              >
                <X className="size-5" />
              </button>
            </div>

            <div id="vendor-form-modal-title" className="sr-only">
              {editingVendor ? "Edit vendor" : "Add a vendor"}
            </div>

            <VendorForm
              key={editingVendor?._id ?? "new-vendor"}
              vendor={editingVendor}
              isSaving={isSaving}
              errorMessage={formError}
              onSubmit={handleFormSubmit}
              onCancel={closeForm}
            />
          </div>
        </div>
      )}

      {/* Delete Vendor Dialog */}
      <DeleteVendorDialog
        vendor={deletingVendor}
        open={Boolean(deletingVendor)}
        onClose={() => setDeletingVendor(null)}
        onDeleted={(vendorName) => {
          setSuccessMessage(`"${vendorName}" was deleted successfully.`);
        }}
      />
    </div>
  );
}
