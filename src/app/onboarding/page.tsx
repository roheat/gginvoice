"use client";

import { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { useSession, signOut } from "next-auth/react";
import { ProgressIndicator } from "@/components/onboarding/progress-indicator";
import { CompanyStep } from "@/components/onboarding/company-step";
import { StripeStep } from "@/components/onboarding/stripe-step";
import { InvoiceStep } from "@/components/onboarding/invoice-step";
import { LogOut, MoreVertical } from "lucide-react";
import Image from "next/image";
import { posthog } from "@/lib/posthog";
import { LoadingSpinner } from "@/components/ui/loading-spinner";

type Step = "company" | "stripe" | "invoice";

export default function OnboardingPage() {
  const [currentStep, setCurrentStep] = useState<Step>("company");
  const [loading, setLoading] = useState(true);
  const [steps, setSteps] = useState({
    company: false,
    stripe: false,
    invoice: false,
  });
  const [userName, setUserName] = useState<string | null>(null);
  const router = useRouter();
  const { data: session, status } = useSession();
  const profileMenuRef = useRef<HTMLDivElement>(null);
  const [profileMenuOpen, setProfileMenuOpen] = useState(false);

  useEffect(() => {
    // Track onboarding start time
    sessionStorage.setItem("onboarding_start_time", Date.now().toString());

    if (status === "unauthenticated") {
      router.push("/login");
      return;
    }

    if (status === "authenticated") {
      // Check URL parameters
      const urlParams = new URLSearchParams(window.location.search);
      const urlStep = urlParams.get("step") as Step | null;
      const invoiceCreated = urlParams.get("invoice_created");

      if (invoiceCreated === "true") {
        completeOnboardingAndRedirect();
        return;
      }

      // Determine initial step: URL parameter takes precedence, otherwise default to company
      const initialStep =
        urlStep && ["company", "stripe", "invoice"].includes(urlStep)
          ? urlStep
          : "company";

      checkOnboardingStatus(initialStep);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [status, router]);

  const completeOnboardingAndRedirect = async () => {
    try {
      const startTime = sessionStorage.getItem("onboarding_start_time");
      const duration = startTime ? Date.now() - parseInt(startTime) : 0;

      // Fetch current status for analytics
      const statusRes = await fetch("/api/onboarding/status");
      const statusData = await statusRes.json();

      // Mark onboarding as complete
      await fetch("/api/onboarding/complete", {
        method: "POST",
      });

      posthog.capture("onboarding_completed", {
        duration_seconds: Math.round(duration / 1000),
        stripe_connected: statusData.steps?.stripe || false,
        invoice_created: statusData.steps?.invoice || false,
      });

      // Clear start time
      sessionStorage.removeItem("onboarding_start_time");

      // Redirect to dashboard
      router.replace("/invoices");
    } catch (error) {
      console.error("Error completing onboarding:", error);
      router.replace("/invoices");
    }
  };

  const checkOnboardingStatus = async (targetStep: Step) => {
    try {
      const res = await fetch("/api/onboarding/status");
      if (res.ok) {
        const data = await res.json();

        // Allow manual navigation to onboarding even if completed
        // Don't auto-redirect - let users access onboarding page manually
        // This enables the hybrid approach where users can update settings later

        // Update step completion states
        setSteps({
          company: data.steps?.company || false,
          stripe: data.steps?.stripe || false,
          invoice: data.steps?.invoice || false,
        });

        // Set the target step (from URL param or default)
        setCurrentStep(targetStep);

        // Clean up step URL parameter if it was used (keep other params like success/info)
        if (window.location.search.includes("step=")) {
          const newUrl = new URL(window.location.href);
          newUrl.searchParams.delete("step");
          window.history.replaceState({}, "", newUrl.toString());
        }
      }

      // Fetch user name from settings for welcome message
      try {
        const settingsRes = await fetch("/api/settings/account");
        if (settingsRes.ok) {
          const settingsData = await settingsRes.json();
          if (settingsData.success && settingsData.user) {
            // User name is stored in user.name (from User model)
            const name = settingsData.user.name || session?.user?.name;
            if (name) {
              setUserName(name);
            }
          }
        }
      } catch {
        // Fallback to session name
        if (session?.user?.name) {
          setUserName(session.user.name);
        }
      }
    } catch (error) {
      console.error("Error checking onboarding status:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleNext = () => {
    // Determine next step based on current step and completion status
    if (currentStep === "company") {
      setCurrentStep("stripe");
      // Refresh status after company setup to update step completion state
      setTimeout(() => {
        fetch("/api/onboarding/status")
          .then((res) => res.json())
          .then((data) => {
            setSteps({
              company: data.steps?.company || false,
              stripe: data.steps?.stripe || false,
              invoice: data.steps?.invoice || false,
            });
          })
          .catch((err) => console.error("Error refreshing status:", err));
      }, 500);
    } else if (currentStep === "stripe") {
      // Move to invoice step
      setCurrentStep("invoice");
    } else if (currentStep === "invoice") {
      // Should not reach here - invoice step only creates or skips
      completeOnboardingAndRedirect();
    }
  };

  const handleSkip = () => {
    // Skip optional steps
    if (currentStep === "stripe") {
      setCurrentStep("invoice");
    } else if (currentStep === "invoice") {
      // Complete onboarding and redirect to dashboard
      completeOnboardingAndRedirect();
    }
  };

  const handleBack = () => {
    if (currentStep === "stripe") {
      setCurrentStep("company");
    } else if (currentStep === "invoice") {
      setCurrentStep("stripe");
    }
  };

  // Close profile menu when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        profileMenuRef.current &&
        !profileMenuRef.current.contains(event.target as Node)
      ) {
        setProfileMenuOpen(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

  if (status === "loading" || loading) {
    return <LoadingSpinner />;
  }

  return (
    <div className="min-h-screen bg-white">
      <main className="min-h-screen flex flex-col lg:flex-row">
        {/* Left column with logo & stepper */}
        <aside className="lg:w-[45%] w-full bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50">
          <div className="h-full flex flex-col px-8 lg:px-12 py-12 gap-8">
            <div className="flex items-center">
              <Image
                src="/logo-primary.svg"
                alt="gginvoice"
                width={120}
                height={72}
                className="object-contain"
              />
            </div>

            <div className="space-y-3">
              <h1 className="text-3xl font-bold text-gray-900">
                {userName
                  ? `Welcome ${userName}! 👋`
                  : "Welcome to gginvoice! 👋"}
              </h1>
              <p className="text-lg text-gray-700 leading-relaxed">
                Let&apos;s get you set up in just a few steps.
              </p>
            </div>

            <div className="flex-1 flex items-start justify-start pt-12">
              <ProgressIndicator currentStep={currentStep} />
            </div>

            {/* User profile section - similar to dashboard */}
            {session?.user && (
              <div className="relative flex-shrink-0 border-t border-blue-200/50 pt-4 mt-auto">
                <div
                  ref={profileMenuRef}
                  className="relative flex items-center gap-3"
                >
                  <div className="flex-shrink-0">
                    <div className="h-8 w-8 rounded-full bg-blue-600/20 flex items-center justify-center">
                      <span className="text-sm font-medium text-blue-900">
                        {(userName || session.user.name)
                          ?.charAt(0)
                          ?.toUpperCase() || "U"}
                      </span>
                    </div>
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-medium text-gray-900 truncate">
                      {userName || session.user.name || "User"}
                    </p>
                    <p className="text-xs text-gray-600 truncate">
                      {session.user.email}
                    </p>
                  </div>
                  <button
                    type="button"
                    className="rounded-full p-1 text-gray-600 hover:bg-blue-100/50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500"
                    aria-expanded={profileMenuOpen}
                    aria-label="Profile actions"
                    onClick={() => setProfileMenuOpen((open) => !open)}
                  >
                    <MoreVertical className="h-5 w-5" />
                  </button>
                  {profileMenuOpen && (
                    <div className="absolute right-0 bottom-full mb-2 w-40 rounded-xl border border-gray-200 bg-white text-slate-900 shadow-lg">
                      <button
                        type="button"
                        className="flex w-full items-center gap-2 px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-100 overflow-hidden rounded-xl"
                        onClick={() => {
                          signOut({ callbackUrl: "/login" });
                          setProfileMenuOpen(false);
                        }}
                      >
                        <LogOut className="h-4 w-4 text-slate-500" />
                        Logout
                      </button>
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
        </aside>

        {/* Right column with content */}
        <section className="flex-1 flex flex-col bg-white px-4 py-10 sm:px-6 lg:px-12">
          <div className="flex-1">
            {currentStep === "company" && (
              <CompanyStep
                onNext={handleNext}
                onBack={undefined}
                onNameUpdate={setUserName}
              />
            )}
            {currentStep === "stripe" && (
              <StripeStep
                onNext={handleNext}
                onSkip={handleSkip}
                onBack={handleBack}
              />
            )}
            {currentStep === "invoice" && <InvoiceStep onBack={handleBack} />}
          </div>
        </section>
      </main>
    </div>
  );
}
