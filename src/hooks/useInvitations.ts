import { useQuery } from "@tanstack/react-query";

type InvitationDetails = {
  email: string;
  role: "admin" | "member" | "viewer";
  expiresAt: string;
};

type InvitationResponse = {
  success: boolean;
  message?: string;
  data?: InvitationDetails;
};

async function getInvitation(token: string): Promise<InvitationDetails> {
  const response = await fetch(`/api/invitations/${token}`);

  const result: InvitationResponse = await response.json();

  if (!response.ok || !result.data) {
    throw new Error(result.message ?? "Invitation is invalid or has expired.");
  }

  return result.data;
}

export function useInvitation(token: string) {
  return useQuery({
    queryKey: ["invitation", token],
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

  const response = await fetch(`/api/invitations?${searchParams.toString()}`);

  const result: InvitationsResponse = await response.json();

  if (!response.ok) {
    throw new Error("Failed to load invitations.");
  }

  return result;
}

export function useInvitations(options: UseInvitationsOptions = {}) {
  const { page = 1, limit = 25 } = options;

  return useQuery({
    queryKey: ["invitations", { page, limit }],
    queryFn: () => getInvitations({ page, limit }),
    placeholderData: (previousData) => previousData,
  });
}
