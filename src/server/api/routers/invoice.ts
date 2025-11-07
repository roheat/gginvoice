import { z } from "zod";
import { router, protectedProcedure } from "@/lib/trpc";

export const invoiceRouter = router({
  getAll: protectedProcedure.query(async ({ ctx }) => {
    return await ctx.db.invoice.findMany({
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
            quantity: z.number(),
            rate: z.number(),
            amount: z.number(),
          })
        ),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const subtotal = input.items.reduce((sum, item) => sum + item.amount, 0);

      return await ctx.db.invoice.create({
        data: {
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
        status: z.enum(["DRAFT", "SENT", "PAID", "OVERDUE"]).optional(),
        notes: z.string().optional(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      return await ctx.db.invoice.update({
        where: {
          id: input.id,
          userId: ctx.session.user.id,
        },
        data: {
          status: input.status,
          notes: input.notes,
        },
      });
    }),

  delete: protectedProcedure
    .input(z.object({ id: z.string() }))
    .mutation(async ({ ctx, input }) => {
      return await ctx.db.invoice.delete({
        where: {
          id: input.id,
          userId: ctx.session.user.id,
        },
      });
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
