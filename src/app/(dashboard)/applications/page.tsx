"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { type SubmitEvent, useState } from "react";
import {
  ArrowLeft,
  ArrowRight,
  Boxes,
  CheckCircle2,
  CircleAlert,
  ExternalLink,
  Filter,
  Layers3,
  LoaderCircle,
  MonitorCog,
  Pencil,
  Plus,
  Search,
  Trash2,
  X,
} from "lucide-react";

import {
  useApplications,
  useCreateApplication,
  useUpdateApplication,
  useDeleteApplication,
  type ApplicationItem,
  type ApplicationStatus,
  type CreateApplicationInput,
} from "@/hooks/useApplications";
import { useVendors } from "@/hooks/useVendors";
import { useCategories } from "@/hooks/useCategories";

const PAGE_SIZE = 10;

const emptyForm = {
  name: "",
  vendorId: "",
  category: "",
  description: "",
  website: "",
  owner: "",
  usersCount: "0",
  status: "active" as ApplicationStatus,
};

const inputClass =
  "w-full rounded-xl border border-[#E9D9DF] bg-white px-3.5 py-2.5 text-sm text-[#4C1D3D] outline-none transition placeholder:text-[#A58A96] focus:border-[#DC586D] focus:ring-4 focus:ring-[#DC586D]/10 disabled:cursor-not-allowed disabled:bg-[#FBF7F8] disabled:opacity-70";

const buttonClass =
  "inline-flex min-h-10 items-center justify-center gap-2 rounded-xl bg-[#852E4E] px-4 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:bg-[#6E2745] hover:shadow-md focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#DC586D] focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50";

const secondaryButtonClass =
  "inline-flex min-h-10 items-center justify-center gap-2 rounded-xl border border-[#E9D9DF] bg-white px-4 py-2.5 text-sm font-medium text-[#6E4055] transition hover:bg-[#FFF5F7] hover:border-[#DC586D]/40 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#DC586D] focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50";

