
import { obtenerVentas } from '@/actions/facturacion-actions'
import TablaFacturas from '@/components/facturacion/TablaFacturas'
import FiltroFecha from '@/components/shared/FiltroFecha'
import { FileText, Download } from 'lucide-react'
import { startOfDay, endOfDay, parseISO } from 'date-fns'
import { getSession } from "@/lib/auth-helper"

export const dynamic = 'force-dynamic'

interface Props {
    searchParams: Promise<{ date?: string }>
}

export default async function FacturacionPage({ searchParams }: Props) {
    const params = await searchParams
    const selectedDate = params.date ? parseISO(params.date) : undefined

    // Obtenemos sesión para la Nota de Pedido
    const session = await getSession()
    const currentUser = {
        name: session?.user?.name,
        email: session?.user?.email
    }

    // Obtenemos el historial filtrado
    const { ventas } = await obtenerVentas(selectedDate, selectedDate)


    return (
        <div className="flex-1 space-y-8 p-8 pt-6 min-h-screen bg-background">
            {/* Header */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <div className="flex items-center gap-2 text-muted-foreground text-sm mb-1">
                        <span>Dashboard</span>
                        <span>/</span>
                        <span className="font-medium text-foreground">Facturación</span>
                    </div>
                    <h2 className="text-3xl font-bold tracking-tight text-foreground">Historial de Ventas</h2>
                    <p className="text-muted-foreground">Consulta y descarga los comprobantes emitidos.</p>
                </div>

                <div className="flex items-center gap-3">
                    <FiltroFecha />
                    <button className="flex items-center gap-2 px-4 py-2 bg-card border border-border rounded-xl text-sm font-medium hover:bg-muted text-foreground shadow-sm transition-all h-10">
                        <Download className="h-4 w-4" />
                        Exportar
                    </button>
                </div>

            </div>

            {/* Metrics Summary */}
            <div className="grid gap-4 md:grid-cols-3">
                <div className="rounded-xl border border-border bg-card p-6 shadow-sm">
                    <div className="flex items-center gap-4">
                        <div className="p-3 bg-emerald-500/10 rounded-full text-emerald-600 dark:text-emerald-400">
                            <FileText className="h-6 w-6" />
                        </div>
                        <div>
                            <p className="text-sm font-medium text-muted-foreground">Total Facturado (Mes)</p>
                            <h3 className="text-2xl font-bold text-foreground">
                                ${ventas?.reduce((acc: number, v: any) => acc + v.total, 0).toLocaleString()}
                            </h3>
                        </div>
                    </div>
                </div>
            </div>

            {/* Tabla Principal */}
            <TablaFacturas ventas={ventas || []} currentUser={currentUser} />
        </div>
    )
}
