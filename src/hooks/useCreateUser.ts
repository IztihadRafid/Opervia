"use client";

import { useMutation, useQueryClient } from "@tanstack/react-query";

interface CreateUserInput {
  name: string;
  email: string;
  role: "owner" | "admin" | "member" | "viewer";
  status: "active" | "invited" | "suspended";
}

interface CreateUserResponse {
  success: boolean;
  data?: {
    _id: string;
    organizationId: string;
    name: string;
    email: string;
    role: CreateUserInput["role"];
    status: CreateUserInput["status"];
    createdAt: string;
    updatedAt: string;
  };
  message?: string;
  errors?: Record<string, string[] | undefined>;
}

async function createUser(data: CreateUserInput): Promise<CreateUserResponse> {
  const response = await fetch("/api/users", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(data),
  });

  const result: CreateUserResponse = await response.json();

  if (!response.ok) {
    throw new Error(result.message ?? "Failed to create user");
  }

  return result;
}

export function useCreateUser() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: createUser,

    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: ["users"],
      });
    },
  });
}
