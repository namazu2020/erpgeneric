'use client'

import { useState, useTransition } from 'react'
import { registrarTenant } from '@/actions/saas-actions'
import { useRouter } from 'next/navigation'
import { Loader2, CheckCircle, Store, User, Mail, Lock, CreditCard } from 'lucide-react'

export default function RegisterPage() {
    const [isPending, startTransition] = useTransition()
    const [error, setError] = useState('')
    const [success, setSuccess] = useState(false)
    const router = useRouter()

    const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault()
        setError('')
        const formData = new FormData(e.currentTarget)

        const data = {
            empresaNombre: formData.get('empresaNombre') as string,
            cuit: formData.get('cuit') as string,
            adminNombre: formData.get('adminNombre') as string,
            adminEmail: formData.get('adminEmail') as string,
            adminPassword: formData.get('adminPassword') as string
        }

        startTransition(async () => {
            const res = await registrarTenant(data)
            if (res.error) {
                setError(res.error)
            } else {
                setSuccess(true)
                setTimeout(() => router.push('/login'), 3000)
            }
        })
    }

    if (success) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-gray-50">
                <div className="max-w-md w-full p-8 bg-white rounded-2xl shadow-xl text-center space-y-4 animate-in zoom-in">
                    <div className="h-20 w-20 bg-emerald-100 text-emerald-600 rounded-full flex items-center justify-center mx-auto mb-4">
                        <CheckCircle size={40} />
                    </div>
                    <h2 className="text-2xl font-bold text-gray-900">¡Cuenta Creada!</h2>
                    <p className="text-gray-500">Tu entorno empresarial ha sido configurado correctamente.</p>
                    <p className="text-sm text-gray-400">Redirigiendo al login...</p>
                </div>
            </div>
        )
    }

    return (
        <div className="min-h-screen flex flex-col md:flex-row font-sans">
            {/* Left: Branding */}
            <div className="hidden md:flex flex-col justify-between w-1/2 bg-slate-900 p-12 text-white">
                <div className="space-y-4">
                    <h1 className="text-4xl font-black tracking-tighter">Seiton ERP</h1>
                    <p className="text-slate-400 text-lg">La plataforma operativa para mayoristas modernos.</p>
                </div>
                <div className="space-y-4 text-sm text-slate-500">
                    <div className="flex items-center gap-3">
                        <div className="h-8 w-8 rounded-full bg-slate-800 flex items-center justify-center text-emerald-500">
                            <CheckCircle size={14} />
                        </div>
                        <p>Gestión de Stock Multidimensional</p>
                    </div>
                    <div className="flex items-center gap-3">
                        <div className="h-8 w-8 rounded-full bg-slate-800 flex items-center justify-center text-emerald-500">
                            <CheckCircle size={14} />
                        </div>
                        <p>Facturación y Cuentas Corrientes</p>
                    </div>
                    <div className="flex items-center gap-3">
                        <div className="h-8 w-8 rounded-full bg-slate-800 flex items-center justify-center text-emerald-500">
                            <CheckCircle size={14} />
                        </div>
                        <p>Contabilidad Automática</p>
                    </div>
                </div>
            </div>

            {/* Right: Form */}
            <div className="flex-1 flex items-center justify-center p-8 bg-white">
                <div className="w-full max-w-md space-y-8">
                    <div className="text-center md:text-left">
                        <h2 className="text-3xl font-bold text-gray-900">Comienza Gratis</h2>
                        <p className="mt-2 text-gray-500">Crea tu cuenta de empresa en segundos.</p>
                    </div>

                    <form onSubmit={handleSubmit} className="space-y-6">
                        <div className="space-y-4">
                            <div className="space-y-2">
                                <label className="text-xs font-bold uppercase text-gray-500">Tu Empresa</label>
                                <div className="relative">
                                    <Store className="absolute left-3 top-3 h-5 w-5 text-gray-400" />
                                    <input required name="empresaNombre" type="text" placeholder="Nombre del Negocio" className="pl-10 w-full p-3 rounded-xl border border-gray-200 focus:ring-2 focus:ring-slate-900 focus:border-slate-900 transition-all outline-none" />
                                </div>
                            </div>

                            <div className="space-y-2">
                                <label className="text-xs font-bold uppercase text-gray-500">Identificación Fiscal</label>
                                <div className="relative">
                                    <CreditCard className="absolute left-3 top-3 h-5 w-5 text-gray-400" />
                                    <input required name="cuit" type="text" placeholder="CUIT / RUT" className="pl-10 w-full p-3 rounded-xl border border-gray-200 focus:ring-2 focus:ring-slate-900 focus:border-slate-900 transition-all outline-none" />
                                </div>
                            </div>

                            <hr className="border-gray-100" />

                            <div className="space-y-2">
                                <label className="text-xs font-bold uppercase text-gray-500">Administrador</label>
                                <div className="grid grid-cols-2 gap-4">
                                    <div className="relative col-span-2">
                                        <User className="absolute left-3 top-3 h-5 w-5 text-gray-400" />
                                        <input required name="adminNombre" type="text" placeholder="Tu Nombre Completo" className="pl-10 w-full p-3 rounded-xl border border-gray-200 focus:ring-2 focus:ring-slate-900 focus:border-slate-900 transition-all outline-none" />
                                    </div>
                                    <div className="relative col-span-2">
                                        <Mail className="absolute left-3 top-3 h-5 w-5 text-gray-400" />
                                        <input required name="adminEmail" type="email" placeholder="usuario@empresa.com" className="pl-10 w-full p-3 rounded-xl border border-gray-200 focus:ring-2 focus:ring-slate-900 focus:border-slate-900 transition-all outline-none" />
                                    </div>
                                    <div className="relative col-span-2">
                                        <Lock className="absolute left-3 top-3 h-5 w-5 text-gray-400" />
                                        <input required name="adminPassword" type="password" placeholder="Contraseña Segura" className="pl-10 w-full p-3 rounded-xl border border-gray-200 focus:ring-2 focus:ring-slate-900 focus:border-slate-900 transition-all outline-none" />
                                    </div>
                                </div>
                            </div>
                        </div>

                        {error && (
                            <div className="p-3 bg-rose-50 text-rose-600 text-sm rounded-lg font-medium">
                                {error}
                            </div>
                        )}

                        <button
                            type="submit"
                            disabled={isPending}
                            className="w-full bg-slate-900 text-white font-bold py-4 rounded-xl shadow-lg hover:bg-slate-800 transition-all active:scale-[0.98] disabled:opacity-70 flex items-center justify-center gap-2"
                        >
                            {isPending && <Loader2 className="animate-spin" />}
                            Crear Cuenta Empresarial
                        </button>
                    </form>
                </div>
            </div>
        </div>
    )
}
