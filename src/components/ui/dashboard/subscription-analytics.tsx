"use client";

import { CreditCard } from "lucide-react";

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
    <section className="overflow-hidden rounded-2xl border border-border/70 bg-card shadow-sm">
      <div className="border-b border-border/60 bg-gradient-to-r from-[#852E4E]/[0.06] via-transparent to-[#FFBB94]/[0.12] px-5 py-5 sm:px-6">
        <div className="flex items-start gap-3">
          <div
            aria-hidden="true"
            className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-[#DC586D]/10 text-[#A33757]"
          >
            <CreditCard className="size-5" aria-hidden="true" />
          </div>

          <div className="min-w-0">
            <h2 className="font-semibold tracking-tight text-foreground">
              Subscription Analytics
            </h2>
            <p className="mt-1 text-sm leading-5 text-muted-foreground">
              Overview of subscription status, billing cycles, and monthly cost.
            </p>
          </div>
        </div>
      </div>

      <div className="space-y-8 p-4 sm:p-6">
        <div className="grid gap-3 sm:grid-cols-3">
          <StatusCard
            label="Active"
            value={data.active}
            accent="#852E4E"
            surface="bg-[#852E4E]/[0.04]"
          />
          <StatusCard
            label="Expired"
            value={data.expired}
            accent="#DC586D"
            surface="bg-[#DC586D]/[0.04]"
          />
          <StatusCard
            label="Renewing Soon"
            value={data.upcomingRenewals}
            accent="#A33757"
            surface="bg-[#FFBB94]/[0.12]"
          />
        </div>

        <div className="grid gap-8 border-t border-border/60 pt-7 lg:grid-cols-2">
          <div className="min-w-0">
            <div className="mb-5">
              <h3 className="text-sm font-semibold text-foreground">
                Billing Cycle
              </h3>
              <p className="mt-1 text-xs leading-5 text-muted-foreground">
                Distribution of active and paused subscriptions
              </p>
            </div>

            <div className="space-y-5 rounded-xl border border-border/60 bg-background/70 p-4">
              <AnalyticsRow
                label="Monthly"
                value={data.billingCycle.monthly}
                total={totalBillingCycles}
                accent="#DC586D"
              />
              <AnalyticsRow
                label="Quarterly"
                value={data.billingCycle.quarterly}
                total={totalBillingCycles}
                accent="#A33757"
              />
              <AnalyticsRow
                label="Yearly"
                value={data.billingCycle.yearly}
                total={totalBillingCycles}
                accent="#852E4E"
              />
            </div>
          </div>

          <div className="min-w-0">
            <div className="mb-5">
              <h3 className="text-sm font-semibold text-foreground">
                Monthly Cost Distribution
              </h3>
              <p className="mt-1 text-xs leading-5 text-muted-foreground">
                Based on normalized monthly subscription cost
              </p>
            </div>

            <div className="space-y-5 rounded-xl border border-border/60 bg-background/70 p-4">
              <AnalyticsRow
                label="Under $100"
                value={data.costDistribution.low}
                total={totalCostDistribution}
                accent="#FB9590"
              />
              <AnalyticsRow
                label="$100–$499"
                value={data.costDistribution.medium}
                total={totalCostDistribution}
                accent="#DC586D"
              />
              <AnalyticsRow
                label="$500+"
                value={data.costDistribution.high}
                total={totalCostDistribution}
                accent="#852E4E"
              />
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

interface StatusCardProps {
  label: string;
  value: number;
  accent: string;
  surface: string;
}

function StatusCard({ label, value, accent, surface }: StatusCardProps) {
  return (
    <div
      className={`relative overflow-hidden rounded-xl border border-border/60 p-4 ${surface}`}
    >
      <div
        aria-hidden="true"
        className="absolute inset-y-0 left-0 w-1"
        style={{ backgroundColor: accent }}
      />
      <div className="pl-2">
        <p className="text-sm font-medium text-muted-foreground">{label}</p>
        <p className="mt-3 text-2xl font-semibold tracking-tight tabular-nums text-foreground">
          {value.toLocaleString()}
        </p>
      </div>
    </div>
  );
}

interface AnalyticsRowProps {
  label: string;
  value: number;
  total: number;
  accent: string;
}

function AnalyticsRow({ label, value, total, accent }: AnalyticsRowProps) {
  const percentage = total > 0 ? Math.round((value / total) * 100) : 0;

  return (
    <div>
      <div className="flex items-center justify-between gap-3 text-sm">
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
          style={{
            width: `${percentage}%`,
            backgroundColor: accent,
          }}
        />
      </div>
    </div>
  );
}
