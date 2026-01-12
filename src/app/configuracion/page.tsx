'use client'

import { useState, useEffect, useTransition } from 'react'
import { wipeDatabase } from '@/actions/admin-actions'
import { obtenerConfiguracionEmpresa, guardarConfiguracionEmpresa } from '@/actions/config-actions'
import {
    Trash2,
    AlertTriangle,
    CheckCircle,
    Building2,
    Save,
    Loader2,
    ShieldAlert,
    Info,
    Mail,
    Phone,
    MapPin,
    FileSignature,
    CreditCard
} from 'lucide-react'
import { toast } from 'sonner'
import { authClient } from '@/lib/auth-client'

export default function ConfiguracionPage() {
    const { data: session } = authClient.useSession()
    const sessionUser = session?.user as any
    const role = sessionUser?.role || sessionUser?.rol
    const permissions = (session?.user as any)?.permissions || []
    const canEdit = role === 'SUPER_ADMIN' || permissions.includes("admin:all") || permissions.includes("cfg:empresa")
    const canWipe = role === 'SUPER_ADMIN' || permissions.includes("admin:all") || permissions.includes("cfg:sistema")

    const [isPending, startTransition] = useTransition()
    const [isWiping, setIsWiping] = useState(false)
    const [config, setConfig] = useState({
        razonSocial: '',
        cuit: '',
        direccion: '',
        telefono: '',
        email: '',
        domicilioFiscal: '',
        condicionIva: 'RESPONSABLE_INSCRIPTO',
        tipoEmpresa: 'MICRO',
        esMiPyME: false,
        ivaTrimestral: false,
        alicuotaIIBB: 3.0,
        alicuotaLeyCheque: 1.2,
        jurisdicciones: [],
    })

    useEffect(() => {
        async function loadConfig() {
            const data = await obtenerConfiguracionEmpresa()
            if (data) {
                setConfig({
                    razonSocial: data.razonSocial,
                    cuit: data.cuit,
                    direccion: data.direccion,
                    telefono: data.telefono,
                    email: data.email,
                    domicilioFiscal: data.domicilioFiscal,
                    condicionIva: data.condicionIva,
                    tipoEmpresa: data.tipoEmpresa,
                    esMiPyME: data.esMiPyME,
                    ivaTrimestral: data.ivaTrimestral,
                    alicuotaIIBB: data.alicuotaIIBB,
                    alicuotaLeyCheque: data.alicuotaLeyCheque,
                    jurisdicciones: JSON.parse(data.jurisdicciones || '[]'),
                })
            }
        }
        loadConfig()
    }, [])

    const handleSaveConfig = async (e: React.FormEvent) => {
        e.preventDefault()
        startTransition(async () => {
            const res = await guardarConfiguracionEmpresa(config)
            if (res.success) {
                toast.success("Configuración guardada correctamente")
            } else {
                toast.error(res.error || "Error al guardar")
            }
        })
    }

    const handleWipe = async () => {
        if (!confirm('¿ESTÁS SEGURO? Esta acción borrará TODOS los productos, ventas, movimientos y clientes. No se puede deshacer.')) {
            return
        }

        setIsWiping(true)
        try {
            const res = await wipeDatabase()
            if (res.success) {
                toast.success('Base de datos reseteada correctamente.')
            } else {
                toast.error(res.error || 'Error desconocido')
            }
        } catch (error) {
            toast.error('Error de conexión')
        } finally {
            setIsWiping(false)
        }
    }

    return (
        <div className="p-8 max-w-6xl mx-auto space-y-12 animate-in fade-in duration-500 pb-20">
            {/* Header */}
            <div className="flex items-center gap-4 border-b border-border/50 pb-6">
                <div className="p-3 bg-primary/10 rounded-2xl text-primary">
                    <Building2 size={32} />
                </div>
                <div>
                    <h1 className="text-3xl font-black tracking-tight text-foreground">Configuración Avanzada</h1>
                    <p className="text-muted-foreground font-medium">Parámetros impositivos de ARCA y perfil mayorista/distribuidora.</p>
                </div>
            </div>

            <form onSubmit={handleSaveConfig} className="space-y-8">
                {/* 1. Datos Identificatorios */}
                <div className="bg-card/50 backdrop-blur-md border border-border rounded-3xl overflow-hidden shadow-xl">
                    <div className="p-6 bg-muted/20 border-b border-border flex items-center gap-3">
                        <FileSignature className="text-primary" size={20} />
                        <h2 className="text-lg font-bold">Identidad de la Empresa</h2>
                    </div>

                    <div className="p-8 grid grid-cols-1 md:grid-cols-2 gap-8">
                        <div className="space-y-2">
                            <label className="text-xs font-black uppercase tracking-widest text-muted-foreground flex items-center gap-2">
                                <Building2 size={14} /> Razón Social
                            </label>
                            <input
                                required
                                value={config.razonSocial}
                                onChange={(e) => setConfig({ ...config, razonSocial: e.target.value })}
                                className="w-full bg-background border border-border rounded-xl px-4 py-3 focus:ring-2 focus:ring-primary/20 outline-none transition-all"
                                placeholder="Nombre comercial o legal"
                            />
                        </div>

                        <div className="space-y-2">
                            <label className="text-xs font-black uppercase tracking-widest text-muted-foreground flex items-center gap-2">
                                <CreditCard size={14} /> CUIT
                            </label>
                            <input
                                required
                                value={config.cuit}
                                onChange={(e) => setConfig({ ...config, cuit: e.target.value })}
                                className="w-full bg-background border border-border rounded-xl px-4 py-3 focus:ring-2 focus:ring-primary/20 outline-none transition-all"
                                placeholder="30-12345678-9"
                            />
                        </div>

                        <div className="space-y-2">
                            <label className="text-xs font-black uppercase tracking-widest text-muted-foreground flex items-center gap-2">
                                <MapPin size={14} /> Dirección Comercial
                            </label>
                            <input
                                required
                                value={config.direccion}
                                onChange={(e) => setConfig({ ...config, direccion: e.target.value })}
                                className="w-full bg-background border border-border rounded-xl px-4 py-3 focus:ring-2 focus:ring-primary/20 outline-none transition-all"
                            />
                        </div>

                        <div className="space-y-2">
                            <label className="text-xs font-black uppercase tracking-widest text-muted-foreground flex items-center gap-2">
                                <Mail size={14} /> Contacto Administrativo
                            </label>
                            <input
                                required
                                value={config.email}
                                onChange={(e) => setConfig({ ...config, email: e.target.value })}
                                className="w-full bg-background border border-border rounded-xl px-4 py-3 focus:ring-2 focus:ring-primary/20 outline-none transition-all"
                                placeholder="admin@distribuidora.com"
                            />
                        </div>
                    </div>
                </div>

                {/* 2. Perfil Impositivo ARCA */}
                <div className="bg-card/50 backdrop-blur-md border border-border rounded-3xl overflow-hidden shadow-xl">
                    <div className="p-6 bg-primary/10 border-b border-border flex items-center gap-3">
                        <ShieldAlert className="text-primary" size={20} />
                        <h2 className="text-lg font-bold text-foreground">Perfil Fiscal y ARCA</h2>
                    </div>

                    <div className="p-8 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                        <div className="space-y-2">
                            <label className="text-xs font-black uppercase tracking-widest text-muted-foreground">Condición IVA</label>
                            <select
                                value={config.condicionIva}
                                onChange={(e) => setConfig({ ...config, condicionIva: e.target.value })}
                                className="w-full bg-background border border-border rounded-xl px-4 py-3 focus:ring-2 focus:ring-primary/20 outline-none transition-all"
                            >
                                <option value="RESPONSABLE_INSCRIPTO">Responsable Inscripto</option>
                                <option value="MONOTRIBUTO">Monotributo</option>
                                <option value="EXENTO">Exento</option>
                            </select>
                        </div>

                        <div className="space-y-2">
                            <label className="text-xs font-black uppercase tracking-widest text-muted-foreground">Categoría MiPyME</label>
                            <select
                                value={config.tipoEmpresa}
                                onChange={(e) => setConfig({ ...config, tipoEmpresa: e.target.value })}
                                className="w-full bg-background border border-border rounded-xl px-4 py-3 focus:ring-2 focus:ring-primary/20 outline-none transition-all"
                            >
                                <option value="MICRO">Micro Empresa</option>
                                <option value="PEQUEÑA">Pequeña Empresa</option>
                                <option value="MEDIANA_T1">Mediana Tramo 1</option>
                                <option value="MEDIANA_T2">Mediana Tramo 2</option>
                                <option value="GRANDE">Gran Empresa</option>
                            </select>
                        </div>

                        <div className="flex flex-col justify-center space-y-4 pt-4">
                            <label className="relative flex items-center cursor-pointer group">
                                <input
                                    type="checkbox"
                                    checked={config.esMiPyME}
                                    onChange={(e) => setConfig({ ...config, esMiPyME: e.target.checked })}
                                    className="sr-only peer"
                                />
                                <div className="w-11 h-6 bg-muted rounded-full peer peer-focus:ring-2 peer-focus:ring-primary/30 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-primary"></div>
                                <span className="ml-3 text-sm font-bold text-foreground">Certificado MiPyME Activo</span>
                            </label>

                            <label className="relative flex items-center cursor-pointer group">
                                <input
                                    type="checkbox"
                                    checked={config.ivaTrimestral}
                                    onChange={(e) => setConfig({ ...config, ivaTrimestral: e.target.checked })}
                                    className="sr-only peer"
                                />
                                <div className="w-11 h-6 bg-muted rounded-full peer peer-focus:ring-2 peer-focus:ring-primary/30 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-primary"></div>
                                <span className="ml-3 text-sm font-bold text-foreground">Pago IVA Trimestral</span>
                            </label>
                        </div>

                        <div className="space-y-2">
                            <label className="text-xs font-black uppercase tracking-widest text-muted-foreground">Alícuota IIBB (%)</label>
                            <input
                                type="number"
                                step="0.01"
                                value={config.alicuotaIIBB}
                                onChange={(e) => setConfig({ ...config, alicuotaIIBB: parseFloat(e.target.value) })}
                                className="w-full bg-background border border-border rounded-xl px-4 py-3 focus:ring-2 focus:ring-primary/20 outline-none transition-all"
                            />
                        </div>

                        <div className="space-y-2">
                            <label className="text-xs font-black uppercase tracking-widest text-muted-foreground">Imp. Ley 25413 (Cheque) (%)</label>
                            <input
                                type="number"
                                step="0.1"
                                value={config.alicuotaLeyCheque}
                                onChange={(e) => setConfig({ ...config, alicuotaLeyCheque: parseFloat(e.target.value) })}
                                className="w-full bg-background border border-border rounded-xl px-4 py-3 focus:ring-2 focus:ring-primary/20 outline-none transition-all"
                            />
                        </div>
                    </div>
                </div>

                {canEdit && (
                    <div className="flex justify-end gap-4">
                        <button
                            type="submit"
                            disabled={isPending}
                            className="bg-primary text-primary-foreground px-10 py-4 rounded-2xl font-black shadow-xl shadow-primary/20 hover:scale-105 active:scale-95 transition-all flex items-center gap-2 disabled:opacity-50"
                        >
                            {isPending ? <Loader2 className="animate-spin" size={20} /> : <><Save size={20} /> Guardar Perfil Impositivo</>}
                        </button>
                    </div>
                )}
            </form>


            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                {/* Info Card */}
                <div className="bg-card border border-border rounded-3xl p-6 shadow-sm">
                    <div className="flex items-center gap-3 mb-6">
                        <Info className="text-blue-500" size={20} />
                        <h2 className="text-lg font-bold">Estado del Sistema</h2>
                    </div>
                    <div className="space-y-4">
                        <div className="flex justify-between items-center p-3 bg-muted/30 rounded-xl">
                            <span className="text-xs font-bold text-muted-foreground uppercase">Base de Datos</span>
                            <span className="text-xs font-black text-green-500 flex items-center gap-2">
                                <span className="h-2 w-2 rounded-full bg-green-500 animate-pulse" />
                                PostgreSQL Online
                            </span>
                        </div>
                        <div className="flex justify-between items-center p-3 bg-muted/30 rounded-xl">
                            <span className="text-xs font-bold text-muted-foreground uppercase">Auditoría</span>
                            <span className="text-xs font-black text-primary">Triggers Activos</span>
                        </div>
                        <div className="flex justify-between items-center p-3 bg-muted/30 rounded-xl">
                            <span className="text-xs font-bold text-muted-foreground uppercase">Versión</span>
                            <span className="text-xs font-mono font-bold">v1.0.0-PROD</span>
                        </div>
                    </div>
                </div>

                {/* Wipe Card */}
                {canWipe && (
                    <div className="bg-rose-500/5 border border-rose-500/20 rounded-3xl p-6">
                        <div className="flex items-center gap-3 mb-4">
                            <ShieldAlert className="text-rose-500" size={20} />
                            <h2 className="text-lg font-bold text-rose-500">Zona de Peligro</h2>
                        </div>
                        <p className="text-sm text-muted-foreground mb-6">
                            El reseteo de base de datos es una operación irreversible que limpia todos los registros operativos del negocio.
                        </p>
                        <button
                            onClick={handleWipe}
                            disabled={isWiping}
                            className="w-full py-4 border-2 border-dashed border-rose-500/30 text-rose-500 rounded-2xl font-black uppercase text-xs tracking-widest hover:bg-rose-500 hover:text-white transition-all flex items-center justify-center gap-3 disabled:opacity-50"
                        >
                            {isWiping ? <Loader2 className="animate-spin" /> : <><Trash2 size={16} /> Wipe Database</>}
                        </button>
                    </div>
                )}
            </div>
        </div>
    )
}
