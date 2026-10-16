"use client";

import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useOrganization } from "@/components/providers/organization-provider";
import {
  Activity as ActivityIcon,
  AlertCircle,
  CheckCircle2,
  ChevronLeft,
  ChevronRight,
  Clock3,
  CreditCard,
  FilePlus2,
  Loader2,
  Mail,
  RefreshCw,
  Sparkles,
  Trash2,
  UserPlus,
  Receipt,
  type LucideIcon,
} from "lucide-react";
import {
  useActivity,
  filterableActivityTypes,
  type ActivityItem,
  type ActivityType,
} from "@/hooks/useActivity";

const PAGE_SIZE = 10;

const activityMeta: Record<
  ActivityType,
  { label: string; icon: LucideIcon; color: string }
> = {
  application_added: {
    label: "Application added",
    icon: FilePlus2,
    color: "bg-[#FFBB94]/30 text-[#852E4E] ring-[#FFBB94]/60",
  },
  application_updated: {
    label: "Application updated",
    icon: RefreshCw,
    color: "bg-[#FB9590]/20 text-[#A33757] ring-[#FB9590]/40",
  },
  application_deleted: {
    label: "Application deleted",
    icon: Trash2,
    color: "bg-[#DC586D]/10 text-[#A33757] ring-[#DC586D]/30",
  },
  subscription_renewed: {
    label: "Subscription renewed",
    icon: CreditCard,
    color: "bg-[#FFBB94]/30 text-[#852E4E] ring-[#FFBB94]/60",
  },
  user_invited: {
    label: "User invited",
    icon: UserPlus,
    color: "bg-[#FB9590]/20 text-[#852E4E] ring-[#FB9590]/40",
  },
  invitation_revoked: {
    label: "Invitation revoked",
    icon: Mail,
    color: "bg-[#DC586D]/10 text-[#A33757] ring-[#DC586D]/30",
  },
  payment_processed: {
    label: "Payment processed",
    icon: CheckCircle2,
    color: "bg-[#FFBB94]/30 text-[#4C1D3D] ring-[#FFBB94]/60",
  },
  subscription_added: {
    label: "Subscription added",
    icon: CreditCard,
    color: "bg-[#FFBB94]/30 text-[#852E4E] ring-[#FFBB94]/60",
  },
  subscription_updated: {
    label: "Subscription updated",
    icon: RefreshCw,
    color: "bg-[#FB9590]/20 text-[#A33757] ring-[#FB9590]/40",
  },
  subscription_deleted: {
    label: "Subscription deleted",
    icon: Trash2,
    color: "bg-[#DC586D]/10 text-[#A33757] ring-[#DC586D]/30",
  },
  expense_created: {
    label: "Expense created",
    icon: Receipt,
    color: "bg-[#FFBB94]/30 text-[#852E4E] ring-[#FFBB94]/60",
  },
  expense_updated: {
    label: "Expense updated",
    icon: RefreshCw,
    color: "bg-[#FB9590]/20 text-[#A33757] ring-[#FB9590]/40",
  },
  expense_deleted: {
    label: "Expense deleted",
    icon: Trash2,
    color: "bg-[#DC586D]/10 text-[#A33757] ring-[#DC586D]/30",
  },
  license_created: {
    label: "License created",
    icon: FilePlus2,
    color: "bg-[#FFBB94]/30 text-[#852E4E] ring-[#FFBB94]/60",
  },
  license_updated: {
    label: "License updated",
    icon: RefreshCw,
    color: "bg-[#FB9590]/20 text-[#A33757] ring-[#FB9590]/40",
  },
  license_deleted: {
    label: "License deleted",
    icon: Trash2,
    color: "bg-[#DC586D]/10 text-[#A33757] ring-[#DC586D]/30",
  },
};

const filterOptions: { value: ActivityType | "all"; label: string }[] = [
  { value: "all", label: "All activity" },
  ...filterableActivityTypes.map((type) => ({
    value: type,
    label: activityMeta[type].label,
  })),
];

function getErrorMessage(error: unknown) {
  return error instanceof Error
    ? error.message
    : "Unable to load activity. Please try again.";
}

function formatDate(date: string) {
  const parsed = new Date(date);

  if (Number.isNaN(parsed.getTime())) return "Unknown date";

  return new Intl.DateTimeFormat("en", {
    month: "short",
    day: "numeric",
    year: "numeric",
    hour: "numeric",
    minute: "2-digit",
  }).format(parsed);
}

