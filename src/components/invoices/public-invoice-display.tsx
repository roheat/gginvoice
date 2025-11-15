"use client";

import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import {
  Download,
  Mail,
  CreditCard,
  Phone,
  MapPin,
  Globe,
  type LucideIcon,
} from "lucide-react";
import { generateInvoicePDF } from "@/lib/pdf-generator";
import { PaymentForm } from "@/components/payments/payment-form";

interface InvoiceItem {
  id: string;
  description: string;
  amount: number;
  quantity: number;
}

interface Client {
  id: string;
  name: string;
  email: string | null;
  address: string | null;
  phone: string | null;
}

interface UserSettings {
  companyName?: string | null;
  companyAddress?: string | null;
  companyPhone?: string | null;
  companyEmail?: string | null;
  companyWebsite?: string | null;
}

interface User {
  name: string | null;
  email: string | null;
  company: string | null;
  settings?: UserSettings | null;
}

interface Invoice {
  id: string;
  shareId: string;
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
  client: Client;
  user: User;
  items: InvoiceItem[];
  createdAt: string;
}

interface PublicInvoiceDisplayProps {
  invoice: Invoice;
}

const resolveCompanyName = (user: User) => {
  return (
    user.settings?.companyName?.trim() ||
    user.company?.trim() ||
    user.name ||
    "Company Name"
  );
};

