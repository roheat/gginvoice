import { Skeleton } from "../skeleton";

export function PaymentFormSkeleton() {
  return (
    <div className="p-6 space-y-6">
      {/* Card info section */}
      <div className="space-y-4">
        <Skeleton className="h-5 w-32" />
        <div className="space-y-3">
          <Skeleton className="h-12 w-full rounded-md" />
          <div className="grid grid-cols-2 gap-3">
            <Skeleton className="h-12 w-full rounded-md" />
            <Skeleton className="h-12 w-full rounded-md" />
          </div>
        </div>
      </div>

      {/* Submit button */}
      <Skeleton className="h-12 w-full rounded-md" />

      {/* Security note */}
      <div className="flex items-center gap-2 justify-center">
        <Skeleton className="h-4 w-4" />
        <Skeleton className="h-4 w-48" />
      </div>
    </div>
  );
}

