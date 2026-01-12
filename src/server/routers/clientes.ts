import { router, protectedProcedure } from "../trpc";
import { z } from "zod";
import { ClienteSchema } from "@/lib/validations";
import { TRPCError } from "@trpc/server";
import { ClientesService } from "@/services/clientes.service";

export const clienteRouter = router({
    getTodos: protectedProcedure
        .input(z.object({ busqueda: z.string().optional() }).optional())
        .query(async ({ ctx, input }) => {
            return await ClientesService.getTodos(ctx.tenantId, input?.busqueda);
        }),

    getById: protectedProcedure
        .input(z.object({ id: z.string() }))
        .query(async ({ ctx, input }) => {
            try {
                return await ClientesService.getById(ctx.tenantId, input.id);
            } catch (e: any) {
                throw new TRPCError({ code: "NOT_FOUND", message: e.message });
            }
        }),

    crear: protectedProcedure
        .input(ClienteSchema)
        .mutation(async ({ ctx, input }) => {
            const role = (ctx.session.user as any).rol;
            if (role !== 'SUPER_ADMIN' && role !== 'ADMIN' && role !== 'ADMINISTRATIVO') {
                throw new TRPCError({ code: "FORBIDDEN", message: "Sin permisos" });
            }
            return await ClientesService.crear(ctx.tenantId, input);
        }),

    editar: protectedProcedure
        .input(z.object({ id: z.string(), data: ClienteSchema }))
        .mutation(async ({ ctx, input }) => {
            const role = (ctx.session.user as any).rol;
            if (role !== 'SUPER_ADMIN' && role !== 'ADMIN' && role !== 'ADMINISTRATIVO') {
                throw new TRPCError({ code: "FORBIDDEN", message: "Sin permisos" });
            }
            try {
                return await ClientesService.editar(ctx.tenantId, input.id, input.data);
            } catch (e: any) {
                throw new TRPCError({ code: "NOT_FOUND", message: e.message });
            }
        }),

    eliminar: protectedProcedure
        .input(z.object({ id: z.string() }))
        .mutation(async ({ ctx, input }) => {
            const role = (ctx.session.user as any).rol;
            if (role !== 'SUPER_ADMIN' && role !== 'ADMIN') {
                throw new TRPCError({ code: "FORBIDDEN", message: "Solo administradores" });
            }
            try {
                return await ClientesService.eliminar(ctx.tenantId, input.id);
            } catch (e: any) {
                if (e.message === "Not found") throw new TRPCError({ code: "NOT_FOUND" });
                throw new TRPCError({ code: "CONFLICT", message: "Tiene ventas asociadas" });
            }
        }),

    registrarPago: protectedProcedure
        .input(z.object({
            clienteId: z.string(),
            monto: z.number().positive(),
            concepto: z.string(),
            metodoPago: z.enum(['EFECTIVO', 'TRANSFERENCIA', 'OTRO'])
        }))
        .mutation(async ({ ctx, input }) => {
            const role = (ctx.session.user as any).rol;
            if (role !== 'SUPER_ADMIN' && role !== 'ADMIN' && role !== 'ADMINISTRATIVO') {
                throw new TRPCError({ code: "FORBIDDEN" });
            }
            try {
                return await ClientesService.registrarPago(ctx.tenantId, input);
            } catch (e: any) {
                throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: e.message });
            }
        }),

    getEstadoCuenta: protectedProcedure
        .input(z.object({ clienteId: z.string() }))
        .query(async ({ ctx, input }) => {
            const cliente = await ClientesService.getById(ctx.tenantId, input.clienteId);
            const movimientos = await ctx.prisma.movimientoCuentaCorriente.findMany({
                where: { clienteId: input.clienteId, tenantId: ctx.tenantId },
                orderBy: { fecha: 'desc' },
                take: 50
            });

            return {
                movimientos,
                saldo: Number(cliente.saldoActual)
            };
        }),
});
