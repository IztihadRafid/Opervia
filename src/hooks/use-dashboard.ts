"use client";

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
  const response = await fetch(`/api/dashboard?range=${range}`);

  if (!response.ok) {
    throw new Error("Failed to fetch dashboard data");
  }

  return response.json();
}

export function useDashboard(range: DashboardRange = "12m") {
  return useQuery({
    queryKey: ["dashboard", range],
    queryFn: () => fetchDashboard(range),
    staleTime: 60 * 1000,
    gcTime: 5 * 60 * 1000,
  });
}
