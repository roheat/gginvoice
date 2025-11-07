import { Metadata } from "next";
import { notFound } from "next/navigation";
import { PublicInvoiceDisplay } from "@/components/invoices/public-invoice-display";

interface PageProps {
  params: Promise<{
    id: string;
  }>;
}

export async function generateMetadata({
  params,
}: PageProps): Promise<Metadata> {
  try {
    const { id } = await params;
    const response = await fetch(
      `${
        process.env.NEXTAUTH_URL || "http://localhost:3000"
      }/api/invoices/public/${id}`,
      {
        cache: "no-store",
      }
    );

    if (!response.ok) {
      return {
        title: "Invoice Not Found - gginvoice",
        description: "The requested invoice could not be found.",
      };
    }

    const data = await response.json();
    const invoice = data.invoice;

    return {
      title: `Invoice ${invoice.number} - ${invoice.client.name}`,
      description: `Invoice ${invoice.number} for ${invoice.client.name} - ${
        invoice.currency
      } ${Number(invoice.total).toFixed(2)}`,
      openGraph: {
        title: `Invoice ${invoice.number} - ${invoice.client.name}`,
        description: `Invoice ${invoice.number} for ${invoice.client.name} - ${
          invoice.currency
        } ${Number(invoice.total).toFixed(2)}`,
        type: "website",
      },
    };
  } catch {
    return {
      title: "Invoice - gginvoice",
      description: "View invoice details",
    };
  }
}

export default async function PublicInvoicePage({ params }: PageProps) {
  try {
    const { id } = await params;
    const response = await fetch(
      `${
        process.env.NEXTAUTH_URL || "http://localhost:3000"
      }/api/invoices/public/${id}`,
      {
        cache: "no-store",
      }
    );

    if (!response.ok) {
      notFound();
    }

    const data = await response.json();
    const invoice = data.invoice;

    return <PublicInvoiceDisplay invoice={invoice} />;
  } catch {
    notFound();
  }
}
