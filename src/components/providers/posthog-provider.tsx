"use client";

import { useEffect, type ReactNode, Suspense } from "react";
import { useSession } from "next-auth/react";
import { usePathname, useSearchParams } from "next/navigation";
import { initPosthog, isPosthogConfigured, posthog } from "@/lib/posthog";

function PosthogPageView() {
  const pathname = usePathname();
  const searchParams = useSearchParams();

  useEffect(() => {
    if (!isPosthogConfigured) return;

    // Only capture after component mounts (client-side only)
    const url =
      pathname +
      (searchParams?.toString() ? `?${searchParams.toString()}` : "");
    posthog.capture("$pageview", {
      $current_url: url,
    });
  }, [pathname, searchParams]);

  return null;
}

export function PosthogProvider({ children }: { children: ReactNode }) {
  const session = useSession();

  // Initialize once on mount
  useEffect(() => {
    if (isPosthogConfigured) {
      initPosthog();
    }
  }, []);

  // Handle user identification
  useEffect(() => {
    if (!isPosthogConfigured) return;

    // Only run on client-side after mount
    if (session.status === "authenticated" && session.data?.user) {
      const user = session.data.user as {
        id?: string;
        email?: string | null;
        name?: string | null;
        image?: string | null;
      };
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

  return (
    <>
      <Suspense fallback={null}>
        <PosthogPageView />
      </Suspense>
      {children}
    </>
  );
}
