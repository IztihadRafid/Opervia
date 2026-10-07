export function DashboardSkeleton() {
  return (
    <div className="space-y-8" aria-busy="true" aria-label="Loading dashboard">
      {/* Header */}
      <div className="space-y-2">
        <div className="h-8 w-40 animate-pulse rounded-md bg-muted" />
        <div className="h-4 w-64 animate-pulse rounded-md bg-muted" />
      </div>

      {/* KPI Metrics */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {Array.from({ length: 4 }).map((_, index) => (
          <div key={index} className="rounded-xl border bg-card p-5">
            <div className="h-4 w-24 animate-pulse rounded bg-muted" />
            <div className="mt-3 h-8 w-20 animate-pulse rounded bg-muted" />
            <div className="mt-2 h-3 w-36 animate-pulse rounded bg-muted" />
          </div>
        ))}
      </div>

      {/* Spending + Renewal */}
      <div className="grid gap-4 lg:grid-cols-7">
        <div className="min-h-[400px] rounded-xl border bg-card p-6 lg:col-span-4">
          <div className="h-5 w-40 animate-pulse rounded bg-muted" />
          <div className="mt-2 h-4 w-64 animate-pulse rounded bg-muted" />

          <div className="mt-6 h-8 w-72 animate-pulse rounded bg-muted" />
          <div className="mt-6 h-64 animate-pulse rounded-lg bg-muted/50" />
        </div>

        <div className="min-h-[400px] rounded-xl border bg-card p-6 lg:col-span-3">
          <div className="h-5 w-40 animate-pulse rounded bg-muted" />
          <div className="mt-2 h-4 w-56 animate-pulse rounded bg-muted" />

          <div className="mt-6 space-y-4">
            {Array.from({ length: 4 }).map((_, index) => (
              <div key={index} className="space-y-2">
                <div className="h-4 w-32 animate-pulse rounded bg-muted" />
                <div className="h-3 w-24 animate-pulse rounded bg-muted" />
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Analytics */}
      <div className="grid gap-4 lg:grid-cols-2">
        <div className="h-80 animate-pulse rounded-xl border bg-muted/30" />
        <div className="h-80 animate-pulse rounded-xl border bg-muted/30" />
      </div>

      {/* Recent Activity */}
      <div className="rounded-xl border bg-card p-6">
        <div className="h-5 w-36 animate-pulse rounded bg-muted" />
        <div className="mt-2 h-4 w-64 animate-pulse rounded bg-muted" />

        <div className="mt-6 h-32 animate-pulse rounded-lg bg-muted/50" />
      </div>
    </div>
  );
}
