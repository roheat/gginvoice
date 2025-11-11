"use client";

import { DashboardLayout } from "@/components/dashboard/dashboard-layout";
import { PageHeader } from "@/components/dashboard/page-header";
import { MainContent } from "@/components/dashboard/main-content";
import { InvoiceForm } from "@/components/invoices/invoice-form";
import { ArrowLeft } from "lucide-react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { useState, useEffect } from "react";

export default function NewInvoicePage() {
  const [invoiceNumber, setInvoiceNumber] = useState("INV-001");

  useEffect(() => {
    const fetchInvoiceNumber = async () => {
      try {
        const response = await fetch("/api/invoice-number");
        const result = await response.json();
        if (result.success) {
          setInvoiceNumber(result.number);
        }
      } catch (error) {
        console.error("Failed to fetch invoice number:", error);
      }
    };

    fetchInvoiceNumber();
  }, []);

  return (
    <DashboardLayout>
      <PageHeader
        title={
          <div className="flex items-center gap-4">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">
                New Invoice ({invoiceNumber})
              </h1>
            </div>
          </div>
        }
      />
      <MainContent>
        <InvoiceForm />
      </MainContent>
    </DashboardLayout>
  );
}
