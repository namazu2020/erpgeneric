'use client'

import { useState, useEffect, useTransition } from "react"
import { Shield, Plus, Edit2, Trash2, CheckCircle2, Lock, Save, Loader2, X } from "lucide-react"
import { getRoles, createRole, updateRole, deleteRole, RoleDTO } from "@/actions/role-actions"
import { PERMISSIONS } from "@/lib/permissions"
import clsx from "clsx"

export default function RolesPage() {
    const [roles, setRoles] = useState<RoleDTO[]>([])
    const [loading, setLoading] = useState(true)
    const [isPending, startTransition] = useTransition()

    // Modal State
    const [showModal, setShowModal] = useState(false)
    const [editingId, setEditingId] = useState<string | null>(null)

    // Form State
    const [formData, setFormData] = useState<RoleDTO>({
        name: "",
        description: "",
        permissions: []
    })

    useEffect(() => {
        loadRoles()
    }, [])

    async function loadRoles() {
        const data = await getRoles()
        setRoles(data)
        setLoading(false)
    }

    const handleOpenModal = (role?: RoleDTO) => {
        if (role) {
            setEditingId(role.id!)
            setFormData({
                name: role.name,
                description: role.description,
                permissions: role.permissions
            })
        } else {
            setEditingId(null)
            setFormData({
                name: "",
                description: "",
                permissions: []
            })
        }
        setShowModal(true)
    }

    const togglePermission = (key: string) => {
        setFormData(prev => {
            const exists = prev.permissions.includes(key)
            return {
                ...prev,
                permissions: exists
                    ? prev.permissions.filter(p => p !== key)
                    : [...prev.permissions, key]
            }
        })
    }

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()
        startTransition(async () => {
            if (editingId) {
                await updateRole(editingId, formData)
            } else {
                await createRole(formData)
            }
            setShowModal(false)
            loadRoles()
        })
    }

    const handleDelete = async (id: string) => {
        if (confirm("¿Eliminar este rol? Los usuarios asignados perderán sus permisos.")) {
            await deleteRole(id)
            loadRoles()
        }
    }

    return (
        <div className="p-8 max-w-7xl mx-auto space-y-8 animate-in fade-in">
            {/* Header */}
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                <div>
                    <h1 className="text-3xl font-black text-foreground flex items-center gap-3">
                        <Shield className="h-8 w-8 text-primary" />
                        Roles y Permisos
                    </h1>
                    <p className="text-muted-foreground font-medium mt-1">
                        Crea perfiles de acceso personalizados para tus empleados.
                    </p>
                </div>
                <button
                    onClick={() => handleOpenModal()}
                    className="bg-primary text-primary-foreground px-5 py-3 rounded-2xl font-bold flex items-center gap-2 shadow-lg shadow-primary/20 hover:scale-105 transition-all"
                >
                    <Plus size={20} />
                    Crear Nuevo Rol
                </button>
            </div>

            {/* Roles Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
                {loading ? (
                    [1, 2, 3].map(i => <div key={i} className="h-48 bg-muted/20 animate-pulse rounded-3xl" />)
                ) : (
                    roles.map(role => (
                        <div key={role.id} className="group bg-card border border-border rounded-3xl p-6 flex flex-col transition-all hover:border-primary/30 hover:shadow-xl">
                            <div className="flex justify-between items-start mb-4">
                                <div className="p-3 bg-primary/10 rounded-2xl text-primary">
                                    <Lock size={24} />
                                </div>
                                <div className="flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                                    <button
                                        onClick={() => handleOpenModal(role)}
                                        className="p-2 hover:bg-muted rounded-xl text-muted-foreground hover:text-foreground"
                                    >
                                        <Edit2 size={18} />
                                    </button>
                                    <button
                                        onClick={() => handleDelete(role.id!)}
                                        className="p-2 hover:bg-rose-100 rounded-xl text-muted-foreground hover:text-rose-600"
                                    >
                                        <Trash2 size={18} />
                                    </button>
                                </div>
                            </div>

                            <h3 className="text-xl font-bold text-foreground mb-1">{role.name}</h3>
                            <p className="text-sm text-muted-foreground mb-6 line-clamp-2 h-10">
                                {role.description || "Sin descripción"}
                            </p>

                            <div className="mt-auto pt-4 border-t border-border flex items-center justify-between">
                                <span className="text-xs font-bold uppercase tracking-widest text-muted-foreground">
                                    {role.permissions.length} Permisos
                                </span>
                                {(role as any).isSystem && (
                                    <span className="px-2 py-1 bg-amber-100 text-amber-700 text-[10px] font-black rounded-lg uppercase">
                                        Sistema
                                    </span>
                                )}
                            </div>
                        </div>
                    ))
                )}
            </div>

            {/* Modal */}
            {showModal && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
                    <div className="bg-card w-full max-w-4xl max-h-[90vh] flex flex-col rounded-4xl shadow-2xl animate-in zoom-in-95">
                        {/* Modal Header */}
                        <div className="p-6 border-b border-border flex justify-between items-center bg-muted/5">
                            <div>
                                <h2 className="text-2xl font-black text-foreground">
                                    {editingId ? "Editar Rol" : "Nuevo Rol"}
                                </h2>
                                <p className="text-sm text-muted-foreground">Define el nombre y los permisos detallados.</p>
                            </div>
                            <button onClick={() => setShowModal(false)} className="p-2 hover:bg-muted rounded-full">
                                <X size={24} />
                            </button>
                        </div>

                        {/* Modal Body (Scrollable) */}
                        <div className="flex-1 overflow-y-auto p-6 space-y-6">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                <div className="space-y-2">
                                    <label className="text-xs font-bold uppercase text-muted-foreground">Nombre del Rol</label>
                                    <input
                                        value={formData.name}
                                        onChange={e => setFormData({ ...formData, name: e.target.value })}
                                        className="w-full bg-background border border-input rounded-xl p-3 focus:ring-2 focus:ring-primary/20 outline-none"
                                        placeholder="Ej: Gerente de Tienda"
                                    />
                                </div>
                                <div className="space-y-2">
                                    <label className="text-xs font-bold uppercase text-muted-foreground">Descripción</label>
                                    <input
                                        value={formData.description ?? ""}
                                        onChange={e => setFormData({ ...formData, description: e.target.value })}
                                        className="w-full bg-background border border-input rounded-xl p-3 focus:ring-2 focus:ring-primary/20 outline-none"
                                        placeholder="Descripción breve de responsabilidades"
                                    />
                                </div>
                            </div>

                            <div className="space-y-4">
                                <h3 className="text-sm font-black uppercase tracking-widest text-primary border-b border-border pb-2">
                                    Configuración de Permisos
                                </h3>

                                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                                    {Object.entries(PERMISSIONS).map(([groupKey, group]) => (
                                        <div key={groupKey} className="space-y-3">
                                            <h4 className="font-bold text-foreground flex items-center gap-2 text-sm">
                                                <div className="h-2 w-2 rounded-full bg-primary" />
                                                {group.label}
                                            </h4>
                                            <div className="space-y-1">
                                                {group.actions.map(action => {
                                                    const isSelected = formData.permissions.includes(action.key)
                                                    return (
                                                        <button
                                                            key={action.key}
                                                            type="button"
                                                            onClick={() => togglePermission(action.key)}
                                                            className={clsx(
                                                                "w-full flex items-center gap-3 p-2 rounded-lg text-sm transition-all border",
                                                                isSelected
                                                                    ? "bg-primary/10 border-primary/30 text-primary font-semibold"
                                                                    : "bg-transparent border-transparent hover:bg-muted text-muted-foreground"
                                                            )}
                                                        >
                                                            <div className={clsx(
                                                                "h-5 w-5 rounded border flex items-center justify-center transition-colors",
                                                                isSelected ? "bg-primary border-primary text-primary-foreground" : "border-muted-foreground/30 bg-background"
                                                            )}>
                                                                {isSelected && <CheckCircle2 size={14} />}
                                                            </div>
                                                            {action.label}
                                                        </button>
                                                    )
                                                })}
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        </div>

                        {/* Modal Footer */}
                        <div className="p-6 border-t border-border bg-muted/5 flex justify-end gap-3 sticky bottom-0">
                            <button
                                onClick={() => setShowModal(false)}
                                className="px-6 py-3 rounded-xl font-bold text-muted-foreground hover:bg-muted transition-colors"
                            >
                                Cancelar
                            </button>
                            <button
                                onClick={handleSubmit}
                                disabled={isPending || !formData.name}
                                className="px-8 py-3 rounded-xl bg-primary text-primary-foreground font-bold shadow-lg shadow-primary/20 hover:scale-105 active:scale-95 transition-all disabled:opacity-50 disabled:scale-100 flex items-center gap-2"
                            >
                                {isPending ? <Loader2 className="animate-spin" size={20} /> : <><Save size={20} /> Guardar Rol</>}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    )
}
