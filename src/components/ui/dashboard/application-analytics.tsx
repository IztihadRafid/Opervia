"use client";
import { CategoryDonutChart } from "@/components/ui/dashboard/charts/category-donut-chart";
import { LayoutDashboard } from "lucide-react";
interface ApplicationAnalyticsProps {
  data: {
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
  };
}
export function ApplicationAnalytics({ data }: ApplicationAnalyticsProps) {
  const totalStatus =
    data.status.active + data.status.inactive + data.status.archived;

  const totalUserDistribution =
    data.userCountDistribution.zero +
    data.userCountDistribution.low +
    data.userCountDistribution.medium +
    data.userCountDistribution.high;

  return (
    <section className="overflow-hidden rounded-2xl border border-border/70 bg-card shadow-sm">
      <div className="border-b border-border/60 bg-linear-to-r from-[#852E4E]/[0.06] via-transparent to-[#FFBB94]/[0.12] px-5 py-5 sm:px-6">
        <div className="flex items-start gap-3">
          <div
            aria-hidden="true"
            className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-[#852E4E]/10 text-[#852E4E]"
          >
            <LayoutDashboard className="size-5" aria-hidden="true" />
          </div>

          <div className="min-w-0">
            <h2 className="font-semibold tracking-tight text-foreground">
              Application Analytics
            </h2>
            <p className="mt-1 text-sm leading-5 text-muted-foreground">
              Overview of application status, categories, vendors, and user
              distribution.
            </p>
          </div>
        </div>
      </div>

      <div className="space-y-8 p-4 sm:p-6">
        <div>
          <div className="mb-4">
            <h3 className="text-sm font-semibold text-foreground">
              Application Status
            </h3>
            <p className="mt-1 text-xs text-muted-foreground">
              Current status across your SaaS inventory
            </p>
          </div>

          <div className="grid gap-3 sm:grid-cols-3">
            <StatusCard
              label="Active"
              value={data.status.active}
              total={totalStatus}
              accent="#852E4E"
            />
            <StatusCard
              label="Inactive"
              value={data.status.inactive}
              total={totalStatus}
              accent="#DC586D"
            />
            <StatusCard
              label="Archived"
              value={data.status.archived}
              total={totalStatus}
              accent="#A33757"
            />
          </div>
        </div>

        <div className="grid gap-8 border-t border-border/60 pt-7 lg:grid-cols-2">
          <div className="min-w-0">
            <div className="mb-4">
              <h3 className="text-sm font-semibold text-foreground">
                Applications by Category
              </h3>
              <p className="mt-1 text-xs text-muted-foreground">
                Distribution across your application categories
              </p>
            </div>

            <div className="rounded-xl border border-border/60 bg-background/70 p-3 sm:p-4">
              <CategoryDonutChart data={data.categories} total={data.total} />
            </div>
          </div>

          <div className="min-w-0">
            <AnalyticsList
              title="Top Vendors"
              description="Vendors with the most applications"
              items={data.vendors}
            />
          </div>
        </div>

        <div className="border-t border-border/60 pt-7">
          <div className="mb-5">
            <h3 className="text-sm font-semibold text-foreground">
              Application User Distribution
            </h3>
            <p className="mt-1 text-xs text-muted-foreground">
              Applications grouped by number of assigned users
            </p>
          </div>

          <div className="space-y-5">
            <AnalyticsRow
              label="0 users"
              value={data.userCountDistribution.zero}
              total={totalUserDistribution}
              accent="#A33757"
            />
            <AnalyticsRow
              label="1–10 users"
              value={data.userCountDistribution.low}
              total={totalUserDistribution}
              accent="#DC586D"
            />
            <AnalyticsRow
              label="11–100 users"
              value={data.userCountDistribution.medium}
              total={totalUserDistribution}
              accent="#852E4E"
            />
            <AnalyticsRow
              label="100+ users"
              value={data.userCountDistribution.high}
              total={totalUserDistribution}
              accent="#FB9590"
            />
          </div>
        </div>

        <div className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-border/60 bg-muted/20 px-4 py-3">
          <span className="text-sm text-muted-foreground">
            Total applications
          </span>
          <span className="text-lg font-semibold tabular-nums text-foreground">
            {data.total.toLocaleString()}
          </span>
        </div>
      </div>
    </section>
  );
}

interface StatusCardProps {
  label: string;
  value: number;
  total: number;
  accent: string;
}

function StatusCard({ label, value, total, accent }: StatusCardProps) {
  const percentage = total > 0 ? Math.round((value / total) * 100) : 0;

  return (
    <div className="rounded-xl border border-border/70 bg-background p-4 transition-colors hover:bg-muted/20">
      <div className="flex items-center justify-between gap-3">
        <div className="flex min-w-0 items-center gap-2">
          <span
            aria-hidden="true"
            className="size-2 shrink-0 rounded-full"
            style={{ backgroundColor: accent }}
          />
          <p className="truncate text-sm font-medium text-muted-foreground">
            {label}
          </p>
        </div>
        <span className="text-xs font-medium tabular-nums text-muted-foreground">
          {percentage}%
        </span>
      </div>

      <p className="mt-3 text-2xl font-semibold tracking-tight tabular-nums text-foreground">
        {value.toLocaleString()}
      </p>

      <div
        className="mt-3 h-1.5 overflow-hidden rounded-full bg-muted"
        role="progressbar"
        aria-valuenow={percentage}
        aria-valuemin={0}
        aria-valuemax={100}
        aria-label={`${label}: ${percentage}%`}
      >
        <div
          className="h-full rounded-full transition-all duration-500"
          style={{ width: `${percentage}%`, backgroundColor: accent }}
        />
      </div>
    </div>
  );
}

interface AnalyticsListProps {
  title: string;
  description: string;
  items: {
    name: string;
    count: number;
  }[];
}

function AnalyticsList({ title, description, items }: AnalyticsListProps) {
  const total = items.reduce((sum, item) => sum + item.count, 0);

  return (
    <div>
      <div className="mb-4">
        <h3 className="text-sm font-semibold text-foreground">{title}</h3>
        <p className="mt-1 text-xs text-muted-foreground">{description}</p>
      </div>

      {items.length === 0 ? (
        <div className="flex min-h-36 items-center justify-center rounded-xl border border-dashed border-border/70 bg-muted/10 p-6 text-center">
          <p className="text-sm text-muted-foreground">No data available.</p>
        </div>
      ) : (
        <div className="space-y-5 rounded-xl border border-border/60 bg-background/70 p-4">
          {items.map((item, index) => (
            <AnalyticsRow
              key={item.name}
              label={item.name}
              value={item.count}
              total={total}
              accent={
                ["#852E4E", "#DC586D", "#A33757", "#FB9590", "#FFBB94"][
                  index % 5
                ]
              }
            />
          ))}
        </div>
      )}
    </div>
  );
}

interface AnalyticsRowProps {
  label: string;
  value: number;
  total: number;
  accent?: string;
}

function AnalyticsRow({
  label,
  value,
  total,
  accent = "#852E4E",
}: AnalyticsRowProps) {
  const percentage = total > 0 ? Math.round((value / total) * 100) : 0;

  return (
    <div>
      <div className="flex items-center justify-between gap-4 text-sm">
        <span className="min-w-0 truncate font-medium text-foreground">
          {label}
        </span>
        <span className="shrink-0 tabular-nums text-muted-foreground">
          {value.toLocaleString()}{" "}
          <span className="text-xs">({percentage}%)</span>
        </span>
      </div>

      <div
        className="mt-2 h-2 overflow-hidden rounded-full bg-muted"
        role="progressbar"
        aria-valuenow={percentage}
        aria-valuemin={0}
        aria-valuemax={100}
        aria-label={`${label}: ${percentage}%`}
      >
        <div
          className="h-full rounded-full transition-all duration-500"
          style={{ width: `${percentage}%`, backgroundColor: accent }}
        />
      </div>
    </div>
  );
}
