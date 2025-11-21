"use client";

import Image from "next/image";
import { signIn, signOut, useSession } from "next-auth/react";
import { Button } from "@/components/ui/button";
import { useState, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { AlertCircle, X } from "lucide-react";

export default function LoginPage() {
  const [isLoading, setIsLoading] = useState(false);
  const { data: session, status } = useSession();
  const router = useRouter();
  const searchParams = useSearchParams();
  const error = searchParams.get("error");

  // Redirect if already authenticated
  useEffect(() => {
    if (status === "authenticated" && session) {
      const callbackUrl = searchParams.get("callbackUrl") || "/invoices";
      router.push(callbackUrl);
    }
  }, [status, session, router, searchParams]);

  // Handle OAuth errors
  const getErrorMessage = () => {
    if (error === "OAuthAccountNotLinked") {
      return {
        title: "Account Already Linked",
        message:
          "This Google account is already linked to another user. Please log out first if you want to switch accounts.",
      };
    }
    if (error === "OAuthSignin") {
      return {
        title: "Sign In Error",
        message: "An error occurred during sign in. Please try again.",
      };
    }
    if (error === "OAuthCallback") {
      return {
        title: "Callback Error",
        message: "An error occurred during authentication. Please try again.",
      };
    }
    if (error) {
      return {
        title: "Authentication Error",
        message: "An error occurred. Please try again.",
      };
    }
    return null;
  };

  const errorInfo = getErrorMessage();

  const handleGoogleSignIn = async () => {
    setIsLoading(true);
    try {
      await signIn("google", { callbackUrl: "/invoices" });
    } catch (error) {
      console.error("Sign in error:", error);
      setIsLoading(false);
    }
  };

  // Show loading state while checking session
  if (status === "loading") {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  // Don't render login form if already authenticated (will redirect)
  if (status === "authenticated") {
    return null;
  }

  return (
    <div className="min-h-screen flex">
      {/* Left Side - Login Form */}
      <div className="flex-1 flex items-center justify-center bg-white px-4 sm:px-6 lg:px-8">
        <div className="w-full max-w-md space-y-8">
          {/* Logo */}
          <div className="flex justify-center">
            <Image
              src="/logo-primary.svg"
              alt="gginvoice logo"
              width={180}
              height={72}
              className="object-contain"
              priority
            />
          </div>

          {/* Content */}
          <div className="space-y-6">
            <div className="text-center space-y-2">
              <h1 className="text-3xl font-semibold text-gray-900 tracking-tight">
                Invoicing tool for freelancers and small businesses
              </h1>
              <p className="text-sm text-gray-600">
                Sign in to continue to your account
              </p>
            </div>

            {/* Error Alert */}
            {errorInfo && (
              <Alert variant="destructive" className="relative">
                <AlertCircle className="h-4 w-4" />
                <AlertDescription className="pr-8">
                  <div className="font-semibold mb-1">{errorInfo.title}</div>
                  <div className="text-sm">{errorInfo.message}</div>
                  {error === "OAuthAccountNotLinked" && (
                    <Button
                      variant="outline"
                      size="sm"
                      className="mt-3"
                      onClick={async () => {
                        await signOut({ redirect: false });
                        router.push("/login");
                        router.refresh();
                      }}
                    >
                      Log Out and Try Again
                    </Button>
                  )}
                </AlertDescription>
                <button
                  onClick={() => {
                    const newSearchParams = new URLSearchParams(
                      searchParams.toString()
                    );
                    newSearchParams.delete("error");
                    router.push(`/login?${newSearchParams.toString()}`);
                  }}
                  className="absolute top-2 right-2 p-1 hover:bg-destructive/20 rounded"
                  aria-label="Dismiss error"
                >
                  <X className="h-4 w-4" />
                </button>
              </Alert>
            )}

            {/* Google Sign In Button */}
            <div className="space-y-4">
              <Button
                onClick={handleGoogleSignIn}
                disabled={isLoading}
                className="w-full h-12 rounded-lg bg-white border border-gray-300 text-gray-700 font-medium shadow-sm hover:shadow-md hover:bg-gray-50 transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
                size="lg"
                aria-label="Continue with Google"
                aria-busy={isLoading}
              >
                <span className="flex items-center justify-center gap-3">
                  {isLoading ? (
                    <svg
                      className="animate-spin h-5 w-5 text-gray-400"
                      xmlns="http://www.w3.org/2000/svg"
                      fill="none"
                      viewBox="0 0 24 24"
                      aria-hidden="true"
                    >
                      <circle
                        className="opacity-25"
                        cx="12"
                        cy="12"
                        r="10"
                        stroke="currentColor"
                        strokeWidth="4"
                      ></circle>
                      <path
                        className="opacity-75"
                        fill="currentColor"
                        d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                      ></path>
                    </svg>
                  ) : (
                    <svg
                      className="w-5 h-5"
                      viewBox="0 0 24 24"
                      fill="none"
                      xmlns="http://www.w3.org/2000/svg"
                      aria-hidden="true"
                    >
                      <path
                        d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                        fill="#4285F4"
                      />
                      <path
                        d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                        fill="#34A853"
                      />
                      <path
                        d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
                        fill="#FBBC05"
                      />
                      <path
                        d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                        fill="#EA4335"
                      />
                    </svg>
                  )}
                  <span className="text-[15px]">
                    {isLoading ? "Signing in..." : "Continue with Google"}
                  </span>
                </span>
              </Button>
            </div>

            {/* Footer Text */}
            <p className="text-xs text-center text-gray-500">
              By continuing, you agree to our Terms of Service and Privacy
              Policy
            </p>
          </div>
        </div>
      </div>

      {/* Right Side - Invoice Illustration */}
      <div className="hidden lg:flex lg:flex-1 relative overflow-hidden bg-gradient-to-br from-slate-50 via-gray-50 to-slate-100 items-center justify-center p-8 xl:p-12">
        <div className="relative w-full h-full max-w-2xl max-h-[90vh] flex items-center justify-center">
          <Image
            src="/login.svg"
            alt="Digital invoicing and payment illustration"
            width={800}
            height={600}
            className="object-contain w-full h-full"
            priority={false}
            quality={90}
          />
        </div>
      </div>
    </div>
  );
}
