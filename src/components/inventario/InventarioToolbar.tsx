'use client'

import { Search, Filter, X } from 'lucide-react'
import { useRouter, useSearchParams } from 'next/navigation'
import { useState, useTransition } from 'react'
import { useDebouncedCallback } from 'use-debounce'

interface Props {
    categorias: any[]
    marcas: any[]
    proveedores: any[]
}

export default function InventarioToolbar({ categorias, marcas, proveedores }: Props) {
    const searchParams = useSearchParams()
    const { replace } = useRouter()
    const [showFilters, setShowFilters] = useState(false)

    // Current Values
    const currentQuery = searchParams.get('q') || ''
    const currentCat = searchParams.get('categoriaId') || 'TODOS'
    const currentBrand = searchParams.get('marcaId') || 'TODOS'
    const currentProv = searchParams.get('proveedorId') || 'TODOS'

    const handleSearch = useDebouncedCallback((term: string) => {
        const params = new URLSearchParams(searchParams)
        if (term) {
            params.set('q', term)
        } else {
            params.delete('q')
        }
        replace(`/inventario?${params.toString()}`)
    }, 500)

    const updateFilter = (key: string, value: string) => {
        const params = new URLSearchParams(searchParams)
        if (value && value !== 'TODOS') {
            params.set(key, value)
        } else {
            params.delete(key)
        }
        replace(`/inventario?${params.toString()}`)
    }

    const clearFilters = () => {
        replace('/inventario')
    }

    const activeFiltersCount = [
        currentCat !== 'TODOS',
        currentBrand !== 'TODOS',
        currentProv !== 'TODOS'
    ].filter(Boolean).length

    return (
        <div className="space-y-4">
            <div className="rounded-xl border border-gray-200 bg-white p-4 shadow-sm flex flex-col md:flex-row gap-4 justify-between items-center transition-all">
                {/* Search Input */}
                <div className="relative w-full md:w-96 group">
                    <div className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none group-focus-within:text-primary text-gray-400 transition-colors">
                        <Search className="h-4 w-4" />
                    </div>
                    <input
                        type="text"
                        defaultValue={currentQuery}
                        onChange={(e) => handleSearch(e.target.value)}
                        placeholder="Buscar por nombre o SKU..."
                        className="block w-full rounded-lg border border-gray-200 py-2.5 pl-10 pr-3 text-sm placeholder:text-gray-400 focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary transition-all bg-gray-50 focus:bg-white"
                    />
                </div>

                {/* Filters Toggle Button */}
                <div className="flex items-center gap-2 w-full md:w-auto">
                    <button
                        onClick={() => setShowFilters(!showFilters)}
                        className={`flex-1 md:flex-none flex items-center justify-center gap-2 rounded-lg border px-4 py-2.5 text-sm font-medium transition-all active:scale-95 ${showFilters || activeFiltersCount > 0
                            ? 'border-primary bg-primary/5 text-primary shadow-sm shadow-primary/10'
                            : 'border-gray-200 bg-white text-gray-600 hover:bg-gray-50 hover:text-gray-900'
                            }`}
                    >
                        <Filter className="h-4 w-4" />
                        Filtros
                        {activeFiltersCount > 0 && (
                            <span className="bg-primary text-white text-[10px] font-bold px-1.5 py-0.5 rounded-full ml-1">
                                {activeFiltersCount}
                            </span>
                        )}
                    </button>
                    {activeFiltersCount > 0 && (
                        <button
                            onClick={clearFilters}
                            className="p-2.5 text-muted-foreground hover:text-rose-500 hover:bg-rose-50 rounded-lg transition-colors"
                            title="Limpiar filtros"
                        >
                            <X size={18} />
                        </button>
                    )}
                </div>
            </div>

            {/* Collapsible Filter Panel */}
            {showFilters && (
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 p-6 bg-white rounded-xl border border-gray-200 shadow-lg animate-in fade-in slide-in-from-top-2">
                    <div className="space-y-2">
                        <label className="text-xs font-bold uppercase text-muted-foreground tracking-wider">Categoría</label>
                        <select
                            value={currentCat}
                            onChange={(e) => updateFilter('categoriaId', e.target.value)}
                            className="w-full rounded-lg border border-gray-200 p-2.5 text-sm font-medium focus:ring-2 focus:ring-primary/20 outline-none transition-all"
                        >
                            <option value="TODOS">Todas</option>
                            {categorias.map(c => <option key={c.id} value={c.id}>{c.nombre}</option>)}
                        </select>
                    </div>

                    <div className="space-y-2">
                        <label className="text-xs font-bold uppercase text-muted-foreground tracking-wider">Marca (Vehículo)</label>
                        <select
                            value={currentBrand}
                            onChange={(e) => updateFilter('marcaId', e.target.value)}
                            className="w-full rounded-lg border border-gray-200 p-2.5 text-sm font-medium focus:ring-2 focus:ring-primary/20 outline-none transition-all"
                        >
                            <option value="TODOS">Todas</option>
                            {marcas.map(m => <option key={m.id} value={m.id}>{m.nombre}</option>)}
                        </select>
                    </div>

                    <div className="space-y-2">
                        <label className="text-xs font-bold uppercase text-muted-foreground tracking-wider">Proveedor</label>
                        <select
                            value={currentProv}
                            onChange={(e) => updateFilter('proveedorId', e.target.value)}
                            className="w-full rounded-lg border border-gray-200 p-2.5 text-sm font-medium focus:ring-2 focus:ring-primary/20 outline-none transition-all"
                        >
                            <option value="TODOS">Todos</option>
                            {proveedores.map(p => <option key={p.id} value={p.id}>{p.nombre}</option>)}
                        </select>
                    </div>
                </div>
            )}
        </div>
    )
}
