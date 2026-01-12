import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function main() {
    try {
        const start = Date.now()
        console.log('Testing connection to DB at localhost:5433...')
        const count = await prisma.producto.count()
        console.log(`Connection successful! Product count: ${count}`)
        console.log(`Response time: ${Date.now() - start}ms`)
    } catch (e) {
        console.error('Connection failed:', e)
    } finally {
        await prisma.$disconnect()
    }
}

main()
