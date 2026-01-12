'use server'

import prisma from '@/lib/prisma'
import { revalidatePath } from 'next/cache'
import { getSession } from "@/lib/auth-helper"
import { hasPermission } from '@/lib/permissions'

/**
 * WIPE DATABASE
 * Borra todos los datos de la base de datos de manera controlada.
 * Reseta inventario, ventas y clientes.
 */
export async function wipeDatabase() {
    const session = await getSession()
    if (!session?.user) throw new Error("No autorizado")

    // En Next.js 15+, session.user puede tener diferentes estructuras dependiendo de cómo se extienda
    const tenantId = (session.user as any).tenantId
    const role = (session.user as any).role || (session.user as any).rol

    if (role !== "ADMIN" && role !== "SUPER_ADMIN") {
        return { error: "No tienes permisos de administrador para realizar esta acción" }
    }

    console.log(`ADMIN: Iniciando WIPE de base de datos para tenant ${tenantId}...`);

    try {
        await prisma.$transaction([
            prisma.movimientoCaja.deleteMany({ where: { tenantId } }),
            prisma.caja.deleteMany({ where: { tenantId } }),
            prisma.movimientoStock.deleteMany({ where: { tenantId } }),
            prisma.detalleVenta.deleteMany({ where: { tenantId } }),
            prisma.venta.deleteMany({ where: { tenantId } }),
            prisma.compatibilidad.deleteMany({ where: { tenantId } }), // Importante borrar dependencias
            prisma.producto.deleteMany({ where: { tenantId } }),
            prisma.movimientoCuentaCorriente.deleteMany({ where: { tenantId } }),
            prisma.cliente.deleteMany({ where: { tenantId } }),
            prisma.gasto.deleteMany({ where: { tenantId } }),
            prisma.movimientoImpuesto.deleteMany({ where: { tenantId } }),
            prisma.asiento.deleteMany({ where: { tenantId } }), // Los movimientos de asiento se borran por cascada si está configurado
        ])

        console.log(`ADMIN: WIPE completado exitosamente para tenant ${tenantId}.`);

        revalidatePath('/')
        revalidatePath('/inventario')
        revalidatePath('/ventas')
        revalidatePath('/clientes')
        revalidatePath('/caja')
        revalidatePath('/contabilidad')

        return { success: true }
    } catch (error) {
        console.error("ADMIN: Error en WIPE:", error)
        return { error: 'Error al intentar resetear los datos de tu empresa' }
    }
}
