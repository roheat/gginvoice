"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Plus, CreditCard, AlertCircle } from "lucide-react";
import { CalculationsPanel } from "./calculations-panel";
import { ClientSection } from "./client-section";
import { InvoiceItem } from "./invoice-item";
// import { trpc } from "@/components/providers/trpc-provider";
import { useRouter } from "next/navigation";
import { toast } from "sonner";

interface InvoiceFormData {
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

interface InvoiceItemData {
  id: string;
  description: string;
  amount: number;
}

const CURRENCIES = [
  { value: "USD", label: "USD - US Dollar" },
  { value: "EUR", label: "EUR - Euro" },
  { value: "GBP", label: "GBP - British Pound" },
  { value: "INR", label: "INR - Indian Rupee" },
];

const LANGUAGES = [
  { value: "en", label: "English" },
  { value: "es", label: "Spanish" },
  { value: "fr", label: "French" },
  { value: "de", label: "German" },
];

export function InvoiceForm() {
  const router = useRouter();
  const [formData, setFormData] = useState<InvoiceFormData>({
    clientId: "",
    clientName: "",
    clientEmail: "",
    clientAddress: "",
    invoiceNumber: "",
    date: new Date().toISOString().split("T")[0],
    currency: "USD",
    language: "en",
    items: [{ id: "1", description: "", amount: 0 }],
    notes: "",
    discountType: "percentage",
    discountValue: 0,
    tax1Name: "",
    tax1Rate: 0,
    tax2Name: "",
    tax2Rate: 0,
    acceptCreditCards: false,
  });

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showNewClientForm, setShowNewClientForm] = useState(false);
  const [stripeConnected, setStripeConnected] = useState(false);

  // Direct API calls for all operations
  const [nextInvoiceNumber, setNextInvoiceNumber] = useState("INV-001");

  // Direct API calls for clients
  const [clients, setClients] = useState<
    Array<{
      id: string;
      name: string;
      email: string | null;
      address: string | null;
    }>
  >([]);

  // Set invoice number when available
  useEffect(() => {
    setFormData((prev) => ({ ...prev, invoiceNumber: nextInvoiceNumber }));
  }, [nextInvoiceNumber]);

  // Fetch Stripe connection status
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

  // Fetch clients and invoice number on component mount
  useEffect(() => {
    const fetchData = async () => {
      try {
        // Fetch clients
        const clientsResponse = await fetch("/api/clients");
        const clientsResult = await clientsResponse.json();

        if (clientsResult.success) {
          setClients(clientsResult.clients);
        }

        // Fetch invoice number
        const invoiceResponse = await fetch("/api/invoice-number");
        const invoiceResult = await invoiceResponse.json();

        if (invoiceResult.success) {
          setNextInvoiceNumber(invoiceResult.number);
        }

        // Fetch Stripe status
        await fetchStripeStatus();
      } catch (error) {
        console.error("Failed to fetch data:", error);
      }
    };

    fetchData();
  }, []);

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

      // Refresh clients list
      const refreshResponse = await fetch("/api/clients");
      const refreshResult = await refreshResponse.json();
      if (refreshResult.success) {
        setClients(refreshResult.clients);
      }

