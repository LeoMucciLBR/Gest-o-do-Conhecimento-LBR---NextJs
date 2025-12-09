import { prisma } from '@/lib/prisma'
import { isAdmin } from './contractAuth'

/**
 * Verifica se o usuário pode deletar uma pasta
 * Apenas o criador da pasta, criador do contrato, ou admin podem deletar
 */
export async function canDeleteMeasurementFolder(
  userId: string,
  userRole: string,
  folderId: string
): Promise<boolean> {
  // Admin pode deletar qualquer pasta
  if (isAdmin(userRole)) {
    return true
  }

  // Buscar pasta e contrato
  const folder = await prisma.measurement_folders.findUnique({
    where: { id: folderId },
    select: { 
      created_by: true,
      contract: {
        select: { created_by: true }
      }
    }
  })

  if (!folder) return false

  // Pode deletar se:
  // 1. É quem criou a pasta
  // 2. É o criador do contrato
  return folder.created_by === userId || folder.contract.created_by === userId
}

/**
 * Verifica se o usuário pode deletar um arquivo (medições)
 * Apenas quem fez o upload do arquivo, criador do contrato, ou admin podem deletar
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

  // Buscar arquivo e contrato
  const file = await prisma.measurement_files.findUnique({
    where: { id: fileId },
    select: { 
      uploaded_by: true,
      contract: {
        select: { created_by: true }
      }
    }
  })

  if (!file) return false

  // Pode deletar se:
  // 1. É quem fez o upload
  // 2. É o criador do contrato
  return file.uploaded_by === userId || file.contract.created_by === userId
}

/**
 * Verifica se o usuário pode deletar uma pasta de produtos
 * Apenas o criador da pasta, criador do contrato, ou admin podem deletar
 */
export async function canDeleteProductFolder(
  userId: string,
  userRole: string,
  folderId: string
): Promise<boolean> {
  // Admin pode deletar qualquer pasta
  if (isAdmin(userRole)) {
    return true
  }

  // Buscar pasta e contrato
  const folder = await prisma.product_folders.findUnique({
    where: { id: folderId },
    select: { 
      created_by: true,
      contract: {
        select: { created_by: true }
      }
    }
  })

  if (!folder) return false

  // Pode deletar se:
  // 1. É quem criou a pasta
  // 2. É o criador do contrato
  return folder.created_by === userId || folder.contract.created_by === userId
}

/**
 * Verifica se o usuário pode deletar um arquivo (produtos)
 * Apenas quem fez o upload, criador do contrato, ou admin podem deletar
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

  // Buscar arquivo e contrato
  const file = await prisma.product_files.findUnique({
    where: { id: fileId },
    select: { 
      uploaded_by: true,
      contract: {
        select: { created_by: true }
      }
    }
  })

  if (!file) return false

  // Pode deletar se:
  // 1. É quem fez o upload
  // 2. É o criador do contrato
  return file.uploaded_by === userId || file.contract.created_by === userId
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
