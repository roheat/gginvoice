"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
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
  defaultTaxRate?: number | null;
};

interface CompanyStepProps {
  onNext: () => void;
  onBack?: () => void;
  onNameUpdate?: (name: string | null) => void;
}

export function CompanyStep({ onNext, onNameUpdate }: CompanyStepProps) {
  const [settings, setSettings] = useState<Settings | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [isValid, setIsValid] = useState(false);
  const [showOptionalFields, setShowOptionalFields] = useState(false);

  useEffect(() => {
    const fetchSettings = async () => {
      try {
        const res = await fetch("/api/settings/account");
        const json = await res.json();
        if (res.ok && json.success) {
          const s = json.user?.settings || {};
          const fetchedSettings = {
            userName: json.user?.name || null,
            companyName: s.companyName || null,
            companyAddress: s.companyAddress || null,
            companyPhone: s.companyPhone || null,
            companyWebsite: s.companyWebsite || null,
            companyLogoUrl: s.companyLogoUrl || null,
            defaultTaxRate: s.defaultTaxRate ?? 0,
          };
          setSettings(fetchedSettings);
          // Show optional fields if company name already exists
          if (fetchedSettings.companyName?.trim()) {
            setShowOptionalFields(true);
          }
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
    setIsValid(
      Boolean(settings?.companyName?.trim() && settings?.userName?.trim())
    );

    // Show optional fields when company name is entered
    if (settings?.companyName?.trim() && !showOptionalFields) {
      // Small delay for better UX
      const timer = setTimeout(() => {
        setShowOptionalFields(true);
      }, 300);
      return () => clearTimeout(timer);
    }
  }, [settings?.companyName, settings?.userName, showOptionalFields]);

  const handleChange = (
    field: keyof Settings,
    value: string | number | boolean | null
  ) => {
    setSettings((prev) => ({ ...(prev || {}), [field]: value }));
  };

  const handleSave = async () => {
    if (
      !settings ||
      !settings.companyName?.trim() ||
      !settings.userName?.trim()
    ) {
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
        // Update name in parent component for welcome message and profile
        if (onNameUpdate && settings.userName) {
          onNameUpdate(settings.userName);
        }
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
        <h2 className="text-2xl font-bold text-gray-900 mb-2">Company Setup</h2>
        <p className="text-gray-600">
          Tell us about your business. This information will appear on your
          invoices.
        </p>
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

        {/* Optional fields - shown after company name is entered */}
        <div
          className={`overflow-hidden transition-all duration-500 ease-in-out ${
            showOptionalFields
              ? "max-h-[500px] opacity-100"
              : "max-h-0 opacity-0"
          }`}
        >
          <div className="space-y-6 pt-2">
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
          </div>
        </div>
      </div>

      {/* Continue button outside card, centered */}
      <div className="flex justify-center mt-6">
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
  );
}
