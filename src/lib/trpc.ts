import { initTRPC } from "@trpc/server";
import { getServerSession } from "next-auth";
import { authOptions } from "./auth";
import { db } from "./db";

export async function createContext() {
  try {
    const session = await getServerSession(authOptions);
    return {
      session,
      db,
    };
  } catch (error) {
    console.error("tRPC context creation error:", error);
    return {
      session: null,
      db,
    };
  }
}

export type Context = Awaited<ReturnType<typeof createContext>>;

const t = initTRPC.context<Context>().create();

export const router = t.router;
export const publicProcedure = t.procedure;
export const protectedProcedure = t.procedure.use(({ ctx, next }) => {
  if (!ctx.session || !ctx.session.user) {
    throw new Error("UNAUTHORIZED");
  }
  return next({
    ctx: {
      ...ctx,
      session: { ...ctx.session, user: ctx.session.user },
    },
  });
});
