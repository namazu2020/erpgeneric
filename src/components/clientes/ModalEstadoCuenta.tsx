'use client'

import { Cliente, MovimientoCuentaCorriente } from '@prisma/client'
import { useState, useEffect, useTransition } from 'react'
import { X, Loader2, ArrowUpRight, ArrowDownLeft, Wallet, Calendar, AlertCircle, CheckCircle2, Banknote, Landmark, MoreHorizontal } from 'lucide-react'
import { obtenerEstadoCuenta, registrarPagoCliente } from '@/actions/clientes-actions'
import { useRouter } from 'next/navigation'
import clsx from 'clsx'

type ClienteFrontend = Omit<Cliente, 'saldoActual' | 'limiteCredito'> & {
    saldoActual: number;
    limiteCredito: number | null;
}

type MovimientoFrontend = Omit<MovimientoCuentaCorriente, 'monto'> & {
    monto: number;
}

interface Props {
    cliente: ClienteFrontend
    onClose: () => void
}

export default function ModalEstadoCuenta({ cliente, onClose }: Props) {
    const [loading, setLoading] = useState(true)
    const [movimientos, setMovimientos] = useState<MovimientoFrontend[]>([])
    const [saldo, setSaldo] = useState(0)
    const [isPending, startTransition] = useTransition()
    const router = useRouter()

    // Formulario de Pago
    const [showPagoForm, setShowPagoForm] = useState(false)
    const [montoPago, setMontoPago] = useState('')
    const [metodoPago, setMetodoPago] = useState<'EFECTIVO' | 'TRANSFERENCIA' | 'OTRO'>('EFECTIVO')

    useEffect(() => {
        cargarDatos()
    }, [cliente.id])

    const cargarDatos = async () => {
        setLoading(true)
        const res = await obtenerEstadoCuenta(cliente.id)
        if (res.movimientos) {
            setMovimientos(res.movimientos)
            setSaldo(res.saldo)
        }
        setLoading(false)
    }

    const handleRegistrarPago = async () => {
        if (!montoPago || parseFloat(montoPago) <= 0) return alert('Ingrese un monto válido')

        startTransition(async () => {
            const res = await registrarPagoCliente({
                clienteId: cliente.id,
                monto: parseFloat(montoPago),
                concepto: 'Pago a cuenta corriente',
                metodoPago
            })

            if (res.success) {
                setMontoPago('')
                setShowPagoForm(false)
                cargarDatos()
                router.refresh()
            } else {
                alert(res.error)
            }
        })
    }

    return (
        <div className="fixed inset-0 z-100 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-in fade-in">
            <div className="w-full max-w-3xl bg-white rounded-3xl shadow-2xl animate-in zoom-in-95 border border-gray-100 overflow-hidden flex flex-col max-h-[90vh]">

                {/* Header */}
                <div className="flex items-center justify-between px-8 py-6 border-b border-gray-100 bg-gray-50/50">
                    <div>
                        <h3 className="text-xl font-black text-gray-900 leading-tight">Estado de Cuenta</h3>
                        <p className="text-sm font-bold text-gray-500 uppercase tracking-widest">{cliente.nombre}</p>
                    </div>
                    <button onClick={onClose} className="p-2 hover:bg-gray-200 rounded-full text-gray-400 hover:text-gray-600 transition-colors">
                        <X className="h-6 w-6" />
                    </button>
                </div>

                <div className="flex-1 overflow-hidden flex flex-col md:flex-row">

                    {/* Panel Izquierdo: Resumen y Acciones */}
                    <div className="w-full md:w-80 border-r border-gray-100 bg-gray-50 p-6 flex flex-col">
                        <div className={clsx(
                            "p-6 rounded-3xl shadow-sm border mb-6",
                            saldo > 0 ? "bg-rose-600 border-rose-700 text-white" : "bg-emerald-600 border-emerald-700 text-white"
                        )}>
                            <p className="text-[10px] font-black uppercase opacity-80 tracking-widest mb-1">Deuda Pendiente</p>
                            <p className="text-3xl font-black">${saldo.toLocaleString('es-AR', { minimumFractionDigits: 2 })}</p>
                        </div>

                        {!showPagoForm ? (
                            <button
                                onClick={() => setShowPagoForm(true)}
                                className="w-full flex items-center justify-center gap-2 bg-gray-900 text-white py-4 rounded-2xl font-black uppercase text-xs hover:bg-black transition-all shadow-lg active:scale-95"
                            >
                                <Wallet className="h-4 w-4" />
                                Registrar Pago / Entrega
                            </button>
                        ) : (
                            <div className="space-y-4 animate-in slide-in-from-top-4">
                                <div className="space-y-2">
                                    <label className="text-[10px] font-black text-gray-500 uppercase">Monto a Entregar</label>
                                    <input
                                        type="number"
                                        value={montoPago}
                                        onChange={(e) => setMontoPago(e.target.value)}
                                        className="w-full bg-white border border-gray-200 rounded-xl px-4 py-3 text-lg font-bold outline-none focus:ring-4 focus:ring-blue-100 focus:border-blue-500"
                                        placeholder="0.00"
                                        autoFocus
                                    />
                                </div>
                                <div className="grid grid-cols-2 gap-2">
                                    <button
                                        type="button"
                                        onClick={() => setMetodoPago('EFECTIVO')}
                                        className={clsx(
                                            "flex flex-col items-center gap-1 p-2 rounded-xl border font-bold transition-all",
                                            metodoPago === 'EFECTIVO' ? "bg-blue-600 border-blue-600 text-white shadow-md" : "bg-white border-gray-200 text-gray-500"
                                        )}
                                    >
                                        <Banknote className="h-4 w-4" />
                                        <span className="text-[9px] uppercase">Efectivo</span>
                                    </button>
                                    <button
                                        type="button"
                                        onClick={() => setMetodoPago('TRANSFERENCIA')}
                                        className={clsx(
                                            "flex flex-col items-center gap-1 p-2 rounded-xl border font-bold transition-all",
                                            metodoPago === 'TRANSFERENCIA' ? "bg-blue-600 border-blue-600 text-white shadow-md" : "bg-white border-gray-200 text-gray-500"
                                        )}
                                    >
                                        <Landmark className="h-4 w-4" />
                                        <span className="text-[9px] uppercase">Transf.</span>
                                    </button>
                                </div>
                                <div className="flex gap-2">
                                    <button
                                        disabled={isPending}
                                        onClick={() => setShowPagoForm(false)}
                                        className="flex-1 py-3 text-xs font-bold text-gray-500 uppercase"
                                    >
                                        Cancelar
                                    </button>
                                    <button
                                        disabled={isPending}
                                        onClick={handleRegistrarPago}
                                        className="flex-1 bg-emerald-600 text-white py-3 rounded-xl font-black uppercase text-xs shadow-md shadow-emerald-100 disabled:opacity-50"
                                    >
                                        {isPending ? <Loader2 className="h-4 w-4 animate-spin mx-auto" /> : 'Confirmar'}
                                    </button>
                                </div>
                            </div>
                        )}

                        <div className="mt-auto p-4 bg-blue-50 rounded-2xl border border-blue-100">
                            <p className="text-[10px] font-black text-blue-800 uppercase flex items-center gap-2 mb-1">
                                <AlertCircle className="h-3 w-3" /> Límite de Crédito
                            </p>
                            <p className="text-xl font-black text-blue-900">${cliente.limiteCredito?.toLocaleString() || '0'}</p>
                        </div>
                    </div>

                    {/* Panel Derecho: Historial */}
                    <div className="flex-1 p-8 overflow-y-auto scrollbar-thin bg-white">
                        <div className="flex items-center gap-2 mb-6">
                            <MoreHorizontal className="h-5 w-5 text-gray-400" />
                            <h4 className="font-black text-xs uppercase text-gray-400 tracking-widest">Movimientos Recientes</h4>
                        </div>

                        {loading ? (
                            <div className="h-64 flex items-center justify-center">
                                <Loader2 className="h-10 w-10 text-gray-300 animate-spin" />
                            </div>
                        ) : movimientos.length === 0 ? (
                            <div className="h-64 flex flex-col items-center justify-center text-gray-400">
                                <CheckCircle2 className="h-12 w-12 opacity-10 mb-2" />
                                <p className="text-sm font-medium">No hay movimientos registrados</p>
                            </div>
                        ) : (
                            <div className="space-y-4">
                                {movimientos.map((m) => (
                                    <div key={m.id} className="group flex items-center justify-between p-4 rounded-2xl border border-gray-100 hover:border-blue-100 hover:bg-blue-50/30 transition-all shadow-sm">
                                        <div className="flex items-center gap-4">
                                            <div className={clsx(
                                                "h-10 w-10 rounded-xl flex items-center justify-center transition-transform group-hover:rotate-12",
                                                m.tipo === 'DEBITO' ? "bg-rose-100 text-rose-600" : "bg-emerald-100 text-emerald-600"
                                            )}>
                                                {m.tipo === 'DEBITO' ? <ArrowUpRight className="h-5 w-5" /> : <ArrowDownLeft className="h-5 w-5" />}
                                            </div>
                                            <div>
                                                <p className="font-bold text-gray-900 text-sm">{m.concepto}</p>
                                                <p className="text-[10px] font-bold text-gray-400 flex items-center gap-1 uppercase">
                                                    <Calendar className="h-3 w-3" /> {new Date(m.fecha).toLocaleDateString()} - {new Date(m.fecha).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                                </p>
                                            </div>
                                        </div>
                                        <div className="text-right">
                                            <p className={clsx(
                                                "font-black text-base",
                                                m.tipo === 'DEBITO' ? "text-rose-600" : "text-emerald-600"
                                            )}>
                                                {m.tipo === 'DEBITO' ? '+' : '-'} ${m.monto.toLocaleString('es-AR', { minimumFractionDigits: 2 })}
                                            </p>
                                            {m.referencia && (
                                                <p className="text-[9px] font-black text-gray-400 uppercase tracking-tighter">REF: #{m.referencia.split('-')[0]}</p>
                                            )}
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    )
}
