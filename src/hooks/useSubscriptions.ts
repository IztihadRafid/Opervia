"use client";

import {
  keepPreviousData,
  useMutation,
  useQuery,
  useQueryClient,
} from "@tanstack/react-query";

import { useOrganization } from "@/components/providers/organization-provider";
import { apiClient } from "@/lib/api-client";

export type BillingCycle = "monthly" | "quarterly" | "yearly";

export type SubscriptionStatus = "active" | "cancelled" | "expired" | "paused";

export interface SubscriptionItem {
  _id: string;
  organizationId: string;
  applicationId: string;
  applicationName: string;
  plan: string;
  billingCycle: BillingCycle;
  amount: number;
  currency: string;
  renewalDate: string;
  status: SubscriptionStatus;
  startDate: string;
  endDate?: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface SubscriptionsFilters {
  page?: number;
  limit?: number;
  search?: string;
  status?: SubscriptionStatus;
  billingCycle?: BillingCycle;
}

export interface CreateSubscriptionInput {
  applicationId: string;
  plan: string;
  billingCycle: BillingCycle;
  amount: number;
  currency?: string;
  renewalDate: string;
  status?: SubscriptionStatus;
  startDate: string;
  endDate?: string | null;
}

export type UpdateSubscriptionInput = Partial<CreateSubscriptionInput>;

interface SubscriptionsResponse {
  success: boolean;
  subscriptions: SubscriptionItem[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

interface SubscriptionResponse {
  success: boolean;
  subscription: SubscriptionItem;
  message?: string;
}

interface DeleteSubscriptionResponse {
  success: boolean;
  message?: string;
}

interface MutationVariables {
  id: string;
  input: UpdateSubscriptionInput;
}

const DEFAULT_PAGE_SIZE = 10;

const subscriptionKeys = {
  all: (organizationId?: string) => ["subscriptions", organizationId] as const,

  list: (organizationId: string | undefined, filters: SubscriptionsFilters) =>
    ["subscriptions", organizationId, filters] as const,
};

async function fetchSubscriptions(
  filters: SubscriptionsFilters,
): Promise<SubscriptionsResponse> {
  const params = new URLSearchParams();

  params.set("page", String(filters.page ?? 1));
  params.set("limit", String(filters.limit ?? DEFAULT_PAGE_SIZE));

  if (filters.search?.trim()) {
    params.set("search", filters.search.trim());
  }

  if (filters.status) {
    params.set("status", filters.status);
  }

  if (filters.billingCycle) {
    params.set("billingCycle", filters.billingCycle);
  }

  return apiClient<SubscriptionsResponse>(
    `/api/subscriptions?${params.toString()}`,
  );
}

export function useSubscriptions(filters: SubscriptionsFilters = {}) {
  const { selectedOrganization } = useOrganization();
  const organizationId = selectedOrganization?.id;

  return useQuery({
    queryKey: subscriptionKeys.list(organizationId, filters),
    queryFn: () => fetchSubscriptions(filters),
    enabled: Boolean(organizationId),
    staleTime: 30 * 1000,
    gcTime: 5 * 60 * 1000,
    placeholderData: keepPreviousData,
  });
}

export function useCreateSubscription() {
  const queryClient = useQueryClient();
  const { selectedOrganization } = useOrganization();
  const organizationId = selectedOrganization?.id;

  return useMutation({
    mutationFn: (input: CreateSubscriptionInput) =>
      apiClient<SubscriptionResponse>("/api/subscriptions", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(input),
      }),

    onSuccess: async () => {
      await Promise.all([
        queryClient.invalidateQueries({
          queryKey: subscriptionKeys.all(organizationId),
        }),
        queryClient.invalidateQueries({
          queryKey: ["dashboard"],
        }),
      ]);
    },
  });
}

export function useUpdateSubscription() {
  const queryClient = useQueryClient();
  const { selectedOrganization } = useOrganization();
  const organizationId = selectedOrganization?.id;

  return useMutation({
    mutationFn: ({ id, input }: MutationVariables) =>
      apiClient<SubscriptionResponse>(
        `/api/subscriptions/${encodeURIComponent(id)}`,
        {
          method: "PATCH",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify(input),
        },
      ),

    onSuccess: async () => {
      await Promise.all([
        queryClient.invalidateQueries({
          queryKey: subscriptionKeys.all(organizationId),
        }),
        queryClient.invalidateQueries({
          queryKey: ["dashboard"],
        }),
      ]);
    },
  });
}

export function useDeleteSubscription() {
  const queryClient = useQueryClient();
  const { selectedOrganization } = useOrganization();
  const organizationId = selectedOrganization?.id;

  return useMutation({
    mutationFn: (id: string) =>
      apiClient<DeleteSubscriptionResponse>(
        `/api/subscriptions/${encodeURIComponent(id)}`,
        {
          method: "DELETE",
        },
      ),

    onSuccess: async () => {
      await Promise.all([
        queryClient.invalidateQueries({
          queryKey: subscriptionKeys.all(organizationId),
        }),
        queryClient.invalidateQueries({
          queryKey: ["dashboard"],
        }),
      ]);
    },
  });
}