function formatRelativeTime(date: string) {
  const timestamp = new Date(date).getTime();

  if (Number.isNaN(timestamp)) return "Unknown time";

  const difference = Date.now() - timestamp;
  const minutes = Math.floor(difference / 60_000);
  const hours = Math.floor(difference / 3_600_000);
  const days = Math.floor(difference / 86_400_000);

  if (difference < 0 || minutes < 1) {
    return difference < 0 ? formatDate(date) : "Just now";
  }

  if (minutes < 60) return `${minutes}m ago`;
  if (hours < 24) return `${hours}h ago`;
  if (days < 7) return `${days}d ago`;

  return formatDate(date);
}

function ActivityTypeBadge({ type }: { type: ActivityType }) {
  const meta = activityMeta[type];
  const Icon = meta.icon;

  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-medium ring-1 ring-inset ${meta.color}`}
    >
      <Icon className="size-3.5" aria-hidden="true" />
      {meta.label}
    </span>
  );
}

function ActivityRow({ item }: { item: ActivityItem }) {
  const meta = activityMeta[item.type];
  const Icon = meta.icon;

  return (
    <article className="group relative flex gap-4 px-4 py-5 transition-colors hover:bg-[#FFF9F7] sm:px-6">
      <div className="relative flex shrink-0 flex-col items-center">
        <div
          className={`flex size-10 items-center justify-center rounded-xl ring-1 ring-inset transition-transform group-hover:scale-105 ${meta.color}`}
        >
          <Icon className="size-[18px]" aria-hidden="true" />
        </div>
        <div className="absolute top-12 -bottom-5 w-px bg-[#DC586D]/15 last:hidden" />
      </div>

      <div className="min-w-0 flex-1">
        <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
          <div className="min-w-0">
            <h3 className="text-sm font-semibold leading-6 text-[#4C1D3D]">
              {item.title}
            </h3>
            <p className="mt-1 whitespace-pre-wrap wrap-break-word text-sm leading-6 text-[#852E4E]/75">
              {item.description}
            </p>
          </div>

          <time
            dateTime={item.createdAt}
            title={formatDate(item.createdAt)}
            className="shrink-0 text-xs text-[#852E4E]/65 sm:pt-1"
          >
            {formatRelativeTime(item.createdAt)}
          </time>
        </div>

        <div className="mt-3">
          <ActivityTypeBadge type={item.type} />
        </div>
      </div>
    </article>
  );
}

export default function ActivityPage() {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const { selectedOrganization } = useOrganization();

  const pageParam = searchParams.get("page");
  const parsedPage = Number(pageParam);
  const page =
    pageParam !== null && Number.isInteger(parsedPage) && parsedPage > 0
      ? parsedPage
      : 1;

  const typeParam = searchParams.get("type");
  const typeFilter: ActivityType | "all" = filterableActivityTypes.some(
    (type) => type === typeParam,
  )
    ? (typeParam as ActivityType)
    : "all";

  const activityQuery = useActivity({
    page,
    limit: PAGE_SIZE,
    type: typeFilter === "all" ? undefined : typeFilter,
  });

  const result = activityQuery.data?.data;
  const activities = result?.activities ?? [];
  const pagination = result?.pagination;
  const totalPages = Math.max(pagination?.totalPages ?? 0, 1);

  function updateUrl(next: { page?: number; type?: ActivityType | "all" }) {
    const params = new URLSearchParams(searchParams.toString());
    const nextPage = next.page ?? page;
    const nextType = next.type ?? typeFilter;

    if (nextPage > 1) {
      params.set("page", String(nextPage));
    } else {
      params.delete("page");
    }

    if (nextType !== "all") {
      params.set("type", nextType);
    } else {
      params.delete("type");
    }

    const query = params.toString();

    router.replace(query ? `${pathname}?${query}` : pathname, {
      scroll: false,
    });
  }

  const isInitialLoading = activityQuery.isPending && !activityQuery.data;

  return (
    <div className="space-y-7 p-4 sm:p-6 lg:p-8">
      {/* Page header */}
      <section className="relative overflow-hidden rounded-3xl border border-[#DC586D]/25 bg-[#FBE7EC] p-5 shadow-sm sm:p-7 lg:p-8">
        <div className="relative flex flex-col gap-5 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <div className="mb-3 inline-flex items-center gap-2 rounded-full border border-[#A33757]/20 bg-[#FFF9F7] px-3 py-1.5 text-xs font-semibold text-[#852E4E]">
              <Sparkles className="size-3.5" aria-hidden="true" />
              Organization timeline
            </div>

            <h1 className="text-3xl font-bold tracking-tight text-[#4C1D3D]">
              Activity log
            </h1>
            <p className="mt-2 max-w-xl text-sm leading-6 text-[#4C1D3D]/85">
              Track important changes and events across your SaaS workspace in
              one place.
            </p>
          </div>

          <div className="flex items-center gap-3 self-start rounded-2xl border border-[#DC586D]/15 bg-[#FFF9F7] px-4 py-3 shadow-sm sm:self-auto">
            <div className="flex size-10 items-center justify-center rounded-xl bg-[#FFBB94]/40 text-[#852E4E]">
              <ActivityIcon className="size-5" aria-hidden="true" />
            </div>
            <div>
              <p className="text-2xl font-bold tabular-nums text-[#4C1D3D]">
                {pagination?.total ?? "—"}
              </p>
              <p className="text-xs text-[#852E4E]/70">Total recorded events</p>
            </div>
          </div>
        </div>
      </section>

      {/* Activity list */}
      <section className="overflow-hidden rounded-2xl border border-[#DC586D]/15 bg-white shadow-sm">
        <div className="flex flex-col gap-4 border-b border-[#DC586D]/15 p-5 sm:flex-row sm:items-center sm:justify-between sm:px-6">
          <div>
            <h2 className="font-semibold tracking-tight text-[#4C1D3D]">
              Workspace history
            </h2>
            <p className="mt-1 text-sm text-[#852E4E]/70">
              {pagination
                ? `Showing ${activities.length} of ${pagination.total} events on this page`
                : "Recent events from your organization"}
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <label
              htmlFor="activity-type-filter"
              className="text-sm font-medium text-[#852E4E]/75"
            >
              Filter
            </label>

            <select
              id="activity-type-filter"
              value={typeFilter}
              onChange={(event) =>
                updateUrl({
                  page: 1,
                  type: event.target.value as ActivityType | "all",
                })
              }
              className="h-10 min-w-44 rounded-xl border border-[#DC586D]/20 bg-white px-3 text-sm text-[#4C1D3D] outline-none transition hover:border-[#DC586D]/40 focus:border-[#A33757] focus:ring-4 focus:ring-[#FB9590]/20"
            >
              {filterOptions.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>

            <button
              type="button"
              onClick={() => void activityQuery.refetch()}
              disabled={activityQuery.isFetching || !selectedOrganization}
              aria-label="Refresh activity"
              className="inline-flex h-10 items-center justify-center gap-2 rounded-xl border border-[#DC586D]/20 bg-white px-3 text-sm font-semibold text-[#852E4E] transition hover:bg-[#FFF1E8] disabled:cursor-not-allowed disabled:opacity-50"
            >
              <RefreshCw
                className={`size-4 ${activityQuery.isFetching ? "animate-spin" : ""}`}
                aria-hidden="true"
              />
              <span className="hidden sm:inline">Refresh</span>
            </button>
          </div>
        </div>

        {!selectedOrganization ? (
          <div className="flex min-h-64 flex-col items-center justify-center px-6 py-12 text-center">
            <div className="flex size-12 items-center justify-center rounded-2xl bg-[#FFBB94]/30 text-[#852E4E]">
              <AlertCircle className="size-6" aria-hidden="true" />
            </div>
            <h3 className="mt-4 font-semibold text-[#4C1D3D]">
              Select an organization
            </h3>
            <p className="mt-1 max-w-sm text-sm text-[#852E4E]/70">
              Choose an organization to view its activity history.
            </p>
          </div>
        ) : isInitialLoading ? (
          <div className="divide-y divide-[#DC586D]/10">
            {Array.from({ length: 5 }).map((_, index) => (
              <div key={index} className="flex animate-pulse gap-4 px-6 py-5">
                <div className="size-10 shrink-0 rounded-xl bg-[#FFBB94]/30" />
                <div className="flex-1 space-y-3 py-1">
                  <div className="h-4 w-2/5 rounded bg-[#FFBB94]/30" />
                  <div className="h-3 w-4/5 rounded bg-[#FFBB94]/20" />
                  <div className="h-5 w-32 rounded-full bg-[#FB9590]/20" />
                </div>
              </div>
            ))}
          </div>
        ) : activityQuery.isError ? (
          <div className="flex min-h-64 flex-col items-center justify-center px-6 py-12 text-center">
            <div className="flex size-12 items-center justify-center rounded-2xl bg-[#DC586D]/10 text-[#A33757]">
              <AlertCircle className="size-6" aria-hidden="true" />
            </div>
            <h3 className="mt-4 font-semibold text-[#4C1D3D]">
              Couldn’t load activity
            </h3>
            <p className="mt-1 max-w-md text-sm text-[#852E4E]/70">
              {getErrorMessage(activityQuery.error)}
            </p>
            <button
              type="button"
              onClick={() => void activityQuery.refetch()}
              className="mt-5 inline-flex h-10 items-center gap-2 rounded-xl bg-[#4C1D3D] px-4 text-sm font-semibold text-white transition hover:bg-[#852E4E]"
            >
              <RefreshCw className="size-4" aria-hidden="true" />
              Try again
            </button>
          </div>
        ) : activities.length === 0 ? (
          <div className="flex min-h-64 flex-col items-center justify-center px-6 py-12 text-center">
            <div className="flex size-12 items-center justify-center rounded-2xl bg-[#FFBB94]/30 text-[#852E4E]">
              <Clock3 className="size-6" aria-hidden="true" />
            </div>
            <h3 className="mt-4 font-semibold text-[#4C1D3D]">
              {typeFilter === "all"
                ? "No activity recorded yet"
                : "No matching activity"}
            </h3>
            <p className="mt-1 max-w-md text-sm text-[#852E4E]/70">
              {typeFilter === "all"
                ? "When changes happen across your workspace, they’ll appear here."
                : "Try another activity type to see more events."}
            </p>
            {typeFilter !== "all" && (
              <button
                type="button"
                onClick={() => updateUrl({ page: 1, type: "all" })}
                className="mt-4 text-sm font-semibold text-[#A33757] hover:text-[#4C1D3D] hover:underline"
              >
                Clear filter
              </button>
            )}
          </div>
        ) : (
          <>
            <div className="divide-y divide-[#DC586D]/10">
              {activities.map((item) => (
                <ActivityRow key={item._id} item={item} />
              ))}
            </div>

            <div className="flex flex-col gap-4 border-t border-[#DC586D]/15 bg-[#FFF9F7] px-5 py-4 sm:flex-row sm:items-center sm:justify-between sm:px-6">
              <p className="text-sm text-[#852E4E]/75">
                Page{" "}
                <span className="font-semibold tabular-nums text-[#4C1D3D]">
                  {page}
                </span>{" "}
                of{" "}
                <span className="font-semibold tabular-nums text-[#4C1D3D]">
                  {totalPages}
                </span>
                {pagination ? ` · ${pagination.total} total events` : ""}
              </p>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => updateUrl({ page: Math.max(1, page - 1) })}
                  disabled={page <= 1 || activityQuery.isFetching}
                  className="inline-flex h-10 items-center gap-1 rounded-xl border border-[#DC586D]/20 bg-white px-3 text-sm font-semibold text-[#852E4E] transition hover:bg-[#FFF1E8] disabled:cursor-not-allowed disabled:opacity-40"
                >
                  <ChevronLeft className="size-4" aria-hidden="true" />
                  Previous
                </button>

                <button
                  type="button"
                  onClick={() =>
                    updateUrl({ page: Math.min(totalPages, page + 1) })
                  }
                  disabled={
                    page >= totalPages ||
                    activityQuery.isFetching ||
                    !pagination?.total
                  }
                  className="inline-flex h-10 items-center gap-1 rounded-xl bg-[#4C1D3D] px-3 text-sm font-semibold text-white transition hover:bg-[#852E4E] disabled:cursor-not-allowed disabled:opacity-40"
                >
                  Next
                  <ChevronRight className="size-4" aria-hidden="true" />
                </button>
              </div>
            </div>
          </>
        )}
      </section>

      {activityQuery.isFetching && !isInitialLoading && (
        <p
          role="status"
          className="flex items-center justify-center gap-2 text-xs text-[#852E4E]/70"
        >
          <Loader2 className="size-3.5 animate-spin" aria-hidden="true" />
          Updating activity…
        </p>
      )}
    </div>
  );
}
