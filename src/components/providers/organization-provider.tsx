"use client";
import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useState,
} from "react";

const ORGANIZATION_STORAGE_KEY = "opervia-organization-id";

export type OrganizationOption = {
  id: string;
  name: string;
  slug: string;
  role: "owner" | "admin" | "member" | "viewer";
};

type OrganizationContextValue = {
  organizations: OrganizationOption[];
  selectedOrganization: OrganizationOption | null;
  isLoading: boolean;
  error: string | null;
  selectOrganization: (organizationId: string) => void;
};

const OrganizationContext = createContext<OrganizationContextValue | null>(
  null,
);

export function OrganizationProvider({
  children,
}: {
  children: React.ReactNode;
}) {
  const [organizations, setOrganizations] = useState<OrganizationOption[]>([]);
  const [selectedOrganization, setSelectedOrganization] =
    useState<OrganizationOption | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;

    async function loadOrganizations() {
      try {
        const response = await fetch("/api/organizations");
        const result = await response.json();

        if (!response.ok) {
          throw new Error(result?.message ?? "Failed to load organizations.");
        }

        const availableOrganizations: OrganizationOption[] =
          result.organizations ?? [];

        if (cancelled) return;

        setOrganizations(availableOrganizations);

        const savedId = window.localStorage.getItem(ORGANIZATION_STORAGE_KEY);

        const savedOrganization = availableOrganizations.find(
          (organization) => organization.id === savedId,
        );

        const nextOrganization =
          savedOrganization ?? availableOrganizations[0] ?? null;

        if (nextOrganization) {
          const selectionChanged = savedId !== nextOrganization.id;

          window.localStorage.setItem(
            ORGANIZATION_STORAGE_KEY,
            nextOrganization.id,
          );

          setSelectedOrganization(nextOrganization);

          if (selectionChanged) {
            window.location.reload();
            return;
          }
        } else {
          window.localStorage.removeItem(ORGANIZATION_STORAGE_KEY);
          setSelectedOrganization(null);
        }
      } catch (loadError) {
        if (!cancelled) {
          setError(
            loadError instanceof Error
              ? loadError.message
              : "Failed to load organizations.",
          );
        }
      } finally {
        if (!cancelled) {
          setIsLoading(false);
        }
      }
    }

    void loadOrganizations();

    return () => {
      cancelled = true;
    };
  }, []);

  const selectOrganization = useCallback(
    (organizationId: string) => {
      const organization = organizations.find(
        (item) => item.id === organizationId,
      );

      if (!organization || organization.id === selectedOrganization?.id) {
        return;
      }

      window.localStorage.setItem(ORGANIZATION_STORAGE_KEY, organization.id);

      window.location.reload();
    },
    [organizations, selectedOrganization],
  );

  return (
    <OrganizationContext.Provider
      value={{
        organizations,
        selectedOrganization,
        isLoading,
        error,
        selectOrganization,
      }}
    >
      {children}
    </OrganizationContext.Provider>
  );
}

export function useOrganization() {
  const context = useContext(OrganizationContext);

  if (!context) {
    throw new Error(
      "useOrganization must be used within OrganizationProvider.",
    );
  }

  return context;
}
