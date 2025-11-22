"use client";

import { useEffect, useRef, useState } from "react";
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
  MoreVertical,
} from "lucide-react";
import { cn } from "@/lib/utils";
import Image from "next/image";

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
  const [profileMenuOpen, setProfileMenuOpen] = useState(false);
  const profileMenuRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        profileMenuOpen &&
        profileMenuRef.current &&
        !profileMenuRef.current.contains(event.target as Node)
      ) {
        setProfileMenuOpen(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [profileMenuOpen]);
  return (
    <div className="flex flex-col h-full">
      {/* Logo */}
      <div className="flex items-center h-16 flex-shrink-0 px-4 mt-3">
        <div className="relative">
          <Image
            src="/logo-white.svg"
            alt="gginvoice"
            width={120}
            height={48}
          />
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

      {/* User profile */}
      <div className="relative flex-shrink-0 border-t border-blue-500 py-3 px-4">
        <div ref={profileMenuRef} className="relative flex items-center gap-3">
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
          <button
            type="button"
            className="rounded-full p-1 text-white hover:bg-white/10 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white focus-visible:ring-offset-2 focus-visible:ring-offset-transparent"
            aria-expanded={profileMenuOpen}
            aria-label="Profile actions"
            onClick={() => setProfileMenuOpen((open) => !open)}
          >
            <MoreVertical className="h-5 w-5" />
          </button>
          {profileMenuOpen && (
            <div className="absolute right-0 bottom-full mb-2 w-40 rounded-xl border border-white/20 bg-white text-slate-900 shadow-lg shadow-slate-900/30">
              <button
                type="button"
                className="flex w-full items-center gap-2 px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-100 overflow-hidden rounded-xl"
                onClick={() => {
                  onSignOut();
                  setProfileMenuOpen(false);
                }}
              >
                <LogOut className="h-4 w-4 text-slate-500" />
                Logout
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
