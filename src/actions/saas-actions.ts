'use server'

import prisma from "@/lib/prisma"
import { randomUUID } from "crypto"
import { auth } from "@/lib/auth"

export async function registrarTenant(data: {
    empresaNombre: string,
    cuit: string,
    adminNombre: string,
    adminEmail: string,
    adminPassword: string
}) {
    if (!data.empresaNombre || !data.adminEmail || !data.adminPassword) {
        return { error: "Faltan datos obligatorios" }
    }

    const existeEmail = await prisma.user.findFirst({
        where: { email: data.adminEmail }
    })
    if (existeEmail) return { error: "Este email ya está registrado" }

    const newTenantId = randomUUID()

    try {
        // 1. Crear Tenant (Configuración Empresa)
        await prisma.configuracionEmpresa.create({
            data: {
                tenantId: newTenantId,
                razonSocial: data.empresaNombre,
                cuit: data.cuit,
                direccion: '',
                telefono: '',
                email: data.adminEmail,
                domicilioFiscal: '',
                condicionIva: 'RESPONSABLE_INSCRIPTO',
            }
        })

        // 2. Crear Usuario Admin usando Better Auth API
        // Esto asegura que el password se hashee correctamente y se use la estructura interna de Better Auth
        await auth.api.signUpEmail({
            body: {
                email: data.adminEmail,
                password: data.adminPassword,
                name: data.adminNombre,
                // Custom fields
                tenantId: newTenantId,
                rol: 'SUPER_ADMIN'
            }
        })

        return { success: true }
    } catch (error: any) {
        console.error(error)
        return { error: `Error al registrar empresa: ${error.message}` }
    }
}
