import { Skeleton } from "../skeleton";

interface PageHeaderSkeletonProps {
  showSubtitle?: boolean;
  showAction?: boolean;
  showStatus?: boolean;
}

export function PageHeaderSkeleton({ 
  showSubtitle = false, 
  showAction = false,
  showStatus = false 
}: PageHeaderSkeletonProps) {
  return (
    <div className="bg-white shadow-sm border-b border-gray-200">
      <div className="px-4 sm:px-6 lg:px-8">
        <div className="py-4 sm:py-6">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 sm:gap-4">
            <div className="min-w-0 flex-1">
              {showStatus ? (
                <div className="flex flex-col gap-2">
                  <Skeleton className="h-7 sm:h-8 w-48" />
                  <div className="flex items-center gap-2">
                    <Skeleton className="h-4 w-12" />
                    <Skeleton className="h-5 w-16 rounded-full" />
                  </div>
                </div>
              ) : (
                <Skeleton className="h-7 sm:h-8 w-48" />
              )}
              {showSubtitle && (
                <Skeleton className="h-4 w-64 mt-2" />
              )}
            </div>
            {showAction && (
              <Skeleton className="h-10 w-32 sm:w-auto sm:min-w-[120px]" />
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

