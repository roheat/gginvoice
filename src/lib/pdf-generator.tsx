import React from "react";
import { Document, Page, Text, View, StyleSheet } from "@react-pdf/renderer";

// Use default fonts for better compatibility
// Font.register({
//   family: "Inter",
//   src: "https://fonts.gstatic.com/s/inter/v12/UcCO3FwrK3iLTeHuS_fvQtMwCp50KnMw2boKoduKmMEVuLyfAZ9hiJ-Ek-_EeA.woff2",
// });

const styles = StyleSheet.create({
  page: {
    flexDirection: "column",
    backgroundColor: "#ffffff",
    padding: 30,
    fontFamily: "Helvetica",
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 30,
  },
  companyInfo: {
    flexDirection: "column",
  },
  companyName: {
    fontSize: 24,
    fontWeight: "bold",
    color: "#000000",
    marginBottom: 8,
  },
  companyEmail: {
    fontSize: 12,
    color: "#333333",
  },
  invoiceDetails: {
    flexDirection: "column",
    alignItems: "flex-end",
  },
  invoiceTitle: {
    fontSize: 20,
    fontWeight: "bold",
    color: "#000000",
    marginBottom: 8,
  },
  invoiceNumber: {
    fontSize: 12,
    color: "#333333",
    marginBottom: 4,
  },
  invoiceDate: {
    fontSize: 12,
    color: "#333333",
  },
  statusBadge: {
    backgroundColor: "#3b82f6",
    color: "#ffffff",
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 4,
    fontSize: 10,
    fontWeight: "bold",
    marginTop: 8,
  },
  billToSection: {
    marginBottom: 30,
  },
  billToTitle: {
    fontSize: 16,
    fontWeight: "bold",
    color: "#000000",
    marginBottom: 12,
  },
  billToInfo: {
    backgroundColor: "#f9fafb",
    padding: 16,
    borderRadius: 8,
  },
  clientName: {
    fontSize: 14,
    fontWeight: "bold",
    color: "#000000",
    marginBottom: 4,
  },
  clientDetails: {
    fontSize: 12,
    color: "#333333",
    marginBottom: 2,
  },
  itemsTable: {
    marginBottom: 30,
  },
  tableHeader: {
    flexDirection: "row",
    backgroundColor: "#f3f4f6",
    borderBottomWidth: 1,
    borderBottomColor: "#d1d5db",
  },
  tableHeaderCell: {
    padding: 12,
    fontSize: 12,
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
    borderBottomWidth: 1,
    borderBottomColor: "#e5e7eb",
  },
  tableRowEven: {
    backgroundColor: "#f9fafb",
  },
  tableCell: {
    padding: 12,
    fontSize: 12,
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
  calculations: {
    alignSelf: "flex-end",
    width: 200,
    marginBottom: 30,
  },
  calculationRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 4,
  },
  calculationLabel: {
    fontSize: 12,
    color: "#333333",
  },
  calculationValue: {
    fontSize: 12,
    fontWeight: "bold",
    color: "#000000",
  },
  totalRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    borderTopWidth: 1,
    borderTopColor: "#d1d5db",
    paddingTop: 8,
    marginTop: 8,
  },
  totalLabel: {
    fontSize: 16,
    fontWeight: "bold",
    color: "#000000",
  },
  totalValue: {
    fontSize: 16,
    fontWeight: "bold",
    color: "#0000ff",
  },
  notesSection: {
    marginBottom: 30,
  },
  notesTitle: {
    fontSize: 16,
    fontWeight: "bold",
    color: "#000000",
    marginBottom: 8,
  },
  notesContent: {
    backgroundColor: "#f9fafb",
    padding: 16,
    borderRadius: 8,
    fontSize: 12,
    color: "#000000",
  },
  footer: {
    position: "absolute",
    bottom: 30,
    left: 30,
    right: 30,
    textAlign: "center",
    fontSize: 10,
    color: "#333333",
  },
});

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
  client: Client;
  user: User;
  items: InvoiceItem[];
  createdAt: string;
}

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
    <Document>
      <Page size="A4" style={styles.page}>
        {/* Header */}
        <View style={styles.header}>
          <View style={styles.companyInfo}>
            <Text style={styles.companyName}>
              {invoice.user.company || invoice.user.name || "Company Name"}
            </Text>
            {invoice.user.email && (
              <Text style={styles.companyEmail}>{invoice.user.email}</Text>
            )}
          </View>
          <View style={styles.invoiceDetails}>
            <Text style={styles.invoiceTitle}>INVOICE</Text>
            <Text style={styles.invoiceNumber}>#{invoice.number}</Text>
            <Text style={styles.invoiceDate}>
              Date: {formatDate(invoice.date)}
            </Text>
            {invoice.dueDate && (
              <Text style={styles.invoiceDate}>
                Due: {formatDate(invoice.dueDate)}
              </Text>
            )}
            <Text style={styles.statusBadge}>
              {invoice.status.toUpperCase()}
            </Text>
          </View>
        </View>

        {/* Bill To Section */}
        <View style={styles.billToSection}>
          <Text style={styles.billToTitle}>Bill To</Text>
          <View style={styles.billToInfo}>
            <Text style={styles.clientName}>{invoice.client.name}</Text>
            {invoice.client.email && (
              <Text style={styles.clientDetails}>{invoice.client.email}</Text>
            )}
            {invoice.client.phone && (
              <Text style={styles.clientDetails}>{invoice.client.phone}</Text>
            )}
            {invoice.client.address && (
              <Text style={styles.clientDetails}>{invoice.client.address}</Text>
            )}
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
          {invoice.items.map((item, index) => (
            <View
              key={item.id}
              style={[
                styles.tableRow,
                index % 2 === 0 ? styles.tableRowEven : {},
              ]}
            >
              <Text style={[styles.tableCell, styles.descriptionCell]}>
                {item.description}
              </Text>
              <Text style={[styles.tableCell, styles.amountCell]}>
                {formatCurrency(Number(item.amount), invoice.currency)}
              </Text>
            </View>
          ))}
        </View>

        {/* Calculations */}
        <View style={styles.calculations}>
          <View style={styles.calculationRow}>
            <Text style={styles.calculationLabel}>Subtotal:</Text>
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
                :
              </Text>
              <Text style={[styles.calculationValue, { color: "#ff0000" }]}>
                -{formatCurrency(discountAmount, invoice.currency)}
              </Text>
            </View>
          )}

          {invoice.tax1Rate > 0 && (
            <View style={styles.calculationRow}>
              <Text style={styles.calculationLabel}>
                {invoice.tax1Name || "Tax"} ({invoice.tax1Rate}%):
              </Text>
              <Text style={styles.calculationValue}>
                {formatCurrency(tax1Amount, invoice.currency)}
              </Text>
            </View>
          )}

          {invoice.tax2Rate > 0 && (
            <View style={styles.calculationRow}>
              <Text style={styles.calculationLabel}>
                {invoice.tax2Name || "Tax 2"} ({invoice.tax2Rate}%):
              </Text>
              <Text style={styles.calculationValue}>
                {formatCurrency(tax2Amount, invoice.currency)}
              </Text>
            </View>
          )}

          <View style={styles.totalRow}>
            <Text style={styles.totalLabel}>Total:</Text>
            <Text style={styles.totalValue}>
              {formatCurrency(total, invoice.currency)}
            </Text>
          </View>
        </View>

        {/* Notes */}
        {invoice.notes && (
          <View style={styles.notesSection}>
            <Text style={styles.notesTitle}>Notes</Text>
            <View style={styles.notesContent}>
              <Text>{invoice.notes}</Text>
            </View>
          </View>
        )}

        {/* Footer */}
        <Text style={styles.footer}>Powered by gginvoice</Text>
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
