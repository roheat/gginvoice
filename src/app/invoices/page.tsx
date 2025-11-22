"use client";

import { DashboardLayout } from "@/components/dashboard/dashboard-layout";
import { PageHeader } from "@/components/dashboard/page-header";
import { MainContent } from "@/components/dashboard/main-content";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Plus, Edit, Eye, Search, X } from "lucide-react";
import { useState, useEffect, useMemo } from "react";
import { useRouter } from "next/navigation";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { InvoiceTableSkeleton } from "@/components/ui/skeletons/invoice-table-skeleton";
import { Pagination } from "@/components/ui/pagination";
import { posthog } from "@/lib/posthog";
import Fuse from "fuse.js";

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
  items?: Array<{
    description: string;
  }>;
  createdAt: string;
}

export default function InvoicesPage() {
  const router = useRouter();
  const [allInvoices, setAllInvoices] = useState<Invoice[]>([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState<string>("ALL");
  const [searchQuery, setSearchQuery] = useState<string>("");
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(10);

  // Fetch all invoices on mount
  useEffect(() => {
    const fetchInvoices = async () => {
      try {
        setLoading(true);
        const response = await fetch("/api/invoice");
        const result = await response.json();
        if (result.success) {
          setAllInvoices(result.invoices || []);
        }
      } catch (error) {
        console.error("Failed to fetch invoices:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchInvoices();
  }, []);

  // Filter by status
  const statusFilteredInvoices = useMemo(() => {
    if (statusFilter === "ALL") {
      return allInvoices.filter((inv) => !inv.deleted);
    } else if (statusFilter === "DELETED") {
      return allInvoices.filter((inv) => inv.deleted);
    } else {
      return allInvoices.filter(
        (inv) => !inv.deleted && inv.status === statusFilter.toUpperCase()
      );
    }
  }, [allInvoices, statusFilter]);

  // Fuzzy search using Fuse.js
  const fuse = useMemo(
    () =>
      new Fuse(statusFilteredInvoices, {
        keys: [
          { name: "number", weight: 0.4 },
          { name: "client.name", weight: 0.3 },
          { name: "items.description", weight: 0.3 },
        ],
        threshold: 0.3, // 0 = exact match, 1 = match anything
        includeScore: true,
        minMatchCharLength: 1,
      }),
    [statusFilteredInvoices]
  );

  const searchedInvoices = useMemo(() => {
    if (!searchQuery.trim()) {
      return statusFilteredInvoices;
    }
    const results = fuse.search(searchQuery);
    return results.map((result) => result.item);
  }, [searchQuery, fuse, statusFilteredInvoices]);

  // Frontend pagination
  const paginatedInvoices = useMemo(() => {
    const startIndex = (currentPage - 1) * itemsPerPage;
    const endIndex = startIndex + itemsPerPage;
    return searchedInvoices.slice(startIndex, endIndex);
  }, [searchedInvoices, currentPage, itemsPerPage]);

  const totalPages = Math.ceil(searchedInvoices.length / itemsPerPage);

  // Reset to page 1 when filters change
  useEffect(() => {
    setCurrentPage(1);
  }, [statusFilter, searchQuery, itemsPerPage]);

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

  const clearSearch = () => {
    setSearchQuery("");
  };

  return (
    <DashboardLayout>
      <PageHeader
        title="Invoices"
        subtitle="Manage your invoices and track payments"
        action={{
          label: "New Invoice",
          onClick: () => router.push("/invoices/new"),
        }}
      />
      <MainContent>
        <div className="max-w-7xl mx-auto space-y-3">
          {/* Filter and Search Bar */}
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between px-4">
            {/* Search Input */}
            <div className="relative flex-1 max-w-md">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400 z-10" />
              <Input
                type="text"
                placeholder="Search invoices by number, client, or items..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10 pr-10 h-10 !bg-white border-gray-200 rounded-lg shadow-sm"
              />
              {searchQuery && (
                <button
                  onClick={clearSearch}
                  className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600 z-10"
                >
                  <X className="h-4 w-4" />
                </button>
              )}
            </div>

            {/* Status Filter */}
            <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
              <div className="mr-2 min-w-[170px]">
                <p className="text-sm font-semibold text-gray-700">
                  Invoice status
                </p>
                <p className="text-xs text-gray-400">
                  Choose a view to filter the list
                </p>
              </div>
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger className="max-w-[160px] w-full">
                  <SelectValue placeholder="Select status" />
                </SelectTrigger>
                <SelectContent>
                  {[
                    "ALL",
                    "DRAFT",
                    "SENT",
                    "PAID",
                    "REFUNDED",
                    "OVERDUE",
                    "DELETED",
                  ].map((status) => (
                    <SelectItem key={status} value={status}>
                      {status}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Invoices Table */}
          {loading ? (
            <InvoiceTableSkeleton rows={itemsPerPage} />
          ) : searchedInvoices.length === 0 ? (
            <Card>
              <CardContent>
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
                    {searchQuery
                      ? "No invoices found"
                      : statusFilter === "ALL"
                      ? "No invoices yet"
                      : `No ${statusFilter.toLowerCase()} invoices`}
                  </h3>
                  <p className="text-gray-500 mb-4">
                    {searchQuery
                      ? "Try adjusting your search query."
                      : statusFilter === "ALL"
                      ? "Get started by creating your first invoice."
                      : `There are no invoices with ${statusFilter.toLowerCase()} status.`}
                  </p>
                  {!searchQuery && statusFilter === "ALL" && (
                    <Button onClick={() => router.push("/invoices/new")}>
                      <Plus className="h-4 w-4" />
                      Create Your First Invoice
                    </Button>
                  )}
                </div>
              </CardContent>
            </Card>
          ) : (
            <Card>
              <CardContent className="p-0">
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
                    {paginatedInvoices.map((invoice) => (
                      <TableRow
                        key={invoice.id}
                        className="cursor-pointer"
                        onClick={() =>
                          router.push(`/invoices/${invoice.id}/edit`)
                        }
                      >
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
                        <TableCell
                          className="text-right"
                          onClick={(e) => e.stopPropagation()}
                        >
                          <div className="flex items-center justify-end gap-0">
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => {
                                posthog.capture("invoice_view_clicked", {
                                  invoiceId: invoice.id,
                                });
                                window.open(
                                  `/invoices/public/${invoice.id}`,
                                  "_blank"
                                );
                              }}
                              className="border border-gray-200 -mr-px rounded-l-md rounded-r-none bg-white text-gray-700 hover:bg-gray-50"
                            >
                              <Eye className="h-4 w-4" />
                              View
                            </Button>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => {
                                posthog.capture("invoice_edit_clicked", {
                                  invoiceId: invoice.id,
                                });
                                router.push(`/invoices/${invoice.id}/edit`);
                              }}
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
                {searchedInvoices.length > 0 && (
                  <Pagination
                    currentPage={currentPage}
                    totalPages={totalPages}
                    totalItems={searchedInvoices.length}
                    itemsPerPage={itemsPerPage}
                    onPageChange={setCurrentPage}
                    onPageSizeChange={setItemsPerPage}
                    pageSizeOptions={[10, 25, 50, 100]}
                  />
                )}
              </CardContent>
            </Card>
          )}
        </div>
      </MainContent>
    </DashboardLayout>
  );
}
