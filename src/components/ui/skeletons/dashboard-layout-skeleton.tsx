import { Skeleton } from "../skeleton";

export function DashboardLayoutSkeleton() {
  return (
    <div className="flex-1 overflow-auto">
      <div className="h-full">
        {/* Page Header */}
        <div className="bg-white border-b border-gray-200 px-6 py-6">
          <Skeleton className="h-8 w-48 mb-2" />
          <Skeleton className="h-4 w-64" />
        </div>

        {/* Content Area */}
        <div className="p-6 space-y-4">
          <Skeleton className="h-32 w-full rounded-lg" />
          <Skeleton className="h-32 w-full rounded-lg" />
          <Skeleton className="h-32 w-full rounded-lg" />
        </div>
      </div>
    </div>
  );
}

