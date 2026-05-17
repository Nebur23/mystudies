// app/components/courses/CourseCardSkeleton.tsx
export function CourseCardSkeleton() {
  return (
    <div className="flex gap-4 bg-white rounded-2xl border border-stone-200 p-4">
      {/* Thumbnail */}
      <div className="w-24 h-24 rounded-xl bg-stone-200 shrink-0 animate-pulse" />

      {/* Content */}
      <div className="flex-1 min-w-0 space-y-2.5 py-1">
        {/* Badge row */}
        <div className="flex gap-2">
          <div className="h-4 w-14 rounded-md bg-stone-200 animate-pulse" />
          <div className="h-4 w-16 rounded-md bg-stone-100 animate-pulse" />
        </div>
        {/* Title */}
        <div className="h-4 w-3/4 rounded bg-stone-200 animate-pulse" />
        <div className="h-3 w-1/2 rounded bg-stone-100 animate-pulse" />
        {/* Progress */}
        <div className="pt-1 space-y-1.5">
          <div className="h-1.5 w-full rounded-full bg-stone-100 animate-pulse" />
          <div className="h-3 w-20 rounded bg-stone-100 animate-pulse" />
        </div>
      </div>
    </div>
  );
}