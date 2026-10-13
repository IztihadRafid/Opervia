"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useOrganization } from "@/components/providers/organization-provider";
import { apiClient } from "@/lib/api-client";
import { queryKeys } from "@/lib/query-keys";

export type ApplicationStatus = "active" | "inactive" | "archived";

export interface ApplicationItem {
  _id: string;
  organizationId: string;
  vendorId?: string;
  name: string;
  vendor: string;
  category: string;
  description?: string;
  website?: string;
  status: ApplicationStatus;
  owner?: string;
  usersCount: number;
  createdAt: string;
  updatedAt: string;
}

export interface ApplicationsFilters {
  page?: number;
  limit?: number;
  search?: string;
  status?: ApplicationStatus;
}

export interface ApplicationsResponse {
  success: boolean;
  applications: ApplicationItem[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

export interface CreateApplicationInput {
  name: string;
  vendorId: string;
  category: string;
  description?: string;
  website?: string;
  status?: ApplicationStatus;
  owner?: string;
  usersCount?: number;
}

interface ApplicationResponse {
  success: boolean;
  application: ApplicationItem;
}

interface DeleteApplicationResponse {
  success: boolean;
  message: string;
  application: ApplicationItem;
}

async function fetchApplications(
  filters: ApplicationsFilters,
): Promise<ApplicationsResponse> {
  const params = new URLSearchParams();

  params.set("page", String(filters.page ?? 1));
  params.set("limit", String(filters.limit ?? 10));

  if (filters.search?.trim()) {
    params.set("search", filters.search.trim());
  }

  if (filters.status) {
    params.set("status", filters.status);
  }

  return apiClient<ApplicationsResponse>(
    `/api/applications?${params.toString()}`,
  );
}

export function useApplications(filters: ApplicationsFilters = {}) {
  const { selectedOrganization } = useOrganization();
  const organizationId = selectedOrganization?.id;

  return useQuery({
    queryKey: queryKeys.applications.list({ ...filters }, organizationId),
    queryFn: () => fetchApplications(filters),
    enabled: Boolean(organizationId),
    staleTime: 30 * 1000,
    gcTime: 5 * 60 * 1000,
    placeholderData: (previousData) => previousData,
  });
}

export function useCreateApplication() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (input: CreateApplicationInput) =>
      apiClient<ApplicationResponse>("/api/applications", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(input),
      }),

    onSuccess: async () => {
      await Promise.all([
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

export function useUpdateApplication() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      id,
      input,
    }: {
      id: string;
      input: CreateApplicationInput;
    }) =>
      apiClient<ApplicationResponse>(
        `/api/applications/${encodeURIComponent(id)}`,
        {
          method: "PATCH",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify(input),
        },
      ),

    onSuccess: async () => {
      await Promise.all([
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

export function useDeleteApplication() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: string) =>
      apiClient<DeleteApplicationResponse>(
        `/api/applications/${encodeURIComponent(id)}`,
        {
          method: "DELETE",
        },
      ),

    onSuccess: async () => {
      await Promise.all([
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
