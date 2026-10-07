"use client";
import { SubscriptionAnalytics } from "@/components/ui/dashboard/subscription-analytics";
import { SpendingChart } from "@/components/ui/dashboard/charts/spending-chart";
import { ActivityItem } from "@/components/ui/dashboard/activity-item";
import { MetricCard } from "@/components/ui/dashboard/metric-card";
import { RenewalItem } from "@/components/ui/dashboard/renewal-item";
import { useState } from "react";
import {
  DashboardMetric,
  RecentActivity,
  UpcomingRenewal,
} from "../../../../types/dashboard";

import { useDashboard, type DashboardRange } from "@/hooks/use-dashboard";

const upcomingRenewals: UpcomingRenewal[] = [
  {
    id: "renewal-1",
    name: "Slack",
    category: "Communication",
    amount: "$1,240",
    date: "Oct 08, 2026",
  },
  {
    id: "renewal-2",
    name: "GitHub Enterprise",
    category: "Development",
    amount: "$2,400",
    date: "Oct 14, 2026",
  },
  {
    id: "renewal-3",
    name: "Figma Organization",
    category: "Design",
    amount: "$860",
    date: "Oct 21, 2026",
  },
  {
    id: "renewal-4",
    name: "AWS",
    category: "Infrastructure",
    amount: "$8,420",
    date: "Oct 28, 2026",
  },
];

const recentActivity: RecentActivity[] = [
  {
    id: "activity-1",
    title: "New application added",
    description: "Slack was added to your SaaS inventory",
    time: "2 minutes ago",
  },
  {
    id: "activity-2",
    title: "Subscription renewed",
    description: "GitHub Enterprise subscription was renewed",
    time: "18 minutes ago",
  },
  {
    id: "activity-3",
    title: "User invited",
    description: "Sarah Wilson was invited to the workspace",
    time: "1 hour ago",
  },
  {
    id: "activity-4",
    title: "Payment processed",
    description: "AWS subscription payment was processed",
    time: "3 hours ago",
  },
];

export default function DashboardPage() {
  const [range, setRange] = useState<DashboardRange>("12m");

  const { data, isLoading, isError } = useDashboard(range);

  const applicationCount = data?.metrics?.applications;
  const monthlySpend = data?.metrics?.monthlySpend;
  const activeUsers = data?.metrics?.activeUsers;
  const upcomingRenewalCount = data?.metrics?.upcomingRenewals;

  const metrics: DashboardMetric[] = [
    {
      title: "Applications",
      value: isLoading
        ? "..."
        : isError
          ? "—"
          : (applicationCount?.toString() ?? "0"),
      description: "Applications in your SaaS inventory",
    },
    {
      title: "Monthly Spend",
      value: isLoading
        ? "..."
        : isError
          ? "—"
          : `$${monthlySpend?.toLocaleString() ?? "0"}`,
      description: "Normalized monthly recurring spend",
    },
    {
      title: "Active Users",
      value: isLoading
        ? "..."
        : isError
          ? "—"
          : (activeUsers?.toLocaleString() ?? "0"),
      description: "Active users in your organization",
    },
    {
      title: "Renewals",
      value: isLoading
        ? "..."
        : isError
          ? "—"
          : (upcomingRenewalCount?.toLocaleString() ?? "0"),
      description: "Next 30 days",
    },
  ];

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
        <section className="min-h-[400px] rounded-xl border bg-card p-6 lg:col-span-4">
          <div>
            <h2 className="font-semibold">Spending Overview</h2>

            <p className="text-sm text-muted-foreground">
              SaaS spending over the last 12 months
            </p>
          </div>

          <div className="mt-6">
            <div className="mb-4 flex flex-wrap gap-2">
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
        <section className="min-h-[400px] rounded-xl border bg-card p-6 lg:col-span-3">
          <div>
            <h2 className="font-semibold">Upcoming Renewals</h2>

            <p className="text-sm text-muted-foreground">
              Subscriptions requiring attention
            </p>
          </div>

          <div className="mt-6 space-y-5">
            {upcomingRenewals.map((renewal) => (
              <RenewalItem
                key={renewal.id}
                name={renewal.name}
                category={renewal.category}
                amount={renewal.amount}
                date={renewal.date}
              />
            ))}
          </div>
        </section>
      </div>

      {/* Subscription Analytics */}
      {data?.subscriptions && (
        <SubscriptionAnalytics data={data.subscriptions} />
      )}

      {/* Recent Activity */}
      <section className="rounded-xl border bg-card p-6">
        <div>
          <h2 className="font-semibold">Recent Activity</h2>

          <p className="text-sm text-muted-foreground">
            Latest activity across your SaaS environment
          </p>
        </div>

        <div className="mt-6 divide-y">
          {recentActivity.map((activity) => (
            <ActivityItem
              key={activity.id}
              title={activity.title}
              description={activity.description}
              time={activity.time}
            />
          ))}
        </div>
      </section>
    </div>
  );
}
