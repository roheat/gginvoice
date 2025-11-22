"use client";

import { useSession } from "next-auth/react";
import { useRouter, usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import { Sidebar } from "./sidebar";
import { LoadingSpinner } from "@/components/ui/loading-spinner";

interface DashboardLayoutProps {
  children: React.ReactNode;
}

// Track if onboarding has been verified as complete
let onboardingVerified = false;

export function DashboardLayout({ children }: DashboardLayoutProps) {
  const { status } = useSession();
  const router = useRouter();
  const pathname = usePathname();
  const [canRender, setCanRender] = useState(false);

  useEffect(() => {
    // Skip if not authenticated
    if (status !== "authenticated") {
      setCanRender(false);
      return;
    }

    // Always allow manual access to /onboarding
    if (pathname === "/onboarding") {
      setCanRender(true);
      return;
    }

    // If already verified, allow render immediately
    if (onboardingVerified) {
      setCanRender(true);
      return;
    }

    const checkOnboarding = async () => {
      // Check if onboarding was just completed
      const urlParams = new URLSearchParams(window.location.search);
      if (urlParams.get("onboarding_complete") === "true") {
        const newUrl = new URL(window.location.href);
        newUrl.searchParams.delete("onboarding_complete");
        window.history.replaceState({}, "", newUrl.toString());
        onboardingVerified = true;
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
          setCanRender(true);
        } else {
          // On error, allow render to avoid blocking
          onboardingVerified = true;
          setCanRender(true);
        }
      } catch (error) {
        console.error("Onboarding check failed:", error);
        // On error, allow render to avoid blocking
        onboardingVerified = true;
        setCanRender(true);
      }
    };

    checkOnboarding();
  }, [status, pathname, router]);

  // Show loading during auth check
  if (status === "loading") {
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
  // For /onboarding: allow render immediately
  if (!canRender) {
    return <LoadingSpinner />;
  }

  // Only render sidebar and children after verification
  return <Sidebar>{children}</Sidebar>;
}
