"use client";

import { useState } from "react";
import { ChartNoAxesCombined } from "lucide-react";
import { ApplicationAnalytics } from "@/components/ui/dashboard/application-analytics";
import { DashboardError } from "@/components/ui/dashboard/dashboard-error";
import { DashboardSkeleton } from "@/components/ui/dashboard/dashboard-skeleton";
import { MetricCard } from "@/components/ui/dashboard/metric-card";
import { RenewalIntelligence } from "@/components/ui/dashboard/renewal-intelligence";
import { SpendingChart } from "@/components/ui/dashboard/charts/spending-chart";
import { SubscriptionAnalytics } from "@/components/ui/dashboard/subscription-analytics";
import { ActivityPreview } from "@/components/ui/activity/activity-preview";
import { useDashboard, type DashboardRange } from "@/hooks/use-dashboard";
import { ExpenseStatusDonutChart } from "@/components/ui/dashboard/charts/expense-status-donut-chart";

import type { DashboardMetric } from "../../../../types/dashboard";
import { ExpenseCategoryDonutChart } from "@/components/ui/dashboard/charts/expense-category-donut-chart";

const RANGE_OPTIONS: { value: DashboardRange; label: string }[] = [
  { value: "7d", label: "7 Days" },
  { value: "30d", label: "30 Days" },
  { value: "90d", label: "90 Days" },
  { value: "6m", label: "6 Months" },
  { value: "12m", label: "12 Months" },
];

