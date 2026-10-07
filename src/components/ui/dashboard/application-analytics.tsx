"use client";

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
    <section className="rounded-xl border bg-card p-6">
      <div>
        <h2 className="font-semibold">Application Analytics</h2>
        <p className="mt-1 text-sm text-muted-foreground">
          Overview of application status, categories, vendors, and user
          distribution.
        </p>
      </div>

      {/* Status */}
      <div className="mt-6">
        <div className="mb-4">
          <h3 className="text-sm font-medium">Application Status</h3>
          <p className="text-xs text-muted-foreground">
            Current status across your SaaS inventory
          </p>
        </div>

        <div className="grid gap-4 sm:grid-cols-3">
          <StatusCard
            label="Active"
            value={data.status.active}
            total={totalStatus}
          />

          <StatusCard
            label="Inactive"
            value={data.status.inactive}
            total={totalStatus}
          />

          <StatusCard
            label="Archived"
            value={data.status.archived}
            total={totalStatus}
          />
        </div>
      </div>

      {/* Categories & Vendors */}
      <div className="mt-8 grid gap-8 lg:grid-cols-2 ">
        <AnalyticsList
          title="Top Categories"
          description="Most common application categories"
          items={data.categories}
        />

        <AnalyticsList
          title="Top Vendors"
          description="Vendors with the most applications"
          items={data.vendors}
        />
      </div>

      {/* User Distribution */}
      <div className="mt-8">
        <div className="mb-4">
          <h3 className="text-sm font-medium">Application User Distribution</h3>
          <p className="text-xs text-muted-foreground">
            Applications grouped by number of assigned users
          </p>
        </div>

        <div className="space-y-4">
          <AnalyticsRow
            label="0 users"
            value={data.userCountDistribution.zero}
            total={totalUserDistribution}
          />

          <AnalyticsRow
            label="1 – 10 users"
            value={data.userCountDistribution.low}
            total={totalUserDistribution}
          />

          <AnalyticsRow
            label="11 – 100 users"
            value={data.userCountDistribution.medium}
            total={totalUserDistribution}
          />

          <AnalyticsRow
            label="100+ users"
            value={data.userCountDistribution.high}
            total={totalUserDistribution}
          />
        </div>
      </div>

      <div className="mt-6 border-t pt-4">
        <p className="text-sm text-muted-foreground">
          Total applications:{" "}
          <span className="font-medium text-foreground">{data.total}</span>
        </p>
      </div>
    </section>
  );
}

interface StatusCardProps {
  label: string;
  value: number;
  total: number;
}

function StatusCard({ label, value, total }: StatusCardProps) {
  const percentage = total > 0 ? Math.round((value / total) * 100) : 0;

  return (
    <div className="rounded-lg border bg-background p-4">
      <div className="flex items-center justify-between gap-4">
        <p className="text-sm text-muted-foreground">{label}</p>

        <span className="text-xs text-muted-foreground">{percentage}%</span>
      </div>

      <p className="mt-2 text-2xl font-semibold">{value}</p>

      <div
        className="mt-3 h-2 overflow-hidden rounded-full bg-muted"
        role="progressbar"
        aria-valuenow={percentage}
        aria-valuemin={0}
        aria-valuemax={100}
        aria-label={`${label}: ${percentage}%`}
      >
        <div
          className="h-full rounded-full bg-primary transition-all duration-500"
          style={{ width: `${percentage}%` }}
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
        <h3 className="text-sm font-medium">{title}</h3>
        <p className="text-xs text-muted-foreground">{description}</p>
      </div>

      {items.length === 0 ? (
        <div className="rounded-lg border border-dashed p-6 text-center">
          <p className="text-sm text-muted-foreground">No data available.</p>
        </div>
      ) : (
        <div className="space-y-4">
          {items.map((item) => (
            <AnalyticsRow
              key={item.name}
              label={item.name}
              value={item.count}
              total={total}
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
}

function AnalyticsRow({ label, value, total }: AnalyticsRowProps) {
  const percentage = total > 0 ? Math.round((value / total) * 100) : 0;

  return (
    <div>
      <div className="flex items-center justify-between gap-4 text-sm">
        <span className="truncate">{label}</span>

        <span className="shrink-0 text-muted-foreground">
          {value} <span className="text-xs">({percentage}%)</span>
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
          className="h-full rounded-full bg-primary transition-all duration-500"
          style={{ width: `${percentage}%` }}
        />
      </div>
    </div>
  );
}
