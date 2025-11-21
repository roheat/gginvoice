"use client";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { CheckCircle, ArrowRight } from "lucide-react";
import { useRouter } from "next/navigation";
import { posthog } from "@/lib/posthog";
import { useEffect } from "react";

interface CompleteStepProps {
  steps: {
    company: boolean;
    stripe: boolean;
    invoice: boolean;
  };
}

export function CompleteStep({ steps }: CompleteStepProps) {
  const router = useRouter();

  useEffect(() => {
    // Mark onboarding as complete
    const completeOnboarding = async () => {
      try {
        const startTime = sessionStorage.getItem("onboarding_start_time");
        const duration = startTime ? Date.now() - parseInt(startTime) : 0;
        
        await fetch("/api/onboarding/complete", {
          method: "POST",
        });

        posthog.capture("onboarding_completed", {
          duration_seconds: Math.round(duration / 1000),
          stripe_connected: steps.stripe,
          invoice_created: steps.invoice,
        });

        // Clear start time
        sessionStorage.removeItem("onboarding_start_time");
      } catch (error) {
        console.error("Error completing onboarding:", error);
      }
    };

    completeOnboarding();
  }, [steps]);

  const handleGoToDashboard = () => {
    router.push("/invoices");
  };

  return (
    <div className="max-w-2xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
      <div className="text-center mb-8">
        <div className="flex justify-center mb-6">
          <div className="p-4 bg-green-100 rounded-full">
            <CheckCircle className="h-12 w-12 text-green-600" />
          </div>
        </div>
        <h1 className="text-3xl font-bold text-gray-900 mb-2">
          You&apos;re all set! 🎉
        </h1>
        <p className="text-lg text-gray-600">
          Welcome to gginvoice. You&apos;re ready to start creating invoices.
        </p>
      </div>

      <Card className="mb-6">
        <CardHeader>
          <CardTitle>What you&apos;ve set up:</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="flex items-center gap-3">
            <CheckCircle className="h-5 w-5 text-green-500 flex-shrink-0" />
            <span className="text-gray-700">Company information configured</span>
          </div>
          {steps.stripe && (
            <div className="flex items-center gap-3">
              <CheckCircle className="h-5 w-5 text-green-500 flex-shrink-0" />
              <span className="text-gray-700">Stripe payment processing connected</span>
            </div>
          )}
          {steps.invoice && (
            <div className="flex items-center gap-3">
              <CheckCircle className="h-5 w-5 text-green-500 flex-shrink-0" />
              <span className="text-gray-700">First invoice created</span>
            </div>
          )}
        </CardContent>
      </Card>

      <div className="text-center">
        <Button
          onClick={handleGoToDashboard}
          size="lg"
          className="bg-blue-600 hover:bg-blue-700 text-white px-8 py-6 text-lg"
        >
          Go to Dashboard
          <ArrowRight className="ml-2 h-5 w-5" />
        </Button>
      </div>
    </div>
  );
}

