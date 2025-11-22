import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { AuthSessionProvider } from "@/components/providers/session-provider";
import { PosthogProvider } from "@/components/providers/posthog-provider";
import { TRPCProvider } from "@/components/providers/trpc-provider";
import { Toaster } from "sonner";

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-sans",
});

export const metadata: Metadata = {
  title: "gginvoice - Invoice Management Made Simple",
  description: "Professional invoice management for your business",
  icons: {
    icon: "/favicon.svg",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body
        className={`${inter.variable} font-sans antialiased`}
        suppressHydrationWarning
      >
        <AuthSessionProvider>
          <PosthogProvider>
            <TRPCProvider>
              {children}
              <Toaster />
            </TRPCProvider>
          </PosthogProvider>
        </AuthSessionProvider>
      </body>
    </html>
  );
}
