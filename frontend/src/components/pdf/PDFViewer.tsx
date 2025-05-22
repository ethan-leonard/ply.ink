import * as React from "react"
import { getDocument } from 'pdfjs-dist'
import type { PDFDocumentProxy, PDFPageProxy } from 'pdfjs-dist'
import { setupPDFWorker } from "@/lib/pdf-worker"
import type { PDFViewerProps } from "@/types/pdf"
import { cn } from "@/lib/utils"

/**
 * PDF viewer component that renders PDF pages in a canvas
 * Handles loading, rendering, and basic navigation
 */
const PDFViewer: React.FC<PDFViewerProps> = ({
  file,
  onLoadSuccess,
  onLoadError,
  onPageChange,
  scale: externalScale,
  currentPage: externalCurrentPage,
  className,
}) => {
  const canvasRef = React.useRef<HTMLCanvasElement>(null)
  const renderTaskRef = React.useRef<any>(null)
  const [pdf, setPdf] = React.useState<PDFDocumentProxy | null>(null)
  const [currentPage, setCurrentPage] = React.useState(1)
  const [loading, setLoading] = React.useState(false)
  const [scale, setScale] = React.useState(1.2)

  // Use external values when provided
  const activeScale = externalScale ?? scale
  const activePage = externalCurrentPage ?? currentPage

  // Sync external state changes
  React.useEffect(() => {
    if (externalCurrentPage !== undefined && externalCurrentPage !== currentPage) {
      setCurrentPage(externalCurrentPage)
    }
  }, [externalCurrentPage, currentPage])

  React.useEffect(() => {
    if (externalScale !== undefined && externalScale !== scale) {
      setScale(externalScale)
    }
  }, [externalScale, scale])

  // Initialize PDF worker on mount
  React.useEffect(() => {
    try {
      setupPDFWorker()
    } catch (error) {
      console.error('PDF worker setup failed:', error)
      onLoadError?.(error as Error)
    }
  }, [onLoadError])

  // Load PDF when file changes
  React.useEffect(() => {
    if (!file) {
      setPdf(null)
      return
    }

    const loadPDF = async () => {
      try {
        setLoading(true)
        const arrayBuffer = await file.arrayBuffer()
        const loadingTask = getDocument({ data: arrayBuffer })
        const pdfDoc = await loadingTask.promise
        
        setPdf(pdfDoc)
        setCurrentPage(1)
        onLoadSuccess?.(pdfDoc)
      } catch (error) {
        console.error('Failed to load PDF:', error)
        onLoadError?.(error as Error)
      } finally {
        setLoading(false)
      }
    }

    loadPDF()
  }, [file, onLoadSuccess, onLoadError])

  // Render current page when PDF or page changes
  React.useEffect(() => {
    if (!pdf || !canvasRef.current) return

    const renderPage = async (pageNumber: number) => {
      try {
        setLoading(true)
        
        // Cancel any ongoing render operation
        if (renderTaskRef.current) {
          renderTaskRef.current.cancel()
          renderTaskRef.current = null
        }

        const page: PDFPageProxy = await pdf.getPage(pageNumber)
        const canvas = canvasRef.current!
        const context = canvas.getContext('2d')!

        const viewport = page.getViewport({ scale: activeScale })
        canvas.height = viewport.height
        canvas.width = viewport.width

        const renderContext = {
          canvasContext: context,
          viewport,
        }

        // Store the render task so we can cancel it if needed
        renderTaskRef.current = page.render(renderContext)
        await renderTaskRef.current.promise
        renderTaskRef.current = null
        
        onPageChange?.(pageNumber)
      } catch (error) {
        if (error instanceof Error && error.name !== 'RenderingCancelledException') {
          console.error('Failed to render page:', error)
          onLoadError?.(error)
        }
      } finally {
        setLoading(false)
      }
    }

    renderPage(activePage)
  }, [pdf, activePage, activeScale, onPageChange, onLoadError])

  // Handle keyboard navigation
  React.useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (!pdf) return

      switch (event.key) {
        case 'ArrowUp':
        case 'ArrowLeft':
          event.preventDefault()
          if (activePage > 1) {
            setCurrentPage(activePage - 1)
          }
          break
        case 'ArrowDown':
        case 'ArrowRight':
          event.preventDefault()
          if (activePage < pdf.numPages) {
            setCurrentPage(activePage + 1)
          }
          break
        case '+':
        case '=':
          event.preventDefault()
          setScale(prev => Math.min(prev * 1.2, 3))
          break
        case '-':
          event.preventDefault()
          setScale(prev => Math.max(prev / 1.2, 0.5))
          break
      }
    }

    // Use non-passive event listener for keyboard events too
    window.addEventListener('keydown', handleKeyDown, { passive: false })
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [pdf, activePage])

  // Handle wheel zoom with native event listener to avoid passive event issues
  React.useEffect(() => {
    let wheelTimeout: NodeJS.Timeout | null = null

    const handleWheel = (event: WheelEvent) => {
      if (event.ctrlKey) {
        event.preventDefault()
        
        // Debounce rapid wheel events to prevent excessive re-renders
        if (wheelTimeout) {
          clearTimeout(wheelTimeout)
        }
        
        wheelTimeout = setTimeout(() => {
          const delta = event.deltaY > 0 ? 0.9 : 1.1
          setScale(prev => Math.max(0.5, Math.min(3, prev * delta)))
          wheelTimeout = null
        }, 16) // ~60fps throttling
      }
    }

    const element = canvasRef.current?.parentElement
    if (element) {
      // Use non-passive event listener to allow preventDefault
      element.addEventListener('wheel', handleWheel, { passive: false })
      return () => {
        element.removeEventListener('wheel', handleWheel)
        if (wheelTimeout) {
          clearTimeout(wheelTimeout)
        }
      }
    }
  }, [])

  // Add cleanup for render task on unmount
  React.useEffect(() => {
    return () => {
      if (renderTaskRef.current) {
        renderTaskRef.current.cancel()
      }
    }
  }, [])

  if (!file) {
    return (
      <div className={cn(
        "flex-1 flex items-center justify-center text-muted-foreground",
        className
      )}>
        <div className="text-center">
          <p className="text-lg mb-2">No PDF loaded</p>
          <p className="text-sm">Import a PDF file to get started</p>
        </div>
      </div>
    )
  }

  if (loading && !pdf) {
    return (
      <div className={cn(
        "flex-1 flex items-center justify-center",
        className
      )}>
        <div className="text-center">
          <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-4" />
          <p className="text-muted-foreground">Loading PDF...</p>
        </div>
      </div>
    )
  }

  return (
    <div 
      className={cn(
        "flex-1 overflow-auto bg-neutral-50 flex items-center justify-center",
        className
      )}
    >
      <div className="p-8">
        <canvas
          ref={canvasRef}
          className="pdf-canvas border border-border rounded-lg bg-white"
          style={{ maxWidth: '100%', height: 'auto' }}
        />
        {loading && (
          <div className="absolute inset-0 flex items-center justify-center bg-background/50">
            <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin" />
          </div>
        )}
      </div>
    </div>
  )
}

// Export navigation functions for use by parent components
export const usePDFNavigation = (pdf: PDFDocumentProxy | null) => {
  const [currentPage, setCurrentPage] = React.useState(1)

  const goToPage = React.useCallback((page: number) => {
    if (pdf && page >= 1 && page <= pdf.numPages) {
      setCurrentPage(page)
    }
  }, [pdf])

  const nextPage = React.useCallback(() => {
    if (pdf && currentPage < pdf.numPages) {
      setCurrentPage(currentPage + 1)
    }
  }, [pdf, currentPage])

  const prevPage = React.useCallback(() => {
    if (currentPage > 1) {
      setCurrentPage(currentPage - 1)
    }
  }, [currentPage])

  return {
    currentPage,
    totalPages: pdf?.numPages || 0,
    goToPage,
    nextPage,
    prevPage,
  }
}

export { PDFViewer } 