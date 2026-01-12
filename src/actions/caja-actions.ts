'use server'

import prisma from '@/lib/prisma'
import { revalidatePath } from 'next/cache'
import { getSession } from "@/lib/auth-helper"

async function getTenantId() {
    const session = await getSession()
    if (!session?.user) throw new Error("No autorizado")
    return (session.user as any).tenantId
}

export async function obtenerCajaActual() {
    try {
        const tenantId = await getTenantId()
        const caja = await prisma.caja.findFirst({
            where: { tenantId, estado: 'ABIERTA' },
            include: {
                movimientos: {
                    orderBy: { fecha: 'desc' }
                }
            },
            orderBy: { fechaApertura: 'desc' }
        })
        if (!caja) return { caja: null }
        return {
            caja: {
                ...caja,
                montoApertura: Number(caja.montoApertura),
                montoCierre: caja.montoCierre ? Number(caja.montoCierre) : null,
                movimientos: caja.movimientos.map(m => ({ ...m, monto: Number(m.monto) }))
            }
        }
    } catch (error) {
        return { error: 'Error al obtener caja' }
    }
}


export async function abrirCaja(monto: number) {
    try {
        const tenantId = await getTenantId()
        const existAbierta = await prisma.caja.findFirst({
            where: { tenantId, estado: 'ABIERTA' }
        })

        if (existAbierta) return { error: 'Ya existe una caja abierta' }

        const caja = await prisma.caja.create({
            data: {
                tenantId,
                montoApertura: monto,
                estado: 'ABIERTA'
            }
        })

        revalidatePath('/caja')
        return { success: true, caja }
    } catch (error) {
        return { error: 'Error al abrir caja' }
    }
}

export async function cerrarCaja(id: string, montoCierre: number) {
    try {
        const tenantId = await getTenantId()
        const caja = await prisma.caja.findFirst({ where: { id, tenantId } })
        if (!caja) return { error: 'Caja no encontrada' }

        await prisma.caja.update({
            where: { id },
            data: {
                montoCierre,
                fechaCierre: new Date(),
                estado: 'CERRADA'
            }
        })
        revalidatePath('/caja')
        return { success: true }
    } catch (error) {
        return { error: 'Error al cerrar caja' }
    }
}

export async function registrarMovimientoCaja(data: {
    cajaId: string,
    tipo: 'INGRESO' | 'EGRESO',
    monto: number,
    concepto: string,
    referencia?: string
}) {
    try {
        const tenantId = await getTenantId()
        const caja = await prisma.caja.findFirst({ where: { id: data.cajaId, tenantId } })
        if (!caja) return { error: 'Acceso denegado a la caja' }

        const movimiento = await prisma.movimientoCaja.create({
            data: {
                tenantId,
                cajaId: data.cajaId,
                tipo: data.tipo,
                monto: data.monto,
                concepto: data.concepto,
                referencia: data.referencia
            }
        })
        revalidatePath('/caja')
        return { success: true, movimiento }
    } catch (error) {
        return { error: 'Error al registrar movimiento' }
    }
}


export async function obtenerCajasAnteriores() {
    try {
        const tenantId = await getTenantId()
        const cajas = await prisma.caja.findMany({
            where: { tenantId, estado: 'CERRADA' },
            orderBy: { fechaApertura: 'desc' },
            take: 10
        })
        return {
            cajas: cajas.map(c => ({
                ...c,
                montoApertura: Number(c.montoApertura),
                montoCierre: c.montoCierre ? Number(c.montoCierre) : null
            }))
        }
    } catch (error) {
        return { error: 'Error al obtener historial' }
    }
}

export async function obtenerUltimoCierre() {
    try {
        const tenantId = await getTenantId()
        const caja = await prisma.caja.findFirst({
            where: { tenantId, estado: 'CERRADA' },
            orderBy: { fechaCierre: 'desc' }
        })
        return { monto: Number(caja?.montoCierre) || 0 }
    } catch (error) {
        return { monto: 0 }
    }
}

export async function wipeCaja() {
    try {
        const tenantId = await getTenantId()
        await prisma.$transaction([
            prisma.movimientoCaja.deleteMany({ where: { tenantId } }),
            prisma.caja.deleteMany({ where: { tenantId } }),
        ])
        revalidatePath('/caja')
        return { success: true }
    } catch (error) {
        return { error: 'Error al limpiar la caja' }
    }
}

export async function eliminarMovimientoCaja(id: string) {
    try {
        const tenantId = await getTenantId()
        // Verificamos propiedad antes de borrar
        const mov = await prisma.movimientoCaja.findFirst({
            where: { id, tenantId }
        })
        if (!mov) return { error: 'No autorizado' }

        await prisma.movimientoCaja.delete({
            where: { id }
        })
        revalidatePath('/caja')
        return { success: true }
    } catch (error) {
        return { error: 'Error al eliminar el movimiento' }
    }
}
