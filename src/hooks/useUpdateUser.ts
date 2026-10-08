"use client";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { queryKeys } from "@/lib/query-keys";
import { apiClient } from "@/lib/api-client";
interface UpdateUserInput {
  userId: string;
  name?: string;
  email?: string;
  role?: "owner" | "admin" | "member" | "viewer";
  status?: "active" | "invited" | "suspended";
}

interface UpdateUserResponse {
  success: boolean;
  data?: {
    _id: string;
    organizationId: string;
    name: string;
    email: string;
    role: UpdateUserInput["role"];
    status: UpdateUserInput["status"];
    createdAt: string;
    updatedAt: string;
  };
  message?: string;
  errors?: Record<string, string[] | undefined>;
}

async function updateUser({
  userId,
  ...data
}: UpdateUserInput): Promise<UpdateUserResponse> {
  return apiClient<UpdateUserResponse>(`/api/users/${userId}`, {
    method: "PATCH",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(data),
  });
}

export function useUpdateUser() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: updateUser,
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: queryKeys.users.all,
      });
    },
  });
}
