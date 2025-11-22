"use client";

import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { useEffect } from "react";
import LoginPage from "../login/page";
import { AuthSkeleton } from "@/components/ui/skeletons/auth-skeleton";

export default function SignupPage() {
  const { data: session, status } = useSession();
  const router = useRouter();

  // Redirect if already authenticated
  useEffect(() => {
    if (status === "authenticated" && session) {
      router.push("/invoices");
    }
  }, [status, session, router]);

  // Show loading state while checking session
  if (status === "loading") {
    return <AuthSkeleton />;
  }

  // Don't render login form if already authenticated (will redirect)
  if (status === "authenticated") {
    return null;
  }

  return <LoginPage />;
}
