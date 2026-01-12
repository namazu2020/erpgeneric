'use server'

import prisma from '@/lib/prisma'
import { revalidatePath } from 'next/cache'
import { ProductoSchema } from '@/lib/validations'
import { getSession } from "@/lib/auth-helper"

// --- HELPER DE AUTORIZACIÓN ---
// --- HELPER DE AUTORIZACIÓN ---
async function checkPermission(allowedRoles: string[]) {
    const session = await getSession()
    if (!session?.user) throw new Error("No autorizado")

    const role = (session.user as any).role || (session.user as any).rol
    const tenantId = (session.user as any).tenantId

    if (role !== 'SUPER_ADMIN' && !allowedRoles.includes(role)) {
        throw new Error("Permisos insuficientes para esta acción")
    }

    return { tenantId }
}

// --- MARCAS, MODELOS Y CATEGORÍAS ---

export async function obtenerMarcas() {
    const session = await getSession()
    const tenantId = (session?.user as any)?.tenantId || 'system'
    return await prisma.marca.findMany({
        where: { tenantId },
        orderBy: { nombre: 'asc' }
    });
}

export async function crearMarca(nombre: string) {
    try {
        const { tenantId } = await checkPermission(['ADMIN', 'ADMINISTRATIVO'])
        const nueva = await prisma.marca.create({ data: { nombre, tenantId } });
        revalidatePath('/inventario');
        return { success: true, data: nueva };
    } catch (error: any) {
        return { error: error.message || 'Error al crear marca' };
    }
}

export async function eliminarMarca(id: string) {
    try {
        const { tenantId } = await checkPermission(['ADMIN'])
        await prisma.marca.delete({ where: { id, tenantId } });
        revalidatePath('/inventario');
        return { success: true };
    } catch (error: any) {
        return { error: 'Error al eliminar marca (asegúrese que no esté en uso)' };
    }
}

export async function obtenerModelos() {
    const session = await getSession()
    const tenantId = (session?.user as any)?.tenantId || 'system'
    return await prisma.modelo.findMany({
        where: { tenantId },
        orderBy: { nombre: 'asc' }
    });
}

export async function crearModelo(nombre: string, marcaId?: string) {
    try {
        const { tenantId } = await checkPermission(['ADMIN', 'ADMINISTRATIVO'])
        const nuevo = await prisma.modelo.create({
            data: {
                nombre,
                tenantId,
                marcaId: marcaId || null
            }
        });
        revalidatePath('/inventario');
        return { success: true, data: nuevo };
    } catch (error: any) {
        return { error: error.message || 'Error al crear modelo' };
    }
}

export async function eliminarModelo(id: string) {
    try {
        const { tenantId } = await checkPermission(['ADMIN'])
        await prisma.modelo.delete({ where: { id, tenantId } });
        revalidatePath('/inventario');
        return { success: true };
    } catch (error: any) {
        return { error: 'Error al eliminar modelo (asegúrese que no esté en uso)' };
    }
}

export async function obtenerProveedores() {
    const session = await getSession()
    const tenantId = (session?.user as any)?.tenantId || 'system'
    return await prisma.proveedor.findMany({
        where: { tenantId },
        orderBy: { nombre: 'asc' }
    });
}

export async function crearProveedor(nombre: string) {
    try {
        const { tenantId } = await checkPermission(['ADMIN', 'ADMINISTRATIVO'])
        const nuevo = await prisma.proveedor.create({ data: { nombre, tenantId } });
        revalidatePath('/inventario');
        return { success: true, data: nuevo };
    } catch (error: any) {
        return { error: error.message || 'Error al crear proveedor' };
    }
}

export async function eliminarProveedor(id: string) {
    try {
        const { tenantId } = await checkPermission(['ADMIN'])
        await prisma.proveedor.delete({ where: { id, tenantId } });
        revalidatePath('/inventario');
        return { success: true };
    } catch (error: any) {
        return { error: 'Error al eliminar proveedor (asegúrese que no esté en uso)' };
    }
}

export async function obtenerCategorias() {
    const session = await getSession()
    const tenantId = (session?.user as any)?.tenantId || 'system'
    return await prisma.categoria.findMany({
        where: { tenantId },
        orderBy: { nombre: 'asc' }
    });
}

// --- PRODUCTOS ---

