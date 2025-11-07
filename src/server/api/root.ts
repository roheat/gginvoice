import { router } from "@/lib/trpc";
import { invoiceRouter } from "./routers/invoice";
import { clientRouter } from "./routers/client";
import { userRouter } from "./routers/user";

export const appRouter = router({
  invoice: invoiceRouter,
  client: clientRouter,
  user: userRouter,
});

export type AppRouter = typeof appRouter;
