"use client";

import { useRouter } from "next/navigation";
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
// per-item quantity toggle handled in each InvoiceItem
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Plus, CreditCard, AlertCircle } from "lucide-react";
import { CalculationsPanel } from "./calculations-panel";
import { ClientSection } from "./client-section";
import { InvoiceItem, InvoiceItemData } from "./invoice-item";
import { useInvoiceForm, InitialInvoice } from "@/hooks/use-invoice-form";
import { posthog } from "@/lib/posthog";

 

// InvoiceItemData imported from invoice-item.tsx

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

interface InvoiceActionsSlotProps {
  onSaveDraft: () => void;
  isSavingDraft: boolean;
  isDraftDirty: boolean;
}

interface InvoiceFormProps {
  initialInvoice?: InitialInvoice;
  isEditing?: boolean;
  invoiceActions?: (props: InvoiceActionsSlotProps) => React.ReactNode;
}

export function InvoiceForm({ initialInvoice, isEditing = false, invoiceActions }: InvoiceFormProps) {
  const {
    formData,
    setFormData,
    isSubmitting,
    showNewClientForm,
    stripeConnected,
    isFinancialFieldsLocked,
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
  } = useInvoiceForm({ initialInvoice, isEditing });
  const router = useRouter();

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex gap-8">
      {/* Main Form */}
      <div className="flex-1 space-y-6 pb-8">
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
            <div className="flex items-center justify-between">
              <CardTitle>Invoice Items</CardTitle>
              <div className="flex items-center gap-3">
                {isFinancialFieldsLocked && (
                  <div className="px-2 py-1 bg-yellow-50 border border-yellow-200 rounded text-xs text-yellow-800 font-medium">
                    🔒 Locked (Invoice Sent)
                  </div>
                )}
              </div>
              <Button
                type="button"
                variant="default"
                onClick={addItem}
                disabled={isFinancialFieldsLocked}
              >
                <Plus className="h-4 w-4" />
                Add Item
              </Button>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            {isFinancialFieldsLocked && (
              <Alert className="border-yellow-200 bg-yellow-50">
                <AlertCircle className="h-4 w-4 text-yellow-600" />
                <AlertDescription className="text-yellow-800">
                  Financial fields are locked because this invoice has been sent. You can only edit notes and due date.
                </AlertDescription>
              </Alert>
            )}
            {formData.items.map((item, index) => (
              <InvoiceItem
                key={item.id}
                item={item}
                index={index}
                onChange={(
                  field: keyof InvoiceItemData,
                  value: string | number | boolean
                ) => handleItemChange(index, field, value)}
                onRemove={() => removeItem(index)}
                onDuplicate={() => duplicateItem(index)}
                canRemove={formData.items.length > 1}
                disabled={isFinancialFieldsLocked}
                showQuantity={item.showQuantity ?? false}
              />
            ))}
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
                <Label htmlFor="dueDate">Due Date</Label>
                <Input
                  id="dueDate"
                  type="date"
                  value={formData.date}
                  onChange={(e) =>
                    setFormData((prev) => ({ ...prev, date: e.target.value }))
                  }
                />
              </div>
              <div className="col-span-1">
                <Label htmlFor="currency">Currency {isFinancialFieldsLocked && "🔒"}</Label>
                <Select
                  value={formData.currency}
                  onValueChange={(value) =>
                    setFormData((prev) => ({ ...prev, currency: value }))
                  }
                  disabled={isFinancialFieldsLocked}
                >
                  <SelectTrigger className="w-full" disabled={isFinancialFieldsLocked}>
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
              <Label htmlFor="discount">Discount (optional) {isFinancialFieldsLocked && "🔒"}</Label>
              <div className="flex items-center space-x-3 mt-2">
                <Input
                  id="discount"
                  type="number"
                  placeholder="0"
                  disabled={isFinancialFieldsLocked}
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
                    disabled={isFinancialFieldsLocked}
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
                    } ${isFinancialFieldsLocked ? "opacity-50 cursor-not-allowed" : ""}`}
                  >
                    %
                  </button>
                  <button
                    type="button"
                    disabled={isFinancialFieldsLocked}
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
                    } ${isFinancialFieldsLocked ? "opacity-50 cursor-not-allowed" : ""}`}
                  >
                    $
                  </button>
                </div>
              </div>
            </div>

            {/* Tax */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="tax1Name">Sales Tax (optional) {isFinancialFieldsLocked && "🔒"}</Label>
                <div className="flex items-center space-x-2 mt-2">
                  <Input
                    id="tax1Name"
                    placeholder="Tax Name (Tax ID)"
                    disabled={isFinancialFieldsLocked}
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
                    disabled={isFinancialFieldsLocked}
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
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="tax2Name">Second Tax (optional) {isFinancialFieldsLocked && "🔒"}</Label>
                <div className="flex items-center space-x-2 mt-2">
                  <Input
                    id="tax2Name"
                    placeholder="Tax Name (Tax ID)"
                    disabled={isFinancialFieldsLocked}
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
                    disabled={isFinancialFieldsLocked}
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
                    onCheckedChange={(checked: boolean) => {
                      // Track Stripe toggle
                      posthog.capture("invoice_stripe_toggled", {
                        enabled: checked,
                        invoiceId: initialInvoice?.id || null,
                      });
                      
                      setFormData((prev) => ({
                        ...prev,
                        acceptCreditCards: checked,
                      }));
                    }}
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
                      onClick={() => {
                        // Track Stripe connect click from invoice form
                        posthog.capture("stripe_connect_clicked", {
                          source: "invoice_form",
                        });
                        router.push("/settings");
                      }}
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

      </div>

      {/* Right Panel - Sticky */}
      <div className="w-80 flex flex-col gap-4 sticky top-6 self-start">
        <CalculationsPanel
          subtotal={calculateSubtotal()}
          discount={calculateDiscount()}
          tax1={calculateTax(formData.tax1Rate)}
          tax2={calculateTax(formData.tax2Rate)}
          total={calculateTotal()}
          currency={formData.currency}
          tax1Name={formData.tax1Name}
          tax2Name={formData.tax2Name}
            items={formData.items.map((it) => ({ description: it.description, amount: Number(it.amount), quantity: Number(it.quantity) || 1 }))}
          discountType={formData.discountType}
          discountValue={formData.discountValue}
          tax1Rate={formData.tax1Rate}
          tax2Rate={formData.tax2Rate}
        />

        {/* Form Actions */}
        {isEditing && invoiceActions ? (
          <Card>
            <CardContent className="space-y-2">
              {invoiceActions({
                onSaveDraft: () => handleSubmit("draft"),
                isSavingDraft: isSubmitting,
                isDraftDirty: isDirty,
              })}
            </CardContent>
          </Card>
        ) : (
          <Card>
            <CardContent className="space-y-2">
                <Button
                  variant="outline"
                  onClick={() => handleSubmit("draft")}
                  disabled={isSubmitting}
                  className="w-full"
                >
                  {isSubmitting ? "Saving..." : isEditing ? "Update" : "Save as Draft"}
                </Button>
                {!isEditing && (
                  <Button
                    onClick={() => handleSubmit("send")}
                    disabled={isSubmitting}
                    className="w-full bg-blue-600 hover:bg-blue-700"
                  >
                    {isSubmitting ? "Creating..." : "Create & Send Invoice"}
                </Button>
              )}
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}
