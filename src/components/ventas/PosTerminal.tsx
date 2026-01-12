'use client'

import { Producto, Cliente } from '@prisma/client'
import { useState, useMemo, useRef, useEffect, useTransition } from 'react'
import { Search, ShoppingCart, Plus, Minus, CreditCard, Banknote, Package, Loader2, ChevronsRight, Trash, ScanBarcode, User, Sparkles, Filter, X, ChevronDown, Tags, Truck, DollarSign, Bookmark, Info } from 'lucide-react'
import { registrarVenta } from '@/actions/ventas-actions'
import { useRouter } from 'next/navigation'
import clsx from 'clsx'

// Categories from DB + "Todos"
interface Category {
    id: string
    nombre: string
}

interface ProductoFrontend extends Omit<Producto, 'precioCompra' | 'precioVenta'> {
    precioCompra: number;
    precioVenta: number;
}

interface ClienteFrontend extends Omit<Cliente, 'saldoActual' | 'limiteCredito'> {
    saldoActual: number;
    limiteCredito: number | null;
}

interface Props {
    productosIniciales: ProductoFrontend[]
    clientesIniciales: ClienteFrontend[]
    cajaAbiertaManual: boolean
    categorias: Category[]
}

interface CartItem extends ProductoFrontend {
    cantidadCarrito: number
}

// Helper for generating consistent "Avatar" colors for products without images
const getProductColor = (name: string) => {
    const colors = [
        "from-blue-400/20 to-blue-600/20 text-blue-600",
        "from-violet-400/20 to-violet-600/20 text-violet-600",
        "from-emerald-400/20 to-emerald-600/20 text-emerald-600",
        "from-amber-400/20 to-amber-600/20 text-amber-600",
        "from-rose-400/20 to-rose-600/20 text-rose-600",
        "from-cyan-400/20 to-cyan-600/20 text-cyan-600",
        "from-fuchsia-400/20 to-fuchsia-600/20 text-fuchsia-600",
    ]
    let hash = 0;
    for (let i = 0; i < name.length; i++) {
        hash = name.charCodeAt(i) + ((hash << 5) - hash);
    }
    return colors[Math.abs(hash) % colors.length];
}

