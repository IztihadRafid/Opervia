interface MetricCardProps {
  title: string;
  value: string;
  description: string;
}

export function MetricCard({ title, value, description }: MetricCardProps) {
  return (
    <div className="rounded-xl border bg-card p-5 transition-colors hover:bg-muted/30">
      <p className="text-sm font-medium text-muted-foreground">{title}</p>

      <p className="mt-2 text-2xl font-semibold tracking-tight">{value}</p>

      <p className="mt-1 text-xs text-muted-foreground">{description}</p>
    </div>
  );
}
