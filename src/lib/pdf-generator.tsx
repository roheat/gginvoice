import React from "react";
import { Document, Page, Text, View, StyleSheet, Image } from "@react-pdf/renderer";

// Use default fonts for better compatibility
// Font.register({
//   family: "Inter",
//   src: "https://fonts.gstatic.com/s/inter/v12/UcCO3FwrK3iLTeHuS_fvQtMwCp50KnMw2boKoduKmMEVuLyfAZ9hiJ-Ek-_EeA.woff2",
// });

const styles = StyleSheet.create({
  page: {
    flexDirection: "column",
    backgroundColor: "#ffffff",
    padding: 24,
    fontFamily: "Helvetica",
  },
  logo: {
    width: 192,
    height: 96,
    objectFit: "contain",
    marginBottom: 20,
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 20,
  },
  companyInfo: {
    flexDirection: "column",
  },
  sectionHeader: {
    fontSize: 8,
    fontWeight: "bold",
    textTransform: "uppercase",
    letterSpacing: 0.8,
    color: "#6b7280",
    marginBottom: 8,
  },
  companyName: {
    fontSize: 13,
    fontWeight: "bold",
    color: "#000000",
    marginBottom: 6,
  },
  companyEmail: {
    fontSize: 10,
    color: "#4b5563",
    lineHeight: 1.4,
  },
  detailRow: {
    flexDirection: "row",
    alignItems: "flex-start",
    marginTop: 3,
  },
  invoiceDetails: {
    flexDirection: "column",
    alignItems: "flex-end",
  },
  invoiceTitle: {
    fontSize: 16,
    fontWeight: "bold",
    color: "#000000",
    marginBottom: 6,
  },
  invoiceMetaRow: {
    flexDirection: "row",
    justifyContent: "flex-end",
    marginBottom: 2,
    gap: 12,
  },
  invoiceMetaLabel: {
    fontSize: 10,
    color: "#6b7280",
  },
  invoiceMetaValue: {
    fontSize: 10,
    color: "#000000",
    fontWeight: "bold",
  },
  statusBadge: {
    backgroundColor: "#3b82f6",
    color: "#ffffff",
    paddingHorizontal: 6,
    paddingVertical: 3,
    borderRadius: 3,
    fontSize: 8,
    fontWeight: "bold",
    marginTop: 6,
    alignSelf: "flex-end",
  },
  separator: {
    borderBottomWidth: 1,
    borderBottomColor: "#e5e7eb",
    marginVertical: 20,
  },
  billToSection: {
    marginBottom: 20,
  },
  billToInfo: {
    flexDirection: "column",
  },
  clientName: {
    fontSize: 13,
    fontWeight: "bold",
    color: "#000000",
    marginBottom: 6,
  },
  clientDetails: {
    fontSize: 10,
    color: "#4b5563",
    lineHeight: 1.4,
  },
  itemsTable: {
    marginBottom: 20,
  },
  tableHeader: {
    flexDirection: "row",
    borderBottomWidth: 2,
    borderBottomColor: "#d1d5db",
    paddingBottom: 8,
  },
  tableHeaderCell: {
    fontSize: 10,
    fontWeight: "bold",
    color: "#000000",
  },
  descriptionHeader: {
    flex: 2,
  },
  amountHeader: {
    flex: 1,
    textAlign: "right",
  },
  tableRow: {
    flexDirection: "row",
    borderBottomWidth: 0.5,
    borderBottomColor: "#f3f4f6",
    paddingVertical: 8,
  },
  tableCell: {
    fontSize: 10,
    color: "#000000",
  },
  descriptionCell: {
    flex: 2,
  },
  amountCell: {
    flex: 1,
    textAlign: "right",
    fontWeight: "bold",
  },
  quantityMeta: {
    fontSize: 8,
    color: "#6b7280",
    fontWeight: "normal",
  },
  calculations: {
    alignSelf: "flex-end",
    width: 180,
    marginBottom: 20,
  },
  calculationRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 3,
    gap: 16,
  },
  calculationLabel: {
    fontSize: 10,
    color: "#6b7280",
  },
  calculationValue: {
    fontSize: 10,
    fontWeight: "bold",
    color: "#000000",
  },
  totalRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    borderTopWidth: 1,
    borderTopColor: "#d1d5db",
    paddingTop: 6,
    marginTop: 6,
    gap: 16,
  },
  totalLabel: {
    fontSize: 13,
    fontWeight: "bold",
    color: "#000000",
  },
  totalValue: {
    fontSize: 13,
    fontWeight: "bold",
    color: "#0000ff",
  },
  notesSection: {
    marginBottom: 20,
  },
  notesContent: {
    backgroundColor: "#f9fafb",
    padding: 10,
    borderRadius: 4,
    fontSize: 9,
    color: "#000000",
    lineHeight: 1.5,
  },
  footer: {
    position: "absolute",
    bottom: 24,
    left: 24,
    right: 24,
    textAlign: "center",
    fontSize: 8,
    color: "#6b7280",
    borderTopWidth: 1,
    borderTopColor: "#e5e7eb",
    paddingTop: 16,
  },
});

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
  companyWebsite?: string | null;
  companyLogoUrl?: string | null;
}

