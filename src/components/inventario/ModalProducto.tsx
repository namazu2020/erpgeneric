'use client'

import { crearProducto, actualizarProducto, obtenerMarcas, obtenerModelos, crearMarca, crearModelo, obtenerProveedores, crearProveedor, obtenerCategorias, eliminarMarca, eliminarModelo, eliminarProveedor } from '@/actions/productos-actions'
import { getCategorias, createCategoria as crearCategoria, deleteCategoria } from '@/actions/categorias-actions'
import { authClient } from '@/lib/auth-client'

import { useRef, useState, useTransition, useEffect, useMemo } from 'react'
import { useRouter } from 'next/navigation'
import { X, Package, Tag, Hash, DollarSign, Layers, AlertCircle, Loader2, Plus, Calculator, Info, Truck, ScanBarcode, Trash2 } from 'lucide-react'
import clsx from 'clsx'
import type { Producto, Marca, Modelo, Proveedor, Categoria, Compatibilidad } from '@prisma/client'

interface CompatibilidadExtended extends Partial<Compatibilidad> {
    marca?: Marca;
    modelo?: Modelo;
}


interface ProductoFrontend extends Omit<Producto, 'precioCompra' | 'precioVenta'> {
    precioCompra: number;
    precioVenta: number;
}

interface Props {
    isOpen: boolean
    onClose: () => void
    productoAEditar?: (ProductoFrontend & {
        compatibilidades?: CompatibilidadExtended[],
        proveedor?: Proveedor | null,
        categoria?: Categoria | null
    }) | null
}

