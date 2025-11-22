"use client";

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
// per-item quantity toggle handled in each InvoiceItem
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Plus, AlertCircle } from "lucide-react";
import { CalculationsPanel } from "./calculations-panel";
import { ClientSection } from "./client-section";
import { InvoiceItem, InvoiceItemData } from "./invoice-item";
import { PaymentMethodsSelector } from "./payment-methods-selector";
import { useInvoiceForm, InitialInvoice } from "@/hooks/use-invoice-form";
import { posthog } from "@/lib/posthog";

 

// InvoiceItemData imported from invoice-item.tsx

const CURRENCIES = [
  { value: "USD", label: "USD - US Dollar", symbol: "$" },
  { value: "EUR", label: "EUR - Euro", symbol: "€" },
  { value: "GBP", label: "GBP - British Pound", symbol: "£" },
  { value: "INR", label: "INR - Indian Rupee", symbol: "₹" },
];

const getCurrencySymbol = (currencyCode: string): string => {
  const currency = CURRENCIES.find(c => c.value === currencyCode);
  return currency?.symbol || "$";
};

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
    paypalConnected,
    isLoadingPaymentProviders,
    validationErrors,
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

  return (
    <div className="max-w-7xl mx-auto sm:px-6 lg:px-8 flex flex-col lg:flex-row gap-6 lg:gap-8">
      {/* Main Form */}
      <div className="flex-1 space-y-4 sm:space-y-6 pb-8">
        {/* Client Section */}
        <div id="client-section">
          <ClientSection
            clients={clients || []}
            selectedClientId={formData.clientId}
            onClientSelect={(clientId) => {
              handleClientSelect(clientId);
            }}
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
            hasError={validationErrors.clientId}
          />
        </div>

        {/* Items Section */}
        <Card>
          <CardHeader>
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
              <div className="flex flex-col">
                <CardTitle>Invoice Items</CardTitle>
                <p className="text-xs text-gray-600 mt-2">
                  Add the items or services you want to bill for. Adjust quantity, price, and description.
                </p>
              </div>
              <div className="flex items-center justify-between sm:justify-start gap-2 sm:gap-3">
                {isFinancialFieldsLocked && (
                  <div className="px-2 py-1 bg-yellow-50 border border-yellow-200 rounded text-xs text-yellow-800 font-medium">
                    🔒 Locked (Invoice Sent)
                  </div>
                )}
                <Button
                  type="button"
                  variant="default"
                  onClick={addItem}
                  disabled={isFinancialFieldsLocked}
                  className="w-auto sm:w-auto"
                >
                  <Plus className="h-4 w-4" />
                  Add Item
                </Button>
              </div>
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
                errors={validationErrors.items?.[item.id]}
              />
            ))}
          </CardContent>
        </Card>
        {/* Options Section */}
        <Card>
          <CardHeader>
            <div className="flex flex-col">
              <CardTitle>Options</CardTitle>
              <p className="text-xs text-gray-600 mt-2">
                Set due date, choose currency, add notes, discounts, or taxes for this invoice.
              </p>
            </div>
          </CardHeader>
          <CardContent className="space-y-6">

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
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
            </div>
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
              <div className="flex flex-wrap items-center gap-2 mt-2">
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
                  className="w-1/2 sm:w-[220px]"
                />
                <div className="flex items-center space-x-1 bg-gray-100 rounded-md p-1 flex-shrink-0">
                  <button
                    type="button"
                    disabled={isFinancialFieldsLocked}
                    onClick={() =>
                      setFormData((prev) => ({
                        ...prev,
                        discountType: "percentage",
                      }))
                    }
                    className={`px-2 sm:px-3 py-1 text-sm rounded transition-colors ${
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
                    className={`px-2 sm:px-3 py-1 text-sm rounded transition-colors ${
                      formData.discountType === "amount"
                        ? "bg-white shadow-sm text-gray-900"
                        : "text-gray-600 hover:text-gray-900"
                    } ${isFinancialFieldsLocked ? "opacity-50 cursor-not-allowed" : ""}`}
                  >
                    {getCurrencySymbol(formData.currency)}
                  </button>
                </div>
              </div>
            </div>

            {/* Tax */}
            <div className="space-y-4">
              <div>
                <Label htmlFor="tax1Name">Sales Tax (optional) {isFinancialFieldsLocked && "🔒"}</Label>
                <div className="flex flex-wrap items-center gap-2 mt-2">
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
                    className="w-full w-1/2 sm:w-[220px]"
                  />
                  <div className="flex items-center gap-2">
                    <Input
                      type="number"
                      placeholder="0.00"
                      step="0.01"
                      disabled={isFinancialFieldsLocked}
                      value={formData.tax1Rate === 0 ? "" : formData.tax1Rate}
                      onChange={(e) =>
                        setFormData((prev) => ({
                          ...prev,
                          tax1Rate: Number(e.target.value) || 0,
                        }))
                      }
                      className="w-24 sm:w-28"
                    />
                    <span className="text-sm text-gray-500">%</span>
                  </div>
                </div>
              </div>
              <div>
                <Label htmlFor="tax2Name">Second Tax (optional) {isFinancialFieldsLocked && "🔒"}</Label>
                <div className="flex flex-wrap items-center gap-2 mt-2">
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
                    className="w-1/2 sm:w-[220px]"
                  />
                  <div className="flex items-center gap-2">
                    <Input
                      type="number"
                      placeholder="0.00"
                      step="0.01"
                      disabled={isFinancialFieldsLocked}
                      value={formData.tax2Rate === 0 ? "" : formData.tax2Rate}
                      onChange={(e) =>
                        setFormData((prev) => ({
                          ...prev,
                          tax2Rate: Number(e.target.value) || 0,
                        }))
                      }
                      className="w-24 sm:w-28"
                    />
                    <span className="text-sm text-gray-500">%</span>
                  </div>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Payment Methods */}
        <Card>
          <CardHeader>
            <div className="flex flex-col">
              <CardTitle>Payment Methods</CardTitle>
              <p className="text-xs text-gray-600 mt-2">
                Choose the payment methods you wish to accept for this invoice. Only enabled and connected payment methods are available.
              </p>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            <PaymentMethodsSelector
              stripeEnabled={formData.acceptCreditCards}
              stripeConnected={stripeConnected}
              paypalEnabled={formData.acceptPaypal}
              paypalConnected={paypalConnected}
              isLoading={isLoadingPaymentProviders}
              onStripeToggle={(enabled) =>
                setFormData((prev) => ({ ...prev, acceptCreditCards: enabled }))
              }
              onPaypalToggle={(enabled) =>
                setFormData((prev) => ({ ...prev, acceptPaypal: enabled }))
              }
              invoiceId={initialInvoice?.id || null}
            />
          </CardContent>
        </Card>

      </div>

      {/* Right Panel - Sticky on desktop, normal on mobile */}
      <div className="w-full lg:w-80 flex flex-col gap-4 lg:sticky lg:top-6 lg:self-start">
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
