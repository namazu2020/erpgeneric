'use client'

import { useState, useRef, useEffect } from 'react'
import { cargarProductosMasivo } from '@/actions/productos-actions'
import { Upload, FileSpreadsheet, X, HelpCircle, Loader2, CheckCircle2, AlertCircle, FileUp, Settings2, Table as TableIcon, ArrowRight, Save } from 'lucide-react'
import clsx from 'clsx'
import * as XLSX from 'xlsx'

// Campos disponibles en el ERP
const ERP_FIELDS = [
    { key: 'nombre', label: 'Nombre del Producto', required: true },
    { key: 'sku', label: 'SKU / Código Barra', required: true },
    { key: 'marca', label: 'Marca' },
    { key: 'modelo', label: 'Modelo' },
    { key: 'ano', label: 'Año' },
    { key: 'precioCompra', label: 'Precio Costo' },
    { key: 'precioVenta', label: 'Precio Venta' },
    { key: 'stockActual', label: 'Stock Actual' },
    { key: 'stockMinimo', label: 'Stock Mínimo' },
    { key: 'proveedor', label: 'Proveedor' },
    { key: 'categoria', label: 'Categoría' },
]

type Step = 'UPLOAD' | 'MAPPING' | 'PREVIEW'

export default function ModalCargaMasiva() {
    const [isOpen, setIsOpen] = useState(false)
    const [step, setStep] = useState<Step>('UPLOAD')
    const [rawExcelData, setRawExcelData] = useState<any[]>([])
    const [excelColumns, setExcelColumns] = useState<string[]>([])

    // Mapeo: key (ERP_FIELD) -> column (Excel)
    const [mapping, setMapping] = useState<Record<string, string>>({})

    // Configuraciones globales (Normalización)
    const [globalOverrides, setGlobalOverrides] = useState<Record<string, any>>({
        precioCompra: null,
        precioVenta: null,
        stockActual: null,
        stockMinimo: null,
        proveedor: '',
        categoria: ''
    })
    const [activeOverrides, setActiveOverrides] = useState<Record<string, boolean>>({})

    const [isUploading, setIsUploading] = useState(false)
    const [status, setStatus] = useState<{ type: 'success' | 'error', message: string } | null>(null)
    const fileInputRef = useRef<HTMLInputElement>(null)

    // Resetear al abrir/cerrar
    useEffect(() => {
        if (!isOpen) {
            setStep('UPLOAD')
            setRawExcelData([])
            setMapping({})
            setStatus(null)
        }
    }, [isOpen])

    const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0]
        if (!file) return

        const reader = new FileReader()
        reader.onload = (evt) => {
            try {
                const bstr = evt.target?.result
                const wb = XLSX.read(bstr, { type: 'binary' })
                const wsname = wb.SheetNames[0]
                const ws = wb.Sheets[wsname]

                const rawJson = XLSX.utils.sheet_to_json(ws) as any[]
                if (rawJson.length === 0) {
                    setStatus({ type: 'error', message: 'El archivo parece estar vacío.' })
                    return
                }

                // Obtener columnas del primer objeto
                const cols = Object.keys(rawJson[0])
                setExcelColumns(cols)
                setRawExcelData(rawJson)

                // Intento de auto-mapeo inicial
                const initialMapping: Record<string, string> = {}
                ERP_FIELDS.forEach(f => {
                    const match = cols.find(c => {
                        const nc = c.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "").replace(/\s+/g, '')
                        const nf = f.key.toLowerCase()
                        return nc === nf || nc.includes(nf) || nf.includes(nc)
                    })
                    if (match) initialMapping[f.key] = match
                })
                setMapping(initialMapping)
                setStep('MAPPING')
            } catch (error) {
                console.error(error)
                setStatus({ type: 'error', message: 'Error al leer el archivo Excel.' })
            }
        }
        reader.readAsBinaryString(file)
    }

    const handleMappingChange = (erpKey: string, excelCol: string) => {
        setMapping(prev => ({ ...prev, [erpKey]: excelCol }))
    }

    const prepareFinalData = () => {
        return rawExcelData.map(row => {
            const product: any = {}
            ERP_FIELDS.forEach(f => {
                const excelCol = mapping[f.key]
                if (excelCol && row[excelCol] !== undefined) {
                    product[f.key] = row[excelCol]
                } else {
                    product[f.key] = null
                }
            })

            // Aplicar sobrescrituras globales (Normalización)
            Object.keys(activeOverrides).forEach(key => {
                if (activeOverrides[key] && globalOverrides[key] !== null && globalOverrides[key] !== '') {
                    product[key] = globalOverrides[key]
                }
            })

            return product
        })
    }

    const handleConfirmUpload = async () => {
        const finalData = prepareFinalData()

        setIsUploading(true)
        setStatus(null)

        try {
            const res = await cargarProductosMasivo(finalData)

            if (res.success) {
                setStatus({
                    type: 'success',
                    message: `¡Carga exitosa! ${res.creados} productos procesados. ${res.errores} errores.`
                })
                setRawExcelData([])
                setStep('UPLOAD')
            } else {
                setStatus({ type: 'error', message: res.error as string })
            }
        } catch (error) {
            setStatus({ type: 'error', message: 'Error crítico al procesar la carga.' })
        } finally {
            setIsUploading(false)
        }
    }

    return (
        <>
            <button
                onClick={() => setIsOpen(true)}
                className="flex items-center gap-2 rounded-xl border border-border bg-card px-4 py-2.5 text-sm font-bold text-foreground shadow-sm hover:bg-muted/50 transition-all hover:scale-[1.02] active:scale-[0.98]"
            >
                <FileSpreadsheet className="h-4 w-4 text-emerald-500" />
                Importar Inventario
            </button>

            {isOpen && (
                <div className="fixed inset-0 z-110 flex items-center justify-center p-4 bg-black/60 backdrop-blur-md animate-in fade-in duration-300">
                    <div className="bg-card rounded-3xl shadow-2xl w-full max-w-3xl overflow-hidden border border-border flex flex-col max-h-[90vh] animate-in zoom-in-95 duration-200">
                        {/* Header */}
                        <div className="px-8 py-5 border-b border-border flex items-center justify-between bg-muted/30">
                            <div className="flex items-center gap-4">
                                <div className="p-3 bg-primary/10 rounded-2xl text-primary">
                                    {step === 'UPLOAD' && <Upload size={22} />}
                                    {step === 'MAPPING' && <Settings2 size={22} />}
                                    {step === 'PREVIEW' && <TableIcon size={22} />}
                                </div>
                                <div>
                                    <h3 className="font-black text-xl text-foreground">
                                        {step === 'UPLOAD' && '1. Cargar Archivo'}
                                        {step === 'MAPPING' && '2. Emparejar Campos'}
                                        {step === 'PREVIEW' && '3. Confirmar Inventario'}
                                    </h3>
                                    <p className="text-xs text-muted-foreground font-medium uppercase tracking-wider">
                                        {step === 'UPLOAD' && 'Formatos soportados: Excel (.xlsx, .xls) y CSV'}
                                        {step === 'MAPPING' && 'Asocia las columnas de tu Excel con el sistema'}
                                        {step === 'PREVIEW' && `Revisión de ${rawExcelData.length} productos`}
                                    </p>
                                </div>
                            </div>
                            <button onClick={() => setIsOpen(false)} className="p-2 hover:bg-muted rounded-full transition-colors">
                                <X size={20} className="text-muted-foreground" />
                            </button>
                        </div>

                        {/* Body */}
                        <div className="p-8 overflow-y-auto space-y-8 scrollbar-thin flex-1">

                            {/* STEP 1: UPLOAD */}
                            {step === 'UPLOAD' && (
                                <div className="space-y-6">
                                    <div className="flex flex-col items-center justify-center border-4 border-dashed border-primary/20 rounded-[2.5rem] p-12 bg-primary/5 hover:bg-primary/10 transition-all group cursor-pointer relative">
                                        <div className="h-20 w-20 bg-primary/20 rounded-full flex items-center justify-center mb-6 group-hover:scale-110 transition-transform">
                                            <FileUp className="h-10 w-10 text-primary" />
                                        </div>
                                        <p className="text-lg font-black text-foreground">
                                            Seleccionar archivo de productos
                                        </p>
                                        <p className="text-sm text-muted-foreground mt-2 max-w-xs text-center font-medium">
                                            Arrastra tu reporte de Excel aquí para iniciar el asistente de importación.
                                        </p>
                                        <input
                                            type="file"
                                            ref={fileInputRef}
                                            accept=".xlsx, .xls, .csv"
                                            onChange={handleFileUpload}
                                            className="absolute inset-0 opacity-0 cursor-pointer"
                                        />
                                    </div>

                                    <div className="bg-muted/40 rounded-3xl p-6 border border-border">
                                        <h4 className="flex items-center gap-2 text-sm font-bold text-foreground mb-4">
                                            <HelpCircle size={18} className="text-primary" />
                                            Consejos para una carga exitosa
                                        </h4>
                                        <ul className="grid grid-cols-2 gap-3">
                                            {['SKU único por producto', 'Precios con números válidos', 'Celdas sin fórmulas', 'Nombres descriptivos'].map(item => (
                                                <li key={item} className="flex items-center gap-2 text-xs font-medium text-muted-foreground">
                                                    <CheckCircle2 size={12} className="text-emerald-500" /> {item}
                                                </li>
                                            ))}
                                        </ul>
                                    </div>
                                </div>
                            )}

                            {/* STEP 2: MAPPING */}
                            {step === 'MAPPING' && (
                                <div className="space-y-8 animate-in slide-in-from-right-4 duration-300">
                                    {/* Normalización Global Section */}
                                    <div className="p-6 bg-primary/5 rounded-4xl border border-primary/10 space-y-4">
                                        <div className="flex items-center gap-3 mb-2">
                                            <div className="p-2 bg-primary/20 rounded-xl text-primary">
                                                <Settings2 size={18} />
                                            </div>
                                            <div>
                                                <p className="font-black text-sm">Normalización Global de Datos</p>
                                                <p className="text-[10px] text-muted-foreground font-bold tracking-wider uppercase">Fija valores idénticos para toda la carga</p>
                                            </div>
                                        </div>

                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                            {[
                                                { key: 'precioCompra', label: 'Precio Costo ($)', type: 'number' },
                                                { key: 'precioVenta', label: 'Precio Venta ($)', type: 'number' },
                                                { key: 'stockActual', label: 'Stock Actual', type: 'number' },
                                                { key: 'stockMinimo', label: 'Stock Mínimo', type: 'number' },
                                                { key: 'proveedor', label: 'Proveedor (Nombre)', type: 'text' },
                                                { key: 'categoria', label: 'Categoría (Nombre)', type: 'text' }, // Added
                                            ].map(opt => (
                                                <div key={opt.key} className="flex items-center gap-3 p-3 bg-card rounded-2xl border border-border">
                                                    <input
                                                        type="checkbox"
                                                        checked={activeOverrides[opt.key] || false}
                                                        onChange={e => setActiveOverrides(prev => ({ ...prev, [opt.key]: e.target.checked }))}
                                                        className="w-4 h-4 accent-primary rounded-lg"
                                                    />
                                                    <div className="flex-1">
                                                        <p className="text-[10px] font-black text-muted-foreground uppercase">{opt.label}</p>
                                                        <input
                                                            type={opt.type}
                                                            disabled={!activeOverrides[opt.key]}
                                                            value={globalOverrides[opt.key] || ''}
                                                            onChange={e => setGlobalOverrides(prev => ({ ...prev, [opt.key]: e.target.value }))}
                                                            className="w-full bg-transparent border-none p-0 text-sm font-bold focus:ring-0 outline-none disabled:opacity-30"
                                                            placeholder="Click para fijar..."
                                                        />
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    </div>

                                    {/* Mapping Table */}
                                    <div className="space-y-4">
                                        <div className="flex items-center justify-between px-2">
                                            <p className="text-xs font-black uppercase tracking-widest text-muted-foreground">Campo del Sistema</p>
                                            <p className="text-xs font-black uppercase tracking-widest text-muted-foreground">Columna de Excel</p>
                                        </div>
                                        <div className="grid gap-3">
                                            {ERP_FIELDS.map(field => (
                                                <div key={field.key} className="flex items-center gap-4 p-4 bg-muted/20 rounded-2xl border border-border group hover:border-primary/30 transition-colors">
                                                    <div className="flex-1">
                                                        <div className="flex items-center gap-2">
                                                            <span className="text-sm font-bold">{field.label}</span>
                                                            {field.required && <span className="text-[10px] bg-rose-500/10 text-rose-600 px-1.5 py-0.5 rounded font-black">REQ</span>}
                                                        </div>
                                                        <p className="text-[10px] text-muted-foreground font-medium uppercase mt-0.5">{field.key}</p>
                                                    </div>
                                                    <div className="flex-1">
                                                        <select
                                                            value={mapping[field.key] || ''}
                                                            onChange={e => handleMappingChange(field.key, e.target.value)}
                                                            className="w-full bg-card border border-border rounded-xl px-4 py-2.5 text-xs font-bold focus:ring-2 focus:ring-primary/50 outline-none appearance-none cursor-pointer"
                                                        >
                                                            <option value="">-- Ignorar o Vacio --</option>
                                                            {excelColumns.map(col => (
                                                                <option key={col} value={col}>{col}</option>
                                                            ))}
                                                        </select>
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                </div>
                            )}

                            {status && (
                                <div className={clsx(
                                    "p-5 rounded-2xl flex items-start gap-4 border animate-in slide-in-from-top-4",
                                    status.type === 'success' ? "bg-emerald-500/10 border-emerald-500/20 text-emerald-600 dark:text-emerald-400" : "bg-rose-500/10 border-rose-500/20 text-rose-600 dark:text-rose-400"
                                )}>
                                    {status.type === 'success' ? <CheckCircle2 size={20} className="shrink-0" /> : <AlertCircle size={20} className="shrink-0" />}
                                    <div className="space-y-1">
                                        <p className="text-sm font-black uppercase tracking-wider">{status.type === 'success' ? 'Éxito' : 'Error en Carga'}</p>
                                        <p className="text-xs font-bold leading-relaxed">{status.message}</p>
                                    </div>
                                </div>
                            )}
                        </div>

                        {/* Footer */}
                        <div className="px-8 py-6 border-t border-border bg-muted/20 flex justify-between items-center">
                            <div className="text-[10px] text-muted-foreground font-bold uppercase tracking-widest">
                                {step === 'MAPPING' && `Columas vinculadas: ${Object.keys(mapping).length} / ${ERP_FIELDS.length}`}
                            </div>
                            <div className="flex gap-4">
                                <button
                                    onClick={() => step === 'MAPPING' ? setStep('UPLOAD') : setIsOpen(false)}
                                    className="px-6 py-2.5 text-sm font-bold text-muted-foreground hover:text-foreground transition-colors"
                                >
                                    {step === 'MAPPING' ? 'Volver' : 'Cerrar'}
                                </button>
                                {step === 'MAPPING' && (
                                    <button
                                        onClick={handleConfirmUpload}
                                        disabled={isUploading || !mapping.sku || !mapping.nombre}
                                        className="px-8 py-2.5 bg-primary text-primary-foreground text-sm font-black rounded-2xl shadow-xl shadow-primary/20 hover:scale-105 active:scale-95 disabled:opacity-50 disabled:hover:scale-100 transition-all flex items-center gap-2"
                                    >
                                        {isUploading ? (
                                            <>
                                                <Loader2 className="h-4 w-4 animate-spin" />
                                                Procesando...
                                            </>
                                        ) : (
                                            <>
                                                <Save size={18} />
                                                Iniciar Importación
                                            </>
                                        )}
                                    </button>
                                )}
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </>
    )
}
