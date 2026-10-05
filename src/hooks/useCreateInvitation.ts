import { useMutation } from "@tanstack/react-query";

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
  const response = await fetch("/api/invitations", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(input),
  });

  const result: CreateInvitationResponse = await response.json();

  if (!response.ok) {
    throw new Error(result.message ?? "Failed to create invitation.");
  }

  return result;
}

export function useCreateInvitation() {
  return useMutation({
    mutationFn: createInvitation,
  });
}
