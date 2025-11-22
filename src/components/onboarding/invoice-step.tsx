"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { FileText, ArrowLeft } from "lucide-react";
import { posthog } from "@/lib/posthog";
import Image from "next/image";

interface InvoiceStepProps {
  onBack?: () => void;
}

export function InvoiceStep({ onBack }: InvoiceStepProps) {
  const [creating, setCreating] = useState(false);

  const handleCreateInvoice = async () => {
    posthog.capture("onboarding_invoice_started");
    setCreating(true);

    try {
      // Mark onboarding as complete before redirecting
      const response = await fetch("/api/onboarding/complete", {
        method: "POST",
      });

      const data = await response.json();

      if (!response.ok || !data.success) {
        console.error("Failed to complete onboarding:", data);
        // Still redirect even if marking complete fails
        window.location.href = "/invoices/new?onboarding_complete=true";
        return;
      }

      // Use full page reload with query param to bypass onboarding check
      window.location.href = "/invoices/new?onboarding_complete=true";
    } catch (error) {
      console.error("Error completing onboarding:", error);
      // Still redirect even if marking complete fails
      window.location.href = "/invoices/new?onboarding_complete=true";
    }
  };

  const handleSkip = async () => {
    posthog.capture("onboarding_invoice_skipped");

    try {
      // Mark onboarding as complete before redirecting
      const response = await fetch("/api/onboarding/complete", {
        method: "POST",
      });

      const data = await response.json();

      if (!response.ok || !data.success) {
        console.error("Failed to complete onboarding:", data);
      }
    } catch (error) {
      console.error("Error completing onboarding:", error);
    }

    // Use full page reload with query param to bypass onboarding check
    window.location.href = "/invoices?onboarding_complete=true";
  };

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
          Create Your First Invoice
        </h2>
        <p className="text-gray-600">
          Create and send your first invoice within 60 seconds.
        </p>
      </div>

      {/* Illustration */}
      <div className="mb-8 flex justify-center">
        <div className="relative w-full max-w-md h-80">
          <Image
            src="/create-invoice.svg"
            alt="Create Invoice"
            fill
            className="object-contain"
          />
        </div>
      </div>

      {/* Buttons - stacked vertically, smaller */}
      <div className="flex flex-col gap-3 items-center">
        <Button
          onClick={handleCreateInvoice}
          disabled={creating}
          className="bg-blue-600 hover:bg-blue-700 text-white w-full max-w-xs text-sm py-5"
        >
          {creating ? (
            "Redirecting..."
          ) : (
            <>
              <FileText className="h-4 w-4 mr-2" />
              Create Invoice
            </>
          )}
        </Button>
        <Button
          onClick={handleSkip}
          variant="outline"
          className="w-full max-w-xs text-sm py-5"
        >
          Go to Dashboard
        </Button>
      </div>
    </div>
  );
}