function StatusBadge({ status }: { status: ApplicationStatus }) {
  const styles: Record<ApplicationStatus, string> = {
    active: "border-[#B9E4CD] bg-[#EAF8F0] text-[#246B49]",
    inactive: "border-[#F2D5A3] bg-[#FFF6E5] text-[#93601B]",
    archived: "border-[#E8DCE2] bg-[#F5F0F3] text-[#765D6A]",
  };

  const labels: Record<ApplicationStatus, string> = {
    active: "Active",
    inactive: "Inactive",
    archived: "Archived",
  };

  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-xs font-semibold ${styles[status]}`}
    >
      <span
        aria-hidden="true"
        className={`size-1.5 rounded-full ${
          status === "active"
            ? "bg-[#399568]"
            : status === "inactive"
              ? "bg-[#C58B2B]"
              : "bg-[#927887]"
        }`}
      />
      {labels[status]}
    </span>
  );
}

export default function ApplicationsPage() {
  const router = useRouter();
  const searchParams = useSearchParams();

  const page = Math.max(1, Number(searchParams.get("page")) || 1);
  const search = searchParams.get("search") ?? "";
  const statusParam = searchParams.get("status") ?? "";

  const status: ApplicationStatus | "" =
    statusParam === "active" ||
    statusParam === "inactive" ||
    statusParam === "archived"
      ? statusParam
      : "";

  const [showForm, setShowForm] = useState(false);
  const [editingApplication, setEditingApplication] =
    useState<ApplicationItem | null>(null);
  const [deletingApplication, setDeletingApplication] =
    useState<ApplicationItem | null>(null);

  const [successMessage, setSuccessMessage] = useState("");
  const [name, setName] = useState(emptyForm.name);
  const [vendorId, setVendorId] = useState(emptyForm.vendorId);
  const [category, setCategory] = useState(emptyForm.category);
  const [description, setDescription] = useState(emptyForm.description);
  const [website, setWebsite] = useState(emptyForm.website);
  const [owner, setOwner] = useState(emptyForm.owner);
  const [usersCount, setUsersCount] = useState(emptyForm.usersCount);
  const [formStatus, setFormStatus] = useState<ApplicationStatus>(
    emptyForm.status,
  );

  const vendorsQuery = useVendors({
    page: 1,
    limit: 100,
    status: "active",
  });

  const vendors = vendorsQuery.data?.vendors ?? [];

  const categoriesQuery = useCategories({
    page: 1,
    limit: 100,
  });

  const categories = categoriesQuery.data?.categories ?? [];

  const activeCategories = categories.filter(
    (item) => item.status === "active",
  );

  const selectedCategoryExists = categories.some(
    (item) => item.name === category,
  );

  const selectedCategoryIsActive = activeCategories.some(
    (item) => item.name === category,
  );

  function updateFilters(updates: Record<string, string>) {
    const params = new URLSearchParams(searchParams.toString());

    for (const [key, value] of Object.entries(updates)) {
      if (value) {
        params.set(key, value);
      } else {
        params.delete(key);
      }
    }

    const query = params.toString();
    router.replace(query ? `?${query}` : "?", { scroll: false });
  }

  const applicationsQuery = useApplications({
    page,
    limit: PAGE_SIZE,
    search,
    ...(status ? { status } : {}),
  });

  const createApplication = useCreateApplication();
  const updateApplication = useUpdateApplication();
  const deleteApplication = useDeleteApplication();

  const applications = applicationsQuery.data?.applications ?? [];
  const total = applicationsQuery.data?.pagination.total ?? 0;
  const totalPages = Math.max(
    1,
    applicationsQuery.data?.pagination.totalPages ?? 1,
  );

  function resetForm() {
    setName(emptyForm.name);
    setVendorId(emptyForm.vendorId);
    setCategory(emptyForm.category);
    setDescription(emptyForm.description);
    setWebsite(emptyForm.website);
    setOwner(emptyForm.owner);
    setUsersCount(emptyForm.usersCount);
    setFormStatus(emptyForm.status);
  }

  function closeForm() {
    setShowForm(false);
    setEditingApplication(null);
    resetForm();
  }

  function startEditing(application: ApplicationItem) {
    setEditingApplication(application);
    setName(application.name);
    setVendorId(application.vendorId ?? "");
    setCategory(application.category);
    setDescription(application.description ?? "");
    setWebsite(application.website ?? "");
    setOwner(application.owner ?? "");
    setUsersCount(String(application.usersCount ?? 0));
    setFormStatus(application.status);
    setShowForm(true);
    setSuccessMessage("");
  }

  function startCreating() {
    setEditingApplication(null);
    resetForm();
    setShowForm(true);
    setSuccessMessage("");
  }

  async function handleSubmitApplication(event: SubmitEvent<HTMLFormElement>) {
    event.preventDefault();
    setSuccessMessage("");

    const input: CreateApplicationInput = {
      name: name.trim(),
      vendorId,
      category: category.trim(),
      ...(description.trim() ? { description: description.trim() } : {}),
      ...(website.trim() ? { website: website.trim() } : {}),
      ...(owner.trim() ? { owner: owner.trim() } : {}),
      usersCount: Number(usersCount),
      status: formStatus,
    };

    try {
      if (editingApplication) {
        await updateApplication.mutateAsync({
          id: editingApplication._id,
          input,
        });

        setSuccessMessage("Application updated successfully.");
      } else {
        await createApplication.mutateAsync(input);
        setSuccessMessage("Application created successfully.");
        updateFilters({ page: "1" });
      }

      closeForm();
    } catch {
      // The mutation error is displayed inside the form.
    }
  }

  async function handleDeleteApplication() {
    if (!deletingApplication) return;

    setSuccessMessage("");

    try {
      await deleteApplication.mutateAsync(deletingApplication._id);

      const deletedName = deletingApplication.name;
      setDeletingApplication(null);
      setSuccessMessage(`"${deletedName}" was deleted successfully.`);

      const remainingOnPage = applications.length - 1;

      if (remainingOnPage <= 0 && page > 1) {
        updateFilters({ page: String(page - 1) });
      }
    } catch {
      // The delete error is displayed in the confirmation dialog.
    }
  }

  const isSaving = createApplication.isPending || updateApplication.isPending;

  return (
    <div className="mx-auto w-full max-w-[1600px] space-y-7 pb-8">
      {/* Page heading */}
      <header className="relative isolate  overflow-hidden rounded-3xl border border-[#DC586D]/15 bg-[#FBE7EC] px-5 py-7 shadow-sm sm:px-8 sm:py-8">
        <div className="flex flex-col gap-5  sm:flex-row sm:items-center sm:justify-between">
          <div className="min-w-0">
            <div className="mb-3 inline-flex items-center gap-2 rounded-full border border-[#DC586D]/20 bg-white/75 px-3 py-1.5 text-xs font-semibold text-[#852E4E] shadow-sm">
              <Boxes className="size-3.5" aria-hidden="true" />
              SaaS inventory
            </div>

            <h1 className="text-2xl font-semibold tracking-tight text-[#4C1D3D] sm:text-3xl">
              Applications
            </h1>
            <p className="mt-2 max-w-2xl text-sm leading-6 text-[#852E4E]/80 sm:text-base">
              Manage the software applications used by your organization,
              including vendors, categories, ownership, and status.
            </p>
          </div>

          <button
            type="button"
            onClick={() => (showForm ? closeForm() : startCreating())}
            className={buttonClass}
          >
            {showForm ? (
              <>
                <X className="size-4" aria-hidden="true" />
                Close form
              </>
            ) : (
              <>
                <Plus className="size-4" aria-hidden="true" />
                Add application
              </>
            )}
          </button>
        </div>

        <div className="mt-7 grid grid-cols-2 gap-3 border-t border-[#DC586D]/15 pt-5 sm:grid-cols-3">
          <div className="rounded-2xl border border-white/80 bg-white/65 p-3.5 shadow-sm sm:p-4">
            <div className="flex items-center gap-2 text-xs font-medium text-[#852E4E]/75">
              <Layers3 className="size-4" aria-hidden="true" />
              Total applications
            </div>
            <p className="mt-2 text-2xl font-semibold tabular-nums text-[#4C1D3D]">
              {total.toLocaleString()}
            </p>
          </div>

          <div className="rounded-2xl border border-white/80 bg-white/65 p-3.5 shadow-sm sm:p-4">
            <div className="flex items-center gap-2 text-xs font-medium text-[#852E4E]/75">
              <Filter className="size-4" aria-hidden="true" />
              Current status filter
            </div>
            <p className="mt-2 truncate text-lg font-semibold text-[#4C1D3D]">
              {status
                ? status.charAt(0).toUpperCase() + status.slice(1)
                : "All statuses"}
            </p>
          </div>

          <div className="col-span-2 hidden rounded-2xl border border-white/80 bg-white/65 p-4 shadow-sm sm:col-span-1 sm:block">
            <div className="flex items-center gap-2 text-xs font-medium text-[#852E4E]/75">
              <MonitorCog className="size-4" aria-hidden="true" />
              Current page
            </div>
            <p className="mt-2 text-2xl font-semibold tabular-nums text-[#4C1D3D]">
              {page}{" "}
              <span className="text-sm font-medium text-[#852E4E]/60">
                / {totalPages}
              </span>
            </p>
          </div>
        </div>
      </header>

      {/* Mutation feedback */}
      {successMessage && (
        <div
          role="status"
          className="flex items-start gap-3 rounded-2xl border border-[#B9E4CD] bg-[#EAF8F0] px-4 py-3.5 text-sm text-[#246B49]"
        >
          <CheckCircle2 className="mt-0.5 size-5 shrink-0" aria-hidden="true" />
          <p className="flex-1 leading-6">{successMessage}</p>
          <button
            type="button"
            aria-label="Dismiss success message"
            onClick={() => setSuccessMessage("")}
            className="rounded-lg p-1 transition hover:bg-[#246B49]/10"
          >
            <X className="size-4" aria-hidden="true" />
          </button>
        </div>
      )}

      {/* Application form */}
      {showForm && (
        <form
          onSubmit={handleSubmitApplication}
          className="overflow-hidden rounded-3xl border border-[#E9D9DF] bg-white shadow-sm"
        >
          <div className="flex items-start gap-3 border-b border-[#E9D9DF] bg-gradient-to-r from-[#FFF5EF] to-[#FFF9FB] px-5 py-5 sm:px-7">
            <div className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-[#DC586D]/10 text-[#A33757]">
              {editingApplication ? (
                <Pencil className="size-5" aria-hidden="true" />
              ) : (
                <Plus className="size-5" aria-hidden="true" />
              )}
            </div>
            <div className="min-w-0 flex-1">
              <h2 className="text-lg font-semibold tracking-tight text-[#4C1D3D]">
                {editingApplication ? "Edit application" : "Add an application"}
              </h2>
              <p className="mt-1 text-sm leading-5 text-[#852E4E]/70">
                {editingApplication
                  ? "Update the application details below."
                  : "Add the details needed to track this software in your inventory."}
              </p>
            </div>
            <button
              type="button"
              aria-label="Close application form"
              onClick={closeForm}
              className="rounded-xl p-2 text-[#852E4E]/70 transition hover:bg-[#DC586D]/10 hover:text-[#852E4E]"
            >
              <X className="size-4" aria-hidden="true" />
            </button>
          </div>

          <div className="space-y-7 p-5 sm:p-7">
            <section>
              <h3 className="mb-4 text-xs font-semibold uppercase tracking-[0.14em] text-[#A33757]">
                Application details
              </h3>

              <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
                <label className="space-y-2 text-sm font-medium text-[#4C1D3D]">
                  <span>
                    Application name <span className="text-[#DC586D]">*</span>
                  </span>
                  <input
                    required
                    minLength={2}
                    maxLength={150}
                    value={name}
                    onChange={(event) => setName(event.target.value)}
                    className={inputClass}
                    placeholder="e.g. Slack"
                  />
                </label>

                <label className="space-y-2 text-sm font-medium text-[#4C1D3D]">
                  <span>
                    Vendor <span className="text-[#DC586D]">*</span>
                  </span>
                  <select
                    required
                    value={vendorId}
                    onChange={(event) => setVendorId(event.target.value)}
                    disabled={vendorsQuery.isPending || vendorsQuery.isError}
                    className={inputClass}
                  >
                    <option value="">
                      {vendorsQuery.isPending
                        ? "Loading vendors..."
                        : vendorsQuery.isError
                          ? "Unable to load vendors"
                          : vendors.length === 0
                            ? "No active vendors available"
                            : "Select a vendor"}
                    </option>
                    {vendors.map((vendor) => (
                      <option key={vendor._id} value={vendor._id}>
                        {vendor.name}
                      </option>
                    ))}
                  </select>
                  {!vendorsQuery.isPending &&
                    !vendorsQuery.isError &&
                    vendors.length === 0 && (
                      <span className="block text-xs font-normal leading-5 text-[#927887]">
                        Create a vendor in the Vendors section before adding an
                        application.
                      </span>
                    )}
                  {vendorsQuery.isError && (
                    <span
                      role="alert"
                      className="block text-xs font-normal text-red-700"
                    >
                      Failed to load vendors. Please refresh and try again.
                    </span>
                  )}
                </label>

                <label className="space-y-2 text-sm font-medium text-[#4C1D3D]">
                  <span>
                    Category <span className="text-[#DC586D]">*</span>
                  </span>
                  <select
                    required
                    value={category}
                    onChange={(event) => setCategory(event.target.value)}
                    disabled={
                      categoriesQuery.isPending || categoriesQuery.isError
                    }
                    className={inputClass}
                  >
                    <option value="">
                      {categoriesQuery.isPending
                        ? "Loading categories..."
                        : categoriesQuery.isError
                          ? "Unable to load categories"
                          : activeCategories.length === 0
                            ? "No active categories available"
                            : "Select a category"}
                    </option>
                    {activeCategories.map((item) => (
                      <option key={item.id} value={item.name}>
                        {item.name}
                      </option>
                    ))}
                    {editingApplication &&
                      category &&
                      !selectedCategoryIsActive && (
                        <option value={category}>
                          {category}
                          {selectedCategoryExists
                            ? " (inactive)"
                            : " (current category)"}
                        </option>
                      )}
                  </select>
                  {!categoriesQuery.isPending &&
                    !categoriesQuery.isError &&
                    activeCategories.length === 0 && (
                      <span className="block text-xs font-normal leading-5 text-[#927887]">
                        Create or activate a category in Settings before adding
                        an application.
                      </span>
                    )}
                  {categoriesQuery.isError && (
                    <span
                      role="alert"
                      className="block text-xs font-normal text-red-700"
                    >
                      Failed to load categories.{" "}
                      <button
                        type="button"
                        onClick={() => void categoriesQuery.refetch()}
                        className="underline underline-offset-2"
                      >
                        Retry
                      </button>
                    </span>
                  )}
                </label>

                <label className="space-y-2 text-sm font-medium text-[#4C1D3D]">
                  Owner
                  <input
                    maxLength={150}
                    value={owner}
                    onChange={(event) => setOwner(event.target.value)}
                    className={inputClass}
                    placeholder="Application owner"
                  />
                </label>

                <label className="space-y-2 text-sm font-medium text-[#4C1D3D]">
                  Number of users
                  <input
                    type="number"
                    min={0}
                    step={1}
                    required
                    value={usersCount}
                    onChange={(event) => setUsersCount(event.target.value)}
                    className={inputClass}
                  />
                </label>

                <label className="space-y-2 text-sm font-medium text-[#4C1D3D]">
                  Status
                  <select
                    value={formStatus}
                    onChange={(event) =>
                      setFormStatus(event.target.value as ApplicationStatus)
                    }
                    className={inputClass}
                  >
                    <option value="active">Active</option>
                    <option value="inactive">Inactive</option>
                    <option value="archived">Archived</option>
                  </select>
                </label>
              </div>
            </section>

            <section className="border-t border-[#F0E5E9] pt-6">
              <h3 className="mb-4 text-xs font-semibold uppercase tracking-[0.14em] text-[#A33757]">
                Additional information
              </h3>
              <div className="grid gap-5">
                <label className="space-y-2 text-sm font-medium text-[#4C1D3D]">
                  Website
                  <input
                    type="url"
                    maxLength={500}
                    value={website}
                    onChange={(event) => setWebsite(event.target.value)}
                    className={inputClass}
                    placeholder="https://example.com"
                  />
                </label>

                <label className="space-y-2 text-sm font-medium text-[#4C1D3D]">
                  Description
                  <textarea
                    maxLength={1000}
                    rows={3}
                    value={description}
                    onChange={(event) => setDescription(event.target.value)}
                    className={`${inputClass} min-h-24 resize-y`}
                    placeholder="What is this application used for?"
                  />
                </label>
              </div>
            </section>

            {(createApplication.isError || updateApplication.isError) && (
              <div
                role="alert"
                className="flex items-start gap-2.5 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800"
              >
                <CircleAlert
                  className="mt-0.5 size-4 shrink-0"
                  aria-hidden="true"
                />
                <p>
                  {(editingApplication
                    ? updateApplication.error
                    : createApplication.error) instanceof Error
                    ? (editingApplication
                        ? updateApplication.error
                        : createApplication.error
                      )?.message
                    : "Unable to save the application. Please try again."}
                </p>
              </div>
            )}

            <div className="flex flex-col-reverse gap-3 border-t border-[#F0E5E9] pt-5 sm:flex-row sm:justify-end">
              <button
                type="button"
                onClick={closeForm}
                className={secondaryButtonClass}
              >
                Cancel
              </button>
              <button type="submit" disabled={isSaving} className={buttonClass}>
                {isSaving ? (
                  <LoaderCircle
                    className="size-4 animate-spin"
                    aria-hidden="true"
                  />
                ) : (
                  <CheckCircle2 className="size-4" aria-hidden="true" />
                )}
                {isSaving
                  ? "Saving..."
                  : editingApplication
                    ? "Save changes"
                    : "Create application"}
              </button>
            </div>
          </div>
        </form>
      )}

      {/* Search and filters */}
      <section className="rounded-2xl border border-[#E9D9DF] bg-white p-4 shadow-sm sm:p-5">
        <div className="mb-4 flex items-center gap-2">
          <div className="flex size-9 items-center justify-center rounded-xl bg-[#DC586D]/10 text-[#A33757]">
            <Filter className="size-4" aria-hidden="true" />
          </div>
          <div>
            <h2 className="text-sm font-semibold text-[#4C1D3D]">
              Find applications
            </h2>
            <p className="text-xs text-[#927887]">
              Search your inventory or filter by status.
            </p>
          </div>
        </div>

        <div className="flex flex-col gap-3 sm:flex-row">
          <div className="relative min-w-0 flex-1">
            <Search
              className="pointer-events-none absolute left-3.5 top-1/2 size-4 -translate-y-1/2 text-[#A58A96]"
              aria-hidden="true"
            />
            <input
              type="search"
              value={search}
              onChange={(event) =>
                updateFilters({ search: event.target.value, page: "1" })
              }
              placeholder="Search applications or vendors..."
              className={`${inputClass} pl-10`}
              aria-label="Search applications"
            />
          </div>

          <label className="relative sm:w-56">
            <span className="sr-only">Filter by status</span>
            <select
              value={status}
              onChange={(event) =>
                updateFilters({ status: event.target.value, page: "1" })
              }
              className={inputClass}
              aria-label="Filter by status"
            >
              <option value="">All statuses</option>
              <option value="active">Active</option>
              <option value="inactive">Inactive</option>
              <option value="archived">Archived</option>
            </select>
          </label>
        </div>
      </section>

      {/* Application table */}
      <section className="overflow-hidden rounded-3xl border border-[#E9D9DF] bg-white shadow-sm">
        <div className="flex flex-col gap-3 border-b border-[#F0E5E9] bg-gradient-to-r from-white to-[#FFF8F9] px-5 py-5 sm:flex-row sm:items-center sm:justify-between sm:px-6">
          <div className="flex items-center gap-3">
            <div className="flex size-10 items-center justify-center rounded-xl bg-[#852E4E]/[0.07] text-[#852E4E]">
              <Boxes className="size-5" aria-hidden="true" />
            </div>
            <div>
              <h2 className="font-semibold tracking-tight text-[#4C1D3D]">
                Application inventory
              </h2>
              <p className="mt-0.5 text-xs text-[#927887]">
                Manage your organization&apos;s software records.
              </p>
            </div>
          </div>

          <span className="inline-flex w-fit items-center rounded-full border border-[#E9D9DF] bg-white px-3 py-1.5 text-xs font-semibold tabular-nums text-[#852E4E]">
            {total.toLocaleString()}{" "}
            {total === 1 ? "application" : "applications"}
          </span>
        </div>

        {applicationsQuery.isPending ? (
          <div className="flex min-h-56 flex-col items-center justify-center gap-3 p-8 text-center">
            <LoaderCircle
              className="size-7 animate-spin text-[#DC586D]"
              aria-hidden="true"
            />
            <p className="text-sm text-[#927887]">Loading applications...</p>
          </div>
        ) : applicationsQuery.isError ? (
          <div className="flex min-h-56 flex-col items-center justify-center p-8 text-center">
            <div className="flex size-12 items-center justify-center rounded-2xl bg-red-50 text-red-600">
              <CircleAlert className="size-6" aria-hidden="true" />
            </div>
            <p role="alert" className="mt-3 text-sm text-red-700">
              {applicationsQuery.error instanceof Error
                ? applicationsQuery.error.message
                : "Unable to load applications."}
            </p>
            <button
              type="button"
              onClick={() => applicationsQuery.refetch()}
              className={`${secondaryButtonClass} mt-4`}
            >
              Try again
            </button>
          </div>
        ) : applications.length === 0 ? (
          <div className="flex min-h-64 flex-col items-center justify-center px-6 py-12 text-center">
            <div className="flex size-14 items-center justify-center rounded-2xl bg-gradient-to-br from-[#FFF1E8] to-[#FBE7EC] text-[#A33757]">
              <Boxes className="size-7" aria-hidden="true" />
            </div>
            <h3 className="mt-4 font-semibold text-[#4C1D3D]">
              No applications found
            </h3>
            <p className="mt-2 max-w-sm text-sm leading-6 text-[#927887]">
              There are no applications matching your current search or filters.
              Try changing your criteria or add a new application.
            </p>
            <button
              type="button"
              onClick={() => (showForm ? closeForm() : startCreating())}
              className={`${buttonClass} mt-5`}
            >
              <Plus className="size-4" aria-hidden="true" />
              Add application
            </button>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[850px] text-left text-sm">
              <thead className="bg-[#FCF7F9] text-[11px] uppercase tracking-[0.12em] text-[#927887]">
                <tr>
                  <th scope="col" className="px-6 py-4 font-semibold">
                    Application
                  </th>
                  <th scope="col" className="px-5 py-4 font-semibold">
                    Vendor
                  </th>
                  <th scope="col" className="px-5 py-4 font-semibold">
                    Category
                  </th>
                  <th
                    scope="col"
                    className="px-5 py-4 text-right font-semibold"
                  >
                    Users
                  </th>
                  <th scope="col" className="px-5 py-4 font-semibold">
                    Status
                  </th>
                  <th
                    scope="col"
                    className="px-6 py-4 text-right font-semibold"
                  >
                    Actions
                  </th>
                </tr>
              </thead>

              <tbody className="divide-y divide-[#F0E5E9]">
                {applications.map((application) => (
                  <tr
                    key={application._id}
                    className="transition-colors duration-150 hover:bg-[#FFF9FA]"
                  >
                    <td className="px-6 py-4">
                      <div className="flex min-w-0 items-center gap-3">
                        <div className="flex size-10 shrink-0 items-center justify-center rounded-xl border border-[#E9D9DF] bg-gradient-to-br from-[#FFF1E8] to-[#FBE7EC] text-[#852E4E]">
                          <MonitorCog className="size-5" aria-hidden="true" />
                        </div>
                        <div className="min-w-0">
                          <p className="truncate font-semibold text-[#4C1D3D]">
                            {application.name}
                          </p>
                          {application.owner && (
                            <p className="mt-1 truncate text-xs text-[#927887]">
                              Owner: {application.owner}
                            </p>
                          )}
                          {application.website && (
                            <a
                              href={application.website}
                              target="_blank"
                              rel="noreferrer"
                              className="mt-1 inline-flex max-w-full items-center gap-1 truncate text-xs text-[#A33757] hover:underline"
                            >
                              <ExternalLink
                                className="size-3 shrink-0"
                                aria-hidden="true"
                              />
                              <span className="truncate">
                                {application.website}
                              </span>
                            </a>
                          )}
                        </div>
                      </div>
                    </td>

                    <td className="px-5 py-4 font-medium text-[#6E4055]">
                      {application.vendor}
                    </td>

                    <td className="px-5 py-4">
                      <span className="inline-flex max-w-40 items-center rounded-lg border border-[#E9D9DF] bg-[#FCF7F9] px-2.5 py-1.5 text-xs font-medium text-[#6E4055]">
                        <span className="truncate">{application.category}</span>
                      </span>
                    </td>

                    <td className="px-5 py-4 text-right font-semibold tabular-nums text-[#4C1D3D]">
                      {application.usersCount.toLocaleString()}
                    </td>

                    <td className="px-5 py-4">
                      <StatusBadge status={application.status} />
                    </td>

                    <td className="px-6 py-4">
                      <div className="flex justify-end gap-2">
                        <button
                          type="button"
                          onClick={() => startEditing(application)}
                          aria-label={`Edit ${application.name}`}
                          title="Edit application"
                          className="inline-flex size-9 items-center justify-center rounded-xl border border-[#E9D9DF] bg-white text-[#852E4E] transition hover:border-[#DC586D]/40 hover:bg-[#FFF1F4] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#DC586D]"
                        >
                          <Pencil className="size-4" aria-hidden="true" />
                        </button>
                        <button
                          type="button"
                          onClick={() => {
                            setDeletingApplication(application);
                            setSuccessMessage("");
                          }}
                          aria-label={`Delete ${application.name}`}
                          title="Delete application"
                          className="inline-flex size-9 items-center justify-center rounded-xl border border-red-200 bg-white text-red-600 transition hover:border-red-300 hover:bg-red-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-red-400"
                        >
                          <Trash2 className="size-4" aria-hidden="true" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {!applicationsQuery.isError && totalPages > 1 && (
          <div className="flex flex-col gap-3 border-t border-[#F0E5E9] bg-[#FFFCFD] px-5 py-4 sm:flex-row sm:items-center sm:justify-between sm:px-6">
            <p className="text-sm text-[#927887]">
              Page <span className="font-semibold text-[#4C1D3D]">{page}</span>{" "}
              of{" "}
              <span className="font-semibold text-[#4C1D3D]">{totalPages}</span>
              <span className="mx-2 text-[#D9C6CF]">·</span>
              {total.toLocaleString()} total
            </p>
            <div className="flex gap-2">
              <button
                type="button"
                disabled={page <= 1 || applicationsQuery.isFetching}
                onClick={() =>
                  updateFilters({ page: String(Math.max(1, page - 1)) })
                }
                className={secondaryButtonClass}
              >
                <ArrowLeft className="size-4" aria-hidden="true" />
                Previous
              </button>
              <button
                type="button"
                disabled={page >= totalPages || applicationsQuery.isFetching}
                onClick={() =>
                  updateFilters({
                    page: String(Math.min(totalPages, page + 1)),
                  })
                }
                className={secondaryButtonClass}
              >
                Next
                <ArrowRight className="size-4" aria-hidden="true" />
              </button>
            </div>
          </div>
        )}
      </section>

      {/* Delete confirmation */}
      {deletingApplication && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-[#281321]/50 p-4 backdrop-blur-sm"
          onClick={() => {
            if (!deleteApplication.isPending) {
              setDeletingApplication(null);
            }
          }}
        >
          <div
            role="alertdialog"
            aria-modal="true"
            aria-labelledby="delete-application-title"
            aria-describedby="delete-application-description"
            className="w-full max-w-md overflow-hidden rounded-3xl border border-[#E9D9DF] bg-white shadow-2xl"
            onClick={(event) => event.stopPropagation()}
          >
            <div className="p-6 sm:p-7">
              <div className="flex size-12 items-center justify-center rounded-2xl bg-red-50 text-red-600">
                <Trash2 className="size-5" aria-hidden="true" />
              </div>
              <h2
                id="delete-application-title"
                className="mt-5 text-lg font-semibold tracking-tight text-[#4C1D3D]"
              >
                Delete application?
              </h2>
              <p
                id="delete-application-description"
                className="mt-2 text-sm leading-6 text-[#806778]"
              >
                You&apos;re about to permanently delete{" "}
                <span className="font-semibold text-[#4C1D3D]">
                  {deletingApplication.name}
                </span>
                . This action cannot be undone.
              </p>

              {deleteApplication.isError && (
                <div
                  role="alert"
                  className="mt-4 flex items-start gap-2 rounded-xl border border-red-200 bg-red-50 px-3.5 py-3 text-sm text-red-800"
                >
                  <CircleAlert
                    className="mt-0.5 size-4 shrink-0"
                    aria-hidden="true"
                  />
                  <p>
                    {deleteApplication.error instanceof Error
                      ? deleteApplication.error.message
                      : "Unable to delete the application. Please try again."}
                  </p>
                </div>
              )}
            </div>

            <div className="flex flex-col-reverse gap-3 border-t border-[#F0E5E9] bg-[#FFFCFD] px-6 py-4 sm:flex-row sm:justify-end sm:px-7">
              <button
                type="button"
                disabled={deleteApplication.isPending}
                onClick={() => setDeletingApplication(null)}
                className={secondaryButtonClass}
              >
                Cancel
              </button>
              <button
                type="button"
                disabled={deleteApplication.isPending}
                onClick={handleDeleteApplication}
                className="inline-flex min-h-10 items-center justify-center gap-2 rounded-xl bg-[#6e2745] px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-[#5e233b] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-red-400 focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
              >
                {deleteApplication.isPending ? (
                  <LoaderCircle
                    className="size-4 animate-spin"
                    aria-hidden="true"
                  />
                ) : (
                  <Trash2 className="size-4" aria-hidden="true" />
                )}
                {deleteApplication.isPending
                  ? "Deleting..."
                  : "Delete application"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
