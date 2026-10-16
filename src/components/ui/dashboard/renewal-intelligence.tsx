"use client";

import { CalendarDays, CircleCheck } from "lucide-react";

interface RenewalIntelligenceProps {
  data: {
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
  };
}

const categoryLabels = {
  expired: "Expired",
  this_week: "This Week",
  this_month: "This Month",
  next_month: "Next Month",
} as const;

export function RenewalIntelligence({ data }: RenewalIntelligenceProps) {
  return (
    <section className="overflow-hidden rounded-2xl border border-border/70 bg-card shadow-sm">
      <div className="border-b border-border/60 bg-linear-to-r from-[#852E4E]/[0.06] via-transparent to-[#FFBB94]/[0.12] px-5 py-5 sm:px-6">
        <div className="flex items-start gap-3">
          <div
            aria-hidden="true"
            className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-[#852E4E]/10 text-[#852E4E]"
          >
            <CalendarDays className="size-5" aria-hidden="true" />
          </div>

          <div className="min-w-0">
            <h2 className="font-semibold tracking-tight text-foreground">
              Renewal Intelligence
            </h2>
            <p className="mt-1 text-sm leading-5 text-muted-foreground">
              Subscriptions requiring attention based on renewal dates.
            </p>
          </div>
        </div>
      </div>

      <div className="grid gap-3 p-4 sm:grid-cols-2 sm:p-5">
        <RenewalSummaryCard
          label="Expired"
          value={data.expired}
          accent="bg-[#DC586D]"
          surface="bg-[#DC586D]/[0.06]"
        />
        <RenewalSummaryCard
          label="This Week"
          value={data.thisWeek}
          accent="bg-[#A33757]"
          surface="bg-[#A33757]/[0.05]"
        />
        <RenewalSummaryCard
          label="This Month"
          value={data.thisMonth}
          accent="bg-[#852E4E]"
          surface="bg-[#852E4E]/[0.05]"
        />
        <RenewalSummaryCard
          label="Next Month"
          value={data.nextMonth}
          accent="bg-[#FFBB94]"
          surface="bg-[#FFBB94]/[0.10]"
        />
      </div>

      <div className="px-4 pb-4 sm:px-5 sm:pb-5">
        {data.items.length === 0 ? (
          <div className="flex flex-col items-center justify-center rounded-xl border border-dashed border-border/80 bg-muted/10 px-5 py-10 text-center">
            <div
              aria-hidden="true"
              className="mb-3 flex size-11 items-center justify-center rounded-full bg-[#852E4E]/[0.08] text-[#852E4E]"
            >
              <CircleCheck className="size-5" aria-hidden="true" />
            </div>
            <p className="text-sm font-medium text-foreground">
              No renewal activity
            </p>
            <p className="mt-1 max-w-sm text-sm leading-5 text-muted-foreground">
              There are no subscriptions requiring attention in the current
              renewal window.
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto rounded-xl border border-border/70">
            <table className="w-full text-sm">
              <thead className="bg-muted/40">
                <tr>
                  <th
                    scope="col"
                    className="whitespace-nowrap px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-muted-foreground"
                  >
                    Application
                  </th>
                  <th
                    scope="col"
                    className="whitespace-nowrap px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-muted-foreground"
                  >
                    Plan
                  </th>
                  <th
                    scope="col"
                    className="whitespace-nowrap px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-muted-foreground"
                  >
                    Renewal Date
                  </th>
                  <th
                    scope="col"
                    className="whitespace-nowrap px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-muted-foreground"
                  >
                    Cost
                  </th>
                  <th
                    scope="col"
                    className="whitespace-nowrap px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-muted-foreground"
                  >
                    Period
                  </th>
                </tr>
              </thead>

              <tbody className="divide-y divide-border/60">
                {data.items.map((item) => (
                  <tr
                    key={item.id}
                    className="transition-colors hover:bg-muted/25"
                  >
                    <td className="whitespace-nowrap px-4 py-3.5 font-medium text-foreground">
                      {item.applicationName}
                    </td>
                    <td className="whitespace-nowrap px-4 py-3.5 text-muted-foreground">
                      {item.plan}
                    </td>
                    <td className="whitespace-nowrap px-4 py-3.5 text-foreground">
                      {formatDate(item.renewalDate)}
                    </td>
                    <td className="whitespace-nowrap px-4 py-3.5 font-medium tabular-nums text-foreground">
                      {formatCurrency(item.amount, item.currency)}
                    </td>
                    <td className="whitespace-nowrap px-4 py-3.5">
                      <RenewalCategoryBadge category={item.category} />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </section>
  );
}

interface RenewalSummaryCardProps {
  label: string;
  value: number;
  accent: string;
  surface: string;
}

function RenewalSummaryCard({
  label,
  value,
  accent,
  surface,
}: RenewalSummaryCardProps) {
  return (
    <div
      className={`relative overflow-hidden rounded-xl border border-border/60 p-4 ${surface}`}
    >
      <div
        aria-hidden="true"
        className={`absolute inset-y-0 left-0 w-1 ${accent}`}
      />
      <div className="pl-2">
        <p className="text-sm font-medium text-muted-foreground">{label}</p>
        <p className="mt-2 text-2xl font-semibold tracking-tight tabular-nums text-foreground">
          {value.toLocaleString()}
        </p>
      </div>
    </div>
  );
}

function RenewalCategoryBadge({
  category,
}: {
  category: keyof typeof categoryLabels;
}) {
  const styles: Record<keyof typeof categoryLabels, string> = {
    expired: "bg-[#DC586D]/10 text-[#A33757] ring-[#DC586D]/20",
    this_week: "bg-[#A33757]/10 text-[#852E4E] ring-[#A33757]/20",
    this_month: "bg-[#852E4E]/10 text-[#852E4E] ring-[#852E4E]/20",
    next_month: "bg-[#FFBB94]/25 text-[#6E2745] ring-[#FFBB94]/40",
  };

  return (
    <span
      className={`inline-flex items-center rounded-full px-2.5 py-1 text-xs font-medium ring-1 ring-inset ${styles[category]}`}
    >
      {categoryLabels[category]}
    </span>
  );
}

function formatDate(value: string) {
  return new Intl.DateTimeFormat("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  }).format(new Date(value));
}

function formatCurrency(amount: number, currency: string) {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency,
    maximumFractionDigits: 2,
  }).format(amount);
}
