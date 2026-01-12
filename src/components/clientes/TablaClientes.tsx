'use client'

import { Cliente } from '@prisma/client'
import { MoreHorizontal, Pencil, Trash2, Mail, Phone, MapPin, User, Calendar, CreditCard, Building2, BadgeCheck } from 'lucide-react'
import { eliminarCliente } from '@/actions/clientes-actions'
import { useRouter } from 'next/navigation'
import { useState, useTransition } from 'react'
import FormularioCliente from './FormularioCliente'
import clsx from 'clsx'

import { registrarPagoCliente, obtenerEstadoCuenta } from '@/actions/clientes-actions'
import ModalEstadoCuenta from './ModalEstadoCuenta'

import { authClient } from '@/lib/auth-client'

type ClienteFrontend = Omit<Cliente, 'saldoActual' | 'limiteCredito'> & {
    saldoActual: number;
    limiteCredito: number | null;
}

export default function TablaClientes({ clientes }: { clientes: ClienteFrontend[] }) {
    const router = useRouter()
    const [isPending, startTransition] = useTransition()
    const [clienteAEditar, setClienteAEditar] = useState<ClienteFrontend | null>(null)
    const [clienteParaCuenta, setClienteParaCuenta] = useState<ClienteFrontend | null>(null)
    const { data: session } = authClient.useSession()

    // Default to 'VENDEDOR' (lowest permission) if no session or role
    const sessionUser = session?.user as any
    const role = sessionUser?.role || sessionUser?.rol || 'VENDEDOR'
    const canEdit = role === 'SUPER_ADMIN' || role === 'ADMIN' || role === 'ADMINISTRATIVO'
    const canDelete = role === 'SUPER_ADMIN' || role === 'ADMIN'

    const handleDelete = async (id: string) => {
        if (!confirm('¿Seguro que deseas eliminar este cliente?')) return
        startTransition(async () => {
            const res = await eliminarCliente(id)
            if (res?.success) router.refresh()
            else alert(res?.error)
        })
    }

    const formatIva = (condicion?: string) => {
        if (!condicion) return 'CONSUMIDOR FINAL'
        return condicion.replace(/_/g, ' ')
    }

    // Avatar generator
    const getInitials = (name: string) => name.substring(0, 2).toUpperCase()
    const colors = ['bg-blue-100 text-blue-700', 'bg-emerald-100 text-emerald-700', 'bg-purple-100 text-purple-700', 'bg-orange-100 text-orange-700']

    return (
        <div className="rounded-2xl border border-border bg-card shadow-sm overflow-hidden">
            <table className="w-full text-left text-sm border-collapse">
                <thead className="bg-muted/30 text-muted-foreground font-bold uppercase tracking-widest text-[10px] border-b border-border">
                    <tr>
                        <th className="px-6 py-4">Información del Cliente</th>
                        <th className="px-6 py-4">Identificación Fiscal</th>
                        <th className="px-6 py-4 text-center">Saldo Actual</th>
                        <th className="px-6 py-4">Contacto y Cuenta</th>
                        {(canEdit || canDelete) && <th className="px-6 py-4 text-right">Acciones</th>}
                    </tr>
                </thead>
                <tbody className="divide-y divide-border">
                    {clientes.length === 0 ? (
                        <tr>
                            <td colSpan={4} className="px-6 py-12 text-center text-gray-400 font-medium">
                                No hay clientes registrados.
                            </td>
                        </tr>
                    ) : (
                        clientes.map((cliente, i) => (
                            <tr key={cliente.id} className="group hover:bg-muted/40 transition-colors">
                                <td className="px-6 py-4">
                                    <div className="flex items-center gap-4">
                                        <div className={clsx(
                                            "h-12 w-12 flex items-center justify-center rounded-2xl font-black text-sm shadow-sm transition-transform group-hover:scale-110",
                                            colors[i % colors.length]
                                        )}>
                                            {getInitials(cliente.nombre)}
                                        </div>
                                        <div>
                                            <p className="font-black text-foreground text-sm flex items-center gap-2">
                                                {cliente.nombre}
                                                {cliente.cuentaCorriente && (
                                                    <span className="p-1 bg-blue-100 text-blue-600 rounded-md" title="Posee Cuenta Corriente">
                                                        <CreditCard className="h-3 w-3" />
                                                    </span>
                                                )}
                                            </p>
                                            <p className="text-[10px] text-muted-foreground flex items-center gap-1 font-bold">
                                                <Calendar className="h-3 w-3" /> Registrado el {new Date(cliente.fechaRegistro).toLocaleDateString()}
                                            </p>
                                        </div>
                                    </div>
                                </td>
                                <td className="px-6 py-4">
                                    <div className="flex flex-col gap-1">
                                        <span className="flex items-center gap-2 text-foreground font-bold text-xs uppercase">
                                            <Building2 className="h-3 w-3 text-muted-foreground" />
                                            {formatIva(cliente.condicionIva)}
                                        </span>
                                        {cliente.cuit ? (
                                            <span className="text-[10px] bg-muted px-2 py-0.5 rounded-md font-mono text-muted-foreground w-fit">
                                                {cliente.cuit}
                                            </span>
                                        ) : (
                                            <span className="text-[10px] text-gray-300 italic">Sin identificador</span>
                                        )}
                                    </div>
                                </td>
                                <td className="px-6 py-4 text-center">
                                    <div className="flex flex-col items-center">
                                        <span className={clsx(
                                            "text-sm font-black",
                                            (cliente.saldoActual || 0) > 0 ? "text-rose-600" : "text-emerald-600"
                                        )}>
                                            ${(cliente.saldoActual || 0).toLocaleString('es-AR', { minimumFractionDigits: 2 })}
                                        </span>
                                        {cliente.cuentaCorriente && (
                                            <button
                                                onClick={() => setClienteParaCuenta(cliente)}
                                                className="mt-1 text-[9px] font-black bg-blue-100 text-blue-700 px-2 py-0.5 rounded-full hover:bg-blue-200 transition-colors uppercase"
                                            >
                                                Ver Estado
                                            </button>
                                        )}
                                    </div>
                                </td>
                                <td className="px-6 py-4">
                                    <div className="flex flex-col gap-1.5">
                                        {(cliente.email || cliente.telefono) ? (
                                            <>
                                                {cliente.email && (
                                                    <span className="flex items-center gap-2 text-muted-foreground text-[11px] font-medium">
                                                        <Mail className="h-3 w-3" /> {cliente.email}
                                                    </span>
                                                )}
                                                {cliente.telefono && (
                                                    <span className="flex items-center gap-2 text-muted-foreground text-[11px] font-bold">
                                                        <Phone className="h-3 w-3" /> {cliente.telefono}
                                                    </span>
                                                )}
                                            </>
                                        ) : (
                                            <span className="text-gray-300 text-[10px] italic">Sin datos de contacto</span>
                                        )}
                                        {cliente.cuentaCorriente && (
                                            <div className="mt-1 flex items-center gap-2">
                                                <span className="text-[9px] font-black bg-blue-600 text-white px-1.5 py-0.5 rounded uppercase tracking-tighter">
                                                    Cta Cte
                                                </span>
                                                <span className="text-[10px] font-bold text-blue-600">
                                                    Lím: ${cliente.limiteCredito?.toLocaleString() || '0'}
                                                </span>
                                            </div>
                                        )}
                                    </div>
                                </td>
                                {(canEdit || canDelete) && (
                                    <td className="px-6 py-4 text-right">
                                        <div className="flex items-center justify-end gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                            {canEdit && (
                                                <button
                                                    onClick={() => setClienteAEditar(cliente)}
                                                    className="p-2.5 text-muted-foreground hover:text-blue-600 hover:bg-blue-50 rounded-xl transition-all"
                                                    title="Editar cliente"
                                                >
                                                    <Pencil className="h-4 w-4" />
                                                </button>
                                            )}
                                            {canDelete && (
                                                <button
                                                    onClick={() => handleDelete(cliente.id)}
                                                    disabled={isPending}
                                                    className="p-2.5 text-muted-foreground hover:text-rose-600 hover:bg-rose-50 rounded-xl transition-all"
                                                    title="Eliminar cliente"
                                                >
                                                    <Trash2 className="h-4 w-4" />
                                                </button>
                                            )}
                                        </div>
                                    </td>
                                )}
                            </tr>
                        ))
                    )}
                </tbody>
            </table>

            {/* Modal de Edición */}
            {clienteAEditar && (
                <FormularioCliente
                    cliente={clienteAEditar}
                    onClose={() => setClienteAEditar(null)}
                />
            )}
            {/* Modal de Pago / Cuenta Corriente */}
            {clienteParaCuenta && (
                <ModalEstadoCuenta
                    cliente={clienteParaCuenta}
                    onClose={() => setClienteParaCuenta(null)}
                />
            )}
        </div>
    )
}
