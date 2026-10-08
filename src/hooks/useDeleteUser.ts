"use client";

import { useMutation, useQueryClient } from "@tanstack/react-query";
import { queryKeys } from "@/lib/query-keys";
import { apiClient } from "@/lib/api-client";
interface DeleteUserResponse {
  success: boolean;
  message?: string;
}

async function deleteUser(userId: string): Promise<DeleteUserResponse> {
  return apiClient<DeleteUserResponse>(`/api/users/${userId}`, {
    method: "DELETE",
  });
}

export function useDeleteUser() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: deleteUser,

    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: queryKeys.users.all,
      });
    },
  });
}
