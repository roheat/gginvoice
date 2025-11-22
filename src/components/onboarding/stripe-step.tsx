"use client";

import { useState, useEffect, useRef } from "react";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
} from "@/components/ui/card";
import { Loader2, ArrowLeft, MoreVertical, LogOut } from "lucide-react";
import { toast } from "sonner";
import { posthog } from "@/lib/posthog";
import Image from "next/image";

interface StripeStepProps {
  onNext: () => void;
  onSkip: () => void;
  onBack?: () => void;
}

export function StripeStep({ onNext, onSkip, onBack }: StripeStepProps) {
  const [connecting, setConnecting] = useState(false);
  const [connected, setConnected] = useState(false);
  const [loading, setLoading] = useState(true);
  const [menuOpen, setMenuOpen] = useState(false);
  const [disconnecting, setDisconnecting] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

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
    onSkip();
  };

  const handleDisconnect = async () => {
    setDisconnecting(true);
    setMenuOpen(false);
    try {
      const response = await fetch("/api/stripe/disconnect", {
        method: "POST",
      });
      const data = await response.json();

      if (data.success) {
        posthog.capture("onboarding_stripe_disconnected");
        setConnected(false);
        toast.success("Disconnected from Stripe");
        // Refresh status
        await checkStripeStatus();
      } else {
        toast.error("Failed to disconnect from Stripe");
      }
    } catch (error) {
      console.error("Error disconnecting from Stripe:", error);
      toast.error("Failed to disconnect from Stripe");
    } finally {
      setDisconnecting(false);
    }
  };

  // Close menu when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setMenuOpen(false);
      }
    };

    if (menuOpen) {
      document.addEventListener("mousedown", handleClickOutside);
    }

    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [menuOpen]);

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Back button above title */}
      {onBack && (
        <div className="mb-6">
          <Button
            onClick={onBack}
            variant="outline"
            className="flex items-center gap-2"
          >
            <ArrowLeft className="h-4 w-4" />
            Back
          </Button>
        </div>
      )}

      <div className="mb-8">
        <h2 className="text-2xl font-bold text-gray-900 mb-2">
          Payment Setup (Optional)
        </h2>
        <p className="text-gray-600">
          Connect payment providers to accept online payments directly from your
          invoices. You can set this up later in Settings.
        </p>
      </div>

      {/* Payment provider cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
        {/* Stripe Card */}
        <Card
          className={`relative ${
            connected ? "border-green-200 bg-green-50" : ""
          }`}
        >
          {/* 3-dots menu button - positioned at top right */}
          {connected && (
            <div className="absolute top-4 right-4" ref={menuRef}>
              <button
                type="button"
                onClick={() => setMenuOpen(!menuOpen)}
                className="rounded-full p-1.5 text-gray-600 hover:bg-gray-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500"
                aria-expanded={menuOpen}
                aria-label="Stripe options"
              >
                <MoreVertical className="h-4 w-4" />
              </button>
              {menuOpen && (
                <div className="absolute right-0 top-8 w-40 rounded-xl border border-gray-200 bg-white text-slate-900 shadow-lg z-10">
                  <button
                    type="button"
                    className="flex w-full items-center gap-2 px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-100 overflow-hidden rounded-xl"
                    onClick={handleDisconnect}
                    disabled={disconnecting}
                  >
                    <LogOut className="h-4 w-4 text-slate-500" />
                    {disconnecting ? "Disconnecting..." : "Disconnect"}
                  </button>
                </div>
              )}
            </div>
          )}
          <CardHeader>
            <div className="flex items-center gap-3 mb-2">
              <div className="relative h-8 w-24">
                <Image
                  src="/stripe-logo.svg"
                  alt="Stripe"
                  fill
                  className="object-contain"
                />
              </div>
              {connected && (
                <span className="text-xs font-medium text-green-700 bg-green-100 px-2 py-1 rounded">
                  Connected
                </span>
              )}
            </div>
            <CardDescription>
              Stripe is a simple and secure way to accept credit card payments
              online.
            </CardDescription>
          </CardHeader>
          <CardContent>
            {connected ? (
              <Button
                onClick={handleContinue}
                className="w-full bg-blue-600 hover:bg-blue-700 text-white"
              >
                Continue
              </Button>
            ) : (
              <Button
                onClick={handleConnectStripe}
                disabled={connecting}
                className="w-full bg-blue-600 hover:bg-blue-700 text-white"
              >
                {connecting ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Connecting...
                  </>
                ) : (
                  "Connect to Stripe"
                )}
              </Button>
            )}
          </CardContent>
        </Card>

        {/* PayPal Card */}
        <Card className="opacity-75">
          <CardHeader>
            <div className="flex items-center gap-3 mb-2">
              <div className="relative h-8 w-24">
                <Image
                  src="/paypal-logo.svg"
                  alt="PayPal"
                  fill
                  className="object-contain"
                />
              </div>
              <span className="text-xs font-medium text-gray-500 bg-gray-100 px-2 py-1 rounded">
                Coming soon
              </span>
            </div>
            <CardDescription>
              Connect your account and start accepting payments using PayPal.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Button
              disabled
              className="w-full bg-gray-300 text-gray-500 cursor-not-allowed"
            >
              Connect to PayPal
            </Button>
          </CardContent>
        </Card>
      </div>

      {/* Skip button below cards */}
      <div className="flex justify-center">
        <Button onClick={handleSkip} variant="outline">
          Skip for now
        </Button>
      </div>
    </div>
  );
}
