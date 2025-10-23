import { CardGridSkeleton } from "@/components/loading/card-skeleton";

export default function Loading() {
  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="space-y-2">
        <div className="h-8 w-48 bg-gray-800 rounded animate-pulse"></div>
        <div className="h-4 w-64 bg-gray-800 rounded animate-pulse"></div>
      </div>

      {/* Stats cards */}
      <CardGridSkeleton count={4} />

      {/* Activity section */}
      <div className="space-y-4">
        <div className="h-6 w-32 bg-gray-800 rounded animate-pulse"></div>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <CardGridSkeleton count={2} />
        </div>
      </div>
    </div>
  );
}
