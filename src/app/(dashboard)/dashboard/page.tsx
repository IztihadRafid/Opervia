import { SpendingChart } from "@/components/ui/dashboard/charts/spending-chart";
import { ActivityItem } from "@/components/ui/dashboard/activity-item";
import { MetricCard } from "@/components/ui/dashboard/metric-card";
import { RenewalItem } from "@/components/ui/dashboard/renewal-item";
import {
  DashboardMetric,
  RecentActivity,
  UpcomingRenewal,
} from "../../../../types/dashboard";

const metrics: DashboardMetric[] = [
  {
    title: "Applications",
    value: "128",
    description: "12 added this month",
  },
  {
    title: "Monthly Spend",
    value: "$42,840",
    description: "8.4% from last month",
  },
  {
    title: "Active Users",
    value: "1,284",
    description: "94.2% active",
  },
  {
    title: "Renewals",
    value: "18",
    description: "Next 30 days",
  },
];

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
            <SpendingChart />
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
