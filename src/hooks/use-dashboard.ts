"use client";

import { useQuery } from "@tanstack/react-query";

interface DashboardResponse {
  success: boolean;
  metrics: {
    applications: number;
    monthlySpend: number;
  };
}

async function fetchDashboard(): Promise<DashboardResponse> {
  const response = await fetch("/api/dashboard");

  if (!response.ok) {
    throw new Error("Failed to fetch dashboard data");
  }

  return response.json();
}

export function useDashboard() {
  return useQuery({
    queryKey: ["dashboard"],
    queryFn: fetchDashboard,
  });
}
