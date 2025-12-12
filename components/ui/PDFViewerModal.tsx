'use client'

import { useState, useCallback, useEffect } from 'react'
import { Document, Page, pdfjs } from 'react-pdf'
import { X, Loader2 } from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'

// Set up the worker
pdfjs.GlobalWorkerOptions.workerSrc = `//unpkg.com/pdfjs-dist@${pdfjs.version}/build/pdf.worker.min.mjs`

interface PDFViewerModalProps {
  url: string
  isOpen: boolean
  onClose: () => void
  title?: string
}

export default function PDFViewerModal({ url, isOpen, onClose }: PDFViewerModalProps) {
  const [numPages, setNumPages] = useState<number>(0)
  const [pageNumber, setPageNumber] = useState<number>(1)
  const [loading, setLoading] = useState<boolean>(true)
  const [error, setError] = useState<string | null>(null)
  const [pageHeight, setPageHeight] = useState<number>(0)

  // Calculate scale to fit viewport height (with padding)
  const viewportHeight = typeof window !== 'undefined' ? window.innerHeight - 80 : 800
  const scale = pageHeight > 0 ? viewportHeight / pageHeight : 1

  const onDocumentLoadSuccess = useCallback(({ numPages }: { numPages: number }) => {
    setNumPages(numPages)
    setLoading(false)
    setError(null)
  }, [])

  const onDocumentLoadError = useCallback((err: Error) => {
    console.error('PDF load error:', err)
    setError('Erro ao carregar o PDF')
    setLoading(false)
  }, [])

  const onPageLoadSuccess = useCallback((page: any) => {
    // Get original page height
    setPageHeight(page.originalHeight)
  }, [])

  const goToPrevPage = () => setPageNumber(prev => Math.max(prev - 1, 1))
  const goToNextPage = () => setPageNumber(prev => Math.min(prev + 1, numPages))

  // Handle keyboard navigation
  useEffect(() => {
    if (!isOpen) return
    
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose()
      if (e.key === 'ArrowLeft') goToPrevPage()
      if (e.key === 'ArrowRight') goToNextPage()
    }
    
    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [isOpen, onClose, numPages])

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center cursor-pointer"
          onClick={onClose}
        >
          {/* Close Button - Floating */}
          <button
            onClick={onClose}
            className="absolute top-4 right-4 z-10 p-3 bg-black/50 hover:bg-black/70 text-white rounded-full transition-colors"
            title="Fechar (ESC)"
          >
            <X className="w-6 h-6" />
          </button>

          {/* Page Navigation - Only if multiple pages */}
          {numPages > 1 && (
            <>
              <button
                onClick={(e) => { e.stopPropagation(); goToPrevPage() }}
                disabled={pageNumber <= 1}
                className="absolute left-4 top-1/2 -translate-y-1/2 z-10 p-3 bg-black/50 hover:bg-black/70 text-white rounded-full transition-colors disabled:opacity-30"
                title="Página anterior (←)"
              >
                ◀
              </button>
              <button
                onClick={(e) => { e.stopPropagation(); goToNextPage() }}
                disabled={pageNumber >= numPages}
                className="absolute right-4 top-1/2 -translate-y-1/2 z-10 p-3 bg-black/50 hover:bg-black/70 text-white rounded-full transition-colors disabled:opacity-30"
                title="Próxima página (→)"
              >
                ▶
              </button>
              {/* Page indicator */}
              <div className="absolute bottom-4 left-1/2 -translate-x-1/2 z-10 px-4 py-2 bg-black/50 text-white rounded-full text-sm">
                {pageNumber} / {numPages}
              </div>
            </>
          )}

          {/* PDF Content */}
          <div onClick={(e) => e.stopPropagation()} className="cursor-default">
            {loading && (
              <div className="flex items-center justify-center">
                <Loader2 className="w-12 h-12 text-white animate-spin" />
              </div>
            )}

            {error && (
              <div className="flex flex-col items-center justify-center text-white">
                <p className="text-lg mb-4">{error}</p>
                <a
                  href={url}
                  target="_blank"
                  rel="noreferrer"
                  className="px-4 py-2 bg-blue-600 hover:bg-blue-700 rounded-lg transition-colors"
                >
                  Abrir em nova aba
                </a>
              </div>
            )}

            <Document
              file={url}
              onLoadSuccess={onDocumentLoadSuccess}
              onLoadError={onDocumentLoadError}
              loading={null}
              className={loading ? 'hidden' : ''}
            >
              <Page
                pageNumber={pageNumber}
                height={viewportHeight}
                renderTextLayer={false}
                renderAnnotationLayer={false}
                onLoadSuccess={onPageLoadSuccess}
                className="shadow-2xl"
              />
            </Document>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}
