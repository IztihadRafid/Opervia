import { useMutation } from "@tanstack/react-query";
import { apiClient } from "@/lib/api-client";
type AcceptInvitationInput = {
  token: string;
  name: string;
  password: string;
  confirmPassword: string;
};

type AcceptInvitationResponse = {
  success: boolean;
  message: string;
  data?: {
    userId: string;
    organizationId: string;
    role: "admin" | "member" | "viewer";
    email: string;
  };
};

async function acceptInvitation(
  input: AcceptInvitationInput,
): Promise<AcceptInvitationResponse> {
  return apiClient<AcceptInvitationResponse>("/api/invitations/accept", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(input),
  });
}

export function useAcceptInvitation() {
  return useMutation({
    mutationFn: acceptInvitation,
  });
}
