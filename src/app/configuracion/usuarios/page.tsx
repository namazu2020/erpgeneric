'use client'

import { useState, useEffect, useTransition } from "react"
import { getUsers, createEmployee, updateUser, deleteUser } from "@/actions/auth-actions"
import { getRoles, RoleDTO } from "@/actions/role-actions"
import {
    UserPlus,
    Trash2,
    ShieldCheck,
    Shield,
    User,
    Mail,
    Key,
    Loader2,
    CheckCircle2,
    BadgeCheck,
    Receipt,
    Edit2,
    X,
} from "lucide-react"
import { format } from "date-fns"
import { es } from "date-fns/locale"

export default function UsuariosPage() {
    const [usuarios, setUsuarios] = useState<any[]>([])
    const [rolesList, setRolesList] = useState<RoleDTO[]>([])

    const [isPending, startTransition] = useTransition()
    const [showModal, setShowModal] = useState(false)
    const [isEditing, setIsEditing] = useState(false)
    const [loading, setLoading] = useState(true)
    const [error, setError] = useState<string | null>(null)

    // Form states
    const [userId, setUserId] = useState<string | null>(null)
    const [nombre, setNombre] = useState("")
    const [email, setEmail] = useState("")
    const [password, setPassword] = useState("")

    // We now use roleId (for new roles) or fall back to legacy string
    const [selectedRoleId, setSelectedRoleId] = useState<string>("")
    // "Legacy" roles mapped for UI consistency if no roleId is present
    const [legacyRole, setLegacyRole] = useState("VENDEDOR")

    useEffect(() => {
        loadData()
    }, [])

    async function loadData() {
        setLoading(true)
        const [usersData, rolesData] = await Promise.all([
            getUsers(),
            getRoles()
        ])
        setUsuarios(usersData)
        setRolesList(rolesData)
        setLoading(false)
    }

    const openCreateModal = () => {
        setIsEditing(false)
        setUserId(null)
        setNombre("")
        setEmail("")
        setPassword("")
        setSelectedRoleId("")
        setLegacyRole("VENDEDOR")
        setError(null)
        setShowModal(true)
    }

    const openEditModal = (user: any) => {
        setIsEditing(true)
        setUserId(user.id)
        setNombre(user.name)
        setEmail(user.email)
        setPassword("")

        // Logic to determine initial selection
        if (user.rol === 'SUPER_ADMIN') {
            setSelectedRoleId("SUPER_ADMIN_MAGIC_ID")
        } else if (user.role?.id) {
            setSelectedRoleId(user.role.id)
        } else {
            // Fallback for legacy users
            setSelectedRoleId("legacy_" + user.rol)
        }

        setError(null)
        setShowModal(true)
    }

    async function handleSubmit(e: React.FormEvent) {
        e.preventDefault()
        setError(null)

        // Determine final values
        let finalRolStr = "CUSTOM"
        let finalRoleId: string | undefined = undefined

        if (selectedRoleId === "SUPER_ADMIN_MAGIC_ID") {
            finalRolStr = "SUPER_ADMIN"
            finalRoleId = undefined
        } else if (selectedRoleId.startsWith("legacy_")) {
            finalRolStr = selectedRoleId.replace("legacy_", "")
            finalRoleId = undefined
        } else {
            // It's a real dynamic role ID
            finalRoleId = selectedRoleId
            // We set legacy string to CUSTOM
            finalRolStr = "CUSTOM"
        }

        startTransition(async () => {
            let res
            const payload = {
                nombre,
                email,
                rol: finalRolStr,
                roleId: finalRoleId,
                password: password || undefined
            }

            if (isEditing && userId) {
                res = await updateUser(userId, payload)
            } else {
                res = await createEmployee({ ...payload, password: password! })
            }

            if (res.error) {
                setError(res.error)
            } else {
                setShowModal(false)
                loadData()
            }
        })
    }

    async function handleDelete(id: string) {
        if (!confirm('¿Estás seguro de eliminar este usuario?')) return
        const res = await deleteUser(id)
        if (res.error) alert(res.error)
        else loadData()
    }

    return (
        <div className="p-8 max-w-6xl mx-auto space-y-8 animate-in fade-in duration-500">
            {/* Header section */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div className="space-y-1">
                    <h1 className="text-3xl font-black tracking-tight text-foreground flex items-center gap-3">
                        <ShieldCheck className="text-primary h-8 w-8" />
                        Gestión de Personal
                    </h1>
                    <p className="text-muted-foreground font-medium">Administra los accesos y roles de tu equipo</p>
                </div>

                <div className="flex gap-3">
                    {/* Link to Roles Config */}
                    <a href="/configuracion/roles" className="bg-secondary text-secondary-foreground px-5 py-3 rounded-2xl font-bold flex items-center gap-2 hover:bg-muted transition-all">
                        <Shield size={18} />
                        Gestionar Roles
                    </a>
                    <button
                        onClick={openCreateModal}
                        className="bg-primary text-primary-foreground px-6 py-3 rounded-2xl font-bold flex items-center gap-2 shadow-lg shadow-primary/20 hover:scale-[1.02] active:scale-[0.98] transition-all"
                    >
                        <UserPlus size={20} />
                        Nuevo Empleado
                    </button>
                </div>
            </div>

            {/* Users Table / List */}
            <div className="bg-card border border-border rounded-4xl overflow-hidden shadow-sm">
                <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse">
                        <thead>
                            <tr className="bg-muted/30 border-b border-border">
                                <th className="px-6 py-4 text-xs font-black uppercase tracking-widest text-muted-foreground">Usuario</th>
                                <th className="px-6 py-4 text-xs font-black uppercase tracking-widest text-muted-foreground">Rol Asignado</th>
                                <th className="px-6 py-4 text-xs font-black uppercase tracking-widest text-muted-foreground">Email</th>
                                <th className="px-6 py-4 text-xs font-black uppercase tracking-widest text-muted-foreground text-right">Acciones</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-border">
                            {loading ? (
                                Array(3).fill(0).map((_, i) => (
                                    <tr key={i} className="animate-pulse">
                                        <td colSpan={4} className="px-6 py-8 h-16 bg-slate-100/10" />
                                    </tr>
                                ))
                            ) : usuarios.map((user) => (
                                <tr key={user.id} className="hover:bg-muted/20 transition-colors group">
                                    <td className="px-6 py-4">
                                        <div className="flex items-center gap-3">
                                            <div className="h-10 w-10 rounded-xl bg-primary/10 text-primary flex items-center justify-center font-bold text-sm">
                                                {user.name.substring(0, 2).toUpperCase()}
                                            </div>
                                            <div>
                                                <p className="font-bold text-foreground">{user.name}</p>
                                                <p className="text-[10px] text-muted-foreground">Desde {format(new Date(user.createdAt), "PP", { locale: es })}</p>
                                            </div>
                                        </div>
                                    </td>
                                    <td className="px-6 py-4">
                                        {user.role ? (
                                            <span className="px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-tighter bg-violet-100 text-violet-700">
                                                {user.role.name}
                                            </span>
                                        ) : (
                                            <span className={`px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-tighter ${user.rol === 'ADMIN' ? 'bg-amber-100 text-amber-700' :
                                                user.rol === 'ADMINISTRATIVO' ? 'bg-blue-100 text-blue-700' : 'bg-slate-100 text-slate-700'
                                                }`}>
                                                {user.rol} (Legacy)
                                            </span>
                                        )}
                                    </td>
                                    <td className="px-6 py-4 text-xs font-medium text-muted-foreground">
                                        {user.email}
                                    </td>
                                    <td className="px-6 py-4 text-right">
                                        <div className="flex items-center justify-end gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                                            <button
                                                onClick={() => openEditModal(user)}
                                                className="p-2 text-muted-foreground hover:text-primary hover:bg-primary/10 rounded-lg transition-all"
                                                title="Editar Usuario"
                                            >
                                                <Edit2 size={16} />
                                            </button>
                                            <button
                                                onClick={() => handleDelete(user.id)}
                                                className="p-2 text-muted-foreground hover:text-rose-500 hover:bg-rose-50 rounded-lg transition-all"
                                                title="Eliminar Usuario"
                                            >
                                                <Trash2 size={16} />
                                            </button>
                                        </div>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>

            {/* Modal de Creación / Edición */}
            {showModal && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-md animate-in fade-in duration-200">
                    <div className="bg-card w-full max-w-lg rounded-[2.5rem] border border-border shadow-3xl overflow-hidden animate-in zoom-in-95 duration-200">
                        <div className="p-6 border-b border-border bg-linear-to-br from-card to-muted/50 flex justify-between items-center">
                            <div>
                                <h2 className="text-xl font-black tracking-tight text-foreground flex items-center gap-2">
                                    {isEditing ? <Edit2 className="text-primary" size={20} /> : <UserPlus className="text-primary" size={20} />}
                                    {isEditing ? 'Editar Empleado' : 'Registrar Empleado'}
                                </h2>
                                <p className="text-xs text-muted-foreground mt-1">
                                    {isEditing ? 'Modifica los datos del usuario seleccionado' : 'Define el acceso para el nuevo miembro'}
                                </p>
                            </div>
                            <button onClick={() => setShowModal(false)} className="p-2 hover:bg-muted rounded-full">
                                <X size={20} className="text-muted-foreground" />
                            </button>
                        </div>

                        <form onSubmit={handleSubmit} className="p-6 space-y-5">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div className="space-y-2">
                                    <label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground ml-1">Nombre</label>
                                    <div className="relative group">
                                        <User className="absolute left-4 top-1/2 -translate-y-1/2 text-muted-foreground group-focus-within:text-primary transition-colors" size={16} />
                                        <input required value={nombre} onChange={(e) => setNombre(e.target.value)} className="w-full bg-muted/50 border border-border rounded-xl py-3 pl-11 pr-4 focus:outline-none focus:ring-2 focus:ring-primary/20 transition-all font-medium text-sm" placeholder="Ejem: Juan Pérez" />
                                    </div>
                                </div>
                                <div className="space-y-2">
                                    <label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground ml-1">Email</label>
                                    <div className="relative group">
                                        <Mail className="absolute left-4 top-1/2 -translate-y-1/2 text-muted-foreground group-focus-within:text-primary transition-colors" size={16} />
                                        <input required type="email" value={email} onChange={(e) => setEmail(e.target.value)} className="w-full bg-muted/50 border border-border rounded-xl py-3 pl-11 pr-4 focus:outline-none focus:ring-2 focus:ring-primary/20 transition-all font-medium text-sm" placeholder="juan@ejemplo.com" />
                                    </div>
                                </div>
                            </div>

                            <div className="space-y-2">
                                <label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground ml-1">
                                    {isEditing ? 'Nueva Contraseña (Opcional)' : 'Contraseña Temporal'}
                                </label>
                                <div className="relative group">
                                    <Key className="absolute left-4 top-1/2 -translate-y-1/2 text-muted-foreground group-focus-within:text-primary transition-colors" size={16} />
                                    <input
                                        type="password"
                                        required={!isEditing}
                                        value={password}
                                        onChange={(e) => setPassword(e.target.value)}
                                        className="w-full bg-muted/50 border border-border rounded-xl py-3 pl-11 pr-4 focus:outline-none focus:ring-2 focus:ring-primary/20 transition-all font-medium text-sm"
                                        placeholder={isEditing ? "Dejar en blanco para no cambiar" : "••••••••"}
                                    />
                                </div>
                            </div>

                            <div className="space-y-3">
                                <label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground ml-1">
                                    Rol Asignado
                                </label>
                                <div className="grid grid-cols-1 gap-2 max-h-60 overflow-y-auto pr-1">
                                    {/* Roles Dinámicos */}
                                    {rolesList.length > 0 && (
                                        <>
                                            <p className="text-[10px] font-bold text-muted-foreground uppercase opacity-50 px-2 mt-1">Personalizados</p>
                                            {rolesList.map((r) => (
                                                <button
                                                    key={r.id}
                                                    type="button"
                                                    onClick={() => setSelectedRoleId(r.id!)}
                                                    className={`flex items-start gap-3 p-3 rounded-2xl border transition-all text-left group ${selectedRoleId === r.id
                                                        ? 'bg-violet-500/10 border-violet-500 shadow-sm'
                                                        : 'bg-muted/20 border-border hover:border-muted-foreground/30'
                                                        }`}
                                                >
                                                    <div className={`mt-0.5 p-1.5 rounded-lg transition-colors ${selectedRoleId === r.id ? 'bg-violet-600 text-white' : 'bg-muted text-muted-foreground group-hover:bg-muted-foreground/10'}`}>
                                                        <Shield size={16} />
                                                    </div>
                                                    <div>
                                                        <p className={`text-sm font-bold ${selectedRoleId === r.id ? 'text-violet-600' : 'text-foreground'}`}>{r.name}</p>
                                                        <p className="text-[10px] text-muted-foreground mt-0.5 leading-tight line-clamp-1">{r.description || 'Sin descripción'}</p>
                                                    </div>
                                                    {selectedRoleId === r.id && <CheckCircle2 className="ml-auto text-violet-600" size={18} />}
                                                </button>
                                            ))}
                                        </>
                                    )}

                                    <p className="text-[10px] font-bold text-muted-foreground uppercase opacity-50 px-2 mt-2">Sistema</p>
                                    <button
                                        type="button"
                                        onClick={() => setSelectedRoleId("SUPER_ADMIN_MAGIC_ID")}
                                        className={`flex items-start gap-3 p-3 rounded-2xl border transition-all text-left group ${selectedRoleId === "SUPER_ADMIN_MAGIC_ID"
                                            ? 'bg-rose-500/10 border-rose-500 shadow-sm'
                                            : 'bg-muted/20 border-border hover:border-muted-foreground/30'
                                            }`}
                                    >
                                        <div className={`mt-0.5 p-1.5 rounded-lg transition-colors ${selectedRoleId === "SUPER_ADMIN_MAGIC_ID" ? 'bg-rose-500 text-white' : 'bg-muted text-muted-foreground group-hover:bg-muted-foreground/10'}`}>
                                            <ShieldCheck size={16} />
                                        </div>
                                        <div>
                                            <p className={`text-sm font-bold ${selectedRoleId === "SUPER_ADMIN_MAGIC_ID" ? 'text-rose-600' : 'text-foreground'}`}>SUPER ADMIN</p>
                                            <p className="text-[10px] text-muted-foreground mt-0.5 leading-tight">Acceso total e irrestricto</p>
                                        </div>
                                        {selectedRoleId === "SUPER_ADMIN_MAGIC_ID" && <CheckCircle2 className="ml-auto text-rose-500" size={18} />}
                                    </button>

                                    {/* Roles Legacy (Backward Compatibility) */}
                                    <p className="text-[10px] font-bold text-muted-foreground uppercase opacity-50 px-2 mt-2">Básicos (Legacy)</p>
                                    {[
                                        { id: 'legacy_VENDEDOR', name: 'Vendedor', desc: 'Acceso básico' },
                                    ].map((lr) => (
                                        <button
                                            key={lr.id}
                                            type="button"
                                            onClick={() => setSelectedRoleId(lr.id)}
                                            className={`flex items-start gap-3 p-3 rounded-2xl border transition-all text-left group ${selectedRoleId === lr.id
                                                ? 'bg-amber-500/10 border-amber-500 shadow-sm'
                                                : 'bg-muted/20 border-border hover:border-muted-foreground/30'
                                                }`}
                                        >
                                            <div className={`mt-0.5 p-1.5 rounded-lg transition-colors ${selectedRoleId === lr.id ? 'bg-amber-500 text-white' : 'bg-muted text-muted-foreground group-hover:bg-muted-foreground/10'}`}>
                                                <BadgeCheck size={16} />
                                            </div>
                                            <div>
                                                <p className={`text-sm font-bold ${selectedRoleId === lr.id ? 'text-amber-600' : 'text-foreground'}`}>{lr.name}</p>
                                                <p className="text-[10px] text-muted-foreground mt-0.5 leading-tight">{lr.desc}</p>
                                            </div>
                                            {selectedRoleId === lr.id && <CheckCircle2 className="ml-auto text-amber-500" size={18} />}
                                        </button>
                                    ))}
                                </div>
                            </div>

                            {error && <div className="p-3 bg-rose-500/10 border border-rose-500/30 text-rose-500 text-xs font-bold rounded-xl text-center">{error}</div>}

                            <div className="flex gap-3 pt-2">
                                <button type="button" onClick={() => setShowModal(false)} className="flex-1 px-4 py-3 rounded-xl font-black text-xs uppercase tracking-widest border border-border hover:bg-muted transition-all">Cancelar</button>
                                <button disabled={isPending} className="flex-1 bg-primary text-primary-foreground px-4 py-3 rounded-xl font-black text-xs uppercase tracking-widest shadow-xl shadow-primary/20 hover:scale-[1.02] active:scale-[0.98] transition-all flex items-center justify-center gap-2">
                                    {isPending ? <Loader2 className="animate-spin" size={16} /> : (isEditing ? "GUARDAR CAMBIOS" : "CREAR USUARIO")}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    )
}
