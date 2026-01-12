'use server'

import prisma from "@/lib/prisma"
import { redirect } from "next/navigation"
import { auth } from "@/lib/auth"
import { revalidatePath } from "next/cache"
import { headers } from "next/headers"

// Helper para obtener sesión
async function getSession() {
    return await auth.api.getSession({
        headers: await headers()
    })
}

// SETUP ACTION
export async function createInitialUser(formData: FormData) {
    const nombre = formData.get('nombre')?.toString()
    const email = formData.get('email')?.toString()
    const password = formData.get('password')?.toString()

    if (!nombre || !email || !password) return { error: 'Campos incompletos' }

    try {
        // Verificar si ya existe algún usuario
        const userCount = await prisma.user.count()
        if (userCount > 0) return { error: 'Ya existe un administrador en el sistema' }

        // Crear el primer usuario como SUPER_ADMIN
        await auth.api.signUpEmail({
            body: {
                email,
                password,
                name: nombre,
                tenantId: 'system',
                rol: 'SUPER_ADMIN'
            }
        })

        return { success: true }
    } catch (error: any) {
        return { error: error.message || 'Error al crear el usuario inicial' }
    }
}

// ADMIN ACTIONS
export async function getUsers() {
    const session = await getSession()
    if (session?.user?.rol !== 'ADMIN' && session?.user?.rol !== 'SUPER_ADMIN') return []

    return await prisma.user.findMany({
        where: { tenantId: session.user.tenantId || 'system' },
        select: {
            id: true,
            name: true,
            email: true,
            rol: true,
            role: { select: { id: true, name: true } },
            createdAt: true
        },
        orderBy: { createdAt: 'desc' }
    })
}

export async function createEmployee(data: { nombre: string, email: string, password: string, rol: string, roleId?: string }) {
    const session = await getSession()
    if (session?.user?.rol !== 'ADMIN' && session?.user?.rol !== 'SUPER_ADMIN') return { error: 'No autorizado' }

    try {
        // Usamos la API de Better Auth para crear el usuario correctamente con hashing automático
        await auth.api.signUpEmail({
            body: {
                email: data.email,
                password: data.password,
                name: data.nombre,
                // Pasamos campos custom
                tenantId: session.user.tenantId || 'system',
                rol: data.rol,
                roleId: data.roleId
            }
        })

        revalidatePath('/configuracion/usuarios')
        return { success: true }
    } catch (error: any) {
        return { error: error.message || 'Error al crear usuario' }
    }
}

export async function deleteUser(id: string) {
    const session = await getSession()
    if (session?.user?.rol !== 'ADMIN' && session?.user?.rol !== 'SUPER_ADMIN') return { error: 'No autorizado' }

    try {
        const tenantId = session.user.tenantId || 'system'
        const userToDelete = await prisma.user.findUnique({ where: { id } })

        if (!userToDelete || userToDelete.tenantId !== tenantId) {
            return { error: 'No autorizado o usuario no encontrado' }
        }

        if (userToDelete.rol === 'ADMIN' || userToDelete.rol === 'SUPER_ADMIN') {
            const adminCount = await prisma.user.count({
                where: {
                    rol: { in: ['ADMIN', 'SUPER_ADMIN'] },
                    tenantId
                }
            })
            if (adminCount <= 1) return { error: 'No puedes borrar el único administrador' }
        }

        await prisma.user.delete({ where: { id } })
        revalidatePath('/configuracion/usuarios')
        return { success: true }
    } catch (error) {
        return { error: 'No se pudo eliminar el usuario' }
    }
}

export async function updateUser(id: string, data: { nombre: string, email: string, rol: string, roleId?: string, password?: string }) {
    const session = await getSession()
    if (session?.user?.rol !== 'ADMIN' && session?.user?.rol !== 'SUPER_ADMIN') return { error: 'No autorizado' }

    try {
        const tenantId = session.user.tenantId || 'system'
        const userToUpdate = await prisma.user.findUnique({ where: { id } })

        if (!userToUpdate || userToUpdate.tenantId !== tenantId) {
            return { error: 'No autorizado o usuario no encontrado' }
        }

        // Si hay password, lo ideal sería usar auth.api.changePassword pero eso requiere la password anterior o ser admin.
        // Como somos admin, podemos hacer update directo, PERO el password debe ser hasheado compatiblemente.
        // Better Auth expone utilidades de password hashing o podemos intentar actualizar vía API.
        // Por simplicidad para MVP y dado que BetterAuth usa scrypt por defecto, 
        // usaremos la API updateUser de Better Auth si es posible, o dejaremos el password pendiente de cambio.

        // Better Auth Admin API no siempre expone "updateUserPassword" directo sin ser el usuario.
        // Actualizaremos solo datos no-password por ahora vía Prisma (User model compatible), 
        // y para password sugerimos reset flow o re-creación.
        // OJO: Si auth.ts usa bcrypt, podríamos usar bcrypt.

        const updateData: any = {
            name: data.nombre,
            email: data.email,
            rol: data.rol,
            roleId: data.roleId || null
        }

        // Nota: El cambio de password directo aquí podría romper login si el hashing no coincide.
        // Omitimos cambio de password directo por ahora en update de admin a menos que usemos API de admin.

        await prisma.user.update({
            where: { id },
            data: updateData
        })
        revalidatePath('/configuracion/usuarios')
        return { success: true }
    } catch (error) {
        return { error: 'Error al actualizar usuario' }
    }
}

export async function getLoginLogs() {
    const session = await getSession()
    if (session?.user?.rol !== 'ADMIN' && session?.user?.rol !== 'SUPER_ADMIN') return []

    try {
        const tenantId = session.user.tenantId || 'system'
        return await prisma.loginLog.findMany({
            where: { tenantId },
            include: { usuario: { select: { name: true, email: true } } },
            orderBy: { fecha: 'desc' },
            take: 100
        })
    } catch (error) {
        console.error("Error fetching login logs:", error)
        return []
    }
}
