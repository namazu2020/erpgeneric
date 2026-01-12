export const PERMISSIONS = {
    INVENTARIO: {
        label: "Inventario y Productos",
        actions: [
            { key: "fil:ver", label: "Ver Stock" },
            { key: "inv:crear", label: "Crear Productos" },
            { key: "inv:editar", label: "Editar Productos" },
            { key: "inv:eliminar", label: "Eliminar Productos" },
            { key: "inv:ajustar", label: "Ajuste de Stock Manual" },
        ]
    },
    REPORTES: {
        label: "Reportería",
        actions: [
            { key: "rep:ver", label: "Ver Gráficos y Estadísticas" },
        ]
    },
    VENTAS: {
        label: "Punto de Venta",
        actions: [
            { key: "vta:acceso", label: "Acceso al POS" },
            { key: "vta:cobrar", label: "Realizar Cobros" },
            { key: "vta:descuento", label: "Aplicar Descuentos Manuales" },
            { key: "vta:anular", label: "Anular Ventas" },
        ]
    },
    CAJA: {
        label: "Gestión de Caja",
        actions: [
            { key: "caja:ver", label: "Ver Movimientos" },
            { key: "caja:apertura", label: "Abrir/Cerrar Caja" },
            { key: "caja:ingreso", label: "Registrar Ingresos/Egresos" },
        ]
    },
    CLIENTES: {
        label: "Clientes",
        actions: [
            { key: "cli:ver", label: "Ver Listado" },
            { key: "cli:crear", label: "Crear/Editar Clientes" },
            { key: "cli:eliminar", label: "Eliminar Clientes" },
            { key: "cli:ctacte", label: "Gestionar Cta. Cte." },
        ]
    },
    CONTABILIDAD: {
        label: "Contabilidad y ARCA",
        actions: [
            { key: "cont:ver", label: "Ver Proyecciones e Impuestos" },
            { key: "cont:registrar", label: "Registrar Gastos e Impuestos" },
        ]
    },
    CONFIGURACION: {
        label: "Administración",
        actions: [
            { key: "cfg:usuarios", label: "Gestionar Usuarios y Roles" },
            { key: "cfg:empresa", label: "Editar Datos de Empresa (ARCA/IIBB)" },
            { key: "cfg:sistema", label: "Wipe / Configuración Técnica" },
        ]
    }
} as const

// Helper to check if a list of permissions includes a specific key
export function hasPermission(userPermissions: string[] = [], requiredKey: string) {
    if (!userPermissions) return false
    if (userPermissions.includes("admin:all")) return true
    return userPermissions.includes(requiredKey)
}
