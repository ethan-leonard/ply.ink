import { GlobalWorkerOptions, version } from 'pdfjs-dist'

/**
 * Configure PDF.js worker for client-side PDF processing
 * Uses CDN-hosted worker to avoid bundling issues with frameworks
 */
export const setupPDFWorker = () => {
  try {
    // Use unpkg CDN for the worker with matching version to avoid API/worker mismatches
    GlobalWorkerOptions.workerSrc = `https://unpkg.com/pdfjs-dist@${version}/build/pdf.worker.min.mjs`
  } catch (error) {
    console.error('Failed to configure PDF worker:', error)
    throw new Error('PDF worker configuration failed')
  }
}

/**
 * Validate that the file is a PDF
 * @param file - File to validate
 * @returns boolean indicating if file is a PDF
 */
export const isPDFFile = (file: File): boolean => {
  return file.type === 'application/pdf'
}

/**
 * Download a blob as a file
 * @param blob - Blob to download
 * @param filename - Name for the downloaded file
 */
export const downloadBlob = (blob: Blob, filename: string) => {
  const url = URL.createObjectURL(blob)
  const link = document.createElement('a')
  link.href = url
  link.download = filename
  document.body.appendChild(link)
  link.click()
  document.body.removeChild(link)
  URL.revokeObjectURL(url)
} 