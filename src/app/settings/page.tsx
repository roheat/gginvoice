"use client";

import { DashboardLayout } from "@/components/dashboard/dashboard-layout";
import { PageHeader } from "@/components/dashboard/page-header";
import { MainContent } from "@/components/dashboard/main-content";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Separator } from "@/components/ui/separator";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectTrigger,
  SelectValue,
  SelectContent,
  SelectItem,
} from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import {
  CreditCard,
  CheckCircle,
  AlertCircle,
  Loader2,
  ExternalLink,
  Shield,
  Zap,
  X,
} from "lucide-react";
import { useState, useEffect, useCallback } from "react";
import { toast } from "sonner";
import { LogoUpload } from "@/components/settings/logo-upload";
import { useOnboardingProgress } from "@/contexts/onboarding-context";

type Settings = {
  companyName?: string | null;
  companyAddress?: string | null;
  companyPhone?: string | null;
  companyEmail?: string | null;
  companyWebsite?: string | null;
  companyLogoUrl?: string | null;
  defaultCurrency?: string;
  defaultTaxRate?: number | null;
  emailNotifications?: boolean;
};

function AccountSettingsForm() {
  const [settings, setSettings] = useState<Settings | null>(null);
  const [initialSettings, setInitialSettings] = useState<Settings | null>(null);
  const [loadingSettings, setLoadingSettings] = useState(true);
  const [saving, setSaving] = useState(false);
  const { refetch: refreshOnboarding } = useOnboardingProgress();

  useEffect(() => {
    const fetchSettings = async () => {
      try {
        const res = await fetch("/api/settings/account");
        const json = await res.json();
        if (res.ok && json.success) {
          const s = json.user?.settings || {};
          // Normalize numeric field
          if (s.defaultTaxRate === null || s.defaultTaxRate === undefined)
            s.defaultTaxRate = 0;
          setSettings(s);
          setInitialSettings(s);
        } else {
          console.error("Failed to fetch settings", json);
        }
      } catch (err) {
        console.error("Error fetching settings:", err);
      } finally {
        setLoadingSettings(false);
      }
    };
    fetchSettings();
  }, []);

  const handleChange = (
    field: keyof Settings,
    value: string | number | boolean | null
  ) => {
    setSettings((prev) => ({ ...(prev || {}), [field]: value }));
  };

  const normalize = (s: Settings | null) => ({
    companyName: s?.companyName ?? null,
    companyAddress: s?.companyAddress ?? null,
    companyPhone: s?.companyPhone ?? null,
    companyEmail: s?.companyEmail ?? null,
    companyWebsite: s?.companyWebsite ?? null,
    companyLogoUrl: s?.companyLogoUrl ?? null,
    defaultCurrency: s?.defaultCurrency ?? "USD",
    defaultTaxRate: s?.defaultTaxRate ?? 0,
    emailNotifications: s?.emailNotifications ?? true,
  });

  const isDirty = () => {
    if (!initialSettings || !settings) return false;
    return (
      JSON.stringify(normalize(initialSettings)) !==
      JSON.stringify(normalize(settings))
    );
  };

  const handleSave = async () => {
    if (!settings) return;
    setSaving(true);
    try {
      const payload = {
        companyName: settings.companyName ?? null,
        companyAddress: settings.companyAddress ?? null,
        companyPhone: settings.companyPhone ?? null,
        companyEmail: settings.companyEmail ?? null,
        companyWebsite: settings.companyWebsite ?? null,
        defaultCurrency: settings.defaultCurrency ?? "USD",
        defaultTaxRate: settings.defaultTaxRate ?? 0,
        emailNotifications: settings.emailNotifications ?? false,
      };
      const res = await fetch("/api/settings/account", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const json = await res.json();
      if (res.ok && json.success) {
        setInitialSettings(json.settings || settings);
        setSettings((prev) => ({ ...(prev || {}), ...json.settings }));
        toast.success("Settings updated");
        // Refresh onboarding progress
        refreshOnboarding();
      } else {
        toast.error(json.error || "Failed to update settings");
      }
    } catch (err) {
      console.error("Error saving settings:", err);
      toast.error("Failed to update settings");
    } finally {
      setSaving(false);
    }
  };

  if (loadingSettings) {
    return <div className="py-6">Loading settings...</div>;
  }

  const handleLogoUpdate = (logoUrl: string | null) => {
    setSettings((prev) => ({ ...(prev || {}), companyLogoUrl: logoUrl }));
    setInitialSettings((prev) => ({
      ...(prev || {}),
      companyLogoUrl: logoUrl,
    }));
  };

  return (
    <div className="space-y-4">
      <LogoUpload
        currentLogoUrl={settings?.companyLogoUrl}
        onLogoUpdate={handleLogoUpdate}
      />
      <div>
        <Label htmlFor="companyName">Company Name</Label>
        <Input
          id="companyName"
          value={settings?.companyName ?? ""}
          onChange={(e) => handleChange("companyName", e.target.value)}
          placeholder="Your company name"
        />
      </div>
      <div>
        <Label>Default Currency</Label>
        <Select
          value={settings?.defaultCurrency ?? "USD"}
          onValueChange={(val) => handleChange("defaultCurrency", val)}
        >
          <SelectTrigger className="w-full">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="USD">USD - US Dollar</SelectItem>
            <SelectItem value="EUR">EUR - Euro</SelectItem>
            <SelectItem value="GBP">GBP - British Pound</SelectItem>
          </SelectContent>
        </Select>
      </div>
      <div>
        <Label htmlFor="defaultTaxRate">Default Tax Rate</Label>
        <Input
          id="defaultTaxRate"
          type="number"
          step="0.01"
          value={settings?.defaultTaxRate ?? 0}
          onChange={(e) =>
            handleChange(
              "defaultTaxRate",
              e.target.value === "" ? null : Number(e.target.value)
            )
          }
          placeholder="0.00"
        />
      </div>
      <div className="flex items-center">
        <Switch
          checked={Boolean(settings?.emailNotifications)}
          onCheckedChange={(val) =>
            handleChange("emailNotifications", Boolean(val))
          }
        />
        <Label className="ml-2">Email notifications for new invoices</Label>
      </div>
      <div className="pt-4 border-t flex items-center justify-end space-x-3">
        <Button
          variant="outline"
          onClick={() => {
            // reset to initial
            setSettings(initialSettings);
          }}
          disabled={saving}
        >
          Cancel
        </Button>
        <Button onClick={handleSave} disabled={!isDirty() || saving}>
          {saving ? (
            <>
              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              Saving...
            </>
          ) : (
            "Update Settings"
          )}
        </Button>
      </div>
    </div>
  );
}

interface StripeConnectionStatus {
  connected: boolean;
  accountId?: string;
  status?: string;
  onboardingComplete?: boolean;
  chargesEnabled?: boolean;
  payoutsEnabled?: boolean;
}

export default function SettingsPage() {
  const [connectionStatus, setConnectionStatus] =
    useState<StripeConnectionStatus>({
      connected: false,
    });
  const [connecting, setConnecting] = useState(false);
  const [showDisconnectModal, setShowDisconnectModal] = useState(false);
  const [disconnecting, setDisconnecting] = useState(false);

  const fetchConnectionStatus = useCallback(async () => {
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
    }
  }, []);

  useEffect(() => {
    fetchConnectionStatus();

    // Refetch status when returning from OAuth callback
    // Check for success/error query params in URL
    const urlParams = new URLSearchParams(window.location.search);
    const success = urlParams.get("success");
    const error = urlParams.get("error");
    const info = urlParams.get("info");

    if (success || error || info) {
      // Small delay to ensure database is updated
      setTimeout(() => {
        fetchConnectionStatus();
      }, 500);

      // Show toast notifications
      if (success === "stripe_connected") {
        toast.success("Stripe account connected successfully!");
      } else if (info === "stripe_pending_verification") {
        toast.info("Stripe account connected. Verification pending.");
      } else if (info === "stripe_connected_pending") {
        toast.info("Stripe account connected. Please complete onboarding.");
      } else if (error) {
        toast.error("Failed to connect Stripe account");
      }

      // Remove query params from URL
      window.history.replaceState({}, "", window.location.pathname);
    }
  }, [fetchConnectionStatus]);

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
        if (data.action === "enable_connect") {
          toast.error(
            "Stripe Connect platform profile required. Please complete your platform profile in your Stripe dashboard.",
            {
              duration: 8000,
              action: {
                label: "Complete Profile",
                onClick: () =>
                  window.open(
                    "https://dashboard.stripe.com/settings/connect/platform-profile",
                    "_blank"
                  ),
              },
            }
          );
        } else if (data.action === "contact_support") {
          toast.error(
            "Geographic restriction detected. Please contact Stripe support for assistance.",
            {
              duration: 10000,
              action: {
                label: "Contact Support",
                onClick: () =>
                  window.open("https://support.stripe.com/contact", "_blank"),
              },
            }
          );
        } else {
          toast.error(data.message || "Failed to initiate Stripe connection");
        }
      }
    } catch (error) {
      console.error("Error connecting to Stripe:", error);
      toast.error("Failed to connect to Stripe");
    } finally {
      setConnecting(false);
    }
  };

  const handleDisconnectStripe = async () => {
    setDisconnecting(true);
    try {
      const response = await fetch("/api/stripe/disconnect", {
        method: "POST",
      });
      const data = await response.json();

      if (data.success) {
        setConnectionStatus({ connected: false });
        setShowDisconnectModal(false);
        toast.success("Disconnected from Stripe");
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

  // Disconnect Confirmation Modal Component
  const DisconnectModal = () => {
    if (!showDisconnectModal) return null;

    return (
      <>
        {/* Overlay */}
        <div
          className="fixed inset-0 z-40 bg-black/50"
          onClick={() => setShowDisconnectModal(false)}
        />
        {/* Modal */}
        <Card className="fixed top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 z-50 w-full max-w-md shadow-2xl">
          <div className="p-6 space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-lg font-semibold">
                  Disconnect Stripe Account
                </h2>
                <p className="text-sm text-gray-600 mt-1">
                  Are you sure you want to disconnect from Stripe? This will
                  disable payment processing for all your invoices.
                </p>
              </div>
              <button
                onClick={() => setShowDisconnectModal(false)}
                className="p-1 hover:bg-gray-100 rounded-md transition-colors"
                disabled={disconnecting}
              >
                <X className="h-5 w-5" />
              </button>
            </div>
            <div className="flex items-center justify-end gap-3 pt-4">
              <Button
                variant="outline"
                onClick={() => setShowDisconnectModal(false)}
                disabled={disconnecting}
              >
                Cancel
              </Button>
              <Button
                variant="destructive"
                onClick={handleDisconnectStripe}
                disabled={disconnecting}
              >
                {disconnecting ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Disconnecting...
                  </>
                ) : (
                  "Disconnect"
                )}
              </Button>
            </div>
          </div>
        </Card>
      </>
    );
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

  return (
    <DashboardLayout>
      <PageHeader
        title="Settings"
        subtitle="Manage your account and application settings"
      />
      <MainContent>
        <div className="mx-10 grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="col-span-1">
            <Card>
              <CardHeader>
                <h2 className="text-lg font-bold text-gray-900">
                  Company Information
                </h2>
              </CardHeader>
              <CardContent>
                <AccountSettingsForm />
              </CardContent>
            </Card>

            {/* Stripe Payment Integration */}
            <Card className="mt-6">
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-3">
                    <div className="p-2 bg-blue-100 rounded-lg">
                      <CreditCard className="h-6 w-6 text-blue-600" />
                    </div>
                    <div>
                      <CardTitle>Payment Integrations</CardTitle>
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
                          onClick={() => setShowDisconnectModal(true)}
                        >
                          Disconnect
                        </Button>
                      </div>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </div>
      </MainContent>
      <DisconnectModal />
    </DashboardLayout>
  );
}
