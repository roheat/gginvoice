"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { DashboardLayout } from "@/components/dashboard/dashboard-layout";
import { PageHeader } from "@/components/dashboard/page-header";
import { MainContent } from "@/components/dashboard/main-content";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Loader2, MoreVertical, LogOut, X } from "lucide-react";
import { toast } from "sonner";
import { LogoUpload } from "@/components/settings/logo-upload";
import { SettingsSkeleton } from "@/components/ui/skeletons/settings-skeleton";
import { posthog } from "@/lib/posthog";
import Image from "next/image";

type Settings = {
  userName?: string | null;
  companyName?: string | null;
  companyAddress?: string | null;
  companyPhone?: string | null;
  companyLogoUrl?: string | null;
};

interface StripeConnectionStatus {
  connected: boolean;
  accountId?: string;
  status?: string;
  onboardingComplete?: boolean;
  chargesEnabled?: boolean;
  payoutsEnabled?: boolean;
}

export default function SettingsPage() {
  const [settings, setSettings] = useState<Settings | null>(null);
  const [initialSettings, setInitialSettings] = useState<Settings | null>(null);
  const [loadingSettings, setLoadingSettings] = useState(true);
  const [saving, setSaving] = useState(false);
  const [connectionStatus, setConnectionStatus] =
    useState<StripeConnectionStatus>({
      connected: false,
    });
  const [connecting, setConnecting] = useState(false);
  const [showDisconnectModal, setShowDisconnectModal] = useState(false);
  const [disconnecting, setDisconnecting] = useState(false);
  const [stripeMenuOpen, setStripeMenuOpen] = useState(false);
  const stripeMenuRef = useRef<HTMLDivElement>(null);

  // Fetch settings
  useEffect(() => {
    const fetchSettings = async () => {
      try {
        const res = await fetch("/api/settings/account");
        const json = await res.json();
        if (res.ok && json.success) {
          const s = json.user?.settings || {};
          const settingsWithName = {
            userName: json.user?.name || null,
            companyName: s.companyName || null,
            companyAddress: s.companyAddress || null,
            companyPhone: s.companyPhone || null,
            companyLogoUrl: s.companyLogoUrl || null,
          };
          setSettings(settingsWithName);
          setInitialSettings(settingsWithName);
        }
      } catch (err) {
        console.error("Error fetching settings:", err);
      } finally {
        setLoadingSettings(false);
      }
    };
    fetchSettings();
  }, []);

  // Fetch Stripe status
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
    const urlParams = new URLSearchParams(window.location.search);
    const success = urlParams.get("success");
    const error = urlParams.get("error");
    const info = urlParams.get("info");

    if (success || error || info) {
      setTimeout(() => {
        fetchConnectionStatus();
      }, 500);

      if (success === "stripe_connected") {
        toast.success("Stripe account connected successfully!");
      } else if (info === "stripe_pending_verification") {
        toast.info("Stripe account connected. Verification pending.");
      } else if (error) {
        toast.error("Failed to connect Stripe account");
      }

      window.history.replaceState({}, "", window.location.pathname);
    }
  }, [fetchConnectionStatus]);

  // Close menu when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        stripeMenuRef.current &&
        !stripeMenuRef.current.contains(event.target as Node)
      ) {
        setStripeMenuOpen(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

  const handleChange = (field: keyof Settings, value: string | null) => {
    setSettings((prev) => ({ ...(prev || {}), [field]: value }));
  };

  const isDirty = () => {
    if (!initialSettings || !settings) return false;
    return JSON.stringify(initialSettings) !== JSON.stringify(settings);
  };

  const handleSave = async () => {
    if (!settings) return;
    setSaving(true);
    try {
      const payload = {
        userName: settings.userName ?? null,
        companyName: settings.companyName ?? null,
        companyAddress: settings.companyAddress ?? null,
        companyPhone: settings.companyPhone ?? null,
      };
      const res = await fetch("/api/settings/account", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const json = await res.json();
      if (res.ok && json.success) {
        setInitialSettings(settings);
        toast.success("Settings updated");
        posthog.capture("settings_updated");
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

  const handleLogoUpdate = (logoUrl: string | null) => {
    setSettings((prev) => ({ ...(prev || {}), companyLogoUrl: logoUrl }));
    setInitialSettings((prev) => ({
      ...(prev || {}),
      companyLogoUrl: logoUrl,
    }));
  };

  const handleConnectStripe = async () => {
    posthog.capture("stripe_connect_initiated", { source: "settings" });
    setConnecting(true);
    try {
      const response = await fetch("/api/stripe/connect", {
        method: "POST",
      });
      const data = await response.json();

      if (data.success && data.url) {
        window.location.href = data.url;
      } else {
        toast.error(data.message || "Failed to initiate Stripe connection");
        setConnecting(false);
      }
    } catch (error) {
      console.error("Error connecting to Stripe:", error);
      toast.error("Failed to connect to Stripe");
      setConnecting(false);
    }
  };

  const handleDisconnectStripe = async () => {
    setDisconnecting(true);
    setStripeMenuOpen(false);
    try {
      const response = await fetch("/api/stripe/disconnect", {
        method: "POST",
      });
      const data = await response.json();

      if (data.success) {
        posthog.capture("stripe_disconnect_confirmed", {
          accountId: connectionStatus.accountId || "",
        });
        setConnectionStatus({ connected: false });
        setShowDisconnectModal(false);
        toast.success("Disconnected from Stripe");
        await fetchConnectionStatus();
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

  // Disconnect Confirmation Modal
  const DisconnectModal = () => {
    if (!showDisconnectModal) return null;

    return (
      <>
        <div
          className="fixed inset-0 z-40 bg-black/50"
          onClick={() => setShowDisconnectModal(false)}
        />
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

  if (loadingSettings) {
    return <SettingsSkeleton />;
  }

  return (
    <DashboardLayout>
      <PageHeader
        title="Settings"
        subtitle="Manage your account and payment integrations"
      />
      <MainContent>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 ">
          {/* Company Information Card */}
          <div className="lg:col-span-1">
            <div className="mb-6">
              <h2 className="text-xl font-bold text-gray-900 mb-2">
                Company Information
              </h2>
              <p className="text-sm text-gray-600">
                Update your company details that appear on invoices.
              </p>
            </div>

            <Card>
              <CardContent className="pt-6 space-y-6">
                <LogoUpload
                  currentLogoUrl={settings?.companyLogoUrl}
                  onLogoUpdate={handleLogoUpdate}
                />

                <div>
                  <Label htmlFor="userName">Your Name</Label>
                  <Input
                    id="userName"
                    value={settings?.userName ?? ""}
                    onChange={(e) => handleChange("userName", e.target.value)}
                    placeholder="John Doe"
                    className="mt-1"
                  />
                </div>

                <div>
                  <Label htmlFor="companyName">Company Name</Label>
                  <Input
                    id="companyName"
                    value={settings?.companyName ?? ""}
                    onChange={(e) =>
                      handleChange("companyName", e.target.value)
                    }
                    placeholder="Your company name"
                    className="mt-1"
                  />
                </div>

                <div>
                  <Label htmlFor="companyAddress">Company Address</Label>
                  <Textarea
                    id="companyAddress"
                    value={settings?.companyAddress ?? ""}
                    onChange={(e) =>
                      handleChange("companyAddress", e.target.value)
                    }
                    placeholder="123 Main St, City, State, ZIP"
                    className="mt-1"
                  />
                </div>

                <div>
                  <Label htmlFor="companyPhone">Phone</Label>
                  <Input
                    id="companyPhone"
                    value={settings?.companyPhone ?? ""}
                    onChange={(e) =>
                      handleChange("companyPhone", e.target.value)
                    }
                    placeholder="+1 (555) 123-4567"
                    className="mt-1"
                  />
                </div>

                <div className="pt-4 border-t flex items-center justify-end space-x-3">
                  <Button
                    variant="outline"
                    onClick={() => setSettings(initialSettings)}
                    disabled={saving || !isDirty()}
                  >
                    Cancel
                  </Button>
                  <Button
                    onClick={handleSave}
                    disabled={!isDirty() || saving}
                    className="bg-blue-600 hover:bg-blue-700"
                  >
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
              </CardContent>
            </Card>
          </div>

          {/* Payment Integrations Card */}
          <div className="lg:col-span-1">
            <div className="mb-6">
              <h2 className="text-xl font-bold text-gray-900 mb-2">
                Payment Integrations
              </h2>
              <p className="text-sm text-gray-600">
                Connect payment providers to accept online payments.
              </p>
            </div>

            <div className="space-y-4">
              {/* Stripe Card */}
              <Card
                className={`relative ${
                  connectionStatus.connected
                    ? "border-green-200 bg-green-50"
                    : ""
                }`}
              >
                {connectionStatus.connected && (
                  <div className="absolute top-4 right-4" ref={stripeMenuRef}>
                    <button
                      type="button"
                      onClick={() => setStripeMenuOpen(!stripeMenuOpen)}
                      className="rounded-full p-1.5 text-gray-600 hover:bg-gray-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500"
                      aria-expanded={stripeMenuOpen}
                      aria-label="Stripe options"
                    >
                      <MoreVertical className="h-4 w-4" />
                    </button>
                    {stripeMenuOpen && (
                      <div className="absolute right-0 top-8 w-40 rounded-xl border border-gray-200 bg-white text-slate-900 shadow-lg z-10">
                        <button
                          type="button"
                          className="flex w-full items-center gap-2 px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-100 overflow-hidden rounded-xl"
                          onClick={() => {
                            setShowDisconnectModal(true);
                            setStripeMenuOpen(false);
                          }}
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
                    {connectionStatus.connected && (
                      <span className="text-xs font-medium text-green-700 bg-green-100 px-2 py-1 rounded">
                        Connected
                      </span>
                    )}
                  </div>
                  <CardDescription>
                    Stripe is a simple and secure way to accept credit card
                    payments online.
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  {!connectionStatus.connected && (
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
                    Connect your account and start accepting payments using
                    PayPal.
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
          </div>
        </div>
      </MainContent>
      <DisconnectModal />
    </DashboardLayout>
  );
}
