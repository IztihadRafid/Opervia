"use client";
import { SubscriptionAnalytics } from "@/components/ui/dashboard/subscription-analytics";
import { SpendingChart } from "@/components/ui/dashboard/charts/spending-chart";
import { MetricCard } from "@/components/ui/dashboard/metric-card";
import { ApplicationAnalytics } from "@/components/ui/dashboard/application-analytics";
import { RenewalIntelligence } from "@/components/ui/dashboard/renewal-intelligence";
import { useState } from "react";
import { DashboardMetric } from "../../../../types/dashboard";
import { EmptyState } from "@/components/ui/dashboard/empty-state";
import { useDashboard, type DashboardRange } from "@/hooks/use-dashboard";
import { DashboardSkeleton } from "@/components/ui/dashboard/dashboard-skeleton";
import { DashboardError } from "@/components/ui/dashboard/dashboard-error";
export default function DashboardPage() {
  const [range, setRange] = useState<DashboardRange>("12m");

  const { data, isLoading, isError, refetch } = useDashboard(range);
  if (isLoading) {
    return <DashboardSkeleton />;
  }
  if (isError) {
    return <DashboardError onRetry={() => refetch()} />;
  }
  const applicationCount = data?.metrics?.applications;
  const monthlySpend = data?.metrics?.monthlySpend;
  const activeUsers = data?.metrics?.activeUsers;
  const upcomingRenewalCount = data?.metrics?.upcomingRenewals;

  const metrics: DashboardMetric[] = [
    {
      title: "Applications",
      value: applicationCount?.toString() ?? "0",
      description: "Applications in your SaaS inventory",
    },
    {
      title: "Monthly Spend",
      value: `$${monthlySpend?.toLocaleString() ?? "0"}`,
      description: "Normalized monthly recurring spend",
    },
    {
      title: "Active Users",
      value: activeUsers?.toLocaleString() ?? "0",
      description: "Active users in your organization",
    },
    {
      title: "Renewals",
      value: upcomingRenewalCount?.toLocaleString() ?? "0",
      description: "Next 30 days",
    },
  ];
  const rangeLabels: Record<DashboardRange, string> = {
    "7d": "last 7 days",
    "30d": "last 30 days",
    "90d": "last 90 days",
    "6m": "last 6 months",
    "12m": "last 12 months",
  };
  return (
    <div className="space-y-8">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-semibold tracking-tight">Dashboard</h1>

        <p className="mt-1 text-sm text-muted-foreground">
          Overview of your SaaS environment.
        </p>
      </div>

      {/* Metrics */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {metrics.map((metric) => (
          <MetricCard
            key={metric.title}
            title={metric.title}
            value={metric.value}
            description={metric.description}
          />
        ))}
      </div>

      {/* Main Dashboard */}
      <div className="grid gap-4 lg:grid-cols-7">
        {/* Spending Overview */}
        <section
          aria-labelledby="spending-overview-title"
          className="min-h-[400px] rounded-xl border bg-card p-6 lg:col-span-4"
        >
          <div>
            <h2 id="spending-overview-title" className="font-semibold">
              Spending Overview
            </h2>

            <p className="text-sm text-muted-foreground">
              SaaS spending over the {rangeLabels[range]}
            </p>
          </div>

          <div className="mt-6">
            <div
              className="mb-4 flex flex-wrap gap-2"
              role="group"
              aria-label="Spending date range"
            >
              {(
                [
                  ["7d", "7 Days"],
                  ["30d", "30 Days"],
                  ["90d", "90 Days"],
                  ["6m", "6 Months"],
                  ["12m", "12 Months"],
                ] as const
              ).map(([value, label]) => (
                <button
                  key={value}
                  type="button"
                  onClick={() => setRange(value)}
                  aria-pressed={range === value}
                  className={`rounded-md px-3 py-1.5 text-sm transition ${
                    range === value
                      ? "bg-primary text-primary-foreground"
                      : "text-muted-foreground hover:bg-muted hover:text-foreground"
                  }`}
                >
                  {label}
                </button>
              ))}
            </div>

            <SpendingChart
              data={data?.spending?.data ?? []}
              isLoading={isLoading}
            />
          </div>
        </section>

        {/* Upcoming Renewals */}
        <section className="lg:col-span-3">
          {data?.renewals && <RenewalIntelligence data={data.renewals} />}
        </section>
      </div>

      {/* Subscription Analytics */}
      {data?.subscriptions && (
        <SubscriptionAnalytics data={data.subscriptions} />
      )}

      {/* Application Analytics */}
      {data?.applications && <ApplicationAnalytics data={data.applications} />}

      {/* Recent Activity */}
      <section
        aria-labelledby="recent-activity-title"
        className="rounded-xl border bg-card p-6"
      >
        <div>
          <h2 id="recent-activity-title" className="font-semibold">
            Recent Activity
          </h2>
          <p className="mt-1 text-sm text-muted-foreground">
            Latest activity across your SaaS environment
          </p>
        </div>

        <div className="mt-6">
          <EmptyState
            title="No recent activity"
            description="Activity will appear here as changes are made across your organization."
          />
        </div>
      </section>
    </div>
  );
}