const RANGE_LABELS: Record<DashboardRange, string> = {
  "7d": "the last 7 days",
  "30d": "the last 30 days",
  "90d": "the last 90 days",
  "6m": "the last 6 months",
  "12m": "the last 12 months",
};

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
      description: "Normalized monthly active recurring spend",
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

  return (
    <div className="space-y-8 pb-8">
      {/* Dashboard heading */}
      <header className="relative overflow-hidden rounded-2xl border border-[#DC586D]/15 bg-gradient-to-br from-[#FFF5EF] to-[#FFF5EF] px-6 py-7 shadow-sm sm:px-8 sm:py-8">
        <div
          aria-hidden="true"
          className="pointer-events-none absolute -right-12 -top-20 size-56 rounded-full bg-[#FFBB94]/20 blur-3xl"
        />
        <div
          aria-hidden="true"
          className="pointer-events-none absolute -bottom-24 right-1/3 size-48 rounded-full bg-[#DC586D]/10 blur-3xl"
        />

        <div className="relative flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <div className="mb-3 inline-flex items-center gap-2 rounded-full border border-[#DC586D]/20 bg-white/80 px-3 py-1 text-xs font-medium text-[#852E4E] shadow-sm">
              <span className="size-1.5 rounded-full bg-[#DC586D]" />
              Workspace overview
            </div>

            <h1 className="text-2xl font-semibold tracking-tight text-[#4C1D3D] sm:text-3xl">
              Dashboard
            </h1>

            <p className="mt-2 max-w-xl text-sm leading-6 text-[#852E4E]/80 sm:text-base">
              Your SaaS environment at a glance. Monitor applications, spending,
              users, and upcoming renewals in one place.
            </p>
          </div>

          <div className="hidden size-14 shrink-0 items-center justify-center rounded-2xl border border-[#DC586D]/15 bg-white/80 text-[#A33757] shadow-sm sm:flex">
            <ChartNoAxesCombined className="size-7" aria-hidden="true" />
          </div>
        </div>
      </header>

      {/* Key metrics */}
      <section aria-label="Key metrics">
        <div className="mb-4 flex items-center justify-between gap-3">
          <div>
            <h2 className="text-base font-semibold tracking-tight text-foreground">
              Key metrics
            </h2>
            <p className="mt-1 text-sm text-muted-foreground">
              A snapshot of your SaaS inventory and commitments.
            </p>
          </div>
        </div>

        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          {metrics.map((metric) => (
            <MetricCard
              key={metric.title}
              title={metric.title}
              value={metric.value}
              description={metric.description}
            />
          ))}
        </div>
      </section>

      {/* Spending and renewals */}
      <section aria-label="Spending and upcoming renewals">
        <div className="mb-4">
          <h2 className="text-base font-semibold tracking-tight text-foreground">
            Financial overview
          </h2>
          <p className="mt-1 text-sm text-muted-foreground">
            Review spending trends and keep upcoming renewals in view.
          </p>
        </div>

        <div className="grid min-w-0 gap-5 lg:grid-cols-7">
          <section
            aria-labelledby="spending-overview-title"
            className="min-w-0 rounded-2xl border border-border/70 bg-card p-4 shadow-sm transition-shadow duration-200 hover:shadow-md sm:p-6 lg:col-span-4"
          >
            <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
              <div>
                <h3
                  id="spending-overview-title"
                  className="font-semibold tracking-tight text-foreground"
                >
                  Spending overview
                </h3>
                <p className="mt-1 text-sm text-muted-foreground">
                  SaaS spending over {RANGE_LABELS[range]}
                </p>
              </div>

              <div className="flex size-9 shrink-0 items-center justify-center rounded-xl bg-[#DC586D]/10 text-[#A33757]">
                <ChartNoAxesCombined className="size-4" aria-hidden="true" />
              </div>
            </div>

            <div className="mt-6">
              <div
                className="mb-5 flex flex-wrap gap-1.5 rounded-xl bg-muted/60 p-1"
                role="group"
                aria-label="Spending date range"
              >
                {RANGE_OPTIONS.map(({ value, label }) => {
                  const isSelected = range === value;

                  return (
                    <button
                      key={value}
                      type="button"
                      onClick={() => setRange(value)}
                      aria-pressed={isSelected}
                      className={`min-h-9 flex-1 rounded-lg px-3 py-2 text-xs font-medium transition-all duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#DC586D] focus-visible:ring-offset-2 sm:text-sm ${
                        isSelected
                          ? "bg-[#852E4E] text-white shadow-sm"
                          : "text-muted-foreground hover:bg-white hover:text-[#852E4E]"
                      }`}
                    >
                      {label}
                    </button>
                  );
                })}
              </div>

              <SpendingChart
                data={data?.spending?.data ?? []}
                isLoading={isLoading}
              />
            </div>
          </section>

          <section
            aria-label="Upcoming renewals"
            className="min-w-0 lg:col-span-3"
          >
            {data?.renewals && <RenewalIntelligence data={data.renewals} />}
          </section>
        </div>
      </section>

      {/* Expense analytics */}
      {data?.expenses && (
        <section aria-label="Expense analytics" className="space-y-4">
          <div>
            <h2 className="text-base font-semibold tracking-tight text-foreground">
              Expense insights
            </h2>
            <p className="mt-1 text-sm text-muted-foreground">
              Understand expense status and how your expenses are distributed
              across categories.
            </p>
          </div>

          <div className="grid min-w-0 gap-5 lg:grid-cols-2">
            <section
              aria-labelledby="expense-status-title"
              className="min-w-0 rounded-2xl border border-border/70 bg-card p-4 shadow-sm transition-shadow duration-200 hover:shadow-md sm:p-6"
            >
              <div>
                <h3
                  id="expense-status-title"
                  className="font-semibold tracking-tight text-foreground"
                >
                  Expense status
                </h3>
                <p className="mt-1 text-sm text-muted-foreground">
                  Recorded expenses by payment status.
                </p>
              </div>

              <div className="mt-5">
                <ExpenseStatusDonutChart
                  data={data.expenses.statuses}
                  total={data.expenses.total}
                />
              </div>
            </section>

            <section
              aria-labelledby="expense-category-title"
              className="min-w-0 rounded-2xl border border-border/70 bg-card p-4 shadow-sm transition-shadow duration-200 hover:shadow-md sm:p-6"
            >
              <div>
                <h3
                  id="expense-category-title"
                  className="font-semibold tracking-tight text-foreground"
                >
                  Expense categories
                </h3>
                <p className="mt-1 text-sm text-muted-foreground">
                  See how recorded expenses are distributed across categories.
                </p>
              </div>

              <div className="mt-5">
                <ExpenseCategoryDonutChart
                  data={data.expenses.categories}
                  total={data.expenses.total}
                />
              </div>
            </section>
          </div>
        </section>
      )}

      {/* Application analytics */}
      {data?.applications && (
        <section aria-label="Application analytics" className="space-y-4">
          <div>
            <h2 className="text-base font-semibold tracking-tight text-foreground">
              Application insights
            </h2>
            <p className="mt-1 text-sm text-muted-foreground">
              Understand your application inventory and distribution.
            </p>
          </div>

          <ApplicationAnalytics data={data.applications} />
        </section>
      )}

      {/* Subscription analytics */}
      {data?.subscriptions && (
        <section aria-label="Subscription analytics" className="space-y-4">
          <div>
            <h2 className="text-base font-semibold tracking-tight text-foreground">
              Subscription insights
            </h2>
            <p className="mt-1 text-sm text-muted-foreground">
              Review subscription status, billing cycles, and cost distribution.
            </p>
          </div>

          <SubscriptionAnalytics data={data.subscriptions} />
        </section>
      )}

      {/* Recent activity */}
      <section aria-label="Recent activity" className="space-y-4">
        <div>
          <h2 className="text-base font-semibold tracking-tight text-foreground">
            Recent activity
          </h2>
          <p className="mt-1 text-sm text-muted-foreground">
            Keep up with recent changes across your workspace.
          </p>
        </div>

        <ActivityPreview />
      </section>
    </div>
  );
}
