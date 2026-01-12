import { obtenerProductos } from '@/actions/productos-actions'
import { obtenerClientes } from '@/actions/clientes-actions'
import { obtenerCajaActual } from '@/actions/caja-actions'
import { getCategorias } from '@/actions/categorias-actions'
import PosTerminal from '@/components/ventas/PosTerminal'

export const dynamic = 'force-dynamic'

export default async function VentasPage() {
    // Obtenemos productos, clientes y estado de la caja para el POS
    const [productosData, clientesData, cajaData, categoriasData] = await Promise.all([
        obtenerProductos({}),
        obtenerClientes(''),
        obtenerCajaActual(),
        getCategorias()
    ])

    const cajaAbierta = !!cajaData.caja

    return (
        <div className="h-[calc(100vh-6rem)] md:h-[calc(100vh-3rem)] w-full overflow-hidden bg-background">
            <PosTerminal
                productosIniciales={productosData.productos || []}
                clientesIniciales={clientesData.clientes || []}
                categorias={categoriasData}
                cajaAbiertaManual={cajaAbierta}
            />
        </div>
    )
}