export async function crearProducto(formData: FormData) {
    let tenantId = 'system'
    try {
        const authData = await checkPermission(['ADMIN', 'ADMINISTRATIVO'])
        tenantId = authData.tenantId
    } catch (e: any) {
        return { error: { general: [e.message] } }
    }

    const compat_raw = formData.get('compatibilidades')?.toString() || '[]';
    let compat_parsed = [];
    try {
        compat_parsed = JSON.parse(compat_raw);
    } catch (e) { }

    const rawData = {
        nombre: formData.get('nombre')?.toString(),
        sku: formData.get('sku')?.toString(),
        descripcion: formData.get('descripcion')?.toString(),
        categoriaId: formData.get('categoriaId')?.toString() || null,
        codigoFabrica: formData.get('codigoFabrica')?.toString() || null,
        proveedorId: formData.get('proveedorId')?.toString() || null,
        precioCompra: formData.get('precioCompra'),
        precioVenta: formData.get('precioVenta'),
        tasaIva: formData.get('tasaIva') || 21,
        stockActual: formData.get('stockActual'),
        stockMinimo: formData.get('stockMinimo'),
        compatibilidades: compat_parsed,
    };

    const validated = ProductoSchema.safeParse(rawData);
    if (!validated.success) {
        return { error: validated.error.flatten().fieldErrors };
    }

    const data = validated.data;

    try {
        const product = await prisma.$transaction(async (tx) => {
            const nuevo = await tx.producto.create({
                data: {
                    tenantId,
                    nombre: data.nombre,
                    sku: data.sku,
                    descripcion: data.descripcion,
                    categoriaId: data.categoriaId,
                    codigoFabrica: data.codigoFabrica,
                    proveedorId: data.proveedorId,
                    precioCompra: data.precioCompra,
                    precioVenta: data.precioVenta,
                    tasaIva: data.tasaIva,
                    stockActual: data.stockActual,
                    stockMinimo: data.stockMinimo,
                    compatibilidades: {
                        create: data.compatibilidades?.map(c => ({
                            tenantId,
                            marcaId: c.marcaId,
                            modeloId: c.modeloId,
                            anioDesde: c.anioDesde,
                            anioHasta: c.anioHasta,
                        }))
                    }
                },
            });

            if (data.stockActual !== 0) {
                await tx.movimientoStock.create({
                    data: {
                        tenantId,
                        productoId: nuevo.id,
                        cantidad: data.stockActual,
                        tipo: 'INVENTARIO_INICIAL',
                        notas: 'Carga inicial de producto'
                    }
                });
            }

            return nuevo;
        });

        revalidatePath('/inventario');
        revalidatePath('/ventas');
        return { success: true };
    } catch (error: any) {
        if (error.code === 'P2002') return { error: { sku: ['Este SKU ya existe en este comercio'] } };
        return { error: { general: [`Error al crear producto: ${error.message}`] } };
    }
}

export async function obtenerProductos(
    filters: {
        query?: string,
        categoriaId?: string,
        marcaId?: string,
        proveedorId?: string
    } = {}
) {
    const session = await getSession()
    const tenantId = (session?.user as any)?.tenantId || 'system'

    try {
        const whereClause: any = {
            tenantId,
            AND: []
        }

        if (filters.query) {
            whereClause.AND.push({
                OR: [
                    { nombre: { contains: filters.query, mode: 'insensitive' } },
                    { sku: { contains: filters.query, mode: 'insensitive' } },
                ]
            })
        }

        if (filters.categoriaId && filters.categoriaId !== 'TODOS') {
            whereClause.categoriaId = filters.categoriaId
        }

        if (filters.proveedorId && filters.proveedorId !== 'TODOS') {
            whereClause.proveedorId = filters.proveedorId
        }

        // Brand filtering involves a relation (many-to-many through compatibilities)
        // OR if you want to support direct brand relation if you added it to model. 
        // Based on schema, brand is via Compatibilidad or... wait, did we add independent brand?
        // Checking Schema: Compatibilidad has marcaId. 
        // Logic: Find products that have AT LEAST one compatibility with this brand.
        if (filters.marcaId && filters.marcaId !== 'TODOS') {
            whereClause.compatibilidades = {
                some: {
                    marcaId: filters.marcaId
                }
            }
        }

        const productos = await prisma.producto.findMany({
            where: whereClause,
            include: {
                proveedor: true,
                categoria: true,
                compatibilidades: {
                    include: {
                        marca: true,
                        modelo: true
                    }
                }
            },
            orderBy: { fechaCreacion: 'desc' },
        })
        return {
            productos: productos.map(p => ({
                ...p,
                precioCompra: Number(p.precioCompra),
                precioVenta: Number(p.precioVenta)
            }))
        }
    } catch (error) {
        return { error: 'Error al obtener productos' }
    }
}

