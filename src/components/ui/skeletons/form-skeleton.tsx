import { Skeleton } from "../skeleton";
import { Card, CardContent } from "../card";

interface FormSkeletonProps {
  fields?: number;
  showHeader?: boolean;
}

export function FormSkeleton({ fields = 4, showHeader = true }: FormSkeletonProps) {
  return (
    <Card>
      <CardContent className="pt-6 space-y-6">
        {showHeader && (
          <div className="space-y-2">
            <Skeleton className="h-6 w-32" />
            <Skeleton className="h-4 w-48" />
          </div>
        )}
        {Array.from({ length: fields }).map((_, i) => (
          <div key={i} className="space-y-2">
            <Skeleton className="h-4 w-24" />
            <Skeleton className="h-10 w-full" />
          </div>
        ))}
        <div className="pt-4 border-t flex items-center justify-end space-x-3">
          <Skeleton className="h-10 w-20" />
          <Skeleton className="h-10 w-32" />
        </div>
      </CardContent>
    </Card>
  );
}

