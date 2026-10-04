"use client";

import { useQuery } from "@tanstack/react-query";

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

interface UsersResponse {
  success: boolean;
  data: User[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

interface UseUsersOptions {
  page?: number;
  limit?: number;
  search?: string;
  role?: User["role"];
  status?: User["status"];
}

async function fetchUsers(options: UseUsersOptions): Promise<UsersResponse> {
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

  const response = await fetch(`/api/users?${params.toString()}`);

  if (!response.ok) {
    throw new Error("Failed to fetch users");
  }

  return response.json();
}

export function useUsers(options: UseUsersOptions = {}) {
  return useQuery({
    queryKey: ["users", options],
    queryFn: () => fetchUsers(options),
    placeholderData: (previousData) => previousData,
  });
}
