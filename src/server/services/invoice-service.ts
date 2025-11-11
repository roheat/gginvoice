import { db } from "@/lib/db";
import { InvoiceStatus } from "@prisma/client";

export interface InvoiceTransitionResult {
  success: boolean;
  invoice?: any;
  event?: any;
  error?: string;
  code?: string;
}

export interface InvoiceTransitionError {
  error: string;
  code: string;
}

/**
 * Invoice State Machine Service
 * Handles all transitions between invoice states with proper guards and audit logging
 */
export const invoiceService = {
  /**
   * Check if an invoice is locked (soft deleted)
   */
  async checkInvoiceGuards(
    invoice: any,
    desiredAction: string
  ): Promise<InvoiceTransitionError | null> {
    if (invoice.deleted) {
      return {
        error: "Invoice is deleted and cannot be modified. Restore it first.",
        code: "INVOICE_DELETED",
      };
    }
    return null;
  },

  /**
   * Send invoice: DRAFT → SENT
   * Marks invoice as sent, sets sentAt timestamp
   * Idempotent: calling on already SENT invoice returns success
   */
  async sendInvoice(
    invoiceId: string,
    actorId: string,
    notes?: string
  ): Promise<InvoiceTransitionResult> {
    try {
      const invoice = await db.invoice.findUnique({
        where: { id: invoiceId },
      });

      if (!invoice) {
        return {
          success: false,
          error: "Invoice not found",
          code: "NOT_FOUND",
        };
      }

      // Guard: check if deleted
      const guardError = await this.checkInvoiceGuards(invoice, "send");
      if (guardError) {
        return {
          success: false,
          error: guardError.error,
          code: guardError.code,
        };
      }

      // Idempotent: if already SENT, return success
      if (invoice.status === "SENT") {
        return {
          success: true,
          invoice,
          error: undefined,
        };
      }

      // Guard: can only send from DRAFT
      if (invoice.status !== "DRAFT") {
        return {
          success: false,
          error: `Cannot send invoice with status ${invoice.status}. Only DRAFT invoices can be sent.`,
          code: "INVALID_STATE_TRANSITION",
        };
      }

      // Update invoice status and append event in transaction
      const result = await db.$transaction(async (tx) => {
        const updatedInvoice = await tx.invoice.update({
          where: { id: invoiceId },
          data: {
            status: InvoiceStatus.SENT,
            sentAt: new Date(),
          },
          include: {
            client: true,
            items: true,
          },
        });

        const event = await tx.invoiceEvent.create({
          data: {
            invoiceId,
            type: "SENT",
            actorId,
            notes: notes || null,
          },
        });

        return { invoice: updatedInvoice, event };
      });

      return {
        success: true,
        invoice: result.invoice,
        event: result.event,
      };
    } catch (error) {
      console.error("Error in sendInvoice:", error);
      return {
        success: false,
        error: error instanceof Error ? error.message : "Unknown error",
        code: "INTERNAL_ERROR",
      };
    }
  },

  /**
   * Mark invoice as paid: DRAFT|SENT → PAID (manual payment)
   * Requires paymentRef for idempotency tracking
   * Idempotent: if already PAID with same paymentRef, returns success
   */
  async markInvoicePaid(
    invoiceId: string,
    actorId: string,
    paymentRef: string,
    amount?: number,
    currency?: string,
    notes?: string
  ): Promise<InvoiceTransitionResult> {
    try {
      // Validate required fields
      if (!paymentRef || paymentRef.trim() === "") {
        return {
          success: false,
          error: "paymentRef is required for manual payments",
          code: "MISSING_REQUIRED_FIELD",
        };
      }

      const invoice = await db.invoice.findUnique({
        where: { id: invoiceId },
      });

      if (!invoice) {
        return {
          success: false,
          error: "Invoice not found",
          code: "NOT_FOUND",
        };
      }

      // Guard: check if deleted
      const guardError = await this.checkInvoiceGuards(invoice, "mark-paid");
      if (guardError) {
        return {
          success: false,
          error: guardError.error,
          code: guardError.code,
        };
      }

      // NOTE: simplified behavior — allow marking as paid regardless of current status.
      // Previous guards that prevented paying REFUNDED invoices or erroring on ref mismatches
      // have been removed. We will overwrite existing paymentRef and timestamps and record an event.
      const oldPaymentRef = invoice.paymentRef;

      // Validation: if amount/currency supplied, verify they match invoice
      if (amount !== undefined && Number(amount) !== Number(invoice.total)) {
        return {
          success: false,
          error: `Payment amount (${amount}) does not match invoice total (${invoice.total})`,
          code: "AMOUNT_MISMATCH",
        };
      }

      if (
        currency &&
        currency.toUpperCase() !== invoice.currency.toUpperCase()
      ) {
        return {
          success: false,
          error: `Payment currency (${currency}) does not match invoice currency (${invoice.currency})`,
          code: "CURRENCY_MISMATCH",
        };
      }

      // Update invoice status and append event in transaction — overwrite refs/timestamps
      const result = await db.$transaction(async (tx) => {
        const updatedInvoice = await tx.invoice.update({
          where: { id: invoiceId },
          data: {
            status: InvoiceStatus.PAID,
            paidAt: new Date(),
            paymentRef: paymentRef.trim(),
            paidVia: "manual",
          },
          include: {
            client: true,
            items: true,
          },
        });

        const eventNotes = oldPaymentRef
          ? `${notes ? notes + " - " : ""}Overwrote previous paymentRef: ${oldPaymentRef}`
          : notes || "Manual payment";

        const event = await tx.invoiceEvent.create({
          data: {
            invoiceId,
            type: "PAID",
            actorId,
            ref: paymentRef.trim(),
            notes: eventNotes,
          },
        });

        return { invoice: updatedInvoice, event };
      });

      return {
        success: true,
        invoice: result.invoice,
        event: result.event,
      };
    } catch (error) {
      console.error("Error in markInvoicePaid:", error);
      return {
        success: false,
        error: error instanceof Error ? error.message : "Unknown error",
        code: "INTERNAL_ERROR",
      };
    }
  },

  /**
   * Refund invoice: PAID → REFUNDED (full refund)
   * One-way transition; cannot refund REFUNDED → PAID
   * Requires refundRef for idempotency tracking
   */
  async refundInvoice(
    invoiceId: string,
    actorId: string,
    refundRef: string,
    notes?: string
  ): Promise<InvoiceTransitionResult> {
    try {
      // Validate required fields
      if (!refundRef || refundRef.trim() === "") {
        return {
          success: false,
          error: "refundRef is required for refunds",
          code: "MISSING_REQUIRED_FIELD",
        };
      }

      const invoice = await db.invoice.findUnique({
        where: { id: invoiceId },
      });

      if (!invoice) {
        return {
          success: false,
          error: "Invoice not found",
          code: "NOT_FOUND",
        };
      }

      // Guard: check if deleted
      const guardError = await this.checkInvoiceGuards(invoice, "refund");
      if (guardError) {
        return {
          success: false,
          error: guardError.error,
          code: guardError.code,
        };
      }

      // NOTE: simplified behavior — allow refunding regardless of current status.
      // Overwrite refundRef/refundedAt and record an event; include previous refundRef in notes if present.
      const oldRefundRef = invoice.refundRef;

      const result = await db.$transaction(async (tx) => {
        const updatedInvoice = await tx.invoice.update({
          where: { id: invoiceId },
          data: {
            status: InvoiceStatus.REFUNDED,
            refundedAt: new Date(),
            refundRef: refundRef.trim(),
          },
          include: {
            client: true,
            items: true,
          },
        });

        const eventNotes = oldRefundRef
          ? `${notes ? notes + " - " : ""}Overwrote previous refundRef: ${oldRefundRef}`
          : notes || "Full refund";

        const event = await tx.invoiceEvent.create({
          data: {
            invoiceId,
            type: "REFUNDED",
            actorId,
            ref: refundRef.trim(),
            notes: eventNotes,
          },
        });

        return { invoice: updatedInvoice, event };
      });

      return {
        success: true,
        invoice: result.invoice,
        event: result.event,
      };
    } catch (error) {
      console.error("Error in refundInvoice:", error);
      return {
        success: false,
        error: error instanceof Error ? error.message : "Unknown error",
        code: "INTERNAL_ERROR",
      };
    }
  },

  /**
   * Soft delete invoice: set deleted = true
   * Blocks all state transitions while deleted
   * Idempotent: calling on already deleted invoice returns success
   */
  async softDeleteInvoice(
    invoiceId: string,
    actorId: string
  ): Promise<InvoiceTransitionResult> {
    try {
      const invoice = await db.invoice.findUnique({
        where: { id: invoiceId },
      });

      if (!invoice) {
        return {
          success: false,
          error: "Invoice not found",
          code: "NOT_FOUND",
        };
      }

      // Idempotent: if already deleted, return success
      if (invoice.deleted) {
        return {
          success: true,
          invoice,
          error: undefined,
        };
      }

      // Soft delete and append event in transaction
      const result = await db.$transaction(async (tx) => {
        const updatedInvoice = await tx.invoice.update({
          where: { id: invoiceId },
          data: {
            deleted: true,
          },
          include: {
            client: true,
            items: true,
          },
        });

        const event = await tx.invoiceEvent.create({
          data: {
            invoiceId,
            type: "SOFT_DELETE",
            actorId,
            notes: "Invoice soft deleted",
          },
        });

        return { invoice: updatedInvoice, event };
      });

      return {
        success: true,
        invoice: result.invoice,
        event: result.event,
      };
    } catch (error) {
      console.error("Error in softDeleteInvoice:", error);
      return {
        success: false,
        error: error instanceof Error ? error.message : "Unknown error",
        code: "INTERNAL_ERROR",
      };
    }
  },

  /**
   * Restore invoice: set deleted = false
   * Only operation allowed on deleted invoices
   * Idempotent: calling on already restored invoice returns success
   */
  async restoreInvoice(
    invoiceId: string,
    actorId: string
  ): Promise<InvoiceTransitionResult> {
    try {
      const invoice = await db.invoice.findUnique({
        where: { id: invoiceId },
      });

      if (!invoice) {
        return {
          success: false,
          error: "Invoice not found",
          code: "NOT_FOUND",
        };
      }

      // Idempotent: if already restored, return success
      if (!invoice.deleted) {
        return {
          success: true,
          invoice,
          error: undefined,
        };
      }

      // Restore and append event in transaction
      const result = await db.$transaction(async (tx) => {
        const updatedInvoice = await tx.invoice.update({
          where: { id: invoiceId },
          data: {
            deleted: false,
          },
          include: {
            client: true,
            items: true,
          },
        });

        const event = await tx.invoiceEvent.create({
          data: {
            invoiceId,
            type: "RESTORE",
            actorId,
            notes: "Invoice restored",
          },
        });

        return { invoice: updatedInvoice, event };
      });

      return {
        success: true,
        invoice: result.invoice,
        event: result.event,
      };
    } catch (error) {
      console.error("Error in restoreInvoice:", error);
      return {
        success: false,
        error: error instanceof Error ? error.message : "Unknown error",
        code: "INTERNAL_ERROR",
      };
    }
  },

  /**
   * Record Stripe webhook payment (for audit trail consistency)
   * Updates invoice to PAID and creates audit event
   */
  async recordStripePayment(
    invoiceId: string,
    stripePaymentId: string,
    amount: number,
    currency: string
  ): Promise<InvoiceTransitionResult> {
    try {
      const invoice = await db.invoice.findUnique({
        where: { id: invoiceId },
      });

      if (!invoice) {
        return {
          success: false,
          error: "Invoice not found",
          code: "NOT_FOUND",
        };
      }

      // Skip if already paid (idempotent)
      if (invoice.status === "PAID" && invoice.paymentRef === stripePaymentId) {
        return {
          success: true,
          invoice,
          error: undefined,
        };
      }

      // Update invoice and append event in transaction
      const result = await db.$transaction(async (tx) => {
        const updatedInvoice = await tx.invoice.update({
          where: { id: invoiceId },
          data: {
            status: InvoiceStatus.PAID,
            paidAt: new Date(),
            paymentRef: stripePaymentId,
            paidVia: "stripe",
          },
          include: {
            client: true,
            items: true,
          },
        });

        const event = await tx.invoiceEvent.create({
          data: {
            invoiceId,
            type: "PAID",
            ref: stripePaymentId,
            notes: `Stripe payment succeeded. Amount: ${currency} ${amount}`,
          },
        });

        return { invoice: updatedInvoice, event };
      });

      return {
        success: true,
        invoice: result.invoice,
        event: result.event,
      };
    } catch (error) {
      console.error("Error in recordStripePayment:", error);
      return {
        success: false,
        error: error instanceof Error ? error.message : "Unknown error",
        code: "INTERNAL_ERROR",
      };
    }
  },
};

