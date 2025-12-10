import path from 'path'

/**
 * Get the upload directory path
 * Uses UPLOAD_PATH env var if available, otherwise defaults to 'uploads'
 */
export function getUploadPath(): string {
  const uploadPath = process.env.UPLOAD_PATH || 'uploads'
  return path.join(process.cwd(), uploadPath)
}

/**
 * Get the full file path
 */
export function getFilePath(relativePath: string): string {
  const uploadPath = process.env.UPLOAD_PATH || 'uploads'
  return path.join(process.cwd(), uploadPath, relativePath)
}