interface User {
  name: string | null;
  email: string | null;
  company: string | null;
  settings?: UserSettings | null;
}

interface Invoice {
  id: string;
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
  client: Client;
  user: User;
  items: InvoiceItem[];
  createdAt: string;
}

const resolveCompanyName = (user: User) => {
  return (
    user.settings?.companyName?.trim() ||
    user.company?.trim() ||
    user.name ||
    "Company Name"
  );
};

const InvoicePDF = ({ invoice }: { invoice: Invoice }) => {
  console.log("Rendering PDF for invoice:", invoice);

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

  // Use stored calculated values from database for display
  // This preserves the exact values that were calculated when invoice was created
  const subtotal = Number(invoice.subtotal);
  const discountAmount = Number(invoice.discount);
  const total = Number(invoice.total);
  
  // Calculate individual tax amounts for display breakdown
  const taxableAmount = subtotal - discountAmount;
  const tax1Amount = invoice.tax1Rate > 0 ? (taxableAmount * Number(invoice.tax1Rate)) / 100 : 0;
  const tax2Amount = invoice.tax2Rate > 0 ? (taxableAmount * Number(invoice.tax2Rate)) / 100 : 0;

  const invoiceFromName = resolveCompanyName(invoice.user);
  const userDetails = [
    {
      label: "Email",
      value: invoice.user.email?.trim(),
    },
    {
      label: "Phone",
      value: invoice.user.settings?.companyPhone?.trim(),
    },
    {
      label: "Address",
      value: invoice.user.settings?.companyAddress?.trim(),
    },
    {
      label: "Website",
      value: invoice.user.settings?.companyWebsite?.trim(),
    },
  ].filter((detail): detail is { label: string; value: string } =>
    Boolean(detail.value?.trim())
  );

  const clientDetails = [
    { label: "Email", value: invoice.client.email },
    { label: "Phone", value: invoice.client.phone },
    { label: "Address", value: invoice.client.address },
  ].filter((detail): detail is { label: string; value: string } =>
    Boolean(detail.value?.trim())
  );

  return (
    <Document>
      <Page size="A4" style={styles.page}>
        {/* Logo */}
        {invoice.user.settings?.companyLogoUrl && (
          // eslint-disable-next-line jsx-a11y/alt-text
          <Image 
            src={invoice.user.settings.companyLogoUrl} 
            style={styles.logo}
          />
        )}

        {/* Header */}
        <View style={styles.header}>
          <View style={styles.companyInfo}>
            <Text style={styles.sectionHeader}>BILL FROM</Text>
            <Text style={styles.companyName}>{invoiceFromName}</Text>
            {userDetails.map((detail) => (
              <View key={detail.label} style={styles.detailRow}>
                <Text style={styles.companyEmail}>{detail.value}</Text>
              </View>
            ))}
          </View>
          <View style={styles.invoiceDetails}>
            <Text style={styles.invoiceTitle}>INVOICE</Text>
            <View style={styles.invoiceMetaRow}>
              <Text style={styles.invoiceMetaLabel}>Invoice #</Text>
              <Text style={styles.invoiceMetaValue}>{invoice.number}</Text>
            </View>
            <View style={styles.invoiceMetaRow}>
              <Text style={styles.invoiceMetaLabel}>Date</Text>
              <Text style={styles.invoiceMetaValue}>{formatDate(invoice.date)}</Text>
            </View>
            {invoice.dueDate && (
              <View style={styles.invoiceMetaRow}>
                <Text style={styles.invoiceMetaLabel}>Due Date</Text>
                <Text style={styles.invoiceMetaValue}>{formatDate(invoice.dueDate)}</Text>
              </View>
            )}
            <Text style={styles.statusBadge}>
              {invoice.status.toUpperCase()}
            </Text>
          </View>
        </View>

        {/* Separator */}
        <View style={styles.separator} />

        {/* Bill To Section */}
        <View style={styles.billToSection}>
          <Text style={styles.sectionHeader}>BILL TO</Text>
          <View style={styles.billToInfo}>
            <Text style={styles.clientName}>{invoice.client.name}</Text>
            {clientDetails.map((detail) => (
              <View key={detail.label} style={styles.detailRow}>
                <Text style={styles.clientDetails}>{detail.value}</Text>
              </View>
            ))}
          </View>
        </View>

        {/* Items Table */}
        <View style={styles.itemsTable}>
          <View style={styles.tableHeader}>
            <Text style={[styles.tableHeaderCell, styles.descriptionHeader]}>
              Description
            </Text>
            <Text style={[styles.tableHeaderCell, styles.amountHeader]}>
              Amount
            </Text>
          </View>
          {invoice.items.map((item) => {
            const quantity = Number(item.quantity || 1);
            const lineTotal = Number(item.amount) * quantity;
            return (
              <View key={item.id} style={styles.tableRow}>
                <Text style={[styles.tableCell, styles.descriptionCell]}>
                  {item.description}
                  {quantity > 1 && (
                    <Text style={styles.quantityMeta}> × {quantity}</Text>
                  )}
                </Text>
                <Text style={[styles.tableCell, styles.amountCell]}>
                  {formatCurrency(lineTotal, invoice.currency)}
                  {quantity > 1 && (
                    <Text style={styles.quantityMeta}>
                      {"\n"}
                      {formatCurrency(Number(item.amount), invoice.currency)}
                      {" × " + quantity}
                    </Text>
                  )}
                </Text>
              </View>
            );
          })}
        </View>

        {/* Calculations */}
        <View style={styles.calculations}>
          <View style={styles.calculationRow}>
            <Text style={styles.calculationLabel}>Subtotal</Text>
            <Text style={styles.calculationValue}>
              {formatCurrency(subtotal, invoice.currency)}
            </Text>
          </View>

          {discountAmount > 0 && (
            <View style={styles.calculationRow}>
              <Text style={styles.calculationLabel}>
                Discount{" "}
                {invoice.discountType === "PERCENTAGE"
                  ? `(${invoice.discount}%)`
                  : ""}
              </Text>
              <Text style={[styles.calculationValue, { color: "#dc2626" }]}>
                -{formatCurrency(discountAmount, invoice.currency)}
              </Text>
            </View>
          )}

          {invoice.tax1Rate > 0 && (
            <View style={styles.calculationRow}>
              <Text style={styles.calculationLabel}>
                {invoice.tax1Name || "Tax"} ({invoice.tax1Rate}%)
              </Text>
              <Text style={styles.calculationValue}>
                {formatCurrency(tax1Amount, invoice.currency)}
              </Text>
            </View>
          )}

          {invoice.tax2Rate > 0 && (
            <View style={styles.calculationRow}>
              <Text style={styles.calculationLabel}>
                {invoice.tax2Name || "Tax 2"} ({invoice.tax2Rate}%)
              </Text>
              <Text style={styles.calculationValue}>
                {formatCurrency(tax2Amount, invoice.currency)}
              </Text>
            </View>
          )}

          <View style={styles.totalRow}>
            <Text style={styles.totalLabel}>Total</Text>
            <Text style={styles.totalValue}>
              {formatCurrency(total, invoice.currency)}
            </Text>
          </View>
        </View>

        {/* Notes */}
        {invoice.notes && (
          <View style={styles.notesSection}>
            <Text style={styles.sectionHeader}>NOTES</Text>
            <View style={styles.notesContent}>
              <Text>{invoice.notes}</Text>
            </View>
          </View>
        )}

        {/* Footer */}
        <Text style={styles.footer}>
          Powered by <Text style={{ fontWeight: "bold", color: "#2563eb" }}>gginvoice</Text>
        </Text>
      </Page>
    </Document>
  );
};

export async function generateInvoicePDF(invoice: Invoice) {
  try {
    console.log("Generating PDF for invoice:", invoice.number);
    const { pdf } = await import("@react-pdf/renderer");

    const pdfDoc = pdf(<InvoicePDF invoice={invoice} />);
    const blob = await pdfDoc.toBlob();

    console.log("PDF blob created:", blob.size, "bytes");

    // Create download link
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `invoice-${invoice.number}.pdf`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);

    console.log("PDF download initiated");
  } catch (error) {
    console.error("Error generating PDF:", error);
    throw error;
  }
}
