import { z } from "zod";
import { router, protectedProcedure } from "@/lib/trpc";
import { invoiceService } from "@/server/services/invoice-service";
import { sendEmail } from "@/lib/resend";
import { createInvoiceEmail } from "@/lib/email";

export const invoiceRouter = router({
  getAll: protectedProcedure.query(async ({ ctx }) => {
     const invoices = await ctx.db.invoice.findMany({
      where: {
        userId: ctx.session.user.id,
      },
      include: {
        client: true,
        items: true,
      },
      orderBy: {
        createdAt: "desc",
      },
    });
    console.log("invoices", invoices);
    return {
      success: true,
      invoices,
    };
  }),

  getById: protectedProcedure
    .input(z.object({ id: z.string() }))
    .query(async ({ ctx, input }) => {
      return await ctx.db.invoice.findFirst({
        where: {
          id: input.id,
          userId: ctx.session.user.id,
        },
        include: {
          client: true,
          items: true,
        },
      });
    }),

  create: protectedProcedure
    .input(
      z.object({
        clientId: z.string(),
        number: z.string(),
        date: z.date(),
        dueDate: z.date().optional(),
        notes: z.string().optional(),
        items: z.array(
          z.object({
            description: z.string(),
            quantity: z.number().optional(),
            rate: z.number().optional(),
            amount: z.number(),
          })
        ),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const subtotal = input.items.reduce((sum, item) => sum + (Number(item.amount) * (item.quantity || 1)), 0);

      return await ctx.db.invoice.create({
        data: {
          updatedAt: new Date(),
          clientId: input.clientId,
          userId: ctx.session.user.id,
          number: input.number,
          date: input.date,
          dueDate: input.dueDate,
          notes: input.notes,
          subtotal,
          total: subtotal,
          items: {
            create: input.items,
          },
        },
        include: {
          client: true,
          items: true,
        },
      });
    }),

  update: protectedProcedure
    .input(
      z.object({
        id: z.string(),
        notes: z.string().optional(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      // Only allow notes updates through the generic update (non-financial)
      return await ctx.db.invoice.update({
        where: {
          id: input.id,
          userId: ctx.session.user.id,
        },
        data: {
          notes: input.notes,
        },
        include: {
          client: true,
          items: true,
        },
      });
    }),

  // State Machine Mutations

  /**
   * Send invoice: DRAFT → SENT
   * Idempotent transition
   */
  sendInvoice: protectedProcedure
    .input(z.object({ id: z.string(), notes: z.string().optional() }))
    .mutation(async ({ ctx, input }) => {
      // Verify invoice belongs to user
      const invoice = await ctx.db.invoice.findFirst({
        where: {
          id: input.id,
          userId: ctx.session.user.id,
        },
      });

      if (!invoice) {
        throw new Error("Invoice not found");
      }

      const result = await invoiceService.sendInvoice(
        input.id,
        ctx.session.user.id,
        input.notes
      );

      if (!result.success) {
        throw new Error(`[${result.code}] ${result.error}`);
      }
    // Attempt to send an email to the client with the public invoice link.
    // This is intentionally outside the invoice state transition transaction.
    try {
      const invoiceWithClient = result.invoice;
      const clientEmail = invoiceWithClient?.client?.email;

      if (!clientEmail) {
        // Record an EMAIL_FAILED event for missing recipient
        await ctx.db.invoiceEvent.create({
          data: {
            invoiceId: input.id,
            type: "EMAIL_FAILED",
            actorId: ctx.session.user.id,
            notes: "No client email address available",
          },
        });
      } else {
        const { subject, html, text } = createInvoiceEmail(invoiceWithClient);
        await sendEmail({
          to: clientEmail,
          subject,
          html,
          text,
        });

        await ctx.db.invoiceEvent.create({
          data: {
            invoiceId: input.id,
            type: "EMAIL_SENT",
            actorId: ctx.session.user.id,
            ref: null,
            notes: `Email sent to ${clientEmail}`,
          },
        });
      }
    } catch (err) {
      // Log failure and create an EMAIL_FAILED event for observability
      const message = err instanceof Error ? err.message : String(err);
      console.error("Failed to send invoice email:", message);
      await ctx.db.invoiceEvent.create({
        data: {
          invoiceId: input.id,
          type: "EMAIL_FAILED",
          actorId: ctx.session.user.id,
          notes: message,
        },
      });
    }

    return result;
    }),

  /**
   * Mark invoice as paid: DRAFT|SENT → PAID (manual)
   * Requires paymentRef for idempotency
   * Idempotent: calling with same paymentRef returns success
   */
  markInvoicePaid: protectedProcedure
    .input(
      z.object({
        id: z.string(),
        paymentRef: z.string().min(1, "Payment reference is required"),
        amount: z.number().optional(),
        currency: z.string().optional(),
        notes: z.string().optional(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      // Verify invoice belongs to user
      const invoice = await ctx.db.invoice.findFirst({
        where: {
          id: input.id,
          userId: ctx.session.user.id,
        },
      });

      if (!invoice) {
        throw new Error("Invoice not found");
      }

      const result = await invoiceService.markInvoicePaid(
        input.id,
        ctx.session.user.id,
        input.paymentRef,
        input.amount,
        input.currency,
        input.notes
      );

      if (!result.success) {
        throw new Error(`[${result.code}] ${result.error}`);
      }

      return result;
    }),

  /**
   * Refund invoice: PAID → REFUNDED (full manual refund)
   * Requires refundRef for idempotency
   * One-way: cannot refund already refunded invoices with different ref
   */
  refundInvoice: protectedProcedure
    .input(
      z.object({
        id: z.string(),
        refundRef: z.string().min(1, "Refund reference is required"),
        notes: z.string().optional(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      // Verify invoice belongs to user
      const invoice = await ctx.db.invoice.findFirst({
        where: {
          id: input.id,
          userId: ctx.session.user.id,
        },
      });

      if (!invoice) {
        throw new Error("Invoice not found");
      }

      const result = await invoiceService.refundInvoice(
        input.id,
        ctx.session.user.id,
        input.refundRef,
        input.notes
      );

      if (!result.success) {
        throw new Error(`[${result.code}] ${result.error}`);
      }

      return result;
    }),

  /**
   * Soft delete invoice: set deleted = true
   * Blocks all transitions while deleted
   * Idempotent
   */
  softDeleteInvoice: protectedProcedure
    .input(z.object({ id: z.string() }))
    .mutation(async ({ ctx, input }) => {
      // Verify invoice belongs to user
      const invoice = await ctx.db.invoice.findFirst({
        where: {
          id: input.id,
          userId: ctx.session.user.id,
        },
      });

      if (!invoice) {
        throw new Error("Invoice not found");
      }

      const result = await invoiceService.softDeleteInvoice(
        input.id,
        ctx.session.user.id
      );

      if (!result.success) {
        throw new Error(`[${result.code}] ${result.error}`);
      }

      return result;
    }),

  /**
   * Restore invoice: set deleted = false
   * Only operation allowed on deleted invoices
   * Idempotent
   */
  restoreInvoice: protectedProcedure
    .input(z.object({ id: z.string() }))
    .mutation(async ({ ctx, input }) => {
      // Verify invoice belongs to user
      const invoice = await ctx.db.invoice.findFirst({
        where: {
          id: input.id,
          userId: ctx.session.user.id,
        },
      });

      if (!invoice) {
        throw new Error("Invoice not found");
      }

      const result = await invoiceService.restoreInvoice(
        input.id,
        ctx.session.user.id
      );

      if (!result.success) {
        throw new Error(`[${result.code}] ${result.error}`);
      }

      return result;
    }),

  generateNumber: protectedProcedure.query(async ({ ctx }) => {
    const lastInvoice = await ctx.db.invoice.findFirst({
      where: {
        userId: ctx.session.user.id,
      },
      orderBy: {
        createdAt: "desc",
      },
    });

    if (!lastInvoice) {
      return "INV-001";
    }

    const lastNumber = lastInvoice.number;
    const match = lastNumber.match(/INV-(\d+)/);

    if (match) {
      const nextNumber = parseInt(match[1]) + 1;
      return `INV-${nextNumber.toString().padStart(3, "0")}`;
    }

    return "INV-001";
  }),
});
