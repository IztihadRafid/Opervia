"use client";

interface UsersPaginationProps {
  page: number;
  totalPages: number;
  onPageChange: (page: number) => void;
}

export function UsersPagination({
  page,
  totalPages,
  onPageChange,
}: UsersPaginationProps) {
  const hasPreviousPage = page > 1;
  const hasNextPage = page < totalPages;

  return (
    <div className="flex items-center justify-between gap-4 rounded-2xl border border-border/60 bg-card/60 px-4 py-3 shadow-sm">
      <div>
        <p className="text-sm font-medium text-foreground">
          Page {page} of {totalPages}
        </p>

        <p className="mt-0.5 text-xs text-muted-foreground">
          Navigate through the results
        </p>
      </div>

      <div className="flex items-center gap-2">
        <button
          type="button"
          onClick={() => onPageChange(page - 1)}
          disabled={!hasPreviousPage}
          className="rounded-xl border border-border/60 bg-background px-3.5 py-2 text-sm font-medium transition hover:border-primary/30 hover:bg-primary/5 hover:text-primary disabled:cursor-not-allowed disabled:opacity-40 disabled:hover:border-border/60 disabled:hover:bg-background disabled:hover:text-foreground"
        >
          Previous
        </button>

        <div className="flex h-9 min-w-9 items-center justify-center rounded-xl bg-primary px-3 text-sm font-semibold text-primary-foreground shadow-sm shadow-primary/20">
          {page}
        </div>

        <button
          type="button"
          onClick={() => onPageChange(page + 1)}
          disabled={!hasNextPage}
          className="rounded-xl border border-border/60 bg-background px-3.5 py-2 text-sm font-medium transition hover:border-primary/30 hover:bg-primary/5 hover:text-primary disabled:cursor-not-allowed disabled:opacity-40 disabled:hover:border-border/60 disabled:hover:bg-background disabled:hover:text-foreground"
        >
          Next
        </button>
      </div>
    </div>
  );
}
