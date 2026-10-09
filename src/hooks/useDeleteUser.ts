"use client";

import { useMutation, useQueryClient } from "@tanstack/react-query";

import { apiClient } from "@/lib/api-client";
import { queryKeys } from "@/lib/query-keys";
import type { UsersResponse } from "@/hooks/use-users";

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

    onMutate: async (userId) => {
      await queryClient.cancelQueries({
        queryKey: queryKeys.users.all,
      });

      const previousQueries = queryClient.getQueriesData<UsersResponse>({
        queryKey: queryKeys.users.all,
      });

      const previousUser = previousQueries
        .flatMap(([, data]) => data?.data ?? [])
        .find((user) => user._id === userId);

      const deletedActiveUser =
        previousUser !== undefined && previousUser.status === "active";

      queryClient.setQueriesData<UsersResponse>(
        {
          queryKey: queryKeys.users.all,
        },
        (currentData) => {
          if (!currentData) {
            return currentData;
          }

          const userExists = currentData.data.some(
            (user) => user._id === userId,
          );

          if (!userExists) {
            return currentData;
          }

          const newTotal = Math.max(0, currentData.pagination.total - 1);

          return {
            ...currentData,
            data: currentData.data.filter((user) => user._id !== userId),
            pagination: {
              ...currentData.pagination,
              total: newTotal,
              totalPages: Math.max(
                1,
                Math.ceil(newTotal / currentData.pagination.limit),
              ),
            },
          };
        },
      );

      return {
        previousQueries,
        deletedActiveUser,
      };
    },

    onError: (_error, _userId, context) => {
      if (!context) {
        return;
      }

      for (const [queryKey, previousData] of context.previousQueries) {
        queryClient.setQueryData(queryKey, previousData);
      }
    },

    onSettled: (_data, _error, _userId, context) => {
      queryClient.invalidateQueries({
        queryKey: queryKeys.users.all,
      });

      if (context?.deletedActiveUser) {
        queryClient.invalidateQueries({
          queryKey: ["dashboard"],
        });
      }
    },
  });
}
