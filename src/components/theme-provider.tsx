"use client"

import * as React from "react"
import { ThemeProvider as NextThemesProvider } from "next-themes"

// Se usa type y typeof para inferir correctamente las props, compatible con React 18/19
export function ThemeProvider({
    children,
    ...props
}: React.ComponentProps<typeof NextThemesProvider>) {
    return <NextThemesProvider {...props}>{children}</NextThemesProvider>
}
