'use server'

import prisma from '@/lib/prisma'
import { getSession } from "@/lib/auth-helper"
import { startOfMonth, endOfMonth } from 'date-fns'
import { revalidatePath } from 'next/cache'
import { hasPermission } from '@/lib/permissions'

export async function obtenerResumenContable() {
    const session = await getSession()
    if (!session?.user) throw new Error("No autorizado")
    const { tenantId, permissions } = session.user as any
    const role = (session.user as any).role || (session.user as any).rol
    if (role !== "SUPER_ADMIN" && !hasPermission(permissions, "cont:ver")) {
        throw new Error("No tienes permiso para ver contabilidad")
    }

    const now = new Date()
    const inicio = startOfMonth(now)
    const fin = endOfMonth(now)
    // ... rest of logic
    try {
        // 1. Facturación (Ventas)
        const totalFacturado = await prisma.venta.aggregate({
            where: {
                tenantId,
                fecha: { gte: inicio, lte: fin },
                estado: 'COMPLETADA'
            },
            _sum: { total: true }
        })

        // 2. Gastos Manuales (Alquiler, Sueldos, etc)
        const totalGastos = await prisma.gasto.aggregate({
            where: {
                tenantId,
                fecha: { gte: inicio, lte: fin }
            },
            _sum: { monto: true }
        })

        // 3. Impuestos Recibidos/Pagados (Retenciones/Percepciones)
        const movimientosImpuestos = await prisma.movimientoImpuesto.findMany({
            where: {
                tenantId,
                fecha: { gte: inicio, lte: fin }
            }
        })

        // 4. Configuración
        const config = await prisma.configuracionEmpresa.findUnique({
            where: { tenantId }
        })

        // 5. Últimos Gastos (Reales)
        const gastosRecientes = await prisma.gasto.findMany({
            where: { tenantId },
            orderBy: { fecha: 'desc' },
            take: 10
        })

        return {
            totalFacturado: Number(totalFacturado._sum.total) || 0,
            totalGastos: Number(totalGastos._sum.monto) || 0,
            movimientosImpuestos: movimientosImpuestos.map(m => ({ ...m, monto: Number(m.monto) })),
            gastosRecientes: gastosRecientes.map(g => ({ ...g, monto: Number(g.monto) })),
            config: config ? {
                ...config,
                alicuotaIIBB: Number(config.alicuotaIIBB),
                alicuotaLeyCheque: Number(config.alicuotaLeyCheque)
            } : null,
            mesActual: now.toLocaleString('es-ES', { month: 'long', year: 'numeric' })
        }
    } catch (error) {
        console.error("Error contabilidad:", error)
        return null
    }
}

export async function crearGasto(data: any) {
    const session = await getSession()
    if (!session?.user) throw new Error("No autorizado")
    const { tenantId, permissions } = session.user as any
    const role = (session.user as any).role || (session.user as any).rol
    if (role !== "SUPER_ADMIN" && !hasPermission(permissions, "cont:registrar")) {
        return { error: "No tienes permiso para registrar gastos" }
    }

    try {
        await prisma.gasto.create({
            data: {
                tenantId,
                categoria: data.categoria,
                descripcion: data.descripcion,
                monto: parseFloat(data.monto),
                metodoPago: data.metodoPago,
                comprobante: data.comprobante,
            }
        })
        revalidatePath('/contabilidad')
        return { success: true }
    } catch (error: any) {
        return { error: error.message }
    }
}

export async function crearMovimientoImpuesto(data: any) {
    const session = await getSession()
    if (!session?.user) throw new Error("No autorizado")
    const { tenantId, permissions } = session.user as any
    const role = (session.user as any).role || (session.user as any).rol
    if (role !== "SUPER_ADMIN" && !hasPermission(permissions, "cont:registrar")) {
        return { error: "No tienes permiso para registrar impuestos" }
    }

    try {
        await prisma.movimientoImpuesto.create({
            data: {
                tenantId,
                tipo: data.tipo,
                monto: parseFloat(data.monto),
                operacion: data.operacion,
                referencia: data.referencia,
            }
        })
        revalidatePath('/contabilidad')
        return { success: true }
    } catch (error: any) {
        return { error: error.message }
    }
}
