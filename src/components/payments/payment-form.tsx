"use client";

import { useState, useEffect } from "react";
import { loadStripe, Stripe } from "@stripe/stripe-js";
import {
  Elements,
  PaymentElement,
  useStripe,
  useElements,
} from "@stripe/react-stripe-js";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { CreditCard, Shield, AlertCircle, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { PaymentFormSkeleton } from "@/components/ui/skeletons/payment-form-skeleton";

interface PaymentFormProps {
  invoice: {
    id: string;
    number: string;
    total: number;
    currency: string;
    client: {
      name: string;
      email: string | null;
    };
  };
  onPaymentSuccess: () => void;
}

interface PaymentFormContentProps extends PaymentFormProps {
  clientSecret: string;
}

const PaymentFormContent = ({
  invoice,
  onPaymentSuccess,
  clientSecret,
}: PaymentFormContentProps) => {
  const stripe = useStripe();
  const elements = useElements();
  const [isProcessing, setIsProcessing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();

    if (!stripe || !elements) {
      return;
    }

    setIsProcessing(true);
    setError(null);

    try {
      // For PaymentElement, we must call elements.submit() first to validate the payment method
      // This is required before calling confirmPayment()
      const { error: submitError } = await elements.submit();

      if (submitError) {
        console.error("Payment element validation error:", submitError);
        setError(
          submitError.message || "Please check your payment information"
        );
        toast.error(
          submitError.message || "Please check your payment information"
        );
        setIsProcessing(false);
        return;
      }

      // Use confirmPayment with PaymentElement
      // The payment method is automatically extracted from the PaymentElement
      const { error: stripeError, paymentIntent } = await stripe.confirmPayment(
        {
          elements,
          clientSecret,
          confirmParams: {
            // Billing details - payment method comes automatically from PaymentElement
            return_url: window.location.href, // Required for 3DS redirects
          },
          redirect: "if_required", // Don't redirect unless 3DS is required
        }
      );

      if (stripeError) {
        console.error("Stripe payment error:", {
          type: stripeError.type,
          code: stripeError.code,
          message: stripeError.message,
          decline_code: stripeError.decline_code,
        });
        setError(stripeError.message || "Payment failed");
        toast.error(stripeError.message || "Payment failed");
        return;
      }

      if (!paymentIntent) {
        console.error("No payment intent returned from confirmation");
        setError("Payment confirmation failed - no payment intent returned");
        toast.error("Payment confirmation failed");
        return;
      }

      if (paymentIntent.status === "succeeded") {
        toast.success("Payment successful!");
        // Wait a moment for webhook to process
        setTimeout(() => {
          onPaymentSuccess();
        }, 1000);
      } else if (paymentIntent.status === "requires_action") {
        toast.info("Payment requires additional authentication");
        setError(
          "Payment requires additional authentication. Please complete the verification."
        );
      } else {
        toast.info(`Payment status: ${paymentIntent.status}`);
        setError(`Payment status: ${paymentIntent.status}. Please try again.`);
      }
    } catch (err) {
      console.error("Payment error:", err);
      setError(
        err instanceof Error ? err.message : "Payment failed. Please try again."
      );
    } finally {
      setIsProcessing(false);
    }
  };

  const formatCurrency = (amount: number, currency: string) => {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: currency.toUpperCase(),
    }).format(amount);
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {/* Payment Amount */}
      <div className="text-center p-6 bg-blue-50 rounded-lg">
        <h3 className="text-2xl font-bold text-blue-900">
          {formatCurrency(invoice.total, invoice.currency)}
        </h3>
        <p className="text-blue-700 mt-1">Invoice #{invoice.number}</p>
      </div>

      {/* Payment Element */}
      <div className="space-y-2">
        <label className="text-sm font-medium text-gray-700">
          Payment Information
        </label>
        <div className="p-4 border border-gray-300 rounded-lg">
          <PaymentElement
            options={{
              layout: "tabs",
            }}
          />
        </div>
      </div>

      {/* Error Message */}
      {error && (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      {/* Security Info */}
      <div className="flex items-center space-x-2 text-sm text-gray-600">
        <Shield className="h-4 w-4" />
        <span>Your payment information is secure and encrypted</span>
      </div>

      {/* Submit Button */}
      <Button
        type="submit"
        disabled={!stripe || isProcessing}
        className="w-full bg-blue-600 hover:bg-blue-700"
      >
        {isProcessing ? (
          <>
            <Loader2 className="h-4 w-4 mr-2 animate-spin" />
            Processing Payment...
          </>
        ) : (
          <>
            <CreditCard className="h-4 w-4 mr-2" />
            Pay {formatCurrency(invoice.total, invoice.currency)}
          </>
        )}
      </Button>

      {/* Powered by Stripe */}
      <div className="text-center text-xs text-gray-500">
        <span>Powered by </span>
        <span className="font-semibold text-blue-600">Stripe</span>
      </div>
    </form>
  );
};

export function PaymentForm({ invoice, onPaymentSuccess }: PaymentFormProps) {
  const [stripePromise, setStripePromise] =
    useState<Promise<Stripe | null> | null>(null);
  const [clientSecret, setClientSecret] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [initError, setInitError] = useState<string | null>(null);

  useEffect(() => {
    // Fetch payment intent to get clientSecret and stripeAccountId
    const initializePayment = async () => {
      try {
        const response = await fetch("/api/payments/create-intent", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            invoiceId: invoice.id,
            amount: invoice.total,
            currency: invoice.currency,
          }),
        });

        if (!response.ok) {
          const errorData = await response.json().catch(() => ({}));
          throw new Error(
            errorData.error ||
              errorData.message ||
              `HTTP ${response.status}: Failed to create payment intent`
          );
        }

        const data = await response.json();

        if (!data.success) {
          throw new Error(
            data.error || data.message || "Failed to create payment intent"
          );
        }

        if (!data.clientSecret) {
          throw new Error(
            "No client secret returned from payment intent creation"
          );
        }

        if (!data.stripeAccountId) {
          throw new Error(
            "No stripe account ID returned from payment intent creation"
          );
        }

        if (!process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY) {
          throw new Error("Stripe publishable key not configured");
        }

        // Initialize Stripe with connected account context
        // This is required for Direct Charges - the payment intent is on the connected account
        const stripe = await loadStripe(
          process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY,
          {
            stripeAccount: data.stripeAccountId,
          }
        );

        if (!stripe) {
          throw new Error(
            "Failed to initialize Stripe - loadStripe returned null"
          );
        }

        setStripePromise(Promise.resolve(stripe));
        setClientSecret(data.clientSecret);
        setInitError(null); // Clear any previous errors
      } catch (error) {
        console.error("Error initializing payment:", error);
        const errorMessage =
          error instanceof Error
            ? error.message
            : "Failed to initialize payment form";
        setInitError(errorMessage);
        toast.error(errorMessage);
      } finally {
        setLoading(false);
      }
    };

    initializePayment();
  }, [invoice.id, invoice.total, invoice.currency]);

  if (loading) {
    return <PaymentFormSkeleton />;
  }

  if (initError || !stripePromise || !clientSecret) {
    return (
      <div className="p-6 space-y-4">
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>
            {initError ||
              "Failed to initialize payment form. Please refresh the page."}
          </AlertDescription>
        </Alert>
        <Button
          onClick={() => window.location.reload()}
          variant="outline"
          className="w-full"
        >
          Refresh Page
        </Button>
      </div>
    );
  }

  return (
    <Elements stripe={stripePromise} options={{ clientSecret }}>
      <PaymentFormContent
        invoice={invoice}
        onPaymentSuccess={onPaymentSuccess}
        clientSecret={clientSecret}
      />
    </Elements>
  );
}
