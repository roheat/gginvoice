"use client";

import { useEffect, type ReactNode } from "react";
import { useSession } from "next-auth/react";
import { usePathname, useSearchParams } from "next/navigation";
import { initPosthog, isPosthogConfigured, posthog } from "@/lib/posthog";

export function PosthogProvider({ children }: { children: ReactNode }) {
  const session = useSession();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  // Initialize once on mount
  useEffect(() => {
    if (isPosthogConfigured) {
      initPosthog();
    }
  }, []);

  // Handle user identification
  useEffect(() => {
    if (!isPosthogConfigured) return;

    if (session.status === "authenticated" && session.data?.user) {
      const user = session.data.user as { id?: string; email?: string | null; name?: string | null; image?: string | null };
      if (user.id) {
        posthog.identify(user.id, {
          email: user.email,
          name: user.name,
        });
      }
    } else if (session.status === "unauthenticated") {
      posthog.reset();
    }
  }, [session.status, session.data?.user]);

  // Capture pageviews
  useEffect(() => {
    if (!isPosthogConfigured) return;

    const url = pathname + (searchParams?.toString() ? `?${searchParams.toString()}` : "");
    posthog.capture("$pageview", { 
      $current_url: url,
    });
  }, [pathname, searchParams]);

  return <>{children}</>;
}

