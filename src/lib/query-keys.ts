export type DashboardQueryRange = "7d" | "30d" | "90d" | "6m" | "12m";

export type UsersQueryFilters = {
  page?: number;
  limit?: number;
  search?: string;
  role?: "owner" | "admin" | "member" | "viewer";
  status?: "active" | "invited" | "suspended";
};

export type InvitationsQueryFilters = {
  page?: number;
  limit?: number;
};

export const queryKeys = {
  dashboard: (range: DashboardQueryRange) => ["dashboard", range] as const,

  users: {
    all: ["users"] as const,

    list: (filters: UsersQueryFilters = {}) =>
      [
        "users",
        {
          page: filters.page,
          limit: filters.limit,
          search: filters.search,
          role: filters.role,
          status: filters.status,
        },
      ] as const,
  },

  invitations: {
    all: ["invitations"] as const,

    list: (filters: InvitationsQueryFilters = {}) =>
      [
        "invitations",
        {
          page: filters.page,
          limit: filters.limit,
        },
      ] as const,
  },

  invitation: (token: string) => ["invitation", token] as const,

  applications: {
    all: ["applications"] as const,
    list: (filters: Record<string, unknown> = {}) =>
      ["applications", filters] as const,
  },

  subscriptions: {
    all: ["subscriptions"] as const,
    list: (filters: Record<string, unknown> = {}) =>
      ["subscriptions", filters] as const,
  },
};
