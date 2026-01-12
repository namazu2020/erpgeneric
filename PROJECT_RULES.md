# Global Project Rules & Guidelines - SeitonERP (Generic)

This document defines the strict global rules, architectural standards, and coding best practices for the **SeitonERP** project. These rules must be followed by all AI agents and developers working on this repository to ensure consistency, performance, and security.

## 1. Technology Stack & Core Versions

- **Framework**: Next.js 16.1.1+ (App Router).
- **Language**: TypeScript (Strict Mode).
- **Styling**: Tailwind CSS v4.
- **Database**: PostgreSQL (Production) / SQLite (Dev) via Prisma ORM v5.22+.
- **Auth**: NextAuth.js v5 (Beta 30+).
- **Runtime**: Node.js (Latest LTS).
- **Bundler**: Turbopack.

## 2. Architectural Principles

### 2.1. Multi-Tenancy (Critical)

- **Strategy**: Discriminator Column (`tenantId`).
- **Rule**: Every database query accessing business entities (Products, Sales, Clients, etc.) **MUST** include a `where: { tenantId: ... }` clause.
- **Isolation**: Data leakage between tenants is a critical failure. Always verify `tenantId` from the authenticated session.

### 2.2. Routing & Middleware

- **Evolution**: We use **Next.js 16**.
- **Rule**: Do **NOT** use `middleware.ts`. Use **`src/proxy.ts`** for edge routing logic, header manipulation, and initial auth checks.
- **Convention**: The `proxy.ts` file is strictly for routing protection. Business logic implementation belongs in Server Actions or Lib services.

### 2.3. Server Actions & State

- **Mutations**: Use **Server Actions** (`src/actions`) for all data mutations.
- **Feedback**: Use `useTransition` and `useActionState` (React 19) to manage pending states.
- **Validation**: All inputs must be validated with **Zod** schemas before reaching the database.

## 3. Design System: "Seiton Glass"

### 3.1. Aesthetics

- **Theme**: Premium, Dark/Glassmorphism interface.
- **Colors**: Use semantic tokens (e.g., `bg-primary/20`, `text-slate-400`) rather than arbitrary hex values.
- **Components**:
  - Use `backdrop-blur-xl` and semi-transparent backgrounds (`bg-white/10`) for cards/panels.
  - Borders should be subtle (`border-white/20`).
  - Typography: Inter/Geist via `next/font`.
- **Tailwind v4**: Use the new engine's features. Avoid `@apply` in CSS files unless strictly necessary for complex reusable overrides.

### 3.2. Responsiveness

- **Mobile-First**: Ensure layouts stack correctly on mobile.
- **Interactive**: All buttons/inputs must have hover/active states (`transition-all hover:scale-[1.02]`).

## 4. Coding Standards

### 4.1. TypeScript

- **Strict Typing**: No `any`. Define interfaces for all Props and DTOs.
- **Async/Await**: Always handle promises. Do not use `.then()` chains unless unavoidable.
- **Imports**: Use absolute imports `@/components`, `@/lib`, `@/actions`.

### 4.2. Database (Prisma)

- **Client**: Use the singleton instance at `@/lib/prisma.ts`.
- **Performance**:
  - Avoid `select *`. Select only necessary fields for large tables.
  - precise `include` usages to avoid N+1 problems (though Prisma handles this well, be mindful of payload size).
- **Sync**: Always run `npx prisma generate` after schema changes.

### 4.3. Error Handling

- **Graceful Failures**: specialized error boundaries or toast notifications (Sonner/Hot-Toast).
- **Logging**: Log critical errors serverside.
- **User Feedback**: Never show raw stack traces to the user. secure error messages.

## 5. Security (RBAC)

- **Roles**: `ADMIN`, `VENDEDOR`, `GERENTE`, etc.
- **Enforcement**: Check roles within Server Actions and conditionally render UI elements based on the session role.
- **Auth Flow**: `proxy.ts` protects routes -> Server Components verify Session -> Server Actions verify Permissions.

## 6. AI Agent Instructions

- **Context Awareness**: Always read these rules before proposing major architectural changes.
- **Refactoring**: If legacy code (e.g., `middleware.ts` style) is found, propose refactoring to the new standard (`proxy.ts`).
- **Step-by-Step**: When implementing complex features, break down into: Database -> Backend Logic -> Frontend UI -> Integration Tests.
