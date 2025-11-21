"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { FileText, ArrowRight, CheckCircle } from "lucide-react";
import { useRouter } from "next/navigation";
import { posthog } from "@/lib/posthog";

interface InvoiceStepProps {
  onNext: () => void;
  onSkip: () => void;
}

export function InvoiceStep({ onNext, onSkip }: InvoiceStepProps) {
  const router = useRouter();
  const [creating, setCreating] = useState(false);

  const handleCreateInvoice = () => {
    posthog.capture("onboarding_invoice_started");
    setCreating(true);
    // Redirect to invoice creation page with onboarding flag
    router.push("/invoices/new?onboarding=true");
  };

  const handleSkip = () => {
    posthog.capture("onboarding_invoice_skipped");
    onSkip();
  };

  return (
    <div className="max-w-2xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="mb-8">
        <h2 className="text-2xl font-bold text-gray-900 mb-2">
          Create Your First Invoice (Optional)
        </h2>
        <p className="text-gray-600">
          Create your first invoice now, or skip and do it later from the
          dashboard.
        </p>
      </div>

      <Card>
        <CardHeader>
          <div className="flex items-center gap-3">
            <div className="p-2 bg-blue-100 rounded-lg">
              <FileText className="h-6 w-6 text-blue-600" />
            </div>
            <div>
              <CardTitle>Ready to Invoice?</CardTitle>
              <CardDescription>
                Start creating invoices for your clients
              </CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          <ul className="space-y-2 text-sm text-gray-600">
            <li className="flex items-start">
              <CheckCircle className="h-4 w-4 text-green-500 mr-2 mt-0.5 flex-shrink-0" />
              <span>Create professional invoices in minutes</span>
            </li>
            <li className="flex items-start">
              <CheckCircle className="h-4 w-4 text-green-500 mr-2 mt-0.5 flex-shrink-0" />
              <span>Track payment status and send reminders</span>
            </li>
            <li className="flex items-start">
              <CheckCircle className="h-4 w-4 text-green-500 mr-2 mt-0.5 flex-shrink-0" />
              <span>Accept payments directly on invoices (if Stripe connected)</span>
            </li>
          </ul>
          <div className="flex gap-3 pt-4">
            <Button
              onClick={handleCreateInvoice}
              disabled={creating}
              className="bg-blue-600 hover:bg-blue-700 text-white flex-1"
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
              className="flex-1"
            >
              Skip for now
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

