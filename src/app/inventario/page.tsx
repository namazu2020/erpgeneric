import { obtenerProductos, obtenerCategorias, obtenerMarcas, obtenerProveedores } from '@/actions/productos-actions'
import FormularioProducto from '@/components/inventario/FormularioProducto'
import TablaProductos from '@/components/inventario/TablaProductos'
import ModalCargaMasiva from '@/components/inventario/ModalCargaMasiva'
import InventarioToolbar from '@/components/inventario/InventarioToolbar'
import Link from 'next/link'

export const dynamic = 'force-dynamic'

export default async function InventarioPage({
    searchParams,
}: {
    searchParams: Promise<{ q?: string, categoriaId?: string, marcaId?: string, proveedorId?: string }>
}) {
    const params = await searchParams
    const filters = {
        query: params.q,
        categoriaId: params.categoriaId,
        marcaId: params.marcaId,
        proveedorId: params.proveedorId
    }

    // Parallel data fetching
    const [
        { productos, error },
        categorias,
        marcas,
        proveedores
    ] = await Promise.all([
        obtenerProductos(filters),
        obtenerCategorias(),
        obtenerMarcas(),
        obtenerProveedores()
    ])

    return (
        <div className="min-h-screen bg-gray-50/50 p-6 md:p-8 font-sans">
            <div className="mx-auto max-w-7xl space-y-6">

                {/* Header Premium con Breadcrumbs y Acciones */}
                <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
                    <div className="space-y-1">
                        <div className="flex items-center gap-2 text-sm text-gray-500 mb-1">
                            <Link href="/" className="hover:text-gray-900 transition-colors">Dashboard</Link>
                            <span>/</span>
                            <span className="text-gray-900 font-medium">Inventario</span>
                        </div>
                        <h1 className="text-3xl font-bold tracking-tight text-gray-900">Productos</h1>
                        <p className="text-gray-500">Gestiona tu catálogo, precios y existencias.</p>
                    </div>

                    <div className="flex items-center gap-3">
                        <ModalCargaMasiva />
                        <FormularioProducto />
                    </div>

                </div>

                {/* Barra de Herramientas Interactiva */}
                <InventarioToolbar
                    categorias={categorias}
                    marcas={marcas}
                    proveedores={proveedores}
                />

                {/* Sección de Listado */}
                <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
                    {error ? (
                        <div className="p-8 text-center text-red-600 bg-red-50">
                            <p className="font-medium">Error al cargar datos</p>
                            <p className="text-sm opacity-80">{error}</p>
                        </div>
                    ) : (
                        <div className="min-h-[400px]">
                            <TablaProductos productos={productos || []} />
                        </div>
                    )}
                </div>
            </div>
        </div>
    )
}
