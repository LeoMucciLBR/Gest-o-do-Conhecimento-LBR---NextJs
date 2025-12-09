import { prisma } from '@/lib/prisma'

/**
 * Tipos de ações para auditoria
 */
export enum AuditAction {
  // Contratos
  CONTRACT_CREATE = 'CONTRACT_CREATE',
  CONTRACT_UPDATE = 'CONTRACT_UPDATE',
  CONTRACT_DELETE = 'CONTRACT_DELETE',
  CONTRACT_RESTORE = 'CONTRACT_RESTORE',
  
  // Editores
  EDITOR_ADD = 'EDITOR_ADD',
  EDITOR_REMOVE = 'EDITOR_REMOVE',
  
  // Arquivos de Medição
  MEASUREMENT_FILE_UPLOAD = 'MEASUREMENT_FILE_UPLOAD',
  MEASUREMENT_FILE_DELETE = 'MEASUREMENT_FILE_DELETE',
  MEASUREMENT_FOLDER_CREATE = 'MEASUREMENT_FOLDER_CREATE',
  MEASUREMENT_FOLDER_DELETE = 'MEASUREMENT_FOLDER_DELETE',
  
  // Arquivos de Produto
  PRODUCT_FILE_UPLOAD = 'PRODUCT_FILE_UPLOAD',
  PRODUCT_FILE_DELETE = 'PRODUCT_FILE_DELETE',
  PRODUCT_FOLDER_CREATE = 'PRODUCT_FOLDER_CREATE',
  PRODUCT_FOLDER_DELETE = 'PRODUCT_FOLDER_DELETE',
}

/**
 * Tipos de entidades
 */
export enum EntityType {
  CONTRACT = 'CONTRACT',
  FILE = 'FILE',
  FOLDER = 'FOLDER',
  EDITOR = 'EDITOR',
}

interface AuditLogData {
  contractId?: string
  userId: string
  action: AuditAction
  entityType: EntityType
  entityId?: string
  changes?: Record<string, any>
  ipAddress?: string
  userAgent?: string
}

/**
 * Cria um registro de log de auditoria
 */
async function createAuditLog(data: AuditLogData) {
  try {
    await prisma.contract_audit_log.create({
      data: {
        contract_id: data.contractId || null,
        user_id: data.userId,
        action: data.action,
        entity_type: data.entityType,
        entity_id: data.entityId || null,
        changes: data.changes || null,
        ip_address: data.ipAddress || null,
        user_agent: data.userAgent || null,
      }
    })
  } catch (error) {
    console.error('Erro ao criar log de auditoria:', error)
    // Não lançar erro para não quebrar a operação principal
  }
}

/**
 * Log de criação de contrato
 */
export async function logContractCreation(
  contractId: string,
  userId: string,
  contractData: Record<string, any>,
  ipAddress?: string,
  userAgent?: string
) {
  await createAuditLog({
    contractId,
    userId,
    action: AuditAction.CONTRACT_CREATE,
    entityType: EntityType.CONTRACT,
    entityId: contractId,
    changes: {
      created: true,
      data: {
        name: contractData.name,
        organization: contractData.organization,
        status: contractData.status
      }
    },
    ipAddress,
    userAgent
  })
}

/**
 * Log de atualização de contrato
 */
export async function logContractUpdate(
  contractId: string,
  userId: string,
  changes: Record<string, any>,
  ipAddress?: string,
  userAgent?: string
) {
  await createAuditLog({
    contractId,
    userId,
    action: AuditAction.CONTRACT_UPDATE,
    entityType: EntityType.CONTRACT,
    entityId: contractId,
    changes,
    ipAddress,
    userAgent
  })
}

/**
 * Log de deleção de contrato (soft delete)
 */
export async function logContractDeletion(
  contractId: string,
  userId: string,
  ipAddress?: string,
  userAgent?: string
) {
  await createAuditLog({
    contractId,
    userId,
    action: AuditAction.CONTRACT_DELETE,
    entityType: EntityType.CONTRACT,
    entityId: contractId,
    changes: {
      deleted: true,
      soft_delete: true
    },
    ipAddress,
    userAgent
  })
}

/**
 * Log de adição de editor
 */
export async function logEditorAdded(
  contractId: string,
  editorUserId: string,
  addedByUserId: string,
  ipAddress?: string,
  userAgent?: string
) {
  await createAuditLog({
    contractId,
    userId: addedByUserId,
    action: AuditAction.EDITOR_ADD,
    entityType: EntityType.EDITOR,
    entityId: editorUserId,
    changes: {
      editor_user_id: editorUserId,
      added_by: addedByUserId
    },
    ipAddress,
    userAgent
  })
}

/**
 * Log de remoção de editor
 */
export async function logEditorRemoved(
  contractId: string,
  editorUserId: string,
  removedByUserId: string,
  ipAddress?: string,
  userAgent?: string
) {
  await createAuditLog({
    contractId,
    userId: removedByUserId,
    action: AuditAction.EDITOR_REMOVE,
    entityType: EntityType.EDITOR,
    entityId: editorUserId,
    changes: {
      editor_user_id: editorUserId,
      removed_by: removedByUserId
    },
    ipAddress,
    userAgent
  })
}

