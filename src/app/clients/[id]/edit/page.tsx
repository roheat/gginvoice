 "use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { DashboardLayout } from "@/components/dashboard/dashboard-layout";
import { PageHeader } from "@/components/dashboard/page-header";
import { MainContent } from "@/components/dashboard/main-content";
import { ClientForm } from "@/components/clients/client-form";
import { FormSkeleton } from "@/components/ui/skeletons/form-skeleton";
import { PageHeaderSkeleton } from "@/components/ui/skeletons/page-header-skeleton";

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
      {loading ? (
        <PageHeaderSkeleton showSubtitle={true} />
      ) : (
        <PageHeader
          title="Edit Client"
          subtitle="Update client information"
        />
      )}
      <MainContent>
        <div className="max-w-3xl mx-auto">
            {loading ? (
                <FormSkeleton fields={4} showHeader={false} />
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


