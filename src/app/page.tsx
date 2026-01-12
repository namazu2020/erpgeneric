import {
  Users,
  DollarSign,
  Package,
  Activity,
  ArrowUpRight,
  TrendingUp
} from 'lucide-react'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import prisma from '@/lib/prisma'
import { startOfDay, endOfDay } from 'date-fns'
import { getSession } from "@/lib/auth-helper"
import GraficoActividad from '@/components/dashboard/GraficoActividad'

export const dynamic = 'force-dynamic'

// Función para obtener KPIs reales de la base de datos
async function getDashboardData(tenantId: string) {
  const today = new Date()
  const sevenDaysAgo = new Date()
  sevenDaysAgo.setDate(today.getDate() - 6) // Last 7 days including today

  // 1. Total Productos
  const totalProductos = await prisma.producto.count({
    where: { tenantId }
  })

  // 2. Productos Bajo Stock
  const bajoStock = await prisma.producto.count({
    where: {
      tenantId,
      stockActual: { lte: prisma.producto.fields.stockMinimo }
    }
  })

  // 3. Ventas de Hoy
  const ventasHoy = await prisma.venta.aggregate({
    _sum: { total: true },
    _count: { id: true },
    where: {
      tenantId,
      fecha: {
        gte: startOfDay(today),
        lte: endOfDay(today)
      }
    }
  })

  // 4. Últimas 5 ventas
  const ultimasVentas = await prisma.venta.findMany({
    where: { tenantId },
    take: 5,
    orderBy: { fecha: 'desc' },
    include: {
      items: { include: { producto: true } }
    }
  })

  // 5. Historial de Actividad (últimos 7 días)
  const [ventasHistorialRaw, gastosHistorialRaw] = await Promise.all([
    prisma.venta.findMany({
      where: {
        tenantId,
        fecha: { gte: startOfDay(sevenDaysAgo) }
      },
      select: { fecha: true, total: true }
    }),
    prisma.gasto.findMany({
      where: {
        tenantId,
        fecha: { gte: startOfDay(sevenDaysAgo) }
      },
      select: { fecha: true, monto: true }
    })
  ])

  // Agrupar por día (Ingresos vs Gastos)
  const dailyActivity = Array.from({ length: 7 }).map((_, i) => {
    const d = new Date(sevenDaysAgo)
    d.setDate(d.getDate() + i)
    const dayStr = d.toLocaleDateString('es-AR', { weekday: 'short', day: 'numeric' })

    const ingresos = ventasHistorialRaw
      .filter(v => v.fecha.toDateString() === d.toDateString())
      .reduce((sum, v) => sum + Number(v.total), 0)

    const gastos = gastosHistorialRaw
      .filter(g => g.fecha.toDateString() === d.toDateString())
      .reduce((sum, g) => sum + Number(g.monto), 0)

    return {
      name: dayStr,
      ingresos,
      gastos
    }
  })

  return {
    totalProductos,
    bajoStock,
    ingresosHoy: Number(ventasHoy._sum.total || 0),
    ventasCountHoy: ventasHoy._count.id,
    ultimasVentas: ultimasVentas.map(v => ({
      ...v,
      total: Number(v.total),
      items: v.items.map(i => ({
        ...i,
        precioUnitario: Number(i.precioUnitario),
        subtotal: Number(i.subtotal),
        producto: {
          ...i.producto,
          precioCompra: Number(i.producto.precioCompra),
          precioVenta: Number(i.producto.precioVenta)
        }
      }))
    })),
    dailyActivity
  }
}

