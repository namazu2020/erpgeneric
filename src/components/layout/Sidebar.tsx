'use client'

import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import {
    Box,
    ShoppingCart,
    Users,
    FileText,
    Settings,
    LayoutDashboard,
    LogOut,
    Hexagon,
    ReceiptText,
    Wallet,
    ShieldCheck
} from 'lucide-react'
import clsx from 'clsx'
import { ModeToggle } from '@/components/mode-toggle'
import { authClient } from '@/lib/auth-client' // Better Auth Client

const menuItems = [
    { name: 'Resumen', href: '/', icon: LayoutDashboard }, // Dashboard is public for all users
    { name: 'Inventario', href: '/inventario', icon: Box, permission: 'inv:ver' },
    { name: 'Caja', href: '/caja', icon: Wallet, permission: 'caja:ver' },
    { name: 'Ventas', href: '/ventas', icon: ShoppingCart, permission: 'vta:acceso' },
    { name: 'Facturación', href: '/facturacion', icon: ReceiptText, permission: 'vta:acceso' },
    { name: 'Contabilidad', href: '/contabilidad', icon: FileText, permission: 'cont:ver' },
    { name: 'Clientes', href: '/clientes', icon: Users, permission: 'cli:ver' },
    { name: 'Reportes', href: '/reportes', icon: FileText, permission: 'rep:ver' },
    { name: 'Usuarios', href: '/configuracion/usuarios', icon: Users, permission: 'cfg:usuarios' },
    { name: 'Roles y Permisos', href: '/configuracion/roles', icon: ShieldCheck, permission: 'cfg:usuarios' },
    { name: 'Configuración', href: '/configuracion', icon: Settings, permission: 'cfg:empresa' },
]

export default function Sidebar() {
    const pathname = usePathname()
    const router = useRouter()

    // Better Auth Hook
    const { data: session } = authClient.useSession()
    const user = session?.user

    // Casting seguro porque inyectamos permissions en auth.ts
    const permissions = (user as any)?.permissions || []
    const userRole = (user as any)?.role || (user as any)?.rol // auth.ts mapea role, pero por si acaso

    const handleSignOut = async () => {
        await authClient.signOut({
            fetchOptions: {
                onSuccess: () => {
                    router.push("/login")
                }
            }
        })
    }

    const canSee = (item: typeof menuItems[0]) => {
        if (!item.permission) return true
        if (permissions.includes("admin:all") || userRole === 'ADMIN' || userRole === 'SUPER_ADMIN') return true
        return permissions.includes(item.permission)
    }

    return (
        <aside className="h-full flex flex-col bg-card/80 backdrop-blur-xl border-r border-border shadow-2xl md:shadow-none md:rounded-2xl md:my-4 md:ml-4 md:border md:border-white/10 overflow-hidden">
            {/* Branding Header */}
            <div className="h-24 flex items-center justify-center p-6 border-b border-border/50 bg-linear-to-b from-white/5 to-transparent">
                <Link href="/" className="group flex items-center gap-3 w-full">
                    <div className="relative flex h-12 w-12 items-center justify-center rounded-2xl bg-primary shadow-lg shadow-primary/30 ring-4 ring-white/10 transition-all duration-300 group-hover:scale-110 group-hover:rotate-3">
                        <Hexagon className="h-6 w-6 text-primary-foreground fill-white/20" strokeWidth={2.5} />
                        <div className="absolute inset-0 rounded-2xl bg-linear-to-tr from-white/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
                    </div>
                    <div className="flex flex-col">
                        <span className="font-black text-xl tracking-tight text-foreground group-hover:text-primary transition-colors">
                            Generic
                            <span className="text-primary font-light">ERP</span>
                        </span>
                        <span className="text-primary-foreground/50 text-[10px] font-bold uppercase tracking-[0.2em] group-hover:text-primary/70 transition-colors">
                            Enterprise
                        </span>
                    </div>
                </Link>
            </div>

            {/* Main Navigation */}
            <nav className="flex-1 overflow-y-auto px-4 py-8 space-y-2 scrollbar-hide">
                <div className="text-xs font-bold text-muted-foreground/50 uppercase tracking-widest mb-4 px-2">Menu Principal</div>

                {menuItems.filter(canSee).map((item) => {
                    const isActive = pathname === item.href

                    return (
                        <Link
                            key={item.href}
                            href={item.href}
                            className={clsx(
                                'relative group flex items-center gap-4 rounded-xl px-4 py-3.5 text-sm font-semibold transition-all duration-300',
                                isActive
                                    ? 'bg-primary text-primary-foreground shadow-lg shadow-primary/25 translate-x-1'
                                    : 'text-muted-foreground hover:bg-muted/50 hover:text-foreground hover:pl-6'
                            )}
                        >
                            <item.icon
                                className={clsx(
                                    'h-5 w-5 transition-all duration-300',
                                    isActive
                                        ? 'text-primary-foreground scale-110'
                                        : 'text-muted-foreground/70 group-hover:text-primary group-hover:scale-110'
                                )}
                                strokeWidth={isActive ? 2.5 : 2}
                            />
                            <span className="tracking-wide relative z-10">{item.name}</span>

                            {/* Active/Hover Glow */}
                            {isActive && (
                                <div className="absolute inset-0 rounded-xl bg-linear-to-r from-white/20 to-transparent opacity-20" />
                            )}
                        </Link>
                    )
                })}
            </nav>

            {/* User Profile Footer */}
            <div className="mt-auto p-4 m-4 bg-muted/30 rounded-2xl border border-white/5 backdrop-blur-md">
                <div className="flex justify-between items-center mb-3">
                    <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest">Cuenta</span>
                    <ModeToggle />
                </div>

                <div className="flex items-center gap-3">
                    <div className="h-10 w-10 rounded-full bg-linear-to-tr from-primary to-purple-500 p-[2px] shadow-lg">
                        <div className="h-full w-full rounded-full bg-card flex items-center justify-center overflow-hidden">
                            <span className="font-bold text-primary text-xs">
                                {user?.name?.substring(0, 2).toUpperCase() || 'US'}
                            </span>
                        </div>
                    </div>

                    <div className="flex flex-col min-w-0 flex-1">
                        <span className="truncate text-sm font-bold text-foreground">{user?.name || 'Usuario'}</span>
                        <span className="truncate text-xs text-muted-foreground font-medium">
                            {userRole || 'VENDEDOR'}
                        </span>
                    </div>

                    <button
                        onClick={handleSignOut}
                        className="p-2 rounded-xl text-muted-foreground hover:text-red-500 hover:bg-red-500/10 transition-all"
                        title="Cerrar Sesión"
                    >
                        <LogOut className="h-4 w-4" />
                    </button>
                </div>
            </div>
        </aside>
    )
}
