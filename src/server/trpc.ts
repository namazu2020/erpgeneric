import { initTRPC, TRPCError } from "@trpc/server";
import { auth } from "@/lib/auth"; // Better Auth
import { headers } from "next/headers";
import prisma from "@/lib/prisma";

/**
 * Contexto de tRPC para inyectar la sesión y el tenantId en cada petición.
 */
// Contexto para tRPC
export const createTRPCContext = async (opts: { headers: Headers }) => {
    // Usamos auth.api.getSession para obtener la sesión desde el token del header (o cookie)
    const session = await auth.api.getSession({
        headers: opts.headers,
    });

    return {
        prisma,
        session,
        headers: opts.headers,
    };
};

const t = initTRPC.context<typeof createTRPCContext>().create();

export const router = t.router;
export const publicProcedure = t.procedure;

/**
 * Middleware para asegurar que el usuario esté autenticado.
 */
const isAuthed = t.middleware(({ next, ctx }) => {
    if (!ctx.session) {
        throw new TRPCError({ code: "UNAUTHORIZED" });
    }
    return next({
        ctx: {
            session: ctx.session,
            user: ctx.session.user,
            // Inyectamos el tenantId directamente para usarlo en los queries
            // En Better-Auth con custom fields o organization, esto se puede mapear
            tenantId: (ctx.session.user as any).tenantId || "system",
        },
    });
});

export const protectedProcedure = t.procedure.use(isAuthed);
