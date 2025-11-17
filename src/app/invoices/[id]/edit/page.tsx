"use client";

import { DashboardLayout } from "@/components/dashboard/dashboard-layout";
import { PageHeader } from "@/components/dashboard/page-header";
import { MainContent } from "@/components/dashboard/main-content";
import { InvoiceForm } from "@/components/invoices/invoice-form";
import { InvoiceActions } from "@/components/invoices/invoice-actions";
import { Loader } from "lucide-react";
import { useState, useEffect } from "react";
import { useParams } from "next/navigation";
import type { InitialInvoice } from "@/hooks/use-invoice-form";

interface Invoice extends Omit<InitialInvoice, 'notes' | 'tax1Name' | 'tax2Name'> {
  id: string;
  number: string;
  date: string;
  dueDate: string | null;
  status: string;
  subtotal: number;
  tax: number;
  total: number;
  currency: string;
  notes: string | null;
  discount: number;
  discountType: string;
  tax1Name: string | null;
  tax1Rate: number;
  tax2Name: string | null;
  tax2Rate: number;
  acceptPayments: boolean;
  clientId: string;
  deleted: boolean;
  client: {
    id: string;
    name: string;
    email: string | null;
    address: string | null;
  };
  items: Array<{
    id: string;
    description: string;
    amount: number;
    quantity: number;
  }>;
  createdAt: string;
  updatedAt: string;
}

export default function EditInvoicePage() {
  const params = useParams();
  const invoiceId = params.id as string;
  const [invoice, setInvoice] = useState<Invoice | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchInvoice = async () => {
    try {
      setLoading(true);
      setError(null);
      
      // Fetch the invoice from the API
      const response = await fetch(`/api/invoice/${invoiceId}`);
      
      if (!response.ok) {
        if (response.status === 404) {
          setError("Invoice not found");
        } else {
          setError("Failed to load invoice");
        }
        return;
      }
      
      const result = await response.json();
      if (result.success && result.invoice) {
        setInvoice(result.invoice);
      } else {
        setError("Failed to load invoice");
      }
    } catch (err) {
      console.error("Error fetching invoice:", err);
      setError("Failed to load invoice");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (invoiceId) {
      fetchInvoice();
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [invoiceId]);

  const handleActionSuccess = () => {
    // Refresh invoice data
    fetchInvoice();
  };

  if (loading) {
    return (
      <DashboardLayout>
        <PageHeader
          title={
            <div className="flex items-center gap-4">
              <div>
                <h1 className="text-2xl font-bold text-gray-900">
                  Loading...
                </h1>
              </div>
            </div>
          }
        />
        <MainContent>
          <div className="max-w-7xl mx-auto flex items-center justify-center py-12">
            <Loader className="h-8 w-8 animate-spin text-blue-600" />
          </div>
        </MainContent>
      </DashboardLayout>
    );
  }

  if (error || !invoice) {
    return (
      <DashboardLayout>
        <PageHeader
          title={
            <div className="flex items-center gap-4">
              <div>
                <h1 className="text-2xl font-bold text-gray-900">Error</h1>
              </div>
            </div>
          }
        />
        <MainContent>
          <div className="max-w-7xl mx-auto py-12">
            <div className="bg-red-50 border border-red-200 rounded-lg p-4 text-red-800">
              <p>{error || "Invoice not found"}</p>
            </div>
          </div>
        </MainContent>
      </DashboardLayout>
    );
  }

  const getStatusColor = (status: string): string => {
    switch (status?.toLowerCase()) {
      case "draft":
        return "bg-gray-100 text-gray-800";
      case "sent":
        return "bg-blue-100 text-blue-800";
      case "paid":
        return "bg-green-100 text-green-800";
      case "refunded":
        return "bg-amber-100 text-amber-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  return (
    <DashboardLayout>
      <PageHeader
        title={
          <div className="flex items-center gap-4">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">
                Invoice {invoice.number}
              </h1>
              <div className="flex items-center gap-2 mt-2">
                <span className="text-sm text-gray-600">Status:</span>
                <span className={`px-2.5 py-0.5 rounded-full text-xs font-semibold capitalize ${getStatusColor(invoice.status)}`}>
                  {invoice.status}
                </span>
              </div>
            </div>
          </div>
        }
      />
      <MainContent>
        {/* Invoice Form with Actions in the right panel */}
        <InvoiceForm 
          initialInvoice={invoice}
          isEditing={true}
          invoiceActions={
            <InvoiceActions 
              invoice={invoice}
              onActionSuccess={handleActionSuccess}
            />
          }
        />
      </MainContent>
    </DashboardLayout>
  );
}

