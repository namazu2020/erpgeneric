
import prisma from '@/lib/prisma'

async function main() {
    try {
        console.log('Connecting to database...');
        // @ts-ignore
        const count = await prisma.producto.count();
        console.log('Connection successful! Product count:', count);
    } catch (e) {
        console.error('Connection failed:', e);
    } finally {
        // @ts-ignore
        await prisma.$disconnect();
    }
}

main();
