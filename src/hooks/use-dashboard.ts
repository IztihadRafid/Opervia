"use client";

import { useQuery } from "@tanstack/react-query";

export type DashboardRange = "7d" | "30d" | "90d" | "6m" | "12m";

interface DashboardSpendingPoint {
  label: string;
  amount: number;
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
  });
}
