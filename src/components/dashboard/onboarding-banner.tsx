"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { X } from "lucide-react";

import { Button } from "@/components/ui/button";
import { useOnboardingProgress, type OnboardingStepId } from "@/contexts/onboarding-context";

const onboardingSteps: Array<
  {
    id: OnboardingStepId;
    title: string;
    label: string;
    action: string;
    href: string;
  }
> = [
  {
    id: "company",
    title: "Step 1",
    label: "Set up company",
    action: "Start",
    href: "/settings",
  },
  {
    id: "stripe",
    title: "Step 2",
    label: "Set up Stripe (optional)",
    action: "Setup",
    href: "/settings",
  },
  {
    id: "invoice",
    title: "Step 3",
    label: "Create your first invoice",
    action: "Create",
    href: "/invoices/new",
  },
];

export function OnboardingBanner({ username, userId }: { username?: string, userId?: string }) {
  const [hidden, setHidden] = useState(false);
  const { progress } = useOnboardingProgress();
  const BANNER_STORAGE_KEY = `gginvoice_onboarding_banner_hidden_${userId}`;

  useEffect(() => {
    if (typeof window === "undefined") return;
    const isDismissed = window.localStorage.getItem(BANNER_STORAGE_KEY);
    if (isDismissed === "1") {
      setHidden(true);
    }
  }, [BANNER_STORAGE_KEY, userId]);

  const handleClose = () => {
    setHidden(true);
    if (typeof window !== "undefined") {
      window.localStorage.setItem(BANNER_STORAGE_KEY, "1");
    }
  };

  if (hidden) {
    return null;
  }

  return (
    <div className="px-4 py-6 sm:px-6 lg:px-8">
      <div className="max-w-7xl mx-auto space-y-6 p-5 sm:p-6">
        <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <div className="text-2xl font-bold text-gray-900">Welcome {username} 👋</div>
            <p className="mt-1 text-sm text-gray-600">Let&apos;s get you set up!</p>
          </div>
          <button
            className="text-black/80 hover:text-black hover:bg-white/10 rounded-full p-2 transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/50 self-start sm:self-auto"
            onClick={handleClose}
            aria-label="Dismiss onboarding banner"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Step cards */}
        <div className="mt-6 grid gap-4 md:grid-cols-3">
          {progress.loading ? (
            // Loading skeleton
            <>
              {[1, 2, 3].map((i) => (
                <div
                  key={i}
                  className="relative rounded-xl p-5 bg-white/90 shadow-sm mx-auto min-w-60 w-full animate-pulse"
                >
                  <div className="absolute -top-2 -left-2 w-7 h-7 rounded-full bg-gray-200" />
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex-1">
                      <div className="h-3 w-16 bg-gray-200 rounded mb-2" />
                      <div className="h-4 w-32 bg-gray-200 rounded" />
                    </div>
                    <div className="h-5 w-16 bg-gray-200 rounded-full" />
                  </div>
                  <div className="h-8 w-full bg-gray-200 rounded" />
                </div>
              ))}
            </>
          ) : (
            onboardingSteps.map((step, index) => {
              const completed = progress[step.id as "company" | "stripe" | "invoice"];
              const statusText = completed ? "Complete" : "Pending";
              
              return (
                <div
                  key={step.title}
                  className="
                    relative rounded-xl p-5 transition-all duration-200 mx-auto min-w-60 w-full bg-white/95 shadow-md
                  "
                >
                  {/* Step number badge */}
                  <div className="absolute -top-2 -left-2 w-7 h-7 rounded-full bg-blue-600 text-white flex items-center justify-center text-xs font-bold shadow-md">
                    {completed ? "✓" : index + 1}
                  </div>

                  <div className="flex items-start justify-between mb-3">
                    <div className="flex-1">
                      <p className="text-xs font-semibold text-blue-600 uppercase tracking-wide mb-1">
                        {step.title}
                      </p>
                      <h3 className="text-base font-bold text-slate-900 leading-tight">
                        {step.label}
                      </h3>
                    </div>
                    <span
                      className={`
                        text-[10px] font-bold uppercase tracking-wider px-2 py-1 rounded-full
                        ${completed 
                          ? "bg-emerald-100 text-emerald-700" 
                          : "bg-slate-100 text-slate-500"
                        }
                      `}
                    >
                      {statusText}
                    </span>
                  </div>

                  <Button
                    size="sm"
                    asChild
                    className={`
                      w-full justify-center transition-all
                      ${completed 
                        ? "bg-slate-100 text-slate-700 hover:bg-slate-200" 
                        : "bg-blue-600 text-white hover:bg-blue-700"
                      }
                    `}
                  >
                    <Link href={step.href}>
                      {completed ? "Review" : step.action}
                    </Link>
                  </Button>
                </div>
              );
            })
          )}
        </div>


      </div>
    </div>
  );
}

