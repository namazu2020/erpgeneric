'use client'

import { useEffect, useState, useTransition } from 'react'
import { obtenerResumenContable, crearGasto, crearMovimientoImpuesto } from '@/actions/contabilidad-actions'
import { authClient } from '@/lib/auth-client'
import {
    Calculator,
    TrendingUp,
    FileText,
    ArrowUpRight,
    Info,
    Calendar,
    Wallet,
    ShieldCheck,
    Plus,
    X,
    Receipt,
    History,
    Landmark,
    ArrowDownRight,
    Loader2
} from 'lucide-react'
import { formatCurrency } from '@/lib/formatters'
import { toast } from 'sonner'
import clsx from 'clsx'

export default function ContabilidadPage() {
    const [data, setData] = useState<any>(null)
    const [loading, setLoading] = useState(true)
    const [isPending, startTransition] = useTransition()

    // Modales
    const [showGastoModal, setShowGastoModal] = useState(false)
    const [showImpuestoModal, setShowImpuestoModal] = useState(false)

    const { data: session } = authClient.useSession()
    const userPermissions = (session?.user as any)?.permissions || []
    const canRegister = userPermissions.includes("admin:all") || userPermissions.includes("cont:registrar")

    useEffect(() => {
        loadData()
    }, [])

    async function loadData() {
        setLoading(true)
        const res = await obtenerResumenContable()
        setData(res)
        setLoading(false)
    }

    const handleCrearGasto = async (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault()
        const formData = new FormData(e.currentTarget)
        const payload = {
            categoria: formData.get('categoria'),
            descripcion: formData.get('descripcion'),
            monto: formData.get('monto'),
            metodoPago: formData.get('metodoPago'),
            comprobante: formData.get('comprobante'),
        }

        startTransition(async () => {
            const res = await crearGasto(payload)
            if (res.success) {
                toast.success("Gasto registrado")
                setShowGastoModal(false)
                loadData()
            } else {
                toast.error(res.error)
            }
        })
    }

    const handleCrearImpuesto = async (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault()
        const formData = new FormData(e.currentTarget)
        const payload = {
            tipo: formData.get('tipo'),
            monto: formData.get('monto'),
            operacion: formData.get('operacion'),
            referencia: formData.get('referencia'),
        }

        startTransition(async () => {
            const res = await crearMovimientoImpuesto(payload)
            if (res.success) {
                toast.success("Movimiento impositivo registrado")
                setShowImpuestoModal(false)
                loadData()
            } else {
                toast.error(res.error)
            }
        })
    }

    if (loading && !data) return <div className="p-8 animate-pulse text-muted-foreground">Analizando indicadores fiscales...</div>
    if (!data) return <div className="p-8">Error al cargar datos contables.</div>

    // Lógica Impositiva Avanzada (Basada en Investigación ARCA)
    const totalVentas = data.totalFacturado
    const alicuotaIIBB = data.config?.alicuotaIIBB || 3.0
    const alicuotaCheque = data.config?.alicuotaLeyCheque || 1.2

    const iibbCalculado = totalVentas * (alicuotaIIBB / 100)
    const leyChequeCalculado = (totalVentas * 0.8) * (alicuotaCheque / 100) // Estimado sobre flujo bancario del 80%

    // Sumar retenciones/percepciones manuales
    const retencionesPercRecibidas = data.movimientosImpuestos.reduce((acc: number, m: any) => acc + m.monto, 0)

    const saldoTecnicoIVA = data.config?.condicionIva === 'RESPONSABLE_INSCRIPTO'
        ? (totalVentas - (totalVentas / 1.21))
        : 0

    return (
        <div className="p-8 max-w-7xl mx-auto space-y-8 animate-in fade-in pb-24">
            {/* Header */}
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6 border-b border-border/50 pb-8">
                <div>
                    <h1 className="text-4xl font-black flex items-center gap-3 tracking-tighter">
                        <Calculator className="text-primary" size={36} />
                        Centro Contable <span className="text-muted-foreground/50 font-light">/</span> ARCA
                    </h1>
                    <p className="text-muted-foreground font-medium mt-1">
                        Control de facturación, gastos operativos y previsión de impuestos mayoristas.
                    </p>
                </div>

                {canRegister && (
                    <div className="flex gap-3">
                        <button
                            onClick={() => setShowGastoModal(true)}
                            className="flex items-center gap-2 px-5 py-3 bg-card border border-border hover:border-primary/50 rounded-2xl font-bold text-sm transition-all active:scale-95 shadow-lg"
                        >
                            <Plus size={18} className="text-primary" /> Registrar Gasto
                        </button>
                        <button
                            onClick={() => setShowImpuestoModal(true)}
                            className="flex items-center gap-2 px-5 py-3 bg-primary text-primary-foreground rounded-2xl font-bold text-sm transition-all active:scale-95 shadow-lg shadow-primary/20"
                        >
                            <Landmark size={18} /> Carga Impositiva
                        </button>
                    </div>
                )}
            </div>

            {/* KPI Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                <div className="bg-card border border-border rounded-3xl p-6 shadow-sm overflow-hidden relative group">
                    <div className="absolute -right-4 -top-4 opacity-5 group-hover:opacity-10 transition-opacity">
                        <TrendingUp size={100} />
                    </div>
                    <span className="text-[10px] font-black uppercase tracking-[0.2em] text-muted-foreground">Facturación Mes</span>
                    <div className="text-3xl font-black mt-2 text-foreground">{formatCurrency(totalVentas)}</div>
                    <div className="mt-4 flex items-center gap-2 text-green-500 font-bold text-[10px] bg-green-500/10 px-2 py-1 rounded-lg w-fit leading-none">
                        Ventas Brutas
                    </div>
                </div>

                <div className="bg-card border border-border rounded-3xl p-6 shadow-sm relative group">
                    <div className="absolute -right-4 -top-4 opacity-5 group-hover:opacity-10 transition-opacity">
                        <ArrowDownRight size={100} className="text-rose-500" />
                    </div>
                    <span className="text-[10px] font-black uppercase tracking-[0.2em] text-muted-foreground">Gastos Operativos</span>
                    <div className="text-3xl font-black mt-2 text-rose-500">{formatCurrency(data.totalGastos)}</div>
                    <div className="mt-4 text-[10px] font-medium text-muted-foreground">
                        Sueldos, Alquiler, Servicios...
                    </div>
                </div>

                <div className="bg-card border border-border rounded-3xl p-6 shadow-sm">
                    <span className="text-[10px] font-black uppercase tracking-[0.2em] text-muted-foreground">Utilidad Operativa</span>
                    <div className="text-3xl font-black mt-2 text-blue-500">{formatCurrency(totalVentas - data.totalGastos)}</div>
                    <div className="mt-4 text-[10px] font-bold text-muted-foreground italic leading-none">
                        Antes de impuestos
                    </div>
                </div>

                <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 shadow-xl text-white overflow-hidden relative">
                    <div className="absolute right-0 top-0 p-4">
                        <ShieldCheck className="text-blue-400" size={24} />
                    </div>
                    <span className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400 leading-none">Estado Fiscal</span>
                    <div className="text-xl font-bold mt-2">Cumplimiento OK</div>
                    <div className="mt-6 space-y-2">
                        <div className="flex justify-between text-[10px] font-bold">
                            <span className="text-slate-500 uppercase">Cierre: {data.mesActual}</span>
                            <span> {Math.round((new Date().getDate() / 30) * 100)}%</span>
                        </div>
                        <div className="h-1.5 w-full bg-slate-800 rounded-full overflow-hidden">
                            <div className="h-full bg-blue-500" style={{ width: `${(new Date().getDate() / 30) * 100}%` }} />
                        </div>
                    </div>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                {/* Panel de Impuestos Detallado */}
                <div className="lg:col-span-2 space-y-8">
                    <div className="bg-card/50 backdrop-blur-md border border-border rounded-3xl overflow-hidden shadow-lg">
                        <div className="p-6 bg-muted/20 border-b border-border flex items-center justify-between">
                            <div className="flex items-center gap-3">
                                <History className="text-primary" size={20} />
                                <h2 className="text-lg font-black">Proyección Impositiva (ARCA / Jurisdicciones)</h2>
                            </div>
                            <div className="text-[10px] bg-primary/10 text-primary px-3 py-1.5 rounded-full font-black uppercase">
                                {data.config?.condicionIva}
                            </div>
                        </div>

                        <div className="p-8 grid grid-cols-1 md:grid-cols-2 gap-8">
                            <div className="space-y-6">
                                <div className="flex justify-between items-end">
                                    <div className="space-y-1">
                                        <p className="text-xs font-bold text-muted-foreground uppercase">IVA Débito (Estimado)</p>
                                        <p className="text-2xl font-black">{formatCurrency(saldoTecnicoIVA)}</p>
                                    </div>
                                    <div className="text-[10px] font-bold text-muted-foreground pb-1">21.0% General</div>
                                </div>

                                <div className="flex justify-between items-end">
                                    <div className="space-y-1">
                                        <p className="text-xs font-bold text-muted-foreground uppercase">IIBB (Provincial)</p>
                                        <p className="text-2xl font-black">{formatCurrency(iibbCalculado)}</p>
                                    </div>
                                    <div className="text-[10px] font-bold text-muted-foreground pb-1">Alícuota: {alicuotaIIBB}%</div>
                                </div>

                                <div className="flex justify-between items-end">
                                    <div className="space-y-1">
                                        <p className="text-xs font-bold text-muted-foreground uppercase">Percepciones Recibidas (-)</p>
                                        <p className="text-2xl font-black text-blue-500">{formatCurrency(retencionesPercRecibidas)}</p>
                                    </div>
                                    <div className="text-[10px] font-bold text-blue-500/70 pb-1">Carga Manual</div>
                                </div>
                            </div>

                            <div className="bg-muted/30 rounded-2xl p-6 space-y-4 border border-border/50">
                                <div className="flex items-center gap-2 text-xs font-black uppercase">
                                    <Info size={14} className="text-primary" /> Beneficios MiPyME
                                </div>
                                <div className="space-y-3">
                                    <div className="flex justify-between text-xs">
                                        <span className="text-muted-foreground">Pago IVA:</span>
                                        <span className="font-bold">{data.config?.ivaTrimestral ? 'Trimestral' : 'Mensual'}</span>
                                    </div>
                                    <div className="flex justify-between text-xs">
                                        <span className="text-muted-foreground">Ley Cheque (A Cuenta):</span>
                                        <span className="font-bold">{data.config?.esMiPyME ? '100%' : 'No compu.'}</span>
                                    </div>
                                    <div className="pt-4 border-t border-border mt-4">
                                        <p className="text-xs font-bold uppercase mb-2">Total a Pagar Proyectado</p>
                                        <p className="text-3xl font-black text-rose-500">
                                            {formatCurrency(Math.max(0, (saldoTecnicoIVA + iibbCalculado + leyChequeCalculado) - retencionesPercRecibidas))}
                                        </p>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Tabla de Movimientos Recientes */}
                    <div className="bg-card border border-border rounded-3xl shadow-lg overflow-hidden">
                        <div className="p-6 border-b border-border flex items-center gap-3">
                            <Receipt className="text-primary" size={20} />
                            <h2 className="text-lg font-bold">Últimos Gastos Registrados</h2>
                        </div>
                        <div className="overflow-x-auto">
                            <table className="w-full text-left">
                                <thead className="bg-muted/50 text-[10px] font-black uppercase text-muted-foreground">
                                    <tr>
                                        <th className="px-6 py-4">Fecha</th>
                                        <th className="px-6 py-4">Categoría</th>
                                        <th className="px-6 py-4">Descripción</th>
                                        <th className="px-6 py-4">Monto</th>
                                        <th className="px-6 py-4">Médodo</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-border">
                                    {data.gastosRecientes?.length === 0 ? (
                                        <tr><td colSpan={5} className="text-center py-6 text-xs text-muted-foreground">No hay gastos registrados</td></tr>
                                    ) : (
                                        data.gastosRecientes?.map((g: any) => (
                                            <tr key={g.id} className="hover:bg-muted/20 transition-colors">
                                                <td className="px-6 py-4 text-xs font-bold text-muted-foreground">{new Date(g.fecha).toLocaleDateString()}</td>
                                                <td className="px-6 py-4 text-xs font-black">{g.categoria}</td>
                                                <td className="px-6 py-4 text-xs">{g.descripcion}</td>
                                                <td className="px-6 py-4 text-xs font-black text-rose-500">{formatCurrency(g.monto)}</td>
                                                <td className="px-6 py-4 text-xs">{g.metodoPago}</td>
                                            </tr>
                                        ))
                                    )}
                                </tbody>
                            </table>
                        </div>
                    </div>
                </div>

                {/* Sidebar de Ayuda e Info ARCA */}
                <div className="space-y-6">
                    <div className="p-6 bg-linear-to-br from-blue-500/10 to-transparent border border-blue-500/20 rounded-3xl space-y-4">
                        <h3 className="font-black text-sm flex items-center gap-2 text-blue-700 uppercase">
                            <Info size={16} /> Sabías que...
                        </h3>
                        <p className="text-xs text-blue-800/80 font-medium leading-relaxed">
                            Como distribuidora mayorista, la resolución general de ARCA te permite compensar el 100% del impuesto al cheque contra Ganancias si mantienes tu certificado MiPyME vigente.
                        </p>
                    </div>

                    <div className="p-6 bg-primary/5 border border-primary/20 rounded-3xl space-y-4">
                        <h3 className="font-black text-sm flex items-center gap-2 text-primary uppercase">
                            <FileText size={16} /> Próximos Vencimientos
                        </h3>
                        <div className="space-y-3">
                            <div className="flex items-center gap-3 p-3 bg-card rounded-2xl border border-border text-[10px]">
                                <div className="h-8 w-8 rounded-lg bg-primary/10 flex items-center justify-center font-bold text-primary">18</div>
                                <div className="flex flex-col">
                                    <span className="font-black">IVA (F.2002)</span>
                                    <span className="text-muted-foreground">Presentación DDJJ Mensual</span>
                                </div>
                            </div>
                            <div className="flex items-center gap-3 p-3 bg-card rounded-2xl border border-border text-[10px]">
                                <div className="h-8 w-8 rounded-lg bg-orange-500/10 flex items-center justify-center font-bold text-orange-600">22</div>
                                <div className="flex flex-col">
                                    <span className="font-black">SIRE (Retenciones)</span>
                                    <span className="text-muted-foreground">Ingreso de pagos</span>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* Modal Gasto */}
            {showGastoModal && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-background/80 backdrop-blur-sm animate-in fade-in duration-200">
                    <div className="bg-card w-full max-w-md border border-border rounded-3xl shadow-2xl overflow-hidden animate-in zoom-in-95 duration-200">
                        <div className="p-6 border-b border-border flex justify-between items-center bg-muted/20">
                            <h2 className="text-lg font-black tracking-tight">Nuevo Gasto Operativo</h2>
                            <button onClick={() => setShowGastoModal(false)} className="p-2 hover:bg-muted rounded-xl transition-colors"><X size={20} /></button>
                        </div>
                        <form onSubmit={handleCrearGasto} className="p-8 space-y-6">
                            <div className="space-y-2">
                                <label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">Categoría</label>
                                <select
                                    name="categoria"
                                    className="w-full bg-background border border-border rounded-xl px-4 py-3 focus:ring-2 focus:ring-primary/20 outline-none transition-all text-sm font-bold"
                                >
                                    <option value="SUELDOS">Sueldos y Cargas Sociales</option>
                                    <option value="ALQUILER">Alquiler / Expensas</option>
                                    <option value="SERVICIOS">Servicios (Luz, Internet, Agua)</option>
                                    <option value="LOGISTICA">Combustible / Mantenimiento Vehículo</option>
                                    <option value="ADMINISTRATIVO">Honorarios / Papelería</option>
                                    <option value="OTROS">Otros Gastos</option>
                                </select>
                            </div>
                            <div className="space-y-2">
                                <label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">Descripción</label>
                                <input name="descripcion" required className="w-full bg-background border border-border rounded-xl px-4 py-3 focus:ring-2 focus:ring-primary/20 outline-none transition-all text-sm" placeholder="Ej: Pago internet Movistar" />
                            </div>
                            <div className="grid grid-cols-2 gap-4">
                                <div className="space-y-2">
                                    <label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">Monto ($)</label>
                                    <input name="monto" type="number" step="0.01" required className="w-full bg-background border border-border rounded-xl px-4 py-3 focus:ring-2 focus:ring-primary/20 outline-none transition-all text-sm font-black" />
                                </div>
                                <div className="space-y-2">
                                    <label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">Médoto</label>
                                    <select name="metodoPago" className="w-full bg-background border border-border rounded-xl px-4 py-3 focus:ring-2 focus:ring-primary/20 outline-none transition-all text-sm font-bold">
                                        <option value="EFECTIVO">Efectivo</option>
                                        <option value="TRANSFERENCIA">Transferencia</option>
                                        <option value="CHEQUE">Cheque</option>
                                    </select>
                                </div>
                            </div>
                            <button
                                disabled={isPending}
                                className="w-full py-4 bg-primary text-primary-foreground rounded-2xl font-black uppercase text-xs tracking-widest shadow-xl shadow-primary/20 hover:scale-[1.02] active:scale-95 transition-all flex items-center justify-center gap-2"
                            >
                                {isPending ? <Loader2 className="animate-spin" /> : "Registrar Salida"}
                            </button>
                        </form>
                    </div>
                </div>
            )}

            {/* Modal Impuesto */}
            {showImpuestoModal && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-background/80 backdrop-blur-sm animate-in fade-in duration-200">
                    <div className="bg-card w-full max-w-md border border-border rounded-3xl shadow-2xl overflow-hidden animate-in zoom-in-95 duration-200">
                        <div className="p-6 border-b border-border flex justify-between items-center bg-primary/5">
                            <h2 className="text-lg font-black tracking-tight">Carga Impositiva Manual</h2>
                            <button onClick={() => setShowImpuestoModal(false)} className="p-2 hover:bg-muted rounded-xl transition-colors"><X size={20} /></button>
                        </div>
                        <form onSubmit={handleCrearImpuesto} className="p-8 space-y-6">
                            <div className="space-y-2">
                                <label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">Tipo de Movimiento</label>
                                <select
                                    name="tipo"
                                    className="w-full bg-background border border-border rounded-xl px-4 py-3 focus:ring-2 focus:ring-primary/20 outline-none transition-all text-sm font-bold"
                                >
                                    <option value="PERCEPCION_IVA">Percepción IVA Recibida</option>
                                    <option value="RETENCION_IVA">Retención IVA Recibida</option>
                                    <option value="PERCEPCION_IIBB">Percepción IIBB Recibida</option>
                                    <option value="RETENCION_IIBB">Retención IIBB Recibida</option>
                                    <option value="LEY_CHEQUE">Pago Imp. Ley Cheque (Bancario)</option>
                                </select>
                            </div>
                            <div className="space-y-2">
                                <label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">Monto ($)</label>
                                <input name="monto" type="number" step="0.01" required className="w-full bg-background border border-border rounded-xl px-4 py-3 focus:ring-2 focus:ring-primary/20 outline-none transition-all text-sm font-black" />
                            </div>
                            <div className="space-y-2">
                                <label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">Origen / Referencia</label>
                                <input name="referencia" className="w-full bg-background border border-border rounded-xl px-4 py-3 focus:ring-2 focus:ring-primary/20 outline-none transition-all text-sm" placeholder="Ej: Compra a Fábrica X / Banco Nación" />
                                <input type="hidden" name="operacion" value="MANUAL" />
                            </div>
                            <button
                                disabled={isPending}
                                className="w-full py-4 bg-slate-900 text-white rounded-2xl font-black uppercase text-xs tracking-widest shadow-xl hover:bg-slate-800 transition-all flex items-center justify-center gap-2"
                            >
                                {isPending ? <Loader2 className="animate-spin" /> : "Impactar en Balance"}
                            </button>
                        </form>
                    </div>
                </div>
            )}
        </div>
    )
}
