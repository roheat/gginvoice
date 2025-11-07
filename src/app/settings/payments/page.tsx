"use client";

import { DashboardLayout } from "@/components/dashboard/dashboard-layout";
import { PageHeader } from "@/components/dashboard/page-header";
import { MainContent } from "@/components/dashboard/main-content";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Separator } from "@/components/ui/separator";
import {
  CreditCard,
  CheckCircle,
  AlertCircle,
  Loader2,
  ExternalLink,
  Shield,
  Zap,
} from "lucide-react";
import { useState, useEffect } from "react";
import { toast } from "sonner";

interface StripeConnectionStatus {
  connected: boolean;
  accountId?: string;
  status?: string;
  onboardingComplete?: boolean;
  chargesEnabled?: boolean;
  payoutsEnabled?: boolean;
}

export default function PaymentsSettingsPage() {
  const [connectionStatus, setConnectionStatus] =
    useState<StripeConnectionStatus>({
      connected: false,
    });
  const [loading, setLoading] = useState(true);
  const [connecting, setConnecting] = useState(false);

  useEffect(() => {
    fetchConnectionStatus();
  }, []);

  const fetchConnectionStatus = async () => {
    try {
      const response = await fetch("/api/stripe/status");
      const data = await response.json();

      if (data.success) {
        setConnectionStatus({
          connected: data.connected,
          accountId: data.accountId,
          status: data.status,
          onboardingComplete: data.onboardingComplete,
          chargesEnabled: data.chargesEnabled,
          payoutsEnabled: data.payoutsEnabled,
        });
      }
    } catch (error) {
      console.error("Error fetching Stripe status:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleConnectStripe = async () => {
    setConnecting(true);
    try {
      const response = await fetch("/api/stripe/connect", {
        method: "POST",
      });
      const data = await response.json();

      if (data.success && data.url) {
        window.location.href = data.url;
      } else {
        toast.error("Failed to initiate Stripe connection");
      }
    } catch (error) {
      console.error("Error connecting to Stripe:", error);
      toast.error("Failed to connect to Stripe");
    } finally {
      setConnecting(false);
    }
  };

  const handleDisconnectStripe = async () => {
    if (
      confirm(
        "Are you sure you want to disconnect from Stripe? This will disable payment processing for all your invoices."
      )
    ) {
      try {
        const response = await fetch("/api/stripe/disconnect", {
          method: "POST",
        });
        const data = await response.json();

        if (data.success) {
          setConnectionStatus({ connected: false });
          toast.success("Disconnected from Stripe");
        } else {
          toast.error("Failed to disconnect from Stripe");
        }
      } catch (error) {
        console.error("Error disconnecting from Stripe:", error);
        toast.error("Failed to disconnect from Stripe");
      }
    }
  };

  const getStatusBadge = () => {
    if (!connectionStatus.connected) {
      return (
        <Badge variant="destructive" className="bg-red-100 text-red-800">
          <AlertCircle className="h-3 w-3 mr-1" />
          Disconnected
        </Badge>
      );
    }

    if (connectionStatus.status === "PENDING") {
      return (
        <Badge variant="secondary" className="bg-yellow-100 text-yellow-800">
          <Loader2 className="h-3 w-3 mr-1 animate-spin" />
          Pending
        </Badge>
      );
    }

    return (
      <Badge variant="default" className="bg-green-100 text-green-800">
        <CheckCircle className="h-3 w-3 mr-1" />
        Connected
      </Badge>
    );
  };

  const getStatusDescription = () => {
    if (!connectionStatus.connected) {
      return "Connect your Stripe account to accept payments from clients.";
    }

    if (connectionStatus.status === "PENDING") {
      return "Your Stripe account is being verified. This usually takes a few minutes.";
    }

    if (!connectionStatus.chargesEnabled) {
      return "Your Stripe account needs additional verification to accept payments.";
    }

    return "Your Stripe account is fully set up and ready to accept payments.";
  };

  if (loading) {
    return (
      <DashboardLayout>
        <PageHeader
          title="Payment Settings"
          subtitle="Manage your Stripe payment integration"
        />
        <MainContent>
          <div className="flex items-center justify-center py-8">
            <Loader2 className="h-6 w-6 animate-spin" />
            <span className="ml-2">Loading payment settings...</span>
          </div>
        </MainContent>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <PageHeader
        title="Payment Settings"
        subtitle="Manage your Stripe payment integration"
      />
      <MainContent>
        <div className="max-w-4xl mx-auto space-y-6">
          {/* Stripe Connection Status */}
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  <div className="p-2 bg-blue-100 rounded-lg">
                    <CreditCard className="h-6 w-6 text-blue-600" />
                  </div>
                  <div>
                    <CardTitle>Stripe Integration</CardTitle>
                    <p className="text-sm text-gray-600 mt-1">
                      {getStatusDescription()}
                    </p>
                  </div>
                </div>
                {getStatusBadge()}
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              {!connectionStatus.connected ? (
                <div className="space-y-4">
                  <Alert>
                    <Shield className="h-4 w-4" />
                    <AlertDescription>
                      Connect your Stripe account to start accepting payments
                      from your clients. Stripe handles all payment processing
                      securely and complies with PCI standards.
                    </AlertDescription>
                  </Alert>

                  <div className="flex items-center space-x-4">
                    <Button
                      onClick={handleConnectStripe}
                      disabled={connecting}
                      className="bg-blue-600 hover:bg-blue-700"
                    >
                      {connecting ? (
                        <>
                          <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                          Connecting...
                        </>
                      ) : (
                        <>
                          <CreditCard className="h-4 w-4 mr-2" />
                          Connect to Stripe
                        </>
                      )}
                    </Button>
                    <Button variant="outline" asChild>
                      <a
                        href="https://stripe.com/docs"
                        target="_blank"
                        rel="noopener noreferrer"
                      >
                        <ExternalLink className="h-4 w-4 mr-2" />
                        Learn More
                      </a>
                    </Button>
                  </div>
                </div>
              ) : (
                <div className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="p-4 bg-green-50 rounded-lg">
                      <div className="flex items-center space-x-2">
                        <CheckCircle className="h-5 w-5 text-green-600" />
                        <span className="font-medium text-green-800">
                          Account Connected
                        </span>
                      </div>
                      <p className="text-sm text-green-700 mt-1">
                        Account ID: {connectionStatus.accountId}
                      </p>
                    </div>

                    <div className="p-4 bg-blue-50 rounded-lg">
                      <div className="flex items-center space-x-2">
                        <Zap className="h-5 w-5 text-blue-600" />
                        <span className="font-medium text-blue-800">
                          Payment Processing
                        </span>
                      </div>
                      <p className="text-sm text-blue-700 mt-1">
                        {connectionStatus.chargesEnabled
                          ? "Enabled"
                          : "Pending Verification"}
                      </p>
                    </div>
                  </div>

                  <Separator />

                  <div className="flex items-center justify-between">
                    <div>
                      <h4 className="font-medium">Account Management</h4>
                      <p className="text-sm text-gray-600">
                        Manage your Stripe account settings and view payouts.
                      </p>
                    </div>
                    <div className="flex items-center space-x-2">
                      <Button variant="outline" asChild>
                        <a
                          href="https://dashboard.stripe.com"
                          target="_blank"
                          rel="noopener noreferrer"
                        >
                          <ExternalLink className="h-4 w-4 mr-2" />
                          Stripe Dashboard
                        </a>
                      </Button>
                      <Button
                        variant="destructive"
                        onClick={handleDisconnectStripe}
                      >
                        Disconnect
                      </Button>
                    </div>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Payment Features */}
          <Card>
            <CardHeader>
              <CardTitle>Payment Features</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-3">
                  <h4 className="font-medium flex items-center">
                    <Shield className="h-4 w-4 mr-2 text-green-600" />
                    Security & Compliance
                  </h4>
                  <ul className="text-sm text-gray-600 space-y-1">
                    <li>• PCI DSS compliant payment processing</li>
                    <li>• 3D Secure authentication for international cards</li>
                    <li>• Fraud detection and prevention</li>
                    <li>• Encrypted payment data transmission</li>
                  </ul>
                </div>

                <div className="space-y-3">
                  <h4 className="font-medium flex items-center">
                    <Zap className="h-4 w-4 mr-2 text-blue-600" />
                    Payment Methods
                  </h4>
                  <ul className="text-sm text-gray-600 space-y-1">
                    <li>• Credit and debit cards</li>
                    <li>• Digital wallets (Apple Pay, Google Pay)</li>
                    <li>• International payment methods</li>
                    <li>• Automatic currency conversion</li>
                  </ul>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </MainContent>
    </DashboardLayout>
  );
}
