import * as React from "react"
import { X } from "lucide-react"
import { cn } from "@/lib/utils"

interface PDFSidebarProps {
  open: boolean
  onClose: () => void
  totalPages: number
  currentPage: number
  onPageSelect?: (page: number) => void
}

/**
 * PDF sidebar component - Elegant slide-out sidebar with minimalistic design
 * Matches the Apple-esque styling of the application
 */
const PDFSidebar: React.FC<PDFSidebarProps> = ({
  open,
  onClose,
  totalPages,
  currentPage,
  onPageSelect,
}) => {
  const pages = Array.from({ length: totalPages }, (_, i) => i + 1)

  // Handle escape key
  React.useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && open) {
        onClose()
      }
    }

    document.addEventListener('keydown', handleEscape)
    return () => document.removeEventListener('keydown', handleEscape)
  }, [open, onClose])

  if (!open && totalPages === 0) return null

  return (
    <>
      {/* Backdrop */}
      {open && (
        <div 
          className="fixed inset-0 bg-black/20 backdrop-blur-sm z-40 apple-transition"
          onClick={onClose}
        />
      )}

      {/* Sidebar */}
      <div
        className={cn(
          "fixed top-0 left-0 h-full w-80 bg-background border-r border-border z-50",
          "apple-shadow-lg apple-transition duration-300 ease-out",
          open ? "translate-x-0" : "-translate-x-full"
        )}
      >
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-border">
          <h2 className="text-lg font-semibold tracking-tight">Document Outline</h2>
          <button
            onClick={onClose}
            className="p-2 rounded-md hover:bg-accent hover:text-accent-foreground apple-transition"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 h-full overflow-hidden">
          {totalPages > 0 ? (
            <div className="space-y-4 h-full">
              <div className="text-sm text-muted-foreground">
                Navigate through {totalPages} pages
              </div>
              
              <div className="h-full overflow-y-auto space-y-1 pr-2">
                {pages.map((page) => (
                  <button
                    key={page}
                    onClick={() => {
                      onPageSelect?.(page)
                      onClose()
                    }}
                    className={cn(
                      "w-full text-left px-4 py-3 text-sm rounded-lg apple-transition",
                      "hover:bg-accent hover:text-accent-foreground",
                      "focus:outline-none focus:ring-2 focus:ring-primary/20",
                      page === currentPage 
                        ? "bg-primary text-primary-foreground shadow-sm" 
                        : "text-foreground"
                    )}
                  >
                    <div className="flex items-center justify-between">
                      <span>Page {page}</span>
                      {page === currentPage && (
                        <div className="w-2 h-2 rounded-full bg-current" />
                      )}
                    </div>
                  </button>
                ))}
              </div>
            </div>
          ) : (
            <div className="flex items-center justify-center h-full">
              <div className="text-center text-muted-foreground">
                <p className="text-sm">No document loaded</p>
                <p className="text-xs mt-2">Import a PDF to see the outline</p>
              </div>
            </div>
          )}
        </div>
      </div>
    </>
  )
}

export { PDFSidebar } 