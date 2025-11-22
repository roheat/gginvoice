import { Skeleton } from "../skeleton";
import { Card, CardContent } from "../card";

export function InvoiceFormSkeleton() {
  return (
    <div className="max-w-7xl mx-auto">
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main Form Area */}
        <div className="lg:col-span-2 space-y-6">
          {/* Client Section */}
          <Card>
            <CardContent className="pt-6 space-y-4">
              <Skeleton className="h-6 w-32 mb-4" />
              <div className="space-y-2">
                <Skeleton className="h-4 w-24" />
                <Skeleton className="h-10 w-full" />
              </div>
            </CardContent>
          </Card>

          {/* Invoice Details */}
          <Card>
            <CardContent className="pt-6 space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Skeleton className="h-4 w-28" />
                  <Skeleton className="h-10 w-full" />
                </div>
                <div className="space-y-2">
                  <Skeleton className="h-4 w-24" />
                  <Skeleton className="h-10 w-full" />
                </div>
                <div className="space-y-2">
                  <Skeleton className="h-4 w-20" />
                  <Skeleton className="h-10 w-full" />
                </div>
                <div className="space-y-2">
                  <Skeleton className="h-4 w-24" />
                  <Skeleton className="h-10 w-full" />
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Items */}
          <Card>
            <CardContent className="pt-6 space-y-4">
              <Skeleton className="h-6 w-24 mb-4" />
              {Array.from({ length: 3 }).map((_, i) => (
                <div key={i} className="border rounded-lg p-4 space-y-3">
                  <Skeleton className="h-4 w-full" />
                  <div className="grid grid-cols-2 gap-4">
                    <Skeleton className="h-10 w-full" />
                    <Skeleton className="h-10 w-full" />
                  </div>
                </div>
              ))}
              <Skeleton className="h-10 w-32" />
            </CardContent>
          </Card>

          {/* Notes & Payment Methods */}
          <Card>
            <CardContent className="pt-6 space-y-4">
              <div className="space-y-2">
                <Skeleton className="h-4 w-20" />
                <Skeleton className="h-24 w-full" />
              </div>
              <div className="space-y-2">
                <Skeleton className="h-4 w-32" />
                <Skeleton className="h-10 w-full" />
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Right Panel - Calculations & Actions */}
        <div className="lg:col-span-1 space-y-6">
          <Card>
            <CardContent className="pt-6 space-y-4">
              <Skeleton className="h-6 w-28 mb-4" />
              {Array.from({ length: 5 }).map((_, i) => (
                <div key={i} className="flex justify-between items-center">
                  <Skeleton className="h-4 w-20" />
                  <Skeleton className="h-4 w-24" />
                </div>
              ))}
              <div className="pt-4 border-t">
                <div className="flex justify-between items-center">
                  <Skeleton className="h-6 w-16" />
                  <Skeleton className="h-6 w-28" />
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Actions */}
          <Card>
            <CardContent className="pt-6 space-y-3">
              <Skeleton className="h-10 w-full" />
              <Skeleton className="h-10 w-full" />
              <Skeleton className="h-10 w-full" />
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}

