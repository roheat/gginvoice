import React from "react";
import { Document, Page, Text, StyleSheet } from "@react-pdf/renderer";

const styles = StyleSheet.create({
  page: {
    flexDirection: "column",
    backgroundColor: "#ffffff",
    padding: 30,
    fontFamily: "Helvetica",
  },
  title: {
    fontSize: 24,
    fontWeight: "bold",
    color: "#000000",
    marginBottom: 20,
  },
  text: {
    fontSize: 12,
    color: "#000000",
    marginBottom: 10,
  },
});

const TestPDF = () => {
  return (
    <Document>
      <Page size="A4" style={styles.page}>
        <Text style={styles.title}>Test PDF</Text>
        <Text style={styles.text}>
          This is a test PDF to verify text visibility.
        </Text>
        <Text style={styles.text}>
          If you can see this text, the PDF generation is working.
        </Text>
        <Text style={styles.text}>Invoice Number: TEST-001</Text>
        <Text style={styles.text}>Total: $100.00</Text>
      </Page>
    </Document>
  );
};

export async function generateTestPDF() {
  try {
    console.log("Generating test PDF...");
    const { pdf } = await import("@react-pdf/renderer");

    const pdfDoc = pdf(<TestPDF />);
    const blob = await pdfDoc.toBlob();

    console.log("Test PDF blob created:", blob.size, "bytes");

    // Create download link
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = "test-invoice.pdf";
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);

    console.log("Test PDF download initiated");
  } catch (error) {
    console.error("Error generating test PDF:", error);
    throw error;
  }
}
