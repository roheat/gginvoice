"use client";

import { DashboardLayout } from "@/components/dashboard/dashboard-layout";
import { PageHeader } from "@/components/dashboard/page-header";
import { MainContent } from "@/components/dashboard/main-content";
import { ClientForm } from "@/components/clients/client-form";

export default function NewClientPage() {
  return (
    <DashboardLayout>
      <PageHeader
        title={
          <div className="flex items-center gap-4">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">New Client</h1>
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
