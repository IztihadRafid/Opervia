import { SpendingChart } from "@/components/ui/dashboard/charts/spending-chart";

export default function DashboardPage() {
  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-semibold tracking-tight">Dashboard</h1>

        <p className="mt-1 text-sm text-muted-foreground">
          Overview of your SaaS environment.
        </p>
      </div>

      {/* Metrics */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <MetricCard
          title="Applications"
          value="128"
          description="12 added this month"
        />

        <MetricCard
          title="Monthly Spend"
          value="$42,840"
          description="8.4% from last month"
        />

        <MetricCard
          title="Active Users"
          value="1,284"
          description="94.2% active"
        />

        <MetricCard title="Renewals" value="18" description="Next 30 days" />
      </div>

      {/* Main dashboard content */}
      <div className="grid gap-4 lg:grid-cols-7">
        {/* Spending Overview */}
        <div className="min-h-[400px] rounded-xl border bg-card p-6 lg:col-span-4">
          <div>
            <h2 className="font-semibold">Spending Overview</h2>

            <p className="text-sm text-muted-foreground">
              SaaS spending over the last 12 months
            </p>
          </div>

          <div className="mt-6">
            <SpendingChart />
          </div>
        </div>

        {/* Upcoming Renewals */}
        <div className="min-h-[400px] rounded-xl border bg-card p-6 lg:col-span-3">
          <div>
            <h2 className="font-semibold">Upcoming Renewals</h2>

            <p className="text-sm text-muted-foreground">
              Subscriptions requiring attention
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

function MetricCard({
  title,
  value,
  description,
}: {
  title: string;
  value: string;
  description: string;
}) {
  return (
    <div className="rounded-xl border bg-card p-5">
      <p className="text-sm font-medium text-muted-foreground">{title}</p>

      <p className="mt-2 text-2xl font-semibold tracking-tight">{value}</p>

      <p className="mt-1 text-xs text-muted-foreground">{description}</p>
    </div>
  );
}