export default function ModalProducto({ isOpen, onClose, productoAEditar }: Props) {
    const [errores, setErrores] = useState<Record<string, string[]> | null>(null)
    const [isPending, startTransition] = useTransition()
    const router = useRouter()

    const [marcas, setMarcas] = useState<Marca[]>([])
    const [modelos, setModelos] = useState<Modelo[]>([])
    const [proveedores, setProveedores] = useState<Proveedor[]>([])
    const [categorias, setCategorias] = useState<Categoria[]>([])
    const { data: session } = authClient.useSession()
    const isAdmin = (session?.user as any)?.role === 'ADMIN'

    // Estados para cálculo de IVA y Margen
    const [compra, setCompra] = useState(0)
    const [venta, setVenta] = useState(0)
    const [iva, setIva] = useState(21.0)

    const [compats, setCompats] = useState<CompatibilidadExtended[]>([])

    useEffect(() => {
        if (isOpen) {
            setErrores(null)
            loadAux()
            if (productoAEditar) {
                setCompra(productoAEditar.precioCompra)
                setVenta(productoAEditar.precioVenta)
                setIva(productoAEditar.tasaIva)
                setCompats(productoAEditar.compatibilidades || [])
            } else {
                setCompra(0)
                setVenta(0)
                setIva(21.0)
                setCompats([])
            }
        }
    }, [isOpen, productoAEditar])

    async function loadAux() {
        const [m, mo, p, c] = await Promise.all([obtenerMarcas(), obtenerModelos(), obtenerProveedores(), obtenerCategorias()])
        setMarcas(m)
        setModelos(mo)
        setProveedores(p)
        setCategorias(c as Categoria[])
    }

    const handleAddMarca = async () => {
        const nombre = prompt('Nueva Marca:')
        if (nombre) {
            const res = await crearMarca(nombre)
            if (res.success) loadAux()
        }
    }

    const handleAddModelo = async () => {
        // Si hay una marca seleccionada, el modelo se asocia a ella
        const marcaActual = marcas.find(m => m.id === tempCompat.marcaId);
        const promptMsg = marcaActual
            ? `Nuevo Modelo para ${marcaActual.nombre}:`
            : 'Nuevo Modelo (Generico):';

        const nombre = prompt(promptMsg)
        if (nombre) {
            // Pasamos el ID de la marca seleccionada (si existe)
            const res = await crearModelo(nombre, tempCompat.marcaId)
            if (res.success) loadAux()
        }
    }

    const handleAddProveedor = async () => {
        const nombre = prompt('Nuevo Proveedor:')
        if (nombre) {
            const res = await crearProveedor(nombre)
            if (res.success) loadAux()
        }
    }

    const handleDeleteProveedor = async (id: string) => {
        if (!id) return
        if (confirm('¿Eliminar este proveedor? Se borrará solo si no tiene productos asociados.')) {
            const res = await eliminarProveedor(id)
            if (res.success) loadAux()
            else alert(res.error)
        }
    }

    const handleDeleteMarca = async (id: string) => {
        if (!id) return
        if (confirm('¿Eliminar esta marca?')) {
            const res = await eliminarMarca(id)
            if (res.success) loadAux()
            else alert(res.error)
        }
    }

    const handleDeleteModelo = async (id: string) => {
        if (!id) return
        if (confirm('¿Eliminar este modelo?')) {
            const res = await eliminarModelo(id)
            if (res.success) loadAux()
            else alert(res.error)
        }
    }

    const handleDeleteCategoria = async (id: string) => {
        if (!id) return
        if (confirm('¿Eliminar esta categoría?')) {
            const res = await deleteCategoria(id)
            if (res.success) loadAux()
            else alert(res.error)
        }
    }

    const handleAddCategoria = async () => {
        const nombre = prompt('Nueva Categoría:')
        if (nombre) {
            const res = await crearCategoria(nombre)
            if (res.success) loadAux()
            else alert(res.error)
        }
    }

    const [tempCompat, setTempCompat] = useState({ marcaId: '', modeloId: '', anioDesde: '', anioHasta: '' })

    const agregarCompatibilidad = () => {
        if (!tempCompat.marcaId || !tempCompat.modeloId) return alert('Seleccione marca y modelo')

        const marca = marcas.find(m => m.id === tempCompat.marcaId)
        const modelo = modelos.find(m => m.id === tempCompat.modeloId)

        setCompats([...compats, {
            ...tempCompat,
            marca,
            modelo,
            anioDesde: tempCompat.anioDesde ? parseInt(tempCompat.anioDesde) : null,
            anioHasta: tempCompat.anioHasta ? parseInt(tempCompat.anioHasta) : null
        }])
        setTempCompat({ marcaId: '', modeloId: '', anioDesde: '', anioHasta: '' })
    }

    const removerCompatibilidad = (index: number) => {
        setCompats(compats.filter((_, i) => i !== index))
    }

    const handleSubmit = async (formData: FormData) => {
        setErrores(null)
        startTransition(async () => {
            let resultado;
            if (productoAEditar) {
                resultado = await actualizarProducto(productoAEditar.id, formData)
            } else {
                resultado = await crearProducto(formData)
            }

            if (resultado?.error) {
                if (typeof resultado.error === 'string') {
                    setErrores({ general: [resultado.error] })
                } else {
                    setErrores(resultado.error as Record<string, string[]>)
                }
            } else if (resultado?.success) {
                onClose()
                router.refresh()
            }
        })
    }

    // Filtrado de modelos según marca seleccionada
    const modelosFiltrados = useMemo(() => {
        if (!tempCompat.marcaId) return modelos;
        // Mostrar modelos que coinciden con la marca (m.marcaId === current) OR que no tienen marca (generic/legacy)
        return modelos.filter(m => m.marcaId === tempCompat.marcaId || !m.marcaId);
    }, [modelos, tempCompat.marcaId]);

    const calculoIva = (venta * iva) / 100
    const ventaFinal = venta + calculoIva
    const margenBruto = venta > 0 ? ((venta - compra) / venta) * 100 : 0
    const gananciaAbsoluta = venta - compra

    if (!isOpen) return null

    return (
        <div className="fixed inset-0 z-100 flex items-center justify-center p-4 sm:p-6 overflow-y-auto">
            <div className="absolute inset-0 bg-black/40 backdrop-blur-sm transition-opacity" onClick={onClose} />

            <div className="relative w-full max-w-3xl bg-card rounded-2xl shadow-2xl overflow-hidden animate-in zoom-in-95 duration-200 border border-border my-8">
                {/* Header */}
                <div className="flex items-center justify-between border-b border-border bg-muted/50 px-6 py-4">
                    <div className="flex items-center gap-3">
                        <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-background border border-border shadow-sm">
                            <Package className="h-5 w-5 text-primary" />
                        </div>
                        <div>
                            <h3 className="text-lg font-bold text-foreground leading-tight">
                                {productoAEditar ? 'Editar Producto' : 'Nuevo Producto'}
                            </h3>
                            <p className="text-xs text-muted-foreground uppercase tracking-widest font-semibold mt-0.5">Automotriz & Stock</p>
                        </div>
                    </div>
                    <button onClick={onClose} className="rounded-full p-2 text-muted-foreground hover:bg-muted transition-colors">
                        <X className="h-5 w-5" />
                    </button>
                </div>

                {/* Body */}
                <div className="p-6 bg-card max-h-[80vh] overflow-y-auto scrollbar-thin scrollbar-thumb-muted">
                    <form action={handleSubmit} className="space-y-6 pb-2">
                        {/* Seccion 1: Identificación */}
                        <div className="grid gap-4 md:grid-cols-3">
                            <div className="md:col-span-2 space-y-2">
                                <label className="text-xs font-bold uppercase text-muted-foreground">Nombre / Descripción</label>
                                <input name="nombre" defaultValue={productoAEditar?.nombre} required className="w-full rounded-xl border border-input px-4 py-2.5 bg-background shadow-sm focus:ring-2 focus:ring-primary/20 transition-all outline-none" placeholder="Filtro de aceite Master" />
                                {errores?.nombre && <p className="text-[10px] text-red-500 font-bold uppercase">{errores.nombre[0]}</p>}
                            </div>
                            <div className="space-y-2">
                                <label className="text-xs font-bold uppercase text-muted-foreground">SKU / Cód. Sistema</label>
                                <input name="sku" defaultValue={productoAEditar?.sku} required className="w-full rounded-xl border border-input px-4 py-2.5 bg-muted/30 font-mono shadow-sm" placeholder="REF-1234" />
                            </div>

                            {/* Fila 2: Cód Fabrica y Proveedor */}
                            <div className="space-y-2">
                                <label className="text-xs font-bold uppercase text-muted-foreground">Cód. Fábrica</label>
                                <input name="codigoFabrica" defaultValue={productoAEditar?.codigoFabrica || ''} className="w-full rounded-xl border border-input px-4 py-2.5 bg-background shadow-sm focus:ring-2 focus:ring-primary/20 transition-all outline-none" placeholder="FAB-99" />
                            </div>
                            <div className="space-y-2">
                                <div className="flex justify-between">
                                    <label className="text-xs font-bold uppercase text-muted-foreground flex items-center gap-1"><Truck size={14} /> Proveedor</label>
                                    <button type="button" onClick={handleAddProveedor} className="text-[10px] text-primary flex items-center gap-1 hover:underline"><Plus size={10} /> Nuevo</button>
                                </div>
                                <div className="flex gap-1">
                                    <select name="proveedorId" defaultValue={productoAEditar?.proveedorId || ''} className="flex-1 rounded-xl border border-input px-4 py-2.5 bg-background shadow-sm focus:ring-2 focus:ring-primary/20 transition-all outline-none text-sm">
                                        <option value="">Seleccionar Proveedor...</option>
                                        {proveedores.map(p => <option key={p.id} value={p.id}>{p.nombre}</option>)}
                                    </select>
                                    {isAdmin && (
                                        <button
                                            type="button"
                                            onClick={() => {
                                                const id = (document.getElementsByName('proveedorId')[0] as HTMLSelectElement).value
                                                handleDeleteProveedor(id)
                                            }}
                                            className="p-2.5 text-muted-foreground hover:text-rose-500 hover:bg-rose-50 rounded-xl transition-all"
                                        >
                                            <Trash2 size={16} />
                                        </button>
                                    )}
                                </div>
                            </div>

                            {/* Fila 3: Categoría */}
                            <div className="space-y-2">
                                <div className="flex justify-between">
                                    <label className="text-xs font-bold uppercase text-muted-foreground flex items-center gap-1"><Tag size={14} /> Categoría</label>
                                    <button type="button" onClick={handleAddCategoria} className="text-[10px] text-primary flex items-center gap-1 hover:underline"><Plus size={10} /> Nueva</button>
                                </div>
                                <div className="flex gap-1">
                                    <select name="categoriaId" defaultValue={productoAEditar?.categoriaId || ''} className="flex-1 rounded-xl border border-input px-4 py-2.5 bg-background shadow-sm focus:ring-2 focus:ring-primary/20 transition-all outline-none text-sm">
                                        <option value="">Sin Categoría</option>
                                        {categorias.map(c => <option key={c.id} value={c.id}>{c.nombre}</option>)}
                                    </select>
                                    {isAdmin && (
                                        <button
                                            type="button"
                                            onClick={() => {
                                                const id = (document.getElementsByName('categoriaId')[0] as HTMLSelectElement).value
                                                handleDeleteCategoria(id)
                                            }}
                                            className="p-2.5 text-muted-foreground hover:text-rose-500 hover:bg-rose-50 rounded-xl transition-all"
                                        >
                                            <Trash2 size={16} />
                                        </button>
                                    )}
                                </div>
                            </div>
                        </div>

                        {/* Seccion 2: Compatibilidad Automotriz */}
                        <div className="space-y-4 bg-muted/20 p-4 rounded-2xl border border-border">
                            <div className="flex items-center justify-between">
                                <h4 className="text-xs font-black uppercase text-slate-500 flex items-center gap-2">
                                    <ScanBarcode size={14} /> Compatibilidad de Vehículos
                                </h4>
                                <span className="text-[10px] font-bold bg-primary/10 text-primary px-2 py-0.5 rounded-full">
                                    {compats.length} Combinaciones
                                </span>
                            </div>

                            <div className="grid grid-cols-2 md:grid-cols-5 gap-2 items-end bg-white p-3 rounded-xl border border-black/5 shadow-sm">
                                <div className="space-y-1">
                                    <div className="flex justify-between px-0.5">
                                        <label className="text-[10px] font-bold uppercase text-muted-foreground whitespace-nowrap">Marca</label>
                                        <button type="button" onClick={handleAddMarca} className="text-[9px] text-primary hover:underline hover:font-black">+ Nuevo</button>
                                    </div>
                                    <div className="flex gap-0.5 items-center">
                                        <select
                                            value={tempCompat.marcaId}
                                            onChange={e => setTempCompat({ ...tempCompat, marcaId: e.target.value })}
                                            className="flex-1 min-w-0 rounded-lg border border-input p-1.5 bg-background text-xs outline-none focus:ring-2 focus:ring-primary/20 transition-all"
                                        >
                                            <option value="">Marca...</option>
                                            {marcas.map(m => <option key={m.id} value={m.id}>{m.nombre}</option>)}
                                        </select>
                                        {isAdmin && tempCompat.marcaId && (
                                            <button
                                                type="button"
                                                onClick={() => handleDeleteMarca(tempCompat.marcaId)}
                                                className="p-1 text-muted-foreground hover:text-rose-500"
                                            >
                                                <Trash2 size={12} />
                                            </button>
                                        )}
                                    </div>
                                </div>
                                <div className="space-y-1">
                                    <div className="flex justify-between px-0.5">
                                        <label className="text-[10px] font-bold uppercase text-muted-foreground whitespace-nowrap">Modelo</label>
                                        <button type="button" onClick={handleAddModelo} className="text-[9px] text-primary hover:underline hover:font-black">+ Nuevo</button>
                                    </div>
                                    <div className="flex gap-0.5 items-center">
                                        <select
                                            value={tempCompat.modeloId}
                                            onChange={e => setTempCompat({ ...tempCompat, modeloId: e.target.value })}
                                            className="flex-1 min-w-0 rounded-lg border border-input p-1.5 bg-background text-xs outline-none focus:ring-2 focus:ring-primary/20 transition-all"
                                            disabled={!tempCompat.marcaId && modelos.length > 50}
                                        >
                                            <option value="">{tempCompat.marcaId ? 'Modelo...' : 'Seleccione Marca primero...'}</option>
                                            {modelosFiltrados.map(m => <option key={m.id} value={m.id}>{m.nombre}</option>)}
                                        </select>
                                        {isAdmin && tempCompat.modeloId && (
                                            <button
                                                type="button"
                                                onClick={() => handleDeleteModelo(tempCompat.modeloId)}
                                                className="p-1 text-muted-foreground hover:text-rose-500"
                                            >
                                                <Trash2 size={12} />
                                            </button>
                                        )}
                                    </div>
                                </div>
                                <div className="space-y-1">
                                    <label className="text-[10px] font-bold uppercase text-muted-foreground">Año Desde</label>
                                    <input
                                        type="number"
                                        value={tempCompat.anioDesde}
                                        onChange={e => setTempCompat({ ...tempCompat, anioDesde: e.target.value })}
                                        className="w-full rounded-lg border border-input p-1.5 bg-background text-xs outline-none focus:ring-2 focus:ring-primary/20 transition-all"
                                        placeholder="2010"
                                    />
                                </div>
                                <div className="space-y-1">
                                    <label className="text-[10px] font-bold uppercase text-muted-foreground">Año Hasta</label>
                                    <input
                                        type="number"
                                        value={tempCompat.anioHasta}
                                        onChange={e => setTempCompat({ ...tempCompat, anioHasta: e.target.value })}
                                        className="w-full rounded-lg border border-input p-1.5 bg-background text-xs outline-none focus:ring-2 focus:ring-primary/20 transition-all"
                                        placeholder="2024"
                                    />
                                </div>
                                <button
                                    type="button"
                                    onClick={agregarCompatibilidad}
                                    className="h-[34px] w-full items-center justify-center rounded-lg bg-slate-900 text-white hover:bg-slate-800 transition-all flex gap-1 text-[10px] font-bold"
                                >
                                    <Plus size={14} /> AGREGAR
                                </button>
                            </div>

                            {/* Lista de Compatibilidades */}
                            <div className="flex flex-wrap gap-2">
                                {
                                    compats.length === 0 ? (
                                        <p className="text-[10px] text-muted-foreground italic w-full text-center py-2 bg-white/50 rounded-lg border border-dashed border-black/10">No hay compatibilidades definidas</p>
                                    ) : (
                                        compats.map((c, i) => (
                                            <div key={i} className="flex items-center gap-2 bg-white border border-black/5 px-3 py-1.5 rounded-xl shadow-sm group animate-in zoom-in-95 duration-200">
                                                <div className="flex flex-col">
                                                    <span className="text-[11px] font-black text-slate-800">{c.marca?.nombre} {c.modelo?.nombre}</span>
                                                    <span className="text-[9px] font-bold text-muted-foreground uppercase tracking-tighter">
                                                        {c.anioDesde && c.anioHasta ? `${c.anioDesde} - ${c.anioHasta}` : c.anioDesde || c.anioHasta || 'Todo año'}
                                                    </span>
                                                </div>
                                                <button
                                                    type="button"
                                                    onClick={() => removerCompatibilidad(i)}
                                                    className="ml-2 text-muted-foreground hover:text-rose-500 transition-colors"
                                                >
                                                    <X size={14} />
                                                </button>
                                            </div>
                                        ))
                                    )
                                }
                            </div>

                            {/* Hidden field for form data */}
                            <input type="hidden" name="compatibilidades" value={
                                JSON.stringify(compats.map(c => ({
                                    marcaId: c.marcaId,
                                    modeloId: c.modeloId,
                                    anioDesde: c.anioDesde,
                                    anioHasta: c.anioHasta
                                })))
                            } />
                        </div>

                        {/* Seccion 3: Costos y Ganancias */}
                        <div className="grid gap-6 md:grid-cols-2">
                            <div className="space-y-4 border-r border-border pr-4">
                                <h4 className="flex items-center gap-2 text-xs font-bold uppercase text-gray-500"><Calculator size={14} /> Costos y Precios Netos</h4>

                                <div className="grid grid-cols-2 gap-4">
                                    <div className="space-y-1">
                                        <label className="text-[10px] font-bold uppercase">Precio Compra</label>
                                        <div className="relative">
                                            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground text-xs">$</span>
                                            <input type="number" step="0.01" name="precioCompra" value={compra} onChange={e => setCompra(Number(e.target.value))} className="w-full rounded-lg border border-input pl-7 pr-3 py-2 text-sm bg-background" />
                                        </div>
                                    </div>
                                    <div className="space-y-1">
                                        <label className="text-[10px] font-bold uppercase">Precio Venta (Neto)</label>
                                        <div className="relative">
                                            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground text-xs">$</span>
                                            <input type="number" step="0.01" name="precioVenta" value={venta} onChange={e => setVenta(Number(e.target.value))} className="w-full rounded-lg border border-input pl-7 pr-3 py-2 text-sm bg-background font-bold text-primary" />
                                        </div>
                                    </div>
                                </div>

                                <div className="space-y-1">
                                    <label className="text-[10px] font-bold uppercase">Tasa I.V.A (%)</label>
                                    <input type="number" name="tasaIva" value={iva} onChange={e => setIva(Number(e.target.value))} className="w-full rounded-lg border border-input p-2 text-sm bg-background" />
                                </div>
                            </div>

                            <div className="space-y-3 bg-primary/5 p-4 rounded-2xl border border-primary/10">
                                <h4 className="text-xs font-bold uppercase text-primary/70 flex items-center gap-2"><Info size={14} /> Resumen de Márgenes</h4>
                                <div className="space-y-2">
                                    <div className="flex justify-between text-sm">
                                        <span className="text-muted-foreground">Precio Final (C/ IVA):</span>
                                        <span className="font-bold text-foreground">${ventaFinal.toLocaleString('es-AR', { minimumFractionDigits: 2 })}</span>
                                    </div>
                                    <div className="flex justify-between text-sm">
                                        <span className="text-muted-foreground">Monto I.V.A:</span>
                                        <span className="text-gray-500 font-medium">${calculoIva.toLocaleString('es-AR', { minimumFractionDigits: 2 })}</span>
                                    </div>
                                    <div className="h-px bg-primary/10 my-2" />
                                    <div className="flex justify-between text-sm items-center">
                                        <span className="text-muted-foreground">Ganancia Bruta:</span>
                                        <span className={clsx("font-black text-lg", gananciaAbsoluta > 0 ? "text-emerald-600" : "text-red-600")}>
                                            ${gananciaAbsoluta.toLocaleString('es-AR', { minimumFractionDigits: 2 })}
                                        </span>
                                    </div>
                                    <div className="flex justify-between text-sm">
                                        <span className="text-muted-foreground">Margen de utilidad:</span>
                                        <span className={clsx("font-bold px-2 py-0.5 rounded-full text-xs", margenBruto > 30 ? "bg-emerald-100 text-emerald-700" : "bg-orange-100 text-orange-700")}>
                                            {margenBruto.toFixed(2)} %
                                        </span>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Seccion 4: Stock */}
                        <div className="grid grid-cols-2 gap-4 border-t pt-4">
                            <div className="space-y-1">
                                <label className="text-[10px] font-bold uppercase text-muted-foreground">Stock Inicial</label>
                                <input type="number" name="stockActual" defaultValue={productoAEditar?.stockActual || 0} className="w-full rounded-lg border border-input p-2 bg-background text-sm" />
                            </div>
                            <div className="space-y-1">
                                <label className="text-[10px] font-bold uppercase text-muted-foreground">Alerta Stock Bajo</label>
                                <input type="number" name="stockMinimo" defaultValue={productoAEditar?.stockMinimo || 5} className="w-full rounded-lg border border-input p-2 bg-background text-sm" />
                            </div>
                        </div>

                        {/* Footer */}
                        <div className="flex justify-end gap-3 pt-6 border-t">
                            <button type="button" onClick={onClose} className="px-6 py-2 rounded-xl text-sm font-bold text-muted-foreground hover:bg-muted transition-all">Cancelar</button>
                            <button
                                type="submit"
                                disabled={isPending}
                                className="px-8 py-2 rounded-xl bg-primary text-primary-foreground font-bold shadow-lg shadow-primary/20 hover:scale-105 active:scale-95 transition-all flex items-center gap-2"
                            >
                                {isPending ? <Loader2 className="animate-spin" size={18} /> : (productoAEditar ? 'Guardar Cambios' : 'Crear Producto')}
                            </button>
                        </div>
                        {errores?.general && <div className="p-3 bg-red-50 border border-red-200 text-red-600 text-xs font-bold rounded-xl text-center">{errores.general[0]}</div>
                        }
                    </form>
                </div>
            </div >
        </div >
    )
}
