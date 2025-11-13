 "use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { DashboardLayout } from "@/components/dashboard/dashboard-layout";
import { PageHeader } from "@/components/dashboard/page-header";
import { MainContent } from "@/components/dashboard/main-content";
import { ClientForm } from "@/components/clients/client-form";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

type Client = {
  id: string;
  name: string;
  email: string | null;
  address: string | null;
  phone: string | null;
};

export default function EditClientPage() {
  const params = useParams();
  const router = useRouter();
  const clientId = params?.id as string;

  const [client, setClient] = useState<Client | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchClient = async () => {
      try {
        const res = await fetch(`/api/clients/${clientId}`);
        const json = await res.json();
        if (res.ok && json.success) {
          setClient(json.client);
        } else {
          console.error("Failed to fetch client", json);
        }
      } catch (err) {
        console.error("Error fetching client:", err);
      } finally {
        setLoading(false);
      }
    };

    if (clientId) fetchClient();
  }, [clientId]);

  return (
    <DashboardLayout>
      <PageHeader
        title="Edit Client"
        subtitle="Update client information"
        action={{
          label: "Back to clients",
          onClick: () => (window.location.href = "/clients"),
        }}
      />
      <MainContent>
        <div className="max-w-3xl mx-auto">
            {loading ? (
                <div>Loading client...</div>
                ) : client ? (
                <ClientForm
                    initialData={{
                    id: client.id,
                    name: client.name || "",
                    email: client.email || "",
                    address: client.address || "",
                    phone: client.phone || "",
                    }}
                    isEditing
                    onSuccess={() => router.push("/clients")}
                />
                ) : (
                <div>Client not found</div>
            )}
        </div>
      </MainContent>
    </DashboardLayout>
  );
}


