"use client";

import { useState, type ReactNode } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Send,
  CheckCircle2,
  RefreshCw,
  Trash2,
  AlertCircle,
  X,
  Eye,
  Link as LinkIcon,
} from "lucide-react";
import { toast } from "sonner";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Card } from "@/components/ui/card";
import { posthog } from "@/lib/posthog";

interface Invoice {
  id: string;
  status: string;
  deleted: boolean;
  total: number;
  currency: string;
}

interface InvoiceActionsProps {
  invoice: Invoice;
  onActionSuccess: () => void;
  onSaveDraft?: () => void;
  isSavingDraft?: boolean;
  isDraftDirty?: boolean;
}

type ModalType = null | "send" | "pay" | "refund" | "delete";

export function InvoiceActions({
  invoice,
  onActionSuccess,
  onSaveDraft,
  isSavingDraft,
  isDraftDirty,
}: InvoiceActionsProps) {
  const [isLoading, setIsLoading] = useState(false);
  const [activeModal, setActiveModal] = useState<ModalType>(null);

  // Form state for dialogs
  const [paymentRef, setPaymentRef] = useState("");
  const [paymentNotes, setPaymentNotes] = useState("");
  const [refundRef, setRefundRef] = useState("");
  const [refundNotes, setRefundNotes] = useState("");

  // Determine available actions based on status
  const status = (invoice.status || "").toUpperCase();
  const isDeleted = invoice.deleted;

  // Send only when draft
  const canSend = status === "DRAFT" && !isDeleted;
  // Per rules:
  // - Do not show Mark as Paid / Refund until invoice is SENT
  // - If status is SENT => show Mark as Paid
  // - If status is PAID => show Refund
  // - If status is REFUNDED => show Mark as Paid (allow un-refunding)
  const canMarkPaid = !isDeleted && (status === "SENT" || status === "REFUNDED");
  const canRefund = !isDeleted && status === "PAID";
  const canDelete = !isDeleted;
  const canRestore = isDeleted;

  const closeModal = () => {
    setActiveModal(null);
    setPaymentRef("");
    setPaymentNotes("");
    setRefundRef("");
    setRefundNotes("");
  };
  const isSavingDraftState = isSavingDraft ?? false;
  const isDraftDirtyState = isDraftDirty ?? true;
  const showDraftButton = Boolean(onSaveDraft);
  const draftButtonDisabled = isSavingDraftState || !isDraftDirtyState || isLoading;

  const handleSend = async () => {
    if (!canSend) return;

    setIsLoading(true);
    try {
      const response = await fetch("/api/trpc/invoice.sendInvoice", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id: invoice.id }),
      });

      const data = await response.json();

      if (!response.ok || data.error) {
        throw new Error(data.error?.message || "Failed to send invoice");
      }

      // Track invoice sent
      posthog.capture("invoice_sent", {
        invoiceId: invoice.id,
      });

      toast.success("Invoice sent successfully!");
      closeModal();
      onActionSuccess();
    } catch (error) {
      console.error("Error sending invoice:", error);
      toast.error(error instanceof Error ? error.message : "Failed to send invoice");
    } finally {
      setIsLoading(false);
    }
  };

  const handleMarkPaid = async () => {
    if (!canMarkPaid || !paymentRef.trim()) {
      toast.error("Please enter a payment reference");
      return;
    }

    setIsLoading(true);
    try {
      const response = await fetch("/api/trpc/invoice.markInvoicePaid", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          id: invoice.id,
          paymentRef: paymentRef.trim(),
          notes: paymentNotes || undefined,
        }),
      });

      const data = await response.json();

      if (!response.ok || data.error) {
        throw new Error(data.error?.message || "Failed to mark invoice as paid");
      }

      // Track invoice marked as paid
      posthog.capture("invoice_marked_as_paid", {
        invoiceId: invoice.id,
      });

      toast.success("Invoice marked as paid!");
      closeModal();
      onActionSuccess();
    } catch (error) {
      console.error("Error marking invoice as paid:", error);
      toast.error(error instanceof Error ? error.message : "Failed to mark invoice as paid");
    } finally {
      setIsLoading(false);
    }
  };

  const handleRefund = async () => {
    if (!canRefund || !refundRef.trim()) {
      toast.error("Please enter a refund reference");
      return;
    }

    setIsLoading(true);
    try {
      const response = await fetch("/api/trpc/invoice.refundInvoice", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          id: invoice.id,
          refundRef: refundRef.trim(),
          notes: refundNotes || undefined,
        }),
      });

      const data = await response.json();

      if (!response.ok || data.error) {
        throw new Error(data.error?.message || "Failed to refund invoice");
      }

      // Track invoice refunded
      posthog.capture("invoice_refunded", {
        invoiceId: invoice.id,
      });

      toast.success("Invoice refunded successfully!");
      closeModal();
      onActionSuccess();
    } catch (error) {
      console.error("Error refunding invoice:", error);
      toast.error(error instanceof Error ? error.message : "Failed to refund invoice");
    } finally {
      setIsLoading(false);
    }
  };

  const handleDelete = async () => {
    if (!canDelete) return;

    setIsLoading(true);
    try {
      const response = await fetch("/api/trpc/invoice.softDeleteInvoice", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id: invoice.id }),
      });

      const data = await response.json();

      if (!response.ok || data.error) {
        throw new Error(data.error?.message || "Failed to delete invoice");
      }

      // Track invoice deleted
      posthog.capture("invoice_deleted", {
        invoiceId: invoice.id,
      });

      toast.success("Invoice deleted successfully!");
      closeModal();
      onActionSuccess();
    } catch (error) {
      console.error("Error deleting invoice:", error);
      toast.error(error instanceof Error ? error.message : "Failed to delete invoice");
    } finally {
      setIsLoading(false);
    }
  };

  const handleRestore = async () => {
    if (!canRestore) return;

    setIsLoading(true);
    try {
      const response = await fetch("/api/trpc/invoice.restoreInvoice", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id: invoice.id }),
      });

      const data = await response.json();

      if (!response.ok || data.error) {
        throw new Error(data.error?.message || "Failed to restore invoice");
      }

      // Track invoice restored
      posthog.capture("invoice_restored", {
        invoiceId: invoice.id,
      });

      toast.success("Invoice restored successfully!");
      onActionSuccess();
    } catch (error) {
      console.error("Error restoring invoice:", error);
      toast.error(error instanceof Error ? error.message : "Failed to restore invoice");
    } finally {
      setIsLoading(false);
    }
  };

  const handleViewInvoice = () => {
    const publicUrl = `/invoices/public/${invoice.id}`;
    window.open(publicUrl, "_blank");
    posthog.capture("invoice_viewed_from_edit", {
      invoiceId: invoice.id,
    });
  };

  const handleCopyLink = async () => {
    const baseUrl = window.location.origin;
    const publicUrl = `${baseUrl}/invoices/public/${invoice.id}`;
    
    try {
      await navigator.clipboard.writeText(publicUrl);
      toast.success("Invoice link copied to clipboard!");
      posthog.capture("invoice_link_copied", {
        invoiceId: invoice.id,
      });
    } catch (error) {
      console.error("Failed to copy link:", error);
      toast.error("Failed to copy link");
    }
  };

  if (invoice.deleted) {
    return (
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2">
        <Alert className="bg-red-50 border-red-200 flex-1">
          <AlertCircle className="h-4 w-4 text-red-600" />
          <AlertDescription className="text-red-800">
            This invoice is deleted
          </AlertDescription>
        </Alert>
        <Button
          onClick={handleRestore}
          disabled={isLoading}
          variant="outline"
          className="whitespace-nowrap"
        >
          <RefreshCw className="h-4 w-4" />
          {isLoading ? "Restoring..." : "Restore"}
        </Button>
      </div>
    );
  }

  return (
    <>
      <div className="flex flex-col gap-2">
        {/* View Invoice and Copy Link - Always available when editing */}
        <div className="flex flex-col gap-2 pb-2 border-b">
          <Button
            onClick={handleViewInvoice}
            variant="outline"
            className="w-full border-gray-200 text-gray-700 hover:bg-gray-50"
          >
            <Eye className="h-4 w-4 mr-2" />
            View Invoice
          </Button>
          <Button
            onClick={handleCopyLink}
            variant="outline"
            className="w-full border-gray-200 text-gray-700 hover:bg-gray-50"
          >
            <LinkIcon className="h-4 w-4 mr-2" />
            Copy Link
          </Button>
        </div>

        {/* Save Draft Button */}
        {showDraftButton && onSaveDraft && (
          <Button
            variant="default"
            onClick={onSaveDraft}
            disabled={draftButtonDisabled}
            className="w-full"
          >
            {isSavingDraftState ? "Saving..." : "Update"}
          </Button>
        )}
        {/* Send Invoice */}
        {canSend && (
          <Button
            onClick={() => setActiveModal("send")}
            variant="outline"
            className="w-full bg-blue-600 hover:bg-blue-700 text-black border-blue-600"
            disabled={isLoading}
          >
            <Send className="h-4 w-4" />
            Send Invoice
          </Button>
        )}

        {/* Mark as Paid */}
        {canMarkPaid && (
          <Button
            onClick={() => setActiveModal("pay")}
            variant="outline"
            className="w-full border-green-200 text-green-700 hover:bg-green-50"
            disabled={isLoading}
          >
            <CheckCircle2 className="h-4 w-4" />
            Mark as Paid
          </Button>
        )}

        {/* Refund Invoice */}
        {canRefund && (
          <Button
            onClick={() => setActiveModal("refund")}
            variant="outline"
            className="w-full border-amber-200 text-amber-700 hover:bg-amber-50"
            disabled={isLoading}
          >
            <RefreshCw className="h-4 w-4" />
            Refund
          </Button>
        )}

        {/* Delete Invoice */}
        {canDelete && (
          <Button
            onClick={() => setActiveModal("delete")}
            variant="outline"
            className="w-full border-red-200 text-red-700 hover:bg-red-50"
            disabled={isLoading}
          >
            <Trash2 className="h-4 w-4" />
            Delete
          </Button>
        )}
      </div>

      {/* Send Modal */}
      {activeModal === "send" && (
        <InvoiceActionsModal
          title="Send Invoice"
          description="Mark this invoice as sent. This will lock financial fields."
          onClose={closeModal}
        >
          <Alert className="bg-blue-50 border-blue-200">
            <AlertCircle className="h-4 w-4 text-blue-600" />
            <AlertDescription className="text-blue-800">
              After sending, you can only edit notes and due date. Financial fields will be locked.
            </AlertDescription>
          </Alert>
          <div className="flex flex-col sm:flex-row gap-2 sm:gap-3 pt-4">
            <Button
              variant="outline"
              onClick={closeModal}
              disabled={isLoading}
              className="w-full sm:w-auto"
            >
              Cancel
            </Button>
            <Button
              onClick={handleSend}
              disabled={isLoading}
              className="bg-blue-600 hover:bg-blue-700 w-full sm:w-auto"
            >
              {isLoading ? "Sending..." : "Send Invoice"}
            </Button>
          </div>
        </InvoiceActionsModal>
      )}

      {/* Mark as Paid Modal */}
      {activeModal === "pay" && (
        <InvoiceActionsModal
          title="Mark Invoice as Paid"
          description="Record a manual payment for this invoice"
          onClose={closeModal}
        >
          <div className="space-y-4">
            <div>
              <Label htmlFor="payment-ref">Payment Reference *</Label>
              <Input
                id="payment-ref"
                placeholder="e.g., CHK-12345, TXN-67890"
                value={paymentRef}
                onChange={(e) => setPaymentRef(e.target.value)}
                disabled={isLoading}
              />
              <p className="text-xs text-gray-500 mt-1">
                Unique identifier for this payment (check number, transaction ID, etc.)
              </p>
            </div>
            <div>
              <Label htmlFor="payment-notes">Notes (optional)</Label>
              <Textarea
                id="payment-notes"
                placeholder="e.g., Payment received via wire transfer"
                value={paymentNotes}
                onChange={(e) => setPaymentNotes(e.target.value)}
                disabled={isLoading}
                rows={3}
              />
            </div>
            <Alert className="bg-green-50 border-green-200">
              <AlertCircle className="h-4 w-4 text-green-600" />
              <AlertDescription className="text-green-800">
                Amount: {invoice.currency} {Number(invoice.total).toFixed(2)}
              </AlertDescription>
            </Alert>
            <div className="flex flex-col sm:flex-row gap-2 sm:gap-3 pt-4">
              <Button
                variant="outline"
                onClick={closeModal}
                disabled={isLoading}
                className="w-full sm:w-auto"
              >
                Cancel
              </Button>
              <Button
                onClick={handleMarkPaid}
                disabled={isLoading || !paymentRef.trim()}
                className="bg-green-600 hover:bg-green-700 w-full sm:w-auto"
              >
                {isLoading ? "Marking..." : "Mark as Paid"}
              </Button>
            </div>
          </div>
        </InvoiceActionsModal>
      )}

      {/* Refund Modal */}
      {activeModal === "refund" && (
        <InvoiceActionsModal
          title="Refund Invoice"
          description="Issue a full refund for this paid invoice"
          onClose={closeModal}
        >
          <div className="space-y-4">
            <div>
              <Label htmlFor="refund-ref">Refund Reference *</Label>
              <Input
                id="refund-ref"
                placeholder="e.g., REF-12345, CM-67890"
                value={refundRef}
                onChange={(e) => setRefundRef(e.target.value)}
                disabled={isLoading}
              />
              <p className="text-xs text-gray-500 mt-1">
                Unique identifier for this refund (credit memo number, refund ID, etc.)
              </p>
            </div>
            <div>
              <Label htmlFor="refund-notes">Notes (optional)</Label>
              <Textarea
                id="refund-notes"
                placeholder="e.g., Refund issued due to service cancellation"
                value={refundNotes}
                onChange={(e) => setRefundNotes(e.target.value)}
                disabled={isLoading}
                rows={3}
              />
            </div>
            <Alert className="bg-amber-50 border-amber-200">
              <AlertCircle className="h-4 w-4 text-amber-600" />
              <AlertDescription className="text-amber-800">
                Refund Amount: {invoice.currency} {Number(invoice.total).toFixed(2)}
              </AlertDescription>
            </Alert>
            <div className="flex flex-col sm:flex-row gap-2 sm:gap-3 pt-4">
              <Button
                variant="outline"
                onClick={closeModal}
                disabled={isLoading}
                className="w-full sm:w-auto"
              >
                Cancel
              </Button>
              <Button
                onClick={handleRefund}
                disabled={isLoading || !refundRef.trim()}
                className="bg-amber-600 hover:bg-amber-700 w-full sm:w-auto"
              >
                {isLoading ? "Processing..." : "Issue Refund"}
              </Button>
            </div>
          </div>
        </InvoiceActionsModal>
      )}

      {/* Delete Modal */}
      {activeModal === "delete" && (
        <InvoiceActionsModal
          title="Delete Invoice"
          description="Soft delete this invoice (can be restored later)"
          onClose={closeModal}
        >
          <Alert className="bg-red-50 border-red-200">
            <AlertCircle className="h-4 w-4 text-red-600" />
            <AlertDescription className="text-red-800">
              This will soft delete the invoice. All state transitions will be blocked until it is restored.
            </AlertDescription>
          </Alert>
          <div className="flex flex-col sm:flex-row gap-2 sm:gap-3 pt-4">
            <Button
              variant="outline"
              onClick={closeModal}
              disabled={isLoading}
              className="w-full sm:w-auto"
            >
              Cancel
            </Button>
            <Button
              onClick={handleDelete}
              disabled={isLoading}
              className="bg-red-600 hover:bg-red-700 w-full sm:w-auto"
            >
              {isLoading ? "Deleting..." : "Delete Invoice"}
            </Button>
          </div>
        </InvoiceActionsModal>
      )}
    </>
  );
}

interface InvoiceActionsModalProps {
  title: string;
  description: string;
  onClose: () => void;
  children: ReactNode;
}

function InvoiceActionsModal({
  title,
  description,
  onClose,
  children,
}: InvoiceActionsModalProps) {
  return (
    <>
      {/* Overlay */}
      <div className="fixed inset-0 z-40 bg-black/50" onClick={onClose} />
      {/* Modal */}
      <Card className="fixed top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 z-50 w-[calc(100%-2rem)] sm:w-full max-w-md shadow-2xl max-h-[90vh] overflow-y-auto">
        <div className="p-4 sm:p-6 space-y-4">
          <div className="flex items-start justify-between gap-3">
            <div className="flex-1 min-w-0">
              <h2 className="text-base sm:text-lg font-semibold break-words">{title}</h2>
              <p className="text-xs sm:text-sm text-gray-600 mt-1">{description}</p>
            </div>
            <button
              onClick={onClose}
              className="p-1 hover:bg-gray-100 rounded-md transition-colors flex-shrink-0"
            >
              <X className="h-5 w-5" />
            </button>
          </div>
          {children}
        </div>
      </Card>
    </>
  );
}
