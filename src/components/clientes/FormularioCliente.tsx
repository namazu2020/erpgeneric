'use client'

import { crearCliente, editarCliente } from '@/actions/clientes-actions'
import { useRef, useState, useTransition, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { Plus, X, Loader2, User, Mail, Phone, MapPin, Hash, Building2, CreditCard, Percent } from 'lucide-react'
import clsx from 'clsx'
import { Cliente } from '@prisma/client'

type ClienteFrontend = Omit<Cliente, 'saldoActual' | 'limiteCredito'> & {
    saldoActual: number;
    limiteCredito: number | null;
}

const CONDICIONES_IVA = [
    { value: 'CONSUMIDOR_FINAL', label: 'Consumidor Final' },
    { value: 'RESPONSABLE_INSCRIPTO', label: 'Responsable Inscripto' },
    { value: 'MONOTRIBUTISTA', label: 'Monotributista' },
    { value: 'EXENTO', label: 'Exento' },
    { value: 'IVA_NO_ALCANZADO', label: 'IVA No Alcanzado' },
]

interface Props {
    cliente?: ClienteFrontend;
    onClose?: () => void;
}

export default function FormularioCliente({ cliente, onClose }: Props) {
    const [isOpen, setIsOpen] = useState(false)
    const [errores, setErrores] = useState<Record<string, string[]> | null>(null)
    const [isPending, startTransition] = useTransition()
    const formRef = useRef<HTMLFormElement>(null)
    const router = useRouter()

    // Manejar apertura/cierre si no es modal externo
    const handleToggle = (open: boolean) => {
        if (onClose) {
            onClose()
        } else {
            setIsOpen(open)
        }
    }

    const handleSubmit = async (formData: FormData) => {
        setErrores(null)
        startTransition(async () => {
            const resultado = cliente
                ? await editarCliente(cliente.id, formData)
                : await crearCliente(formData)

            if (resultado?.error) {
                setErrores(resultado.error as Record<string, string[]>)
            } else if (resultado?.success) {
                formRef.current?.reset()
                handleToggle(false)
                router.refresh()
            }
        })
    }

    // El trigger (botón) solo se muestra si NO estamos ya en modo edición modal externo
    if (!isOpen && !cliente) {
        return (
            <button
                onClick={() => handleToggle(true)}
                className="flex items-center gap-2 rounded-lg bg-gray-900 px-4 py-2 text-sm font-medium text-white shadow-lg hover:bg-black transition-all"
            >
                <Plus className="h-4 w-4" />
                Nuevo Cliente
            </button>
        )
    }

    return (
        <div className="fixed inset-0 z-100 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4 animate-in fade-in">
            <div className="w-full max-w-2xl bg-white rounded-2xl shadow-2xl animate-in zoom-in-95 border border-gray-100 overflow-hidden flex flex-col max-h-[95vh]">
                <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100 bg-gray-50/50">
                    <h3 className="text-lg font-black text-gray-900">
                        {cliente ? `Editar Cliente: ${cliente.nombre}` : 'Nuevo Cliente'}
                    </h3>
                    <button onClick={() => handleToggle(false)} className="p-2 hover:bg-gray-200 rounded-full text-gray-400 hover:text-gray-600">
                        <X className="h-5 w-5" />
                    </button>
                </div>

                <form ref={formRef} action={handleSubmit} className="p-8 overflow-y-auto scrollbar-thin space-y-6">
                    {/* Información Básica */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="space-y-1">
                            <label className="text-xs font-black text-gray-500 uppercase flex items-center gap-2">
                                <User className="h-3 w-3" /> Nombre Completo *
                            </label>
                            <input
                                name="nombre"
                                required
                                defaultValue={cliente?.nombre}
                                className="w-full rounded-xl border border-gray-200 px-4 py-2.5 text-sm focus:ring-2 focus:ring-blue-100 focus:border-blue-500 outline-none transition-all font-bold"
                                placeholder="Juan Pérez"
                            />
                            {errores?.nombre && <p className="text-[10px] text-red-500 font-bold uppercase">{errores.nombre[0]}</p>}
                        </div>

                        <div className="space-y-1">
                            <label className="text-xs font-black text-gray-500 uppercase flex items-center gap-2">
                                <Hash className="h-3 w-3" /> CUIT / CUIL
                            </label>
                            <input
                                name="cuit"
                                defaultValue={cliente?.cuit || ''}
                                className="w-full rounded-xl border border-gray-200 px-4 py-2.5 text-sm focus:ring-2 focus:ring-blue-100 focus:border-blue-500 outline-none transition-all font-mono"
                                placeholder="20-12345678-9"
                            />
                        </div>

                        <div className="space-y-1">
                            <label className="text-xs font-black text-gray-500 uppercase flex items-center gap-2">
                                <Mail className="h-3 w-3" /> Email
                            </label>
                            <input
                                name="email"
                                type="email"
                                defaultValue={cliente?.email || ''}
                                className="w-full rounded-xl border border-gray-200 px-4 py-2.5 text-sm focus:ring-2 focus:ring-blue-100 focus:border-blue-500 outline-none transition-all"
                                placeholder="cliente@email.com"
                            />
                            {errores?.email && <p className="text-[10px] text-red-500 font-bold uppercase">{errores.email[0]}</p>}
                        </div>

                        <div className="space-y-1">
                            <label className="text-xs font-black text-gray-500 uppercase flex items-center gap-2">
                                <Phone className="h-3 w-3" /> Teléfono
                            </label>
                            <input
                                name="telefono"
                                defaultValue={cliente?.telefono || ''}
                                className="w-full rounded-xl border border-gray-200 px-4 py-2.5 text-sm focus:ring-2 focus:ring-blue-100 focus:border-blue-500 outline-none transition-all"
                                placeholder="+54 9 11..."
                            />
                        </div>
                    </div>

                    <div className="space-y-1">
                        <label className="text-xs font-black text-gray-500 uppercase flex items-center gap-2">
                            <MapPin className="h-3 w-3" /> Dirección
                        </label>
                        <input
                            name="direccion"
                            defaultValue={cliente?.direccion || ''}
                            className="w-full rounded-xl border border-gray-200 px-4 py-2.5 text-sm focus:ring-2 focus:ring-blue-100 focus:border-blue-500 outline-none transition-all font-medium"
                            placeholder="Av. Siempre Viva 123, CABA"
                        />
                    </div>

                    <hr className="border-gray-100" />

                    {/* Fiscals & Credit */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div className="space-y-3">
                            <label className="text-xs font-black text-gray-500 uppercase flex items-center gap-2">
                                <Building2 className="h-3 w-3" /> Condición I.V.A (ARCA)
                            </label>
                            <select
                                name="condicionIva"
                                defaultValue={cliente?.condicionIva || 'CONSUMIDOR_FINAL'}
                                className="w-full rounded-xl border border-gray-200 px-4 py-2.5 text-sm focus:ring-2 focus:ring-blue-100 focus:border-blue-500 outline-none transition-all font-bold appearance-none bg-white cursor-pointer"
                            >
                                {CONDICIONES_IVA.map(c => (
                                    <option key={c.value} value={c.value}>{c.label}</option>
                                ))}
                            </select>
                        </div>

                        <div className="p-5 bg-blue-50/50 rounded-2xl border border-blue-100 space-y-4">
                            <div className="flex items-center justify-between">
                                <label className="text-xs font-black text-blue-700 uppercase flex items-center gap-2">
                                    <CreditCard className="h-3 w-3" /> Cuenta Corriente
                                </label>
                                <div className="flex items-center gap-2">
                                    <input
                                        type="checkbox"
                                        name="cuentaCorriente"
                                        value="true"
                                        defaultChecked={cliente?.cuentaCorriente}
                                        className="h-4 w-4 accent-blue-600 rounded cursor-pointer"
                                    />
                                    <span className="text-xs font-bold text-blue-800">Activar</span>
                                </div>
                            </div>

                            <div className="grid grid-cols-2 gap-3">
                                <div className="space-y-1">
                                    <p className="text-[10px] font-black text-blue-600 uppercase">Límite Crédito</p>
                                    <input
                                        name="limiteCredito"
                                        type="number"
                                        defaultValue={cliente?.limiteCredito || 0}
                                        placeholder="0.00"
                                        className="w-full bg-white rounded-lg border border-blue-200 px-3 py-1.5 text-xs font-bold outline-none focus:ring-2 focus:ring-blue-300"
                                    />
                                </div>
                                <div className="space-y-1">
                                    <p className="text-[10px] font-black text-blue-600 uppercase">Desc. Especial %</p>
                                    <div className="relative">
                                        <input
                                            name="descuentoEspecial"
                                            type="number"
                                            defaultValue={cliente?.descuentoEspecial || 0}
                                            placeholder="0"
                                            className="w-full bg-white rounded-lg border border-blue-200 px-3 py-1.5 text-xs font-bold outline-none focus:ring-2 focus:ring-blue-300"
                                        />
                                        <Percent className="absolute right-2 top-1/2 -translate-y-1/2 h-3 w-3 text-blue-300" />
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>

                    {errores?.general && (
                        <div className="p-3 bg-red-50 border border-red-100 rounded-xl text-red-600 text-xs font-bold text-center">
                            {errores.general[0]}
                        </div>
                    )}

                    <div className="pt-4 flex justify-end gap-3 pb-2">
                        <button type="button" onClick={() => handleToggle(false)} className="px-6 py-2.5 text-sm font-bold text-gray-500 hover:text-gray-800 transition-colors uppercase tracking-wider">Cancelar</button>
                        <button
                            type="submit"
                            disabled={isPending}
                            className="flex items-center gap-2 bg-blue-600 text-white px-8 py-2.5 rounded-xl hover:bg-blue-700 transition-all font-black uppercase text-xs shadow-lg shadow-blue-200 disabled:opacity-50 active:scale-95"
                        >
                            {isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Guardar Cliente'}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    )
}
