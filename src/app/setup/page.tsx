'use client'

import { createInitialUser } from "@/actions/auth-actions"
import { useState, useTransition } from "react"
import { ShieldCheck, User, Mail, Lock, Loader2 } from "lucide-react"
import { useRouter } from "next/navigation"

export default function SetupPage() {
    const [isPending, startTransition] = useTransition()
    const [error, setError] = useState<string | null>(null)
    const router = useRouter()

    async function handleSubmit(formData: FormData) {
        setError(null)
        startTransition(async () => {
            const res = await createInitialUser(formData)
            if (res.error) {
                setError(res.error)
            } else {
                router.push('/login')
            }
        })
    }

    return (
        <div className="min-h-screen flex items-center justify-center bg-linear-to-br from-slate-900 via-slate-800 to-slate-900 p-4">
            <div className="w-full max-w-md bg-white/10 backdrop-blur-xl rounded-[2.5rem] border border-white/20 p-8 shadow-2xl">
                <div className="text-center space-y-2 mb-8">
                    <div className="inline-flex h-16 w-16 items-center justify-center rounded-3xl bg-primary/20 text-primary border border-primary/30 mb-2">
                        <ShieldCheck size={32} />
                    </div>
                    <h1 className="text-3xl font-black text-white tracking-tight">Bienvenido</h1>
                    <p className="text-slate-400 font-medium">Configura tu cuenta de administrador</p>
                </div>

                <form action={handleSubmit} className="space-y-5">
                    <div className="space-y-2">
                        <label className="text-xs font-bold text-slate-400 uppercase tracking-widest ml-1">Nombre Completo</label>
                        <div className="relative">
                            <User className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500" size={18} />
                            <input
                                name="nombre"
                                required
                                className="w-full bg-white/5 border border-white/10 rounded-2xl py-3.5 pl-11 pr-4 text-white focus:outline-none focus:ring-2 focus:ring-primary/50 transition-all"
                                placeholder="Admin Name"
                            />
                        </div>
                    </div>

                    <div className="space-y-2">
                        <label className="text-xs font-bold text-slate-400 uppercase tracking-widest ml-1">Email Principal</label>
                        <div className="relative">
                            <Mail className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500" size={18} />
                            <input
                                name="email"
                                type="email"
                                required
                                className="w-full bg-white/5 border border-white/10 rounded-2xl py-3.5 pl-11 pr-4 text-white focus:outline-none focus:ring-2 focus:ring-primary/50 transition-all"
                                placeholder="admin@empresa.com"
                            />
                        </div>
                    </div>

                    <div className="space-y-2">
                        <label className="text-xs font-bold text-slate-400 uppercase tracking-widest ml-1">Contraseña</label>
                        <div className="relative">
                            <Lock className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500" size={18} />
                            <input
                                name="password"
                                type="password"
                                required
                                className="w-full bg-white/5 border border-white/10 rounded-2xl py-3.5 pl-11 pr-4 text-white focus:outline-none focus:ring-2 focus:ring-primary/50 transition-all"
                                placeholder="••••••••"
                            />
                        </div>
                    </div>

                    {error && (
                        <div className="p-4 bg-rose-500/10 border border-rose-500/30 text-rose-400 text-sm font-bold rounded-2xl text-center">
                            {error}
                        </div>
                    )}

                    <button
                        disabled={isPending}
                        className="w-full bg-primary hover:bg-primary/90 text-primary-foreground font-black py-4 rounded-2xl shadow-xl shadow-primary/20 transition-all hover:scale-[1.02] active:scale-[0.98] flex items-center justify-center gap-2 mt-4"
                    >
                        {isPending ? <Loader2 className="animate-spin" size={20} /> : "CREAR CUENTA ADMIN"}
                    </button>
                </form>

                <p className="text-center text-slate-500 text-xs mt-6 font-medium">
                    Una vez configurado, podrás acceder a todos los módulos.
                </p>
            </div>
        </div>
    )
}
