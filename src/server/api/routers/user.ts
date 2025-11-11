import { z } from "zod";
import { router, protectedProcedure } from "@/lib/trpc";
import { InvoiceStatus } from "@prisma/client";

export const userRouter = router({
  getProfile: protectedProcedure.query(async ({ ctx }) => {
    return await ctx.db.user.findUnique({
      where: {
        id: ctx.session.user.id,
      },
      include: {
        settings: true,
      },
    });
  }),

  updateProfile: protectedProcedure
    .input(
      z.object({
        name: z.string().optional(),
        company: z.string().optional(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      return await ctx.db.user.update({
        where: {
          id: ctx.session.user.id,
        },
        data: input,
      });
    }),

  getStats: protectedProcedure.query(async ({ ctx }) => {
    const [totalInvoices, paidInvoices, totalRevenue] = await Promise.all([
      ctx.db.invoice.count({
        where: {
          userId: ctx.session.user.id,
        },
      }),
      ctx.db.invoice.count({
        where: {
          userId: ctx.session.user.id,
          status: InvoiceStatus.PAID,
        },
      }),
      ctx.db.invoice.aggregate({
        where: {
          userId: ctx.session.user.id,
          status: InvoiceStatus.PAID,
        },
        _sum: {
          total: true,
        },
      }),
    ]);

    return {
      totalInvoices,
      paidInvoices,
      totalRevenue: totalRevenue._sum.total || 0,
    };
  }),
});
