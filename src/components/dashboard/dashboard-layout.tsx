"use client";

import { useSession } from "next-auth/react";
import { useRouter, usePathname } from "next/navigation";
import { useEffect, useState, useRef } from "react";
import { Sidebar } from "./sidebar";
import { LoadingSpinner } from "@/components/ui/loading-spinner";

interface DashboardLayoutProps {
  children: React.ReactNode;
}

// Track if onboarding has been verified as complete (module-level to persist across route changes)
let onboardingVerified = false;
let initialCheckComplete = false;

export function DashboardLayout({ children }: DashboardLayoutProps) {
  const { status } = useSession();
  const router = useRouter();
  const pathname = usePathname();
  const [canRender, setCanRender] = useState(false);
  const hasCheckedRef = useRef(false);

  useEffect(() => {
    // Skip if not authenticated
    if (status !== "authenticated") {
      // Only reset canRender on initial auth failure, not on route changes
      if (!hasCheckedRef.current) {
        setCanRender(false);
      }
      return;
    }

    // Always allow manual access to /onboarding
    if (pathname === "/onboarding") {
      setCanRender(true);
      hasCheckedRef.current = true;
      return;
    }

    // If already verified and we've done initial check, allow render immediately
    // This prevents re-checking on every route change
    if (onboardingVerified && hasCheckedRef.current) {
      setCanRender(true);
      return;
    }

    // Only run the check once on initial mount or if not yet verified
    if (hasCheckedRef.current && onboardingVerified) {
      return;
    }

    const checkOnboarding = async () => {
      hasCheckedRef.current = true;
      
      // Check if onboarding was just completed
      const urlParams = new URLSearchParams(window.location.search);
      if (urlParams.get("onboarding_complete") === "true") {
        const newUrl = new URL(window.location.href);
        newUrl.searchParams.delete("onboarding_complete");
        window.history.replaceState({}, "", newUrl.toString());
        onboardingVerified = true;
        initialCheckComplete = true;
        setCanRender(true);
        return;
      }

      // Check onboarding status - CRITICAL: don't render until this completes
      try {
        const res = await fetch("/api/onboarding/status");
        if (res.ok) {
          const data = await res.json();
          if (!data.isComplete) {
            // Redirect immediately - keep loading visible
            // Don't set canRender - stay in loading state until redirect
            router.replace("/onboarding");
            return;
          }
          // Onboarding is complete - safe to render
          onboardingVerified = true;
          initialCheckComplete = true;
          setCanRender(true);
        } else {
          // On error, allow render to avoid blocking
          onboardingVerified = true;
          initialCheckComplete = true;
          setCanRender(true);
        }
      } catch (error) {
        console.error("Onboarding check failed:", error);
        // On error, allow render to avoid blocking
        onboardingVerified = true;
        initialCheckComplete = true;
        setCanRender(true);
      }
    };

    checkOnboarding();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [status, router]); // pathname intentionally excluded to prevent re-checking on route changes

  // Show loading during initial auth check only
  if (status === "loading" && !initialCheckComplete) {
    return <LoadingSpinner />;
  }

  // Show access denied if not authenticated
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

  // For dashboard routes: show loading until onboarding is verified complete
  // Only show on initial check, not on route changes
  // Once we've verified onboarding, never show loader again during route changes
  if (!initialCheckComplete && !canRender) {
    return <LoadingSpinner />;
  }

  // If we've already verified onboarding, always render immediately (no loader on route changes)
  if (onboardingVerified && status === "authenticated") {
    return <Sidebar>{children}</Sidebar>;
  }

  // Fallback: render sidebar if canRender is true
  if (canRender) {
    return <Sidebar>{children}</Sidebar>;
  }

  // Last resort: show loader only if we haven't completed initial check
  if (!initialCheckComplete) {
    return <LoadingSpinner />;
  }

  // Default: render sidebar (shouldn't reach here, but prevents blocking)
  return <Sidebar>{children}</Sidebar>;
}
