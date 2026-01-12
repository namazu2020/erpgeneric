import { betterAuth } from "better-auth";
import { prismaAdapter } from "better-auth/adapters/prisma";
import { multiSession, organization } from "better-auth/plugins";
import prisma from "@/lib/prisma";

// 1. Definimos la interfaz para el usuario con nuestros campos personalizados
export interface CustomUser {
    id: string;
    email: string;
    emailVerified: boolean;
    name: string;
    createdAt: Date;
    updatedAt: Date;
    tenantId: string;
    rol: string;
    roleId?: string | null;
    image?: string | null;
    permissions?: string[]; // Añadimos opcional para el tipado
}

// 2. Definimos el tipo para la sesión
export interface CustomSession {
    user: CustomUser;
    session: {
        id: string;
        userId: string;
        expiresAt: Date;
        token: string;
        createdAt: Date;
        updatedAt: Date;
        userAgent?: string | null;
        ipAddress?: string | null;
    }
}

export const auth = betterAuth({
    database: prismaAdapter(prisma, {
        provider: "postgresql",
    }),
    emailAndPassword: {
        enabled: true,
    },
    session: {
        cookieCache: {
            enabled: true,
            maxAge: 5 * 60, // 5 minutos
        },
    },
    plugins: [
        multiSession(),
        organization()
    ],
    user: {
        additionalFields: {
            tenantId: {
                type: "string",
                required: false,
                defaultValue: "system"
            },
            rol: {
                type: "string",
                required: false,
                defaultValue: "VENDEDOR"
            },
            roleId: {
                type: "string",
                required: false
            }
        },
        changeEmail: {
            enabled: true,
        }
    },
    databaseHooks: {
        session: {
            create: {
                after: async (session) => {
                    // Podemos hacer lógica post-creación si es necesario
                }
            }
        },
        user: {
            create: {
                before: async (user, context) => {
                    return {
                        data: {
                            ...user,
                            tenantId: (user.tenantId as string) || "system",
                            rol: (user.rol as string) || "VENDEDOR"
                        }
                    }
                }
            }
        }
    },
    callbacks: {
        // 3. Aplicamos el tipado profesional en el callback
        async session({ session, user }: { session: any, user: CustomUser }) {
            let permissions: string[] = []
            if (user.rol === 'SUPER_ADMIN') {
                permissions = ["admin:all"];
            } else if (user.roleId) {
                const role = await prisma.role.findUnique({ where: { id: user.roleId } })
                if (role && role.permissions) {
                    try {
                        permissions = JSON.parse(role.permissions)
                    } catch (e) { permissions = [] }
                }
            } else if (user.rol === 'ADMIN') {
                // Legacy ADMIN support
                permissions = ["admin:all"];
            }

            // Retornamos el usuario enriquecido
            return {
                ...session,
                user: {
                    ...session.user,
                    permissions,
                    role: user.rol, // Para el frontend y compatibilidad
                    rol: user.rol   // Para consistencia con el campo de BD
                }
            }
        }
    }
});

