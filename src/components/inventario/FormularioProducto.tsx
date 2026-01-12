'use client'

import { useState } from 'react'
import { Plus } from 'lucide-react'
import ModalProducto from './ModalProducto'

export default function FormularioProducto() {
    const [isOpen, setIsOpen] = useState(false)

    return (
        <>
            <button
                onClick={() => setIsOpen(true)}
                className="flex items-center gap-2 rounded-lg bg-primary px-4 py-2 text-sm font-medium text-primary-foreground shadow-lg shadow-primary/20 hover:bg-primary/90 hover:scale-105 transition-all"
            >
                <Plus className="h-4 w-4" />
                Nuevo Producto
            </button>

            <ModalProducto
                isOpen={isOpen}
                onClose={() => setIsOpen(false)}
            />
        </>
    )
}
