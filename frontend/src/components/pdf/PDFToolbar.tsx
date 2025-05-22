import * as React from "react"
import { 
  MousePointer2, 
  Hand, 
  ZoomIn, 
  ZoomOut, 
  Upload, 
  Download, 
  Sidebar, 
  ChevronLeft, 
  ChevronRight 
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Separator } from "@/components/ui/separator"
import { 
  Tooltip, 
  TooltipContent, 
  TooltipProvider, 
  TooltipTrigger 
} from "@/components/ui/tooltip"
import type { PDFToolbarProps } from "@/types/pdf"

/**
 * PDF viewer toolbar with Apple-esque design
 * Contains navigation, zoom, and file controls
 */
const PDFToolbar: React.FC<PDFToolbarProps> = ({
  currentPage,
  totalPages,
  scale,
  onPageChange,
  onPrevPage,
  onNextPage,
  onZoomIn,
  onZoomOut,
  onImportFile,
  onExportFile,
  onToggleSidebar,
  onClosePDF,
  onToolChange,
  currentTool,
  loading,
  fileName,
}) => {
  const scalePercentage = Math.round(scale * 100)

  const handlePageInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value
    const page = parseInt(value, 10)
    if (!isNaN(page) && page >= 1 && page <= totalPages) {
      onPageChange(page)
    }
  }

  const handlePageInputKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    // Allow arrow keys for navigation within the input, but prevent page navigation
    if (e.key === 'ArrowUp' || e.key === 'ArrowDown' || 
        e.key === 'ArrowLeft' || e.key === 'ArrowRight') {
      e.stopPropagation()
    }
    // Handle Enter key to apply the page change
    if (e.key === 'Enter') {
      e.currentTarget.blur()
    }
  }

  const handlePageInputBlur = (e: React.FocusEvent<HTMLInputElement>) => {
    const value = e.target.value
    const page = parseInt(value, 10)
    // Reset to current page if invalid input
    if (isNaN(page) || page < 1 || page > totalPages) {
      e.target.value = currentPage.toString()
    }
  }

  return (
    <TooltipProvider>
      <div className="flex h-14 items-center justify-between border-b bg-background/95 backdrop-blur px-4 apple-shadow relative z-10">
        {/* Left section - File controls */}
        <div className="flex items-center gap-2">
          <Tooltip>
            <TooltipTrigger asChild>
              <Button 
                variant="ghost" 
                size="icon" 
                onClick={onImportFile}
                className="apple-transition"
              >
                <Upload className="h-4 w-4" />
              </Button>
            </TooltipTrigger>
            <TooltipContent>Import PDF</TooltipContent>
          </Tooltip>

          <Tooltip>
            <TooltipTrigger asChild>
              <Button 
                variant="ghost" 
                size="icon" 
                onClick={onExportFile}
                disabled={!fileName}
                className="apple-transition"
              >
                <Download className="h-4 w-4" />
              </Button>
            </TooltipTrigger>
            <TooltipContent>Export PDF</TooltipContent>
          </Tooltip>

          <Separator orientation="vertical" className="h-6" />

          <Tooltip>
            <TooltipTrigger asChild>
              <Button 
                variant="ghost" 
                size="icon"
                onClick={onToggleSidebar}
                className="apple-transition"
              >
                <Sidebar className="h-4 w-4" />
              </Button>
            </TooltipTrigger>
            <TooltipContent>Toggle Sidebar</TooltipContent>
          </Tooltip>
        </div>

        {/* Center section - Tools */}
        <div className="flex items-center gap-2">
          <Button 
            variant={currentTool === 'cursor' ? 'default' : 'ghost'}
            size="icon"
            onClick={() => onToolChange('cursor')}
            className="apple-transition"
          >
            <MousePointer2 className="h-4 w-4" />
          </Button>

          <Button 
            variant={currentTool === 'hand' ? 'default' : 'ghost'}
            size="icon"
            onClick={() => onToolChange('hand')}
            className="apple-transition"
          >
            <Hand className="h-4 w-4" />
          </Button>

          <Separator orientation="vertical" className="h-6" />

          <Tooltip>
            <TooltipTrigger asChild>
              <Button 
                variant="ghost" 
                size="icon" 
                onClick={onZoomOut}
                disabled={scale <= 0.5}
                className="apple-transition"
              >
                <ZoomOut className="h-4 w-4" />
              </Button>
            </TooltipTrigger>
            <TooltipContent>Zoom Out</TooltipContent>
          </Tooltip>

          <span className="min-w-[4rem] text-center text-sm text-muted-foreground">
            {scalePercentage}%
          </span>

          <Tooltip>
            <TooltipTrigger asChild>
              <Button 
                variant="ghost" 
                size="icon" 
                onClick={onZoomIn}
                disabled={scale >= 3}
                className="apple-transition"
              >
                <ZoomIn className="h-4 w-4" />
              </Button>
            </TooltipTrigger>
            <TooltipContent>Zoom In</TooltipContent>
          </Tooltip>
        </div>

        {/* Right section - Page navigation */}
        <div className="flex items-center gap-2">
          {fileName && (
            <>
              <span className="text-sm text-muted-foreground truncate max-w-[200px]">
                {fileName}
              </span>
              <Separator orientation="vertical" className="h-6" />
            </>
          )}

          <Button 
            variant="ghost" 
            size="icon" 
            onClick={onPrevPage}
            disabled={currentPage <= 1 || loading}
            className="apple-transition"
          >
            <ChevronLeft className="h-4 w-4" />
          </Button>

          <div className="flex items-center gap-1">
            <input
              type="number"
              value={currentPage}
              onChange={handlePageInputChange}
              onKeyDown={handlePageInputKeyDown}
              onBlur={handlePageInputBlur}
              min={1}
              max={totalPages}
              disabled={loading}
              className="w-12 text-center text-sm border border-input rounded px-2 py-1 bg-background focus-ring"
            />
            <span className="text-sm text-muted-foreground">
              of {totalPages}
            </span>
          </div>

          <Button 
            variant="ghost" 
            size="icon" 
            onClick={onNextPage}
            disabled={currentPage >= totalPages || loading}
            className="apple-transition"
          >
            <ChevronRight className="h-4 w-4" />
          </Button>
        </div>
      </div>
    </TooltipProvider>
  )
}

export { PDFToolbar } 