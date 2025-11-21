"use client";

import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { Sidebar } from "./sidebar";

interface DashboardLayoutProps {
  children: React.ReactNode;
}

export function DashboardLayout({ children }: DashboardLayoutProps) {
  const { status, data: session } = useSession();
  const router = useRouter();
  const [checkingOnboarding, setCheckingOnboarding] = useState(true);

  useEffect(() => {
    if (status === "authenticated") {
      checkOnboarding();
    } else if (status === "unauthenticated") {
      setCheckingOnboarding(false);
    }
  }, [status]);

  const checkOnboarding = async () => {
    try {
      const res = await fetch("/api/onboarding/status");
      if (res.ok) {
        const data = await res.json();
        
        // Redirect to onboarding if not complete
        if (!data.isComplete) {
          router.push("/onboarding");
          return;
        }
      }
    } catch (error) {
      console.error("Onboarding check failed:", error);
      // Continue to dashboard on error
    } finally {
      setCheckingOnboarding(false);
    }
  };

  if (status === "loading" || checkingOnboarding) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading...</p>
        </div>
      </div>
    );
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

  return <Sidebar>{children}</Sidebar>;
}
