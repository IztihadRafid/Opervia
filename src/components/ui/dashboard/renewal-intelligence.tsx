"use client";

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
    <section className="rounded-xl border bg-card p-6">
      <div>
        <h2 className="font-semibold">Renewal Intelligence</h2>
        <p className="mt-1 text-sm text-muted-foreground">
          Subscriptions requiring attention based on renewal dates.
        </p>
      </div>

      <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <RenewalSummaryCard label="Expired" value={data.expired} />

        <RenewalSummaryCard label="This Week" value={data.thisWeek} />

        <RenewalSummaryCard label="This Month" value={data.thisMonth} />

        <RenewalSummaryCard label="Next Month" value={data.nextMonth} />
      </div>

      <div className="mt-8">
        {data.items.length === 0 ? (
          <div className="rounded-lg border border-dashed p-8 text-center">
            <p className="text-sm font-medium">No renewal activity</p>

            <p className="mt-1 text-sm text-muted-foreground">
              There are no subscriptions requiring attention in the current
              renewal window.
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto rounded-lg border">
            <table className="w-full text-sm">
              <thead className="border-b bg-muted/40">
                <tr>
                  <th scope="col" className="px-4 py-3 text-left font-medium">
                    Application
                  </th>

                  <th scope="col" className="px-4 py-3 text-left font-medium">
                    Plan
                  </th>

                  <th scope="col" className="px-4 py-3 text-left font-medium">
                    Renewal Date
                  </th>

                  <th scope="col" className="px-4 py-3 text-left font-medium">
                    Cost
                  </th>

                  <th scope="col" className="px-4 py-3 text-left font-medium">
                    Period
                  </th>
                </tr>
              </thead>

              <tbody className="divide-y">
                {data.items.map((item) => (
                  <tr key={item.id}>
                    <td className="px-4 py-3 font-medium">
                      {item.applicationName}
                    </td>

                    <td className="px-4 py-3 text-muted-foreground">
                      {item.plan}
                    </td>

                    <td className="px-4 py-3">
                      {formatDate(item.renewalDate)}
                    </td>

                    <td className="px-4 py-3">
                      {formatCurrency(item.amount, item.currency)}
                    </td>

                    <td className="px-4 py-3">
                      <span className="rounded-full bg-muted px-2.5 py-1 text-xs">
                        {categoryLabels[item.category]}
                      </span>
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
}

function RenewalSummaryCard({ label, value }: RenewalSummaryCardProps) {
  return (
    <div className="rounded-lg border bg-background p-4">
      <p className="text-sm text-muted-foreground">{label}</p>

      <p className="mt-2 text-2xl font-semibold">{value}</p>
    </div>
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
