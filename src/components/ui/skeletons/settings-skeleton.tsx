import { Skeleton } from "../skeleton";
import { Card, CardContent, CardHeader, CardDescription } from "../card";
import { DashboardLayout } from "@/components/dashboard/dashboard-layout";
import { PageHeader } from "@/components/dashboard/page-header";
import { MainContent } from "@/components/dashboard/main-content";

export function SettingsSkeleton() {
  return (
    <DashboardLayout>
      <PageHeader
        title="Settings"
        subtitle="Manage your account and payment integrations"
      />
      <MainContent>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Company Information Skeleton */}
          <div className="lg:col-span-1">
            <div className="mb-6">
              <Skeleton className="h-7 w-56 mb-2" />
              <Skeleton className="h-5 w-80" />
            </div>
            <Card>
              <CardContent className="pt-6 space-y-6">
                {/* Logo Upload Skeleton */}
                <div className="space-y-2">
                  <Skeleton className="h-4 w-24" />
                  <div className="border-2 border-dashed border-gray-300 rounded-lg p-8">
                    <Skeleton className="h-24 w-24 mx-auto rounded-lg" />
                  </div>
                </div>

                {/* Form Fields */}
                {Array.from({ length: 4 }).map((_, i) => (
                  <div key={i} className="space-y-2">
                    <Skeleton className="h-4 w-28" />
                    <Skeleton className="h-10 w-full" />
                  </div>
                ))}

                {/* Buttons */}
                <div className="pt-4 border-t flex items-center justify-end space-x-3">
                  <Skeleton className="h-10 w-20" />
                  <Skeleton className="h-10 w-36" />
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Payment Integrations Skeleton */}
          <div className="lg:col-span-1">
            <div className="mb-6">
              <Skeleton className="h-7 w-56 mb-2" />
              <Skeleton className="h-5 w-80" />
            </div>
            <div className="space-y-4">
              {/* Stripe Card Skeleton */}
              <Card>
                <CardHeader>
                  <div className="flex items-center gap-3 mb-2">
                    <Skeleton className="h-8 w-24" />
                  </div>
                  <CardDescription>
                    <Skeleton className="h-4 w-full" />
                    <Skeleton className="h-4 w-3/4 mt-1" />
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <Skeleton className="h-10 w-full" />
                </CardContent>
              </Card>

              {/* PayPal Card Skeleton */}
              <Card className="opacity-75">
                <CardHeader>
                  <div className="flex items-center gap-3 mb-2">
                    <Skeleton className="h-8 w-24" />
                  </div>
                  <CardDescription>
                    <Skeleton className="h-4 w-full" />
                    <Skeleton className="h-4 w-3/4 mt-1" />
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <Skeleton className="h-10 w-full" />
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      </MainContent>
    </DashboardLayout>
  );
}

