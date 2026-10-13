"use client";

import { useCallback, useEffect, useState, type FormEvent } from "react";
import { useOrganization } from "@/components/providers/organization-provider";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
type Role = "owner" | "admin" | "member" | "viewer";
type AccountStatus = "active" | "invited" | "suspended";

interface Profile {
  id: string;
  name: string;
  email: string;
  role: Role;
  status: AccountStatus;
  emailVerifiedAt: string | null;
  createdAt: string;
}

interface OrganizationSettings {
  id: string;
  name: string;
  slug: string;
  createdAt: string;
  updatedAt: string;
}

type CategoryStatus = "active" | "inactive";

interface Category {
  id: string;
  name: string;
  status: CategoryStatus;
  createdAt: string;
  updatedAt: string;
}

interface CategoriesApiResponse {
  success: boolean;
  message?: string;
  categories?: Category[];
  category?: Category;
  errors?: { message: string }[];
}

interface ApiResponse<T> {
  success: boolean;
  message?: string;
  data?: T;
  errors?: { field: string; message: string }[];
}

function formatDate(value: string) {
  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return "—";
  }

  return new Intl.DateTimeFormat("en", {
    year: "numeric",
    month: "long",
    day: "numeric",
  }).format(date);
}

function formatLabel(value: string) {
  return value.charAt(0).toUpperCase() + value.slice(1);
}

function getErrorMessage(error: unknown, fallback: string) {
  return error instanceof Error ? error.message : fallback;
}

