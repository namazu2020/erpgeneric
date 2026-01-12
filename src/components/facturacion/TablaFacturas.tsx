'use client'

import { Venta, Cliente, DetalleVenta, Producto } from '@prisma/client'
import { Eye, Printer, FileText, CheckCircle, Clock } from 'lucide-react'
import { useState } from 'react'
import clsx from 'clsx'
import ModalDetalleFactura from './ModalDetalleFactura'
import { formatNumber, formatDate, formatTime } from '@/lib/formatters'

// Tipo extendido con relaciones
interface ClienteFrontend extends Omit<Cliente, 'saldoActual' | 'limiteCredito'> {
    saldoActual: number;
    limiteCredito: number | null;
}
interface ProductoFrontend extends Omit<Producto, 'precioCompra' | 'precioVenta'> {
    precioCompra: number;
    precioVenta: number;
}
interface DetalleVentaFrontend extends Omit<DetalleVenta, 'precioUnitario' | 'subtotal'> {
    precioUnitario: number;
    subtotal: number;
}
type VentaConRelaciones = Omit<Venta, 'total'> & {
    total: number;
    cliente: ClienteFrontend | null;
    items: (DetalleVentaFrontend & { producto: ProductoFrontend })[];
}

import { ClipboardList } from 'lucide-react'
import ModalNotaPedido, { VentaParaNota } from './ModalNotaPedido'

interface Props {
    ventas: VentaConRelaciones[]
    currentUser: { name?: string | null, email?: string | null }
}

export default function TablaFacturas({ ventas, currentUser }: Props) {
    const [ventaSeleccionada, setVentaSeleccionada] = useState<VentaConRelaciones | null>(null)
    const [isModalOpen, setIsModalOpen] = useState(false)
    const [isNotaModalOpen, setIsNotaModalOpen] = useState(false)
    const [ventaParaNota, setVentaParaNota] = useState<VentaParaNota | null>(null)

    const handlePrint = (id: string) => {
        alert('Funcionalidad de impresión PDF próximamente para venta: ' + id)
    }

    const openDetail = (venta: VentaConRelaciones) => {
        setVentaSeleccionada(venta)
        setIsModalOpen(true)
    }

    const openNotaPedido = (venta: VentaConRelaciones) => {
        // Cast or map if types slightly differ, though VentaConRelaciones is compatible with VentaParaNota
        setVentaParaNota(venta as unknown as VentaParaNota)
        setIsNotaModalOpen(true)
    }

    return (
        <>
            <div className="rounded-xl border border-border bg-card shadow-sm overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="w-full text-left text-sm">
                        <thead className="bg-muted/50 text-muted-foreground font-medium border-b border-border text-xs uppercase tracking-wider">
                            <tr>
                                <th className="px-6 py-4">N° Factura</th>
                                <th className="px-6 py-4">Fecha / Hora</th>
                                <th className="px-6 py-4">Cliente</th>
                                <th className="px-6 py-4">Items</th>
                                <th className="px-6 py-4 text-center">Estado</th>
                                <th className="px-6 py-4 text-right">Total</th>
                                <th className="px-6 py-4 text-right">Acciones</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-border">
                            {ventas.length === 0 ? (
                                <tr>
                                    <td colSpan={7} className="px-6 py-12 text-center text-muted-foreground">
                                        <div className="flex flex-col items-center justify-center gap-3">
                                            <div className="h-12 w-12 rounded-full bg-muted flex items-center justify-center">
                                                <FileText className="h-6 w-6 opacity-50" />
                                            </div>
                                            <p>No hay facturas registradas aún.</p>
                                        </div>
                                    </td>
                                </tr>
                            ) : (
                                ventas.map((venta) => (
                                    <tr key={venta.id} className="group hover:bg-muted/50 transition-colors">
                                        <td className="px-6 py-4 font-mono text-xs text-muted-foreground">
                                            #{venta.id.split('-')[0].toUpperCase()}
                                        </td>
                                        <td className="px-6 py-4 text-foreground">
                                            <div className="flex flex-col">
                                                <span className="font-medium">
                                                    {formatDate(venta.fecha)}
                                                </span>
                                                <span className="text-xs text-muted-foreground">
                                                    {formatTime(venta.fecha)}
                                                </span>
                                            </div>
                                        </td>
                                        <td className="px-6 py-4">
                                            {venta.cliente ? (
                                                <div className="flex flex-col">
                                                    <span className="font-medium text-foreground">{venta.cliente.nombre}</span>
                                                    <span className="text-xs text-muted-foreground">{venta.cliente.email || 'Sin email'}</span>
                                                </div>
                                            ) : (
                                                <span className="text-muted-foreground italic text-xs">Consumidor Final</span>
                                            )}
                                        </td>
                                        <td className="px-6 py-4 text-muted-foreground text-xs font-bold">
                                            {venta.items.reduce((sum, item) => sum + item.cantidad, 0)} unidades
                                        </td>
                                        <td className="px-6 py-4 text-center">
                                            <span className={clsx(
                                                "inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-medium border",
                                                venta.estado === 'COMPLETADA'
                                                    ? "bg-emerald-500/10 text-emerald-600 border-emerald-500/20 dark:text-emerald-400"
                                                    : "bg-amber-500/10 text-amber-600 border-amber-500/20"
                                            )}>
                                                {venta.estado === 'COMPLETADA' ? <CheckCircle className="h-3 w-3" /> : <Clock className="h-3 w-3" />}
                                                {venta.estado}
                                            </span>
                                        </td>
                                        <td className="px-6 py-4 text-right font-bold text-foreground">
                                            ${formatNumber(venta.total)}
                                        </td>
                                        <td className="px-6 py-4 text-right">
                                            <div className="flex items-center justify-end gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                                                <button
                                                    onClick={() => openNotaPedido(venta)}
                                                    className="p-2 text-muted-foreground hover:text-amber-600 hover:bg-amber-50 rounded-lg transition-colors"
                                                    title="Emitir Nota de Pedido"
                                                >
                                                    <ClipboardList className="h-4 w-4" />
                                                </button>
                                                <button
                                                    onClick={() => handlePrint(venta.id)}
                                                    className="p-2 text-muted-foreground hover:text-primary hover:bg-primary/10 rounded-lg transition-colors"
                                                    title="Imprimir Comprobante Fiscal"
                                                >
                                                    <Printer className="h-4 w-4" />
                                                </button>
                                                <button
                                                    onClick={() => openDetail(venta)}
                                                    className="p-2 text-muted-foreground hover:text-blue-600 hover:bg-blue-500/10 rounded-lg transition-colors"
                                                    title="Ver Detalle Completo"
                                                >
                                                    <Eye className="h-4 w-4" />
                                                </button>
                                            </div>
                                        </td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>
            </div>

            <ModalDetalleFactura
                isOpen={isModalOpen}
                onClose={() => setIsModalOpen(false)}
                venta={ventaSeleccionada}
            />

            <ModalNotaPedido
                isOpen={isNotaModalOpen}
                onClose={() => setIsNotaModalOpen(false)}
                venta={ventaParaNota}
                currentUser={currentUser}
            />
        </>
    )
}
