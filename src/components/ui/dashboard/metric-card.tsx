interface MetricCardProps {
  title: string;
  value: string;
  description: string;
}

const metricAccents: Record<string, string> = {
  Applications: "bg-[#852E4E]",
  "Monthly Spend": "bg-[#DC586D]",
  "Active Users": "bg-[#FB9590]",
  Renewals: "bg-[#A33757]",
};

export function MetricCard({ title, value, description }: MetricCardProps) {
  const accent = metricAccents[title] ?? "bg-primary";

  return (
    <div className="group relative overflow-hidden rounded-2xl border border-border/70 bg-card p-5 shadow-sm transition-all duration-200 hover:-translate-y-0.5 hover:border-primary/30 hover:shadow-md sm:p-6">
      <div
        aria-hidden="true"
        className={`absolute inset-x-0 top-0 h-1 ${accent}`}
      />

      <div
        aria-hidden="true"
        className="pointer-events-none absolute -right-10 -top-10 size-28 rounded-full bg-primary/[0.04] blur-2xl transition-colors duration-200 group-hover:bg-primary/[0.09]"
      />

      <div className="relative">
        <div className="flex items-center justify-between gap-3">
          <p className="text-sm font-medium tracking-wide text-muted-foreground">
            {title}
          </p>

          <span
            aria-hidden="true"
            className={`size-2 rounded-full ${accent} ring-4 ring-primary/5`}
          />
        </div>

        <p className="mt-4 break-words text-3xl font-semibold tracking-tight text-foreground sm:text-[2rem]">
          {value}
        </p>

        <p className="mt-2 text-xs leading-5 text-muted-foreground">
          {description}
        </p>
      </div>
    </div>
  );
}
