'use client'


import { TRPCProvider } from "@/lib/trpc/Provider"

export function Providers({ children }: { children: React.ReactNode }) {
    return (
        <TRPCProvider>
            {children}
        </TRPCProvider>
    )
}
