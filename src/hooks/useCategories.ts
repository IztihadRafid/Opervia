"use client";
import { useQuery } from "@tanstack/react-query";
import { useOrganization } from "@/components/providers/organization-provider";
import { apiClient } from "@/lib/api-client";
export type CategoryStatus = "active" | "inactive";
export interface CategoryItem {
  id: string;
  name: string;
  status: CategoryStatus;
  createdAt: string;
  updatedAt: string;
}

export interface CategoriesFilters {
  page?: number;
  limit?: number;
  search?: string;
  status?: CategoryStatus;
}

export interface CategoriesResponse {
  success: boolean;
  categories: CategoryItem[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

const categoryKeys = {
  all: (organizationId?: string) =>
    ["categories", organizationId ?? "no-organization-selected"] as const,

  list: (organizationId: string | undefined, filters: CategoriesFilters) =>
    [
      "categories",
      organizationId ?? "no-organization-selected",
      filters,
    ] as const,
};

async function fetchCategories(
  filters: CategoriesFilters,
): Promise<CategoriesResponse> {
  const params = new URLSearchParams();

  params.set("page", String(filters.page ?? 1));
  params.set("limit", String(filters.limit ?? 100));

  if (filters.search?.trim()) {
    params.set("search", filters.search.trim());
  }

  if (filters.status) {
    params.set("status", filters.status);
  }

  return apiClient<CategoriesResponse>(`/api/categories?${params.toString()}`);
}

export function useCategories(filters: CategoriesFilters = {}) {
  const { selectedOrganization } = useOrganization();
  const organizationId = selectedOrganization?.id;

  return useQuery({
    queryKey: categoryKeys.list(organizationId, filters),
    queryFn: () => fetchCategories(filters),
    enabled: Boolean(organizationId),
    staleTime: 30 * 1000,
    gcTime: 5 * 60 * 1000,
  });
}
