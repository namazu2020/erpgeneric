-- CreateTable
CREATE TABLE "productos" (
    "id" TEXT NOT NULL,
    "tenantId" TEXT NOT NULL DEFAULT 'system',
    "nombre" TEXT NOT NULL,
    "sku" TEXT NOT NULL,
    "descripcion" TEXT,
    "marcaId" TEXT,
    "modeloId" TEXT,
    "anio" INTEGER,
    "codigoFabrica" TEXT,
    "proveedorId" TEXT,
    "precioCompra" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "precioVenta" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "tasaIva" DOUBLE PRECISION NOT NULL DEFAULT 21.0,
    "stockActual" INTEGER NOT NULL DEFAULT 0,
    "stockMinimo" INTEGER NOT NULL DEFAULT 5,
    "fechaCreacion" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "fechaActualizacion" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "productos_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "marcas" (
    "id" TEXT NOT NULL,
    "tenantId" TEXT NOT NULL DEFAULT 'system',
    "nombre" TEXT NOT NULL,

    CONSTRAINT "marcas_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "modelos" (
    "id" TEXT NOT NULL,
    "tenantId" TEXT NOT NULL DEFAULT 'system',
    "nombre" TEXT NOT NULL,

    CONSTRAINT "modelos_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "proveedores" (
    "id" TEXT NOT NULL,
    "tenantId" TEXT NOT NULL DEFAULT 'system',
    "nombre" TEXT NOT NULL,
    "contacto" TEXT,

    CONSTRAINT "proveedores_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "movimientos_stock" (
    "id" TEXT NOT NULL,
    "tenantId" TEXT NOT NULL DEFAULT 'system',
    "productoId" TEXT NOT NULL,
    "cantidad" INTEGER NOT NULL,
    "tipo" TEXT NOT NULL,
    "referencia" TEXT,
    "notas" TEXT,
    "fecha" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "movimientos_stock_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "clientes" (
    "id" TEXT NOT NULL,
    "tenantId" TEXT NOT NULL DEFAULT 'system',
    "nombre" TEXT NOT NULL,
    "cuit" TEXT,
    "email" TEXT,
    "telefono" TEXT,
    "direccion" TEXT,
    "condicionIva" TEXT NOT NULL DEFAULT 'CONSUMIDOR_FINAL',
    "cuentaCorriente" BOOLEAN NOT NULL DEFAULT false,
    "limiteCredito" DOUBLE PRECISION,
    "descuentoEspecial" DOUBLE PRECISION,
    "fechaRegistro" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "clientes_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "movimientos_cta_cte" (
    "id" TEXT NOT NULL,
    "tenantId" TEXT NOT NULL DEFAULT 'system',
    "clienteId" TEXT NOT NULL,
    "tipo" TEXT NOT NULL,
    "monto" DOUBLE PRECISION NOT NULL,
    "concepto" TEXT NOT NULL,
    "referencia" TEXT,
    "fecha" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "movimientos_cta_cte_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ventas" (
    "id" TEXT NOT NULL,
    "tenantId" TEXT NOT NULL DEFAULT 'system',
    "fecha" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "total" DOUBLE PRECISION NOT NULL,
    "estado" TEXT NOT NULL DEFAULT 'COMPLETADA',
    "metodoPago" TEXT NOT NULL DEFAULT 'EFECTIVO',
    "clienteId" TEXT,

    CONSTRAINT "ventas_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "detalles_venta" (
    "id" TEXT NOT NULL,
    "tenantId" TEXT NOT NULL DEFAULT 'system',
    "cantidad" INTEGER NOT NULL,
    "precioUnitario" DOUBLE PRECISION NOT NULL,
    "subtotal" DOUBLE PRECISION NOT NULL,
    "ventaId" TEXT NOT NULL,
    "productoId" TEXT NOT NULL,

    CONSTRAINT "detalles_venta_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "cajas" (
    "id" TEXT NOT NULL,
    "tenantId" TEXT NOT NULL DEFAULT 'system',
    "fechaApertura" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "fechaCierre" TIMESTAMP(3),
    "montoApertura" DOUBLE PRECISION NOT NULL,
    "montoCierre" DOUBLE PRECISION,
    "estado" TEXT NOT NULL DEFAULT 'ABIERTA',

    CONSTRAINT "cajas_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "movimientos_caja" (
    "id" TEXT NOT NULL,
    "tenantId" TEXT NOT NULL DEFAULT 'system',
    "cajaId" TEXT NOT NULL,
    "tipo" TEXT NOT NULL,
    "monto" DOUBLE PRECISION NOT NULL,
    "concepto" TEXT NOT NULL,
    "referencia" TEXT,
    "fecha" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "movimientos_caja_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "usuarios" (
    "id" TEXT NOT NULL,
    "tenantId" TEXT NOT NULL DEFAULT 'system',
    "nombre" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "password" TEXT NOT NULL,
    "rol" TEXT NOT NULL DEFAULT 'VENDEDOR',
    "fechaCreacion" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "usuarios_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "logs_auditoria" (
    "id" TEXT NOT NULL,
    "tenantId" TEXT NOT NULL,
    "tabla" TEXT NOT NULL,
    "operacion" TEXT NOT NULL,
    "registroId" TEXT NOT NULL,
    "valorAnterior" JSONB,
    "valorNuevo" JSONB,
    "usuarioId" TEXT,
    "fecha" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "logs_auditoria_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "alertas_stock" (
    "id" TEXT NOT NULL,
    "tenantId" TEXT NOT NULL,
    "productoId" TEXT NOT NULL,
    "producto" TEXT NOT NULL,
    "stockActual" INTEGER NOT NULL,
    "stockMinimo" INTEGER NOT NULL,
    "resuelta" BOOLEAN NOT NULL DEFAULT false,
    "fecha" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "alertas_stock_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "productos_nombre_idx" ON "productos"("nombre");

-- CreateIndex
CREATE INDEX "productos_sku_idx" ON "productos"("sku");

-- CreateIndex
CREATE INDEX "productos_tenantId_idx" ON "productos"("tenantId");

-- CreateIndex
CREATE UNIQUE INDEX "productos_sku_tenantId_key" ON "productos"("sku", "tenantId");

-- CreateIndex
CREATE INDEX "marcas_tenantId_idx" ON "marcas"("tenantId");

-- CreateIndex
CREATE UNIQUE INDEX "marcas_nombre_tenantId_key" ON "marcas"("nombre", "tenantId");

-- CreateIndex
CREATE INDEX "modelos_tenantId_idx" ON "modelos"("tenantId");

-- CreateIndex
CREATE UNIQUE INDEX "modelos_nombre_tenantId_key" ON "modelos"("nombre", "tenantId");

-- CreateIndex
CREATE INDEX "proveedores_tenantId_idx" ON "proveedores"("tenantId");

-- CreateIndex
CREATE UNIQUE INDEX "proveedores_nombre_tenantId_key" ON "proveedores"("nombre", "tenantId");

-- CreateIndex
CREATE INDEX "movimientos_stock_productoId_idx" ON "movimientos_stock"("productoId");

-- CreateIndex
CREATE INDEX "movimientos_stock_fecha_idx" ON "movimientos_stock"("fecha");

-- CreateIndex
CREATE INDEX "movimientos_stock_tenantId_idx" ON "movimientos_stock"("tenantId");

-- CreateIndex
CREATE INDEX "clientes_tenantId_idx" ON "clientes"("tenantId");

-- CreateIndex
CREATE UNIQUE INDEX "clientes_email_tenantId_key" ON "clientes"("email", "tenantId");

-- CreateIndex
CREATE UNIQUE INDEX "clientes_cuit_tenantId_key" ON "clientes"("cuit", "tenantId");

-- CreateIndex
CREATE INDEX "movimientos_cta_cte_clienteId_idx" ON "movimientos_cta_cte"("clienteId");

-- CreateIndex
CREATE INDEX "movimientos_cta_cte_tenantId_idx" ON "movimientos_cta_cte"("tenantId");

-- CreateIndex
CREATE INDEX "ventas_fecha_idx" ON "ventas"("fecha");

-- CreateIndex
CREATE INDEX "ventas_tenantId_idx" ON "ventas"("tenantId");

-- CreateIndex
CREATE INDEX "detalles_venta_tenantId_idx" ON "detalles_venta"("tenantId");

-- CreateIndex
CREATE INDEX "cajas_tenantId_idx" ON "cajas"("tenantId");

-- CreateIndex
CREATE INDEX "movimientos_caja_cajaId_idx" ON "movimientos_caja"("cajaId");

-- CreateIndex
CREATE INDEX "movimientos_caja_tenantId_idx" ON "movimientos_caja"("tenantId");

-- CreateIndex
CREATE UNIQUE INDEX "usuarios_email_key" ON "usuarios"("email");

-- CreateIndex
CREATE INDEX "usuarios_tenantId_idx" ON "usuarios"("tenantId");

-- CreateIndex
CREATE INDEX "logs_auditoria_tenantId_tabla_idx" ON "logs_auditoria"("tenantId", "tabla");

-- CreateIndex
CREATE INDEX "logs_auditoria_fecha_idx" ON "logs_auditoria"("fecha");

-- CreateIndex
CREATE INDEX "alertas_stock_tenantId_idx" ON "alertas_stock"("tenantId");

-- AddForeignKey
ALTER TABLE "productos" ADD CONSTRAINT "productos_marcaId_fkey" FOREIGN KEY ("marcaId") REFERENCES "marcas"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "productos" ADD CONSTRAINT "productos_modeloId_fkey" FOREIGN KEY ("modeloId") REFERENCES "modelos"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "productos" ADD CONSTRAINT "productos_proveedorId_fkey" FOREIGN KEY ("proveedorId") REFERENCES "proveedores"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "movimientos_stock" ADD CONSTRAINT "movimientos_stock_productoId_fkey" FOREIGN KEY ("productoId") REFERENCES "productos"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "movimientos_cta_cte" ADD CONSTRAINT "movimientos_cta_cte_clienteId_fkey" FOREIGN KEY ("clienteId") REFERENCES "clientes"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ventas" ADD CONSTRAINT "ventas_clienteId_fkey" FOREIGN KEY ("clienteId") REFERENCES "clientes"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "detalles_venta" ADD CONSTRAINT "detalles_venta_productoId_fkey" FOREIGN KEY ("productoId") REFERENCES "productos"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "detalles_venta" ADD CONSTRAINT "detalles_venta_ventaId_fkey" FOREIGN KEY ("ventaId") REFERENCES "ventas"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "movimientos_caja" ADD CONSTRAINT "movimientos_caja_cajaId_fkey" FOREIGN KEY ("cajaId") REFERENCES "cajas"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
