interface DashboardErrorProps {
  onRetry: () => void;
}

export function DashboardError({ onRetry }: DashboardErrorProps) {
  return (
    <div
      role="alert"
      className="flex min-h-[400px] items-center justify-center rounded-xl border bg-card p-6"
    >
      <div className="max-w-md text-center">
        <h2 className="text-lg font-semibold">Unable to load dashboard</h2>

        <p className="mt-2 text-sm text-muted-foreground">
          We couldn&apos;t load your dashboard data. Please try again.
        </p>

        <button
          type="button"
          onClick={onRetry}
          className="mt-5 rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground transition-opacity hover:opacity-90"
        >
          Try again
        </button>
      </div>
    </div>
  );
}
