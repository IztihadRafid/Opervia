interface ActivityItemProps {
  title: string;
  description: string;
  time: string;
}

export function ActivityItem({ title, description, time }: ActivityItemProps) {
  return (
    <div className="flex items-center justify-between gap-4 py-4">
      <div className="flex min-w-0 items-center gap-3">
        <div className="h-2 w-2 shrink-0 rounded-full bg-primary" />

        <div className="min-w-0">
          <p className="text-sm font-medium">{title}</p>

          <p className="mt-1 truncate text-xs text-muted-foreground">
            {description}
          </p>
        </div>
      </div>

      <p className="shrink-0 text-xs text-muted-foreground">{time}</p>
    </div>
  );
}
