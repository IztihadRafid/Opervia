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

export type VendorStatus = "active" | "inactive";

export interface VendorItem {
  _id: string;
  organizationId: string;
  name: string;
  website?: string;
  contactName?: string;
  contactEmail?: string;
  phone?: string;
  notes?: string;
  status: VendorStatus;
  applicationCount: number;
  createdAt: string;
  updatedAt: string;
}

export interface VendorsFilters {
  page?: number;
  limit?: number;
  search?: string;
  status?: VendorStatus;
}

export interface VendorsResponse {
  success: boolean;
  vendors: VendorItem[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

export interface CreateVendorInput {
  name: string;
  website?: string;
  contactName?: string;
  contactEmail?: string;
  phone?: string;
  notes?: string;
  status?: VendorStatus;
}

export type UpdateVendorInput = Partial<CreateVendorInput>;

interface VendorResponse {
  success: boolean;
  vendor: VendorItem;
  message?: string;
}

interface DeleteVendorResponse {
  success: boolean;
  message?: string;
}

interface DeleteVendorError {
  message?: string;
  linkedApplicationCount?: number;
}

interface VendorQueryResponse {
  success: boolean;
  vendor: VendorItem;
}

interface MutationVariables {
  id: string;
  input: UpdateVendorInput;
}

const DEFAULT_PAGE_SIZE = 10;

const vendorKeys = {
  all: (organizationId?: string) =>
    ["vendors", organizationId ?? "no-organization-selected"] as const,

  list: (organizationId: string | undefined, filters: VendorsFilters) =>
    ["vendors", organizationId ?? "no-organization-selected", filters] as const,

  detail: (organizationId: string | undefined, id: string) =>
    [
      "vendors",
      organizationId ?? "no-organization-selected",
      "detail",
      id,
    ] as const,
};

async function fetchVendors(filters: VendorsFilters): Promise<VendorsResponse> {
  const params = new URLSearchParams();

  params.set("page", String(filters.page ?? 1));
  params.set("limit", String(filters.limit ?? DEFAULT_PAGE_SIZE));

  if (filters.search?.trim()) {
    params.set("search", filters.search.trim());
  }

  if (filters.status) {
    params.set("status", filters.status);
  }

  return apiClient<VendorsResponse>(`/api/vendors?${params.toString()}`);
}

async function fetchVendor(id: string): Promise<VendorQueryResponse> {
  return apiClient<VendorQueryResponse>(
    `/api/vendors/${encodeURIComponent(id)}`,
  );
}

export function useVendors(filters: VendorsFilters = {}) {
  const { selectedOrganization } = useOrganization();
  const organizationId = selectedOrganization?.id;

  return useQuery({
    queryKey: vendorKeys.list(organizationId, filters),
    queryFn: () => fetchVendors(filters),
    enabled: Boolean(organizationId),
    staleTime: 30 * 1000,
    gcTime: 5 * 60 * 1000,
    placeholderData: keepPreviousData,
  });
}

export function useVendor(id: string) {
  const { selectedOrganization } = useOrganization();
  const organizationId = selectedOrganization?.id;

  return useQuery({
    queryKey: vendorKeys.detail(organizationId, id),
    queryFn: () => fetchVendor(id),
    enabled: Boolean(organizationId && id),
    staleTime: 30 * 1000,
    gcTime: 5 * 60 * 1000,
  });
}

export function useCreateVendor() {
  const queryClient = useQueryClient();
  const { selectedOrganization } = useOrganization();
  const organizationId = selectedOrganization?.id;

  return useMutation({
    mutationFn: (input: CreateVendorInput) =>
      apiClient<VendorResponse>("/api/vendors", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(input),
      }),

    onSuccess: async () => {
      await Promise.all([
        queryClient.invalidateQueries({
          queryKey: vendorKeys.all(organizationId),
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

export function useUpdateVendor() {
  const queryClient = useQueryClient();
  const { selectedOrganization } = useOrganization();
  const organizationId = selectedOrganization?.id;

  return useMutation({
    mutationFn: ({ id, input }: MutationVariables) =>
      apiClient<VendorResponse>(`/api/vendors/${encodeURIComponent(id)}`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(input),
      }),

    onSuccess: async (result) => {
      await Promise.all([
        queryClient.invalidateQueries({
          queryKey: vendorKeys.all(organizationId),
        }),
        queryClient.invalidateQueries({
          queryKey: vendorKeys.detail(organizationId, result.vendor._id),
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

export function useDeleteVendor() {
  const queryClient = useQueryClient();
  const { selectedOrganization } = useOrganization();
  const organizationId = selectedOrganization?.id;

  return useMutation({
    mutationFn: (id: string) =>
      apiClient<DeleteVendorResponse>(
        `/api/vendors/${encodeURIComponent(id)}`,
        {
          method: "DELETE",
        },
      ),

    onSuccess: async (_result, id) => {
      await Promise.all([
        queryClient.invalidateQueries({
          queryKey: vendorKeys.all(organizationId),
        }),
        queryClient.removeQueries({
          queryKey: vendorKeys.detail(organizationId, id),
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

export type { DeleteVendorError };
