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
  currentTool = 'cursor',
  className,
}) => {
  const canvasRef = React.useRef<HTMLCanvasElement>(null)
  const containerRef = React.useRef<HTMLDivElement>(null)
  const renderTaskRef = React.useRef<any>(null)
  const [pdf, setPdf] = React.useState<PDFDocumentProxy | null>(null)
  const [currentPage, setCurrentPage] = React.useState(1)
  const [loading, setLoading] = React.useState(false)
  const [scale, setScale] = React.useState(1.2)
  const [isPanning, setIsPanning] = React.useState(false)
  const [lastPanPoint, setLastPanPoint] = React.useState({ x: 0, y: 0 })

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

      // Don't intercept keys when user is typing in an input
      if (event.target instanceof HTMLInputElement || 
          event.target instanceof HTMLTextAreaElement ||
          event.target instanceof HTMLSelectElement) {
        return
      }

      switch (event.key) {
        case 'ArrowLeft':
          event.preventDefault()
          if (activePage > 1) {
            const newPage = activePage - 1
            if (externalCurrentPage !== undefined) {
              onPageChange?.(newPage)
            } else {
              setCurrentPage(newPage)
            }
          }
          break
        case 'ArrowRight':
          event.preventDefault()
          if (activePage < pdf.numPages) {
            const newPage = activePage + 1
            if (externalCurrentPage !== undefined) {
              onPageChange?.(newPage)
            } else {
              setCurrentPage(newPage)
            }
          }
          break
        case 'ArrowUp':
          // Don't prevent default for arrow up/down to allow natural scrolling
          // Only handle page navigation if we're at scroll boundaries
          if (activePage > 1) {
            const container = document.querySelector('.overflow-auto')
            if (container && container.scrollTop === 0) {
              event.preventDefault()
              const newPage = activePage - 1
              if (externalCurrentPage !== undefined) {
                onPageChange?.(newPage)
              } else {
                setCurrentPage(newPage)
              }
            }
          }
          break
        case 'ArrowDown':
          // Don't prevent default for arrow up/down to allow natural scrolling
          // Only handle page navigation if we're at scroll boundaries
          if (activePage < pdf.numPages) {
            const container = document.querySelector('.overflow-auto')
            if (container && container.scrollTop + container.clientHeight >= container.scrollHeight - 5) {
              event.preventDefault()
              const newPage = activePage + 1
              if (externalCurrentPage !== undefined) {
                onPageChange?.(newPage)
              } else {
                setCurrentPage(newPage)
              }
            }
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

    // Use non-passive event listener for keyboard events
    document.addEventListener('keydown', handleKeyDown, { passive: false })
    return () => document.removeEventListener('keydown', handleKeyDown)
  }, [pdf, activePage, externalCurrentPage])

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

  // Handle panning functionality
  React.useEffect(() => {
    if (currentTool !== 'hand') return

    const handleMouseDown = (e: MouseEvent) => {
      if (e.target === canvasRef.current) {
        setIsPanning(true)
        setLastPanPoint({ x: e.clientX, y: e.clientY })
        e.preventDefault()
      }
    }

    const handleMouseMove = (e: MouseEvent) => {
      if (!isPanning || !containerRef.current) return

      const deltaX = e.clientX - lastPanPoint.x
      const deltaY = e.clientY - lastPanPoint.y

      containerRef.current.scrollLeft -= deltaX
      containerRef.current.scrollTop -= deltaY

      setLastPanPoint({ x: e.clientX, y: e.clientY })
    }

    const handleMouseUp = () => {
      setIsPanning(false)
    }

    document.addEventListener('mousedown', handleMouseDown)
    document.addEventListener('mousemove', handleMouseMove)
    document.addEventListener('mouseup', handleMouseUp)

    return () => {
      document.removeEventListener('mousedown', handleMouseDown)
      document.removeEventListener('mousemove', handleMouseMove)
      document.removeEventListener('mouseup', handleMouseUp)
    }
  }, [currentTool, isPanning, lastPanPoint])

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
      ref={containerRef}
      className={cn(
        "flex-1 overflow-auto bg-neutral-50 focus:outline-none pdf-scrollable min-h-0",
        currentTool === 'hand' && 'cursor-grab',
        isPanning && 'cursor-grabbing',
        className
      )}
      tabIndex={0}
      onClick={(e) => {
        // Ensure the container has focus when clicked
        e.currentTarget.focus()
      }}
    >
      <div className="p-8 flex justify-center">
        <div className="relative">
          <canvas
            ref={canvasRef}
            className={cn(
              "pdf-canvas border border-border rounded-lg bg-white block",
              currentTool === 'cursor' && 'cursor-text',
              currentTool === 'hand' && 'cursor-grab',
              isPanning && 'cursor-grabbing'
            )}
            style={{ 
              height: 'auto',
              width: 'auto',
              maxWidth: 'none',
              display: 'block',
              userSelect: currentTool === 'cursor' ? 'text' : 'none'
            }}
          />
          {loading && (
            <div className="absolute inset-0 flex items-center justify-center bg-background/50 rounded-lg">
              <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin" />
            </div>
          )}
        </div>
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