"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { CreditCard, Loader2, CheckCircle, ArrowRight } from "lucide-react";
import { toast } from "sonner";
import { posthog } from "@/lib/posthog";

interface StripeStepProps {
  onNext: () => void;
  onSkip: () => void;
}

export function StripeStep({ onNext, onSkip }: StripeStepProps) {
  const [connecting, setConnecting] = useState(false);
  const [connected, setConnected] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    checkStripeStatus();
    
    // Check if returning from Stripe OAuth callback
    const urlParams = new URLSearchParams(window.location.search);
    const success = urlParams.get("success");
    const info = urlParams.get("info");
    
    if (success === "stripe_connected" || info) {
      // Stripe connection successful, refresh status
      setTimeout(() => {
        checkStripeStatus();
        // Clear URL params
        window.history.replaceState({}, "", window.location.pathname);
      }, 500);
    }
  }, []);

  const checkStripeStatus = async () => {
    try {
      const res = await fetch("/api/stripe/status");
      if (res.ok) {
        const data = await res.json();
        setConnected(data.connected || false);
      }
    } catch (error) {
      console.error("Error checking Stripe status:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleConnectStripe = async () => {
    setConnecting(true);
    try {
      posthog.capture("onboarding_stripe_started");
      const res = await fetch("/api/stripe/connect", {
        method: "POST",
      });
      const data = await res.json();
      if (res.ok && data.url) {
        // Redirect to Stripe OAuth
        window.location.href = data.url;
      } else {
        toast.error(data.error || "Failed to connect Stripe");
        setConnecting(false);
      }
    } catch (error) {
      console.error("Error connecting Stripe:", error);
      toast.error("Failed to connect Stripe");
      setConnecting(false);
    }
  };

  const handleContinue = () => {
    posthog.capture("onboarding_stripe_skipped");
    onNext();
  };

  const handleSkip = () => {
    posthog.capture("onboarding_stripe_skipped", { source: "skip_button" });
    onNext();
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="mb-8">
        <h2 className="text-2xl font-bold text-gray-900 mb-2">
          Payment Setup (Optional)
        </h2>
        <p className="text-gray-600">
          Connect Stripe to accept online payments directly on your invoices.
          You can set this up later in Settings if you prefer.
        </p>
      </div>

      {connected ? (
        <Card className="border-green-200 bg-green-50">
          <CardHeader>
            <div className="flex items-center gap-2">
              <CheckCircle className="h-5 w-5 text-green-600" />
              <CardTitle className="text-green-900">
                Stripe Connected Successfully
              </CardTitle>
            </div>
            <CardDescription className="text-green-700">
              Your Stripe account is connected. You can now accept payments
              through your invoices.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Button
              onClick={handleContinue}
              className="bg-blue-600 hover:bg-blue-700 text-white"
            >
              Continue
              <ArrowRight className="ml-2 h-4 w-4" />
            </Button>
          </CardContent>
        </Card>
      ) : (
        <Card>
          <CardHeader>
            <div className="flex items-center gap-3">
              <div className="p-2 bg-blue-100 rounded-lg">
                <CreditCard className="h-6 w-6 text-blue-600" />
              </div>
              <div>
                <CardTitle>Accept Online Payments</CardTitle>
                <CardDescription>
                  Connect your Stripe account to enable payment processing
                </CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            <ul className="space-y-2 text-sm text-gray-600">
              <li className="flex items-start">
                <CheckCircle className="h-4 w-4 text-green-500 mr-2 mt-0.5 flex-shrink-0" />
                <span>Accept credit card payments directly on invoices</span>
              </li>
              <li className="flex items-start">
                <CheckCircle className="h-4 w-4 text-green-500 mr-2 mt-0.5 flex-shrink-0" />
                <span>Automated payment tracking and receipts</span>
              </li>
              <li className="flex items-start">
                <CheckCircle className="h-4 w-4 text-green-500 mr-2 mt-0.5 flex-shrink-0" />
                <span>Secure payment processing with industry-standard encryption</span>
              </li>
            </ul>
            <div className="flex gap-3 pt-4">
              <Button
                onClick={handleConnectStripe}
                disabled={connecting}
                className="bg-blue-600 hover:bg-blue-700 text-white flex-1"
              >
                {connecting ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Connecting...
                  </>
                ) : (
                  <>
                    <CreditCard className="h-4 w-4 mr-2" />
                    Connect Stripe
                  </>
                )}
              </Button>
              <Button
                onClick={handleSkip}
                variant="outline"
                className="flex-1"
              >
                Skip for now
              </Button>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}

