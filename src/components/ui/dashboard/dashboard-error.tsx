import { AlertTriangle, RefreshCw } from "lucide-react";

interface DashboardErrorProps {
  onRetry: () => void;
}

export function DashboardError({ onRetry }: DashboardErrorProps) {
  return (
    <div
      role="alert"
      className="flex min-h-[400px] items-center justify-center rounded-2xl border border-border/70 bg-card p-6 shadow-sm"
    >
      <div className="max-w-md text-center">
        <div
          aria-hidden="true"
          className="mx-auto flex size-14 items-center justify-center rounded-2xl bg-[#DC586D]/[0.10] text-[#A33757]"
        >
          <AlertTriangle className="size-7" />
        </div>

        <h2 className="mt-5 text-lg font-semibold tracking-tight text-foreground">
          Unable to load dashboard
        </h2>

        <p className="mt-2 text-sm leading-6 text-muted-foreground">
          We couldn&apos;t load your dashboard data. Please check your
          connection and try again.
        </p>

        <button
          type="button"
          onClick={onRetry}
          className="mt-6 inline-flex min-h-10 items-center justify-center gap-2 rounded-xl bg-[#852E4E] px-5 py-2.5 text-sm font-medium text-white shadow-sm transition-all hover:bg-[#6E2745] hover:shadow-md focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#DC586D] focus-visible:ring-offset-2"
        >
          <RefreshCw className="size-4" aria-hidden="true" />
          Try again
        </button>
      </div>
    </div>
  );
}
