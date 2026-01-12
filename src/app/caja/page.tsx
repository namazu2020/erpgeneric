import { obtenerCajaActual, obtenerCajasAnteriores } from '@/actions/caja-actions'
import PanelCaja from '@/components/caja/PanelCaja'
import { Wallet } from 'lucide-react'

export const dynamic = 'force-dynamic'

export default async function CajaPage() {
    const { caja } = await obtenerCajaActual()
    const { cajas } = await obtenerCajasAnteriores()

    return (
        <div className="flex-1 space-y-8 p-8 pt-6 min-h-screen bg-background">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <h2 className="text-3xl font-bold tracking-tight text-foreground">Control de Caja</h2>
                    <p className="text-muted-foreground">Gestiona los ingresos y egresos de efectivo del día.</p>
                </div>
                <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-primary/10 text-primary border border-primary/20">
                    <Wallet className="h-6 w-6" />
                </div>
            </div>

            <PanelCaja cajaInicial={caja || null} historialCajas={cajas || []} />
        </div>
    )
}
