"use client";

import { createContext, useContext, useEffect, useState, useCallback, ReactNode } from "react";

export type OnboardingStepId = "company" | "stripe" | "invoice";

export type OnboardingProgressState = Record<OnboardingStepId, boolean> & {
  loading: boolean;
};

interface OnboardingContextValue {
  progress: OnboardingProgressState;
  refetch: () => Promise<void>;
}

const OnboardingContext = createContext<OnboardingContextValue | null>(null);

export function OnboardingProgressProvider({ children }: { children: ReactNode }) {
  const [progress, setProgress] = useState<OnboardingProgressState>({
    company: false,
    stripe: false,
    invoice: false,
    loading: true,
  });

  const fetchProgress = useCallback(async () => {
    try {
      setProgress((prev) => ({ ...prev, loading: true }));

      const [settingsRes, stripeRes, invoicesRes] = await Promise.all([
        fetch("/api/settings/account"),
        fetch("/api/stripe/status"),
        fetch("/api/invoice"),
      ]);

      const settingsJson = settingsRes.ok ? await settingsRes.json() : null;
      const stripeJson = stripeRes.ok ? await stripeRes.json() : null;
      const invoicesJson = invoicesRes.ok ? await invoicesRes.json() : null;

      const companyName =
        settingsJson?.settings?.companyName ||
        settingsJson?.user?.settings?.companyName;
      const stripeConnected = Boolean(stripeJson?.connected);
      const hasInvoices = Array.isArray(invoicesJson?.invoices)
        ? invoicesJson.invoices.length > 0
        : false;

      setProgress({
        company: Boolean(companyName),
        stripe: stripeConnected,
        invoice: hasInvoices,
        loading: false,
      });
    } catch (error) {
      setProgress((prev) => ({ ...prev, loading: false }));
      console.error("Failed to load onboarding progress", error);
    }
  }, []);

  // Fetch on mount
  useEffect(() => {
    fetchProgress();
  }, [fetchProgress]);

  return (
    <OnboardingContext.Provider value={{ progress, refetch: fetchProgress }}>
      {children}
    </OnboardingContext.Provider>
  );
}

export function useOnboardingProgress() {
  const context = useContext(OnboardingContext);
  if (!context) {
    throw new Error("useOnboardingProgress must be used within OnboardingProgressProvider");
  }
  return context;
}

