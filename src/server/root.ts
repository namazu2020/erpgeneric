import { router, publicProcedure } from "./trpc";
import { clienteRouter } from "./routers/clientes";

/**
 * Este es el router principal que agrupa todos los sub-routers.
 */
export const appRouter = router({
    hello: publicProcedure.query(() => {
        return {
            message: "Hola desde tRPC!",
            timestamp: new Date().toISOString(),
        };
    }),
    clientes: clienteRouter,
});

export type AppRouter = typeof appRouter;