export default function SettingsPage() {
  const { selectedOrganization } = useOrganization();
  const organizationId = selectedOrganization?.id;

  const [profile, setProfile] = useState<Profile | null>(null);
  const [profileName, setProfileName] = useState("");
  const [profileLoading, setProfileLoading] = useState(true);
  const [profileSaving, setProfileSaving] = useState(false);
  const [profileError, setProfileError] = useState("");
  const [profileSuccess, setProfileSuccess] = useState("");

  const [organization, setOrganization] = useState<OrganizationSettings | null>(
    null,
  );
  const [organizationName, setOrganizationName] = useState("");
  const [organizationLoading, setOrganizationLoading] = useState(true);
  const [organizationSaving, setOrganizationSaving] = useState(false);
  const [organizationError, setOrganizationError] = useState("");
  const [organizationSuccess, setOrganizationSuccess] = useState("");
  const [categories, setCategories] = useState<Category[]>([]);
  const [categoriesLoading, setCategoriesLoading] = useState(true);
  const [categorySaving, setCategorySaving] = useState(false);
  const [categoryError, setCategoryError] = useState("");
  const [categorySuccess, setCategorySuccess] = useState("");
  const [categoryName, setCategoryName] = useState("");
  const [editingCategoryId, setEditingCategoryId] = useState<string | null>(
    null,
  );
  const [categoryActionId, setCategoryActionId] = useState<string | null>(null);
  const [categoryStatusConfirmation, setCategoryStatusConfirmation] = useState<{
    category: Category;
    nextStatus: CategoryStatus;
  } | null>(null);
  const canManageOrganization =
    profile?.role === "owner" || profile?.role === "admin";

  const loadProfile = useCallback(async () => {
    await Promise.resolve();
    if (!organizationId) {
      setProfile(null);
      setProfileName("");
      setProfileLoading(false);
      return;
    }

    setProfileLoading(true);
    setProfileError("");
    setProfileSuccess("");

    try {
      const response = await fetch("/api/settings/profile", {
        method: "GET",
        credentials: "same-origin",
        headers: { "x-organization-id": organizationId },
        cache: "no-store",
      });

      const result = (await response.json()) as ApiResponse<Profile>;

      if (!response.ok || !result.success || !result.data) {
        throw new Error(result.message || "Unable to load your profile.");
      }

      setProfile(result.data);
      setProfileName(result.data.name);
    } catch (error) {
      setProfileError(
        getErrorMessage(
          error,
          "Something went wrong while loading your profile.",
        ),
      );
    } finally {
      setProfileLoading(false);
    }
  }, [organizationId]);

  const loadOrganization = useCallback(async () => {
    await Promise.resolve();
    if (!organizationId) {
      setOrganization(null);
      setOrganizationName("");
      setOrganizationLoading(false);
      return;
    }

    setOrganizationLoading(true);
    setOrganizationError("");
    setOrganizationSuccess("");

    try {
      const response = await fetch("/api/organizations/settings", {
        method: "GET",
        credentials: "same-origin",
        headers: { "x-organization-id": organizationId },
        cache: "no-store",
      });

      const result =
        (await response.json()) as ApiResponse<OrganizationSettings>;

      if (!response.ok || !result.success || !result.data) {
        throw new Error(
          result.message || "Unable to load organization settings.",
        );
      }

      setOrganization(result.data);
      setOrganizationName(result.data.name);
    } catch (error) {
      setOrganizationError(
        getErrorMessage(
          error,
          "Something went wrong while loading organization settings.",
        ),
      );
    } finally {
      setOrganizationLoading(false);
    }
  }, [organizationId]);
  const loadCategories = useCallback(async () => {
    if (!organizationId) {
      setCategories([]);
      setCategoriesLoading(false);
      return;
    }

    setCategoriesLoading(true);
    setCategoryError("");

    try {
      const response = await fetch("/api/categories?limit=100", {
        method: "GET",
        credentials: "same-origin",
        headers: { "x-organization-id": organizationId },
        cache: "no-store",
      });

      const result = (await response.json()) as CategoriesApiResponse;

      if (!response.ok || !result.success || !result.categories) {
        throw new Error(result.message || "Unable to load categories.");
      }

      setCategories(result.categories);
    } catch (error) {
      setCategoryError(
        getErrorMessage(
          error,
          "Something went wrong while loading categories.",
        ),
      );
    } finally {
      setCategoriesLoading(false);
    }
  }, [organizationId]);

  useEffect(() => {
    queueMicrotask(() => {
      void loadProfile();
      void loadOrganization();
      void loadCategories();
    });
  }, [loadProfile, loadOrganization, loadCategories]);

  async function handleProfileSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (!organizationId || !profile) return;

    const trimmedName = profileName.trim();

    if (trimmedName.length < 2 || trimmedName.length > 100) {
      setProfileError("Your name must contain between 2 and 100 characters.");
      setProfileSuccess("");
      return;
    }

    if (trimmedName === profile.name) {
      setProfileError("");
      setProfileSuccess("Your profile is already up to date.");
      return;
    }

    setProfileSaving(true);
    setProfileError("");
    setProfileSuccess("");

    try {
      const response = await fetch("/api/settings/profile", {
        method: "PATCH",
        credentials: "same-origin",
        headers: {
          "Content-Type": "application/json",
          "x-organization-id": organizationId,
        },
        body: JSON.stringify({ name: trimmedName }),
      });

      const result = (await response.json()) as ApiResponse<Profile>;

      if (!response.ok || !result.success || !result.data) {
        const validationMessage = result.errors
          ?.map((item) => item.message)
          .join(" ");

        throw new Error(
          validationMessage ||
            result.message ||
            "Unable to update your profile.",
        );
      }

      setProfile(result.data);
      setProfileName(result.data.name);
      setProfileSuccess(result.message || "Profile updated successfully.");
    } catch (error) {
      setProfileError(
        getErrorMessage(
          error,
          "Something went wrong while saving your profile.",
        ),
      );
    } finally {
      setProfileSaving(false);
    }
  }

  async function handleOrganizationSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (!organizationId || !organization || !canManageOrganization) return;

    const trimmedName = organizationName.trim();

    if (trimmedName.length < 2 || trimmedName.length > 100) {
      setOrganizationError(
        "Organization name must contain between 2 and 100 characters.",
      );
      setOrganizationSuccess("");
      return;
    }

    if (trimmedName === organization.name) {
      setOrganizationError("");
      setOrganizationSuccess("Organization name is already up to date.");
      return;
    }

    setOrganizationSaving(true);
    setOrganizationError("");
    setOrganizationSuccess("");

    try {
      const response = await fetch("/api/organizations/settings", {
        method: "PATCH",
        credentials: "same-origin",
        headers: {
          "Content-Type": "application/json",
          "x-organization-id": organizationId,
        },
        body: JSON.stringify({ name: trimmedName }),
      });

      const result =
        (await response.json()) as ApiResponse<OrganizationSettings>;

      if (!response.ok || !result.success || !result.data) {
        const validationMessage = result.errors
          ?.map((item) => item.message)
          .join(" ");

        throw new Error(
          validationMessage ||
            result.message ||
            "Unable to update organization settings.",
        );
      }

      setOrganization(result.data);
      setOrganizationName(result.data.name);
      setOrganizationSuccess(
        result.message || "Organization name updated successfully.",
      );
    } catch (error) {
      setOrganizationError(
        getErrorMessage(
          error,
          "Something went wrong while saving organization settings.",
        ),
      );
    } finally {
      setOrganizationSaving(false);
    }
  }
  function resetCategoryForm() {
    setCategoryName("");
    setEditingCategoryId(null);
    setCategoryError("");
    setCategorySuccess("");
  }

  function handleEditCategory(category: Category) {
    setEditingCategoryId(category.id);
    setCategoryName(category.name);
    setCategoryError("");
    setCategorySuccess("");
  }

  async function handleCategorySubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (!organizationId || !canManageOrganization) return;

    const trimmedName = categoryName.trim();

    if (trimmedName.length < 2 || trimmedName.length > 100) {
      setCategoryError(
        "Category name must contain between 2 and 100 characters.",
      );
      setCategorySuccess("");
      return;
    }

    const existingCategory = categories.find(
      (category) =>
        category.name.trim().toLowerCase().replace(/\s+/g, " ") ===
          trimmedName.toLowerCase().replace(/\s+/g, " ") &&
        category.id !== editingCategoryId,
    );

    if (existingCategory) {
      setCategoryError("A category with this name already exists.");
      setCategorySuccess("");
      return;
    }

    setCategorySaving(true);
    setCategoryError("");
    setCategorySuccess("");

    try {
      const isEditing = Boolean(editingCategoryId);
      const response = await fetch(
        isEditing ? `/api/categories/${editingCategoryId}` : "/api/categories",
        {
          method: isEditing ? "PATCH" : "POST",
          credentials: "same-origin",
          headers: {
            "Content-Type": "application/json",
            "x-organization-id": organizationId,
          },
          body: JSON.stringify({ name: trimmedName }),
        },
      );

      const result = (await response.json()) as CategoriesApiResponse;

      if (!response.ok || !result.success || !result.category) {
        const validationMessage = result.errors
          ?.map((item) => item.message)
          .join(" ");

        throw new Error(
          validationMessage ||
            result.message ||
            `Unable to ${isEditing ? "update" : "create"} category.`,
        );
      }

      const savedCategory = result.category;

      setCategories((current) => {
        const exists = current.some((item) => item.id === savedCategory.id);

        if (exists) {
          return current.map((item) =>
            item.id === savedCategory.id ? savedCategory : item,
          );
        }

        return [savedCategory, ...current];
      });

      resetCategoryForm();
      setCategorySuccess(
        result.message ||
          `Category ${isEditing ? "updated" : "created"} successfully.`,
      );
    } catch (error) {
      setCategoryError(
        getErrorMessage(
          error,
          "Something went wrong while saving the category.",
        ),
      );
    } finally {
      setCategorySaving(false);
    }
  }

  function handleToggleCategoryStatus(category: Category) {
    if (!organizationId || !canManageOrganization) return;

    const nextStatus: CategoryStatus =
      category.status === "active" ? "inactive" : "active";

    setCategoryError("");
    setCategorySuccess("");

    setCategoryStatusConfirmation({
      category,
      nextStatus,
    });
  }

  async function handleConfirmCategoryStatus() {
    if (
      !organizationId ||
      !canManageOrganization ||
      !categoryStatusConfirmation
    ) {
      return;
    }

    const { category, nextStatus } = categoryStatusConfirmation;

    setCategoryActionId(category.id);
    setCategoryError("");
    setCategorySuccess("");

    try {
      const response = await fetch(`/api/categories/${category.id}`, {
        method: "PATCH",
        credentials: "same-origin",
        headers: {
          "Content-Type": "application/json",
          "x-organization-id": organizationId,
        },
        body: JSON.stringify({ status: nextStatus }),
      });

      const result = (await response.json()) as CategoriesApiResponse;

      if (!response.ok || !result.success || !result.category) {
        throw new Error(result.message || "Unable to update category status.");
      }

      const updatedCategory = result.category;

      setCategories((current) =>
        current.map((item) =>
          item.id === updatedCategory.id ? updatedCategory : item,
        ),
      );

      if (editingCategoryId === updatedCategory.id) {
        resetCategoryForm();
      }

      setCategorySuccess(
        result.message ||
          `Category ${nextStatus === "active" ? "reactivated" : "deactivated"} successfully.`,
      );

      setCategoryStatusConfirmation(null);
    } catch (error) {
      setCategoryError(
        getErrorMessage(
          error,
          "Something went wrong while updating the category.",
        ),
      );
    } finally {
      setCategoryActionId(null);
    }
  }

  const profileHasChanges = Boolean(
    profile && profileName.trim() !== profile.name,
  );

  const organizationHasChanges = Boolean(
    organization && organizationName.trim() !== organization.name,
  );

  return (
    <div className="mx-auto w-full max-w-5xl space-y-8 pb-10">
      <header>
        <p className="text-sm font-medium text-primary">
          Workspace preferences
        </p>
        <h1 className="mt-2 text-3xl font-semibold tracking-tight">Settings</h1>
        <p className="mt-2 max-w-2xl text-sm leading-6 text-muted-foreground">
          Manage your personal profile and organization information.
        </p>
      </header>

      <div className="grid gap-6 lg:grid-cols-[220px_minmax(0,1fr)]">
        <aside>
          <div className="rounded-xl border border-border bg-card p-4">
            <p className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
              Settings
            </p>

            <a
              href="#profile-settings"
              className="mt-4 flex items-center gap-3 rounded-lg border border-primary/20 bg-primary/5 px-3 py-3"
            >
              <span className="flex size-9 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-sm font-semibold text-primary">
                P
              </span>
              <span className="min-w-0">
                <span className="block text-sm font-medium">Profile</span>
                <span className="block text-xs text-muted-foreground">
                  Personal information
                </span>
              </span>
            </a>

            <a
              href="#organization-settings"
              className="mt-2 flex items-center gap-3 rounded-lg px-3 py-3 transition hover:bg-muted"
            >
              <span className="flex size-9 shrink-0 items-center justify-center rounded-lg bg-muted text-sm font-semibold">
                O
              </span>
              <span className="min-w-0">
                <span className="block text-sm font-medium">Organization</span>
                <span className="block text-xs text-muted-foreground">
                  Workspace details
                </span>
              </span>
            </a>

            <a
              href="#category-settings"
              className="mt-2 flex items-center gap-3 rounded-lg px-3 py-3 transition hover:bg-muted"
            >
              <span className="flex size-9 shrink-0 items-center justify-center rounded-lg bg-muted text-sm font-semibold">
                C
              </span>
              <span className="min-w-0">
                <span className="block text-sm font-medium">Categories</span>
                <span className="block text-xs text-muted-foreground">
                  Manage application categories
                </span>
              </span>
            </a>
          </div>
        </aside>

        <div className="min-w-0 space-y-6">
          <section
            id="profile-settings"
            className="scroll-mt-6 overflow-hidden rounded-xl border border-border bg-card"
          >
            <div className="border-b border-border px-5 py-5 sm:px-6">
              <h2 className="text-lg font-semibold">Personal profile</h2>
              <p className="mt-1 text-sm text-muted-foreground">
                Update the name associated with your account.
              </p>
            </div>

            {profileLoading ? (
              <div className="space-y-5 p-5 sm:p-6">
                <div className="h-4 w-28 animate-pulse rounded bg-muted" />
                <div className="h-10 animate-pulse rounded-lg bg-muted" />
                <div className="h-4 w-36 animate-pulse rounded bg-muted" />
                <div className="h-10 animate-pulse rounded-lg bg-muted" />
              </div>
            ) : !organizationId ? (
              <p className="p-6 text-sm text-muted-foreground">
                Select a workspace to view your settings.
              </p>
            ) : !profile ? (
              <div className="p-6">
                <p role="alert" className="text-sm text-destructive">
                  {profileError || "Your profile could not be loaded."}
                </p>
                <button
                  type="button"
                  onClick={() => void loadProfile()}
                  className="mt-4 rounded-lg border border-border px-4 py-2 text-sm font-medium hover:bg-muted"
                >
                  Try again
                </button>
              </div>
            ) : (
              <form onSubmit={handleProfileSubmit}>
                <div className="space-y-5 p-5 sm:p-6">
                  {profileError && (
                    <p
                      role="alert"
                      className="rounded-lg border border-destructive/20 bg-destructive/5 px-4 py-3 text-sm text-destructive"
                    >
                      {profileError}
                    </p>
                  )}
                  {profileSuccess && (
                    <p
                      role="status"
                      className="rounded-lg border border-emerald-500/20 bg-emerald-500/5 px-4 py-3 text-sm text-emerald-600"
                    >
                      {profileSuccess}
                    </p>
                  )}

                  <div className="space-y-2">
                    <label
                      htmlFor="profile-name"
                      className="text-sm font-medium"
                    >
                      Full name
                    </label>
                    <input
                      id="profile-name"
                      type="text"
                      autoComplete="name"
                      minLength={2}
                      maxLength={100}
                      required
                      value={profileName}
                      onChange={(event) => {
                        setProfileName(event.target.value);
                        setProfileError("");
                        setProfileSuccess("");
                      }}
                      disabled={profileSaving}
                      className="w-full rounded-lg border border-border bg-background px-3.5 py-2.5 text-sm outline-none transition focus:border-primary focus:ring-2 focus:ring-primary/20 disabled:opacity-60"
                    />
                  </div>

                  <div className="space-y-2">
                    <label
                      htmlFor="profile-email"
                      className="text-sm font-medium"
                    >
                      Email address
                    </label>
                    <input
                      id="profile-email"
                      type="email"
                      value={profile.email}
                      readOnly
                      className="w-full cursor-not-allowed rounded-lg border border-border bg-muted/40 px-3.5 py-2.5 text-sm text-muted-foreground"
                    />
                    <p className="text-xs text-muted-foreground">
                      Email changes are not available here.
                    </p>
                  </div>

                  <div className="grid gap-5 sm:grid-cols-2">
                    <div className="space-y-2">
                      <label
                        htmlFor="profile-role"
                        className="text-sm font-medium"
                      >
                        Workspace role
                      </label>
                      <input
                        id="profile-role"
                        value={formatLabel(profile.role)}
                        readOnly
                        className="w-full cursor-not-allowed rounded-lg border border-border bg-muted/40 px-3.5 py-2.5 text-sm text-muted-foreground"
                      />
                    </div>
                    <div className="space-y-2">
                      <label
                        htmlFor="profile-status"
                        className="text-sm font-medium"
                      >
                        Account status
                      </label>
                      <input
                        id="profile-status"
                        value={formatLabel(profile.status)}
                        readOnly
                        className="w-full cursor-not-allowed rounded-lg border border-border bg-muted/40 px-3.5 py-2.5 text-sm text-muted-foreground"
                      />
                    </div>
                  </div>

                  <div className="rounded-lg border border-border bg-muted/20 p-4">
                    <p className="text-sm font-medium">Account information</p>
                    <div className="mt-3 flex flex-wrap justify-between gap-2 text-sm">
                      <span className="text-muted-foreground">
                        Member since
                      </span>
                      <span className="font-medium">
                        {formatDate(profile.createdAt)}
                      </span>
                    </div>
                    <div className="mt-3 flex flex-wrap justify-between gap-2 text-sm">
                      <span className="text-muted-foreground">
                        Email verification
                      </span>
                      <span className="font-medium">
                        {profile.emailVerifiedAt ? "Verified" : "Not verified"}
                      </span>
                    </div>
                  </div>
                </div>

                <div className="flex flex-col-reverse gap-3 border-t border-border bg-muted/10 px-5 py-4 sm:flex-row sm:items-center sm:justify-between sm:px-6">
                  <p className="text-xs text-muted-foreground">
                    Only your profile name can be changed here.
                  </p>
                  <button
                    type="submit"
                    disabled={profileSaving || !profileHasChanges}
                    className="inline-flex items-center justify-center rounded-lg bg-primary px-5 py-2.5 text-sm font-medium text-primary-foreground transition hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-50"
                  >
                    {profileSaving ? "Saving changes..." : "Save changes"}
                  </button>
                </div>
              </form>
            )}
          </section>

          <section
            id="organization-settings"
            className="scroll-mt-6 overflow-hidden rounded-xl border border-border bg-card"
          >
            <div className="border-b border-border px-5 py-5 sm:px-6">
              <h2 className="text-lg font-semibold">Organization settings</h2>
              <p className="mt-1 text-sm text-muted-foreground">
                Manage the name and view the identifier of your selected
                workspace.
              </p>
            </div>

            {organizationLoading ? (
              <div className="space-y-5 p-5 sm:p-6">
                <div className="h-4 w-36 animate-pulse rounded bg-muted" />
                <div className="h-10 animate-pulse rounded-lg bg-muted" />
                <div className="h-4 w-24 animate-pulse rounded bg-muted" />
                <div className="h-10 animate-pulse rounded-lg bg-muted" />
              </div>
            ) : !organizationId ? (
              <p className="p-6 text-sm text-muted-foreground">
                Select a workspace to view organization settings.
              </p>
            ) : !organization ? (
              <div className="p-6">
                <p role="alert" className="text-sm text-destructive">
                  {organizationError ||
                    "Organization settings could not be loaded."}
                </p>
                <button
                  type="button"
                  onClick={() => void loadOrganization()}
                  className="mt-4 rounded-lg border border-border px-4 py-2 text-sm font-medium hover:bg-muted"
                >
                  Try again
                </button>
              </div>
            ) : (
              <form onSubmit={handleOrganizationSubmit}>
                <div className="space-y-5 p-5 sm:p-6">
                  {organizationError && (
                    <p
                      role="alert"
                      className="rounded-lg border border-destructive/20 bg-destructive/5 px-4 py-3 text-sm text-destructive"
                    >
                      {organizationError}
                    </p>
                  )}
                  {organizationSuccess && (
                    <p
                      role="status"
                      className="rounded-lg border border-emerald-500/20 bg-emerald-500/5 px-4 py-3 text-sm text-emerald-600"
                    >
                      {organizationSuccess}
                    </p>
                  )}

                  <div className="space-y-2">
                    <label
                      htmlFor="organization-name"
                      className="text-sm font-medium"
                    >
                      Organization name
                    </label>
                    <input
                      id="organization-name"
                      type="text"
                      minLength={2}
                      maxLength={100}
                      required
                      value={organizationName}
                      onChange={(event) => {
                        setOrganizationName(event.target.value);
                        setOrganizationError("");
                        setOrganizationSuccess("");
                      }}
                      disabled={organizationSaving || !canManageOrganization}
                      readOnly={!canManageOrganization}
                      className="w-full rounded-lg border border-border bg-background px-3.5 py-2.5 text-sm outline-none transition focus:border-primary focus:ring-2 focus:ring-primary/20 read-only:cursor-not-allowed read-only:bg-muted/40 disabled:opacity-60"
                    />
                    {!canManageOrganization && (
                      <p className="text-xs text-muted-foreground">
                        Only organization Owners and Admins can rename this
                        workspace.
                      </p>
                    )}
                  </div>

                  <div className="space-y-2">
                    <label
                      htmlFor="organization-slug"
                      className="text-sm font-medium"
                    >
                      Organization slug
                    </label>
                    <input
                      id="organization-slug"
                      value={organization.slug}
                      readOnly
                      className="w-full cursor-not-allowed rounded-lg border border-border bg-muted/40 px-3.5 py-2.5 text-sm text-muted-foreground"
                    />
                    <p className="text-xs text-muted-foreground">
                      The slug is read-only and will not change when you rename
                      the organization.
                    </p>
                  </div>

                  <div className="rounded-lg border border-border bg-muted/20 p-4">
                    <p className="text-sm font-medium">
                      Organization information
                    </p>
                    <div className="mt-3 flex flex-wrap justify-between gap-2 text-sm">
                      <span className="text-muted-foreground">Created</span>
                      <span className="font-medium">
                        {formatDate(organization.createdAt)}
                      </span>
                    </div>
                    <div className="mt-3 flex flex-wrap justify-between gap-2 text-sm">
                      <span className="text-muted-foreground">
                        Last updated
                      </span>
                      <span className="font-medium">
                        {formatDate(organization.updatedAt)}
                      </span>
                    </div>
                  </div>
                </div>

                {canManageOrganization && (
                  <div className="flex flex-col-reverse gap-3 border-t border-border bg-muted/10 px-5 py-4 sm:flex-row sm:items-center sm:justify-between sm:px-6">
                    <p className="text-xs text-muted-foreground">
                      Changes apply to the selected workspace.
                    </p>
                    <button
                      type="submit"
                      disabled={organizationSaving || !organizationHasChanges}
                      className="inline-flex items-center justify-center rounded-lg bg-primary px-5 py-2.5 text-sm font-medium text-primary-foreground transition hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-50"
                    >
                      {organizationSaving
                        ? "Saving changes..."
                        : "Save organization"}
                    </button>
                  </div>
                )}
              </form>
            )}
          </section>
          <section
            id="category-settings"
            className="scroll-mt-6 overflow-hidden rounded-xl border border-border bg-card"
          >
            <div className="border-b border-border px-5 py-5 sm:px-6">
              <h2 className="text-lg font-semibold">Category Management</h2>
              <p className="mt-1 text-sm text-muted-foreground">
                Create and manage the categories used to organize your
                applications.
              </p>
            </div>

            <div className="space-y-5 p-5 sm:p-6">
              {categoryError && (
                <p
                  role="alert"
                  className="rounded-lg border border-destructive/20 bg-destructive/5 px-4 py-3 text-sm text-destructive"
                >
                  {categoryError}
                </p>
              )}

              {categorySuccess && (
                <p
                  role="status"
                  className="rounded-lg border border-emerald-500/20 bg-emerald-500/5 px-4 py-3 text-sm text-emerald-600"
                >
                  {categorySuccess}
                </p>
              )}

              {canManageOrganization ? (
                <form onSubmit={handleCategorySubmit} className="space-y-3">
                  <div className="space-y-2">
                    <label
                      htmlFor="category-name"
                      className="text-sm font-medium"
                    >
                      Category name
                    </label>
                    <input
                      id="category-name"
                      type="text"
                      minLength={2}
                      maxLength={100}
                      required
                      value={categoryName}
                      onChange={(event) => {
                        setCategoryName(event.target.value);
                        setCategoryError("");
                        setCategorySuccess("");
                      }}
                      disabled={categorySaving}
                      placeholder="e.g. Project Management"
                      className="w-full rounded-lg border border-border bg-background px-3.5 py-2.5 text-sm outline-none transition focus:border-primary focus:ring-2 focus:ring-primary/20 disabled:opacity-60"
                    />
                  </div>

                  <div className="flex flex-wrap gap-3">
                    <button
                      type="submit"
                      disabled={categorySaving || !organizationId}
                      className="inline-flex items-center justify-center rounded-lg bg-primary px-5 py-2.5 text-sm font-medium text-primary-foreground transition hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-50"
                    >
                      {categorySaving
                        ? "Saving..."
                        : editingCategoryId
                          ? "Save changes"
                          : "Create category"}
                    </button>

                    {editingCategoryId && (
                      <button
                        type="button"
                        onClick={resetCategoryForm}
                        disabled={categorySaving}
                        className="rounded-lg border border-border px-5 py-2.5 text-sm font-medium transition hover:bg-muted disabled:opacity-50"
                      >
                        Cancel edit
                      </button>
                    )}
                  </div>
                </form>
              ) : (
                <p className="text-sm text-muted-foreground">
                  Only organization Owners and Admins can create, edit, or
                  change category status.
                </p>
              )}

              <div className="border-t border-border pt-5">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <h3 className="text-sm font-semibold">Existing categories</h3>
                  <button
                    type="button"
                    onClick={() => void loadCategories()}
                    disabled={categoriesLoading}
                    className="rounded-lg border border-border px-3 py-2 text-xs font-medium transition hover:bg-muted disabled:cursor-not-allowed disabled:opacity-50"
                  >
                    {categoriesLoading ? "Refreshing..." : "Refresh"}
                  </button>
                </div>

                {categoriesLoading ? (
                  <div className="mt-4 space-y-3">
                    <div className="h-14 animate-pulse rounded-lg bg-muted" />
                    <div className="h-14 animate-pulse rounded-lg bg-muted" />
                  </div>
                ) : !organizationId ? (
                  <p className="mt-4 text-sm text-muted-foreground">
                    Select a workspace to manage categories.
                  </p>
                ) : categories.length === 0 ? (
                  <div className="mt-4 rounded-lg border border-dashed border-border px-4 py-8 text-center">
                    <p className="text-sm font-medium">No categories yet</p>
                    <p className="mt-1 text-sm text-muted-foreground">
                      Create your first category to organize applications.
                    </p>
                  </div>
                ) : (
                  <div className="mt-4 space-y-3">
                    {categories.map((category) => {
                      const isActionPending = categoryActionId === category.id;

                      return (
                        <div
                          key={category.id}
                          className="flex flex-col gap-4 rounded-lg border border-border p-4 sm:flex-row sm:items-center sm:justify-between"
                        >
                          <div className="min-w-0">
                            <p className="wrap-break-word text-sm font-medium">
                              {category.name}
                            </p>
                            <div className="mt-2 flex flex-wrap items-center gap-2">
                              <span
                                className={`inline-flex rounded-full px-2.5 py-1 text-xs font-medium ${
                                  category.status === "active"
                                    ? "bg-emerald-500/10 text-emerald-600"
                                    : "bg-muted text-muted-foreground"
                                }`}
                              >
                                {formatLabel(category.status)}
                              </span>
                              <span className="text-xs text-muted-foreground">
                                Created {formatDate(category.createdAt)}
                              </span>
                            </div>
                          </div>

                          {canManageOrganization && (
                            <div className="flex shrink-0 flex-wrap gap-2">
                              <button
                                type="button"
                                onClick={() => handleEditCategory(category)}
                                disabled={categorySaving || isActionPending}
                                className="rounded-lg border border-border px-3 py-2 text-xs font-medium transition hover:bg-muted disabled:cursor-not-allowed disabled:opacity-50"
                              >
                                Edit
                              </button>
                              <button
                                type="button"
                                onClick={() =>
                                  void handleToggleCategoryStatus(category)
                                }
                                disabled={categorySaving || isActionPending}
                                className="rounded-lg border border-border px-3 py-2 text-xs font-medium transition hover:bg-muted disabled:cursor-not-allowed disabled:opacity-50"
                              >
                                {isActionPending
                                  ? "Updating..."
                                  : category.status === "active"
                                    ? "Deactivate"
                                    : "Reactivate"}
                              </button>
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            </div>
          </section>

          <section className="rounded-xl border border-border bg-card p-5 sm:p-6">
            <h2 className="text-base font-semibold">Security</h2>
            <p className="mt-1 text-sm leading-6 text-muted-foreground">
              Password changes and active-session management are not included in
              this section yet.
            </p>
          </section>
        </div>
      </div>

      <Dialog
        open={Boolean(categoryStatusConfirmation)}
        onOpenChange={(open) => {
          if (!open && categoryActionId === null) {
            setCategoryStatusConfirmation(null);
          }
        }}
      >
        <DialogContent
          className="sm:max-w-md"
          onEscapeKeyDown={(event) => {
            if (categoryActionId !== null) {
              event.preventDefault();
            }
          }}
          onInteractOutside={(event) => {
            if (categoryActionId !== null) {
              event.preventDefault();
            }
          }}
        >
          <DialogHeader>
            <DialogTitle>
              {categoryStatusConfirmation?.nextStatus === "inactive"
                ? "Deactivate category?"
                : "Reactivate category?"}
            </DialogTitle>

            <DialogDescription>
              {categoryStatusConfirmation?.nextStatus === "inactive"
                ? `Are you sure you want to deactivate "${categoryStatusConfirmation.category.name}"?`
                : `Are you sure you want to reactivate "${categoryStatusConfirmation?.category.name}"?`}
            </DialogDescription>
          </DialogHeader>

          {categoryStatusConfirmation && (
            <div className="rounded-lg border border-border bg-muted/30 p-4">
              <p className="text-sm font-medium">
                {categoryStatusConfirmation.category.name}
              </p>

              <p className="mt-2 text-sm leading-6 text-muted-foreground">
                {categoryStatusConfirmation.nextStatus === "inactive"
                  ? "Existing applications will not be deleted. This category will no longer be available for new assignments."
                  : "This category will become available for new application assignments again."}
              </p>
            </div>
          )}

          {categoryError && categoryStatusConfirmation && (
            <p
              role="alert"
              className="rounded-lg border border-destructive/20 bg-destructive/5 px-3 py-2.5 text-sm text-destructive"
            >
              {categoryError}
            </p>
          )}

          <DialogFooter>
            <button
              type="button"
              onClick={() => setCategoryStatusConfirmation(null)}
              disabled={categoryActionId !== null}
              className="rounded-lg border border-border px-4 py-2.5 text-sm font-medium transition hover:bg-muted disabled:cursor-not-allowed disabled:opacity-50"
            >
              Cancel
            </button>

            <button
              type="button"
              onClick={() => void handleConfirmCategoryStatus()}
              disabled={
                categoryActionId !== null || !categoryStatusConfirmation
              }
              className={`rounded-lg px-4 py-2.5 text-sm font-medium transition disabled:cursor-not-allowed disabled:opacity-50 ${
                categoryStatusConfirmation?.nextStatus === "inactive"
                  ? "bg-destructive text-destructive-foreground hover:opacity-90"
                  : "bg-primary text-primary-foreground hover:opacity-90"
              }`}
            >
              {categoryActionId !== null
                ? "Updating..."
                : categoryStatusConfirmation?.nextStatus === "inactive"
                  ? "Deactivate category"
                  : "Reactivate category"}
            </button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
