const { PrismaClient } = require('@prisma/client')
const prisma = new PrismaClient()

async function main() {
  const users = await prisma.users.findMany({
    select: { email: true, role: true, name: true }
  })
  console.log('Users:', users)
}

main()
  .catch(e => console.error(e))
  .finally(async () => await prisma.$disconnect())