export function PublicInvoiceDisplay({ invoice }: PublicInvoiceDisplayProps) {
  const [isGeneratingPDF, setIsGeneratingPDF] = useState(false);

  const invoiceFromName = resolveCompanyName(invoice.user);

  const formatCurrency = (amount: number, currency: string = "USD") => {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: currency,
    }).format(amount);
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("en-US", {
      year: "numeric",
      month: "long",
      day: "numeric",
    });
  };

  const getStatusColor = (status: string) => {
    switch (status.toLowerCase()) {
      case "paid":
        return "bg-green-100 text-green-800 border-green-200";
      case "sent":
        return "bg-blue-100 text-blue-800 border-blue-200";
      case "draft":
        return "bg-gray-100 text-gray-800 border-gray-200";
      case "overdue":
        return "bg-red-100 text-red-800 border-red-200";
      default:
        return "bg-gray-100 text-gray-800 border-gray-200";
    }
  };

  const handleDownloadPDF = async () => {
    setIsGeneratingPDF(true);
    try {
      await generateInvoicePDF(invoice);
    } catch (error) {
      console.error("Error generating PDF:", error);
    } finally {
      setIsGeneratingPDF(false);
    }
  };

  // Use stored calculated values from database for display
  // This preserves the exact values that were calculated when invoice was created
  const subtotal = Number(invoice.subtotal);
  const discountAmount = Number(invoice.discount);
  const total = Number(invoice.total);
  
  // Calculate individual tax amounts for display breakdown
  const taxableAmount = subtotal - discountAmount;
  const tax1Amount = invoice.tax1Rate > 0 ? (taxableAmount * Number(invoice.tax1Rate)) / 100 : 0;
  const tax2Amount = invoice.tax2Rate > 0 ? (taxableAmount * Number(invoice.tax2Rate)) / 100 : 0;

  const userDetails = [
    {
      label: "Email",
      value:
        invoice.user.settings?.companyEmail?.trim() ||
        invoice.user.email?.trim(),
      icon: Mail,
    },
    {
      label: "Phone",
      value: invoice.user.settings?.companyPhone?.trim() || undefined,
      icon: Phone,
    },
    {
      label: "Address",
      value: invoice.user.settings?.companyAddress?.trim() || undefined,
      icon: MapPin,
    },
    {
      label: "Website",
      value: invoice.user.settings?.companyWebsite?.trim() || undefined,
      icon: Globe,
    },
  ].filter(
    (
      detail
    ): detail is { label: string; value: string; icon: LucideIcon } =>
      Boolean(detail.value?.trim())
  );

  const clientDetails = [
    {
      label: "Email",
      value: invoice.client.email,
      icon: Mail,
    },
    {
      label: "Phone",
      value: invoice.client.phone,
      icon: Phone,
    },
    {
      label: "Address",
      value: invoice.client.address,
      icon: MapPin,
    },
  ].filter(
    (
      detail
    ): detail is { label: string; value: string; icon: LucideIcon } =>
      Boolean(detail.value?.trim())
  );
  
  return (
    <div className="min-h-screen bg-gray-50 py-6 print:bg-white print:py-0">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 print:max-w-none print:px-0">
        {/* Header */}
        <div className="mb-6 print:mb-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <h1 className="text-2xl font-bold text-gray-900 print:text-xl">
                Invoice
              </h1>
              <p className="text-sm text-gray-600 mt-1">{invoiceFromName}</p>
            </div>
            <div className="flex items-center gap-3 no-print">
              <Badge className={getStatusColor(invoice.status)}>
                {invoice.status}
              </Badge>
              <Button
                onClick={handleDownloadPDF}
                disabled={isGeneratingPDF}
                className="bg-blue-600 hover:bg-blue-700"
                size="sm"
              >
                <Download className="h-4 w-4 mr-2" />
                {isGeneratingPDF ? "Generating..." : "Download PDF"}
              </Button>
            </div>
          </div>
        </div>

        {/* Invoice Card */}
        <Card className="shadow-lg print:shadow-none print:border print:border-gray-300">
          <CardContent className="p-6 print:p-6">
            {/* Invoice Header */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6 print:mb-5">
              {/* Bill From - Company Info */}
              <div>
                <h3 className="text-xs font-semibold uppercase tracking-wide text-gray-500 mb-3 print:text-[10px]">
                  Bill From
                </h3>
                <div className="font-semibold text-gray-900 text-base mb-2">
                  {invoiceFromName}
                </div>
              {userDetails.length > 0 && (
                <div className="space-y-2 text-gray-600 text-sm">
                  {userDetails.map((detail) => (
                    <div key={detail.label} className="flex items-start gap-2">
                      <detail.icon className="h-3.5 w-3.5 text-gray-400 mt-0.5 print:hidden flex-shrink-0" />
                      <div
                        className={`leading-tight ${
                          detail.label === "Address" ? "whitespace-pre-line" : ""
                        }`}
                      >
                        {detail.value}
                      </div>
                    </div>
                  ))}
                </div>
              )}
              </div>

              {/* Invoice Details */}
              <div className="lg:text-right">
                <div className="space-y-1.5 text-sm">
                  <div className="flex items-center justify-between lg:justify-end gap-3">
                    <span className="text-gray-500">Invoice #</span>
                    <span className="font-semibold text-gray-900">{invoice.number}</span>
                  </div>
                  <div className="flex items-center justify-between lg:justify-end gap-3">
                    <span className="text-gray-500">Date</span>
                    <span className="text-gray-900">{formatDate(invoice.date)}</span>
                  </div>
                  {invoice.dueDate && (
                    <div className="flex items-center justify-between lg:justify-end gap-3">
                      <span className="text-gray-500">Due Date</span>
                      <span className="text-gray-900">{formatDate(invoice.dueDate)}</span>
                    </div>
                  )}
                </div>
              </div>
            </div>

            <Separator className="my-6 print:my-5" />

            {/* Bill To Section */}
            <div className="mb-6 print:mb-5">
              <h3 className="text-xs font-semibold uppercase tracking-wide text-gray-500 mb-3 print:text-[10px]">
                Bill To
              </h3>
              <div>
                  <div className="font-semibold text-gray-900 text-base mb-2">{invoice.client.name}</div>
                  {clientDetails.length > 0 && (
                    <div className="space-y-2 text-gray-600 text-sm">
                      {clientDetails.map((detail) => (
                        <div key={detail.label} className="flex items-start gap-2">
                          <detail.icon className="h-3.5 w-3.5 text-gray-400 mt-0.5 print:hidden flex-shrink-0" />
                          <div
                            className={`leading-tight ${
                              detail.label === "Address" ? "whitespace-pre-line" : ""
                            }`}
                          >
                            {detail.value}
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
            </div>

            {/* Items Table */}
            <div className="mb-6 print:mb-5 print-avoid-break">
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                  <tr className="border-b-2 border-gray-200">
                    <th className="text-left py-2.5 px-0 font-semibold text-gray-900 print:text-xs">
                      Description
                    </th>
                    <th className="text-right py-2.5 px-0 font-semibold text-gray-900 print:text-xs">
                      Amount
                    </th>
                  </tr>
                  </thead>
                  <tbody>
                    {invoice.items.map((item) => {
                      const quantity = Number(item.quantity || 1);
                      const lineTotal = Number(item.amount) * quantity;
                      return (
                        <tr
                          key={item.id}
                          className="border-b border-gray-100 last:border-0"
                        >
                          <td className="py-2.5 px-0 text-gray-900 print:text-xs">
                            {item.description}
                            {quantity > 1 && (
                              <span className="text-xs text-gray-500 ml-1.5">
                                × {quantity}
                              </span>
                            )}
                          </td>
                          <td className="py-2.5 px-0 text-right font-medium text-gray-900 print:text-xs">
                            {formatCurrency(lineTotal, invoice.currency)}
                            {quantity > 1 && (
                              <div className="text-xs text-gray-500 mt-0.5">
                                {formatCurrency(Number(item.amount), invoice.currency)} × {quantity}
                              </div>
                            )}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Calculations */}
            <div className="ml-auto max-w-xs print:max-w-[280px]">
              <div className="space-y-1.5 text-sm">
                <div className="flex justify-between gap-4">
                  <span className="text-gray-500">Subtotal</span>
                  <span className="font-medium text-gray-900">
                    {formatCurrency(subtotal, invoice.currency)}
                  </span>
                </div>

                {discountAmount > 0 && (
                  <div className="flex justify-between gap-4">
                    <span className="text-gray-500">
                      Discount{" "}
                      {invoice.discountType === "PERCENTAGE"
                        ? `(${invoice.discount}%)`
                        : ""}
                    </span>
                    <span className="font-medium text-red-600">
                      -{formatCurrency(discountAmount, invoice.currency)}
                    </span>
                  </div>
                )}

                {invoice.tax1Rate > 0 && (
                  <div className="flex justify-between gap-4">
                    <span className="text-gray-500">
                      {invoice.tax1Name || "Tax"} ({invoice.tax1Rate}%)
                    </span>
                    <span className="font-medium text-gray-900">
                      {formatCurrency(tax1Amount, invoice.currency)}
                    </span>
                  </div>
                )}

                {invoice.tax2Rate > 0 && (
                  <div className="flex justify-between gap-4">
                    <span className="text-gray-500">
                      {invoice.tax2Name || "Tax 2"} ({invoice.tax2Rate}%)
                    </span>
                    <span className="font-medium text-gray-900">
                      {formatCurrency(tax2Amount, invoice.currency)}
                    </span>
                  </div>
                )}

                <Separator className="my-2" />

                <div className="flex justify-between gap-4 text-base font-bold pt-1">
                  <span className="text-gray-900">Total</span>
                  <span className="text-blue-600">
                    {formatCurrency(total, invoice.currency)}
                  </span>
                </div>
              </div>
            </div>

            {/* Notes */}
            {invoice.notes && (
              <div className="mt-6 print:mt-5">
                <h3 className="text-xs font-semibold uppercase tracking-wide text-gray-500 mb-2 print:text-[10px]">
                  Notes
                </h3>
                <div className="bg-gray-50 p-3 rounded-lg print:bg-white print:border print:border-gray-200">
                  <p className="text-sm text-gray-700 whitespace-pre-line leading-relaxed print:text-xs">
                    {invoice.notes}
                  </p>
                </div>
              </div>
            )}

            {/* Footer */}
            <div className="mt-8 pt-5 border-t border-gray-200 text-center print:mt-6 print:pt-4">
              <p className="text-xs text-gray-500">
                Powered by{" "}
                <span className="font-medium text-blue-600">gginvoice</span>
              </p>
            </div>
          </CardContent>
        </Card>

        {/* Payment Section */}
        {invoice.acceptPayments && invoice.status !== "PAID" && (
          <Card className="mt-8 no-print">
            <CardHeader>
              <CardTitle className="flex items-center">
                <CreditCard className="h-5 w-5 mr-2" />
                Pay Invoice
              </CardTitle>
            </CardHeader>
            <CardContent>
              <PaymentForm
                invoice={invoice}
                onPaymentSuccess={() => {
                  // Refresh the page to show updated status
                  window.location.reload();
                }}
              />
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}
