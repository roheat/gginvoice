"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useSession, signOut } from "next-auth/react";
import {
  FileText,
  CreditCard,
  Users,
  Settings,
  LogOut,
  Menu,
  X,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

interface SidebarProps {
  children: React.ReactNode;
}

const navigation = [
  {
    name: "Invoices",
    href: "/invoices",
    icon: FileText,
    current: true,
  },
  {
    name: "Subscriptions",
    href: "/subscriptions",
    icon: CreditCard,
    current: false,
    disabled: true,
    badge: "Coming Soon",
  },
  {
    name: "Clients",
    href: "/clients",
    icon: Users,
    current: false,
  },
  {
    name: "Settings",
    href: "/settings",
    icon: Settings,
    current: false,
  },
];

export function Sidebar({ children }: SidebarProps) {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const pathname = usePathname();
  const { data: session } = useSession();

  const handleSignOut = () => {
    signOut({ callbackUrl: "/" });
  };

  return (
    <div className="h-screen flex overflow-hidden bg-gray-50">
      {/* Mobile sidebar overlay */}
      {sidebarOpen && (
        <div className="fixed inset-0 flex z-40 md:hidden">
          <div
            className="fixed inset-0 bg-gray-600 bg-opacity-75"
            onClick={() => setSidebarOpen(false)}
          />
          <div className="relative flex-1 flex flex-col max-w-xs w-full bg-gradient-to-b from-blue-600 to-blue-700">
            <div className="absolute top-0 right-0 -mr-12 pt-2">
              <button
                type="button"
                className="ml-1 flex items-center justify-center h-10 w-10 rounded-full focus:outline-none focus:ring-2 focus:ring-inset focus:ring-white"
                onClick={() => setSidebarOpen(false)}
              >
                <X className="h-6 w-6 text-white" />
              </button>
            </div>
            <SidebarContent
              pathname={pathname}
              onSignOut={handleSignOut}
              session={session}
            />
          </div>
        </div>
      )}

      {/* Desktop sidebar */}
      <div className="hidden md:flex md:flex-shrink-0">
        <div className="flex flex-col w-64">
          <div className="flex flex-col h-0 flex-1 bg-gradient-to-b from-blue-600 to-blue-700">
            <SidebarContent
              pathname={pathname}
              onSignOut={handleSignOut}
              session={session}
            />
          </div>
        </div>
      </div>

      {/* Main content */}
      <div className="flex flex-col w-0 flex-1 overflow-hidden">
        {/* Mobile header */}
        <div className="md:hidden pl-1 pt-1 sm:pl-3 sm:pt-3">
          <button
            type="button"
            className="-ml-0.5 -mt-0.5 h-12 w-12 inline-flex items-center justify-center rounded-md text-gray-500 hover:text-gray-900 focus:outline-none focus:ring-2 focus:ring-inset focus:ring-blue-500"
            onClick={() => setSidebarOpen(true)}
          >
            <Menu className="h-6 w-6" />
          </button>
        </div>

        {/* Page content */}
        <main className="flex-1 relative overflow-y-auto focus:outline-none">
          {children}
        </main>
      </div>
    </div>
  );
}

interface SidebarContentProps {
  pathname: string;
  onSignOut: () => void;
  session: {
    user: {
      name?: string | null;
      email?: string | null;
      image?: string | null;
    };
  } | null;
}

function SidebarContent({ pathname, onSignOut, session }: SidebarContentProps) {
  return (
    <div className="flex flex-col h-full">
      {/* Logo */}
      <div className="flex items-center h-16 flex-shrink-0 px-4">
        <div className="flex items-center">
          <div className="flex-shrink-0">
            <h1 className="text-2xl font-bold text-white">gginvoice</h1>
          </div>
        </div>
      </div>

      {/* User profile - at the top */}
      <div className="flex-shrink-0 px-4 py-3">
        <div className="flex items-center gap-3">
          <div className="flex-shrink-0">
            <div className="h-8 w-8 rounded-full bg-white/20 flex items-center justify-center">
              <span className="text-sm font-medium text-white">
                {session?.user?.name?.charAt(0)?.toUpperCase() || "U"}
              </span>
            </div>
          </div>
          <div className="min-w-0 flex-1">
            <p className="text-sm font-medium text-white truncate">
              {session?.user?.name || "User"}
            </p>
            <p className="text-xs text-blue-200 truncate">
              {session?.user?.email}
            </p>
          </div>
        </div>
      </div>

      {/* Navigation */}
      <div className="flex-1 flex flex-col pb-4 overflow-y-auto">
        <nav className="mt-5 flex-1 px-2 space-y-1">
          {navigation.map((item) => {
            const isActive = pathname === item.href;
            return (
              <Link
                key={item.name}
                href={item.disabled ? "#" : item.href}
                className={cn(
                  "group flex items-center px-2 py-2 text-sm font-medium rounded-md transition-colors",
                  isActive
                    ? "bg-white/10 text-white"
                    : item.disabled
                    ? "text-gray-300 cursor-not-allowed"
                    : "text-white hover:bg-white/10 hover:text-white"
                )}
              >
                <item.icon
                  className={cn(
                    "mr-3 flex-shrink-0 h-5 w-5",
                    isActive ? "text-white" : "text-gray-300"
                  )}
                />
                {item.name}
                {item.badge && (
                  <span className="ml-auto bg-gray-500 text-white text-xs px-2 py-1 rounded-full">
                    {item.badge}
                  </span>
                )}
              </Link>
            );
          })}
        </nav>
      </div>

      {/* Logout button - at the bottom */}
      <div className="flex-shrink-0 border-t border-blue-500 py-3 px-4">
        <Button
          variant="ghost"
          size="sm"
          onClick={onSignOut}
          className="w-full justify-start text-white hover:bg-white/10"
          title="Logout"
        >
          <LogOut className="h-4 w-4 mr-2" />
          Logout
        </Button>
      </div>
    </div>
  );
}
