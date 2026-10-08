import { useQuery } from "@tanstack/react-query";
import { queryKeys } from "@/lib/query-keys";
import { apiClient } from "@/lib/api-client";
type InvitationDetails = {
  email: string;
  role: "admin" | "member" | "viewer";
  expiresAt: string;
};

async function getInvitation(token: string): Promise<InvitationDetails> {
  return apiClient<InvitationDetails>(`/api/invitations/${token}`);
}

export function useInvitation(token: string) {
  return useQuery({
    queryKey: queryKeys.invitation(token),
    queryFn: () => getInvitation(token),
    enabled: Boolean(token),
    retry: false,
  });
}

export type Invitation = {
  _id: string;
  email: string;
  role: "admin" | "member" | "viewer";
  expiresAt: string;
  invitedBy: string;
  createdAt: string;
  emailStatus: "pending" | "sent" | "failed";
  status: "pending" | "expired" | "revoked";
};
type InvitationsResponse = {
  success: boolean;
  data: Invitation[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
};

type UseInvitationsOptions = {
  page?: number;
  limit?: number;
};

async function getInvitations({
  page = 1,
  limit = 25,
}: UseInvitationsOptions): Promise<InvitationsResponse> {
  const searchParams = new URLSearchParams({
    page: String(page),
    limit: String(limit),
  });

  return apiClient<InvitationsResponse>(
    `/api/invitations?${searchParams.toString()}`,
  );
}

export function useInvitations(options: UseInvitationsOptions = {}) {
  const { page = 1, limit = 25 } = options;

  return useQuery({
    queryKey: queryKeys.invitations.list({ page, limit }),
    queryFn: () => getInvitations({ page, limit }),
    placeholderData: (previousData) => previousData,
  });
}
