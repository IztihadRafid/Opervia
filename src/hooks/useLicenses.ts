"use client";
import {
  keepPreviousData,
  useMutation,
  useQuery,
  useQueryClient,
} from "@tanstack/react-query";
import { useOrganization } from "@/components/providers/organization-provider";
import { apiClient } from "@/lib/api-client";
import { queryKeys } from "@/lib/query-keys";

export type LicenseType =
  | "named_user"
  | "concurrent"
  | "site"
  | "device"
  | "subscription"
  | "perpetual";

export type LicenseStatus = "active" | "expired" | "suspended" | "cancelled";

export interface LicenseItem {
  id: string;
  organizationId: string;
  applicationId: string;
  name: string;
  licenseType: LicenseType;
  totalSeats: number;
  usedSeats: number;
  availableSeats: number;
  status: LicenseStatus;
  startDate: string;
  expiryDate: string | null;
  notes: string;
  createdAt: string;
  updatedAt: string;
}

export interface LicensesFilters {
  page?: number;
  limit?: number;
  search?: string;
  status?: LicenseStatus;
  applicationId?: string;
}

export interface LicensesResponse {
  success: boolean;
  licenses: LicenseItem[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

export interface CreateLicenseInput {
  applicationId: string;
  name: string;
  licenseType: LicenseType;
  totalSeats: number;
  usedSeats?: number;
  status?: LicenseStatus;
  startDate: string;
  expiryDate?: string;
  notes?: string;
}

export type UpdateLicenseInput = Omit<
  Partial<CreateLicenseInput>,
  "expiryDate" | "notes"
> & {
  expiryDate?: string | null;
  notes?: string | null;
};

interface LicenseResponse {
  success: boolean;
  license: LicenseItem;
  message?: string;
}

interface DeleteLicenseResponse {
  success: boolean;
  message?: string;
}

interface LicenseQueryResponse {
  success: boolean;
  license: LicenseItem;
}

interface UpdateLicenseVariables {
  id: string;
  input: UpdateLicenseInput;
}

const DEFAULT_PAGE_SIZE = 25;

const licenseKeys = {
  all: (organizationId?: string) =>
    ["licenses", organizationId ?? "no-organization-selected"] as const,

  list: (organizationId: string | undefined, filters: LicensesFilters) =>
    [
      "licenses",
      organizationId ?? "no-organization-selected",
      "list",
      filters,
    ] as const,

  detail: (organizationId: string | undefined, id: string) =>
    [
      "licenses",
      organizationId ?? "no-organization-selected",
      "detail",
      id,
    ] as const,
};

async function fetchLicenses(
  filters: LicensesFilters,
): Promise<LicensesResponse> {
  const params = new URLSearchParams();

  params.set("page", String(filters.page ?? 1));
  params.set("limit", String(filters.limit ?? DEFAULT_PAGE_SIZE));

  if (filters.search?.trim()) {
    params.set("search", filters.search.trim());
  }

  if (filters.status) {
    params.set("status", filters.status);
  }

  if (filters.applicationId) {
    params.set("applicationId", filters.applicationId);
  }

  return apiClient<LicensesResponse>(`/api/licenses?${params.toString()}`);
}

async function fetchLicense(id: string): Promise<LicenseQueryResponse> {
  return apiClient<LicenseQueryResponse>(
    `/api/licenses/${encodeURIComponent(id)}`,
  );
}

export function useLicenses(filters: LicensesFilters = {}) {
  const { selectedOrganization } = useOrganization();
  const organizationId = selectedOrganization?.id;

  return useQuery({
    queryKey: licenseKeys.list(organizationId, filters),
    queryFn: () => fetchLicenses(filters),
    enabled: Boolean(organizationId),
    staleTime: 30 * 1000,
    gcTime: 5 * 60 * 1000,
    placeholderData: keepPreviousData,
  });
}

export function useLicense(id: string) {
  const { selectedOrganization } = useOrganization();
  const organizationId = selectedOrganization?.id;

  return useQuery({
    queryKey: licenseKeys.detail(organizationId, id),
    queryFn: () => fetchLicense(id),
    enabled: Boolean(organizationId && id),
    staleTime: 30 * 1000,
    gcTime: 5 * 60 * 1000,
  });
}

export function useCreateLicense() {
  const queryClient = useQueryClient();
  const { selectedOrganization } = useOrganization();
  const organizationId = selectedOrganization?.id;

  return useMutation({
    mutationFn: (input: CreateLicenseInput) =>
      apiClient<LicenseResponse>("/api/licenses", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(input),
      }),

    onSuccess: async () => {
      await Promise.all([
        queryClient.invalidateQueries({
          queryKey: licenseKeys.all(organizationId),
        }),
        queryClient.invalidateQueries({
          queryKey: queryKeys.applications.all,
        }),
        queryClient.invalidateQueries({
          queryKey: ["dashboard"],
        }),
      ]);
    },
  });
}

export function useUpdateLicense() {
  const queryClient = useQueryClient();
  const { selectedOrganization } = useOrganization();
  const organizationId = selectedOrganization?.id;

  return useMutation({
    mutationFn: ({ id, input }: UpdateLicenseVariables) =>
      apiClient<LicenseResponse>(`/api/licenses/${encodeURIComponent(id)}`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(input),
      }),

    onSuccess: async (result) => {
      await Promise.all([
        queryClient.invalidateQueries({
          queryKey: licenseKeys.all(organizationId),
        }),
        queryClient.invalidateQueries({
          queryKey: licenseKeys.detail(organizationId, result.license.id),
        }),
        queryClient.invalidateQueries({
          queryKey: queryKeys.applications.all,
        }),
        queryClient.invalidateQueries({
          queryKey: ["dashboard"],
        }),
      ]);
    },
  });
}

export function useDeleteLicense() {
  const queryClient = useQueryClient();
  const { selectedOrganization } = useOrganization();
  const organizationId = selectedOrganization?.id;

  return useMutation({
    mutationFn: (id: string) =>
      apiClient<DeleteLicenseResponse>(
        `/api/licenses/${encodeURIComponent(id)}`,
        {
          method: "DELETE",
        },
      ),

    onSuccess: async (_result, id) => {
      await Promise.all([
        queryClient.invalidateQueries({
          queryKey: licenseKeys.all(organizationId),
        }),
        queryClient.removeQueries({
          queryKey: licenseKeys.detail(organizationId, id),
        }),
        queryClient.invalidateQueries({
          queryKey: queryKeys.applications.all,
        }),
        queryClient.invalidateQueries({
          queryKey: ["dashboard"],
        }),
      ]);
    },
  });
}
