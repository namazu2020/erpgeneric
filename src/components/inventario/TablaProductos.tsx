'use client'

import type { Producto, Marca, Modelo, Categoria, Compatibilidad } from '@prisma/client'
import { eliminarProducto } from '@/actions/productos-actions'
import { Trash2, Edit, MoreVertical, Archive, Tag, Info } from 'lucide-react'
import { useTransition, useState } from 'react'
import clsx from 'clsx'
import ModalProducto from './ModalProducto'
import { authClient } from '@/lib/auth-client'

type ProductoExtendido = Omit<Producto, 'precioCompra' | 'precioVenta'> & {
    precioCompra: number;
    precioVenta: number;
    compatibilidades?: (Compatibilidad & { marca: Marca, modelo: Modelo })[],
    categoria?: Categoria | null
}

interface Props {
    productos: ProductoExtendido[]
}

export default function TablaProductos({ productos }: Props) {
    const [isPending, startTransition] = useTransition()
    const [productoAEditar, setProductoAEditar] = useState<ProductoExtendido | null>(null)
    const { data: session } = authClient.useSession()

    // Default to 'VENDEDOR' (lowest permission) if no session or role
    const sessionUser = session?.user as any
    const role = sessionUser?.role || sessionUser?.rol || 'VENDEDOR'

    // Debug info useful for troubleshooting
    // console.log("Session User:", sessionUser)

    const handleEliminar = (id: string) => {
        if (confirm('¿Estás seguro de eliminar este producto?')) {
            startTransition(async () => {
                const res = await eliminarProducto(id)
                if (res?.error) {
                    alert(res.error)
                }
            })
        }
    }

    const getAvatarColor = (name: string) => {
        const colors = ['bg-blue-100 text-blue-700', 'bg-emerald-100 text-emerald-700', 'bg-indigo-100 text-indigo-700', 'bg-orange-100 text-orange-700', 'bg-rose-100 text-rose-700'];
        return colors[name.length % colors.length];
    }

    const canEdit = role === 'SUPER_ADMIN' || role === 'ADMIN' || role === 'ADMINISTRATIVO'
    const canDelete = role === 'SUPER_ADMIN' || role === 'ADMIN'

    return (
        <div className="overflow-x-auto rounded-2xl border border-border shadow-sm">
            <ModalProducto
                isOpen={!!productoAEditar}
                onClose={() => setProductoAEditar(null)}
                productoAEditar={productoAEditar}
            />

            <table className="w-full text-left text-sm border-collapse">
                <thead className="bg-muted/30 text-[10px] uppercase text-muted-foreground font-black tracking-widest">
                    <tr className="border-b border-border">
                        <th className="px-6 py-5">
                            Producto / Compatibilidad
                            <span className="ml-2 text-[9px] font-normal normal-case text-muted-foreground bg-muted px-1 rounded" title={`Role: ${sessionUser?.role}, Rol: ${sessionUser?.rol}`}>
                                Db: {role}
                            </span>
                        </th>
                        <th className="px-6 py-5 text-center">SKU</th>
                        <th className="px-6 py-5 text-right">Precio Final (IVA INC)</th>
                        <th className="px-6 py-5 text-center">Estado de Stock</th>
                        {(canEdit || canDelete) && <th className="px-6 py-5 text-right">Acciones</th>}
                    </tr>
                </thead>
                <tbody className="divide-y divide-border bg-card">
                    {productos.length === 0 ? (
                        <tr>
                            <td colSpan={5} className="px-6 py-20 text-center">
                                <div className="flex flex-col items-center justify-center space-y-4">
                                    <div className="h-16 w-16 rounded-3xl bg-muted flex items-center justify-center rotate-12">
                                        <Archive className="h-8 w-8 text-muted-foreground/50" />
                                    </div>
                                    <div className="space-y-1">
                                        <p className="text-foreground font-bold text-lg">Catálogo vacío</p>
                                        <p className="text-muted-foreground text-xs">Comienza agregando tu primer producto automotriz.</p>
                                    </div>
                                </div>
                            </td>
                        </tr>
                    ) : (
                        productos.map((producto) => {
                            const precioFinal = producto.precioVenta * (1 + producto.tasaIva / 100);
                            const esBajoStock = producto.stockActual <= producto.stockMinimo;

                            return (
                                <tr key={producto.id} className="hover:bg-muted/20 transition-all group">
                                    <td className="px-6 py-4">
                                        <div className="flex items-center gap-4">
                                            <div className={clsx("h-12 w-12 rounded-2xl flex items-center justify-center text-sm font-black shrink-0 shadow-sm transition-transform group-hover:scale-110", getAvatarColor(producto.nombre))}>
                                                {producto.nombre.substring(0, 2).toUpperCase()}
                                            </div>
                                            <div className="flex flex-col min-w-0">
                                                <span className="font-bold text-foreground truncate group-hover:text-primary transition-colors text-base">{producto.nombre}</span>
                                                <div className="flex items-center gap-2 mt-0.5">
                                                    {producto.categoria && (
                                                        <span className="inline-flex items-center px-1.5 py-0.5 rounded bg-purple-50 text-[10px] font-bold text-purple-600 uppercase">
                                                            {producto.categoria.nombre}
                                                        </span>
                                                    )}
                                                    {/* Display first 2 compatibilities */}
                                                    {producto.compatibilidades && producto.compatibilidades.length > 0 ? (
                                                        <div className="flex flex-wrap gap-1 max-w-[250px]">
                                                            {producto.compatibilidades.slice(0, 2).map((c, idx) => (
                                                                <span key={idx} className="inline-flex items-center px-2 py-0.5 rounded-lg bg-slate-100 text-[9px] font-black text-slate-600 uppercase border border-black/5">
                                                                    {c.marca.nombre} {c.modelo.nombre}
                                                                </span>
                                                            ))}
                                                            {producto.compatibilidades.length > 2 && (
                                                                <span className="text-[9px] font-bold text-primary self-center">
                                                                    +{producto.compatibilidades.length - 2} más
                                                                </span>
                                                            )}
                                                        </div>
                                                    ) : (
                                                        <span className="text-[10px] text-muted-foreground/60 italic font-medium">Compatible con múltiples vehículos</span>
                                                    )}
                                                </div>
                                            </div>
                                        </div>
                                    </td>
                                    <td className="px-6 py-4 text-center">
                                        <span className="font-mono text-[11px] font-bold text-muted-foreground select-all bg-muted/50 px-2 py-1 rounded">
                                            {producto.sku}
                                        </span>
                                    </td>
                                    <td className="px-6 py-4 text-right">
                                        <div className="flex flex-col">
                                            <span className="font-black text-foreground text-base">${precioFinal.toLocaleString('es-AR', { minimumFractionDigits: 2 })}</span>
                                            <span className="text-[10px] text-muted-foreground font-medium line-through decoration-primary/30 opacity-60">Neto: ${producto.precioVenta.toLocaleString()}</span>
                                        </div>
                                    </td>
                                    <td className="px-6 py-4 text-center">
                                        <div className="flex flex-col items-center gap-1.5">
                                            <div className={clsx(
                                                "w-full max-w-[100px] h-1.5 bg-muted rounded-full overflow-hidden",
                                                esBajoStock ? "ring-1 ring-red-100" : ""
                                            )}>
                                                <div
                                                    className={clsx("h-full transition-all duration-1000", esBajoStock ? "bg-red-500" : "bg-emerald-500")}
                                                    style={{ width: `${Math.min((producto.stockActual / (producto.stockMinimo * 2)) * 100, 100)}%` }}
                                                />
                                            </div>
                                            <div className="flex items-center gap-1">
                                                <span className={clsx("text-xs font-black", esBajoStock ? "text-red-600" : "text-emerald-600")}>
                                                    {producto.stockActual}
                                                </span>
                                                <span className="text-[10px] font-bold text-muted-foreground uppercase opacity-50">Units</span>
                                            </div>
                                        </div>
                                    </td>
                                    {(canEdit || canDelete) && (
                                        <td className="px-6 py-4 text-right">
                                            <div className="flex items-center justify-end gap-1">
                                                {canEdit && (
                                                    <button
                                                        onClick={() => setProductoAEditar(producto)}
                                                        className="p-2.5 text-muted-foreground hover:text-primary hover:bg-primary/5 rounded-xl transition-all"
                                                        title="Editar"
                                                    >
                                                        <Edit className="h-4.5 w-4.5" />
                                                    </button>
                                                )}
                                                {canDelete && (
                                                    <button
                                                        onClick={() => handleEliminar(producto.id)}
                                                        disabled={isPending}
                                                        className="p-2.5 text-muted-foreground/40 hover:text-red-600 hover:bg-red-50 rounded-xl transition-all"
                                                        title="Eliminar"
                                                    >
                                                        <Trash2 className="h-4.5 w-4.5" />
                                                    </button>
                                                )}
                                            </div>
                                        </td>
                                    )}
                                </tr>
                            )
                        })
                    )}
                </tbody>
            </table>
        </div>
    )
}
