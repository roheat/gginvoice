"use client";

import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Download, User, Mail, CreditCard } from "lucide-react";
import { generateInvoicePDF } from "@/lib/pdf-generator";
import { PaymentForm } from "@/components/payments/payment-form";

interface InvoiceItem {
  id: string;
  description: string;
  amount: number;
}

interface Client {
  id: string;
  name: string;
  email: string | null;
  address: string | null;
  phone: string | null;
}

interface User {
  name: string | null;
  email: string | null;
  company: string | null;
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

export function PublicInvoiceDisplay({ invoice }: PublicInvoiceDisplayProps) {
  const [isGeneratingPDF, setIsGeneratingPDF] = useState(false);

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

  const calculateTaxAmount = (rate: number, subtotal: number) => {
    return (subtotal * rate) / 100;
  };

  const subtotal = invoice.items.reduce(
    (sum, item) => sum + Number(item.amount),
    0
  );
  const discountAmount =
    invoice.discountType === "PERCENTAGE"
      ? (subtotal * invoice.discount) / 100
      : invoice.discount;
  const afterDiscount = subtotal - discountAmount;

  const tax1Amount =
    invoice.tax1Rate > 0
      ? calculateTaxAmount(invoice.tax1Rate, afterDiscount)
      : 0;
  const tax2Amount =
    invoice.tax2Rate > 0
      ? calculateTaxAmount(invoice.tax2Rate, afterDiscount)
      : 0;
  const totalTax = tax1Amount + tax2Amount;
  const total = afterDiscount + totalTax;

  return (
    <div className="min-h-screen bg-gray-50 py-8 print:bg-white print:py-0">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 print:max-w-none print:px-0">
        {/* Header */}
        <div className="mb-8 print:mb-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <h1 className="text-3xl font-bold text-gray-900 print:text-2xl">
                Invoice
              </h1>
              <p className="text-gray-600 mt-1">
                {invoice.user.company || invoice.user.name || "Company Name"}
              </p>
            </div>
            <div className="flex items-center space-x-4 no-print">
              <Badge className={getStatusColor(invoice.status)}>
                {invoice.status}
              </Badge>
              <Button
                onClick={handleDownloadPDF}
                disabled={isGeneratingPDF}
                className="bg-blue-600 hover:bg-blue-700"
              >
                <Download className="h-4 w-4 mr-2" />
                {isGeneratingPDF ? "Generating..." : "Download PDF"}
              </Button>
            </div>
          </div>
        </div>

        {/* Invoice Card */}
        <Card className="shadow-lg print:shadow-none print:border print:border-gray-300">
          <CardContent className="p-8 print:p-6">
            {/* Invoice Header */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8 print:mb-6">
              {/* Company Info */}
              <div>
                <h2 className="text-xl font-semibold text-gray-900 mb-4 print:text-lg">
                  {invoice.user.company || invoice.user.name || "Company Name"}
                </h2>
                <div className="space-y-2 text-gray-600">
                  {invoice.user.email && (
                    <div className="flex items-center">
                      <Mail className="h-4 w-4 mr-2 print:hidden" />
                      {invoice.user.email}
                    </div>
                  )}
                </div>
              </div>

              {/* Invoice Details */}
              <div className="lg:text-right">
                <div className="space-y-2">
                  <div className="flex items-center justify-between lg:justify-end">
                    <span className="text-gray-600">Invoice #:</span>
                    <span className="font-semibold">{invoice.number}</span>
                  </div>
                  <div className="flex items-center justify-between lg:justify-end">
                    <span className="text-gray-600">Date:</span>
                    <span>{formatDate(invoice.date)}</span>
                  </div>
                  {invoice.dueDate && (
                    <div className="flex items-center justify-between lg:justify-end">
                      <span className="text-gray-600">Due Date:</span>
                      <span>{formatDate(invoice.dueDate)}</span>
                    </div>
                  )}
                </div>
              </div>
            </div>

            <Separator className="my-8 print:my-6" />

            {/* Bill To Section */}
            <div className="mb-8 print:mb-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4 print:text-base">
                Bill To
              </h3>
              <div className="bg-gray-50 p-4 rounded-lg print:bg-white print:border print:border-gray-300">
                <div className="font-medium text-gray-900">
                  {invoice.client.name}
                </div>
                {invoice.client.email && (
                  <div className="text-gray-600 mt-1">
                    {invoice.client.email}
                  </div>
                )}
                {invoice.client.phone && (
                  <div className="text-gray-600">{invoice.client.phone}</div>
                )}
                {invoice.client.address && (
                  <div className="text-gray-600 mt-2 whitespace-pre-line">
                    {invoice.client.address}
                  </div>
                )}
              </div>
            </div>

            {/* Items Table */}
            <div className="mb-8 print:mb-6 print-avoid-break">
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b border-gray-200">
                      <th className="text-left py-3 px-4 font-semibold text-gray-900 print:text-sm">
                        Description
                      </th>
                      <th className="text-right py-3 px-4 font-semibold text-gray-900 print:text-sm">
                        Amount
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {invoice.items.map((item, index) => (
                      <tr
                        key={item.id}
                        className={`${
                          index % 2 === 0 ? "bg-gray-50" : "bg-white"
                        } print:bg-white`}
                      >
                        <td className="py-3 px-4 text-gray-900 print:text-sm">
                          {item.description}
                        </td>
                        <td className="py-3 px-4 text-right font-medium text-gray-900 print:text-sm">
                          {formatCurrency(
                            Number(item.amount),
                            invoice.currency
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Calculations */}
            <div className="ml-auto max-w-sm print:max-w-xs">
              <div className="space-y-2">
                <div className="flex justify-between">
                  <span className="text-gray-600 print:text-sm">Subtotal:</span>
                  <span className="font-medium print:text-sm">
                    {formatCurrency(subtotal, invoice.currency)}
                  </span>
                </div>

                {discountAmount > 0 && (
                  <div className="flex justify-between">
                    <span className="text-gray-600 print:text-sm">
                      Discount{" "}
                      {invoice.discountType === "PERCENTAGE"
                        ? `(${invoice.discount}%)`
                        : ""}
                      :
                    </span>
                    <span className="font-medium text-red-600 print:text-sm">
                      -{formatCurrency(discountAmount, invoice.currency)}
                    </span>
                  </div>
                )}

                {invoice.tax1Rate > 0 && (
                  <div className="flex justify-between">
                    <span className="text-gray-600 print:text-sm">
                      {invoice.tax1Name || "Tax"} ({invoice.tax1Rate}%):
                    </span>
                    <span className="font-medium print:text-sm">
                      {formatCurrency(tax1Amount, invoice.currency)}
                    </span>
                  </div>
                )}

                {invoice.tax2Rate > 0 && (
                  <div className="flex justify-between">
                    <span className="text-gray-600 print:text-sm">
                      {invoice.tax2Name || "Tax 2"} ({invoice.tax2Rate}%):
                    </span>
                    <span className="font-medium print:text-sm">
                      {formatCurrency(tax2Amount, invoice.currency)}
                    </span>
                  </div>
                )}

                <Separator className="my-2" />

                <div className="flex justify-between text-lg font-bold print:text-base">
                  <span>Total:</span>
                  <span className="text-blue-600">
                    {formatCurrency(total, invoice.currency)}
                  </span>
                </div>
              </div>
            </div>

            {/* Notes */}
            {invoice.notes && (
              <div className="mt-8 print:mt-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-2 print:text-base">
                  Notes
                </h3>
                <div className="bg-gray-50 p-4 rounded-lg print:bg-white print:border print:border-gray-300">
                  <p className="text-gray-700 whitespace-pre-line print:text-sm">
                    {invoice.notes}
                  </p>
                </div>
              </div>
            )}

            {/* Footer */}
            <div className="mt-12 pt-8 border-t border-gray-200 text-center text-gray-500 print:mt-8 print:pt-6">
              <p className="print:text-sm">
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