export default function PosTerminal({ productosIniciales, clientesIniciales, cajaAbiertaManual, categorias = [] }: Props) {
    const [query, setQuery] = useState('')
    const [viewMode, setViewMode] = useState<'GRID' | 'LIST'>('LIST')
    const [carrito, setCarrito] = useState<CartItem[]>([])
    const [clienteSeleccionado, setClienteSeleccionado] = useState<string>("")
    const [isPending, startTransition] = useTransition()
    const searchInputRef = useRef<HTMLInputElement>(null)
    const router = useRouter()

    // Advanced Filters State
    const [showFilters, setShowFilters] = useState(false)
    const [filterCategory, setFilterCategory] = useState("TODOS")
    const [filterBrand, setFilterBrand] = useState("TODOS")
    const [filterProvider, setFilterProvider] = useState("TODOS")
    const [minPrice, setMinPrice] = useState<string>('')
    const [maxPrice, setMaxPrice] = useState<string>('')

    // Derived filter data from products
    const brands = useMemo(() => {
        const set = new Set<string>()
        productosIniciales.forEach(p => {
            (p as any).compatibilidades?.forEach((c: any) => {
                if (c.marca?.nombre) set.add(c.marca.nombre)
            })
        })
        return ["TODOS", ...Array.from(set).sort()]
    }, [productosIniciales])

    const providers = useMemo(() => {
        const set = new Set(productosIniciales.map(p => (p as any).proveedor?.nombre).filter(Boolean))
        return ["TODOS", ...Array.from(set).sort()]
    }, [productosIniciales])


    // --- SEARCH LOGIC ---
    useEffect(() => {
        // Auto-focus search on mount and after actions
        const handleKeyDown = (e: KeyboardEvent) => {
            // F1 Focus Search
            if (e.key === 'F1') { e.preventDefault(); searchInputRef.current?.focus() }
            // ESC Clear Search
            if (e.key === 'Escape') { setQuery(''); searchInputRef.current?.blur() }
        }
        window.addEventListener('keydown', handleKeyDown)
        return () => window.removeEventListener('keydown', handleKeyDown)
    }, [])

    const productosFiltrados = useMemo(() => {
        let items = productosIniciales

        // 1. SMART SEARCH (Multi-field)
        if (query) {
            const lowerQ = query.toLowerCase()
            items = items.filter(p => {
                const pExt = p as any
                const compatSearch = pExt.compatibilidades?.map((c: any) =>
                    `${c.marca?.nombre} ${c.modelo?.nombre} ${c.anioDesde} ${c.anioHasta}`
                ).join(' ') || ''

                const searchFields = [
                    p.nombre,
                    p.sku,
                    p.descripcion || '',
                    p.codigoFabrica || '',
                    compatSearch
                ].join(' ').toLowerCase()
                return searchFields.includes(lowerQ)
            })
        }

        // 2. ADVANCED FILTERS
        if (filterCategory !== "TODOS") {
            items = items.filter(p => (p as any).categoriaId === filterCategory)
        }
        if (filterBrand !== "TODOS") {
            items = items.filter(p =>
                (p as any).compatibilidades?.some((c: any) => c.marca?.nombre === filterBrand)
            )
        }
        if (filterProvider !== "TODOS") {
            items = items.filter(p => (p as any).proveedor?.nombre === filterProvider)
        }
        if (minPrice) {
            items = items.filter(p => p.precioVenta >= parseFloat(minPrice))
        }
        if (maxPrice) {
            items = items.filter(p => p.precioVenta <= parseFloat(maxPrice))
        }

        // Default limit if no filters active
        const isFiltering = query || filterCategory !== "TODOS" || filterBrand !== "TODOS" || filterProvider !== "TODOS" || minPrice || maxPrice
        if (!isFiltering) {
            items = items.slice(0, 100)
        }

        return items
    }, [query, productosIniciales, filterCategory, filterBrand, filterProvider, minPrice, maxPrice])

    // --- CART LOGIC ---
    const agregarAlCarrito = (producto: ProductoFrontend) => {
        setCarrito(prev => {
            const existe = prev.find(item => item.id === producto.id)
            if (existe) {
                if (existe.cantidadCarrito >= producto.stockActual) return prev;
                return prev.map(item =>
                    item.id === producto.id ? { ...item, cantidadCarrito: item.cantidadCarrito + 1 } : item
                )
            }
            return [{ ...producto, cantidadCarrito: 1 }, ...prev] // Add new to top
        })
        // Feedback sound or toast could go here
    }

    const removerDelCarrito = (id: string, todo = false) => {
        setCarrito(prev => {
            if (todo) return prev.filter(i => i.id !== id)
            return prev.map(item =>
                item.id === id ? { ...item, cantidadCarrito: item.cantidadCarrito - 1 } : item
            ).filter(item => item.cantidadCarrito > 0)
        })
    }

    // --- PRICING LOGIC ---
    const clienteDataActual = useMemo(() =>
        clientesIniciales.find(c => c.id === clienteSeleccionado),
        [clienteSeleccionado, clientesIniciales])

    const getPrecioFinal = (p: ProductoFrontend) => {
        const conIva = p.precioVenta * (1 + p.tasaIva / 100)
        if (clienteDataActual?.descuentoEspecial) {
            return conIva * (1 - (clienteDataActual.descuentoEspecial / 100))
        }
        return conIva
    }

    const total = carrito.reduce((acc, item) => acc + (getPrecioFinal(item) * item.cantidadCarrito), 0)

    // --- CHECKOUT LOGIC ---
    const handleCobrar = (metodo: string = 'EFECTIVO') => {
        if (!cajaAbiertaManual) {
            if (confirm('⚠️ La caja está cerrada. Para realizar cualquier venta debe abrirla primero.\n\n¿Desea ir al módulo de Caja ahora?')) {
                router.push('/caja')
            }
            return
        }

        if (carrito.length === 0) return

        const msg = metodo === 'CUENTA_CORRIENTE'
            ? `¿Cargar $${total.toLocaleString('es-AR')} a la Cuenta Corriente de ${clienteDataActual?.nombre}?`
            : `¿Procesar venta por $${total.toLocaleString('es-AR')}?`

        if (confirm(msg)) {
            startTransition(async () => {
                const itemsVenta = carrito.map(i => ({ id: i.id, cantidadCarrito: i.cantidadCarrito }))
                const clienteId = clienteSeleccionado !== "" ? clienteSeleccionado : null
                const res = await registrarVenta(itemsVenta, clienteId, metodo)

                if (res?.success) {
                    setCarrito([])
                    setClienteSeleccionado("")
                    setQuery("")
                    router.refresh()
                } else alert('Error: ' + res?.error)
            })
        }
    }

    return (
        <div className="flex h-full w-full bg-slate-50/50">
            {/* =========================================================================================
                                                LEFT PANEL: CATALOG (70%)
               ========================================================================================= */}
            <div className="flex-1 flex flex-col h-full min-w-0">

                {/* 1. TOP BAR: Search & Filters */}
                <div className="shrink-0 p-6 z-40 space-y-4">
                    <div className="flex flex-col md:flex-row gap-4 items-center max-w-6xl">
                        {/* Search Input - Floating Style */}
                        <div className="relative group flex-1 w-full shadow-lg shadow-black/5 rounded-2xl">
                            <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-muted-foreground group-focus-within:text-primary transition-colors">
                                <Search className="h-5 w-5" />
                            </div>
                            <input
                                ref={searchInputRef}
                                type="text"
                                value={query}
                                onChange={(e) => setQuery(e.target.value)}
                                placeholder="Búsqueda inteligente (nombre, sku, marca, modelo...)"
                                className="block w-full rounded-2xl border-0 py-4 pl-12 pr-4 text-foreground bg-white ring-1 ring-inset ring-black/5 placeholder:text-muted-foreground/40 focus:ring-2 focus:ring-inset focus:ring-primary/50 sm:text-lg font-medium transition-all"
                                autoFocus
                            />
                            <div className="absolute inset-y-0 right-0 pr-4 flex items-center gap-2">
                                {query && (
                                    <button onClick={() => { setQuery(''); searchInputRef.current?.focus() }} className="text-muted-foreground hover:text-foreground">
                                        <X size={16} />
                                    </button>
                                )}
                                <kbd className="hidden md:inline-flex items-center gap-1 rounded border border-black/5 bg-slate-100 px-2 py-0.5 text-[10px] font-bold text-muted-foreground uppercase tracking-wider">
                                    F1
                                </kbd>
                            </div>
                        </div>

                        {/* Filter Button */}
                        <button
                            onClick={() => setShowFilters(!showFilters)}
                            className={clsx(
                                "flex items-center gap-2 px-6 py-4 rounded-2xl font-bold text-sm transition-all active:scale-95 shadow-lg shadow-black/5",
                                showFilters || filterCategory !== 'TODOS' || filterBrand !== 'TODOS' || filterProvider !== 'TODOS' || minPrice || maxPrice
                                    ? "bg-slate-900 text-white"
                                    : "bg-white text-slate-600 hover:bg-slate-50 border border-black/5"
                            )}
                        >
                            <Filter size={18} />
                            <span>Filtros</span>
                            {(filterCategory !== 'TODOS' || filterBrand !== 'TODOS' || filterProvider !== 'TODOS' || minPrice || maxPrice) && (
                                <span className="flex h-2 w-2 rounded-full bg-primary animate-pulse" />
                            )}
                        </button>

                        {/* View Toggle */}
                        <div className="flex bg-white p-1 rounded-2xl border border-black/5 shadow-sm">
                            <button
                                onClick={() => setViewMode('GRID')}
                                className={clsx(
                                    "p-3 rounded-xl transition-all",
                                    viewMode === 'GRID' ? "bg-slate-900 text-white shadow-md" : "text-slate-400 hover:text-slate-600"
                                )}
                            >
                                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><rect width="7" height="7" x="3" y="3" rx="1" /><rect width="7" height="7" x="14" y="3" rx="1" /><rect width="7" height="7" x="14" y="14" rx="1" /><rect width="7" height="7" x="3" y="14" rx="1" /></svg>
                            </button>
                            <button
                                onClick={() => setViewMode('LIST')}
                                className={clsx(
                                    "p-3 rounded-xl transition-all",
                                    viewMode === 'LIST' ? "bg-slate-900 text-white shadow-md" : "text-slate-400 hover:text-slate-600"
                                )}
                            >
                                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><line x1="8" x2="21" y1="6" y2="6" /><line x1="8" x2="21" y1="12" y2="12" /><line x1="8" x2="21" y1="18" y2="18" /><line x1="3" x2="3.01" y1="6" y2="6" /><line x1="3" x2="3.01" y1="12" y2="12" /><line x1="3" x2="3.01" y1="18" y2="18" /></svg>
                            </button>
                        </div>
                    </div>

                    {/* Collapsible Filter Panel */}
                    {showFilters && (
                        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 p-6 bg-white rounded-3xl border border-black/5 shadow-xl animate-in fade-in slide-in-from-top-4 duration-200">
                            {/* Category Filter */}
                            <div className="space-y-2">
                                <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 flex items-center gap-2">
                                    <Bookmark size={12} /> Categoría
                                </label>
                                <select
                                    value={filterCategory}
                                    onChange={(e) => setFilterCategory(e.target.value)}
                                    className="w-full bg-slate-50 border-none rounded-xl py-2 px-3 text-sm font-bold focus:ring-2 focus:ring-primary/20 appearance-none outline-none"
                                >
                                    <option value="TODOS">Todas las categorías</option>
                                    {categorias.map(c => (
                                        <option key={c.id} value={c.id}>{c.nombre}</option>
                                    ))}
                                </select>
                            </div>

                            {/* Brand Filter */}
                            <div className="space-y-2">
                                <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 flex items-center gap-2">
                                    <Tags size={12} /> Marca
                                </label>
                                <select
                                    value={filterBrand}
                                    onChange={(e) => setFilterBrand(e.target.value)}
                                    className="w-full bg-slate-50 border-none rounded-xl py-2 px-3 text-sm font-bold focus:ring-2 focus:ring-primary/20 appearance-none outline-none"
                                >
                                    {brands.map(b => (
                                        <option key={b} value={b}>{b === 'TODOS' ? 'Todas las marcas' : b}</option>
                                    ))}
                                </select>
                            </div>

                            {/* Provider Filter */}
                            <div className="space-y-2">
                                <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 flex items-center gap-2">
                                    <Truck size={12} /> Proveedor
                                </label>
                                <select
                                    value={filterProvider}
                                    onChange={(e) => setFilterProvider(e.target.value)}
                                    className="w-full bg-slate-50 border-none rounded-xl py-2 px-3 text-sm font-bold focus:ring-2 focus:ring-primary/20 appearance-none outline-none"
                                >
                                    {providers.map(p => (
                                        <option key={p} value={p}>{p === 'TODOS' ? 'Todos los proveedores' : p}</option>
                                    ))}
                                </select>
                            </div>

                            {/* Price Range */}
                            <div className="space-y-2">
                                <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 flex items-center gap-2">
                                    <DollarSign size={12} /> Rango de Precio
                                </label>
                                <div className="flex gap-2 items-center">
                                    <input
                                        type="number"
                                        placeholder="Min"
                                        value={minPrice}
                                        onChange={(e) => setMinPrice(e.target.value)}
                                        className="w-full bg-slate-50 border-none rounded-xl py-2 px-3 text-sm font-bold outline-none"
                                    />
                                    <span className="text-slate-300">-</span>
                                    <input
                                        type="number"
                                        placeholder="Max"
                                        value={maxPrice}
                                        onChange={(e) => setMaxPrice(e.target.value)}
                                        className="w-full bg-slate-50 border-none rounded-xl py-2 px-3 text-sm font-bold outline-none"
                                    />
                                </div>
                            </div>

                            {/* Reset Button */}
                            <div className="md:col-span-4 flex justify-end border-t border-slate-50 pt-4">
                                <button
                                    onClick={() => {
                                        setFilterCategory("TODOS")
                                        setFilterBrand("TODOS")
                                        setFilterProvider("TODOS")
                                        setMinPrice('')
                                        setMaxPrice('')
                                    }}
                                    className="text-xs font-black uppercase tracking-widest text-rose-500 hover:text-rose-600 transition-colors"
                                >
                                    Limpiar Filtros
                                </button>
                            </div>
                        </div>
                    )}
                </div>

                <div className="flex-1 flex overflow-hidden">

                    {/* 3. PRODUCT CATALOG (GRID/LIST) */}
                    <div className="flex-1 overflow-y-auto px-6 pb-6 content-start scroll-smooth">
                        {productosFiltrados.length === 0 ? (
                            <div className="flex flex-col items-center justify-center h-full text-muted-foreground/40 gap-4">
                                <div className="bg-white p-6 rounded-full shadow-sm">
                                    <Package size={64} strokeWidth={1} />
                                </div>
                                <p className="font-medium text-lg">No encontramos productos</p>
                            </div>
                        ) : (
                            viewMode === 'GRID' ? (
                                <div className="grid grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5 gap-4">
                                    {productosFiltrados.map((producto) => {
                                        const precio = getPrecioFinal(producto)
                                        const sinStock = producto.stockActual <= 0
                                        const colorClass = getProductColor(producto.nombre)

                                        return (
                                            <button
                                                key={producto.id}
                                                onClick={() => !sinStock && agregarAlCarrito(producto)}
                                                disabled={sinStock}
                                                className={clsx(
                                                    "group relative flex flex-col text-left p-5 h-full rounded-3xl bg-white transition-all duration-300",
                                                    sinStock
                                                        ? "opacity-60 grayscale cursor-not-allowed border border-transparent"
                                                        : "hover:shadow-[0_8px_30px_rgb(0,0,0,0.04)] hover:-translate-y-1 border border-transparent hover:border-primary/10 cursor-pointer shadow-sm"
                                                )}
                                            >
                                                {/* Dynamic Header */}
                                                <div className="flex justify-between items-start mb-4">
                                                    <div className={clsx(
                                                        "h-14 w-14 rounded-2xl bg-linear-to-br flex items-center justify-center transition-transform duration-300 group-hover:scale-110 shadow-inner",
                                                        colorClass
                                                    )}>
                                                        <Package size={24} />
                                                    </div>
                                                    <div className={clsx(
                                                        "px-2 py-1 rounded-lg text-[10px] font-black uppercase tracking-wider",
                                                        sinStock ? "bg-stone-100 text-stone-500" : "bg-emerald-50 text-emerald-600"
                                                    )}>
                                                        {sinStock ? 'Agotado' : 'Stock'}
                                                    </div>
                                                </div>

                                                {/* Info */}
                                                <div className="flex-1 min-w-0 space-y-1 mb-4">
                                                    <h3 className="font-bold text-foreground leading-snug line-clamp-2 text-sm lg:text-[15px] group-hover:text-primary transition-colors">
                                                        {producto.nombre}
                                                    </h3>
                                                    <p className="text-[10px] font-medium text-muted-foreground/60 uppercase tracking-wider truncate">
                                                        {producto.sku}
                                                    </p>
                                                </div>

                                                {/* Price Footer */}
                                                <div className="pt-3 border-t border-slate-50 flex items-center justify-between">
                                                    <span className="text-lg font-black text-foreground tracking-tight">
                                                        ${precio.toLocaleString('es-AR')}
                                                    </span>
                                                    {!sinStock && (
                                                        <div className="h-8 w-8 rounded-xl bg-primary/5 text-primary flex items-center justify-center opacity-0 scale-75 group-hover:opacity-100 group-hover:scale-100 transition-all duration-300">
                                                            <Plus size={18} />
                                                        </div>
                                                    )}
                                                </div>
                                            </button>
                                        )
                                    })}
                                </div>
                            ) : (
                                <div className="bg-white rounded-3xl border border-black/5 shadow-sm overflow-hidden">
                                    <table className="w-full text-left border-collapse">
                                        <thead>
                                            <tr className="bg-slate-50/50 border-b border-black/5">
                                                <th className="px-6 py-4 text-[10px] font-black uppercase tracking-widest text-slate-400">Producto / SKU</th>
                                                <th className="px-6 py-4 text-[10px] font-black uppercase tracking-widest text-slate-400">Precio (c/ IVA)</th>
                                                <th className="px-6 py-4 text-[10px] font-black uppercase tracking-widest text-slate-400">Stock Disp.</th>
                                                <th className="px-6 py-4 text-[10px] font-black uppercase tracking-widest text-slate-400 text-right">Acción</th>
                                            </tr>
                                        </thead>
                                        <tbody className="divide-y divide-black/5">
                                            {productosFiltrados.map((producto) => {
                                                const precio = getPrecioFinal(producto)
                                                const sinStock = producto.stockActual <= 0
                                                const colorClass = getProductColor(producto.nombre)

                                                return (
                                                    <tr
                                                        key={producto.id}
                                                        onClick={() => !sinStock && agregarAlCarrito(producto)}
                                                        className={clsx(
                                                            "group transition-colors cursor-pointer",
                                                            sinStock ? "opacity-50 grayscale bg-slate-50/50" : "hover:bg-slate-50/50"
                                                        )}
                                                    >
                                                        <td className="px-6 py-4">
                                                            <div className="flex items-center gap-4">
                                                                <div className={clsx("h-10 w-10 shrink-0 rounded-xl bg-linear-to-br flex items-center justify-center", colorClass)}>
                                                                    <Package size={16} />
                                                                </div>
                                                                <div className="flex flex-col min-w-0">
                                                                    <span className="font-bold text-sm text-foreground truncate">{producto.nombre}</span>
                                                                    <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest">{producto.sku}</span>
                                                                </div>
                                                            </div>
                                                        </td>
                                                        <td className="px-6 py-4 font-black text-sm">
                                                            ${precio.toLocaleString('es-AR')}
                                                        </td>
                                                        <td className="px-6 py-4">
                                                            <div className={clsx(
                                                                "px-2 py-1 rounded-lg text-[10px] font-black uppercase tracking-wider inline-block",
                                                                sinStock ? "bg-rose-50 text-rose-500" : "bg-emerald-50 text-emerald-600"
                                                            )}>
                                                                {producto.stockActual} Unid.
                                                            </div>
                                                        </td>
                                                        <td className="px-6 py-4 text-right">
                                                            <button
                                                                disabled={sinStock}
                                                                className="h-10 w-10 ml-auto flex items-center justify-center rounded-xl bg-primary text-primary-foreground shadow-lg shadow-primary/10 transition-all active:scale-90 disabled:opacity-0"
                                                            >
                                                                <Plus size={18} strokeWidth={3} />
                                                            </button>
                                                        </td>
                                                    </tr>
                                                )
                                            })}
                                        </tbody>
                                    </table>
                                </div>
                            )
                        )}
                    </div>
                </div>
            </div>

            {/* =========================================================================================
                                                RIGHT PANEL: SMART CART (30%)
               ========================================================================================= */}
            <div className="w-[400px] xl:w-[450px] shrink-0 bg-white border-l border-slate-100 flex flex-col shadow-2xl shadow-black/5 relative z-30">
                {/* 1. CART HEADER */}
                <div className="p-6 pb-4 border-b border-slate-50 bg-white/80 backdrop-blur-md space-y-4">
                    <div className="flex items-center justify-between">
                        <h2 className="font-black text-xl tracking-tight flex items-center gap-2 text-slate-800">
                            <ShoppingCart className="text-primary fill-primary/20" strokeWidth={2.5} size={24} />
                            Ticket
                        </h2>
                        <span className="text-[10px] font-black px-2 mt-1 py-1 rounded-lg bg-slate-100 text-slate-500 uppercase tracking-widest">
                            {carrito.length} Items
                        </span>
                    </div>

                    {/* Client Selector & Balance */}
                    <div className="space-y-3">
                        <div className="relative group">
                            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                <User className="h-4 w-4 text-slate-400 group-focus-within:text-primary transition-colors" />
                            </div>
                            <select
                                value={clienteSeleccionado}
                                onChange={(e) => setClienteSeleccionado(e.target.value)}
                                className="w-full bg-slate-50 hover:bg-slate-100 text-sm font-bold rounded-xl py-3 pl-10 pr-8 text-slate-700 outline-none focus:ring-2 focus:ring-primary/20 appearance-none transition-all cursor-pointer border border-transparent focus:border-primary/20"
                            >
                                <option value="">Consumidor Final</option>
                                {clientesIniciales.map(c => (
                                    <option key={c.id} value={c.id}>
                                        {c.nombre} {c.descuentoEspecial ? `(⭐ -${c.descuentoEspecial}%)` : ''}
                                    </option>
                                ))}
                            </select>
                            <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 h-4 w-4 pointer-events-none" />
                        </div>

                        {/* Balance Indicator */}
                        {clienteDataActual && (
                            <div className={clsx(
                                "flex items-center justify-between p-3 rounded-2xl border transition-all animate-in slide-in-from-top-2 duration-300",
                                clienteDataActual.saldoActual < 0
                                    ? "bg-emerald-50 border-emerald-100/50 text-emerald-700"
                                    : clienteDataActual.saldoActual > 0
                                        ? "bg-amber-50 border-amber-100/50 text-amber-700"
                                        : "bg-slate-50 border-slate-100 text-slate-500"
                            )}>
                                <div className="flex items-center gap-2">
                                    <div className={clsx(
                                        "p-1.5 rounded-lg",
                                        clienteDataActual.saldoActual < 0 ? "bg-emerald-500/10" : "bg-amber-500/10"
                                    )}>
                                        <DollarSign size={14} strokeWidth={3} />
                                    </div>
                                    <span className="text-[10px] font-black uppercase tracking-widest">
                                        {clienteDataActual.saldoActual < 0 ? 'Saldo a Favor' : clienteDataActual.saldoActual > 0 ? 'Deuda Pendiente' : 'Cuenta al Día'}
                                    </span>
                                </div>
                                <span className="font-black text-sm tracking-tight">
                                    ${Math.abs(clienteDataActual.saldoActual).toLocaleString('es-AR')}
                                </span>
                            </div>
                        )}
                    </div>
                </div>

                {/* 2. CART ITEMS LIST */}
                <div className="flex-1 overflow-y-auto p-4 content-start space-y-2 bg-slate-50/30">
                    {carrito.length === 0 ? (
                        <div className="h-full flex flex-col items-center justify-center text-slate-300 space-y-4">
                            <Sparkles size={48} strokeWidth={1.5} className="ml-4" />
                            <div className="text-center space-y-1">
                                <p className="font-bold text-slate-400">El carrito está vacío</p>
                                <p className="text-xs text-slate-400/70">Comienza a escanear productos</p>
                            </div>
                        </div>
                    ) : (
                        carrito.map((item) => {
                            const unitPrice = getPrecioFinal(item)
                            return (
                                <div key={item.id} className="group relative flex items-center gap-3 p-3 pr-4 rounded-2xl bg-white border border-slate-100 shadow-sm transition-all hover:shadow-md hover:border-primary/10">
                                    {/* Qty Controls */}
                                    <div className="flex flex-col items-center gap-1">
                                        <button onClick={() => agregarAlCarrito(item)} className="h-6 w-6 flex items-center justify-center rounded-lg hover:bg-slate-100 text-slate-400 hover:text-slate-900 transition-colors"><Plus size={10} strokeWidth={4} /></button>
                                        <span className="text-sm font-black w-6 text-center text-slate-700">{item.cantidadCarrito}</span>
                                        <button onClick={() => removerDelCarrito(item.id)} className="h-6 w-6 flex items-center justify-center rounded-lg hover:bg-rose-50 text-slate-400 hover:text-rose-600 transition-colors"><Minus size={10} strokeWidth={4} /></button>
                                    </div>

                                    {/* Product Icon Small */}
                                    <div className={clsx("h-10 w-10 shrink-0 rounded-xl bg-linear-to-br flex items-center justify-center", getProductColor(item.nombre))}>
                                        <Package size={16} />
                                    </div>

                                    {/* Info */}
                                    <div className="flex-1 min-w-0">
                                        <p className="font-bold text-sm text-slate-700 truncate leading-tight">{item.nombre}</p>
                                        <div className="flex items-center gap-2 mt-0.5">
                                            <span className="text-[10px] font-medium text-slate-400 bg-slate-100 px-1.5 py-0.5 rounded-md">
                                                ${unitPrice.toLocaleString()}
                                            </span>
                                            {item.cantidadCarrito > 1 &&
                                                <span className="text-xs font-bold text-primary">
                                                    Total: ${(unitPrice * item.cantidadCarrito).toLocaleString()}
                                                </span>
                                            }
                                        </div>
                                    </div>

                                    {/* Delete Action (Top Right absolute or side) */}
                                    <button
                                        onClick={() => removerDelCarrito(item.id, true)}
                                        className="opacity-0 group-hover:opacity-100 p-2 text-slate-300 hover:text-rose-500 transition-all absolute top-2 right-2 md:static"
                                    >
                                        <Trash size={14} />
                                    </button>
                                </div>
                            )
                        })
                    )}
                </div>

                {/* 3. CHECKOUT FOOTER */}
                <div className="shrink-0 p-6 bg-white shadow-[0_-10px_40px_rgba(0,0,0,0.03)] z-40">
                    {/* Totals Summary */}
                    <div className="space-y-3 mb-6">
                        <div className="flex justify-between text-slate-500 text-sm font-medium">
                            <span>Subtotal</span>
                            <span>${total.toLocaleString('es-AR')}</span>
                        </div>
                        {clienteDataActual?.descuentoEspecial && (
                            <div className="flex justify-between text-emerald-600 text-sm font-bold bg-emerald-50 px-2 py-1 rounded-lg">
                                <span className="flex items-center gap-1">✨ Descuento Cliente</span>
                                <span>-{clienteDataActual.descuentoEspecial}%</span>
                            </div>
                        )}
                        <div className="flex justify-between items-end pt-4 border-t border-slate-100">
                            <span className="text-lg font-bold text-slate-800">Total</span>
                            <span className="text-4xl font-black text-slate-900 tracking-tighter">
                                ${total.toLocaleString('es-AR')}
                            </span>
                        </div>
                    </div>

                    {/* Pay Buttons Section */}
                    <div className="space-y-3">
                        {/* Caja State Warning */}
                        {!cajaAbiertaManual && (
                            <div className="flex items-center gap-2 justify-center py-2 px-3 rounded-xl bg-rose-50 border border-rose-100 mb-2 animate-pulse">
                                <Info size={14} className="text-rose-500" />
                                <span className="text-[10px] font-black uppercase tracking-widest text-rose-600">Caja Cerrada - Ventas Inhabilitadas</span>
                            </div>
                        )}

                        <div className="grid grid-cols-2 gap-3">
                            {/* EFECTIVO - Dark Pattern */}
                            <button
                                onClick={() => handleCobrar('EFECTIVO')}
                                disabled={isPending || carrito.length === 0}
                                className={clsx(
                                    "relative h-28 rounded-3xl flex flex-col items-center justify-center gap-2 transition-all active:scale-[0.96] disabled:opacity-50 shadow-xl group overflow-hidden border-2",
                                    !cajaAbiertaManual
                                        ? "bg-stone-50 border-stone-100 grayscale cursor-not-allowed"
                                        : "bg-[#0f172a] border-transparent shadow-slate-900/10"
                                )}
                            >
                                <div className={clsx(
                                    "p-2 rounded-xl transition-all duration-300 group-hover:scale-110",
                                    !cajaAbiertaManual ? "bg-stone-100 text-stone-400" : "bg-emerald-500/10 text-emerald-400"
                                )}>
                                    <Banknote size={28} strokeWidth={2} />
                                </div>
                                <span className={clsx(
                                    "text-xs font-black uppercase tracking-[0.2em]",
                                    !cajaAbiertaManual ? "text-stone-400" : "text-white"
                                )}>Efectivo</span>
                            </button>

                            {/* TARJETA - White Pattern */}
                            <button
                                onClick={() => handleCobrar('TARJETA')}
                                disabled={isPending || carrito.length === 0}
                                className={clsx(
                                    "h-28 rounded-3xl flex flex-col items-center justify-center gap-2 transition-all active:scale-[0.96] disabled:opacity-50 group shadow-sm border-2",
                                    !cajaAbiertaManual
                                        ? "bg-stone-50 border-stone-100 grayscale cursor-not-allowed opacity-60"
                                        : "bg-white border-slate-100 hover:border-blue-500/30 hover:bg-blue-50/50 text-slate-900 hover:shadow-xl hover:shadow-blue-500/5"
                                )}
                            >
                                <div className={clsx(
                                    "p-2 rounded-xl transition-all duration-300 group-hover:scale-110",
                                    !cajaAbiertaManual ? "bg-stone-100 text-stone-400" : "bg-blue-50 text-blue-500"
                                )}>
                                    <CreditCard size={28} strokeWidth={2} />
                                </div>
                                <span className={clsx(
                                    "text-xs font-black uppercase tracking-[0.2em]",
                                    !cajaAbiertaManual ? "text-stone-400" : "text-slate-500 group-hover:text-blue-600"
                                )}>Tarjeta</span>
                            </button>
                        </div>

                        {/* CUENTA CORRIENTE - Big Bottom Button */}
                        <button
                            onClick={() => handleCobrar('CUENTA_CORRIENTE')}
                            disabled={isPending || carrito.length === 0 || !clienteSeleccionado}
                            className={clsx(
                                "w-full h-16 rounded-3xl flex items-center justify-center gap-4 transition-all active:scale-[0.98] disabled:opacity-40 font-black uppercase tracking-[0.15em] text-[11px] border-2",
                                !cajaAbiertaManual
                                    ? "bg-stone-50 border-stone-100 text-stone-300 grayscale cursor-not-allowed"
                                    : clienteSeleccionado
                                        ? "bg-amber-50 text-amber-700 border-amber-200 hover:bg-amber-100 shadow-lg shadow-amber-900/5"
                                        : "bg-slate-50/50 text-slate-300 border-slate-100 cursor-not-allowed"
                            )}
                        >
                            {isPending ? (
                                <Loader2 className="animate-spin" />
                            ) : (
                                <User className={clsx("h-5 w-5", !cajaAbiertaManual || !clienteSeleccionado ? "text-slate-200" : "text-amber-600")} strokeWidth={3} />
                            )}
                            {!cajaAbiertaManual
                                ? "Caja Cerrada"
                                : clienteSeleccionado
                                    ? `Cargar a Cuenta de ${clienteDataActual?.nombre}`
                                    : "Seleccionar Cliente para Cta. Cte."}
                        </button>
                    </div>
                </div>
            </div>
        </div>
    )
}