      toast.success("Client created successfully");
    } catch (error) {
      console.error("Client creation error:", error);
      toast.error("Failed to create client");
    }
  };

  const handleItemChange = (
    index: number,
    field: keyof InvoiceItemData,
    value: string | number
  ) => {
    const newItems = [...formData.items];
    newItems[index] = { ...newItems[index], [field]: value };
    setFormData((prev) => ({ ...prev, items: newItems }));
  };

  const addItem = () => {
    const newItem: InvoiceItemData = {
      id: Date.now().toString(),
      description: "",
      amount: 0,
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

  const calculateSubtotal = () => {
    return formData.items.reduce((sum, item) => sum + item.amount, 0);
  };

  const calculateDiscount = () => {
    const subtotal = calculateSubtotal();
    if (formData.discountType === "percentage") {
      return (subtotal * formData.discountValue) / 100;
    }
    return formData.discountValue;
  };

  const calculateTax = (rate: number) => {
    const subtotal = calculateSubtotal();
    const discount = calculateDiscount();
    return ((subtotal - discount) * rate) / 100;
  };

  const calculateTotal = () => {
    const subtotal = calculateSubtotal();
    const discount = calculateDiscount();
    const tax1 = calculateTax(formData.tax1Rate);
    const tax2 = calculateTax(formData.tax2Rate);
    return subtotal - discount + tax1 + tax2;
  };

  const handleSubmit = async (action: "draft" | "send") => {
    if (!formData.clientId) {
      toast.error("Please select or create a client");
      return;
    }

    if (formData.items.some((item) => !item.description || item.amount <= 0)) {
      toast.error("Please fill in all item details");
      return;
    }

    setIsSubmitting(true);

    try {
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
          })),
          tax1Name: formData.tax1Name,
          tax1Rate: formData.tax1Rate,
          tax2Name: formData.tax2Name,
          tax2Rate: formData.tax2Rate,
          discountType: formData.discountType,
          discountValue: formData.discountValue,
          acceptCreditCards: formData.acceptCreditCards,
        }),
      });

      const result = await response.json();

      if (!response.ok || !result.success) {
        throw new Error(result.error || "Failed to create invoice");
      }

      toast.success(
        `Invoice ${
          action === "draft" ? "saved as draft" : "created and sent"
        } successfully`
      );
      router.push("/invoices");
    } catch (error) {
      console.error("Invoice creation error:", error);
      toast.error("Failed to create invoice");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
      {/* Main Form */}
      <div className="lg:col-span-2 space-y-6">
        {/* Client Section */}
        <ClientSection
          clients={clients || []}
          selectedClientId={formData.clientId}
          onClientSelect={handleClientSelect}
          showNewClientForm={showNewClientForm}
          newClientData={{
            name: formData.clientName,
            email: formData.clientEmail,
            address: formData.clientAddress,
          }}
          onNewClientChange={(field: string, value: string) =>
            setFormData((prev) => ({ ...prev, [field]: value }))
          }
          onNewClientSubmit={handleNewClientSubmit}
        />

        {/* Items Section */}
        <Card>
          <CardHeader>
            <CardTitle>Invoice Items</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {formData.items.map((item, index) => (
              <InvoiceItem
                key={item.id}
                item={item}
                index={index}
                onChange={(
                  field: keyof InvoiceItemData,
                  value: string | number
                ) => handleItemChange(index, field, value)}
                onRemove={() => removeItem(index)}
                onDuplicate={() => duplicateItem(index)}
                canRemove={formData.items.length > 1}
              />
            ))}
            <Button
              type="button"
              variant="outline"
              onClick={addItem}
              className="w-full"
            >
              <Plus className="h-4 w-4 mr-2" />
              Add Item
            </Button>
          </CardContent>
        </Card>

        {/* Invoice Details */}
        <Card>
          <CardHeader>
            <CardTitle>Invoice Details</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="col-span-1">
                <Label htmlFor="date">Date</Label>
                <Input
                  id="date"
                  type="date"
                  value={formData.date}
                  onChange={(e) =>
                    setFormData((prev) => ({ ...prev, date: e.target.value }))
                  }
                />
              </div>
              <div className="col-span-1">
                <Label htmlFor="currency">Currency</Label>
                <Select
                  value={formData.currency}
                  onValueChange={(value) =>
                    setFormData((prev) => ({ ...prev, currency: value }))
                  }
                >
                  <SelectTrigger className="w-full">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {CURRENCIES.map((currency) => (
                      <SelectItem key={currency.value} value={currency.value}>
                        {currency.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="col-span-1">
                <Label htmlFor="language">Language</Label>
                <Select
                  value={formData.language}
                  onValueChange={(value) =>
                    setFormData((prev) => ({ ...prev, language: value }))
                  }
                >
                  <SelectTrigger className="w-full">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {LANGUAGES.map((language) => (
                      <SelectItem key={language.value} value={language.value}>
                        {language.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Options Section */}
        <Card>
          <CardHeader>
            <CardTitle>Options</CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* Notes */}
            <div>
              <Label htmlFor="notes">Notes</Label>
              <Textarea
                id="notes"
                placeholder="Additional notes for the invoice..."
                value={formData.notes}
                onChange={(e) =>
                  setFormData((prev) => ({ ...prev, notes: e.target.value }))
                }
                rows={3}
              />
            </div>

            {/* Discount */}
            <div>
              <Label htmlFor="discount">Discount (optional)</Label>
              <div className="flex items-center space-x-3 mt-2">
                <Input
                  id="discount"
                  type="number"
                  placeholder="0"
                  value={
                    formData.discountValue === 0 ? "" : formData.discountValue
                  }
                  onChange={(e) =>
                    setFormData((prev) => ({
                      ...prev,
                      discountValue: Number(e.target.value) || 0,
                    }))
                  }
                  className="flex-1"
                />
                <div className="flex items-center space-x-1 bg-gray-100 rounded-md p-1">
                  <button
                    type="button"
                    onClick={() =>
                      setFormData((prev) => ({
                        ...prev,
                        discountType: "percentage",
                      }))
                    }
                    className={`px-3 py-1 text-sm rounded transition-colors ${
                      formData.discountType === "percentage"
                        ? "bg-white shadow-sm text-gray-900"
                        : "text-gray-600 hover:text-gray-900"
                    }`}
                  >
                    %
                  </button>
                  <button
                    type="button"
                    onClick={() =>
                      setFormData((prev) => ({
                        ...prev,
                        discountType: "amount",
                      }))
                    }
                    className={`px-3 py-1 text-sm rounded transition-colors ${
                      formData.discountType === "amount"
                        ? "bg-white shadow-sm text-gray-900"
                        : "text-gray-600 hover:text-gray-900"
                    }`}
                  >
                    $
                  </button>
                </div>
              </div>
            </div>

            {/* Tax */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="tax1Name">Sales Tax (optional)</Label>
                <div className="flex items-center space-x-2 mt-2">
                  <Input
                    id="tax1Name"
                    placeholder="Tax Name (Tax ID)"
                    value={formData.tax1Name}
                    onChange={(e) =>
                      setFormData((prev) => ({
                        ...prev,
                        tax1Name: e.target.value,
                      }))
                    }
                  />
                  <Input
                    type="number"
                    placeholder="0.0000"
                    value={formData.tax1Rate === 0 ? "" : formData.tax1Rate}
                    onChange={(e) =>
                      setFormData((prev) => ({
                        ...prev,
                        tax1Rate: Number(e.target.value) || 0,
                      }))
                    }
                  />
                  <span className="text-sm text-gray-500">%</span>
                </div>
              </div>
              <div>
                <Label htmlFor="tax2Name">Second Tax (optional)</Label>
                <div className="flex items-center space-x-2 mt-2">
                  <Input
                    id="tax2Name"
                    placeholder="Tax Name (Tax ID)"
                    value={formData.tax2Name}
                    onChange={(e) =>
                      setFormData((prev) => ({
                        ...prev,
                        tax2Name: e.target.value,
                      }))
                    }
                  />
                  <Input
                    type="number"
                    placeholder="0.0000"
                    value={formData.tax2Rate === 0 ? "" : formData.tax2Rate}
                    onChange={(e) =>
                      setFormData((prev) => ({
                        ...prev,
                        tax2Rate: Number(e.target.value) || 0,
                      }))
                    }
                  />
                  <span className="text-sm text-gray-500">%</span>
                </div>
              </div>
            </div>

            {/* Payment Methods */}
            <div className="space-y-3">
              <div className="flex items-center space-x-2">
                <Switch
                  id="acceptCreditCards"
                  checked={formData.acceptCreditCards}
                  disabled={!stripeConnected}
                  onCheckedChange={(checked) =>
                    setFormData((prev) => ({
                      ...prev,
                      acceptCreditCards: checked,
                    }))
                  }
                />
                <Label htmlFor="acceptCreditCards">
                  Accept Credit Cards (Stripe)
                </Label>
              </div>

              {!stripeConnected && (
                <Alert>
                  <AlertCircle className="h-4 w-4" />
                  <AlertDescription>
                    <div className="flex items-center justify-between">
                      <span>Connect Stripe in Settings to accept payments</span>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => router.push("/settings/payments")}
                      >
                        <CreditCard className="h-4 w-4 mr-2" />
                        Connect Stripe
                      </Button>
                    </div>
                  </AlertDescription>
                </Alert>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Form Actions */}
        <div className="flex justify-end space-x-4 pb-8">
          <Button
            variant="outline"
            onClick={() => handleSubmit("draft")}
            disabled={isSubmitting}
          >
            {isSubmitting ? "Saving..." : "Save as Draft"}
          </Button>
          <Button
            onClick={() => handleSubmit("send")}
            disabled={isSubmitting}
            className="bg-blue-600 hover:bg-blue-700"
          >
            {isSubmitting ? "Creating..." : "Create & Send Invoice"}
          </Button>
        </div>
      </div>

      {/* Calculations Panel */}
      <div className="lg:col-span-1">
        <CalculationsPanel
          subtotal={calculateSubtotal()}
          discount={calculateDiscount()}
          tax1={calculateTax(formData.tax1Rate)}
          tax2={calculateTax(formData.tax2Rate)}
          total={calculateTotal()}
          currency={formData.currency}
          tax1Name={formData.tax1Name}
          tax2Name={formData.tax2Name}
        />
      </div>
    </div>
  );
}