/**
 * Log de upload de arquivo de medição
 */
export async function logMeasurementFileUpload(
  contractId: string,
  fileId: string,
  userId: string,
  fileName: string,
  fileSize: number,
  ipAddress?: string,
  userAgent?: string
) {
  await createAuditLog({
    contractId,
    userId,
    action: AuditAction.MEASUREMENT_FILE_UPLOAD,
    entityType: EntityType.FILE,
    entityId: fileId,
    changes: {
      file_name: fileName,
      file_size: fileSize
    },
    ipAddress,
    userAgent
  })
}

/**
 * Log de deleção de arquivo de medição
 */
export async function logMeasurementFileDelete(
  contractId: string,
  fileId: string,
  userId: string,
  fileName: string,
  ipAddress?: string,
  userAgent?: string
) {
  await createAuditLog({
    contractId,
    userId,
    action: AuditAction.MEASUREMENT_FILE_DELETE,
    entityType: EntityType.FILE,
    entityId: fileId,
    changes: {
      file_name: fileName,
      deleted: true
    },
    ipAddress,
    userAgent
  })
}

/**
 * Log de criação de pasta de medição
 */
export async function logMeasurementFolderCreate(
  contractId: string,
  folderId: string,
  userId: string,
  folderName: string,
  ipAddress?: string,
  userAgent?: string
) {
  await createAuditLog({
    contractId,
    userId,
    action: AuditAction.MEASUREMENT_FOLDER_CREATE,
    entityType: EntityType.FOLDER,
    entityId: folderId,
    changes: {
      folder_name: folderName,
      created: true
    },
    ipAddress,
    userAgent
  })
}

/**
 * Log de deleção de pasta de medição
 */
export async function logMeasurementFolderDelete(
  contractId: string,
  folderId: string,
  userId: string,
  folderName: string,
  ipAddress?: string,
  userAgent?: string
) {
  await createAuditLog({
    contractId,
    userId,
    action: AuditAction.MEASUREMENT_FOLDER_DELETE,
    entityType: EntityType.FOLDER,
    entityId: folderId,
    changes: {
      folder_name: folderName,
      deleted: true
    },
    ipAddress,
    userAgent
  })
}

/**
 * Log de upload de arquivo de produto
 */
export async function logProductFileUpload(
  contractId: string,
  fileId: string,
  userId: string,
  fileName: string,
  fileSize: number,
  ipAddress?: string,
  userAgent?: string
) {
  await createAuditLog({
    contractId,
    userId,
    action: AuditAction.PRODUCT_FILE_UPLOAD,
    entityType: EntityType.FILE,
    entityId: fileId,
    changes: {
      file_name: fileName,
      file_size: fileSize
    },
    ipAddress,
    userAgent
  })
}

/**
 * Log de deleção de arquivo de produto
 */
export async function logProductFileDelete(
  contractId: string,
  fileId: string,
  userId: string,
  fileName: string,
  ipAddress?: string,
  userAgent?: string
) {
  await createAuditLog({
    contractId,
    userId,
    action: AuditAction.PRODUCT_FILE_DELETE,
    entityType: EntityType.FILE,
    entityId: fileId,
    changes: {
      file_name: fileName,
      deleted: true
    },
    ipAddress,
    userAgent
  })
}

/**
 * Log de criação de pasta de produto
 */
export async function logProductFolderCreate(
  contractId: string,
  folderId: string,
  userId: string,
  folderName: string,
  ipAddress?: string,
  userAgent?: string
) {
  await createAuditLog({
    contractId,
    userId,
    action: AuditAction.PRODUCT_FOLDER_CREATE,
    entityType: EntityType.FOLDER,
    entityId: folderId,
    changes: {
      folder_name: folderName,
      created: true
    },
    ipAddress,
    userAgent
  })
}

/**
 * Log de deleção de pasta de produto
 */
export async function logProductFolderDelete(
  contractId: string,
  folderId: string,
  userId: string,
  folderName: string,
  ipAddress?: string,
  userAgent?: string
) {
  await createAuditLog({
    contractId,
    userId,
    action: AuditAction.PRODUCT_FOLDER_DELETE,
    entityType: EntityType.FOLDER,
    entityId: folderId,
    changes: {
      folder_name: folderName,
      deleted: true
    },
    ipAddress,
    userAgent
  })
}

/**
 * Obter logs de auditoria de um contrato
 */
export async function getContractAuditLogs(
  contractId: string,
  options?: {
    limit?: number
    offset?: number
    action?: AuditAction
    entityType?: EntityType
  }
) {
  const where: any = { contract_id: contractId }
  
  if (options?.action) {
    where.action = options.action
  }
  
  if (options?.entityType) {
    where.entity_type = options.entityType
  }

  const [total, logs] = await Promise.all([
    prisma.contract_audit_log.count({ where }),
    prisma.contract_audit_log.findMany({
      where,
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true,
            picture_url: true
          }
        }
      },
      orderBy: {
        created_at: 'desc'
      },
      take: options?.limit || 50,
      skip: options?.offset || 0
    })
  ])

  return { total, logs }
}
