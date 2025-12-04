// Script to run database migration manually
// Run with: node migrate-enum.js

import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function main() {
  try {
    console.log('🔄 Adicionando COVER_IMAGE ao enum document_kind...')
    
    await prisma.$executeRawUnsafe(`
      ALTER TYPE "document_kind" ADD VALUE IF NOT EXISTS 'COVER_IMAGE';
    `)
    
    console.log('✅ Migração concluída com sucesso!')
    console.log('🔄 Regenerando Prisma Client...')
    
  } catch (error) {
    console.error('❌ Erro na migração:', error)
    process.exit(1)
  } finally {
    await prisma.$disconnect()
  }
}

main()
