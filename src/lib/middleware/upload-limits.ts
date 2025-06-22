import { NextRequest, NextResponse } from 'next/server'

export interface UploadLimitOptions {
  maxFileSize?: number // Maximum file size in bytes
  allowedMimeTypes?: string[] // Allowed MIME types
  errorMessage?: string
}

const DEFAULT_MAX_FILE_SIZE = 10 * 1024 * 1024 // 10MB
const DEFAULT_ALLOWED_TYPES = [
  'image/jpeg',
  'image/png',
  'image/gif',
  'image/webp',
  'application/pdf',
  'text/csv',
  'application/vnd.ms-excel',
  'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
]

export async function uploadLimitMiddleware(
  req: NextRequest,
  options: UploadLimitOptions = {}
): Promise<NextResponse | null> {
  const {
    maxFileSize = DEFAULT_MAX_FILE_SIZE,
    allowedMimeTypes = DEFAULT_ALLOWED_TYPES,
    errorMessage = 'File upload validation failed',
  } = options

  // Check Content-Length header
  const contentLength = req.headers.get('content-length')
  if (contentLength && parseInt(contentLength) > maxFileSize) {
    return NextResponse.json(
      {
        error: `File size exceeds maximum allowed size of ${formatFileSize(maxFileSize)}`,
      },
      { status: 413 } // Payload Too Large
    )
  }

  // Check Content-Type for multipart/form-data uploads
  const contentType = req.headers.get('content-type')
  if (contentType?.includes('multipart/form-data')) {
    // For multipart uploads, we'll need to validate on the server side
    // as we can't easily parse multipart data in middleware
    return null
  }

  return null
}

// Helper function to format file size
function formatFileSize(bytes: number): string {
  if (bytes === 0) return '0 Bytes'
  const k = 1024
  const sizes = ['Bytes', 'KB', 'MB', 'GB']
  const i = Math.floor(Math.log(bytes) / Math.log(k))
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i]
}

// Export specific upload limits for different endpoints
export const profileImageUploadLimit = (req: NextRequest) =>
  uploadLimitMiddleware(req, {
    maxFileSize: 5 * 1024 * 1024, // 5MB
    allowedMimeTypes: ['image/jpeg', 'image/png', 'image/gif', 'image/webp'],
    errorMessage: 'Invalid image file',
  })

export const documentUploadLimit = (req: NextRequest) =>
  uploadLimitMiddleware(req, {
    maxFileSize: 20 * 1024 * 1024, // 20MB
    allowedMimeTypes: [
      'application/pdf',
      'application/msword',
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      'text/csv',
      'application/vnd.ms-excel',
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    ],
    errorMessage: 'Invalid document file',
  })

export const csvUploadLimit = (req: NextRequest) =>
  uploadLimitMiddleware(req, {
    maxFileSize: 10 * 1024 * 1024, // 10MB
    allowedMimeTypes: ['text/csv', 'application/vnd.ms-excel'],
    errorMessage: 'Invalid CSV file',
  })
