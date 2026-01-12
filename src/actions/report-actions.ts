'use server'

import prisma from '@/lib/prisma'
import { startOfMonth, endOfMonth, eachDayOfInterval, format, startOfDay, endOfDay, subDays } from 'date-fns'
import { es } from 'date-fns/locale'
import { getSession } from "@/lib/auth-helper"

export async function getReporteData(startDate?: Date, endDate?: Date) {
    const session = await getSession()
    const tenantId = (session?.user as any)?.tenantId

    if (!tenantId) {
        throw new Error("No autorizado: No se encontró tenantId")
    }

    const today = endDate || new Date()
    const last30Days = startDate || subDays(today, 29)

    // 1. Optimización: Ventas por día usando Agregación SQL (date_trunc)
    // Evitamos traer miles de registros a memoria y delegamos el GROUP BY a PostgreSQL
    const statsPorDia: any[] = await prisma.$queryRaw`
        SELECT 
            date_trunc('day', fecha) as dia, 
            SUM(total)::FLOAT as total, 
            COUNT(*)::INT as cantidad
        FROM ventas
        WHERE "tenantId" = ${tenantId} 
          AND fecha >= ${startOfDay(last30Days)} 
          AND fecha <= ${endOfDay(today)}
        GROUP BY dia
        ORDER BY dia ASC
    `;

    // Generar array de todos los días para que el gráfico no tenga huecos
    const diasIntervalo = eachDayOfInterval({ start: last30Days, end: today })

    const ventasPorDia = diasIntervalo.map(dia => {
        const diaUTC = startOfDay(dia).toISOString();
        const stat = statsPorDia.find(s =>
            new Date(s.dia).toISOString().split('T')[0] === diaUTC.split('T')[0]
        );

        return {
            fecha: format(dia, 'dd/MM', { locale: es }),
            total: stat ? stat.total : 0,
            ventas: stat ? stat.cantidad : 0
        }
    })

    // 2. Top Productos (más vendidos por cantidad)
    const topProductosRaw = await prisma.detalleVenta.groupBy({
        by: ['productoId'],
        where: {
            tenantId,
            venta: {
                fecha: {
                    gte: startOfDay(last30Days),
                    lte: endOfDay(today)
                }
            }
        },
        _sum: {
            cantidad: true,
            subtotal: true
        },
        orderBy: {
            _sum: {
                cantidad: 'desc'
            }
        },
        take: 5
    })


    const productosIds = topProductosRaw.map(p => p.productoId)
    const productosInfo = await prisma.producto.findMany({
        where: {
            id: { in: productosIds },
            tenantId
        }
    })

    const topProductos = topProductosRaw.map(p => ({
        nombre: productosInfo.find(info => info.id === p.productoId)?.nombre || 'Desconocido',
        cantidad: p._sum.cantidad || 0,
        total: Number(p._sum.subtotal || 0)
    }))

    // 3. Métricas Generales (KPIs)
    // Usamos agregaciones nativas para mayor velocidad
    const kpiVentas = await prisma.venta.aggregate({
        where: {
            tenantId,
            fecha: {
                gte: startOfDay(last30Days),
                lte: endOfDay(today)
            }
        },
        _sum: { total: true },
        _count: { id: true }
    })

    const totalVendido = Number(kpiVentas._sum.total) || 0
    const cantidadVentas = kpiVentas._count.id || 0
    const ticketPromedio = cantidadVentas > 0 ? totalVendido / cantidadVentas : 0

    // Comparación con periodo anterior (ej. 30 días previos a los últimos 30)
    const periodoAnteriorInicio = subDays(last30Days, 30)
    const ventasAnteriores = await prisma.venta.aggregate({
        _sum: { total: true },
        where: {
            tenantId,
            fecha: {
                gte: startOfDay(periodoAnteriorInicio),
                lte: endOfDay(subDays(last30Days, 1))
            }
        }
    })
    const totalAnterior = Number(ventasAnteriores._sum.total) || 0
    const crecimiento = totalAnterior > 0 ? ((totalVendido - totalAnterior) / totalAnterior) * 100 : 0

    return {
        ventasPorDia,
        topProductos,
        kpis: {
            totalVendido,
            ticketPromedio,
            cantidadVentas,
            crecimiento
        }
    }
}


