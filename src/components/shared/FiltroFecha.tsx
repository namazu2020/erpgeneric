'use client'

import { useRouter, usePathname, useSearchParams } from 'next/navigation'
import { Calendar as CalendarIcon } from 'lucide-react'

export default function FiltroFecha() {
    const router = useRouter()
    const pathname = usePathname()
    const searchParams = useSearchParams()

    const handleDateChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const date = e.target.value
        const params = new URLSearchParams(searchParams.toString())
        if (date) {
            params.set('date', date)
        } else {
            params.delete('date')
        }
        router.push(`${pathname}?${params.toString()}`)
    }

    return (
        <div className="flex items-center gap-2 bg-card border border-border px-3 py-2 rounded-xl shadow-sm focus-within:ring-2 focus-within:ring-primary/20 transition-all">
            <CalendarIcon size={16} className="text-muted-foreground" />
            <input
                type="date"
                defaultValue={searchParams.get('date') || ''}
                onChange={handleDateChange}
                className="bg-transparent border-none outline-none text-sm font-medium text-foreground p-0"
            />
        </div>
    )
}
