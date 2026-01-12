import { z } from 'zod';

export const ProductoSchema = z.object({
    nombre: z.string().min(1, "El nombre es obligatorio"),
    sku: z.string().min(1, "El SKU es obligatorio"),
    descripcion: z.string().optional().nullable(),

    // Relaciones
    categoriaId: z.string().optional().nullable(),
    proveedorId: z.string().optional().nullable(),

    // Compatibilidad (Múltiple)
    compatibilidades: z.array(z.object({
        marcaId: z.string().min(1, "La marca es obligatoria"),
        modeloId: z.string().min(1, "El modelo es obligatorio"),
        anioDesde: z.coerce.number().int().optional().nullable(),
        anioHasta: z.coerce.number().int().optional().nullable(),
    })).optional().default([]),

    codigoFabrica: z.string().optional().nullable(),

    precioCompra: z.coerce.number().min(0, "El costo no puede ser negativo"),
    precioVenta: z.coerce.number().min(0, "El precio de venta no puede ser negativo"),
    tasaIva: z.coerce.number().min(0).default(21.0),

    stockActual: z.coerce.number().int().min(0, "El stock no puede ser negativo"),
    stockMinimo: z.coerce.number().int().min(0, "El stock mínimo no puede ser negativo"),
});

export const ClienteSchema = z.object({
    nombre: z.string().min(1, "El nombre es obligatorio"),
    cuit: z.string().optional().nullable(),
    email: z.string().email("Email inválido").optional().nullable().or(z.literal("")),
    telefono: z.string().optional().nullable(),
    direccion: z.string().optional().nullable(),
    condicionIva: z.string().default("CONSUMIDOR_FINAL"),
    cuentaCorriente: z.coerce.boolean().default(false),
    limiteCredito: z.coerce.number().min(0).optional().nullable(),
    descuentoEspecial: z.coerce.number().min(0).max(100).optional().nullable(),
});

export const ConfiguracionEmpresaSchema = z.object({
    razonSocial: z.string().min(1, "La razón social es obligatoria"),
    cuit: z.string().min(1, "El CUIT es obligatorio"),
    direccion: z.string().min(1, "La dirección es obligatoria"),
    telefono: z.string().min(1, "El teléfono es obligatorio"),
    email: z.string().email("Email inválido"),
    domicilioFiscal: z.string().min(1, "El domicilio fiscal es obligatorio"),
    condicionIva: z.string().min(1, "La condición de IVA es obligatoria"),

    // Avanzado
    tipoEmpresa: z.string().default("MICRO"),
    esMiPyME: z.boolean().default(false),
    ivaTrimestral: z.boolean().default(false),
    alicuotaIIBB: z.coerce.number().min(0),
    alicuotaLeyCheque: z.coerce.number().min(0),
    jurisdicciones: z.array(z.any()).optional().default([]),
});

