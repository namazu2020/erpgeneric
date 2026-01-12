'use client'

import { Venta, Cliente, DetalleVenta, Producto } from '@prisma/client'
import { X, Printer, FileText, User } from 'lucide-react'
import { formatDate, formatTime } from '@/lib/formatters'
import { useEffect, useState } from 'react'
import { createPortal } from 'react-dom'

// Reuse frontend types or define compatible ones for the modal
interface ProductoFrontend extends Omit<Producto, 'precioCompra' | 'precioVenta'> {
    precioCompra: number;
    precioVenta: number;
}
interface ClienteFrontend extends Omit<Cliente, 'saldoActual' | 'limiteCredito'> {
    saldoActual: number;
    limiteCredito: number | null;
}
interface DetalleVentaFrontend extends Omit<DetalleVenta, 'precioUnitario' | 'subtotal'> {
    precioUnitario: number;
    subtotal: number;
}
// Compatible structure with what TablaFacturas passes
export interface VentaParaNota extends Omit<Venta, 'total'> {
    total: number;
    cliente: ClienteFrontend | null;
    items: (DetalleVentaFrontend & { producto: ProductoFrontend })[];
}

interface UserInfo {
    name?: string | null
    email?: string | null
}

interface Props {
    isOpen: boolean
    onClose: () => void
    venta: VentaParaNota | null
    currentUser: UserInfo
}

