"use client";
import { apiClient } from "@/lib/api-client";
import { useQuery } from "@tanstack/react-query";
import { queryKeys } from "@/lib/query-keys";

export interface User {
  _id: string;
  organizationId: string;
  name: string;
  email: string;
  role: "owner" | "admin" | "member" | "viewer";
  status: "active" | "invited" | "suspended";
  createdAt: string;
  updatedAt: string;
}

export interface UsersResponse {
  success: boolean;
  data: User[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

export interface UseUsersOptions {
  page?: number;
  limit?: number;
  search?: string;
  role?: User["role"];
  status?: User["status"];
}

export async function fetchUsers(
  options: UseUsersOptions,
): Promise<UsersResponse> {
  const params = new URLSearchParams();

  if (options.page) {
    params.set("page", String(options.page));
  }

  if (options.limit) {
    params.set("limit", String(options.limit));
  }

  if (options.search) {
    params.set("search", options.search);
  }

  if (options.role) {
    params.set("role", options.role);
  }

  if (options.status) {
    params.set("status", options.status);
  }

  return apiClient<UsersResponse>(`/api/users?${params.toString()}`);
}

export function useUsers(options: UseUsersOptions = {}) {
  return useQuery({
    queryKey: queryKeys.users.list(options),
    queryFn: () => fetchUsers(options),
    staleTime: 30 * 1000,
    gcTime: 5 * 60 * 1000,
    placeholderData: (previousData) => previousData,
  });
}
