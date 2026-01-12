'use server'

import prisma from '@/lib/prisma'
import { revalidatePath } from 'next/cache'
import { getSession } from "@/lib/auth-helper"

interface ItemVentaRequest {
    id: string
    cantidadCarrito: number
}

// --- HELPER DE AUTORIZACIÓN ---
async function checkPermission(allowedRoles: string[]) {
    const session = await getSession()
    if (!session?.user) throw new Error("No autorizado")

    const role = (session.user as any).role || (session.user as any).rol
    const tenantId = (session.user as any).tenantId

    if (role !== 'SUPER_ADMIN' && !allowedRoles.includes(role)) {
        throw new Error("Permisos insuficientes para esta acción")
    }

    return { tenantId }
}

/**
 * REGISTRAR VENTA
 * Mejoras de Seguridad:
 * - Aislamiento forzado por tenantId en todas las consultas.
 * - Validación de pertenencia del cliente y productos.
 */
export async function registrarVenta(itemsRequest: ItemVentaRequest[], clienteId?: string | null, metodoPago: string = 'EFECTIVO') {
    if (!itemsRequest || itemsRequest.length === 0) {
        return { error: 'El carrito está vacío' }
    }

    try {
        const { tenantId } = await checkPermission(['ADMIN', 'ADMINISTRATIVO', 'VENDEDOR'])

        // 1. Recuperar info oficial de los productos filtrando por tenantId
        const ids = itemsRequest.map(i => i.id)
        const productosDB = await prisma.producto.findMany({
            where: {
                id: { in: ids },
                tenantId: tenantId
            }
        })

        if (productosDB.length !== itemsRequest.length) {
            return { error: 'Algunos productos ya no existen o no pertenecen a este comercio' }
        }

        // 2. Resolver Cliente y descuentos
        let descuentoCliente = 0
        let tieneCtaCte = false
        if (clienteId) {
            const cliente = await prisma.cliente.findFirst({
                where: {
                    id: clienteId,
                    tenantId: tenantId
                }
            })
            if (!cliente) return { error: 'Cliente no encontrado o inválido' }

            descuentoCliente = cliente.descuentoEspecial || 0
            tieneCtaCte = cliente.cuentaCorriente
        }

        if (metodoPago === 'CUENTA_CORRIENTE' && !tieneCtaCte) {
            return { error: 'El cliente seleccionado no tiene habilitada la Cuenta Corriente' }
        }

        let totalVenta = 0
        const itemsParaDetalle = itemsRequest.map(itemReq => {
            const prod = productosDB.find(p => p.id === itemReq.id)!
            const precioConIva = Number(prod.precioVenta) * (1 + (prod.tasaIva / 100))
            const precioFinal = descuentoCliente > 0
                ? precioConIva * (1 - (descuentoCliente / 100))
                : precioConIva

            const subtotal = precioFinal * itemReq.cantidadCarrito
            totalVenta += subtotal

            return {
                productoId: prod.id,
                cantidad: itemReq.cantidadCarrito,
                precioUnitario: precioFinal,
                subtotal: subtotal,
                stockPrevio: prod.stockActual
            }
        })

        // 3. Transacción ACID
        const venta = await prisma.$transaction(async (tx) => {
            // A. Validar stock (Locking se recomienda para alta concurrencia)
            for (const item of itemsParaDetalle) {
                if (item.stockPrevio < item.cantidad) {
                    throw new Error(`Stock insuficiente para el producto ID ${item.productoId}`)
                }
            }

            // B. Crear cabecera de Venta con tenantId
            const nuevaVenta = await tx.venta.create({
                data: {
                    tenantId,
                    total: totalVenta,
                    metodoPago: metodoPago,
                    estado: 'COMPLETADA',
                    clienteId: clienteId || null,
                    items: {
                        create: itemsParaDetalle.map(i => ({
                            tenantId,
                            productoId: i.productoId,
                            cantidad: i.cantidad,
                            precioUnitario: i.precioUnitario,
                            subtotal: i.subtotal
                        }))
                    }
                }
            })

            // C. Actualizar Stock y Movimientos (PARALELIZADO)
            await Promise.all(itemsParaDetalle.map(async (item) => {
                await tx.producto.update({
                    where: { id: item.productoId, tenantId }, // Doble check de seguridad
                    data: {
                        stockActual: {
                            decrement: item.cantidad
                        }
                    }
                })

                await tx.movimientoStock.create({
                    data: {
                        tenantId,
                        productoId: item.productoId,
                        cantidad: -item.cantidad,
                        tipo: 'VENTA',
                        referencia: nuevaVenta.id,
                        notas: `Venta registrada: ${nuevaVenta.id}`
                    }
                })
            }));

            // D. Impacto en Caja
            // [FIX] Ensure Account Current never touches the Cash Box
            if (metodoPago === 'EFECTIVO') {
                const cajaAbierta = await tx.caja.findFirst({
                    where: { estado: 'ABIERTA', tenantId },
                    orderBy: { fechaApertura: 'desc' }
                })

                if (!cajaAbierta) {
                    throw new Error("Debe abrir la caja para registrar ventas en efectivo.")
                }

                await tx.movimientoCaja.create({
                    data: {
                        tenantId,
                        cajaId: cajaAbierta.id,
                        tipo: 'INGRESO',
                        monto: totalVenta,
                        concepto: `Venta #${nuevaVenta.id.split('-')[0].toUpperCase()}`,
                        referencia: nuevaVenta.id
                    }
                })
            }

            // E. Cuenta Corriente
            if (metodoPago === 'CUENTA_CORRIENTE' && clienteId) {
                await tx.movimientoCuentaCorriente.create({
                    data: {
                        tenantId,
                        clienteId: clienteId,
                        tipo: 'DEBITO',
                        monto: totalVenta,
                        concepto: `Venta registrada: #${nuevaVenta.id.split('-')[0].toUpperCase()}`,
                        referencia: nuevaVenta.id
                    }
                })

                // IMPACTO EN SALDO MATERIALIZADO
                await tx.cliente.update({
                    where: { id: clienteId, tenantId },
                    data: {
                        saldoActual: { increment: totalVenta }
                    }
                })
            }

            return nuevaVenta
        })

        revalidatePath('/ventas')
        revalidatePath('/inventario')
        revalidatePath('/caja')
        revalidatePath('/')

        return { success: true, ventaId: venta.id }

    } catch (error: any) {
        console.error("Error al procesar venta:", error)
        return { error: error.message || 'Error crítico al procesar la venta.' }
    }
}