export async function actualizarProducto(id: string, formData: FormData) {
    let tenantId = 'system'
    try {
        const authData = await checkPermission(['ADMIN', 'ADMINISTRATIVO'])
        tenantId = authData.tenantId
    } catch (e: any) {
        return { error: { general: [e.message] } }
    }

    const compat_raw = formData.get('compatibilidades')?.toString() || '[]';
    let compat_parsed = [];
    try {
        compat_parsed = JSON.parse(compat_raw);
    } catch (e) { }

    const rawData = {
        nombre: formData.get('nombre')?.toString(),
        sku: formData.get('sku')?.toString(),
        descripcion: formData.get('descripcion')?.toString(),
        categoriaId: formData.get('categoriaId')?.toString() || null,
        codigoFabrica: formData.get('codigoFabrica')?.toString() || null,
        proveedorId: formData.get('proveedorId')?.toString() || null,
        precioCompra: formData.get('precioCompra'),
        precioVenta: formData.get('precioVenta'),
        tasaIva: formData.get('tasaIva') || 21,
        stockActual: formData.get('stockActual'),
        stockMinimo: formData.get('stockMinimo'),
        compatibilidades: compat_parsed,
    };

    const validated = ProductoSchema.safeParse(rawData);
    if (!validated.success) {
        return { error: validated.error.flatten().fieldErrors };
    }

    const data = validated.data;

    try {
        await prisma.$transaction(async (tx) => {
            const actual = await tx.producto.findFirst({ where: { id, tenantId } });
            if (!actual) throw new Error("Acceso denegado o no encontrado");

            const delta = data.stockActual - actual.stockActual;

            await tx.producto.update({
                where: { id },
                data: {
                    nombre: data.nombre,
                    sku: data.sku,
                    descripcion: data.descripcion,
                    categoriaId: data.categoriaId,
                    codigoFabrica: data.codigoFabrica,
                    proveedorId: data.proveedorId,
                    precioCompra: data.precioCompra,
                    precioVenta: data.precioVenta,
                    tasaIva: data.tasaIva,
                    stockActual: data.stockActual,
                    stockMinimo: data.stockMinimo,
                    compatibilidades: {
                        deleteMany: {},
                        create: data.compatibilidades?.map(c => ({
                            tenantId,
                            marcaId: c.marcaId,
                            modeloId: c.modeloId,
                            anioDesde: c.anioDesde,
                            anioHasta: c.anioHasta,
                        }))
                    }
                }
            });

            if (delta !== 0) {
                await tx.movimientoStock.create({
                    data: {
                        tenantId,
                        productoId: id,
                        cantidad: delta,
                        tipo: 'AJUSTE_MANUAL',
                        notas: 'Ajuste desde edición de producto'
                    }
                });
            }
        });

        revalidatePath('/inventario')
        revalidatePath('/ventas')
        return { success: true }
    } catch (error: any) {
        if (error.code === 'P2002') return { error: { sku: ['SKU ya existe en este comercio'] } };
        return {
            error: { general: [`Error al actualizar producto: ${error.message}`] }
        }
    }
}

export async function eliminarProducto(id: string) {
    try {
        const { tenantId } = await checkPermission(['ADMIN']) // SOLO ADMIN

        const prod = await prisma.producto.findFirst({ where: { id, tenantId } })
        if (!prod) return { error: "No autorizado o no encontrado" }

        await prisma.producto.delete({ where: { id } })
        revalidatePath('/inventario')
        revalidatePath('/ventas')
        return { success: true }
    } catch (error: any) {
        return { error: error.message || 'Error al eliminar producto' }
    }
}

