'use server'

import prisma from '@/lib/prisma'
import { getSession } from "@/lib/auth-helper"
import { revalidatePath } from 'next/cache'
import { hasPermission } from '@/lib/permissions'

export async function obtenerConfiguracionEmpresa() {
    const session = await getSession()
    if (!session?.user) return null
    const { tenantId } = session.user as any
    const permissions = (session.user as any).permissions || []

    const role = (session.user as any).role || (session.user as any).rol
    // Se requiere ver empresa o contabilidad para leer estos datos
    if (role !== "SUPER_ADMIN" && !hasPermission(permissions, "cfg:empresa") && !hasPermission(permissions, "cont:ver")) {
        return null
    }

    try {
        const config = await prisma.configuracionEmpresa.findUnique({
            where: { tenantId }
        })
        if (!config) return null
        return {
            ...config,
            alicuotaIIBB: Number(config.alicuotaIIBB),
            alicuotaLeyCheque: Number(config.alicuotaLeyCheque)
        }
    } catch (error) {
        console.error("Error al obtener configuración:", error)
        return null
    }
}

export async function guardarConfiguracionEmpresa(data: any) {
    const session = await getSession()
    if (!session?.user) throw new Error("No autorizado")
    const { tenantId, permissions } = session.user as any
    const role = (session.user as any).role || (session.user as any).rol
    if (role !== "SUPER_ADMIN" && !hasPermission(permissions, "cfg:empresa")) {
        return { error: "No tienes permiso para editar los datos de la empresa" }
    }

    try {
        const updateData = {
            razonSocial: data.razonSocial,
            cuit: data.cuit,
            direccion: data.direccion,
            telefono: data.telefono,
            email: data.email,
            domicilioFiscal: data.domicilioFiscal,
            condicionIva: data.condicionIva,
            tipoEmpresa: data.tipoEmpresa,
            esMiPyME: data.esMiPyME,
            ivaTrimestral: data.ivaTrimestral,
            alicuotaIIBB: parseFloat(data.alicuotaIIBB) || 0,
            alicuotaLeyCheque: parseFloat(data.alicuotaLeyCheque) || 0,
            jurisdicciones: JSON.stringify(data.jurisdicciones || []),
        }

        await prisma.configuracionEmpresa.upsert({
            where: { tenantId },
            update: updateData,
            create: {
                tenantId,
                ...updateData
            }
        })

        revalidatePath('/configuracion')
        return { success: true }
    } catch (error: any) {
        console.error("Error al guardar configuración:", error)
        return { error: error.message || "Error al guardar la configuración" }
    }
}
