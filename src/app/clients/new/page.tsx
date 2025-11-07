"use client";

import { DashboardLayout } from "@/components/dashboard/dashboard-layout";
import { PageHeader } from "@/components/dashboard/page-header";
import { MainContent } from "@/components/dashboard/main-content";
import { ClientForm } from "@/components/clients/client-form";
import { ArrowLeft } from "lucide-react";
import Link from "next/link";
import { Button } from "@/components/ui/button";

export default function NewClientPage() {
  return (
    <DashboardLayout>
      <PageHeader
        title={
          <div className="flex items-center gap-4">
            <Link href="/clients">
              <Button variant="ghost" size="sm">
                <ArrowLeft className="h-4 w-4 mr-2" />
                Back
              </Button>
            </Link>
            <div>
              <h1 className="text-2xl font-bold text-gray-900">New Client</h1>
              <p className="text-gray-600 mt-1">
                Add a new client to your system
              </p>
            </div>
          </div>
        }
      />
      <MainContent>
        <div className="max-w-2xl mx-auto">
          <ClientForm />
        </div>
      </MainContent>
    </DashboardLayout>
  );
}
