'use client'

import { useEffect, useState } from 'react'
import { getReporteData } from '@/actions/report-actions'
import {
    BarChart,
    Bar,
    XAxis,
    YAxis,
    CartesianGrid,
    Tooltip,
    ResponsiveContainer,
    AreaChart,
    Area,
    PieChart,
    Pie,
    Cell
} from 'recharts'
import {
    TrendingUp,
    TrendingDown,
    DollarSign,
    ShoppingCart,
    Package,
    ArrowUpRight,
    Calendar
} from 'lucide-react'

import DateRangeSelector from '@/components/reportes/DateRangeSelector'
import { parseISO, subMonths, subDays } from 'date-fns'

const COLORS = ['#0ea5e9', '#6366f1', '#8b5cf6', '#ec4899', '#f43f5e'];

export default function ReportesPage() {
    const [data, setData] = useState<any>(null)
    const [loading, setLoading] = useState(true)

    // Default: Últimos 7 días (Client-side only to avoid hydration mismatch)
    const [startDate, setStartDate] = useState<Date | null>(null)
    const [endDate, setEndDate] = useState<Date | null>(null)

    useEffect(() => {
        // Initialize on client side
        setEndDate(new Date())
        setStartDate(subDays(new Date(), 7))
    }, [])

    useEffect(() => {
        async function load() {
            if (!startDate || !endDate) return
            setLoading(true)
            // Llamamos al server action con el rango definido
            const res = await getReporteData(startDate, endDate)
            setData(res)
            setLoading(false)
        }
        load()
    }, [startDate, endDate])


    const { kpis, ventasPorDia, topProductos } = data || { kpis: {}, ventasPorDia: [], topProductos: [] }

    return (
        <div className="p-8 space-y-8 pb-16">
            <div className="flex flex-col xl:flex-row xl:items-center justify-between gap-6">
                <div>
                    <h1 className="text-3xl font-bold tracking-tight text-gray-900">Analítica Avanzada</h1>
                    <p className="text-muted-foreground flex items-center gap-1 mt-1">
                        <Calendar size={14} />
                        {startDate && endDate && (
                            <>Visualizando métricas desde el <span className="font-medium text-foreground">{startDate.toLocaleDateString()}</span> hasta el <span className="font-medium text-foreground">{endDate.toLocaleDateString()}</span></>
                        )}
                    </p>
                </div>

                <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4">
                    {startDate && endDate && (
                        <DateRangeSelector
                            startDate={startDate}
                            endDate={endDate}
                            onChange={(start, end) => {
                                setStartDate(start)
                                setEndDate(end)
                            }}
                        />
                    )}

                    <div className="bg-emerald-50 text-emerald-700 px-4 py-2 rounded-xl text-xs font-bold border border-emerald-100 flex items-center gap-2 h-full shadow-sm">
                        <TrendingUp size={16} />
                        <span>{kpis?.crecimiento ? kpis.crecimiento.toFixed(1) : 0}% vs periodo anterior</span>
                    </div>
                </div>
            </div>

            {(loading || !data) ? (
                <div className="flex h-96 items-center justify-center">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
                </div>
            ) : (
                <>
                    {/* KPI Cards */}
                    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
                        <KPICard
                            title="Ventas Totales"
                            value={`$${kpis.totalVendido.toLocaleString()}`}
                            desc="Ingresos brutos"
                            icon={DollarSign}
                            color="text-blue-600"
                            bg="bg-blue-50"
                        />
                        <KPICard
                            title="Ticket Promedio"
                            value={`$${kpis.ticketPromedio.toLocaleString()}`}
                            desc="Por cada transacción"
                            icon={ArrowUpRight}
                            color="text-indigo-600"
                            bg="bg-indigo-50"
                        />
                        <KPICard
                            title="Transacciones"
                            value={kpis.cantidadVentas.toString()}
                            desc="Ventas procesadas"
                            icon={ShoppingCart}
                            color="text-emerald-600"
                            bg="bg-emerald-50"
                        />
                        <KPICard
                            title="Top Producto"
                            value={topProductos[0]?.nombre || '---'}
                            desc="El más vendido"
                            icon={Package}
                            color="text-orange-600"
                            bg="bg-orange-50"
                        />
                    </div>

                    <div className="grid gap-6 lg:grid-cols-7">
                        {/* Ventas por Día - AreaChart */}
                        <div className="col-span-4 bg-white p-6 rounded-xl border shadow-sm">
                            <h3 className="text-lg font-bold mb-6 text-gray-800">Tendencia de Ingresos</h3>
                            <div className="h-[300px] w-full">
                                <ResponsiveContainer width="100%" height="100%">
                                    <AreaChart data={ventasPorDia}>
                                        <defs>
                                            <linearGradient id="colorTotal" x1="0" y1="0" x2="0" y2="1">
                                                <stop offset="5%" stopColor="#0ea5e9" stopOpacity={0.1} />
                                                <stop offset="95%" stopColor="#0ea5e9" stopOpacity={0} />
                                            </linearGradient>
                                        </defs>
                                        <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                                        <XAxis dataKey="fecha" axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: '#64748b' }} />
                                        <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: '#64748b' }} />
                                        <Tooltip
                                            contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 4px 12px rgba(0,0,0,0.1)' }}
                                            formatter={(value: any) => [`$${value.toLocaleString()}`, 'Total']}
                                        />
                                        <Area type="monotone" dataKey="total" stroke="#0ea5e9" strokeWidth={3} fillOpacity={1} fill="url(#colorTotal)" />
                                    </AreaChart>
                                </ResponsiveContainer>
                            </div>
                        </div>

                        {/* Top Productos - BarChart Horizontal */}
                        <div className="col-span-3 bg-white p-6 rounded-xl border shadow-sm">
                            <h3 className="text-lg font-bold mb-6 text-gray-800">Productos Estrella (Cant.)</h3>
                            <div className="h-[300px] w-full">
                                <ResponsiveContainer width="100%" height="100%">
                                    <BarChart data={topProductos} layout="vertical" margin={{ left: 40 }}>
                                        <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="#f1f5f9" />
                                        <XAxis type="number" hide />
                                        <YAxis dataKey="nombre" type="category" axisLine={false} tickLine={false} tick={{ fontSize: 11, fill: '#475569' }} width={80} />
                                        <Tooltip
                                            cursor={{ fill: '#f8fafc' }}
                                            contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 4px 12px rgba(0,0,0,0.1)' }}
                                        />
                                        <Bar dataKey="cantidad" radius={[0, 4, 4, 0]}>
                                            {topProductos.map((entry: any, index: number) => (
                                                <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                                            ))}
                                        </Bar>
                                    </BarChart>
                                </ResponsiveContainer>
                            </div>
                        </div>
                    </div>

                    {/* Lista de Ranking de Productos */}
                    <div className="bg-white rounded-xl border shadow-sm overflow-hidden">
                        <div className="p-6 border-b">
                            <h3 className="text-lg font-bold text-gray-800">Ranking Detallado</h3>
                        </div>
                        <div className="overflow-x-auto">
                            <table className="w-full text-left">
                                <thead className="bg-gray-50 border-b text-gray-500 uppercase text-xs font-bold">
                                    <tr>
                                        <th className="px-6 py-4">Producto</th>
                                        <th className="px-6 py-4 text-center">Unidades Vendidas</th>
                                        <th className="px-6 py-4 text-right">Total Generado</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {topProductos.map((prod: any, i: number) => (
                                        <tr key={i} className="border-b last:border-0 hover:bg-gray-50 transition-colors">
                                            <td className="px-6 py-4 font-medium text-gray-900">{prod.nombre}</td>
                                            <td className="px-6 py-4 text-center">
                                                <span className="bg-blue-50 text-blue-700 px-2 py-1 rounded-md text-sm font-bold">
                                                    {prod.cantidad}
                                                </span>
                                            </td>
                                            <td className="px-6 py-4 text-right font-bold text-emerald-600">
                                                ${prod.total.toLocaleString()}
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </div>
                </>
            )}
        </div>
    )
}

function KPICard({ title, value, desc, icon: Icon, color, bg }: any) {
    return (
        <div className="bg-white p-6 rounded-xl border shadow-sm hover:shadow-md transition-shadow">
            <div className="flex items-center justify-between mb-4">
                <div className={`${bg} ${color} p-2 rounded-lg`}>
                    <Icon size={20} />
                </div>
                <div className="text-emerald-500 bg-emerald-50 px-2 py-0.5 rounded text-[10px] font-bold">
                    + Real-time
                </div>
            </div>
            <h4 className="text-gray-500 text-sm font-medium">{title}</h4>
            <div className="text-2xl font-bold text-gray-900 mt-1">{value}</div>
            <p className="text-xs text-gray-400 mt-1">{desc}</p>
        </div>
    )
}
