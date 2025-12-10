# 📁 FileManager - مثال‌های کاربردی

در اینجا چند مثال برای نحوه استفاده از FileManager در پروژه‌های مختلف آورده شده است.

## مثال ۱: استفاده ساده

```tsx
import { FileManager } from '@/components/FileManager'

export default function HomePage() {
  return (
    <div className="min-h-screen bg-background">
      <FileManager />
    </div>
  )
}
```

## مثال ۲: استفاده به صورت دیالوگ

```tsx
'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { FileManager } from '@/components/FileManager'

export function FileManagerDialog() {
  const [open, setOpen] = useState(false)

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button>
          باز کردن فایل منیجر
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-7xl max-h-[90vh] p-0">
        <DialogHeader>
          <DialogTitle>مدیریت فایل‌ها</DialogTitle>
        </DialogHeader>
        <div className="h-[80vh]">
          <FileManager />
        </div>
      </DialogContent>
    </Dialog>
  )
}
```

## مثال ۳: استفاده با تنظیمات سفارشی

```tsx
'use client'

import { FileManager, createConfig } from '@/components/FileManager'

// تنظیمات سفارشی
const customConfig = createConfig({
  maxFileSize: 50 * 1024 * 1024, // 50MB
  defaultViewMode: 'list',
  allowedFileTypes: [
    'image/*',
    'application/pdf',
    'application/msword',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
  ],
  language: 'fa',
  theme: 'light'
})

export default function CustomFileManager() {
  return (
    <div className="min-h-screen bg-background">
      <FileManager config={customConfig} />
    </div>
  )
}
```

## مثال ۴: استفاده با رویدادها (Events)

```tsx
'use client'

import { useState } from 'react'
import { FileManager, type FileItem, type FolderItem } from '@/components/FileManager'
import { toast } from '@/hooks/use-toast'

export function FileManagerWithEvents() {
  const [selectedFiles, setSelectedFiles] = useState<FileItem[]>([])

  const handleFileSelect = (files: FileItem[]) => {
    setSelectedFiles(files)
    toast({
      title: "فایل‌ها انتخاب شدند",
      description: `${files.length} فایل انتخاب شده`
    })
  }

  const handleFileUpload = (files: FileItem[]) => {
    toast({
      title: "آپلود موفق",
      description: `${files.length} فایل با موفقیت آپلود شد`
    })
  }

  const handleFolderCreate = (folder: FolderItem) => {
    toast({
      title: "پوشه ایجاد شد",
      description: `پوشه "${folder.name}" با موفقیت ایجاد شد`
    })
  }

  return (
    <div className="min-h-screen bg-background">
      <FileManager
        onFileSelect={handleFileSelect}
        onFileUpload={handleFileUpload}
        onFolderCreate={handleFolderCreate}
      />
      
      {selectedFiles.length > 0 && (
        <div className="fixed bottom-4 right-4 bg-background border rounded-lg p-4 shadow-lg">
          <p className="text-sm font-medium">
            {selectedFiles.length} فایل انتخاب شده
          </p>
        </div>
      )}
    </div>
  )
}
```

## مثال ۵: استفاده از کامپوننت‌های جداگانه

