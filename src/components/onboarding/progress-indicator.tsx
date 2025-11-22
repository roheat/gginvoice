"use client";

import { Check } from "lucide-react";
import { cn } from "@/lib/utils";

type Step = "company" | "stripe" | "invoice" | "complete";

interface ProgressStep {
  id: Step;
  name: string;
  number: number;
  description: string;
}

interface ProgressIndicatorProps {
  currentStep: Step;
}

const steps: ProgressStep[] = [
  {
    id: "company",
    name: "Company Setup",
    number: 1,
    description: "Add your business details",
  },
  {
    id: "stripe",
    name: "Payment Setup",
    number: 2,
    description: "Connect Stripe (optional)",
  },
  {
    id: "invoice",
    name: "First Invoice",
    number: 3,
    description: "Create your first invoice (optional)",
  },
];

export function ProgressIndicator({ currentStep }: ProgressIndicatorProps) {
  const getStepStatus = (step: ProgressStep) => {
    const currentIndex = steps.findIndex((s) => s.id === currentStep);
    const stepIndex = steps.findIndex((s) => s.id === step.id);

    if (stepIndex < currentIndex) return "complete";
    if (stepIndex === currentIndex) return "current";
    return "upcoming";
  };

  return (
    <div className="w-full max-w-md mx-auto">
      <ol className="space-y-6">
        {steps.map((step, index) => {
          const status = getStepStatus(step);
          const isComplete = status === "complete";
          const isCurrent = status === "current";

          return (
            <li key={step.id} className="relative">
              <div className="flex items-start gap-4">
                <div className="flex-shrink-0">
                  <div
                    className={cn(
                      "flex items-center justify-center w-14 h-14 rounded-full border-2 transition-all shadow-sm",
                      isComplete
                        ? "bg-blue-600 border-blue-600 text-white shadow-blue-200"
                        : isCurrent
                        ? "border-blue-600 text-blue-600 bg-white shadow-lg shadow-blue-100"
                        : "border-gray-300 text-gray-400 bg-white/50"
                    )}
                  >
                    {isComplete ? (
                      <Check className="h-6 w-6 stroke-[3]" />
                    ) : (
                      <span className="text-lg font-bold">{step.number}</span>
                    )}
                  </div>
                </div>
                <div className="flex-1 pt-1">
                  <h3
                    className={cn(
                      "text-lg font-bold mb-1",
                      isCurrent
                        ? "text-blue-600"
                        : isComplete
                        ? "text-gray-900"
                        : "text-gray-500"
                    )}
                  >
                    {step.name}
                  </h3>
                  <p
                    className={cn(
                      "text-sm",
                      isCurrent || isComplete
                        ? "text-gray-600"
                        : "text-gray-400"
                    )}
                  >
                    {step.description}
                  </p>
                </div>
              </div>
              {index < steps.length - 1 && (
                <div
                  className={cn(
                    "absolute left-7 top-14 w-0.5 h-6 -ml-px transition-colors",
                    isComplete ? "bg-blue-600" : "bg-gray-300"
                  )}
                />
              )}
            </li>
          );
        })}
      </ol>
    </div>
  );
}
