import prisma from "@/lib/prisma";
import { ClienteSchema } from "@/lib/validations";
import { TRPCError } from "@trpc/server";

export class ClientesService {
    static async getTodos(tenantId: string, busqueda?: string) {
        return await prisma.cliente.findMany({
            where: {
                tenantId,
                AND: busqueda ? {
                    OR: [
                        { nombre: { contains: busqueda, mode: 'insensitive' } },
                        { email: { contains: busqueda, mode: 'insensitive' } },
                        { cuit: { contains: busqueda } },
                    ]
                } : undefined
            },
            orderBy: { fechaRegistro: 'desc' },
        });
    }

    static async getById(tenantId: string, id: string) {
        const cliente = await prisma.cliente.findUnique({
            where: { id, tenantId },
        });
        if (!cliente) throw new Error("Cliente no encontrado");
        return cliente;
    }

    static async crear(tenantId: string, data: any) {
        const validated = ClienteSchema.parse(data);
        return await prisma.cliente.create({
            data: {
                ...validated,
                tenantId,
                email: validated.email || null,
                cuit: validated.cuit || null,
                telefono: validated.telefono || null,
                direccion: validated.direccion || null,
                condicionIva: validated.condicionIva || 'CONSUMIDOR_FINAL',
            }
        });
    }

    static async editar(tenantId: string, id: string, data: any) {
        const validated = ClienteSchema.parse(data);
        const existing = await prisma.cliente.findFirst({
            where: { id, tenantId }
        });
        if (!existing) throw new Error("No encontrado");

        return await prisma.cliente.update({
            where: { id },
            data: {
                ...validated,
                email: validated.email || null,
                cuit: validated.cuit || null,
                telefono: validated.telefono || null,
                direccion: validated.direccion || null,
            }
        });
    }

    static async eliminar(tenantId: string, id: string) {
        const existing = await prisma.cliente.findFirst({
            where: { id, tenantId }
        });
        if (!existing) throw new Error("No encontrado");

        return await prisma.cliente.delete({ where: { id } });
    }

    static async registrarPago(tenantId: string, data: {
        clienteId: string,
        monto: number,
        concepto: string,
        metodoPago: 'EFECTIVO' | 'TRANSFERENCIA' | 'OTRO'
    }) {
        return await prisma.$transaction(async (tx) => {
            const cliente = await tx.cliente.findUnique({ where: { id: data.clienteId } });
            if (!cliente || cliente.tenantId !== tenantId) throw new Error("No autorizado");

            const pago = await tx.movimientoCuentaCorriente.create({
                data: {
                    tenantId,
                    clienteId: data.clienteId,
                    tipo: 'CREDITO',
                    monto: data.monto,
                    concepto: data.concepto || 'Pago a cuenta',
                }
            });

            await tx.cliente.update({
                where: { id: data.clienteId },
                data: { saldoActual: { decrement: data.monto } }
            });

            if (data.metodoPago === 'EFECTIVO') {
                const caja = await tx.caja.findFirst({
                    where: { estado: 'ABIERTA', tenantId },
                    orderBy: { fechaApertura: 'desc' }
                });

                if (caja) {
                    await tx.movimientoCaja.create({
                        data: {
                            tenantId,
                            cajaId: caja.id,
                            tipo: 'INGRESO',
                            monto: data.monto,
                            concepto: `Cobro Cta. Cte.: ${data.concepto}`,
                            referencia: pago.id
                        }
                    });
                }
            }
            return { success: true };
        });
    }
}
