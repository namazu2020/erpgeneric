'use server'

import prisma from '@/lib/prisma'
import { getSession } from "@/lib/auth-helper"
import { startOfDay, endOfDay } from 'date-fns'

async function getTenantId() {
    const session = await getSession()
    if (!session?.user) throw new Error("No autorizado")
    return (session.user as any).tenantId
}

export async function obtenerVentas(startDate?: Date, endDate?: Date) {
    try {
        const tenantId = await getTenantId()
        const where: any = { tenantId }

        if (startDate && endDate) {
            where.fecha = {
                gte: startOfDay(startDate),
                lte: endOfDay(endDate)
            }
        }

        const ventas = await prisma.venta.findMany({
            where,
            orderBy: {
                fecha: 'desc'
            },
            include: {
                cliente: true,
                items: {
                    include: {
                        producto: true
                    }
                }
            }
        })
        return {
            ventas: ventas.map(v => ({
                ...v,
                total: Number(v.total),
                cliente: v.cliente ? {
                    ...v.cliente,
                    saldoActual: Number(v.cliente.saldoActual),
                    limiteCredito: v.cliente.limiteCredito ? Number(v.cliente.limiteCredito) : null
                } : null,
                items: v.items.map(i => ({
                    ...i,
                    precioUnitario: Number(i.precioUnitario),
                    subtotal: Number(i.subtotal),
                    producto: {
                        ...i.producto,
                        precioCompra: Number(i.producto.precioCompra),
                        precioVenta: Number(i.producto.precioVenta)
                    }
                }))
            }))
        }

    } catch (error) {
        console.error("Error al obtener ventas:", error)
        return { error: 'Error al recuperar el historial de ventas' }
    }
}

export async function obtenerDetalleVenta(id: string) {
    try {
        const tenantId = await getTenantId()
        const venta = await prisma.venta.findFirst({
            where: { id, tenantId },
            include: {
                cliente: true,
                items: {
                    include: {
                        producto: true
                    }
                }
            }
        })
        if (!venta) return { venta: null }
        return {
            venta: {
                ...venta,
                total: Number(venta.total),
                cliente: venta.cliente ? {
                    ...venta.cliente,
                    saldoActual: Number(venta.cliente.saldoActual),
                    limiteCredito: venta.cliente.limiteCredito ? Number(venta.cliente.limiteCredito) : null
                } : null,
                items: venta.items.map(i => ({
                    ...i,
                    precioUnitario: Number(i.precioUnitario),
                    subtotal: Number(i.subtotal),
                    producto: {
                        ...i.producto,
                        precioCompra: Number(i.producto.precioCompra),
                        precioVenta: Number(i.producto.precioVenta)
                    }
                }))
            }
        }
    } catch (error) {
        console.error("Error al obtener detalle de venta:", error)
        return { error: 'Error al recuperar el detalle de la venta' }
    }
}
