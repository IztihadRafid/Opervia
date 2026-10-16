"use client";

import { useOrganization } from "@/components/providers/organization-provider";
import { apiClient } from "@/lib/api-client";
import { queryKeys } from "@/lib/query-keys";
import { useQuery } from "@tanstack/react-query";

export type DashboardRange = "7d" | "30d" | "90d" | "6m" | "12m";

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

interface DashboardExpenseStatus {
  status: "paid" | "pending" | "overdue" | "cancelled";
  count: number;
  amountsByCurrency: {
    currency: string;
    amount: number;
  }[];
}

interface DashboardExpenseCategory {
  category: string;
  count: number;
  amountsByCurrency: {
    currency: string;
    amount: number;
  }[];
}

interface DashboardExpenseAnalytics {
  total: number;
  statuses: DashboardExpenseStatus[];
  categories: DashboardExpenseCategory[];
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

  expenses: DashboardExpenseAnalytics;
}

async function fetchDashboard(
  range: DashboardRange,
): Promise<DashboardResponse> {
  return apiClient<DashboardResponse>(`/api/dashboard?range=${range}`);
}

export function useDashboard(range: DashboardRange = "12m") {
  const { selectedOrganization } = useOrganization();
  const organizationId = selectedOrganization?.id;

  return useQuery({
    queryKey: queryKeys.dashboard(range, organizationId),
    queryFn: () => fetchDashboard(range),
    enabled: Boolean(organizationId),
    staleTime: 60 * 1000,
    gcTime: 5 * 60 * 1000,
    placeholderData: (previousData) => previousData,
  });
}
