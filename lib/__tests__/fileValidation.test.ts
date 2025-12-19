import { describe, it, expect } from 'vitest'
import { sanitizeFilename, validateFileType, validateFile, getFileType, getFileExtension } from '../fileValidation'

describe('fileValidation', () => {
  describe('sanitizeFilename', () => {
    it('should remove path traversal attempts', () => {
      expect(sanitizeFilename('../../../etc/passwd')).toBe('etcpasswd')
      expect(sanitizeFilename('..\\..\\windows\\system32')).toBe('windowssystem32')
    })

    it('should remove forward and back slashes', () => {
      expect(sanitizeFilename('folder/file.pdf')).toBe('folderfile.pdf')
      expect(sanitizeFilename('folder\\file.pdf')).toBe('folderfile.pdf')
    })

    it('should remove special characters but keep allowed ones', () => {
      expect(sanitizeFilename('file<script>.pdf')).toBe('filescript.pdf')
      expect(sanitizeFilename('valid_file-name.pdf')).toBe('valid_file-name.pdf')
      expect(sanitizeFilename('file with spaces.pdf')).toBe('file with spaces.pdf')
    })

    it('should truncate long filenames', () => {
      const longName = 'a'.repeat(300) + '.pdf'
      const result = sanitizeFilename(longName)
      expect(result.length).toBeLessThanOrEqual(255)
      expect(result.endsWith('.pdf')).toBe(true)
    })
  })

  describe('validateFileType', () => {
    it('should accept valid MIME types', () => {
      expect(validateFileType('application/pdf')).toBe(true)
      expect(validateFileType('image/jpeg')).toBe(true)
      expect(validateFileType('image/png')).toBe(true)
      expect(validateFileType('application/vnd.openxmlformats-officedocument.spreadsheetml.sheet')).toBe(true)
    })

    it('should reject invalid MIME types', () => {
      expect(validateFileType('application/javascript')).toBe(false)
      expect(validateFileType('text/html')).toBe(false)
      expect(validateFileType('application/x-executable')).toBe(false)
    })
  })

  describe('getFileType', () => {
    it('should return correct file type for images', () => {
      expect(getFileType('image/jpeg')).toBe('IMAGE')
      expect(getFileType('image/png')).toBe('IMAGE')
      expect(getFileType('image/webp')).toBe('IMAGE')
    })

    it('should return correct file type for documents', () => {
      expect(getFileType('application/pdf')).toBe('PDF')
      expect(getFileType('application/vnd.openxmlformats-officedocument.spreadsheetml.sheet')).toBe('SPREADSHEET')
      expect(getFileType('application/vnd.openxmlformats-officedocument.wordprocessingml.document')).toBe('DOCUMENT')
    })

    it('should return OTHER for unknown types', () => {
      expect(getFileType('application/octet-stream')).toBe('OTHER')
    })
  })

  describe('getFileExtension', () => {
    it('should return correct extension', () => {
      expect(getFileExtension('file.pdf')).toBe('.pdf')
      expect(getFileExtension('document.docx')).toBe('.docx')
      expect(getFileExtension('image.test.jpg')).toBe('.jpg')
    })

    it('should return empty string for files without extension', () => {
      expect(getFileExtension('noextension')).toBe('')
    })
  })

  describe('validateFile', () => {
    it('should accept valid files', () => {
      const result = validateFile({
        name: 'document.pdf',
        size: 1024 * 1024, // 1MB
        type: 'application/pdf',
      })
      expect(result.valid).toBe(true)
      expect(result.sanitizedName).toBe('document.pdf')
      expect(result.fileType).toBe('PDF')
    })

    it('should reject files that are too large', () => {
      const result = validateFile({
        name: 'huge.pdf',
        size: 100 * 1024 * 1024, // 100MB
        type: 'application/pdf',
      })
      expect(result.valid).toBe(false)
      expect(result.error).toContain('muito grande')
    })

    it('should reject invalid file types', () => {
      const result = validateFile({
        name: 'script.js',
        size: 1024,
        type: 'application/javascript',
      })
      expect(result.valid).toBe(false)
      expect(result.error).toContain('não permitido')
    })

    it('should reject files with invalid names', () => {
      const result = validateFile({
        name: '###',
        size: 1024,
        type: 'application/pdf',
      })
      expect(result.valid).toBe(false)
      expect(result.error).toContain('inválido')
    })
  })
})
