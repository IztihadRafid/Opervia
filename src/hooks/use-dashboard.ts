"use client";

import { useQuery } from "@tanstack/react-query";
import { queryKeys } from "@/lib/query-keys";
export type DashboardRange = "7d" | "30d" | "90d" | "6m" | "12m";
import { apiClient } from "@/lib/api-client";
interface DashboardSpendingPoint {
  label: string;
  amount: number;
}

interface DashboardApplicationAnalytics {
  total: number;
  status: {
    active: number;
    inactive: number;
    archived: number;
  };
  categories: {
    name: string;
    count: number;
  }[];
  vendors: {
    name: string;
    count: number;
  }[];
  userCountDistribution: {
    zero: number;
    low: number;
    medium: number;
    high: number;
  };
}

interface DashboardRenewalIntelligence {
  expired: number;
  thisWeek: number;
  thisMonth: number;
  nextMonth: number;
  items: {
    id: string;
    applicationName: string;
    plan: string;
    amount: number;
    currency: string;
    billingCycle: "monthly" | "quarterly" | "yearly";
    renewalDate: string;
    category: "expired" | "this_week" | "this_month" | "next_month";
  }[];
}

interface DashboardResponse {
  success: boolean;

  metrics: {
    applications: number;
    monthlySpend: number;
    activeUsers: number;
    upcomingRenewals: number;
  };

  spending: {
    range: DashboardRange;
    data: DashboardSpendingPoint[];
  };

  subscriptions: {
    active: number;
    expired: number;
    upcomingRenewals: number;
    billingCycle: {
      monthly: number;
      quarterly: number;
      yearly: number;
    };
    costDistribution: {
      low: number;
      medium: number;
      high: number;
    };
  };

  applications: DashboardApplicationAnalytics;

  renewals: DashboardRenewalIntelligence;
}

async function fetchDashboard(
  range: DashboardRange,
): Promise<DashboardResponse> {
  return apiClient<DashboardResponse>(`/api/dashboard?range=${range}`);
}

export function useDashboard(range: DashboardRange = "12m") {
  return useQuery({
    queryKey: queryKeys.dashboard(range),
    queryFn: () => fetchDashboard(range),
    staleTime: 60 * 1000,
    gcTime: 5 * 60 * 1000,
  });
}
