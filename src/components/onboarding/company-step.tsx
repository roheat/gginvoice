"use client";

import { useState, useEffect } from "react";
import { useSession } from "next-auth/react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from "@/components/ui/select";
import { LogoUpload } from "@/components/settings/logo-upload";
import { Loader2 } from "lucide-react";
import { toast } from "sonner";
import { posthog } from "@/lib/posthog";

type Settings = {
  userName?: string | null;
  companyName?: string | null;
  companyAddress?: string | null;
  companyPhone?: string | null;
  companyWebsite?: string | null;
  companyLogoUrl?: string | null;
  defaultCurrency?: string;
  defaultTaxRate?: number | null;
};

interface CompanyStepProps {
  onNext: () => void;
}

export function CompanyStep({ onNext }: CompanyStepProps) {
  const { data: session } = useSession();
  const [settings, setSettings] = useState<Settings | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [isValid, setIsValid] = useState(false);

  useEffect(() => {
    const fetchSettings = async () => {
      try {
        const res = await fetch("/api/settings/account");
        const json = await res.json();
        if (res.ok && json.success) {
          const s = json.user?.settings || {};
          setSettings({
            userName: json.user?.name || null,
            companyName: s.companyName || null,
            companyAddress: s.companyAddress || null,
            companyPhone: s.companyPhone || null,
            companyWebsite: s.companyWebsite || null,
            companyLogoUrl: s.companyLogoUrl || null,
            defaultCurrency: s.defaultCurrency || "USD",
            defaultTaxRate: s.defaultTaxRate ?? 0,
          });
        }
      } catch (err) {
        console.error("Error fetching settings:", err);
      } finally {
        setLoading(false);
      }
    };
    fetchSettings();
  }, []);

  useEffect(() => {
    // Company name and user name are required
    setIsValid(Boolean(settings?.companyName?.trim() && settings?.userName?.trim()));
  }, [settings?.companyName, settings?.userName]);

  const handleChange = (
    field: keyof Settings,
    value: string | number | boolean | null
  ) => {
    setSettings((prev) => ({ ...(prev || {}), [field]: value }));
  };

  const handleSave = async () => {
    if (!settings || !settings.companyName?.trim() || !settings.userName?.trim()) {
      toast.error("Name and company name are required");
      return;
    }

    setSaving(true);
    try {
      const payload = {
        userName: settings.userName ?? null,
        companyName: settings.companyName ?? null,
        companyAddress: settings.companyAddress ?? null,
        companyPhone: settings.companyPhone ?? null,
        companyWebsite: settings.companyWebsite ?? null,
        defaultCurrency: settings.defaultCurrency ?? "USD",
        defaultTaxRate: settings.defaultTaxRate ?? 0,
        emailNotifications: true,
      };
      const res = await fetch("/api/settings/account", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const json = await res.json();
      if (res.ok && json.success) {
        posthog.capture("onboarding_company_completed");
        toast.success("Company information saved!");
        // Continue to next step
        setTimeout(() => {
          onNext();
        }, 500);
      } else {
        toast.error(json.error || "Failed to save company information");
      }
    } catch (err) {
      console.error("Error saving settings:", err);
      toast.error("Failed to save company information");
    } finally {
      setSaving(false);
    }
  };

  const handleLogoUpdate = (logoUrl: string | null) => {
    setSettings((prev) => ({ ...(prev || {}), companyLogoUrl: logoUrl }));
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
          Company Setup
        </h2>
        <p className="text-gray-600">
          Tell us about your business. This information will appear on your
          invoices.
        </p>
        {session?.user?.email && (
          <p className="text-sm text-gray-500 mt-2">
            Logged in as: <span className="font-medium">{session.user.email}</span>
          </p>
        )}
      </div>

      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 space-y-6">
        <LogoUpload
          currentLogoUrl={settings?.companyLogoUrl}
          onLogoUpdate={handleLogoUpdate}
        />

        <div>
          <Label htmlFor="userName">
            Your Name <span className="text-red-500">*</span>
          </Label>
          <Input
            id="userName"
            value={settings?.userName ?? ""}
            onChange={(e) => handleChange("userName", e.target.value)}
            placeholder="John Doe"
            className="mt-1"
          />
        </div>

        <div>
          <Label htmlFor="companyName">
            Company Name <span className="text-red-500">*</span>
          </Label>
          <Input
            id="companyName"
            value={settings?.companyName ?? ""}
            onChange={(e) => handleChange("companyName", e.target.value)}
            placeholder="Your company name"
            className="mt-1"
          />
        </div>

        <div>
          <Label htmlFor="companyAddress">Company Address</Label>
          <Textarea
            id="companyAddress"
            value={settings?.companyAddress ?? ""}
            onChange={(e) => handleChange("companyAddress", e.target.value)}
            placeholder="123 Main St, City, State, ZIP"
            className="mt-1"
          />
        </div>

        <div>
          <Label htmlFor="companyPhone">Phone</Label>
          <Input
            id="companyPhone"
            value={settings?.companyPhone ?? ""}
            onChange={(e) => handleChange("companyPhone", e.target.value)}
            placeholder="+1 (555) 123-4567"
            className="mt-1"
          />
        </div>

        <div>
          <Label htmlFor="companyWebsite">Website</Label>
          <Input
            id="companyWebsite"
            value={settings?.companyWebsite ?? ""}
            onChange={(e) => handleChange("companyWebsite", e.target.value)}
            placeholder="https://www.company.com"
            className="mt-1"
          />
        </div>

        <div>
          <Label>Default Currency</Label>
          <Select
            value={settings?.defaultCurrency ?? "USD"}
            onValueChange={(val) => handleChange("defaultCurrency", val)}
          >
            <SelectTrigger className="w-full mt-1">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="USD">USD - US Dollar</SelectItem>
              <SelectItem value="EUR">EUR - Euro</SelectItem>
              <SelectItem value="GBP">GBP - British Pound</SelectItem>
              <SelectItem value="CAD">CAD - Canadian Dollar</SelectItem>
              <SelectItem value="AUD">AUD - Australian Dollar</SelectItem>
              <SelectItem value="JPY">JPY - Japanese Yen</SelectItem>
              <SelectItem value="INR">INR - Indian Rupee</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div className="flex justify-end pt-4 border-t">
          <Button
            onClick={handleSave}
            disabled={!isValid || saving}
            className="bg-blue-600 hover:bg-blue-700 text-white px-8"
          >
            {saving ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                Saving...
              </>
            ) : (
              "Continue"
            )}
          </Button>
        </div>
      </div>
    </div>
  );
}

