"use client";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { apiClient } from "@/lib/api-client";
import { queryKeys } from "@/lib/query-keys";
import type { User } from "@/hooks/use-users";

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

    onMutate: async ({ userId, ...updates }) => {
      await queryClient.cancelQueries({
        queryKey: queryKeys.users.all,
      });

      const previousQueries = queryClient.getQueriesData<UsersResponse>({
        queryKey: queryKeys.users.all,
      });

      const previousUser = previousQueries
        .flatMap(([, data]) => data?.data ?? [])
        .find((user) => user._id === userId);

      const statusChanged =
        updates.status !== undefined &&
        previousUser !== undefined &&
        updates.status !== previousUser.status;

      queryClient.setQueriesData<UsersResponse>(
        {
          queryKey: queryKeys.users.all,
        },
        (currentData) => {
          if (!currentData) {
            return currentData;
          }

          return {
            ...currentData,
            data: currentData.data.map((user) =>
              user._id === userId
                ? {
                    ...user,
                    ...updates,
                  }
                : user,
            ),
          };
        },
      );

      return {
        previousQueries,
        statusChanged,
      };
    },

    onError: (_error, _variables, context) => {
      if (!context) {
        return;
      }
      for (const [queryKey, previousData] of context.previousQueries) {
        queryClient.setQueryData(queryKey, previousData);
      }
    },

    onSettled: (_data, _error, _variables, context) => {
      queryClient.invalidateQueries({
        queryKey: queryKeys.users.all,
      });

      if (context?.statusChanged) {
        queryClient.invalidateQueries({
          queryKey: ["dashboard"],
        });
      }
    },
  });
}
