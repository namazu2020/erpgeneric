'use client'

import { Venta, Cliente, DetalleVenta, Producto } from '@prisma/client'
import { X, Printer, Package, User, Calendar, CreditCard, Hash, DollarSign } from 'lucide-react'
import clsx from 'clsx'
import { formatNumber, formatDate, formatTime } from '@/lib/formatters'

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
type VentaConDetalle = Omit<Venta, 'total'> & {
    total: number;
    cliente: ClienteFrontend | null;
    items: (DetalleVentaFrontend & { producto: ProductoFrontend })[];
}

interface Props {
    isOpen: boolean
    onClose: () => void
    venta: VentaConDetalle | null
}

export default function ModalDetalleFactura({ isOpen, onClose, venta }: Props) {
    if (!isOpen || !venta) return null

    const handlePrint = () => {
        window.print()
    }

    return (
        <div className="fixed inset-0 z-110 flex items-center justify-center p-4 sm:p-6 overflow-y-auto">
            <div className="absolute inset-0 bg-black/60 backdrop-blur-sm transition-opacity" onClick={onClose} />

            <div className="relative w-full max-w-2xl bg-card rounded-2xl shadow-2xl overflow-hidden animate-in zoom-in-95 duration-200 border border-border my-8 flex flex-col max-h-[90vh]">
                {/* Header */}
                <div className="flex items-center justify-between border-b border-border bg-muted/50 px-6 py-4 shrink-0">
                    <div className="flex items-center gap-3">
                        <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-background border border-border shadow-sm">
                            <Hash className="h-5 w-5 text-primary" />
                        </div>
                        <div>
                            <h3 className="text-lg font-bold text-foreground leading-tight">
                                Detalle de Factura
                            </h3>
                            <p className="text-xs text-muted-foreground uppercase tracking-widest font-semibold mt-0.5">#{venta.id.split('-')[0].toUpperCase()}</p>
                        </div>
                    </div>
                    <div className="flex items-center gap-2">
                        <button onClick={handlePrint} className="p-2 text-muted-foreground hover:bg-muted rounded-full transition-colors print:hidden">
                            <Printer className="h-5 w-5" />
                        </button>
                        <button onClick={onClose} className="p-2 text-muted-foreground hover:bg-muted rounded-full transition-colors print:hidden">
                            <X className="h-5 w-5" />
                        </button>
                    </div>
                </div>

                {/* Body */}
                <div className="p-6 overflow-y-auto space-y-8 scrollbar-thin">
                    {/* Info Cabecera */}
                    <div className="grid grid-cols-2 gap-8 pb-8 border-b border-dashed border-border">
                        <div className="space-y-4">
                            <div className="flex items-center gap-2 text-xs font-bold uppercase text-muted-foreground tracking-wider">
                                <User size={14} /> Cliente
                            </div>
                            {venta.cliente ? (
                                <div className="space-y-1">
                                    <p className="font-bold text-foreground">{venta.cliente.nombre}</p>
                                    <p className="text-sm text-muted-foreground">{venta.cliente.email}</p>
                                    <p className="text-sm text-muted-foreground">{venta.cliente.telefono}</p>
                                </div>
                            ) : (
                                <p className="text-sm italic font-medium text-muted-foreground">Consumidor Final</p>
                            )}
                        </div>
                        <div className="space-y-4">
                            <div className="flex items-center gap-2 text-xs font-bold uppercase text-muted-foreground tracking-wider">
                                <Calendar size={14} /> Información de Venta
                            </div>
                            <div className="space-y-1">
                                <div className="flex justify-between text-sm">
                                    <span className="text-muted-foreground">Fecha:</span>
                                    <span className="font-medium">{formatDate(venta.fecha)}</span>
                                </div>
                                <div className="flex justify-between text-sm">
                                    <span className="text-muted-foreground">Hora:</span>
                                    <span className="font-medium">{formatTime(venta.fecha)}</span>
                                </div>
                                <div className="flex justify-between text-sm">
                                    <span className="text-muted-foreground">Método:</span>
                                    <span className="font-bold text-primary">{venta.metodoPago}</span>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Tabla de Items */}
                    <div className="space-y-4">
                        <div className="flex items-center gap-2 text-xs font-bold uppercase text-muted-foreground tracking-wider">
                            <Package size={14} /> Productos Facturados
                        </div>
                        <div className="rounded-xl border border-border overflow-hidden">
                            <table className="w-full text-left text-sm">
                                <thead className="bg-muted/50 border-b border-border">
                                    <tr>
                                        <th className="px-4 py-3 font-semibold">Producto</th>
                                        <th className="px-4 py-3 text-center font-semibold">Cant.</th>
                                        <th className="px-4 py-3 text-right font-semibold">Unitario</th>
                                        <th className="px-4 py-3 text-right font-semibold">Subtotal</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-border">
                                    {venta.items.map((item, idx) => (
                                        <tr key={idx} className="hover:bg-muted/30 transition-colors">
                                            <td className="px-4 py-3">
                                                <div className="font-medium text-foreground">{item.producto.nombre}</div>
                                                <div className="text-[10px] text-muted-foreground font-mono">{item.producto.sku}</div>
                                            </td>
                                            <td className="px-4 py-3 text-center font-bold">{item.cantidad}</td>
                                            <td className="px-4 py-3 text-right text-muted-foreground">${formatNumber(item.precioUnitario)}</td>
                                            <td className="px-4 py-3 text-right font-bold text-foreground">${formatNumber(item.subtotal)}</td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </div>

                    {/* Footer / Totales */}
                    <div className="flex justify-end pt-4">
                        <div className="w-full max-w-[240px] space-y-3 bg-muted/40 p-4 rounded-2xl border border-border">
                            <div className="flex justify-between text-sm">
                                <span className="text-muted-foreground">Subtotal Neto:</span>
                                <span className="font-medium text-foreground">${formatNumber(venta.total / 1.21)}</span>
                            </div>
                            <div className="flex justify-between text-sm">
                                <span className="text-muted-foreground">I.V.A (21%):</span>
                                <span className="font-medium text-foreground">${formatNumber(venta.total - (venta.total / 1.21))}</span>
                            </div>
                            <div className="pt-2 border-t border-border flex justify-between items-center">
                                <span className="text-xs font-bold uppercase text-foreground">Total Pagado:</span>
                                <span className="text-xl font-black text-primary">${formatNumber(venta.total)}</span>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Fin del Modal */}
                <div className="p-6 border-t border-border flex justify-between items-center bg-muted/20 shrink-0 print:hidden">
                    <p className="text-[10px] text-muted-foreground uppercase font-bold tracking-widest">ErpGeneric Cloud • Sistema de Gestión</p>
                    <button onClick={onClose} className="px-6 py-2 rounded-xl text-sm font-bold text-muted-foreground hover:bg-muted transition-all">Cerrar</button>
                </div>
            </div>
        </div>
    )
}