```tsx
'use client'

import { useState, useEffect } from 'react'
import { FileGrid, FileList, FolderTree, type FileItem, type FolderItem } from '@/components/FileManager'

export function CustomFileManager() {
  const [files, setFiles] = useState<FileItem[]>([])
  const [folders, setFolders] = useState<FolderItem[]>([])
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid')
  const [selectedFiles, setSelectedFiles] = useState<string[]>([])

  useEffect(() => {
    // دریافت فایل‌ها و پوشه‌ها از API
    fetchFiles()
    fetchFolders()
  }, [])

  const fetchFiles = async () => {
    const response = await fetch('/api/file-manager/files')
    const data = await response.json()
    setFiles(data)
  }

  const fetchFolders = async () => {
    const response = await fetch('/api/file-manager/folders')
    const data = await response.json()
    setFolders(data)
  }

  return (
    <div className="flex h-screen">
      {/* سایدبار پوشه‌ها */}
      <div className="w-64 border-r">
        <FolderTree
          folders={folders}
          currentFolder={null}
          onFolderSelect={(folderId) => console.log('Selected folder:', folderId)}
        />
      </div>

      {/* محتوای اصلی */}
      <div className="flex-1">
        {/* نوار ابزار */}
        <div className="border-b p-4">
          <div className="flex justify-between">
            <div className="flex gap-2">
              <button
                onClick={() => setViewMode('grid')}
                className={`px-3 py-1 rounded ${viewMode === 'grid' ? 'bg-primary text-primary-foreground' : 'bg-secondary'}`}
              >
                گرید
              </button>
              <button
                onClick={() => setViewMode('list')}
                className={`px-3 py-1 rounded ${viewMode === 'list' ? 'bg-primary text-primary-foreground' : 'bg-secondary'}`}
              >
                لیست
              </button>
            </div>
          </div>
        </div>

        {/* نمایش فایل‌ها */}
        <div className="p-4">
          {viewMode === 'grid' ? (
            <FileGrid
              files={files}
              selectedFiles={selectedFiles}
              onFileSelect={setSelectedFiles}
              onFilePreview={(file) => console.log('Preview file:', file)}
              formatFileSize={(bytes) => `${(bytes / 1024).toFixed(1)} KB`}
              getFileIcon={(mimeType) => {
                if (mimeType.startsWith('image/')) return '🖼️'
                if (mimeType.includes('pdf')) return '📄'
                return '📁'
              }}
            />
          ) : (
            <FileList
              files={files}
              selectedFiles={selectedFiles}
              onFileSelect={setSelectedFiles}
              onFilePreview={(file) => console.log('Preview file:', file)}
              formatFileSize={(bytes) => `${(bytes / 1024).toFixed(1)} KB`}
              getFileIcon={(mimeType) => {
                if (mimeType.startsWith('image/')) return '🖼️'
                if (mimeType.includes('pdf')) return '📄'
                return '📁'
              }}
            />
          )}
        </div>
      </div>
    </div>
  )
}
```

## مثال ۶: یکپارچه‌سازی با سیستم احراز هویت

```tsx
'use client'

import { useSession } from 'next-auth/react'
import { FileManager } from '@/components/FileManager'

export function AuthenticatedFileManager() {
  const { data: session, status } = useSession()

  if (status === 'loading') {
    return <div>در حال بارگذاری...</div>
  }

  if (!session) {
    return <div>لطفاً وارد شوید</div>
  }

  return (
    <div className="min-h-screen bg-background">
      <FileManager />
    </div>
  )
}
```

## مثال ۷: استفاده در پروژه‌های غیر Next.js

```tsx
import React, { useState, useEffect } from 'react'
import { FileManager } from './components/FileManager'

export function App() {
  const [isClient, setIsClient] = useState(false)

  useEffect(() => {
    setIsClient(true)
  }, [])

  if (!isClient) {
    return <div>در حال بارگذاری...</div>
  }

  return (
    <div className="min-h-screen bg-background">
      <FileManager />
    </div>
  )
}
```

## نکات مهم:

1. **Client-side rendering**: حتماً از `'use client'` در بالای کامپوننت‌ها استفاده کنید
2. **API Routes**: مطمئن شوید که API routes در مسیر درست قرار گرفته‌اند
3. **Database**: قبل از استفاده، پایگاه داده را با Prisma راه‌اندازی کنید
4. **Styles**: فایل `styles.css` را برای استایل‌های سفارشی import کنید
5. **Types**: از تعاریف TypeScript برای بهتر شدن type safety استفاده کنید

## خطاهای رایج و راه‌حل‌ها:

1. **Module not found**: مسیر import را بررسی کنید
2. **API 404**: مطمئن شوید که API routes در مسیر درست قرار گرفته‌اند
3. **Database error**: از اجرای `npx prisma db push` مطمئن شوید
4. **File upload error**: پوشه `uploads` را ایجاد کنید و دسترسی‌های آن را بررسی کنید