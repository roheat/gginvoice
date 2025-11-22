"use client";

import { DashboardLayout } from "@/components/dashboard/dashboard-layout";
import { PageHeader } from "@/components/dashboard/page-header";
import { MainContent } from "@/components/dashboard/main-content";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Plus, Edit, Trash2, Search, X } from "lucide-react";
import { useState, useEffect, useMemo } from "react";
import { toast } from "sonner";
import { useRouter } from "next/navigation";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { ClientsTableSkeleton } from "@/components/ui/skeletons/clients-table-skeleton";
import { Pagination } from "@/components/ui/pagination";
import Fuse from "fuse.js";

interface Client {
  id: string;
  name: string;
  email: string | null;
  address: string | null;
  phone: string | null;
  createdAt: string;
}

export default function ClientsPage() {
  const router = useRouter();
  const [allClients, setAllClients] = useState<Client[]>([]);
  const [loading, setLoading] = useState(true);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState<string>("");
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(10);

  // Fetch all clients on mount
  useEffect(() => {
    const fetchClients = async () => {
      try {
        setLoading(true);
        const response = await fetch("/api/clients");
        const result = await response.json();
        if (result.success) {
          setAllClients(result.clients || []);
        }
      } catch (error) {
        console.error("Failed to fetch clients:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchClients();
  }, []);

  // Fuzzy search using Fuse.js
  const fuse = useMemo(
    () =>
      new Fuse(allClients, {
        keys: [
          { name: "name", weight: 0.4 },
          { name: "email", weight: 0.3 },
          { name: "address", weight: 0.2 },
          { name: "phone", weight: 0.1 },
        ],
        threshold: 0.3, // 0 = exact match, 1 = match anything
        includeScore: true,
        minMatchCharLength: 1,
      }),
    [allClients]
  );

  const searchedClients = useMemo(() => {
    if (!searchQuery.trim()) {
      return allClients;
    }
    const results = fuse.search(searchQuery);
    return results.map((result) => result.item);
  }, [searchQuery, fuse, allClients]);

  // Frontend pagination
  const paginatedClients = useMemo(() => {
    const startIndex = (currentPage - 1) * itemsPerPage;
    const endIndex = startIndex + itemsPerPage;
    return searchedClients.slice(startIndex, endIndex);
  }, [searchedClients, currentPage, itemsPerPage]);

  const totalPages = Math.ceil(searchedClients.length / itemsPerPage);

  // Reset to page 1 when search or page size changes
  useEffect(() => {
    setCurrentPage(1);
  }, [searchQuery, itemsPerPage]);

  const handleDeleteClient = async (clientId: string) => {
    if (confirm("Are you sure you want to delete this client?")) {
      try {
        setDeletingId(clientId);
        const response = await fetch(`/api/clients/${clientId}`, {
          method: "DELETE",
        });
        const result = await response.json().catch(() => null);
        if (response.ok && result && result.success) {
          // Remove from local state
          setAllClients((prev) => prev.filter((c) => c.id !== clientId));
          toast.success("Client deleted");
        } else {
          const err = result?.error || "Failed to delete client";
          toast.error(err);
          console.error("Failed to delete client:", err);
        }
        setDeletingId(null);
      } catch (error) {
        console.error("Failed to delete client:", error);
        toast.error("Failed to delete client");
        setDeletingId(null);
      }
    }
  };

  const clearSearch = () => {
    setSearchQuery("");
  };

  return (
    <DashboardLayout>
      <PageHeader
        title="Clients"
        subtitle="Manage your clients and their information"
        action={{
          label: "Add Client",
          onClick: () => router.push("/clients/new"),
        }}
      />
      <MainContent>
        <div className="max-w-7xl mx-auto space-y-3">
          {/* Search Bar */}
          <div className="px-4">
            <div className="relative max-w-md">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400 z-10" />
              <Input
                type="text"
                placeholder="Search clients by name, email, address, or phone..."
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
          </div>

          {/* Clients Table */}
          {loading ? (
            <ClientsTableSkeleton rows={itemsPerPage} />
          ) : searchedClients.length === 0 ? (
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
                        d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z"
                      />
                    </svg>
                  </div>
                  <h3 className="text-lg font-medium text-gray-900 mb-2">
                    {searchQuery ? "No clients found" : "No clients yet"}
                  </h3>
                  <p className="text-gray-500 mb-4">
                    {searchQuery
                      ? "Try adjusting your search query."
                      : "Start by adding your first client."}
                  </p>
                  {!searchQuery && (
                    <Button onClick={() => router.push("/clients/new")}>
                      <Plus className="h-4 w-4 mr-2" />
                      Add Your First Client
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
                      <TableHead>Name</TableHead>
                      <TableHead>Email</TableHead>
                      <TableHead>Address</TableHead>
                      <TableHead>Phone</TableHead>
                      <TableHead>Created</TableHead>
                      <TableHead className="text-right">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {paginatedClients.map((client) => (
                      <TableRow
                        key={client.id}
                        className="cursor-pointer"
                        onClick={() =>
                          router.push(`/clients/${client.id}/edit`)
                        }
                      >
                        <TableCell className="font-medium">
                          {client.name}
                        </TableCell>
                        <TableCell>{client.email || "-"}</TableCell>
                        <TableCell>{client.address || "-"}</TableCell>
                        <TableCell>{client.phone || "-"}</TableCell>
                        <TableCell>
                          {new Date(client.createdAt).toLocaleDateString()}
                        </TableCell>
                        <TableCell
                          className="text-right"
                          onClick={(e) => e.stopPropagation()}
                        >
                          <div className="flex items-center justify-end gap-0">
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() =>
                                router.push(`/clients/${client.id}/edit`)
                              }
                              className="border border-gray-200 -mr-px rounded-l-md rounded-r-none bg-white text-gray-700 hover:bg-gray-50"
                            >
                              <Edit className="h-4 w-4 mr-1" />
                              Edit
                            </Button>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleDeleteClient(client.id)}
                              className="border border-gray-200 rounded-r-md rounded-l-none bg-white text-red-600 hover:bg-red-50 hover:text-red-700"
                              disabled={deletingId === client.id}
                            >
                              <Trash2 className="h-4 w-4" />
                              Delete
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
                {searchedClients.length > 0 && (
                  <Pagination
                    currentPage={currentPage}
                    totalPages={totalPages}
                    totalItems={searchedClients.length}
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
