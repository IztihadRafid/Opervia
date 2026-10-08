import { useMutation, useQueryClient } from "@tanstack/react-query";
import { queryKeys } from "@/lib/query-keys";
import { apiClient } from "@/lib/api-client";
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
  return apiClient<ResendInvitationResponse>(
    `/api/invitations/resend/${invitationId}`,
    {
      method: "POST",
    },
  );
}

export function useResendInvitation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: resendInvitation,

    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: queryKeys.invitations.all,
      });
    },
  });
}
