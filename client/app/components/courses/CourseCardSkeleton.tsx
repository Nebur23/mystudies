export function CourseCardSkeleton() {
  return (
    <div className="overflow-hidden rounded-2xl border border-border bg-card" aria-hidden="true">
      <div className="aspect-[16/9] animate-pulse bg-muted" />
      <div className="space-y-3 p-5">
        <div className="h-3 w-20 animate-pulse rounded bg-muted" />
        <div className="h-5 w-3/4 animate-pulse rounded bg-muted" />
        <div className="h-4 w-full animate-pulse rounded bg-muted" />
        <div className="h-4 w-2/3 animate-pulse rounded bg-muted" />
        <div className="pt-2">
          <div className="h-1.5 w-full animate-pulse rounded-full bg-muted" />
        </div>
      </div>
    </div>
  );
}