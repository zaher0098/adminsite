// Main Components
export { FileManager } from './components/FileManager'

// Sub Components (for advanced usage)
export { FolderTree } from './components/FolderTree'
export { FileGrid } from './components/FileGrid'
export { FileList } from './components/FileList'
export { FilePreview } from './components/FilePreview'
export { GoogleDocsImport } from './components/GoogleDocsImport'

// Types
export type {
  FileItem,
  FolderItem,
  ViewMode,
  SortBy,
  SortOrder,
  FileManagerConfig,
  FileManagerProps
} from './types/file-manager'

// Config
export {
  defaultConfig,
  createConfig,
  FILE_SIZE_LIMITS,
  FILE_TYPE_GROUPS,
  FILE_ICONS,
  getFileIcon,
  isFileTypeAllowed,
  getFileTypeGroup
} from './lib/file-manager-config'