export async function cargarProductosMasivo(productos: any[]) {
    let tenantId = 'system'
    try {
        const authData = await checkPermission(['ADMIN', 'ADMINISTRATIVO'])
        tenantId = authData.tenantId
    } catch (e: any) {
        return { error: e.message }
    }

    try {
        console.log(`IMPORT: Iniciando procesamiento de ${productos.length} productos para tenant ${tenantId}...`);
        const startTime = Date.now();

        // 1. Extraer nombres únicos
        const marcasUnicas = [...new Set(productos.map(p => p.marca?.toString().trim()).filter(Boolean))] as string[];
        const modelosUnicos = [...new Set(productos.map(p => p.modelo?.toString().trim()).filter(Boolean))] as string[];
        const proveedoresUnicos = [...new Set(productos.map(p => p.proveedor?.toString().trim()).filter(Boolean))] as string[];
        const categoriasUnicas = [...new Set(productos.map(p => p.categoria?.toString().trim()).filter(Boolean))] as string[];

        // 2. Resolver Relaciones (Esto asegura que marcas/modelos/etc existan)
        const [marcasRepo, modelosRepo, proveedoresRepo, categoriasRepo] = await Promise.all([
            resolverRelaciones('marca', marcasUnicas, tenantId),
            resolverRelaciones('modelo', modelosUnicos, tenantId),
            resolverRelaciones('proveedor', proveedoresUnicos, tenantId),
            resolverRelaciones('categoria', categoriasUnicas, tenantId),
        ]);

        // 3. Procesar Productos
        const CHUNK_SIZE = 100;
        let creados = 0;
        let errores = 0;
        const erroresDetalle: string[] = [];

        for (let i = 0; i < productos.length; i += CHUNK_SIZE) {
            const chunk = productos.slice(i, i + CHUNK_SIZE);

            const res = await prisma.$transaction(async (tx) => {
                let batchCreados = 0;
                let batchErrores = 0;

                const promises = chunk.map(async (item) => {
                    try {
                        const sku = item.sku?.toString().trim();
                        const nombre = item.nombre?.toString().trim();

                        if (!sku || !nombre) return;

                        const marcaId = item.marca ? marcasRepo.get(item.marca.toString().trim()) : null;
                        const modeloId = item.modelo ? modelosRepo.get(item.modelo.toString().trim()) : null;
                        const proveedorId = item.proveedor ? proveedoresRepo.get(item.proveedor.toString().trim()) : null;
                        const categoriaId = item.categoria ? categoriasRepo.get(item.categoria.toString().trim()) : null;

                        const stockActual = parseInt(item.stockActual) || 0;
                        const precioCompra = parseFloat(item.precioCompra) || 0;
                        const precioVenta = parseFloat(item.precioVenta) || 0;
                        const anio = item.anio ? parseInt(item.anio) : null;
                        const stockMinimo = parseInt(item.stockMinimo) || 5;

                        // Upsert del producto
                        const prod = await tx.producto.upsert({
                            where: {
                                sku_tenantId: { sku, tenantId }
                            },
                            update: {
                                nombre,
                                descripcion: item.descripcion?.toString() || '',
                                categoriaId,
                                codigoFabrica: item.codigoFabrica?.toString() || null,
                                proveedorId,
                                precioCompra,
                                precioVenta,
                                stockActual,
                                stockMinimo,
                            },
                            create: {
                                tenantId,
                                nombre,
                                sku,
                                descripcion: item.descripcion?.toString() || '',
                                categoriaId,
                                codigoFabrica: item.codigoFabrica?.toString() || null,
                                proveedorId,
                                precioCompra,
                                precioVenta,
                                stockActual,
                                stockMinimo,
                            }
                        });

                        if (marcaId && modeloId) {
                            // Parallelize compatibility check/creation slightly? 
                            // Since it depends on 'prod', we await it.
                            // But we can optimistically upsert compatibilities if the ID logic is deterministic, 
                            // but here we just stick to finding first.
                            const compatExistente = await tx.compatibilidad.findFirst({
                                where: {
                                    tenantId,
                                    productoId: prod.id,
                                    marcaId,
                                    modeloId,
                                    anioDesde: anio,
                                    anioHasta: anio
                                }
                            });

                            if (!compatExistente) {
                                await tx.compatibilidad.create({
                                    data: {
                                        tenantId,
                                        productoId: prod.id,
                                        marcaId,
                                        modeloId,
                                        anioDesde: anio,
                                        anioHasta: anio
                                    }
                                });
                            }
                        }

                        return { status: 'fulfilled' };
                    } catch (e: any) {
                        return { status: 'rejected', error: `Error en SKU ${item.sku}: ${e.message}` };
                    }
                });

                const results = await Promise.all(promises);

                results.forEach(r => {
                    if (r && r.status === 'fulfilled') batchCreados++;
                    if (r && r.status === 'rejected') {
                        batchErrores++;
                        if (r.error) erroresDetalle.push(r.error);
                    }
                });

                return { batchCreados, batchErrores };
            }, {
                timeout: 120000 // Increased timeout for parallel batch
            });

            creados += res.batchCreados;
            errores += res.batchErrores;
        }

        revalidatePath('/inventario');
        return { success: true, creados, errores, detalles: erroresDetalle };
    } catch (error: any) {
        console.error("Critical Error in Bulk Load:", error);
        return { error: `Error Crítico: ${error.message}` };
    }
}

async function resolverRelaciones(modeloKey: 'marca' | 'modelo' | 'proveedor' | 'categoria', nombres: string[], tenantId: string) {
    const mapa = new Map<string, string>();
    if (nombres.length === 0) return mapa;

    const dbModel = (prisma as any)[modeloKey];

    const existentes = await dbModel.findMany({
        where: {
            nombre: { in: nombres },
            tenantId: tenantId
        }
    });
    existentes.forEach((e: any) => mapa.set(e.nombre, e.id));

    const nuevosNombres = nombres.filter(n => !mapa.has(n));

    if (nuevosNombres.length > 0) {
        for (const nombre of nuevosNombres) {
            try {
                const creado = await dbModel.upsert({
                    where: {
                        nombre_tenantId: { nombre, tenantId }
                    },
                    update: {},
                    create: { nombre, tenantId }
                });
                mapa.set(creado.nombre, creado.id);
            } catch (e) { }
        }
    }

    return mapa;
}

