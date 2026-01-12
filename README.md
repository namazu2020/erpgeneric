# ERP Genérico - Sistema de Gestión SaaS

Este es un sistema ERP de alto rendimiento diseñado para PyMEs, construido con tecnologías modernas para garantizar escalabilidad, seguridad y una experiencia de usuario excepcional.

## 🚀 Tecnologías Principales

- **Frontend:** Next.js 16.1.1 (App Router), React 19, Tailwind CSS v4.
- **Backend:** Next.js Server Actions & tRPC v11.
- **Base de Datos:** PostgreSQL con Prisma ORM.
- **Autenticación:** Better Auth con soporte para Multi-tenancy (Organizaciones).
- **Validación:** Zod.

## 📦 Módulos Incluidos

1. **Dashboard:** Indicadores clave de rendimiento (KPIs), gráficos de ventas y métricas en tiempo real.
2. **Ventas y Facturación:** Gestión de facturas, control de clientes y estados de cuenta.
3. **Caja y Tesorería:** Control de aperturas/cierres de caja, movimientos de efectivo y saldos.
4. **Inventario:** Control de stock, categorías, proveedores y productos con compatibilidades complejas.
5. **Configuración y Seguridad:** Gestión de roles y permisos (RBAC), usuarios y auditoría de accesos.

## 🛠️ Instalación y Configuración

### 1. Clonar el repositorio

```bash
git clone <url-del-repositorio>
cd erpgeneric
```

### 2. Instalar dependencias

```bash
npm install
```

### 3. Configurar variables de entorno

Copia el archivo `.env.example` a `.env` y completa tus credenciales:

```bash
cp .env.example .env
```

### 4. Preparar la base de datos

Asegúrate de tener PostgreSQL corriendo y ejecuta:

```bash
npx prisma db push
```

### 5. Iniciar el servidor de desarrollo

```bash
npm run dev
```

## 🔐 Configuración Inicial (Setup)

Al iniciar por primera vez, accede a `/setup` para crear la cuenta del **Administrador Principal (SUPER_ADMIN)**. Este usuario tendrá acceso total al sistema y podrá crear otros usuarios y roles.

## 🏗️ Arquitectura de Código

El proyecto sigue una arquitectura de **Capa de Servicio (Service Layer)** para mantener la lógica de negocio centralizada y evitar redundancia entre tRPC y Server Actions.

- `src/actions`: Server Actions para manejo de formularios y revalidación de caché.
- `src/server/routers`: Endpoints de tRPC para consultas eficientes desde el cliente.
- `src/services`: Lógica de negocio core reutilizable.
- `src/lib`: Configuraciones de bases de datos, auth y utilidades.

## 📄 Licencia

Este proyecto está bajo la Licencia MIT.
