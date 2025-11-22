import { Skeleton } from "../skeleton";

export function AuthSkeleton() {
  return (
    <div className="min-h-screen flex">
      {/* Left Side - Login Form Skeleton */}
      <div className="flex-1 flex items-center justify-center bg-white px-4 sm:px-6 lg:px-8">
        <div className="w-full max-w-md space-y-8">
          {/* Logo */}
          <div className="flex justify-center">
            <Skeleton className="h-[72px] w-[120px]" />
          </div>

          {/* Content */}
          <div className="space-y-6">
            {/* Title and Subtitle */}
            <div className="text-center space-y-2">
              <Skeleton className="h-9 w-full mx-auto" />
              <Skeleton className="h-5 w-64 mx-auto" />
            </div>

            {/* Sign In Button */}
            <Skeleton className="h-12 w-full rounded-lg" />

            {/* Footer Text */}
            <Skeleton className="h-4 w-80 mx-auto" />
          </div>
        </div>
      </div>

      {/* Right Side - Illustration */}
      <div className="hidden lg:flex lg:flex-1 relative overflow-hidden bg-gradient-to-br from-slate-50 via-gray-50 to-slate-100 items-center justify-center p-8 xl:p-12">
        <Skeleton className="w-full h-full max-w-2xl max-h-[90vh] rounded-lg" />
      </div>
    </div>
  );
}

