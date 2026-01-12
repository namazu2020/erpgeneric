'use server'

import prisma from "@/lib/prisma"
import { revalidatePath } from "next/cache"
import { getSession } from "@/lib/auth-helper"

// --- TYPES & INTERFACES ---

export interface RoleDTO {
    id?: string
    name: string
    description?: string | null
    permissions: string[] // We will handle JSON stringification internally
}

// --- ACTIONS ---

export async function getRoles() {
    try {
        const session = await getSession()
        if (!session?.user) return []
        const tenantId = (session.user as any).tenantId

        const roles = await prisma.role.findMany({
            where: { tenantId },
            orderBy: { name: 'asc' }
        })

        return roles.map(r => ({
            ...r,
            permissions: JSON.parse(r.permissions) as string[]
        }))
    } catch (error) {
        console.error("Error getting roles:", error)
        return []
    }
}

export async function createRole(data: RoleDTO) {
    try {
        const session = await getSession()
        if (!session?.user) return { error: "No autorizado" }
        // TODO: Check if user has permission 'roles:write' (future)

        await prisma.role.create({
            data: {
                tenantId: (session.user as any).tenantId,
                name: data.name,
                description: data.description || undefined,
                permissions: JSON.stringify(data.permissions)
            }
        })

        revalidatePath('/configuracion/usuarios')
        return { success: true }
    } catch (error) {
        return { error: "Error al crear rol." }
    }
}

export async function updateRole(id: string, data: RoleDTO) {
    try {
        const session = await getSession()
        if (!session?.user) return { error: "No autorizado" }
        const tenantId = (session.user as any).tenantId

        await prisma.role.update({
            where: { id, tenantId },
            data: {
                name: data.name,
                description: data.description || undefined,
                permissions: JSON.stringify(data.permissions)
            }
        })

        revalidatePath('/configuracion/usuarios')
        return { success: true }
    } catch (error) {
        return { error: "Error al actualizar rol." }
    }
}

export async function deleteRole(id: string) {
    try {
        const session = await getSession()
        if (!session?.user) return { error: "No autorizado" }
        const tenantId = (session.user as any).tenantId

        const role = await prisma.role.findFirst({
            where: { id, tenantId }
        })
        if (!role) return { error: "Rol no encontrado o no autorizado" }
        if (role.isSystem) return { error: "No se pueden eliminar roles de sistema." }

        await prisma.role.delete({ where: { id } })
        revalidatePath('/configuracion/usuarios')
        return { success: true }
    } catch (error) {
        return { error: "Error al eliminar rol." }
    }
}
