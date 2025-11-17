import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { AuthSessionProvider } from "@/components/providers/session-provider";
import { TRPCProvider } from "@/components/providers/trpc-provider";
import { OnboardingProgressProvider } from "@/contexts/onboarding-context";
import { Toaster } from "sonner";

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-sans",
});

export const metadata: Metadata = {
  title: "gginvoice - Invoice Management Made Simple",
  description: "Professional invoice management for your business",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className={`${inter.variable} font-sans antialiased`}>
        <AuthSessionProvider>
          <TRPCProvider>
            <OnboardingProgressProvider>
              {children}
              <Toaster />
            </OnboardingProgressProvider>
          </TRPCProvider>
        </AuthSessionProvider>
      </body>
    </html>
  );
}
