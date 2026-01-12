import { obtenerClientes } from '@/actions/clientes-actions'
import FormularioCliente from '@/components/clientes/FormularioCliente'
import TablaClientes from '@/components/clientes/TablaClientes'
import { Users, Search, Filter } from 'lucide-react'

export const dynamic = 'force-dynamic'

export default async function ClientesPage({ searchParams }: { searchParams: { q?: string } }) {
    // Await searchParams in Next.js 15+ (though 14 allows sync access, best practice is await if treating as promise)
    // En Next 16.1 canary a veces es async, en stable sync. TypeScript podría quejarse.
    // Asumiremos sync por ahora o usaremos un trick.

    // Simplificación MVP: No paginación, carga todo.
    const { clientes } = await obtenerClientes('')

    return (
        <div className="flex-1 space-y-8 p-8 pt-6 min-h-screen bg-gray-50/50">
            {/* Header */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <div className="flex items-center gap-2 text-gray-500 text-sm mb-1">
                        <span>Dashboard</span>
                        <span>/</span>
                        <span className="font-medium text-gray-900">Clientes</span>
                    </div>
                    <h2 className="text-3xl font-bold tracking-tight text-gray-900">Gestión de Clientes</h2>
                    <p className="text-gray-500">Administra tu base de datos de compradores.</p>
                </div>

                <div className="flex items-center gap-2">
                    <button className="flex items-center gap-2 px-4 py-2 bg-white border border-gray-200 rounded-lg text-sm font-medium hover:bg-gray-50 text-gray-700 shadow-sm transition-all">
                        <Filter className="h-4 w-4" />
                        Exportar CSV
                    </button>
                    <FormularioCliente />
                </div>
            </div>

            {/* Search Bar */}
            <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                <input
                    type="text"
                    placeholder="Buscar clientes por nombre o empresa..."
                    className="w-full bg-white border border-gray-200 pl-10 pr-4 py-3 rounded-xl text-sm focus:outline-none focus:ring-4 focus:ring-gray-100 transition-all shadow-sm"
                />
            </div>

            {/* Table */}
            <TablaClientes clientes={clientes || []} />
        </div>
    )
}