export default async function DashboardPage() {
  const session = await getSession()
  if (!session?.user) return redirect('/login')

  const tenantId = (session?.user as any)?.tenantId || 'system'

  const data = await getDashboardData(tenantId)

  // Mapeamos los datos reales a la estructura visual de KPIs
  const kpiStats = [
    {
      title: 'Ingresos Hoy',
      value: `$${data.ingresosHoy.toLocaleString('es-AR', { minimumFractionDigits: 2 })}`,
      change: `+${data.ventasCountHoy} ventas hoy`,
      trend: 'up',
      icon: DollarSign,
      color: 'text-emerald-600'
    },
    {
      title: 'Productos en Catálogo',
      value: data.totalProductos.toString(),
      change: 'Inventario activo',
      trend: 'neutral',
      icon: Package,
      color: 'text-blue-600'
    },
    {
      title: 'Alertas de Stock',
      value: data.bajoStock.toString(),
      change: 'Productos bajo mínimo',
      trend: 'down', // 'down' en rojo es bueno para alertas? No, rojo es alerta.
      icon: Activity, // O AlertTriangle
      color: 'text-orange-600'
    },
    {
      title: 'Usuarios Activos',
      value: '1', // Hardcode MVP
      change: 'Sesión actual',
      trend: 'neutral',
      icon: Users,
      color: 'text-violet-600'
    },
  ]

  return (
    <div className="flex-1 space-y-8 p-8 pt-6">
      <div className="flex items-center justify-between space-y-2">
        <div>
          <h2 className="text-3xl font-bold tracking-tight text-gray-900">Dashboard</h2>
          <p className="text-muted-foreground">Resumen de operaciones en tiempo real.</p>
        </div>
        <div className="flex items-center space-x-2">
          <button className="inline-flex items-center justify-center rounded-md text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:pointer-events-none disabled:opacity-50 bg-primary text-primary-foreground shadow hover:bg-primary/90 h-9 px-4 py-2">
            Descargar Reporte
          </button>
        </div>
      </div>

      {/* KPI Cards Grid */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {kpiStats.map((stat, i) => (
          <div key={i} className="rounded-xl border bg-card text-card-foreground shadow-sm">
            <div className="p-6 flex flex-row items-center justify-between space-y-0 pb-2">
              <h3 className="tracking-tight text-sm font-medium text-gray-500">{stat.title}</h3>
              <stat.icon className={`h-4 w-4 ${stat.color}`} />
            </div>
            <div className="p-6 pt-0">
              <div className="text-2xl font-bold">{stat.value}</div>
              <p className="text-xs text-muted-foreground flex items-center mt-1">
                {stat.title === 'Alertas de Stock' && Number(stat.value) > 0 ? (
                  <span className="text-red-500 font-bold mr-1">¡Atención!</span>
                ) : (
                  <ArrowUpRight className="mr-1 h-3 w-3 text-green-500" />
                )}
                <span className={stat.title === 'Alertas de Stock' && Number(stat.value) > 0 ? 'text-red-600' : 'text-gray-500'}>
                  {stat.change}
                </span>
              </p>
            </div>
          </div>
        ))}
      </div>

      {/* Main Content Grid */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-7">

        {/* Chart Section (REAL DATA) */}
        <div className="col-span-4 rounded-xl border bg-card text-card-foreground shadow-sm">
          <div className="flex flex-col space-y-1.5 p-6 pb-2">
            <h3 className="font-semibold leading-none tracking-tight">Actividad Reciente</h3>
            <p className="text-sm text-muted-foreground">Flujo de caja diario (Ingresos vs Gastos).</p>
          </div>
          <div className="p-6 pt-0">
            <GraficoActividad data={data.dailyActivity} />
          </div>
        </div>

        {/* Recent Sales List (REAL DATA) */}
        <div className="col-span-3 rounded-xl border bg-card text-card-foreground shadow-sm">
          <div className="flex flex-col space-y-1.5 p-6">
            <h3 className="font-semibold leading-none tracking-tight">Últimas Ventas</h3>
            <p className="text-sm text-muted-foreground">Transacciones procesadas hoy.</p>
          </div>
          <div className="p-6 pt-0">
            <div className="space-y-6">
              {data.ultimasVentas.length === 0 ? (
                <div className="text-center py-8 text-gray-400">
                  <p>No hay ventas registradas aún.</p>
                  <Link href="/ventas" className="text-blue-500 text-sm hover:underline mt-2 inline-block">Ir al POS</Link>
                </div>
              ) : (
                data.ultimasVentas.map((venta) => (
                  <div key={venta.id} className="flex items-center justify-between group p-2 hover:bg-muted/50 rounded-lg transition-colors -mx-2">
                    <div className="flex items-center gap-3">
                      <div className="relative flex h-9 w-9 shrink-0 overflow-hidden rounded-full bg-emerald-100 items-center justify-center text-emerald-700 font-bold text-xs dark:bg-emerald-900/50 dark:text-emerald-400">
                        $
                      </div>
                      <div className="space-y-1">
                        <p className="text-sm font-medium leading-none text-foreground">
                          Venta #{venta.id.split('-')[0]}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          {new Date(venta.fecha).toLocaleTimeString('es-AR', { hour: '2-digit', minute: '2-digit' })} • {venta.items.reduce((sum, item) => sum + item.cantidad, 0)} unidades
                        </p>
                      </div>
                    </div>
                    <div className="font-bold text-foreground">
                      ${venta.total.toLocaleString()}
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Quick Actions Footer */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        <Link href="/inventario" className="group relative overflow-hidden rounded-xl border border-border bg-linear-to-br from-card to-muted p-6 shadow-sm hover:shadow-md transition-all">
          <div className="flex flex-col space-y-2">
            <span className="font-semibold text-foreground">Gestionar Inventario</span>
            <span className="text-sm text-muted-foreground">Añadir productos, ajustar stock.</span>
          </div>
          <Package className="absolute right-4 bottom-4 h-16 w-16 text-gray-100 group-hover:text-gray-200 transition-colors -rotate-12" />
        </Link>
        <Link href="/ventas" className="group relative overflow-hidden rounded-xl border bg-linear-to-br from-slate-900 to-slate-800 p-6 shadow-sm hover:shadow-md transition-all text-white">
          <div className="flex flex-col space-y-2">
            <span className="font-semibold">Nueva Venta</span>
            <span className="text-sm text-slate-300">Ir al terminal de punto de venta.</span>
          </div>
          <DollarSign className="absolute right-4 bottom-4 h-16 w-16 text-slate-700/50 group-hover:text-slate-600/50 transition-colors -rotate-12" />
        </Link>
      </div>
    </div>
  )
}
