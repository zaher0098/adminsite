/**
 * تنظیمات فایل منیجر
 * این فایل برای سفارشی‌سازی آسان فایل منیجر در پروژه‌های مختلف استفاده می‌شود
 */

export interface FileManagerConfig {
  // تنظیمات عمومی
  language: 'fa' | 'en'
  theme: 'light' | 'dark' | 'system'
  
  // تنظیمات آپلود
  maxFileSize: number // به بایت
  allowedFileTypes: string[]
  maxFilesPerUpload: number
  
  // تنظیمات نمایش
  defaultViewMode: 'grid' | 'list'
  itemsPerPage: number
  
  // تنظیمات پیش نمایش
  enableImagePreview: boolean
  enableVideoPreview: boolean
  enableAudioPreview: boolean
  enablePdfPreview: boolean
  
  // تنظیمات مسیرها
  uploadPath: string
  apiBaseUrl: string
  
  // تنظیمات امنیتی
  enableVirusScan: boolean
  enableFileEncryption: boolean
  
  // تنظیمات ظاهری
  showFileExtensions: boolean
  showFileSize: boolean
  showFileDate: boolean
  showFilePath: boolean
}

export const defaultConfig: FileManagerConfig = {
  language: 'fa',
  theme: 'system',
  
  maxFileSize: 100 * 1024 * 1024, // 100MB
  allowedFileTypes: [
    'image/*',
    'video/*',
    'audio/*',
    'application/pdf',
    'text/*',
    'application/zip',
    'application/x-rar-compressed'
  ],
  maxFilesPerUpload: 10,
  
  defaultViewMode: 'grid',
  itemsPerPage: 50,
  
  enableImagePreview: true,
  enableVideoPreview: true,
  enableAudioPreview: true,
  enablePdfPreview: false, // نیاز به پیاده‌سازی دارد
  
  uploadPath: 'uploads',
  apiBaseUrl: '/api/file-manager',
  
  enableVirusScan: false,
  enableFileEncryption: false,
  
  showFileExtensions: true,
  showFileSize: true,
  showFileDate: true,
  showFilePath: false
}

/**
 * تابع برای ادغام تنظیمات کاربر با تنظیمات پیش‌فرض
 */
export function createConfig(overrides: Partial<FileManagerConfig>): FileManagerConfig {
  return {
    ...defaultConfig,
    ...overrides
  }
}

/**
 * مقادیر از پیش تعریف شده برای اندازه فایل‌ها
 */
export const FILE_SIZE_LIMITS = {
  SMALL: 10 * 1024 * 1024,      // 10MB
  MEDIUM: 50 * 1024 * 1024,     // 50MB
  LARGE: 100 * 1024 * 1024,     // 100MB
  EXTRA_LARGE: 500 * 1024 * 1024 // 500MB
} as const

/**
 * انواع فایل‌های مجاز به صورت گروه‌بندی شده
 */
export const FILE_TYPE_GROUPS = {
  IMAGES: ['image/jpeg', 'image/png', 'image/gif', 'image/webp', 'image/svg+xml'],
  VIDEOS: ['video/mp4', 'video/avi', 'video/mov', 'video/wmv', 'video/flv'],
  AUDIOS: ['audio/mp3', 'audio/wav', 'audio/ogg', 'audio/m4a'],
  DOCUMENTS: [
    'application/pdf',
    'application/msword',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    'application/vnd.ms-excel',
    'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    'application/vnd.ms-powerpoint',
    'application/vnd.openxmlformats-officedocument.presentationml.presentation',
    'application/vnd.oasis.opendocument.text',
    'application/vnd.oasis.opendocument.spreadsheet',
    'application/vnd.oasis.opendocument.presentation'
  ],
  ARCHIVES: [
    'application/zip',
    'application/x-rar-compressed',
    'application/x-7z-compressed',
    'application/x-tar',
    'application/gzip'
  ],
  TEXT: ['text/plain', 'text/csv', 'text/html', 'text/css', 'text/javascript', 'application/json']
} as const

/**
 * آیکون‌ها برای انواع مختلف فایل‌ها
 */
export const FILE_ICONS = {
  // تصاویر
  'image/jpeg': '🖼️',
  'image/png': '🖼️',
  'image/gif': '🖼️',
  'image/webp': '🖼️',
  'image/svg+xml': '🎨',
  
  // ویدیوها
  'video/mp4': '🎥',
  'video/avi': '🎥',
  'video/mov': '🎥',
  'video/wmv': '🎥',
  
  // صداها
  'audio/mp3': '🎵',
  'audio/wav': '🎵',
  'audio/ogg': '🎵',
  'audio/m4a': '🎵',
  
  // اسناد
  'application/pdf': '📄',
  'application/msword': '📝',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document': '📝',
  'application/vnd.ms-excel': '📊',
  'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet': '📊',
  'application/vnd.ms-powerpoint': '📈',
  'application/vnd.openxmlformats-officedocument.presentationml.presentation': '📈',
  'application/vnd.oasis.opendocument.text': '📝',
  'application/vnd.oasis.opendocument.spreadsheet': '📊',
  'application/vnd.oasis.opendocument.presentation': '📈',
  
  // آرشیوها
  'application/zip': '📦',
  'application/x-rar-compressed': '📦',
  'application/x-7z-compressed': '📦',
  'application/x-tar': '📦',
  'application/gzip': '📦',
  
  // متنی
  'text/plain': '📄',
  'text/csv': '📊',
  'text/html': '🌐',
  'text/css': '🎨',
  'text/javascript': '⚡',
  'application/json': '📄',
  
  // پیش‌فرض
  'default': '📄'
} as const

/**
 * تابع برای دریافت آیکون فایل بر اساس نوع آن
 */
export function getFileIcon(mimeType: string): string {
  return FILE_ICONS[mimeType as keyof typeof FILE_ICONS] || FILE_ICONS.default
}

/**
 * تابع برای بررسی اینکه آیا نوع فایل مجاز است یا خیر
 */
export function isFileTypeAllowed(mimeType: string, allowedTypes: string[]): boolean {
  return allowedTypes.some(type => {
    if (type.endsWith('/*')) {
      return mimeType.startsWith(type.slice(0, -1))
    }
    return mimeType === type
  })
}

/**
 * تابع برای گروه‌بندی نوع فایل
 */
export function getFileTypeGroup(mimeType: string): keyof typeof FILE_TYPE_GROUPS | 'other' {
  for (const [group, types] of Object.entries(FILE_TYPE_GROUPS)) {
    if (types.includes(mimeType as any)) {
      return group as keyof typeof FILE_TYPE_GROUPS
    }
  }
  return 'other'
}