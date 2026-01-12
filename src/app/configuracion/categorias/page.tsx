'use client'

import { useState, useEffect, useTransition } from "react"
import { getCategorias, createCategoria, updateCategoria, deleteCategoria } from "@/actions/categorias-actions"
import { Plus, Edit2, Trash2, Tag, Loader2, Save, X } from "lucide-react"

export default function CategoriasPage() {
    const [categorias, setCategorias] = useState<any[]>([])
    const [isLoading, setIsLoading] = useState(true)
    const [isPending, startTransition] = useTransition()

    // Create Mode
    const [newCatName, setNewCatName] = useState("")

    // Edit Mode
    const [editingId, setEditingId] = useState<string | null>(null)
    const [editingName, setEditingName] = useState("")

    useEffect(() => {
        loadCats()
    }, [])

    async function loadCats() {
        setIsLoading(true)
        const data = await getCategorias()
        setCategorias(data)
        setIsLoading(false)
    }

    const handleCreate = () => {
        if (!newCatName.trim()) return
        startTransition(async () => {
            const res = await createCategoria(newCatName)
            if (res.success) {
                setNewCatName("")
                loadCats()
            } else {
                alert(res.error)
            }
        })
    }

    const handleUpdate = () => {
        if (!editingId || !editingName.trim()) return
        startTransition(async () => {
            const res = await updateCategoria(editingId, editingName)
            if (res.success) {
                setEditingId(null)
                loadCats()
            } else {
                alert(res.error)
            }
        })
    }

    const handleDelete = (id: string) => {
        if (!confirm("¿Eliminar categoría?")) return
        startTransition(async () => {
            const res = await deleteCategoria(id)
            if (res.success) loadCats()
            else alert(res.error)
        })
    }

    return (
        <div className="p-8 max-w-4xl mx-auto space-y-8 animate-in fade-in duration-500">
            <div className="space-y-1">
                <h1 className="text-3xl font-black tracking-tight text-foreground flex items-center gap-3">
                    <Tag className="text-primary h-8 w-8" />
                    Categorías de Productos
                </h1>
                <p className="text-muted-foreground font-medium">Define las categorías para organizar tu inventario y los filtros del POS.</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                {/* List Column */}
                <div className="bg-card border border-border rounded-3xl overflow-hidden shadow-sm flex flex-col min-h-[500px]">
                    <div className="p-4 border-b border-border bg-muted/30 font-bold text-sm uppercase tracking-wider text-muted-foreground">
                        Listado Actual
                    </div>
                    <div className="flex-1 overflow-y-auto p-2 space-y-2">
                        {isLoading ? (
                            <div className="flex justify-center p-8"><Loader2 className="animate-spin text-primary" /></div>
                        ) : categorias.length === 0 ? (
                            <div className="text-center p-8 text-muted-foreground">No hay categorías definidas.</div>
                        ) : (
                            categorias.map(cat => (
                                <div key={cat.id} className="group p-3 rounded-2xl border border-transparent hover:border-border hover:bg-muted/30 flex items-center justify-between transition-all">
                                    {editingId === cat.id ? (
                                        <div className="flex flex-1 gap-2">
                                            <input
                                                value={editingName}
                                                onChange={(e) => setEditingName(e.target.value)}
                                                className="flex-1 bg-background border border-primary/50 rounded-lg px-3 py-1 text-sm outline-none"
                                                autoFocus
                                            />
                                            <button onClick={handleUpdate} disabled={isPending} className="p-2 bg-primary text-primary-foreground rounded-lg">
                                                <Save size={14} />
                                            </button>
                                            <button onClick={() => setEditingId(null)} className="p-2 bg-muted text-muted-foreground rounded-lg">
                                                <X size={14} />
                                            </button>
                                        </div>
                                    ) : (
                                        <>
                                            <div className="flex items-center gap-3">
                                                <div className="h-8 w-8 rounded-lg bg-primary/10 text-primary flex items-center justify-center">
                                                    <Tag size={16} />
                                                </div>
                                                <span className="font-bold text-foreground">{cat.nombre}</span>
                                            </div>
                                            <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                                <button
                                                    onClick={() => { setEditingId(cat.id); setEditingName(cat.nombre) }}
                                                    className="p-2 text-muted-foreground hover:text-primary rounded-lg hover:bg-primary/10 transition-colors"
                                                >
                                                    <Edit2 size={16} />
                                                </button>
                                                <button
                                                    onClick={() => handleDelete(cat.id)}
                                                    className="p-2 text-muted-foreground hover:text-rose-500 rounded-lg hover:bg-rose-50 transition-colors"
                                                >
                                                    <Trash2 size={16} />
                                                </button>
                                            </div>
                                        </>
                                    )}
                                </div>
                            ))
                        )}
                    </div>
                </div>

                {/* Create Column */}
                <div className="space-y-6">
                    <div className="bg-card border border-border rounded-3xl p-6 shadow-sm space-y-4">
                        <h2 className="text-lg font-black tracking-tight">Nueva Categoría</h2>
                        <div className="space-y-2">
                            <label className="text-xs font-bold uppercase tracking-widest text-muted-foreground">Nombre</label>
                            <input
                                value={newCatName}
                                onChange={(e) => setNewCatName(e.target.value)}
                                className="w-full bg-muted/50 border border-border rounded-xl p-3 outline-none focus:ring-2 focus:ring-primary/20 transition-all font-medium"
                                placeholder="Ej: Herramientas Manuales"
                            />
                        </div>
                        <button
                            onClick={handleCreate}
                            disabled={!newCatName.trim() || isPending}
                            className="w-full bg-primary text-primary-foreground py-3 rounded-xl font-bold uppercase tracking-widest text-xs shadow-lg shadow-primary/20 hover:scale-[1.02] active:scale-[0.98] transition-all disabled:opacity-50"
                        >
                            {isPending ? <Loader2 className="animate-spin mx-auto" /> : "Agregar Categoría"}
                        </button>
                    </div>

                    <div className="bg-blue-500/5 border border-blue-500/20 rounded-3xl p-6">
                        <h3 className="text-blue-600 font-bold mb-2 text-sm">💡 Tip</h3>
                        <p className="text-xs text-blue-600/80 leading-relaxed">
                            Las categorías que crees aquí aparecerán automáticamente como filtros rápidos en la pantalla de ventas (POS), ayudándote a encontrar productos más rápido.
                        </p>
                    </div>
                </div>
            </div>
        </div>
    )
}
