"use client";

import { DashboardLayout } from "@/components/dashboard/dashboard-layout";
import { PageHeader } from "@/components/dashboard/page-header";
import { MainContent } from "@/components/dashboard/main-content";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Plus, Edit, Trash2 } from "lucide-react";
import { useState, useEffect } from "react";
import { toast } from "sonner";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

interface Client {
  id: string;
  name: string;
  email: string | null;
  address: string | null;
  phone: string | null;
  createdAt: string;
}

export default function ClientsPage() {
  const [clients, setClients] = useState<Client[]>([]);
  const [loading, setLoading] = useState(true);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  useEffect(() => {
    const fetchClients = async () => {
      try {
        const response = await fetch("/api/clients");
        const result = await response.json();
        if (result.success) {
          setClients(result.clients);
        }
      } catch (error) {
        console.error("Failed to fetch clients:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchClients();
  }, []);

  const handleDeleteClient = async (clientId: string) => {
    if (confirm("Are you sure you want to delete this client?")) {
      try {
        setDeletingId(clientId);
        const response = await fetch(`/api/clients/${clientId}`, {
          method: "DELETE",
        });
        const result = await response.json().catch(() => null);
        if (response.ok && result && result.success) {
          setClients((prev) => prev.filter((client) => client.id !== clientId));
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

  return (
    <DashboardLayout>
      <PageHeader
        title="Clients"
        subtitle="Manage your clients and their information"
        action={{
          label: "Add Client",
          onClick: () => (window.location.href = "/clients/new"),
        }}
      />
      <MainContent>
        <div className="max-w-7xl mx-auto">
          <Card>
            <CardHeader>
              <CardTitle>All Clients ({clients.length})</CardTitle>
            </CardHeader>
            <CardContent>
              {loading ? (
                <div className="flex items-center justify-center py-8">
                  <div className="text-gray-500">Loading clients...</div>
                </div>
              ) : clients.length === 0 ? (
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
                    No clients yet
                  </h3>
                  <p className="text-gray-500 mb-4">
                    Start by adding your first client.
                  </p>
                  <Button
                    onClick={() => (window.location.href = "/clients/new")}
                  >
                    <Plus className="h-4 w-4 mr-2" />
                    Add Your First Client
                  </Button>
                </div>
              ) : (
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
                    {clients.map((client) => (
                      <TableRow key={client.id}>
                        <TableCell className="font-medium">
                          {client.name}
                        </TableCell>
                        <TableCell>{client.email || "-"}</TableCell>
                        <TableCell>{client.address || "-"}</TableCell>
                        <TableCell>{client.phone || "-"}</TableCell>
                        <TableCell>
                          {new Date(client.createdAt).toLocaleDateString()}
                        </TableCell>
                        <TableCell className="text-right">
                          <div className="flex items-center justify-end space-x-2">
                            <Button variant="ghost" size="sm" onClick={() => (window.location.href = `/clients/${client.id}/edit`)}>
                              <Edit className="h-4 w-4" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleDeleteClient(client.id)}
                              className="text-red-600 hover:text-red-700"
                              disabled={deletingId === client.id}
                            >
                              <Trash2 className="h-4 w-4" />
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
