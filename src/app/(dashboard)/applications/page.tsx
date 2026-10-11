"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { useState } from "react";
import {
  useApplications,
  useCreateApplication,
  useUpdateApplication,
  useDeleteApplication,
  type ApplicationItem,
  type ApplicationStatus,
  type CreateApplicationInput,
} from "@/hooks/useApplications";

const PAGE_SIZE = 10;

const emptyForm = {
  name: "",
  vendor: "",
  category: "",
  description: "",
  website: "",
  owner: "",
  usersCount: "0",
  status: "active" as ApplicationStatus,
};

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
  const [vendor, setVendor] = useState(emptyForm.vendor);
  const [category, setCategory] = useState(emptyForm.category);
  const [description, setDescription] = useState(emptyForm.description);
  const [website, setWebsite] = useState(emptyForm.website);
  const [owner, setOwner] = useState(emptyForm.owner);
  const [usersCount, setUsersCount] = useState(emptyForm.usersCount);
  const [formStatus, setFormStatus] = useState<ApplicationStatus>(
    emptyForm.status,
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
    setVendor(emptyForm.vendor);
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
    setVendor(application.vendor);
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

  async function handleSubmitApplication(
    event: React.FormEvent<HTMLFormElement>,
  ) {
    event.preventDefault();
    setSuccessMessage("");

    const input: CreateApplicationInput = {
      name: name.trim(),
      vendor: vendor.trim(),
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

      // Return to the previous page if the current page became empty.
      const remainingOnPage = applications.length - 1;

      if (remainingOnPage <= 0 && page > 1) {
        updateFilters({ page: String(page - 1) });
      }
    } catch {
      // The delete error is displayed in the confirmation dialog.
    }
  }

  const inputClass =
    "w-full rounded-md border border-input bg-background px-3 py-2.5 text-sm text-foreground outline-none transition placeholder:text-muted-foreground focus-visible:ring-2 focus-visible:ring-ring";

  const buttonClass =
    "rounded-md bg-primary px-4 py-2.5 text-sm font-medium text-primary-foreground transition hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-50";

  const isSaving = createApplication.isPending || updateApplication.isPending;

  return (
    <div className="space-y-8">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-3xl font-semibold tracking-tight">
            Applications
          </h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Manage the software applications used by your organization.
          </p>
        </div>

        <button
          type="button"
          onClick={() => (showForm ? closeForm() : startCreating())}
          className={buttonClass}
        >
          {showForm ? "Cancel" : "+ Add application"}
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

      {showForm && (
        <form
          onSubmit={handleSubmitApplication}
          className="space-y-5 rounded-xl border bg-card p-6"
        >
          <div>
            <h2 className="text-lg font-semibold">
              {editingApplication ? "Edit application" : "Add an application"}
            </h2>
            <p className="mt-1 text-sm text-muted-foreground">
              {editingApplication
                ? "Update the application details below."
                : "Enter the application details below."}
            </p>
          </div>

          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            <label className="space-y-1.5 text-sm font-medium">
              Application name *
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

            <label className="space-y-1.5 text-sm font-medium">
              Vendor *
              <input
                required
                minLength={2}
                maxLength={150}
                value={vendor}
                onChange={(event) => setVendor(event.target.value)}
                className={inputClass}
                placeholder="e.g. Salesforce"
              />
            </label>

            <label className="space-y-1.5 text-sm font-medium">
              Category *
              <input
                required
                minLength={2}
                maxLength={100}
                value={category}
                onChange={(event) => setCategory(event.target.value)}
                className={inputClass}
                placeholder="e.g. Communication"
              />
            </label>

            <label className="space-y-1.5 text-sm font-medium">
              Owner
              <input
                maxLength={150}
                value={owner}
                onChange={(event) => setOwner(event.target.value)}
                className={inputClass}
                placeholder="Application owner"
              />
            </label>

            <label className="space-y-1.5 text-sm font-medium">
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

            <label className="space-y-1.5 text-sm font-medium">
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

            <label className="space-y-1.5 text-sm font-medium sm:col-span-2 lg:col-span-3">
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

            <label className="space-y-1.5 text-sm font-medium sm:col-span-2 lg:col-span-3">
              Description
              <textarea
                maxLength={1000}
                rows={3}
                value={description}
                onChange={(event) => setDescription(event.target.value)}
                className={inputClass}
                placeholder="What is this application used for?"
              />
            </label>
          </div>

          {(createApplication.isError || updateApplication.isError) && (
            <p role="alert" className="text-sm text-destructive">
              {(editingApplication
                ? updateApplication.error
                : createApplication.error) instanceof Error
                ? (editingApplication
                    ? updateApplication.error
                    : createApplication.error
                  )?.message
                : "Unable to save the application. Please try again."}
            </p>
          )}

          <div className="flex justify-end gap-2">
            <button
              type="button"
              onClick={closeForm}
              className="rounded-md border px-4 py-2.5 text-sm transition-colors hover:bg-muted"
            >
              Cancel
            </button>
            <button type="submit" disabled={isSaving} className={buttonClass}>
              {isSaving
                ? "Saving..."
                : editingApplication
                  ? "Save changes"
                  : "Create application"}
            </button>
          </div>
        </form>
      )}

      <div className="flex flex-col gap-3 sm:flex-row">
        <input
          type="search"
          value={search}
          onChange={(event) =>
            updateFilters({ search: event.target.value, page: "1" })
          }
          placeholder="Search applications or vendors..."
          className={`${inputClass} sm:max-w-sm`}
          aria-label="Search applications"
        />

        <select
          value={status}
          onChange={(event) =>
            updateFilters({ status: event.target.value, page: "1" })
          }
          className={`${inputClass} sm:w-48`}
          aria-label="Filter by status"
        >
          <option value="">All statuses</option>
          <option value="active">Active</option>
          <option value="inactive">Inactive</option>
          <option value="archived">Archived</option>
        </select>
      </div>

      <div className="overflow-hidden rounded-xl border bg-card">
        <div className="flex items-center justify-between border-b px-5 py-4">
          <h2 className="font-semibold">All applications</h2>
          <span className="text-sm text-muted-foreground">
            {total} {total === 1 ? "application" : "applications"}
          </span>
        </div>

        {applicationsQuery.isPending ? (
          <div className="p-8 text-center text-sm text-muted-foreground">
            Loading applications...
          </div>
        ) : applicationsQuery.isError ? (
          <div className="p-8 text-center">
            <p role="alert" className="text-sm text-destructive">
              {applicationsQuery.error instanceof Error
                ? applicationsQuery.error.message
                : "Unable to load applications."}
            </p>
            <button
              type="button"
              onClick={() => applicationsQuery.refetch()}
              className="mt-3 text-sm text-primary underline"
            >
              Try again
            </button>
          </div>
        ) : applications.length === 0 ? (
          <div className="p-10 text-center">
            <h3 className="font-medium">No applications found</h3>
            <p className="mt-2 text-sm text-muted-foreground">
              Add an application or change your search and filters.
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[850px] text-left text-sm">
              <thead className="bg-muted/50 text-xs uppercase tracking-wide text-muted-foreground">
                <tr>
                  <th className="px-5 py-3 font-medium">Application</th>
                  <th className="px-5 py-3 font-medium">Vendor</th>
                  <th className="px-5 py-3 font-medium">Category</th>
                  <th className="px-5 py-3 font-medium">Users</th>
                  <th className="px-5 py-3 font-medium">Status</th>
                  <th className="px-5 py-3 text-right font-medium">Actions</th>
                </tr>
              </thead>

              <tbody className="divide-y divide-border">
                {applications.map((application) => (
                  <tr
                    key={application._id}
                    className="transition-colors hover:bg-muted/50"
                  >
                    <td className="px-5 py-4">
                      <div className="font-medium">{application.name}</div>
                      {application.owner && (
                        <div className="mt-1 text-xs text-muted-foreground">
                          Owner: {application.owner}
                        </div>
                      )}
                    </td>
                    <td className="px-5 py-4">{application.vendor}</td>
                    <td className="px-5 py-4">{application.category}</td>
                    <td className="px-5 py-4">{application.usersCount}</td>
                    <td className="px-5 py-4">
                      <span
                        className={`inline-flex rounded-full px-2.5 py-1 text-xs font-medium ${
                          application.status === "active"
                            ? "bg-green-500/10 text-green-700 dark:text-green-400"
                            : application.status === "inactive"
                              ? "bg-yellow-500/10 text-yellow-700 dark:text-yellow-400"
                              : "bg-muted text-muted-foreground"
                        }`}
                      >
                        {application.status.charAt(0).toUpperCase() +
                          application.status.slice(1)}
                      </span>
                    </td>
                    <td className="px-5 py-4">
                      <div className="flex justify-end gap-2">
                        <button
                          type="button"
                          onClick={() => startEditing(application)}
                          className="rounded-md border px-3 py-1.5 text-sm transition-colors hover:bg-muted"
                        >
                          Edit
                        </button>
                        <button
                          type="button"
                          onClick={() => {
                            setDeletingApplication(application);
                            setSuccessMessage("");
                          }}
                          className="rounded-md border border-destructive/30 px-3 py-1.5 text-sm text-destructive transition-colors hover:bg-destructive/10"
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
        )}

        {!applicationsQuery.isError && totalPages > 1 && (
          <div className="flex flex-col gap-3 border-t px-5 py-4 sm:flex-row sm:items-center sm:justify-between">
            <p className="text-sm text-muted-foreground">
              Page {page} of {totalPages}
            </p>
            <div className="flex gap-2">
              <button
                type="button"
                disabled={page <= 1 || applicationsQuery.isFetching}
                onClick={() =>
                  updateFilters({ page: String(Math.max(1, page - 1)) })
                }
                className="rounded-md border px-3 py-2 text-sm transition-colors hover:bg-muted disabled:cursor-not-allowed disabled:opacity-40"
              >
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
                className="rounded-md border px-3 py-2 text-sm transition-colors hover:bg-muted disabled:cursor-not-allowed disabled:opacity-40"
              >
                Next
              </button>
            </div>
          </div>
        )}
      </div>

      {deletingApplication && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4"
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
            className="w-full max-w-md space-y-4 rounded-xl border bg-card p-6 shadow-xl"
            onClick={(event) => event.stopPropagation()}
          >
            <div>
              <h2
                id="delete-application-title"
                className="text-lg font-semibold"
              >
                Delete application?
              </h2>
              <p
                id="delete-application-description"
                className="mt-2 text-sm text-muted-foreground"
              >
                This will permanently delete{" "}
                <span className="font-medium text-foreground">
                  {deletingApplication.name}
                </span>
                . This action cannot be undone.
              </p>
            </div>

            {deleteApplication.isError && (
              <p role="alert" className="text-sm text-destructive">
                {deleteApplication.error instanceof Error
                  ? deleteApplication.error.message
                  : "Unable to delete the application. Please try again."}
              </p>
            )}

            <div className="flex justify-end gap-2">
              <button
                type="button"
                disabled={deleteApplication.isPending}
                onClick={() => setDeletingApplication(null)}
                className="rounded-md border px-4 py-2.5 text-sm transition-colors hover:bg-muted disabled:opacity-50"
              >
                Cancel
              </button>
              <button
                type="button"
                disabled={deleteApplication.isPending}
                onClick={handleDeleteApplication}
                className="rounded-md bg-destructive px-4 py-2.5 text-sm font-medium text-destructive-foreground transition-opacity hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-50"
              >
                {deleteApplication.isPending ? "Deleting..." : "Delete"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
