import * as React from "react"
import type { PDFDocumentProxy } from 'pdfjs-dist'
import { PDFToolbar } from "@/components/pdf/PDFToolbar"
import { PDFViewer } from "@/components/pdf/PDFViewer"
import { PDFSidebar } from "@/components/pdf/PDFSidebar"
import { isPDFFile, downloadBlob } from "@/lib/pdf-worker"
import type { ToolType } from "@/types/pdf"

/**
 * Main ply.ink application component
 * Provides a lightning-fast, minimal PDF viewer with Apple-esque design
 */
const App: React.FC = () => {
  const [currentFile, setCurrentFile] = React.useState<File | null>(null)
  const [pdf, setPdf] = React.useState<PDFDocumentProxy | null>(null)
  const [currentPage, setCurrentPage] = React.useState(1)
  const [totalPages, setTotalPages] = React.useState(0)
  const [scale, setScale] = React.useState(1.2)
  const [loading, setLoading] = React.useState(false)
  const [error, setError] = React.useState<string | null>(null)
  const [sidebarOpen, setSidebarOpen] = React.useState(false)
  const [currentTool, setCurrentTool] = React.useState<ToolType>('cursor')

  const fileInputRef = React.useRef<HTMLInputElement>(null)

  // Handle file import
  const handleImportFile = React.useCallback(() => {
    fileInputRef.current?.click()
  }, [])

  const handleFileChange = React.useCallback((event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (!file) return

    if (!isPDFFile(file)) {
      setError('Please select a valid PDF file')
      return
    }

    setCurrentFile(file)
    setError(null)
    
    // Reset input value to allow selecting the same file again
    if (fileInputRef.current) {
      fileInputRef.current.value = ''
    }
  }, [])

  // Handle PDF close
  const handleClosePDF = React.useCallback(() => {
    setCurrentFile(null)
    setPdf(null)
    setCurrentPage(1)
    setTotalPages(0)
    setScale(1.2)
    setError(null)
    setSidebarOpen(false)
  }, [])

  // Handle file export
  const handleExportFile = React.useCallback(async () => {
    if (!currentFile) return

    try {
      const blob = new Blob([await currentFile.arrayBuffer()], { 
        type: 'application/pdf' 
      })
      downloadBlob(blob, currentFile.name)
      
      // Close the PDF after successful export
      handleClosePDF()
    } catch (error) {
      console.error('Export failed:', error)
      setError('Failed to export PDF')
    }
  }, [currentFile, handleClosePDF])

  // Handle tool change
  const handleToolChange = React.useCallback((tool: ToolType) => {
    setCurrentTool(tool)
  }, [])

  // Handle PDF load success
  const handleLoadSuccess = React.useCallback((pdfDoc: PDFDocumentProxy) => {
    setPdf(pdfDoc)
    setTotalPages(pdfDoc.numPages)
    setCurrentPage(1)
    setLoading(false)
  }, [])

  // Handle PDF load error
  const handleLoadError = React.useCallback((error: Error) => {
    setError(error.message)
    setLoading(false)
  }, [])

  // Handle page change
  const handlePageChange = React.useCallback((page: number) => {
    if (page >= 1 && page <= totalPages) {
      setCurrentPage(page)
    }
  }, [totalPages])

  // Handle page navigation
  const handlePrevPage = React.useCallback(() => {
    if (currentPage > 1) {
      setCurrentPage(currentPage - 1)
    }
  }, [currentPage])

  const handleNextPage = React.useCallback(() => {
    if (currentPage < totalPages) {
      setCurrentPage(currentPage + 1)
    }
  }, [currentPage, totalPages])

  // Handle zoom controls
  const handleZoomIn = React.useCallback(() => {
    setScale(prev => Math.min(prev * 1.2, 3))
  }, [])

  const handleZoomOut = React.useCallback(() => {
    setScale(prev => Math.max(prev / 1.2, 0.5))
  }, [])

  // Handle sidebar toggle
  const handleToggleSidebar = React.useCallback(() => {
    setSidebarOpen(prev => !prev)
  }, [])

  // Handle drag and drop
  const handleDragOver = React.useCallback((event: React.DragEvent) => {
    event.preventDefault()
  }, [])

  const handleDrop = React.useCallback((event: React.DragEvent) => {
    event.preventDefault()
    const file = event.dataTransfer.files[0]
    if (!file) return

    if (!isPDFFile(file)) {
      setError('Please drop a valid PDF file')
      return
    }

    setCurrentFile(file)
    setError(null)
  }, [])

  // Note: pdf variable is used for tracking state
  React.useEffect(() => {
    if (pdf && totalPages > 0) {
      // PDF is loaded and ready
      console.log(`PDF loaded: ${totalPages} pages`)
    }
  }, [pdf, totalPages])

  return (
    <div 
      className="h-screen flex flex-col bg-apple-gradient"
      onDragOver={handleDragOver}
      onDrop={handleDrop}
    >
      {/* Hidden file input */}
      <input
        ref={fileInputRef}
        type="file"
        accept=".pdf,application/pdf"
        onChange={handleFileChange}
        className="hidden"
      />

      {/* Toolbar */}
      <PDFToolbar
        currentPage={currentPage}
        totalPages={totalPages}
        scale={scale}
        onPageChange={handlePageChange}
        onPrevPage={handlePrevPage}
        onNextPage={handleNextPage}
        onZoomIn={handleZoomIn}
        onZoomOut={handleZoomOut}
        onImportFile={handleImportFile}
        onExportFile={handleExportFile}
        onToggleSidebar={handleToggleSidebar}
        onClosePDF={handleClosePDF}
        onToolChange={handleToolChange}
        currentTool={currentTool}
        loading={loading}
        fileName={currentFile?.name || null}
      />

      {/* Error display */}
      {error && (
        <div className="px-4 py-2 bg-destructive/10 border-b border-destructive/20">
          <p className="text-sm text-destructive">{error}</p>
        </div>
      )}

      {/* Main content area */}
      <div className="flex-1 flex min-h-0">
        {/* PDF Viewer */}
        <PDFViewer
          file={currentFile}
          onLoadSuccess={handleLoadSuccess}
          onLoadError={handleLoadError}
          onPageChange={handlePageChange}
          scale={scale}
          currentPage={currentPage}
          currentTool={currentTool}
          className="flex-1"
        />
      </div>

      {/* Sidebar */}
      <PDFSidebar
        open={sidebarOpen}
        onClose={() => setSidebarOpen(false)}
        totalPages={totalPages}
        currentPage={currentPage}
        onPageSelect={handlePageChange}
      />

      {/* Welcome message for first-time users */}
      {!currentFile && !error && (
        <div className="absolute inset-0 flex items-center justify-center pointer-events-none p-4">
          <div className="text-center space-y-6 max-w-2xl w-full">
            <h1 className="text-4xl md:text-5xl lg:text-6xl font-light text-gray-800 tracking-tight">
              ply.ink
            </h1>
            <p className="text-lg md:text-xl text-gray-600 font-light">
              ply <i>the sheet</i> · ink <i>the story</i>
            </p>
            <p className="text-base md:text-lg text-gray-500 mb-8">
              No PDF loaded
            </p>
            <p className="text-sm md:text-base text-gray-500 mb-6">
              Drop a PDF file here or click Import to get started
            </p>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-xs md:text-sm text-gray-400 max-w-lg mx-auto">
              <div className="flex items-center justify-center space-x-2">
                <span className="font-medium">•</span>
                <span>Cursor/Hand tools</span>
              </div>
              <div className="flex items-center justify-center space-x-2">
                <span className="font-medium">•</span>
                <span>Click & drag to pan</span>
              </div>
              <div className="flex items-center justify-center space-x-2">
                <span className="font-medium">•</span>
                <span>Arrow keys: Navigate</span>
              </div>
            </div>
          </div>
        </div>
      )}
      </div>
  )
}

export default App
