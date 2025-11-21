"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { InvoiceItemData } from "@/components/invoices/invoice-item";
import { calculateInvoice } from "@/lib/invoice-calculations";
import { posthog } from "@/lib/posthog";

export interface InitialInvoice {
  clientId?: string;
  client?: { name?: string; email?: string | null; address?: string | null };
  number?: string;
  date?: string;
  currency?: string;
  id?: string;
  items?: Array<{ id?: string; description?: string; amount?: number | string; quantity?: number }>;
  notes?: string | null;
  discountType?: string;
  discount?: number;
  discountValue?: number;
  subtotal?: number;
  tax1Name?: string | null;
  tax1Rate?: number;
  tax2Name?: string | null;
  tax2Rate?: number;
  acceptPayments?: boolean;
  status?: string;
  deleted?: boolean;
}

export interface InvoiceFormData {
  clientId: string;
  clientName: string;
  clientEmail: string;
  clientAddress: string;
  invoiceNumber: string;
  date: string;
  currency: string;
  language: string;
  items: InvoiceItemData[];
  notes: string;
  discountType: "percentage" | "amount";
  discountValue: number;
  tax1Name: string;
  tax1Rate: number;
  tax2Name: string;
  tax2Rate: number;
  acceptCreditCards: boolean;
}

type UseInvoiceFormArgs = {
  initialInvoice?: InitialInvoice;
  isEditing?: boolean;
};

