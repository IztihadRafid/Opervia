import { useMutation, useQueryClient } from "@tanstack/react-query";
import { apiClient } from "@/lib/api-client";
import { queryKeys } from "@/lib/query-keys";
type CreateInvitationInput = {
  email: string;
  role: "admin" | "member" | "viewer";
};

type CreateInvitationResponse = {
  success: boolean;
  message: string;
  data?: {
    id: string;
    email: string;
    role: "admin" | "member" | "viewer";
    expiresAt: string;
    invitationUrl: string;
  };
};

async function createInvitation(
  input: CreateInvitationInput,
): Promise<CreateInvitationResponse> {
  return apiClient<CreateInvitationResponse>("/api/invitations", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(input),
  });
}

export function useCreateInvitation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: createInvitation,
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: queryKeys.invitations.all,
      });
    },
  });
}
