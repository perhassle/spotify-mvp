import { Skeleton } from '@/components/ui/skeleton';

export function TrackItemSkeleton() {
  return (
    <div className="flex items-center gap-4 p-2 rounded-md">
      {/* Track number */}
      <Skeleton className="w-6 h-6" />
      
      {/* Album art */}
      <Skeleton className="w-10 h-10 rounded" />
      
      {/* Track info */}
      <div className="flex-1">
        <Skeleton className="h-4 w-48" />
        <Skeleton className="h-3 w-32 mt-1" />
      </div>
      
      {/* Duration */}
      <Skeleton className="w-12 h-4" />
    </div>
  );
}

export function TrackListSkeleton({ count = 10 }: { count?: number }) {
  return (
    <div className="space-y-1">
      {Array.from({ length: count }).map((_, i) => (
        <TrackItemSkeleton key={i} />
      ))}
    </div>
  );
}