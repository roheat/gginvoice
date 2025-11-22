"use client";

import { useSession } from "next-auth/react";
import { useRouter, usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import { Sidebar } from "./sidebar";
import { LoadingSpinner } from "@/components/ui/loading-spinner";

interface DashboardLayoutProps {
  children: React.ReactNode;
}

// Dashboard routes that require onboarding completion
const DASHBOARD_ROUTES = ["/invoices", "/clients", "/settings"];

export function DashboardLayout({ children }: DashboardLayoutProps) {
  const { status } = useSession();
  const router = useRouter();
  const pathname = usePathname();
  const [hasCheckedOnboarding, setHasCheckedOnboarding] = useState(false);
  const [isCheckingOnboarding, setIsCheckingOnboarding] = useState(true);
  const [shouldRender, setShouldRender] = useState(false);
  const [isRedirecting, setIsRedirecting] = useState(false);

  // For dashboard routes, assume we need to check onboarding immediately
  const isDashboardRoute = DASHBOARD_ROUTES.some((route) =>
    pathname?.startsWith(route)
  );

  // Only check onboarding once on initial mount, not on every navigation
  useEffect(() => {
    const checkOnboarding = async () => {
      // Always allow manual navigation to onboarding page (hybrid approach)
      // Users can access /onboarding anytime to update settings
      if (pathname === "/onboarding") {
        setHasCheckedOnboarding(true);
        setIsCheckingOnboarding(false);
        setShouldRender(true);
        return;
      }

      // Check if onboarding was just completed (query param)
      const urlParams = new URLSearchParams(window.location.search);
      const onboardingComplete =
        urlParams.get("onboarding_complete") === "true";

      if (onboardingComplete) {
        // Clean up the query parameter
        const newUrl = new URL(window.location.href);
        newUrl.searchParams.delete("onboarding_complete");
        window.history.replaceState({}, "", newUrl.toString());
        setHasCheckedOnboarding(true);
        setIsCheckingOnboarding(false);
        setShouldRender(true);
        return;
      }

      // For dashboard pages (invoices, clients, settings, etc.):
      // Check if onboarding is complete, and redirect if not
      try {
        const res = await fetch("/api/onboarding/status");
        if (res.ok) {
          const data = await res.json();

          // Redirect to onboarding if not complete
          // This ensures first-time users complete setup before accessing dashboard
          if (!data.isComplete) {
            // Set redirecting flag to prevent any rendering
            setIsRedirecting(true);
            // Use replace instead of push to avoid back button issues
            router.replace("/onboarding");
            // Don't set shouldRender - we're redirecting
            return;
          }
        }
        // If we get here, onboarding is complete
        setShouldRender(true);
      } catch (error) {
        console.error("Onboarding check failed:", error);
        // Continue to dashboard on error
        setShouldRender(true);
      } finally {
        setHasCheckedOnboarding(true);
        setIsCheckingOnboarding(false);
      }
    };

    if (status === "authenticated" && !hasCheckedOnboarding) {
      checkOnboarding();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [status, hasCheckedOnboarding, pathname]);

  // Show loading only on initial session/auth check, not during navigation
  if (status === "loading") {
    return <LoadingSpinner />;
  }

  if (status === "unauthenticated") {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-semibold text-gray-900 mb-4">
            Access Denied
          </h1>
          <p className="text-gray-600">
            Please sign in to access the dashboard.
          </p>
        </div>
      </div>
    );
  }

  // For dashboard routes, show loading immediately until onboarding check completes
  // This prevents any flash of content before redirect
  if (
    isDashboardRoute &&
    (isCheckingOnboarding || !shouldRender || isRedirecting)
  ) {
    return <LoadingSpinner />;
  }

  // For non-dashboard routes (like onboarding), show loading only if actively checking
  if (isCheckingOnboarding && !hasCheckedOnboarding) {
    return <LoadingSpinner />;
  }

  return <Sidebar>{children}</Sidebar>;
}
