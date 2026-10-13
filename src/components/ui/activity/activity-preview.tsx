"use client";

import Link from "next/link";
import {
  Activity,
  CheckCircle2,
  CreditCard,
  FilePlus2,
  Mail,
  Receipt,
  RefreshCw,
  Trash2,
  UserPlus,
  type LucideIcon,
} from "lucide-react";
import {
  useActivity,
  type ActivityItem,
  type ActivityType,
} from "@/hooks/useActivity";

const activityMeta: Partial<
  Record<ActivityType, { icon: LucideIcon; color: string }>
> = {
  application_added: {
    icon: FilePlus2,
    color: "bg-violet-500/10 text-violet-600 dark:text-violet-400",
  },
  application_updated: {
    icon: RefreshCw,
    color: "bg-blue-500/10 text-blue-600 dark:text-blue-400",
  },
  application_deleted: {
    icon: Trash2,
    color: "bg-rose-500/10 text-rose-600 dark:text-rose-400",
  },
  subscription_added: {
    icon: CreditCard,
    color: "bg-indigo-500/10 text-indigo-600 dark:text-indigo-400",
  },
  subscription_updated: {
    icon: RefreshCw,
    color: "bg-cyan-500/10 text-cyan-600 dark:text-cyan-400",
  },
  subscription_deleted: {
    icon: Trash2,
    color: "bg-rose-500/10 text-rose-600 dark:text-rose-400",
  },
  subscription_renewed: {
    icon: CreditCard,
    color: "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400",
  },
  user_invited: {
    icon: UserPlus,
    color: "bg-sky-500/10 text-sky-600 dark:text-sky-400",
  },
  invitation_revoked: {
    icon: Mail,
    color: "bg-amber-500/10 text-amber-600 dark:text-amber-400",
  },
  payment_processed: {
    icon: CheckCircle2,
    color: "bg-teal-500/10 text-teal-600 dark:text-teal-400",
  },
  expense_created: {
    icon: Receipt,
    color: "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400",
  },
  expense_updated: {
    icon: RefreshCw,
    color: "bg-amber-500/10 text-amber-600 dark:text-amber-400",
  },
  expense_deleted: {
    icon: Trash2,
    color: "bg-rose-500/10 text-rose-600 dark:text-rose-400",
  },
};

function formatRelativeTime(date: string) {
  const timestamp = new Date(date).getTime();

  if (Number.isNaN(timestamp)) return "Unknown time";

  const difference = Date.now() - timestamp;
  const minutes = Math.floor(difference / 60_000);
  const hours = Math.floor(difference / 3_600_000);
  const days = Math.floor(difference / 86_400_000);

  if (difference < 0) {
    return new Intl.DateTimeFormat("en", {
      month: "short",
      day: "numeric",
      hour: "numeric",
      minute: "2-digit",
    }).format(new Date(date));
  }

  if (minutes < 1) return "Just now";
  if (minutes < 60) return `${minutes}m ago`;
  if (hours < 24) return `${hours}h ago`;
  if (days < 7) return `${days}d ago`;

  return new Intl.DateTimeFormat("en", {
    month: "short",
    day: "numeric",
    year: "numeric",
  }).format(new Date(date));
}

function PreviewRow({ item }: { item: ActivityItem }) {
  const meta = activityMeta[item.type];
  const Icon = meta?.icon ?? Activity;

  return (
    <article className="flex items-start gap-3 py-3">
      <div
        className={`flex size-9 shrink-0 items-center justify-center rounded-xl ${
          meta?.color ?? "bg-muted text-muted-foreground"
        }`}
      >
        <Icon className="size-4" aria-hidden="true" />
      </div>

      <div className="min-w-0 flex-1">
        <p className="text-sm font-medium leading-5 text-foreground">
          {item.title}
        </p>
        <p className="mt-1 line-clamp-2 text-xs leading-5 text-muted-foreground">
          {item.description}
        </p>
      </div>

      <time
        dateTime={item.createdAt}
        className="shrink-0 pt-0.5 text-xs text-muted-foreground"
      >
        {formatRelativeTime(item.createdAt)}
      </time>
    </article>
  );
}

export function ActivityPreview() {
  const activityQuery = useActivity({ page: 1, limit: 5 });
  const activities = activityQuery.data?.data.activities ?? [];

  return (
    <section
      aria-labelledby="recent-activity-title"
      className="rounded-xl border bg-card p-5 sm:p-6"
    >
      <div className="flex items-start justify-between gap-4">
        <div>
          <h2 id="recent-activity-title" className="font-semibold">
            Recent Activity
          </h2>
          <p className="mt-1 text-sm text-muted-foreground">
            Latest changes across your SaaS environment
          </p>
        </div>

        <Link
          href="/activity"
          className="shrink-0 text-sm font-medium text-primary transition hover:underline"
        >
          View all
        </Link>
      </div>

      <div className="mt-4 divide-y">
        {!activityQuery.data && activityQuery.isPending ? (
          Array.from({ length: 3 }).map((_, index) => (
            <div key={index} className="flex animate-pulse gap-3 py-4">
              <div className="size-9 rounded-xl bg-muted" />
              <div className="flex-1 space-y-2 py-1">
                <div className="h-3.5 w-2/5 rounded bg-muted" />
                <div className="h-3 w-4/5 rounded bg-muted" />
              </div>
            </div>
          ))
        ) : activityQuery.isError ? (
          <div className="py-8 text-center">
            <p className="text-sm text-muted-foreground">
              Couldn&apos;t load recent activity.
            </p>
            <button
              type="button"
              onClick={() => void activityQuery.refetch()}
              className="mt-2 text-sm font-medium text-primary hover:underline"
            >
              Try again
            </button>
          </div>
        ) : activities.length === 0 ? (
          <div className="py-8 text-center">
            <div className="mx-auto flex size-10 items-center justify-center rounded-xl bg-muted text-muted-foreground">
              <Activity className="size-5" aria-hidden="true" />
            </div>
            <p className="mt-3 text-sm font-medium">No recent activity</p>
            <p className="mt-1 text-xs text-muted-foreground">
              Activity will appear here as changes are recorded.
            </p>
          </div>
        ) : (
          activities.map((item) => <PreviewRow key={item._id} item={item} />)
        )}
      </div>
    </section>
  );
}
