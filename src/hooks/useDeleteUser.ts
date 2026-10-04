"use client";

import { useMutation, useQueryClient } from "@tanstack/react-query";

interface DeleteUserResponse {
  success: boolean;
  message?: string;
}

async function deleteUser(userId: string): Promise<DeleteUserResponse> {
  const response = await fetch(`/api/users/${userId}`, {
    method: "DELETE",
  });

  const result: DeleteUserResponse = await response.json();

  if (!response.ok) {
    throw new Error(result.message ?? "Failed to delete user");
  }

  return result;
}

export function useDeleteUser() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: deleteUser,

    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: ["users"],
      });
    },
  });
}
