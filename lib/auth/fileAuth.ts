import { prisma } from '@/lib/prisma'
import { isAdmin } from './contractAuth'

/**
 * Verifica se o usuário pode deletar uma pasta
 * Apenas o criador do contrato ou admin podem deletar pastas
 */
export async function canDeleteFolder(
  userId: string,
  userRole: string,
  contractId: string
): Promise<boolean> {
  // Admin pode deletar qualquer pasta
  if (isAdmin(userRole)) {
    return true
  }

  // Verifica se é o criador do contrato
  const contract = await prisma.contracts.findUnique({
    where: { id: contractId },
    select: { created_by: true }
  })

  return contract?.created_by === userId
}

/**
 * Verifica se o usuário pode deletar um arquivo (medições)
 * Apenas quem fez o upload do arquivo ou admin podem deletar
 */
export async function canDeleteMeasurementFile(
  userId: string,
  userRole: string,
  fileId: string
): Promise<boolean> {
  // Admin pode deletar qualquer arquivo
  if (isAdmin(userRole)) {
    return true
  }

  // Verifica se o usuário é quem fez o upload
  const file = await prisma.measurement_files.findUnique({
    where: { id: fileId },
    select: { uploaded_by: true }
  })

  return file?.uploaded_by === userId
}

/**
 * Verifica se o usuário pode deletar um arquivo (produtos)
 * Apenas quem fez o upload do arquivo ou admin podem deletar
 */
export async function canDeleteProductFile(
  userId: string,
  userRole: string,
  fileId: string
): Promise<boolean> {
  // Admin pode deletar qualquer arquivo
  if (isAdmin(userRole)) {
    return true
  }

  // Verifica se o usuário é quem fez o upload
  const file = await prisma.product_files.findUnique({
    where: { id: fileId },
    select: { uploaded_by: true }
  })

  return file?.uploaded_by === userId
}

/**
 * Verifica se o usuário pode fazer upload de arquivo
 * Qualquer usuário autenticado pode fazer upload
 */
export function canUploadFile(): boolean {
  // Se chegou aqui, já passou pela autenticação
  return true
}

/**
 * Obtém informações do uploader de um arquivo de medição
 */
export async function getMeasurementFileUploader(fileId: string) {
  const file = await prisma.measurement_files.findUnique({
    where: { id: fileId },
    select: {
      uploaded_by: true,
      uploader: {
        select: {
          id: true,
          name: true,
          email: true
        }
      }
    }
  })

  return file?.uploader || null
}

/**
 * Obtém informações do uploader de um arquivo de produto
 */
export async function getProductFileUploader(fileId: string) {
  const file = await prisma.product_files.findUnique({
    where: { id: fileId },
    select: {
      uploaded_by: true,
      uploader: {
        select: {
          id: true,
          name: true,
          email: true
        }
      }
    }
  })

  return file?.uploader || null
}
