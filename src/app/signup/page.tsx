"use client";

import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { useEffect } from "react";
import LoginPage from "../login/page";

export default function SignupPage() {
  const { data: session, status } = useSession();
  const router = useRouter();

  // Redirect if already authenticated
  useEffect(() => {
    if (status === "authenticated" && session) {
      router.push("/invoices");
    }
  }, [status, session, router]);

  // Don't render login form if already authenticated (will redirect)
  if (status === "authenticated") {
    return null;
  }

  return <LoginPage />;
}
