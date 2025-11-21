import { Metadata } from "next";

export const metadata: Metadata = {
  title: "Welcome to gginvoice - Get Started",
  description: "Set up your account in minutes",
};

export default function OnboardingLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen bg-gray-50">
      {children}
    </div>
  );
}

