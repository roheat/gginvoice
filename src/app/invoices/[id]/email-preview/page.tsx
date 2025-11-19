import Link from "next/link";
import { redirect, notFound } from "next/navigation";
import { getServerSession } from "next-auth";
import { ArrowLeft } from "lucide-react";

import { DashboardLayout } from "@/components/dashboard/dashboard-layout";
import { MainContent } from "@/components/dashboard/main-content";
import { PageHeader } from "@/components/dashboard/page-header";
import { Button } from "@/components/ui/button";
import { db } from "@/lib/db";
import { authOptions } from "@/lib/auth";
import { createInvoiceEmail } from "@/lib/email";

interface EmailPreviewProps {
  params: Promise<{
    id: string;
  }>;
}

export default async function InvoiceEmailPreviewPage({
  params,
}: EmailPreviewProps) {
  const session = await getServerSession(authOptions);

  if (!session?.user?.id) {
    redirect("/login");
  }

  const { id } = await params;

  const invoice = await db.invoice.findFirst({
    where: {
      id: id,
      userId: session.user.id,
    },
    include: {
      client: true,
      user: {
        include: {
          settings: true,
        },
      },
    },
  });

  if (!invoice) {
    notFound();
  }

  const { subject, html, text } = createInvoiceEmail(invoice);
  const appUrl =
    process.env.NEXT_PUBLIC_APP_URL || process.env.NEXTAUTH_URL || "";
  const baseUrl = appUrl.replace(/\/$/, "");
  const publicLink = `${baseUrl}/invoices/public/${invoice.id}`;

  return (
    <DashboardLayout>
      <PageHeader
        title={`Email Preview`}
        subtitle={`Invoice ${invoice.number} notification`}
      />
      <MainContent>
        <div className="mx-auto max-w-5xl space-y-6 px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col gap-3 rounded-xl border border-gray-200 bg-white p-6 shadow-sm md:flex-row md:items-center md:justify-between">
            <div>
              <p className="text-sm font-medium text-gray-500">Subject</p>
              <p className="text-xl font-semibold text-gray-900">{subject}</p>
              <div className="flex flex-wrap items-center gap-2 text-sm text-gray-500">
                <span>Public link:</span>
                <Link
                  href={publicLink}
                  target="_blank"
                  className="text-blue-600 underline"
                >
                  {publicLink}
                </Link>
              </div>
            </div>
            <div className="flex flex-wrap items-center gap-2">
              <Button size="sm" variant="outline" asChild>
                <Link
                  href={`/invoices/${id}/edit`}
                  className="flex items-center gap-2"
                >
                  <ArrowLeft className="h-4 w-4" />
                  Back to invoice
                </Link>
              </Button>
            </div>
          </div>

          <div className="space-y-4">
            <div className="rounded-xl border border-gray-200 bg-white shadow-sm">
              <div className="bg-slate-50 px-4 py-3 text-xs font-semibold uppercase tracking-wide text-gray-500">
                HTML preview
              </div>
              <div
                className="bg-white px-6 py-8"
                dangerouslySetInnerHTML={{ __html: html }}
              />
            </div>

            <div className="rounded-xl border border-gray-200 bg-white shadow-sm">
              <div className="px-6 py-3 text-xs font-semibold uppercase tracking-wide text-gray-500">
                Text preview
              </div>
              <pre className="m-6 rounded-lg bg-gray-50 p-4 text-sm text-gray-700 whitespace-pre-wrap">
                {text}
              </pre>
            </div>
          </div>
        </div>
      </MainContent>
    </DashboardLayout>
  );
}
