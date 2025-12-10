export interface FileItem {
  id: string
  name: string
  originalName: string
  path: string
  size: number
  mimeType: string
  extension?: string
  folderId: string
  createdAt: string
  updatedAt: string
}

export interface FolderItem {
  id: string
  name: string
  path: string
  parentId?: string
  createdAt: string
  updatedAt: string
}

export type ViewMode = 'grid' | 'list'
export type SortBy = 'name' | 'size' | 'date' | 'type'
export type SortOrder = 'asc' | 'desc'

export interface FileManagerConfig {
  language: 'fa' | 'en'
  theme: 'light' | 'dark' | 'system'
  maxFileSize: number
  allowedFileTypes: string[]
  maxFilesPerUpload: number
  defaultViewMode: ViewMode
  itemsPerPage: number
  enableImagePreview: boolean
  enableVideoPreview: boolean
  enableAudioPreview: boolean
  enablePdfPreview: boolean
  uploadPath: string
  apiBaseUrl: string
  enableVirusScan: boolean
  enableFileEncryption: boolean
  showFileExtensions: boolean
  showFileSize: boolean
  showFileDate: boolean
  showFilePath: boolean
}

export interface FileManagerProps {
  config?: Partial<FileManagerConfig>
  onFileSelect?: (files: FileItem[]) => void
  onFolderSelect?: (folder: FolderItem | null) => void
  onFileUpload?: (files: FileItem[]) => void
  onFileDelete?: (files: FileItem[]) => void
  onFolderCreate?: (folder: FolderItem) => void
  onFolderDelete?: (folder: FolderItem) => void
}