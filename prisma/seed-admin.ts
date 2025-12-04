import { PrismaClient } from '@prisma/client'
import * as argon2 from 'argon2'

const prisma = new PrismaClient()

async function main() {
  const email = 'leonardo.mucci@lbreng.com.br'
  const password = 'Mucci@190505'
  const name = 'Leonardo Mucci'

  console.log(`Hashing password for ${email}...`)
  const hashedPassword = await argon2.hash(password)

  console.log(`Upserting user ${email}...`)
  const user = await prisma.users.upsert({
    where: { email },
    update: {
      name,
      role: 'admin',
      is_active: true,
    },
    create: {
      email,
      name,
      role: 'admin',
      is_active: true,
      picture_url: null,
    },
  })

  console.log(`Upserting password for user ID ${user.id}...`)
  await prisma.user_passwords.upsert({
    where: { user_id: user.id },
    update: {
      password_hash: hashedPassword,
      password_updated_at: new Date(),
    },
    create: {
      user_id: user.id,
      password_hash: hashedPassword,
    },
  })

  console.log(`✅ User ${email} created/updated successfully with admin role.`)
}

main()
  .catch((e) => {
    console.error('Error creating admin user:', e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
