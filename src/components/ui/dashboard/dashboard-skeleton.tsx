export function DashboardSkeleton() {
  return (
    <div
      className="space-y-8"
      aria-busy="true"
      aria-label="Loading dashboard"
      role="status"
    >
      <span className="sr-only">Loading dashboard content...</span>

      {/* Header */}
      <div className="space-y-2">
        <div className="h-8 w-40 animate-pulse rounded-lg bg-[#852E4E]/10" />
        <div className="h-4 w-64 max-w-full animate-pulse rounded-md bg-muted" />
      </div>

      {/* KPI Metrics */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {Array.from({ length: 4 }).map((_, index) => (
          <div
            key={index}
            className="relative overflow-hidden rounded-2xl border border-border/70 bg-card p-5 shadow-sm sm:p-6"
          >
            <div
              aria-hidden="true"
              className={`absolute inset-x-0 top-0 h-1 ${
                [
                  "bg-[#852E4E]/50",
                  "bg-[#DC586D]/50",
                  "bg-[#FB9590]/60",
                  "bg-[#A33757]/50",
                ][index]
              }`}
            />
            <div className="h-4 w-24 max-w-full animate-pulse rounded bg-muted" />
            <div className="mt-4 h-9 w-28 max-w-full animate-pulse rounded-lg bg-[#852E4E]/10" />
            <div className="mt-3 h-3 w-36 max-w-full animate-pulse rounded bg-muted/80" />
          </div>
        ))}
      </div>

      {/* Spending + Renewal */}
      <div className="grid gap-4 lg:grid-cols-7">
        <div className="min-h-[400px] rounded-2xl border border-border/70 bg-card p-5 shadow-sm sm:p-6 lg:col-span-4">
          <div className="h-5 w-40 max-w-full animate-pulse rounded bg-muted" />
          <div className="mt-2 h-4 w-64 max-w-full animate-pulse rounded bg-muted/70" />

          <div className="mt-6 flex flex-wrap gap-2">
            {Array.from({ length: 5 }).map((_, index) => (
              <div
                key={index}
                className={`h-8 w-16 animate-pulse rounded-lg ${
                  index === 4 ? "bg-[#852E4E]/10" : "bg-muted/70"
                }`}
              />
            ))}
          </div>

          <div className="mt-6 flex h-[280px] items-end gap-3 rounded-xl bg-gradient-to-b from-[#DC586D]/[0.05] to-transparent px-4 pt-8 sm:h-[300px]">
            {[38, 56, 44, 72, 61, 84, 67, 92, 58, 75, 48, 65].map(
              (height, index) => (
                <div
                  key={index}
                  className="flex-1 animate-pulse rounded-t-md bg-[#DC586D]/15"
                  style={{ height: `${height}%` }}
                />
              ),
            )}
          </div>
        </div>

        <div className="min-h-[400px] overflow-hidden rounded-2xl border border-border/70 bg-card p-5 shadow-sm sm:p-6 lg:col-span-3">
          <div className="h-5 w-40 max-w-full animate-pulse rounded bg-muted" />
          <div className="mt-2 h-4 w-56 max-w-full animate-pulse rounded bg-muted/70" />

          <div className="mt-6 grid grid-cols-2 gap-3">
            {Array.from({ length: 4 }).map((_, index) => (
              <div
                key={index}
                className="rounded-xl border border-border/50 bg-muted/20 p-3"
              >
                <div className="h-3 w-16 max-w-full animate-pulse rounded bg-muted" />
                <div className="mt-3 h-7 w-10 animate-pulse rounded bg-[#852E4E]/10" />
              </div>
            ))}
          </div>

          <div className="mt-6 space-y-4">
            {Array.from({ length: 3 }).map((_, index) => (
              <div
                key={index}
                className="rounded-lg border border-border/50 p-3"
              >
                <div className="h-4 w-32 max-w-full animate-pulse rounded bg-muted" />
                <div className="mt-3 h-2 w-full animate-pulse rounded-full bg-muted/70" />
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Analytics */}
      <div className="grid gap-4 lg:grid-cols-2">
        {Array.from({ length: 2 }).map((_, index) => (
          <div
            key={index}
            className="overflow-hidden rounded-2xl border border-border/70 bg-card shadow-sm"
          >
            <div className="border-b border-border/60 bg-gradient-to-r from-[#852E4E]/[0.05] to-[#FFBB94]/[0.08] p-5 sm:p-6">
              <div className="h-5 w-44 max-w-full animate-pulse rounded bg-muted" />
              <div className="mt-2 h-4 w-64 max-w-full animate-pulse rounded bg-muted/70" />
            </div>

            <div className="space-y-5 p-5 sm:p-6">
              <div className="grid grid-cols-3 gap-3">
                {Array.from({ length: 3 }).map((_, cardIndex) => (
                  <div
                    key={cardIndex}
                    className="rounded-xl border border-border/50 p-3"
                  >
                    <div className="h-3 w-12 max-w-full animate-pulse rounded bg-muted" />
                    <div className="mt-3 h-7 w-10 animate-pulse rounded bg-[#DC586D]/10" />
                  </div>
                ))}
              </div>

              <div className="grid gap-4 sm:grid-cols-2">
                <div className="h-36 animate-pulse rounded-xl bg-[#852E4E]/[0.05]" />
                <div className="space-y-4 rounded-xl border border-border/50 p-4">
                  {Array.from({ length: 3 }).map((_, rowIndex) => (
                    <div key={rowIndex}>
                      <div className="h-3 w-24 max-w-full animate-pulse rounded bg-muted" />
                      <div className="mt-2 h-2 w-full animate-pulse rounded-full bg-muted/70" />
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Recent Activity */}
      <div className="rounded-2xl border border-border/70 bg-card p-5 shadow-sm sm:p-6">
        <div className="h-5 w-36 max-w-full animate-pulse rounded bg-muted" />
        <div className="mt-2 h-4 w-64 max-w-full animate-pulse rounded bg-muted/70" />

        <div className="mt-6 space-y-4">
          {Array.from({ length: 4 }).map((_, index) => (
            <div
              key={index}
              className="flex items-center gap-3 rounded-xl border border-border/50 p-3"
            >
              <div className="size-9 shrink-0 animate-pulse rounded-full bg-[#DC586D]/10" />
              <div className="min-w-0 flex-1 space-y-2">
                <div className="h-3 w-48 max-w-full animate-pulse rounded bg-muted" />
                <div className="h-3 w-32 max-w-full animate-pulse rounded bg-muted/70" />
              </div>
              <div className="hidden h-3 w-16 animate-pulse rounded bg-muted sm:block" />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
