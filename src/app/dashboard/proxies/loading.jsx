import { TableSkeleton } from "@/components/loading/table-skeleton";

export default function Loading() {
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="space-y-2">
          <div className="h-8 w-32 bg-gray-800 rounded animate-pulse"></div>
          <div className="h-4 w-64 bg-gray-800 rounded animate-pulse"></div>
        </div>
        <div className="h-10 w-32 bg-gray-800 rounded animate-pulse"></div>
      </div>

      <TableSkeleton rows={5} columns={6} />
    </div>
  );
}
