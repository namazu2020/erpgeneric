import { createAuthClient } from "better-auth/react"
import { multiSessionClient, organizationClient } from "better-auth/client/plugins" // Correct import path for v1

export const authClient = createAuthClient({
    baseURL: "http://localhost:3000", // Make sure this matches env var
    plugins: [
        multiSessionClient(),
        organizationClient()
    ]
})