export function useInvoiceForm({ initialInvoice, isEditing = false }: UseInvoiceFormArgs) {
  const router = useRouter();

  const getInitialFormData = (): InvoiceFormData => {
    if (initialInvoice) {
      return {
        clientId: initialInvoice.clientId || "",
        clientName: initialInvoice.client?.name || "",
        clientEmail: initialInvoice.client?.email || "",
        clientAddress: initialInvoice.client?.address || "",
        invoiceNumber: initialInvoice.number || "",
        date:
          typeof initialInvoice.date === "string"
            ? initialInvoice.date.split("T")[0]
            : new Date().toISOString().split("T")[0],
        currency: initialInvoice.currency || "USD",
        language: "en",
        items: initialInvoice.items
          ? initialInvoice.items.map((it: { id?: string; description?: string; amount?: number | string; quantity?: number }) => ({
              id: it.id || Date.now().toString(),
              description: it.description || "",
              amount: Number(it.amount) || 0,
              quantity: it.quantity || 1,
              showQuantity: Boolean(it.quantity && it.quantity > 1),
            }))
          : [{ id: "1", description: "", amount: 0, quantity: 1, showQuantity: false }],
        notes: initialInvoice.notes || "",
        discountType: (initialInvoice.discountType || "percentage").toLowerCase() as "percentage" | "amount",
        discountValue: initialInvoice.discountValue || 0,
        tax1Name: initialInvoice.tax1Name || "",
        tax1Rate: initialInvoice.tax1Rate || 0,
        tax2Name: initialInvoice.tax2Name || "",
        tax2Rate: initialInvoice.tax2Rate || 0,
        acceptCreditCards: initialInvoice.acceptPayments || false,
      };
    }
    return {
      clientId: "",
      clientName: "",
      clientEmail: "",
      clientAddress: "",
      invoiceNumber: "",
      date: new Date().toISOString().split("T")[0],
      currency: "USD",
      language: "en",
      items: [{ id: "1", description: "", amount: 0, quantity: 1 }],
      notes: "",
      discountType: "percentage",
      discountValue: 0,
      tax1Name: "",
      tax1Rate: 0,
      tax2Name: "",
      tax2Rate: 0,
      acceptCreditCards: false,
    };
  };

  const [formData, setFormData] = useState<InvoiceFormData>(getInitialFormData());
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showNewClientForm, setShowNewClientForm] = useState(false);
  const [stripeConnected, setStripeConnected] = useState(false);
  const isFinancialFieldsLocked = Boolean(isEditing && initialInvoice && initialInvoice.deleted);
  const [nextInvoiceNumber, setNextInvoiceNumber] = useState("INV-001");
  const [clients, setClients] = useState<
    Array<{
      id: string;
      name: string;
      email: string | null;
      address: string | null;
    }>
  >([]);

  useEffect(() => {
    if (!isEditing) {
      setFormData((prev) => ({ ...prev, invoiceNumber: nextInvoiceNumber }));
    }
  }, [nextInvoiceNumber, isEditing]);

  const fetchStripeStatus = async () => {
    try {
      const response = await fetch("/api/stripe/status");
      const data = await response.json();
      if (data.success) {
        setStripeConnected(data.connected);
      }
    } catch (error) {
      console.error("Error fetching Stripe status:", error);
    }
  };

  useEffect(() => {
    const fetchData = async () => {
      try {
        const clientsResponse = await fetch("/api/clients");
        const clientsResult = await clientsResponse.json();
        if (clientsResult.success) {
          setClients(clientsResult.clients);
        }

        if (!isEditing) {
          const invoiceResponse = await fetch("/api/invoice-number");
          const invoiceResult = await invoiceResponse.json();
          if (invoiceResult.success) {
            setNextInvoiceNumber(invoiceResult.number);
          }
        }

        await fetchStripeStatus();
      } catch (error) {
        console.error("Failed to fetch data:", error);
      }
    };

    fetchData();
  }, [isEditing]);

  const handleClientSelect = (clientId: string) => {
    if (clientId === "new") {
      setShowNewClientForm(true);
      setFormData((prev) => ({ ...prev, clientId: "" }));
    } else {
      setShowNewClientForm(false);
      const client = clients?.find((c) => c.id === clientId);
      if (client) {
        setFormData((prev) => ({
          ...prev,
          clientId: client.id,
          clientName: client.name,
          clientEmail: client.email || "",
          clientAddress: client.address || "",
        }));
      }
    }
  };

  const handleNewClientSubmit = async () => {
    if (!formData.clientName || !formData.clientEmail) {
      toast.error("Please fill in all required client fields");
      return;
    }

    try {
      const response = await fetch("/api/clients", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          name: formData.clientName,
          email: formData.clientEmail,
          address: formData.clientAddress,
        }),
      });

      const result = await response.json();
      if (!response.ok || !result.success) {
        throw new Error(result.error || "Failed to create client");
      }

      setFormData((prev) => ({ ...prev, clientId: result.client.id }));
      setShowNewClientForm(false);

      const refreshResponse = await fetch("/api/clients");
      const refreshResult = await refreshResponse.json();
      if (refreshResult.success) {
        setClients(refreshResult.clients);
      }

      // Track client creation from invoice form
      posthog.capture("client_created_from_invoice", {
        source: "invoice_form",
      });

      toast.success("Client created successfully");
    } catch (error) {
      console.error("Client creation error:", error);
      toast.error("Failed to create client");
    }
  };

  const handleItemChange = (
    index: number,
    field: keyof InvoiceItemData,
    value: string | number | boolean
  ) => {
    const newItems = [...formData.items];
    newItems[index] = { ...newItems[index], [field]: value };

    // If the per-item quantity toggle was turned off, reset quantity to 1
    if (field === "showQuantity" && value === false) {
      newItems[index] = { ...newItems[index], quantity: 1, showQuantity: false };
    }

    setFormData((prev) => ({ ...prev, items: newItems }));
  };

  // Compute a lightweight "dirty" flag comparing current form to initialInvoice
  const isInvoiceDifferent = (): boolean => {
    if (!initialInvoice) return true; // creating new invoice -> consider dirty

    const normalizeInvoice = (inv?: InitialInvoice) => ({
      date: inv?.date ? (typeof inv.date === "string" ? inv.date.split("T")[0] : new Date(inv.date).toISOString().split("T")[0]) : "",
      notes: inv?.notes || "",
      currency: inv?.currency || "USD",
      tax1Name: inv?.tax1Name || "",
      tax1Rate: inv?.tax1Rate || 0,
      tax2Name: inv?.tax2Name || "",
      tax2Rate: inv?.tax2Rate || 0,
      discountType: (inv?.discountType || "percentage").toLowerCase(),
      discountValue: inv?.discount || 0,
      acceptPayments: !!inv?.acceptPayments,
      items: (inv?.items || []).map((it: { id?: string; description?: string; amount?: number | string; quantity?: number }) => ({
        description: it.description || "",
        amount: Number(it.amount || 0),
        quantity: Number(it.quantity || 1),
      })),
    });

    const initialNorm = normalizeInvoice(initialInvoice);
    const currentNorm = {
      date: formData.date || "",
      notes: formData.notes || "",
      currency: formData.currency || "USD",
      tax1Name: formData.tax1Name || "",
      tax1Rate: formData.tax1Rate || 0,
      tax2Name: formData.tax2Name || "",
      tax2Rate: formData.tax2Rate || 0,
      discountType: (formData.discountType || "percentage").toLowerCase(),
      discountValue: formData.discountValue || 0,
      acceptPayments: !!formData.acceptCreditCards,
      items: (formData.items || []).map((it) => ({
        description: it.description || "",
        amount: Number(it.amount || 0),
        quantity: Number(it.quantity || 1),
      })),
    };

    return JSON.stringify(initialNorm) !== JSON.stringify(currentNorm);
  };

  const isDirty = isInvoiceDifferent();

  const addItem = () => {
    const newItem: InvoiceItemData = {
      id: Date.now().toString(),
      description: "",
      amount: 0,
      quantity: 1,
      showQuantity: false,
    };
    setFormData((prev) => ({ ...prev, items: [...prev.items, newItem] }));
  };

  const removeItem = (index: number) => {
    if (formData.items.length > 1) {
      const newItems = formData.items.filter((_, i) => i !== index);
      setFormData((prev) => ({ ...prev, items: newItems }));
    }
  };

  const duplicateItem = (index: number) => {
    const itemToDuplicate = formData.items[index];
    const newItem: InvoiceItemData = {
      ...itemToDuplicate,
      id: Date.now().toString(),
    };
    const newItems = [...formData.items];
    newItems.splice(index + 1, 0, newItem);
    setFormData((prev) => ({ ...prev, items: newItems }));
  };

  // Use shared calculation logic for all financial calculations
  const getCalculation = () => {
    return calculateInvoice(
      formData.items.map((item) => ({
        amount: Number(item.amount),
        quantity: Number(item.quantity || 1),
      })),
      {
        type: formData.discountType,
        value: formData.discountValue,
      },
      {
        tax1Rate: formData.tax1Rate,
        tax2Rate: formData.tax2Rate,
      }
    );
  };

  const calculateSubtotal = () => getCalculation().subtotal;
  const calculateDiscount = () => getCalculation().discount;
  const calculateTax = (rate: number) => {
    const calc = getCalculation();
    return rate === formData.tax1Rate ? calc.tax1 : calc.tax2;
  };
  const calculateTotal = () => getCalculation().total;

  const handleSubmit = async (action: "draft" | "send") => {
    if (!formData.clientId) {
      toast.error("Please select or create a client");
      return;
    }

    if (!isFinancialFieldsLocked && formData.items.some((item) => !item.description || item.amount <= 0)) {
      toast.error("Please fill in all item details");
      return;
    }

    setIsSubmitting(true);
    try {
      if (isEditing && initialInvoice) {
        const response = await fetch(`/api/invoice/${initialInvoice.id}`, {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            notes: formData.notes,
            dueDate: formData.date,
            ...(isFinancialFieldsLocked
              ? {}
              : {
                  items: formData.items.map((item) => ({
                    description: item.description,
                    amount: item.amount,
                    quantity: item.quantity || 1,
                  })),
                  tax1Name: formData.tax1Name,
                  tax1Rate: formData.tax1Rate,
                  tax2Name: formData.tax2Name,
                  tax2Rate: formData.tax2Rate,
                  discountType: formData.discountType.toUpperCase(),
                  discountValue: formData.discountValue,
                }),
            acceptCreditCards: formData.acceptCreditCards,
          }),
        });

        const result = await response.json();
        if (!response.ok || !result.success) {
          throw new Error(result.error || "Failed to update invoice");
        }

        // Track invoice update
        posthog.capture("invoice_updated", {
          invoiceId: initialInvoice.id,
        });

        toast.success("Invoice updated successfully");
        router.push("/invoices");
      } else {
        const response = await fetch("/api/invoice", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            clientId: formData.clientId,
            number: formData.invoiceNumber,
            date: formData.date,
            notes: formData.notes,
            items: formData.items.map((item) => ({
              description: item.description,
              amount: item.amount,
              quantity: item.quantity || 1,
            })),
            tax1Name: formData.tax1Name,
            tax1Rate: formData.tax1Rate,
            tax2Name: formData.tax2Name,
            tax2Rate: formData.tax2Rate,
            discountType: formData.discountType.toUpperCase(),
            discountValue: formData.discountValue,
            acceptCreditCards: formData.acceptCreditCards,
          }),
        });

        const result = await response.json();
        if (!response.ok || !result.success) {
          throw new Error(result.error || "Failed to create invoice");
        }

        // Track invoice creation
        if (action === "draft") {
          posthog.capture("invoice_saved_as_draft", {
            action: "draft",
          });
        }

        // If the user chose "send", call the sendInvoice mutation to transition and email the invoice.
        if (action === "send") {
          posthog.capture("invoice_saved_as_draft_and_sent", {
            action: "send",
          });
          try {
            const sendResponse = await fetch("/api/trpc/invoice.sendInvoice", {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({ id: result.invoice.id }),
            });

            const sendData = await sendResponse.json();
            if (!sendResponse.ok || sendData.error) {
              console.error("Failed to send invoice:", sendData);
              toast.error("Invoice created but failed to send");
              router.push("/invoices");
              return;
            }
          } catch (err) {
            console.error("Error sending invoice:", err);
            toast.error("Invoice created but failed to send");
            router.push("/invoices");
            return;
          }
        }

        toast.success(`Invoice ${action === "draft" ? "saved as draft" : "created and sent"} successfully`);
        
        // Check if coming from onboarding
        const urlParams = new URLSearchParams(window.location.search);
        const fromOnboarding = urlParams.get("onboarding") === "true";
        
        if (fromOnboarding) {
          // Redirect back to onboarding to complete the flow
          router.push("/onboarding?invoice_created=true");
        } else {
          router.push("/invoices");
        }
      }
    } catch (error) {
      console.error("Invoice operation error:", error);
      toast.error(isEditing ? "Failed to update invoice" : "Failed to create invoice");
    } finally {
      setIsSubmitting(false);
    }
  };

  return {
    formData,
    setFormData,
    isSubmitting,
    showNewClientForm,
    stripeConnected,
    isFinancialFieldsLocked,
    nextInvoiceNumber,
    clients,
    addItem,
    removeItem,
    duplicateItem,
    handleItemChange,
    isDirty,
    calculateSubtotal,
    calculateDiscount,
    calculateTax,
    calculateTotal,
    handleSubmit,
    handleClientSelect,
    handleNewClientSubmit,
  };
}


