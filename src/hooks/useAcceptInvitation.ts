import { useMutation } from "@tanstack/react-query";

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
  const response = await fetch("/api/invitations/accept", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(input),
  });

  const result = await response.json();

  if (!response.ok) {
    throw new Error(result.message ?? "Failed to accept invitation.");
  }

  return result;
}

export function useAcceptInvitation() {
  return useMutation({
    mutationFn: acceptInvitation,
  });
}
