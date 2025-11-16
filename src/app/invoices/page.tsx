"use client";

import { DashboardLayout } from "@/components/dashboard/dashboard-layout";
import { PageHeader } from "@/components/dashboard/page-header";
import { MainContent } from "@/components/dashboard/main-content";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Plus, Edit, Eye } from "lucide-react";
import { useState, useEffect } from "react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

interface Invoice {
  id: string;
  number: string;
  date: string;
  status: string;
  total: number;
  currency: string;
  deleted?: boolean;
  client: {
    name: string;
  };
  createdAt: string;
}

export default function InvoicesPage() {
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState<string>("ALL");

  useEffect(() => {
    const fetchInvoices = async () => {
      try {
        const response = await fetch(`/api/invoice?status=${encodeURIComponent(statusFilter)}`);
        const result = await response.json();
        if (result.success) {
          setInvoices(result.invoices);
        }
      } catch (error) {
        console.error("Failed to fetch invoices:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchInvoices();
  }, [statusFilter]);

  // Invoices are now filtered by the backend, no client-side filtering needed
  const filteredInvoices = invoices;

  const getStatusColor = (status: string) => {
    switch (status.toLowerCase()) {
      case "paid":
        return "bg-green-100 text-green-800";
      case "sent":
        return "bg-blue-100 text-blue-800";
      case "draft":
        return "bg-gray-100 text-gray-800";
      case "refunded":
        return "bg-amber-100 text-amber-800";
      case "overdue":
        return "bg-red-100 text-red-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  return (
    <DashboardLayout>
      <PageHeader
        title="Invoices"
        subtitle="Manage your invoices and track payments"
        action={{
          label: "New Invoice",
          onClick: () => (window.location.href = "/invoices/new"),
        }}
      />
      <MainContent>
        <div className="max-w-7xl mx-auto space-y-3">

          {/* Filter Bar */}
          <div className="flex gap-0">
            {['ALL', 'DRAFT', 'SENT', 'PAID', 'REFUNDED', 'OVERDUE', 'DELETED'].map((status) => (
              <Button
                key={status}
                variant="ghost"
                size="sm"
                onClick={() => setStatusFilter(status)}
                className={`w-24 border border-gray-200 -ml-px first:ml-0 first:rounded-l-lg last:rounded-r-lg rounded-none last:rounded-r-lg first:rounded-l-lg ${
                  statusFilter === status
                    ? "bg-blue-600 text-white hover:bg-blue-700"
                    : "bg-white text-gray-700 hover:bg-gray-50"
                }`}
              >
                {status}
              </Button>
            ))}
          </div>

          {/* Invoices Table */}
          <Card>
            <CardContent>
              {loading ? (
                <div className="flex items-center justify-center py-8">
                  <div className="text-gray-500">Loading invoices...</div>
                </div>
              ) : filteredInvoices.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-12 text-center">
                  <div className="text-gray-400 mb-4">
                    <svg
                      className="mx-auto h-12 w-12"
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={1}
                        d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                      />
                    </svg>
                  </div>
                  <h3 className="text-lg font-medium text-gray-900 mb-2">
                    {statusFilter === "ALL" ? "No invoices yet" : `No ${statusFilter.toLowerCase()} invoices`}
                  </h3>
                  <p className="text-gray-500 mb-4">
                    {statusFilter === "ALL" ? "Get started by creating your first invoice." : `There are no invoices with ${statusFilter.toLowerCase()} status.`}
                  </p>
                  {statusFilter === "ALL" && (
                    <Button
                      onClick={() => (window.location.href = "/invoices/new")}
                    >
                      <Plus className="h-4 w-4" />
                      Create Your First Invoice
                    </Button>
                  )}
                </div>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Invoice #</TableHead>
                      <TableHead>Client</TableHead>
                      <TableHead>Date</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Total</TableHead>
                      <TableHead className="text-right">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredInvoices.map((invoice) => (
                        <TableRow key={invoice.id}>
                          <TableCell className="font-medium">
                            {invoice.number}
                          </TableCell>
                          <TableCell>{invoice.client.name}</TableCell>
                          <TableCell>
                            {new Date(invoice.date).toLocaleDateString()}
                          </TableCell>
                          <TableCell>
                            <span
                              className={`inline-flex px-2 py-1 text-xs font-semibold rounded-md ${getStatusColor(
                                invoice.status
                              )}`}
                            >
                              {invoice.status}
                            </span>
                          </TableCell>
                          <TableCell>
                            {invoice.currency} {Number(invoice.total).toFixed(2)}
                          </TableCell>
                          <TableCell className="text-right">
                            <div className="flex items-center justify-end gap-0">
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() =>
                                  window.open(
                                    `/invoices/public/${invoice.id}`,
                                    "_blank"
                                  )
                                }
                                className="border border-gray-200 -mr-px rounded-l-md rounded-r-none bg-white text-gray-700 hover:bg-gray-50"
                              >
                                <Eye className="h-4 w-4 mr-1" />
                                View
                              </Button>
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() =>
                                  window.location.href = `/invoices/${invoice.id}/edit`
                                }
                                className="border border-gray-200 rounded-r-md rounded-l-none bg-white text-gray-700 hover:bg-gray-50"
                              >
                                <Edit className="h-4 w-4 mr-1" />
                                Edit
                              </Button>
                            </div>
                          </TableCell>
                        </TableRow>
                      ))}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>
        </div>
      </MainContent>
    </DashboardLayout>
  );
}
