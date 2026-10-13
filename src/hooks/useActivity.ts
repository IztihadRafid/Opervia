"use client";

import { keepPreviousData, useQuery } from "@tanstack/react-query";
import { useOrganization } from "@/components/providers/organization-provider";
import { apiClient } from "@/lib/api-client";

export const activityTypes = [
  "application_added",
  "application_updated",
  "application_deleted",
  "subscription_added",
  "subscription_updated",
  "subscription_deleted",
  "subscription_renewed",
  "user_invited",
  "invitation_revoked",
  "payment_processed",
  "expense_created",
  "expense_updated",
  "expense_deleted",
] as const;

export type ActivityType = (typeof activityTypes)[number];
export const filterableActivityTypes = [
  "application_added",
  "application_updated",
  "application_deleted",
  "subscription_renewed",
  "user_invited",
  "invitation_revoked",
  "payment_processed",
  "expense_created",
  "expense_updated",
  "expense_deleted",
] as const;
export interface ActivityItem {
  _id: string;
  organizationId: string;
  userId?: string;
  type: ActivityType;
  title: string;
  description: string;
  entityId?: string;
  createdAt: string;
}

export interface ActivityFilters {
  page?: number;
  limit?: number;
  type?: ActivityType;
}

export interface ActivityResponse {
  success: boolean;
  data: {
    activities: ActivityItem[];
    pagination: {
      page: number;
      limit: number;
      total: number;
      totalPages: number;
    };
  };
}

const DEFAULT_PAGE_SIZE = 10;

function fetchActivities(filters: ActivityFilters) {
  const params = new URLSearchParams();

  params.set("page", String(filters.page ?? 1));
  params.set("limit", String(filters.limit ?? DEFAULT_PAGE_SIZE));

  if (filters.type) {
    params.set("type", filters.type);
  }

  return apiClient<ActivityResponse>(`/api/activity?${params.toString()}`);
}

export function useActivity(filters: ActivityFilters = {}) {
  const { selectedOrganization } = useOrganization();
  const organizationId = selectedOrganization?.id;

  const normalizedFilters = {
    page: filters.page ?? 1,
    limit: filters.limit ?? DEFAULT_PAGE_SIZE,
    type: filters.type,
  };

  return useQuery({
    queryKey: [
      "activity",
      organizationId ?? "no-organization-selected",
      normalizedFilters,
    ],
    queryFn: () => fetchActivities(normalizedFilters),
    enabled: Boolean(organizationId),
    staleTime: 30 * 1000,
    gcTime: 5 * 60 * 1000,
    placeholderData: keepPreviousData,
  });
}
