'use server'

import prisma from '@/lib/prisma'
import { revalidatePath } from 'next/cache'
import { ClienteSchema } from '@/lib/validations'
import { getSession } from "@/lib/auth-helper"
import { ClientesService } from '@/services/clientes.service'

// --- HELPER ---
async function checkPermission(allowedRoles: string[]) {
    const session = await getSession()
    if (!session?.user) throw new Error("No autorizado")

    const role = (session.user as any).role || (session.user as any).rol
    const tenantId = (session.user as any).tenantId

    if (role !== 'SUPER_ADMIN' && !allowedRoles.includes(role)) {
        throw new Error("Permisos insuficientes")
    }

    return { tenantId }
}

export async function crearCliente(formData: FormData) {
    let tenantId = 'system'
    try {
        const authData = await checkPermission(['ADMIN', 'ADMINISTRATIVO'])
        tenantId = authData.tenantId
    } catch (e: any) {
        return { error: { general: [e.message] } }
    }

    const rawData = {
        nombre: formData.get('nombre')?.toString(),
        cuit: formData.get('cuit')?.toString(),
        email: formData.get('email')?.toString(),
        telefono: formData.get('telefono')?.toString(),
        direccion: formData.get('direccion')?.toString(),
        condicionIva: formData.get('condicionIva')?.toString(),
        cuentaCorriente: formData.get('cuentaCorriente') === 'true',
        limiteCredito: formData.get('limiteCredito'),
        descuentoEspecial: formData.get('descuentoEspecial'),
    };

    try {
        await ClientesService.crear(tenantId, rawData);
        revalidatePath('/clientes')
        revalidatePath('/ventas')
        return { success: true }
    } catch (error: any) {
        console.error("Error al crear cliente:", error);
        return { error: { general: [error.message || 'Error al crear cliente'] } }
    }
}

export async function editarCliente(id: string, formData: FormData) {
    let tenantId = 'system'
    try {
        const authData = await checkPermission(['ADMIN', 'ADMINISTRATIVO'])
        tenantId = authData.tenantId
    } catch (e: any) {
        return { error: { general: [e.message] } }
    }

    const rawData = {
        nombre: formData.get('nombre')?.toString(),
        cuit: formData.get('cuit')?.toString(),
        email: formData.get('email')?.toString(),
        telefono: formData.get('telefono')?.toString(),
        direccion: formData.get('direccion')?.toString(),
        condicionIva: formData.get('condicionIva')?.toString(),
        cuentaCorriente: formData.get('cuentaCorriente') === 'true',
        limiteCredito: formData.get('limiteCredito'),
        descuentoEspecial: formData.get('descuentoEspecial'),
    };

    try {
        await ClientesService.editar(tenantId, id, rawData);
        revalidatePath('/clientes')
        revalidatePath('/ventas')
        return { success: true }
    } catch (error: any) {
        console.error("Error al editar cliente:", error);
        return { error: { general: [error.message || 'Error al editar cliente'] } }
    }
}

export async function obtenerClientes(busqueda?: string) {
    const session = await getSession()
    const tenantId = (session?.user as any)?.tenantId || 'system'

    try {
        const clientes = await ClientesService.getTodos(tenantId, busqueda);
        return {
            clientes: clientes.map(c => ({
                ...c,
                saldoActual: Number(c.saldoActual),
                limiteCredito: c.limiteCredito ? Number(c.limiteCredito) : null
            }))
        }
    } catch (error) {
        return { error: 'Error al obtener clientes' }
    }
}

export async function registrarPagoCliente(data: {
    clienteId: string,
    monto: number,
    concepto: string,
    metodoPago: 'EFECTIVO' | 'TRANSFERENCIA' | 'OTRO'
}) {
    let tenantId = 'system'
    try {
        const authData = await checkPermission(['ADMIN', 'ADMINISTRATIVO'])
        tenantId = authData.tenantId
    } catch (e: any) {
        return { error: e.message }
    }

    try {
        await ClientesService.registrarPago(tenantId, data);
        revalidatePath('/clientes')
        return { success: true }
    } catch (error: any) {
        return { error: error.message || 'Error al registrar el pago' }
    }
}

export async function obtenerEstadoCuenta(clienteId: string) {
    const session = await getSession()
    const tenantId = (session?.user as any)?.tenantId

    try {
        const res = await ClientesService.getById(tenantId, clienteId); // Check ownership
        const movimientos = await prisma.movimientoCuentaCorriente.findMany({
            where: { clienteId, tenantId },
            orderBy: { fecha: 'desc' },
            take: 50
        })

        return {
            movimientos: movimientos.map(m => ({ ...m, monto: Number(m.monto) })),
            saldo: Number(res.saldoActual)
        }
    } catch (error) {
        return { error: 'Error al obtener estado de cuenta' }
    }
}

export async function eliminarCliente(id: string) {
    try {
        const { tenantId } = await checkPermission(['ADMIN'])
        await ClientesService.eliminar(tenantId, id);
        revalidatePath('/clientes')
        return { success: true }
    } catch (error: any) {
        return { error: error.message || 'Error al eliminar cliente' }
    }
}
