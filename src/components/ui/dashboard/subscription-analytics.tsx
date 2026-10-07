"use client";

interface SubscriptionAnalyticsProps {
  data: {
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

export function SubscriptionAnalytics({ data }: SubscriptionAnalyticsProps) {
  const totalBillingCycles =
    data.billingCycle.monthly +
    data.billingCycle.quarterly +
    data.billingCycle.yearly;

  const totalCostDistribution =
    data.costDistribution.low +
    data.costDistribution.medium +
    data.costDistribution.high;

  return (
    <section className="rounded-xl border bg-card p-6">
      <div>
        <h2 className="font-semibold">Subscription Analytics</h2>

        <p className="mt-1 text-sm text-muted-foreground">
          Overview of subscription status, billing cycles, and monthly cost.
        </p>
      </div>

      <div className="mt-6 grid gap-4 sm:grid-cols-3">
        <div className="rounded-lg border bg-background p-4">
          <p className="text-sm text-muted-foreground">Active</p>

          <p className="mt-2 text-2xl font-semibold">{data.active}</p>
        </div>

        <div className="rounded-lg border bg-background p-4">
          <p className="text-sm text-muted-foreground">Expired</p>

          <p className="mt-2 text-2xl font-semibold">{data.expired}</p>
        </div>

        <div className="rounded-lg border bg-background p-4">
          <p className="text-sm text-muted-foreground">Renewing Soon</p>

          <p className="mt-2 text-2xl font-semibold">{data.upcomingRenewals}</p>
        </div>
      </div>

      <div className="mt-6 grid gap-6 lg:grid-cols-2">
        <div>
          <div className="mb-4">
            <h3 className="text-sm font-medium">Billing Cycle</h3>

            <p className="text-xs text-muted-foreground">
              Distribution of active and paused subscriptions
            </p>
          </div>

          <div className="space-y-4">
            <AnalyticsRow
              label="Monthly"
              value={data.billingCycle.monthly}
              total={totalBillingCycles}
            />

            <AnalyticsRow
              label="Quarterly"
              value={data.billingCycle.quarterly}
              total={totalBillingCycles}
            />

            <AnalyticsRow
              label="Yearly"
              value={data.billingCycle.yearly}
              total={totalBillingCycles}
            />
          </div>
        </div>

        <div>
          <div className="mb-4">
            <h3 className="text-sm font-medium">Monthly Cost Distribution</h3>

            <p className="text-xs text-muted-foreground">
              Based on normalized monthly subscription cost
            </p>
          </div>

          <div className="space-y-4">
            <AnalyticsRow
              label="Under $100"
              value={data.costDistribution.low}
              total={totalCostDistribution}
            />

            <AnalyticsRow
              label="$100 – $499"
              value={data.costDistribution.medium}
              total={totalCostDistribution}
            />

            <AnalyticsRow
              label="$500+"
              value={data.costDistribution.high}
              total={totalCostDistribution}
            />
          </div>
        </div>
      </div>
    </section>
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
      <div className="flex items-center justify-between text-sm">
        <span>{label}</span>

        <span className="text-muted-foreground">
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
          style={{
            width: `${percentage}%`,
          }}
        />
      </div>
    </div>
  );
}
