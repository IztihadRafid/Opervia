import { useMutation, useQueryClient } from "@tanstack/react-query";

type ResendInvitationResponse = {
  success: boolean;
  message?: string;
  data?: {
    id: string;
    email: string;
    role: "admin" | "member" | "viewer";
    expiresAt: string;
    invitationUrl: string;
  };
};

async function resendInvitation(
  invitationId: string,
): Promise<ResendInvitationResponse> {
  const response = await fetch(`/api/invitations/resend/${invitationId}`, {
    method: "POST",
  });

  const result: ResendInvitationResponse = await response.json();

  if (!response.ok) {
    throw new Error(result.message ?? "Failed to resend invitation.");
  }

  return result;
}

export function useResendInvitation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: resendInvitation,

    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: ["invitations"],
      });
    },
  });
}
