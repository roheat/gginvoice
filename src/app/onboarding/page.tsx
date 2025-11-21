"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import { ProgressIndicator } from "@/components/onboarding/progress-indicator";
import { CompanyStep } from "@/components/onboarding/company-step";
import { StripeStep } from "@/components/onboarding/stripe-step";
import { InvoiceStep } from "@/components/onboarding/invoice-step";
import { Loader2 } from "lucide-react";
import Image from "next/image";
import { posthog } from "@/lib/posthog";

type Step = "company" | "stripe" | "invoice";

export default function OnboardingPage() {
  const [currentStep, setCurrentStep] = useState<Step>("company");
  const [loading, setLoading] = useState(true);
  const [steps, setSteps] = useState({
    company: false,
    stripe: false,
    invoice: false,
  });
  const router = useRouter();
  const { data: session, status } = useSession();

  useEffect(() => {
    // Track onboarding start time
    sessionStorage.setItem("onboarding_start_time", Date.now().toString());
    
    if (status === "unauthenticated") {
      router.push("/login");
      return;
    }

    if (status === "authenticated") {
      // Check if returning from invoice creation - complete onboarding and redirect
      const urlParams = new URLSearchParams(window.location.search);
      const invoiceCreated = urlParams.get("invoice_created");
      
      if (invoiceCreated === "true") {
        // Invoice created, complete onboarding and redirect to dashboard
        completeOnboardingAndRedirect();
        return;
      }
      
      checkOnboardingStatus();
    }
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

  const checkOnboardingStatus = async () => {
    try {
      const res = await fetch("/api/onboarding/status");
      if (res.ok) {
        const data = await res.json();
        
        // If already completed, redirect to dashboard
        if (data.isComplete) {
          router.replace("/invoices");
          return;
        }

        // Set step states
        setSteps({
          company: data.steps?.company || false,
          stripe: data.steps?.stripe || false,
          invoice: data.steps?.invoice || false,
        });

        // Determine starting step
        if (!data.steps?.company) {
          setCurrentStep("company");
        } else if (!data.steps?.stripe && !data.steps?.invoice) {
          // Company done, but neither optional step
          setCurrentStep("stripe");
        } else if (!data.steps?.stripe) {
          setCurrentStep("stripe");
        } else if (!data.steps?.invoice) {
          setCurrentStep("invoice");
        } else {
          // All steps done, complete onboarding
          completeOnboardingAndRedirect();
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
          .then(res => res.json())
          .then(data => {
            setSteps({
              company: data.steps?.company || false,
              stripe: data.steps?.stripe || false,
              invoice: data.steps?.invoice || false,
            });
          })
          .catch(err => console.error("Error refreshing status:", err));
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

  if (status === "loading" || loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50">
        <div className="text-center">
          <div className="relative w-32 h-32 mx-auto mb-4">
            <Image
              src="/logo-primary.svg"
              alt="gginvoice"
              fill
              className="object-contain"
            />
          </div>
          <Loader2 className="h-8 w-8 animate-spin text-blue-600 mx-auto" />
        </div>
      </div>
    );
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
                width={180}
                height={72}
                className="object-contain"
              />
            </div>
            
            <div className="space-y-3">
              <h1 className="text-3xl font-bold text-gray-900">
                Welcome to gginvoice! 👋
              </h1>
              <p className="text-lg text-gray-700 leading-relaxed">
                Let's get you set up in just a few steps. We'll help you configure your account so you can start creating professional invoices.
              </p>
            </div>

            <div className="flex-1 flex items-start justify-start pt-12">
              <ProgressIndicator currentStep={currentStep} />
            </div>
          </div>
        </aside>

        {/* Right column with content */}
        <section className="flex-1 flex flex-col bg-white px-4 py-10 sm:px-6 lg:px-12">
          <div className="flex-1">
            {currentStep === "company" && <CompanyStep onNext={handleNext} />}
            {currentStep === "stripe" && (
              <StripeStep onNext={handleNext} onSkip={handleSkip} />
            )}
            {currentStep === "invoice" && (
              <InvoiceStep onNext={handleNext} onSkip={handleSkip} />
            )}
          </div>
        </section>
      </main>
    </div>
  );
}

