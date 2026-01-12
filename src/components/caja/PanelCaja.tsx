'use client'

import { useState, useTransition } from 'react'
import { Caja, MovimientoCaja } from '@prisma/client'
import { abrirCaja, cerrarCaja, registrarMovimientoCaja, eliminarMovimientoCaja } from '@/actions/caja-actions'
import { Plus, Minus, Lock, Unlock, ArrowUpCircle, ArrowDownCircle, History, Calculator, Wallet, AlertCircle, Trash2, X } from 'lucide-react'
import clsx from 'clsx'
import { formatNumber, formatTime, formatDate } from '@/lib/formatters'



interface MovimientoCajaFrontend extends Omit<MovimientoCaja, 'monto'> {
    monto: number;
}

interface CajaFrontend extends Omit<Caja, 'montoApertura' | 'montoCierre'> {
    montoApertura: number;
    montoCierre: number | null;
}

type CajaExtFrontend = CajaFrontend & { movimientos: MovimientoCajaFrontend[] }

interface Props {
    cajaInicial: CajaExtFrontend | null
    historialCajas: CajaFrontend[]
}


export default function PanelCaja({ cajaInicial, historialCajas }: Props) {
    const [caja, setCaja] = useState<CajaExtFrontend | null>(cajaInicial)
    const [isPending, startTransition] = useTransition()

    const handleAbrir = async () => {
        const sugerido = historialCajas.length > 0 ? (historialCajas[0].montoCierre || 0) : 0
        const monto = prompt(`¿Con cuánto dinero abre la caja hoy?\n(Sugerido por cierre anterior: $${formatNumber(sugerido)})`, sugerido.toString())

        if (monto && !isNaN(Number(monto))) {
            const res = await abrirCaja(Number(monto))
            if (res.success) window.location.reload()
            else alert(res.error)
        }
    }

    const handleCerrar = async () => {
        if (!caja) return
        const esperado = totalEfectivo
        const físico = prompt(`Cierre de Caja\nMonto esperado en efectivo: $${formatNumber(esperado)}\n\n¿Cuánto dinero físico hay realmente en caja?`, esperado.toString())

        if (físico !== null && !isNaN(Number(físico))) {
            const real = Number(físico)
            const diferencia = real - esperado

            let msg = `Confirmar Cierre:\n`
            msg += `- Esperado: $${formatNumber(esperado)}\n`
            msg += `- Físico: $${formatNumber(real)}\n`
            if (diferencia !== 0) {
                msg += `- DIFERENCIA: $${formatNumber(diferencia)} (${diferencia > 0 ? 'SOBRANTE' : 'FALTANTE'})\n`
            }

            if (confirm(msg)) {
                const res = await cerrarCaja(caja.id, real)
                if (res.success) window.location.reload()
                else alert(res.error)
            }
        }
    }

    const nuevoMovimiento = async (tipo: 'INGRESO' | 'EGRESO') => {
        if (!caja) return
        const monto = prompt(`Monto del ${tipo}:`)
        if (!monto || isNaN(Number(monto))) return

        const concepto = prompt(`¿Por qué concepto se registra este ${tipo}? (Obligatorio)`)
        if (!concepto || concepto.trim() === '') {
            alert('El concepto es obligatorio para identificar el movimiento.')
            return
        }

        const res = await registrarMovimientoCaja({
            cajaId: caja.id,
            tipo,
            monto: Number(monto),
            concepto: concepto.trim()
        })
        if (res.success) window.location.reload()
    }

    const handleEliminar = async (id: string, concepto: string) => {
        if (confirm(`¿Estás seguro de eliminar el movimiento: "${concepto}"?`)) {
            const res = await eliminarMovimientoCaja(id)
            if (res.success) window.location.reload()
            else alert(res.error)
        }
    }

    const totalIngresos = caja?.movimientos.filter(m => m.tipo === 'INGRESO').reduce((acc, m) => acc + m.monto, 0) || 0
    const totalEgresos = caja?.movimientos.filter(m => m.tipo === 'EGRESO').reduce((acc, m) => acc + m.monto, 0) || 0
    const totalEfectivo = (caja?.montoApertura || 0) + totalIngresos - totalEgresos

    if (!caja) {
        return (
            <div className="flex flex-col items-center justify-center p-12 bg-card border-2 border-dashed border-border rounded-3xl space-y-6">
                <div className="h-20 w-20 bg-muted rounded-full flex items-center justify-center text-muted-foreground">
                    <Lock className="h-10 w-10" />
                </div>
                <div className="text-center">
                    <h3 className="text-xl font-bold">La caja está cerrada</h3>
                    <p className="text-muted-foreground max-w-xs mx-auto">Debes abrir la caja para comenzar a registrar ventas y movimientos de efectivo.</p>
                </div>
                <button onClick={handleAbrir} className="px-8 py-3 bg-primary text-primary-foreground font-bold rounded-2xl shadow-lg shadow-primary/20 hover:scale-105 active:scale-95 transition-all flex items-center gap-2">
                    <Unlock className="h-5 w-5" /> Abrir Caja del Día
                </button>
            </div>
        )
    }

    return (
        <div className="grid gap-8 lg:grid-cols-3">
            {/* Columna Principal: Estado Actual */}
            <div className="lg:col-span-2 space-y-6">
                {/* Card de Resumen */}
                <div className="bg-linear-to-br from-slate-900 to-slate-800 rounded-3xl p-8 text-white shadow-2xl relative overflow-hidden">
                    <Wallet className="absolute -right-4 -bottom-4 h-40 w-40 text-white/5 -rotate-12" />
                    <div className="relative z-10 flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
                        <div className="space-y-1">
                            <span className="text-slate-400 text-sm font-bold uppercase tracking-widest">Efectivo en Caja</span>
                            <h2 className="text-5xl font-black">${formatNumber(totalEfectivo)}</h2>
                            <p className="text-slate-400 text-xs flex items-center gap-1 mt-2">
                                <Unlock size={12} className="text-emerald-400" /> Apertura: ${formatNumber(caja.montoApertura)} • {formatTime(caja.fechaApertura)}
                            </p>
                        </div>
                        <div className="flex flex-wrap gap-2">
                            <button onClick={() => nuevoMovimiento('INGRESO')} className="bg-emerald-500 hover:bg-emerald-600 px-4 py-2 rounded-xl text-sm font-bold flex items-center gap-2 transition-colors">
                                <Plus size={16} /> Registrar Ingreso
                            </button>
                            <button onClick={() => nuevoMovimiento('EGRESO')} className="bg-rose-500 hover:bg-rose-600 px-4 py-2 rounded-xl text-sm font-bold flex items-center gap-2 transition-colors">
                                <Minus size={16} /> Registrar Gasto
                            </button>
                            <button onClick={handleCerrar} className="bg-white/10 hover:bg-white/20 px-4 py-2 rounded-xl text-sm font-bold flex items-center gap-2 transition-colors border border-white/10">
                                <Lock size={16} /> Cerrar Caja
                            </button>
                        </div>
                    </div>
                </div>

                {/* Lista de Movimientos */}
                <div className="bg-card rounded-3xl border border-border shadow-sm overflow-hidden">
                    <div className="p-6 border-b border-border flex items-center justify-between bg-muted/30">
                        <h3 className="font-bold flex items-center gap-2 text-foreground">
                            <Calculator size={18} className="text-primary" />
                            Movimientos y Ventas del Día
                        </h3>
                    </div>
                    <div className="divide-y divide-border min-h-[400px]">
                        {caja.movimientos.length === 0 ? (
                            <div className="h-full flex flex-col items-center justify-center p-12 text-muted-foreground opacity-40">
                                <History size={48} className="mb-4" />
                                <p>No hay movimientos registrados hoy.</p>
                            </div>
                        ) : (
                            caja.movimientos.map((m) => (
                                <div key={m.id} className="p-4 flex items-center justify-between hover:bg-muted/30 transition-colors group">
                                    <div className="flex items-center gap-4">
                                        <div className={clsx(
                                            "h-10 w-10 rounded-full flex items-center justify-center",
                                            m.tipo === 'INGRESO' ? "bg-emerald-100 text-emerald-600" : "bg-rose-100 text-rose-600"
                                        )}>
                                            {m.tipo === 'INGRESO' ? <ArrowUpCircle size={20} /> : <ArrowDownCircle size={20} />}
                                        </div>
                                        <div>
                                            <p className="font-bold text-foreground line-clamp-1">{m.concepto}</p>
                                            <p className="text-[10px] text-muted-foreground uppercase font-bold tracking-tight">
                                                {formatTime(m.fecha)} • {m.referencia ? `Venta #${m.referencia.split('-')[0].toUpperCase()}` : 'Mov. Manual'}
                                            </p>
                                        </div>
                                    </div>
                                    <div className="flex items-center gap-4">
                                        <div className={clsx("font-black text-lg", m.tipo === 'INGRESO' ? "text-emerald-600" : "text-rose-600")}>
                                            {m.tipo === 'INGRESO' ? '+' : '-'}${formatNumber(m.monto)}
                                        </div>
                                        <button
                                            onClick={() => handleEliminar(m.id, m.concepto)}
                                            className="p-2 text-muted-foreground hover:text-rose-600 hover:bg-rose-50 rounded-lg opacity-0 group-hover:opacity-100 transition-all shadow-sm"
                                            title="Eliminar Movimiento"
                                        >
                                            <Trash2 size={14} />
                                        </button>
                                    </div>
                                </div>
                            ))
                        )}
                    </div>
                </div>
            </div>

            {/* Columna Lateral: Historial / Info */}
            <div className="space-y-6">
                <div className="bg-primary/5 border border-primary/20 rounded-3xl p-6">
                    <h4 className="flex items-center gap-2 font-bold text-primary mb-4">
                        <AlertCircle size={18} /> Resumen de Auditoría
                    </h4>
                    <div className="space-y-3 font-medium text-sm text-foreground">
                        <div className="flex justify-between">
                            <span className="text-muted-foreground">Ventas (Efectivo):</span>
                            <span className="font-bold">${formatNumber(caja.movimientos.filter(m => m.referencia && m.tipo === 'INGRESO').reduce((a, b) => a + b.monto, 0))}</span>
                        </div>
                        <div className="flex justify-between">
                            <span className="text-muted-foreground">Ingresos Manuales:</span>
                            <span className="font-bold">${formatNumber(caja.movimientos.filter(m => !m.referencia && m.tipo === 'INGRESO').reduce((a, b) => a + b.monto, 0))}</span>
                        </div>
                        <div className="flex justify-between pt-2 border-t border-primary/10">
                            <span className="text-rose-600">Total Gastos:</span>
                            <span className="text-rose-600 font-bold">-${formatNumber(totalEgresos)}</span>
                        </div>
                    </div>
                </div>

                <div className="bg-card border border-border rounded-3xl p-6 shadow-sm">
                    <h4 className="font-bold flex items-center gap-2 mb-4">
                        <History size={18} className="text-muted-foreground" />
                        Historial de Turnos
                    </h4>
                    <div className="space-y-4 max-h-[300px] overflow-y-auto pr-2 scrollbar-thin">
                        {historialCajas.map((c) => (
                            <div key={c.id} className="flex items-center justify-between p-3 rounded-xl hover:bg-muted transition-colors border border-transparent hover:border-border">
                                <div>
                                    <p className="text-xs font-bold">{formatDate(c.fechaApertura)}</p>
                                    <p className="text-[10px] text-muted-foreground uppercase">Cierre: ${formatNumber(c.montoCierre || 0)}</p>
                                </div>
                                <span className="bg-muted px-2 py-0.5 rounded-full text-[10px] font-bold text-muted-foreground">CERRADA</span>
                            </div>
                        ))}
                    </div>
                </div>
            </div>
        </div>


    )
}
