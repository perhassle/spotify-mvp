import { Skeleton } from '@/components/ui/skeleton';
import { TrackListSkeleton } from '@/components/features/track/track-list-skeleton';

export function SearchResultsSkeleton() {
  return (
    <div className="space-y-8">
      {/* Songs section */}
      <section>
        <Skeleton className="h-6 w-32 mb-4" />
        <TrackListSkeleton count={4} />
      </section>
      
      {/* Artists section */}
      <section>
        <Skeleton className="h-6 w-32 mb-4" />
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="text-center">
              <Skeleton className="w-32 h-32 rounded-full mx-auto" />
              <Skeleton className="h-4 w-24 mx-auto mt-2" />
            </div>
          ))}
        </div>
      </section>
      
      {/* Albums section */}
      <section>
        <Skeleton className="h-6 w-32 mb-4" />
        <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4">
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i}>
              <Skeleton className="aspect-square w-full rounded-md" />
              <Skeleton className="h-4 w-3/4 mt-2" />
              <Skeleton className="h-3 w-1/2 mt-1" />
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}