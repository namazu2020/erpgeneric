import Prisma from '@prisma/client'
import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function main() {
    try {
        // Delete in order to avoid foreign key constraints
        await prisma.loginLog.deleteMany({})
        await prisma.session.deleteMany({})
        await prisma.account.deleteMany({})
        await prisma.movimientoStock.deleteMany({})
        await prisma.detalleVenta.deleteMany({})
        await prisma.venta.deleteMany({})
        await prisma.cliente.deleteMany({})
        // ... delete other dependent data if necessary, or just users/tenants if cascade is set
        // But safely:
        await prisma.user.deleteMany({})
        await prisma.configuracionEmpresa.deleteMany({})

        console.log("All users and tenants deleted.")
    } catch (e) {
        console.error(e)
    } finally {
        await prisma.$disconnect()
    }
}

main()
