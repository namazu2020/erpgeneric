'use server'

import prisma from "@/lib/prisma"
import { getSession } from "@/lib/auth-helper"
import { revalidatePath } from "next/cache"

export async function getCategorias() {
    try {
        const session = await getSession()
        if (!session?.user) return []

        const tenantId = (session.user as any).tenantId

        return await prisma.categoria.findMany({
            where: { tenantId },
            orderBy: { nombre: 'asc' }
        })
    } catch (error) {
        console.error("Error getting categorias:", error)
        return []
    }
}

export async function createCategoria(nombre: string) {
    try {
        const session = await getSession()
        if (!session?.user) return { error: "No autorizado" }

        const tenantId = (session.user as any).tenantId

        // Check duplicate
        const existing = await prisma.categoria.findUnique({
            where: {
                nombre_tenantId: { nombre, tenantId }
            }
        })
        if (existing) return { error: "Ya existe una categoría con este nombre" }

        await prisma.categoria.create({
            data: { nombre, tenantId }
        })
        revalidatePath('/ventas')
        revalidatePath('/configuracion/categorias')
        return { success: true }
    } catch (error) {
        return { error: "Error al crear categoría" }
    }
}

export async function updateCategoria(id: string, nombre: string) {
    try {
        const session = await getSession()
        if (!session?.user) return { error: "No autorizado" }

        const tenantId = (session.user as any).tenantId

        await prisma.categoria.update({
            where: { id, tenantId },
            data: { nombre }
        })
        revalidatePath('/ventas')
        revalidatePath('/configuracion/categorias')
        return { success: true }
    } catch (error) {
        return { error: "Error al actualizar categoría" }
    }
}

export async function deleteCategoria(id: string) {
    try {
        const session = await getSession()
        if (!session?.user) return { error: "No autorizado" }
        const tenantId = (session.user as any).tenantId

        // Check usage before delete?? optional
        await prisma.categoria.delete({ where: { id, tenantId } })

        revalidatePath('/ventas')
        revalidatePath('/configuracion/categorias')
        return { success: true }
    } catch (error) {
        return { error: "No se puede eliminar la categoría (posiblemente esté en uso por productos)" }
    }
}
