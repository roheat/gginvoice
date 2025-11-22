"use client";

import { Card, CardContent, CardDescription, CardHeader } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { CreditCard, CheckCircle2, Circle } from "lucide-react";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { posthog } from "@/lib/posthog";

interface PaymentMethodsSelectorProps {
  stripeEnabled: boolean;
  stripeConnected: boolean;
  paypalEnabled: boolean;
  paypalConnected: boolean;
  isLoading?: boolean;
  onStripeToggle: (enabled: boolean) => void;
  onPaypalToggle: (enabled: boolean) => void;
  invoiceId?: string | null;
}

export function PaymentMethodsSelector({
  stripeEnabled,
  stripeConnected,
  paypalEnabled,
  paypalConnected,
  isLoading = false,
  onStripeToggle,
  onPaypalToggle,
  invoiceId,
}: PaymentMethodsSelectorProps) {
  const router = useRouter();

  const handleStripeClick = () => {
    if (!stripeConnected) return;
    
    const newState = !stripeEnabled;
    posthog.capture("invoice_stripe_toggled", {
      enabled: newState,
      invoiceId: invoiceId || null,
    });
    onStripeToggle(newState);
  };

  const handlePaypalClick = () => {
    if (!paypalConnected) return;
    
    const newState = !paypalEnabled;
    posthog.capture("invoice_paypal_toggled", {
      enabled: newState,
      invoiceId: invoiceId || null,
    });
    onPaypalToggle(newState);
  };

  const handleConnectStripe = () => {
    posthog.capture("stripe_connect_clicked", {
      source: "invoice_form",
    });
    router.push("/settings");
  };

  return (
    <div className="space-y-3">
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        {isLoading ? (
          <>
            {/* Skeleton Loader for Stripe */}
            <Card className="relative border-2 border-gray-200 flex flex-col animate-pulse">
              <CardHeader className="pb-3 flex-grow">
                <div className="flex items-center gap-2 mb-1">
                  <div className="h-6 w-20 bg-gray-200 rounded" />
                  <div className="h-5 w-20 bg-gray-200 rounded" />
                </div>
                <div className="space-y-2">
                  <div className="h-3 w-full bg-gray-200 rounded" />
                  <div className="h-3 w-3/4 bg-gray-200 rounded" />
                </div>
              </CardHeader>
              <CardContent className="pt-0 pb-3 mt-auto">
                <div className="h-8 w-full bg-gray-200 rounded" />
              </CardContent>
            </Card>

            {/* Skeleton Loader for PayPal */}
            <Card className="relative border-2 border-gray-200 flex flex-col animate-pulse">
              <CardHeader className="pb-3 flex-grow">
                <div className="flex items-center gap-2 mb-1">
                  <div className="h-6 w-20 bg-gray-200 rounded" />
                  <div className="h-5 w-20 bg-gray-200 rounded" />
                </div>
                <div className="space-y-2">
                  <div className="h-3 w-full bg-gray-200 rounded" />
                  <div className="h-3 w-3/4 bg-gray-200 rounded" />
                </div>
              </CardHeader>
              <CardContent className="pt-0 pb-3 mt-auto">
                <div className="h-8 w-full bg-gray-200 rounded" />
              </CardContent>
            </Card>
          </>
        ) : (
          <>
            {/* Stripe Card */}
            <Card
          onClick={handleStripeClick}
          className={`relative transition-all group flex flex-col gap-0 ${
            !stripeConnected
              ? "opacity-60 cursor-not-allowed hover:shadow-none"
              : stripeEnabled
              ? "border-2 border-blue-500 bg-blue-50/50 shadow-sm hover:shadow-md cursor-pointer"
              : "border-2 border-gray-200 hover:border-blue-300 hover:shadow-md cursor-pointer"
          }`}
        >
          {/* Checkmark - filled when active, outline when inactive but connected */}
          {stripeConnected && (
            <div className="absolute top-3 right-3 z-10">
              {stripeEnabled ? (
                <CheckCircle2 className="h-6 w-6 text-blue-600 fill-blue-100" />
              ) : (
                <Circle className="h-6 w-6 text-gray-400 group-hover:text-blue-400 transition-colors" />
              )}
            </div>
          )}
          
          <CardHeader className="pb-3 flex-grow gap-0">
            <div className="flex items-center mb-1">
              <div className="relative h-6 w-14 mr-2">
                <Image
                  src="/stripe-logo.svg"
                  alt="Stripe"
                  fill
                  className="object-contain"
                />
              </div>
              {stripeConnected && (
                <span className="text-xs font-medium text-green-700 bg-green-100 px-2 py-0.5 rounded">
                  Connected
                </span>
              )}
              {!stripeConnected && (
                <span className="text-xs font-medium text-gray-500 bg-gray-100 px-2 py-0.5 rounded">
                  Not Connected
                </span>
              )}
            </div>
            <CardDescription className="text-xs">
              Accept credit card payments securely
            </CardDescription>
          </CardHeader>
          <CardContent className="pt-0 pb-3 mt-auto">
            {!stripeConnected && (
              <Button
                size="sm"
                variant="outline"
                onClick={(e) => {
                  e.stopPropagation();
                  handleConnectStripe();
                }}
                className="w-full text-xs h-8"
              >
                <CreditCard className="h-3 w-3 mr-1.5" />
                Connect Stripe
              </Button>
            )}
          </CardContent>
        </Card>

        {/* PayPal Card */}
        <Card
          onClick={handlePaypalClick}
          className={`relative transition-all group flex flex-col gap-0 ${
            !paypalConnected
              ? "opacity-60 cursor-not-allowed hover:shadow-none"
              : paypalEnabled
              ? "border-2 border-blue-500 bg-blue-50/50 shadow-sm hover:shadow-md cursor-pointer"
              : "border-2 border-gray-200 hover:border-blue-300 hover:shadow-md cursor-pointer"
          }`}
        >
          {/* Checkmark - filled when active, outline when inactive but connected */}
          {paypalConnected && (
            <div className="absolute top-3 right-3 z-10">
              {paypalEnabled ? (
                <CheckCircle2 className="h-6 w-6 text-blue-600 fill-blue-100" />
              ) : (
                <Circle className="h-6 w-6 text-gray-400 group-hover:text-blue-400 transition-colors" />
              )}
            </div>
          )}
          
          <CardHeader className="pb-3 flex-grow gap-0">
            <div className="flex items-center mb-1">
              <div className="relative h-6 w-20 mr-2">
                <Image
                  src="/paypal-logo.svg"
                  alt="PayPal"
                  fill
                  className="object-contain"
                />
              </div>
              {paypalConnected && (
                <span className="text-xs font-medium text-green-700 bg-green-100 px-2 py-0.5 rounded">
                  Connected
                </span>
              )}
              <span className="text-xs font-medium text-gray-500 bg-gray-100 px-2 py-0.5 rounded">
                Coming Soon
              </span>
            </div>
            <CardDescription className="text-xs">
              Accept PayPal payments from customers
            </CardDescription>
          </CardHeader>
          <CardContent className="pt-0 pb-3 mt-auto">
            {/* Empty CardContent to maintain same height as Stripe card */}
          </CardContent>
        </Card>
          </>
        )}
      </div>

      {!stripeConnected && !paypalConnected && (
        <p className="text-xs text-gray-500 italic">
          Connect a payment provider in Settings to accept online payments
        </p>
      )}
    </div>
  );
}

