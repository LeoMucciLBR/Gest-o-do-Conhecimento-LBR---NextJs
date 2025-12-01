// File validation and security utilities for measurement files

export const ALLOWED_MIME_TYPES = {
  'application/pdf': '.pdf',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document': '.docx',
  'application/msword': '.doc',
  'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet': '.xlsx',
  'application/vnd.ms-excel': '.xls',
  'image/jpeg': '.jpg',
  'image/png': '.png',
  'image/webp': '.webp',
  'application/zip': '.zip',
  'application/x-zip-compressed': '.zip',
} as const

export const MAX_FILE_SIZE = 50 * 1024 * 1024 // 50MB
export const MAX_CONTRACT_STORAGE = 5 * 1024 * 1024 * 1024 // 5GB

export function validateFileType(mimeType: string): boolean {
  return mimeType in ALLOWED_MIME_TYPES
}

export function sanitizeFilename(filename: string): string {
  // Remove path traversal attempts
  filename = filename.replace(/\.\./g, '')
  filename = filename.replace(/[\/\\]/g, '')
  
  // Remove special characters but keep spaces, dots, hyphens, underscores
  filename = filename.replace(/[^a-zA-Z0-9\s._-]/g, '')
  
  // Limit length
  if (filename.length > 255) {
    const ext = filename.slice(filename.lastIndexOf('.'))
    filename = filename.slice(0, 250 - ext.length) + ext
  }
  
  return filename
}

export function getFileExtension(filename: string): string {
  const lastDot = filename.lastIndexOf('.')
  return lastDot > 0 ? filename.slice(lastDot) : ''
}

export function getFileType(mimeType: string): string {
  if (mimeType.startsWith('image/')) return 'IMAGE'
  if (mimeType === 'application/pdf') return 'PDF'
  if (mimeType.includes('spreadsheet') || mimeType.includes('excel')) return 'SPREADSHEET'
  if (mimeType.includes('wordprocessing') || mimeType.includes('msword')) return 'DOCUMENT'
  if (mimeType.includes('zip')) return 'ARCHIVE'
  return 'OTHER'
}

export async function calculateFileHash(buffer: Buffer): Promise<string> {
  const crypto = await import('crypto')
  return crypto.createHash('sha256').update(buffer).digest('hex')
}

export function generateUniqueFilename(originalFilename: string): string {
  const timestamp = Date.now()
  const random = Math.random().toString(36).substring(2, 8)
  const ext = getFileExtension(originalFilename)
  const baseName = originalFilename.slice(0, originalFilename.lastIndexOf('.')) || originalFilename
  const sanitized = sanitizeFilename(baseName)
  
  return `${timestamp}-${random}-${sanitized}${ext}`
}

export interface FileValidationResult {
  valid: boolean
  error?: string
  sanitizedName?: string
  fileType?: string
}

export function validateFile(
  file: { name: string; size: number; type: string }
): FileValidationResult {
  // Check file size
  if (file.size > MAX_FILE_SIZE) {
    return {
      valid: false,
      error: `Arquivo muito grande. Tamanho máximo: ${MAX_FILE_SIZE / 1024 / 1024}MB`
    }
  }
  
  // Check MIME type
  if (!validateFileType(file.type)) {
    return {
      valid: false,
      error: 'Tipo de arquivo não permitido. Tipos aceitos: PDF, DOCX, XLSX, JPG, PNG, ZIP'
    }
  }
  
  // Sanitize filename
  const sanitizedName = sanitizeFilename(file.name)
  if (!sanitizedName) {
    return {
      valid: false,
      error: 'Nome de arquivo inválido'
    }
  }
  
  return {
    valid: true,
    sanitizedName,
    fileType: getFileType(file.type)
  }
}
