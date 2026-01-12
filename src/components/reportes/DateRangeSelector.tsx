'use client'

import { subDays, subMonths, format } from 'date-fns'
import { Calendar } from 'lucide-react'
import { useState } from 'react'
import clsx from 'clsx'

interface Props {
    startDate: Date
    endDate: Date
    onChange: (start: Date, end: Date) => void
}

type Preset = '7D' | '1M' | '3M' | '6M'

export default function DateRangeSelector({ startDate, endDate, onChange }: Props) {
    const [activePreset, setActivePreset] = useState<Preset | null>('7D')

    const handlePreset = (preset: Preset) => {
        const end = new Date()
        let start = new Date()

        switch (preset) {
            case '7D': start = subDays(end, 7); break;
            case '1M': start = subMonths(end, 1); break;
            case '3M': start = subMonths(end, 3); break;
            case '6M': start = subMonths(end, 6); break;
        }

        setActivePreset(preset)
        onChange(start, end)
    }

    const handleCustomChange = (type: 'start' | 'end', value: string) => {
        setActivePreset(null)
        if (!value) return
        const date = new Date(value)
        if (type === 'start') onChange(date, endDate)
        else onChange(startDate, date)
    }

    return (
        <div className="flex flex-col sm:flex-row items-center gap-4 bg-muted/40 p-1.5 rounded-2xl border border-border">
            {/* Presets */}
            <div className="flex items-center p-1 bg-background rounded-xl shadow-sm border border-border/50">
                {(['7D', '1M', '3M', '6M'] as Preset[]).map((preset) => (
                    <button
                        key={preset}
                        onClick={() => handlePreset(preset)}
                        className={clsx(
                            "px-3 py-1.5 text-xs font-bold rounded-lg transition-all",
                            activePreset === preset
                                ? "bg-black text-white shadow-md"
                                : "text-muted-foreground hover:bg-muted"
                        )}
                    >
                        {preset}
                    </button>
                ))}
            </div>

            <div className="h-4 w-px bg-border hidden sm:block" />

            {/* Custom Inputs */}
            <div className="flex items-center gap-2">
                <div className="relative group">
                    <Calendar className="absolute left-2.5 top-1/2 -translate-y-1/2 text-muted-foreground h-3.5 w-3.5 group-hover:text-primary transition-colors" />
                    <input
                        type="date"
                        value={format(startDate, 'yyyy-MM-dd')}
                        onChange={(e) => handleCustomChange('start', e.target.value)}
                        className="pl-8 pr-2 py-1.5 bg-background border border-border rounded-lg text-xs font-medium focus:ring-2 focus:ring-primary/20 outline-none w-32"
                    />
                </div>
                <span className="text-muted-foreground text-xs font-medium">a</span>
                <div className="relative group">
                    <Calendar className="absolute left-2.5 top-1/2 -translate-y-1/2 text-muted-foreground h-3.5 w-3.5 group-hover:text-primary transition-colors" />
                    <input
                        type="date"
                        value={format(endDate, 'yyyy-MM-dd')}
                        onChange={(e) => handleCustomChange('end', e.target.value)}
                        className="pl-8 pr-2 py-1.5 bg-background border border-border rounded-lg text-xs font-medium focus:ring-2 focus:ring-primary/20 outline-none w-32"
                    />
                </div>
            </div>
        </div>
    )
}
