import { Skeleton } from '@/components/ui/skeleton';

export function PlaylistCardSkeleton() {
  return (
    <div className="group relative rounded-lg bg-neutral-900 p-4">
      {/* Image skeleton */}
      <Skeleton className="aspect-square w-full rounded-md" />
      
      {/* Title skeleton */}
      <Skeleton className="mt-4 h-5 w-3/4" />
      
      {/* Description skeleton */}
      <Skeleton className="mt-2 h-4 w-full" />
      <Skeleton className="mt-1 h-4 w-2/3" />
    </div>
  );
}

// Use in grid
export function PlaylistGridSkeleton({ count = 6 }: { count?: number }) {
  return (
    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-6 gap-4">
      {Array.from({ length: count }).map((_, i) => (
        <PlaylistCardSkeleton key={i} />
      ))}
    </div>
  );
}