'use client'

import {
    Area,
    AreaChart,
    ResponsiveContainer,
    Tooltip,
    XAxis,
    YAxis,
    CartesianGrid
} from 'recharts'

interface Props {
    data: { name: string; ingresos: number; gastos: number }[]
}

export default function GraficoActividad({ data }: Props) {
    return (
        <div className="h-[350px] w-full">
            <ResponsiveContainer width="100%" height="100%">
                <AreaChart
                    data={data}
                    margin={{
                        top: 10,
                        right: 10,
                        left: 0,
                        bottom: 0,
                    }}
                >
                    <defs>
                        <linearGradient id="colorIngresos" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="5%" stopColor="#10b981" stopOpacity={0.1} />
                            <stop offset="95%" stopColor="#10b981" stopOpacity={0} />
                        </linearGradient>
                        <linearGradient id="colorGastos" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="5%" stopColor="#f43f5e" stopOpacity={0.1} />
                            <stop offset="95%" stopColor="#f43f5e" stopOpacity={0} />
                        </linearGradient>
                    </defs>
                    <CartesianGrid vertical={false} strokeDasharray="3 3" stroke="#f1f5f9" />
                    <XAxis
                        dataKey="name"
                        stroke="#94a3b8"
                        fontSize={12}
                        tickLine={false}
                        axisLine={false}
                        dy={10}
                    />
                    <YAxis
                        stroke="#94a3b8"
                        fontSize={12}
                        tickLine={false}
                        axisLine={false}
                        tickFormatter={(value) => `$${value.toLocaleString()}`}
                        width={80}
                    />
                    <Tooltip
                        content={({ active, payload }) => {
                            if (active && payload && payload.length) {
                                return (
                                    <div className="rounded-lg border bg-white p-3 shadow-xl">
                                        <p className="font-bold text-slate-900 mb-2 border-b pb-1">
                                            {payload[0].payload.name}
                                        </p>
                                        <div className="space-y-1.5">
                                            {payload.map((item: any) => (
                                                <div key={item.dataKey} className="flex items-center justify-between gap-8">
                                                    <span className={`text-[10px] uppercase font-bold tracking-wider ${item.dataKey === 'ingresos' ? 'text-emerald-500' : 'text-rose-500'}`}>
                                                        {item.dataKey === 'ingresos' ? 'Ingresos' : 'Gastos'}
                                                    </span>
                                                    <span className={`font-bold ${item.dataKey === 'ingresos' ? 'text-emerald-600' : 'text-rose-600'}`}>
                                                        ${item.value?.toLocaleString()}
                                                    </span>
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                )
                            }
                            return null
                        }}
                    />
                    <Area
                        type="monotone"
                        dataKey="ingresos"
                        stroke="#10b981"
                        strokeWidth={3}
                        fillOpacity={1}
                        fill="url(#colorIngresos)"
                        activeDot={{ r: 6, strokeWidth: 0, fill: '#10b981' }}
                    />
                    <Area
                        type="monotone"
                        dataKey="gastos"
                        stroke="#f43f5e"
                        strokeWidth={3}
                        fillOpacity={1}
                        fill="url(#colorGastos)"
                        activeDot={{ r: 6, strokeWidth: 0, fill: '#f43f5e' }}
                    />
                </AreaChart>
            </ResponsiveContainer>
        </div>
    )
}
