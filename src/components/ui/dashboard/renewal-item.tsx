interface RenewalItemProps {
  name: string;
  category: string;
  amount: string;
  date: string;
}

export function RenewalItem({
  name,
  category,
  amount,
  date,
}: RenewalItemProps) {
  return (
    <div className="flex items-center justify-between gap-4">
      <div className="min-w-0">
        <p className="truncate text-sm font-medium">{name}</p>

        <p className="mt-1 text-xs text-muted-foreground">{category}</p>
      </div>

      <div className="shrink-0 text-right">
        <p className="text-sm font-medium">{amount}</p>

        <p className="mt-1 text-xs text-muted-foreground">{date}</p>
      </div>
    </div>
  );
}
