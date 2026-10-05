import { useMutation, useQueryClient } from "@tanstack/react-query";

type RevokeInvitationResponse = {
  success: boolean;
  message?: string;
};

async function revokeInvitation(
  invitationId: string,
): Promise<RevokeInvitationResponse> {
  const response = await fetch(`/api/invitations/revoke/${invitationId}`, {
    method: "DELETE",
  });

  const result: RevokeInvitationResponse = await response.json();

  if (!response.ok) {
    throw new Error(result.message ?? "Failed to revoke invitation.");
  }

  return result;
}

export function useRevokeInvitation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: revokeInvitation,

    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: ["invitations"],
      });
    },
  });
}
