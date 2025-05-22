import type { PDFDocumentProxy } from 'pdfjs-dist'

/**
 * PDF document state interface
 */
export interface PDFState {
  document: PDFDocumentProxy | null
  currentPage: number
  totalPages: number
  scale: number
  loading: boolean
  error: string | null
  fileName: string | null
}

/**
 * PDF page render options
 */
export interface PDFRenderOptions {
  scale: number
  rotation?: number
}

/**
 * PDF viewer component props
 */
export interface PDFViewerProps {
  file: File | null
  onLoadSuccess?: (pdf: PDFDocumentProxy) => void
  onLoadError?: (error: Error) => void
  onPageChange?: (pageNumber: number) => void
  scale?: number
  currentPage?: number
  className?: string
}

/**
 * PDF toolbar component props
 */
export interface PDFToolbarProps {
  currentPage: number
  totalPages: number
  scale: number
  onPageChange: (page: number) => void
  onPrevPage: () => void
  onNextPage: () => void
  onZoomIn: () => void
  onZoomOut: () => void
  onImportFile: () => void
  onExportFile: () => void
  onToggleSidebar: () => void
  loading: boolean
  fileName: string | null
}

/**
 * Tool types for the PDF viewer toolbar
 */
export type ToolType = 'cursor' | 'hand' | 'zoom-in' | 'zoom-out' 