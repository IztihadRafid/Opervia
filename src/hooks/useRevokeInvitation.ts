import { useMutation, useQueryClient } from "@tanstack/react-query";
import { queryKeys } from "@/lib/query-keys";
import { apiClient } from "@/lib/api-client";
type RevokeInvitationResponse = {
  success: boolean;
  message?: string;
};

async function revokeInvitation(
  invitationId: string,
): Promise<RevokeInvitationResponse> {
  return apiClient<RevokeInvitationResponse>(
    `/api/invitations/revoke/${invitationId}`,
    {
      method: "DELETE",
    },
  );
}

export function useRevokeInvitation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: revokeInvitation,

    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: queryKeys.invitations.all,
      });
    },
  });
}