export default function ModalNotaPedido({ isOpen, onClose, venta, currentUser }: Props) {
    const [mounted, setMounted] = useState(false)

    useEffect(() => {
        setMounted(true)
    }, [])

    if (!mounted || !isOpen || !venta) return null

    const handlePrint = () => {
        window.print()
    }

    const modalContent = (
        <div id="printable-modal-root" className="fixed inset-0 z-9999 flex items-center justify-center p-4 sm:p-6 bg-black/60 backdrop-blur-sm transition-opacity">

            {/* Global Print Styles */}
            <style jsx global>{`
                @media print {
                    /* Hide everything in the body by default */
                    body > * {
                        display: none !important;
                    }

                    /* Un-hide our portal root (which is a direct child of body now) */
                    body > #printable-modal-root {
                        display: flex !important;
                        position: absolute !important;
                        top: 0 !important;
                        left: 0 !important;
                        width: 100% !important;
                        height: auto !important;
                        background: white !important;
                        z-index: 9999 !important;
                        padding: 0 !important;
                        margin: 0 !important;
                    }
                    
                    /* Hide the backdrop overlay itself, just keep the content */
                    #printable-modal-root {
                        background: transparent !important;
                        backdrop-filter: none !important;
                        align-items: flex-start !important; /* Start at top */
                    }

                    /* The actual printable card */
                    #printable-content {
                        box-shadow: none !important;
                        border: none !important;
                        width: 100% !important;
                        max-width: none !important;
                        margin: 0 !important;
                        border-radius: 0 !important;
                    }

                    /* Buttons and non-print elements inside the modal */
                    .no-print {
                        display: none !important;
                    }
                    
                    /* Page settings */
                    @page {
                        size: A4;
                        margin: 1cm;
                    }

                    /* Force background colors/images to print */
                    * {
                        -webkit-print-color-adjust: exact !important;
                        print-color-adjust: exact !important;
                    }
                }
            `}</style>

            {/* Click outside to close (Screen only behavior) */}
            <div className="absolute inset-0 no-print" onClick={onClose} aria-hidden="true" />

            {/* Modal Container */}
            <div id="printable-content" className="relative w-full max-w-2xl bg-white rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh] print:max-h-none print:h-auto print:overflow-visible">

                {/* Header (Screen Only) */}
                <div className="flex items-center justify-between border-b border-slate-100 bg-slate-50/50 px-6 py-4 shrink-0 no-print">
                    <div className="flex items-center gap-3">
                        <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-indigo-50 text-indigo-600 border border-indigo-100 shadow-sm">
                            <FileText className="h-5 w-5" />
                        </div>
                        <div>
                            <h3 className="text-lg font-bold text-slate-800 leading-tight">Nota de Pedido</h3>
                            <p className="text-xs text-slate-500 uppercase tracking-widest font-semibold mt-0.5">Vista Previa</p>
                        </div>
                    </div>
                    <div className="flex items-center gap-2">
                        <button onClick={handlePrint} className="p-2 text-slate-500 hover:bg-slate-100 rounded-full transition-colors hover:text-indigo-600" title="Imprimir">
                            <Printer className="h-5 w-5" />
                        </button>
                        <button onClick={onClose} className="p-2 text-slate-500 hover:bg-slate-100 rounded-full transition-colors hover:text-rose-600" title="Cerrar">
                            <X className="h-5 w-5" />
                        </button>
                    </div>
                </div>

                {/* Content (Scrollable on Screen, Full on Print) */}
                <div className="p-8 sm:p-10 space-y-8 bg-white overflow-y-auto print:overflow-visible print:p-0">

                    {/* Document Header */}
                    <div className="flex justify-between items-start border-b-2 border-slate-900 pb-6 print:pb-4">
                        <div className="flex items-center gap-4">
                            <div className="h-14 w-14 bg-slate-900 text-white flex items-center justify-center rounded-xl shadow-sm print:rounded-lg">
                                <span className="font-black text-xl tracking-tighter">S</span>
                            </div>
                            <div>
                                <h1 className="text-3xl font-black uppercase tracking-tight text-slate-900 leading-none">Nota de Pedido</h1>
                                <p className="text-xs font-bold text-slate-500 mt-1.5 uppercase tracking-[0.2em]">Uso Interno • Control de Stock</p>
                            </div>
                        </div>
                        <div className="text-right">
                            <div className="inline-block px-3 py-1 bg-slate-100 rounded-lg mb-2 print:bg-transparent print:p-0">
                                <span className="text-2xl font-mono font-bold text-slate-900">#{venta.id.split('-')[0].toUpperCase()}</span>
                            </div>
                            <div className="text-[10px] text-slate-500 font-bold uppercase tracking-wider">
                                {formatDate(new Date())} <span className="mx-1">•</span> {formatTime(new Date())}
                            </div>
                        </div>
                    </div>

                    {/* Meta Info Grid */}
                    <div className="grid grid-cols-2 gap-12 pt-2 print:gap-8">
                        {/* Issuer */}
                        <div className="space-y-3">
                            <h4 className="text-[10px] font-black uppercase tracking-[0.15em] text-slate-400 border-b border-slate-100 pb-2">Emitido Por</h4>
                            <div className="flex items-start gap-4">
                                <div className="p-2.5 bg-slate-50 rounded-full print:hidden">
                                    <User className="h-5 w-5 text-slate-400" />
                                </div>
                                <div>
                                    <p className="font-bold text-slate-900 text-lg leading-tight">{currentUser.name || 'Usuario del Sistema'}</p>
                                    <p className="text-sm text-slate-500 font-medium">{currentUser.email}</p>
                                </div>
                            </div>
                        </div>

                        {/* Customer */}
                        <div className="space-y-3">
                            <h4 className="text-[10px] font-black uppercase tracking-[0.15em] text-slate-400 border-b border-slate-100 pb-2">Referencia</h4>
                            <div className="space-y-2 text-sm">
                                <div className="flex justify-between items-baseline">
                                    <span className="text-slate-500 font-medium">Cliente:</span>
                                    <span className="font-bold text-slate-900 text-base">{venta.cliente ? venta.cliente.nombre : 'Consumidor Final'}</span>
                                </div>
                                <div className="flex justify-between items-baseline">
                                    <span className="text-slate-500 font-medium">Fecha Venta:</span>
                                    <span className="font-mono text-slate-700 font-bold">{formatDate(venta.fecha)}</span>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Items Table */}
                    <div className="pt-4">
                        <table className="w-full text-left text-sm border-collapse">
                            <thead>
                                <tr className="border-b-2 border-slate-900">
                                    <th className="py-3 pl-2 font-black text-slate-900 uppercase tracking-widest text-[10px]">Descripción</th>
                                    <th className="py-3 font-black text-slate-900 uppercase tracking-widest text-[10px] text-center w-24">SKU</th>
                                    <th className="py-3 font-black text-slate-900 uppercase tracking-widest text-[10px] text-center w-20">Cant.</th>
                                    <th className="py-3 font-black text-slate-900 uppercase tracking-widest text-[10px] text-right w-32 pr-2">Control</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-100">
                                {venta.items.map((item, idx) => (
                                    <tr key={idx} className="group print:break-inside-avoid">
                                        <td className="py-3 pl-2 align-middle">
                                            <div className="font-bold text-slate-900 text-sm">{item.producto.nombre}</div>
                                        </td>
                                        <td className="py-3 text-center align-middle">
                                            <div className="text-[10px] text-slate-500 font-mono font-bold uppercase tracking-wider">{item.producto.sku || 'N/A'}</div>
                                        </td>
                                        <td className="py-3 text-center align-middle">
                                            <span className="inline-block px-3 py-1 bg-slate-100 rounded-md font-bold text-slate-900 text-sm print:bg-transparent print:border print:border-slate-200">
                                                {item.cantidad}
                                            </span>
                                        </td>
                                        <td className="py-3 pr-2 text-right align-middle">
                                            <div className="h-5 w-5 border-2 border-slate-200 rounded ml-auto" />
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>

                    {/* Signatures */}
                    <div className="grid grid-cols-2 gap-20 pt-24 pb-8 print:break-inside-avoid">
                        <div className="border-t-2 border-slate-300 pt-3 text-center">
                            <p className="text-[10px] font-bold uppercase tracking-widest text-slate-400">Autorizado Por</p>
                        </div>
                        <div className="border-t-2 border-slate-300 pt-3 text-center">
                            <p className="text-[10px] font-bold uppercase tracking-widest text-slate-400">Recibido Conforme</p>
                        </div>
                    </div>

                    {/* Footer */}
                    <div className="pt-6 border-t border-slate-100 text-center">
                        <p className="text-[10px] text-slate-400 font-medium">
                            ERP System • Documento generado automáticamente el {formatDate(new Date())}
                        </p>
                    </div>

                </div>

                {/* Footer Actions (Screen Only) */}
                <div className="p-4 border-t border-slate-100 bg-slate-50/50 shrink-0 flex justify-end gap-3 no-print">
                    <button onClick={onClose} className="px-5 py-2 rounded-xl text-sm font-bold text-slate-600 hover:bg-slate-200/50 transition-all">
                        Cancelar
                    </button>
                    <button onClick={handlePrint} className="px-5 py-2 rounded-xl text-sm font-bold bg-slate-900 text-white hover:bg-slate-800 shadow-lg shadow-slate-900/10 hover:shadow-xl transition-all flex items-center gap-2">
                        <Printer size={16} /> Imprimir Nota
                    </button>
                </div>
            </div>
        </div>
    )

    return createPortal(modalContent, document.body)
}
