"use client";

import { DashboardLayout } from "@/components/dashboard/dashboard-layout";
import { PageHeader } from "@/components/dashboard/page-header";
import { MainContent } from "@/components/dashboard/main-content";
import { InvoiceForm } from "@/components/invoices/invoice-form";
import { InvoiceFormSkeleton } from "@/components/ui/skeletons/invoice-form-skeleton";
import { PageHeaderSkeleton } from "@/components/ui/skeletons/page-header-skeleton";
import { useState, useEffect } from "react";

export default function NewInvoicePage() {
  const [invoiceNumber, setInvoiceNumber] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchInvoiceNumber = async () => {
      try {
        const response = await fetch("/api/invoice-number");
        const result = await response.json();
        if (result.success) {
          setInvoiceNumber(result.number);
        } else {
          setInvoiceNumber("INV-001");
        }
      } catch (error) {
        console.error("Failed to fetch invoice number:", error);
        setInvoiceNumber("INV-001");
      } finally {
        setLoading(false);
      }
    };

    fetchInvoiceNumber();
  }, []);

  if (loading) {
    return (
      <DashboardLayout>
        <PageHeaderSkeleton />
        <MainContent>
          <InvoiceFormSkeleton />
        </MainContent>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <PageHeader
        title={
          <h1 className="text-xl sm:text-2xl font-bold text-gray-900">
            New Invoice ({invoiceNumber || "INV-001"})
          </h1>
        }
      />
      <MainContent>
        <InvoiceForm />
      </MainContent>
    </DashboardLayout>
  );
}
