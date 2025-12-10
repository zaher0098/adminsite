import { useState, useEffect, useCallback } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Separator } from '@/components/ui/separator'
import { Badge } from '@/components/ui/badge'
import { 
  ContextMenu,
  ContextMenuContent,
  ContextMenuItem,
  ContextMenuSeparator,
  ContextMenuTrigger,
} from '@/components/ui/context-menu'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { Label } from '@/components/ui/label'
import { 
  Folder, 
  File, 
  Upload, 
  Search, 
  SortAsc, 
  Grid3X3, 
  List, 
  Plus,
  MoreHorizontal,
  Trash2,
  Copy,
  Move,
  Rename,
  Download,
  Eye,
  FolderPlus,
  FilePlus,
  RefreshCw
} from 'lucide-react'
import { FolderTree } from './FolderTree'
import { FileGrid } from './FileGrid'
import { FileList } from './FileList'
import { FilePreview } from './FilePreview'
import { GoogleDocsImport } from './GoogleDocsImport'
import { toast } from '@/hooks/use-toast'
import type { FileItem, FolderItem, ViewMode, SortBy, SortOrder } from '../types/file-manager'

export function FileManager() {
  const [folders, setFolders] = useState<FolderItem[]>([])
  const [files, setFiles] = useState<FileItem[]>([])
  const [currentFolder, setCurrentFolder] = useState<string | null>(null)
  const [selectedFiles, setSelectedFiles] = useState<string[]>([])
  const [viewMode, setViewMode] = useState<ViewMode>('grid')
  const [sortBy, setSortBy] = useState<SortBy>('name')
  const [sortOrder, setSortOrder] = useState<SortOrder>('asc')
  const [searchQuery, setSearchQuery] = useState('')
  const [uploadDialogOpen, setUploadDialogOpen] = useState(false)
  const [newFolderDialogOpen, setNewFolderDialogOpen] = useState(false)
  const [previewFile, setPreviewFile] = useState<FileItem | null>(null)
  const [showGoogleDocsDialog, setShowGoogleDocsDialog] = useState<FileItem | null>(null)
  const [loading, setLoading] = useState(false)

  const fetchFolders = useCallback(async () => {
    try {
      const response = await fetch('/api/file-manager/folders')
      if (response.ok) {
        const data = await response.json()
        setFolders(data)
      }
    } catch (error) {
      console.error('Failed to fetch folders:', error)
      toast({
        title: "خطا",
        description: "دریافت پوشه‌ها با مشکل مواجه شد",
        variant: "destructive",
      })
    }
  }, [])

  const fetchFiles = useCallback(async (folderId?: string) => {
    setLoading(true)
    try {
      const url = folderId ? `/api/file-manager/files?folderId=${folderId}` : '/api/file-manager/files'
      const response = await fetch(url)
      if (response.ok) {
        const data = await response.json()
        setFiles(data)
      }
    } catch (error) {
      console.error('Failed to fetch files:', error)
      toast({
        title: "خطا",
        description: "دریافت فایل‌ها با مشکل مواجه شد",
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    fetchFolders()
    fetchFiles()
  }, [fetchFolders, fetchFiles])

  const handleFolderSelect = (folderId: string | null) => {
    setCurrentFolder(folderId)
    setSelectedFiles([])
    fetchFiles(folderId || undefined)
  }

  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const uploadedFiles = event.target.files
    if (!uploadedFiles || uploadedFiles.length === 0) return

    const formData = new FormData()
    Array.from(uploadedFiles).forEach(file => {
      formData.append('files', file)
    })
    if (currentFolder) {
      formData.append('folderId', currentFolder)
    }

    try {
      const response = await fetch('/api/file-manager/upload', {
        method: 'POST',
        body: formData,
      })

      if (response.ok) {
        toast({
          title: "موفقیت",
          description: "فایل‌ها با موفقیت آپلود شدند",
        })
        fetchFiles(currentFolder || undefined)
        setUploadDialogOpen(false)
      } else {
        throw new Error('Upload failed')
      }
    } catch (error) {
      console.error('Upload failed:', error)
      toast({
        title: "خطا",
        description: "آپلود فایل‌ها با مشکل مواجه شد",
        variant: "destructive",
      })
    }
  }

  const handleCreateFolder = async (folderName: string) => {
    try {
      const response = await fetch('/api/file-manager/folders', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          name: folderName,
          parentId: currentFolder,
        }),
      })

      if (response.ok) {
        toast({
          title: "موفقیت",
          description: "پوشه با موفقیت ایجاد شد",
        })
        fetchFolders()
        setNewFolderDialogOpen(false)
      } else {
        throw new Error('Failed to create folder')
      }
    } catch (error) {
      console.error('Failed to create folder:', error)
      toast({
        title: "خطا",
        description: "ایجاد پوشه با مشکل مواجه شد",
        variant: "destructive",
      })
    }
  }

  const handleDeleteFiles = async () => {
    if (selectedFiles.length === 0) return

    try {
      const response = await fetch('/api/file-manager/files', {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ fileIds: selectedFiles }),
      })

      if (response.ok) {
        toast({
          title: "موفقیت",
          description: "فایل‌ها با موفقیت حذف شدند",
        })
        setSelectedFiles([])
        fetchFiles(currentFolder || undefined)
      } else {
        throw new Error('Failed to delete files')
      }
    } catch (error) {
      console.error('Failed to delete files:', error)
      toast({
        title: "خطا",
        description: "حذف فایل‌ها با مشکل مواجه شد",
        variant: "destructive",
      })
    }
  }

  const handleOpenInGoogleDocs = (file: FileItem) => {
    setShowGoogleDocsDialog(file)
  }

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 Bytes'
    const k = 1024
    const sizes = ['Bytes', 'KB', 'MB', 'GB']
    const i = Math.floor(Math.log(bytes) / Math.log(k))
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i]
  }

  const filteredAndSortedFiles = files
    .filter(file => 
      file.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      file.originalName.toLowerCase().includes(searchQuery.toLowerCase())
    )
    .sort((a, b) => {
      let comparison = 0
      switch (sortBy) {
        case 'name':
          comparison = a.name.localeCompare(b.name)
          break
        case 'size':
          comparison = a.size - b.size
          break
        case 'date':
          comparison = new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()
          break
        case 'type':
          comparison = a.mimeType.localeCompare(b.mimeType)
          break
      }
      return sortOrder === 'asc' ? comparison : -comparison
    })

  const getFileIcon = (mimeType: string) => {
    if (mimeType.startsWith('image/')) return '🖼️'
    if (mimeType.startsWith('video/')) return '🎥'
    if (mimeType.startsWith('audio/')) return '🎵'
    if (mimeType.includes('pdf')) return '📄'
    if (mimeType.includes('word') || mimeType.includes('document')) return '📝'
    if (mimeType.includes('excel') || mimeType.includes('spreadsheet')) return '📊'
    if (mimeType.includes('powerpoint') || mimeType.includes('presentation')) return '📈'
    if (mimeType.includes('text')) return '📝'
    if (mimeType.includes('zip') || mimeType.includes('rar')) return '📦'
    return '📄'
  }

  return (
    <div className="flex h-screen bg-background">
      {/* Sidebar */}
      <div className="w-64 border-r bg-card">
        <div className="p-4">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold">فایل منیجر</h2>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => {
                fetchFolders()
                fetchFiles(currentFolder || undefined)
              }}
            >
              <RefreshCw className="h-4 w-4" />
            </Button>
          </div>
          
          <Dialog open={newFolderDialogOpen} onOpenChange={setNewFolderDialogOpen}>
            <DialogTrigger asChild>
              <Button className="w-full mb-4" variant="outline">
                <FolderPlus className="h-4 w-4 ml-2" />
                پوشه جدید
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>ایجاد پوشه جدید</DialogTitle>
              </DialogHeader>
              <div className="space-y-4">
                <div>
                  <Label htmlFor="folder-name">نام پوشه</Label>
                  <Input
                    id="folder-name"
                    placeholder="نام پوشه را وارد کنید"
                    onKeyDown={(e) => {
                      if (e.key === 'Enter' && e.currentTarget.value) {
                        handleCreateFolder(e.currentTarget.value)
                        e.currentTarget.value = ''
                      }
                    }}
                  />
                </div>
                <Button
                  onClick={() => {
                    const input = document.getElementById('folder-name') as HTMLInputElement
                    if (input?.value) {
                      handleCreateFolder(input.value)
                      input.value = ''
                    }
                  }}
                >
                  ایجاد
                </Button>
              </div>
            </DialogContent>
          </Dialog>

          <Dialog open={uploadDialogOpen} onOpenChange={setUploadDialogOpen}>
            <DialogTrigger asChild>
              <Button className="w-full mb-4">
                <Upload className="h-4 w-4 ml-2" />
                آپلود فایل
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>آپلود فایل</DialogTitle>
              </DialogHeader>
              <div className="space-y-4">
                <div>
                  <Label htmlFor="file-upload">انتخاب فایل‌ها</Label>
                  <Input
                    id="file-upload"
                    type="file"
                    multiple
                    onChange={handleFileUpload}
                    className="mt-2"
                  />
                </div>
              </div>
            </DialogContent>
          </Dialog>

          <FolderTree
            folders={folders}
            currentFolder={currentFolder}
            onFolderSelect={handleFolderSelect}
          />
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 flex flex-col">
        {/* Toolbar */}
        <div className="border-b bg-card p-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4 space-x-reverse">
              <div className="relative">
                <Search className="absolute right-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="جستجوی فایل‌ها..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10 pr-10 w-64"
                />
              </div>

              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="outline" size="sm">
                    <SortAsc className="h-4 w-4 ml-2" />
                    مرتب‌سازی
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent>
                  <DropdownMenuItem onClick={() => setSortBy('name')}>
                    بر اساس نام
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => setSortBy('size')}>
                    بر اساس حجم
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => setSortBy('date')}>
                    بر اساس تاریخ
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => setSortBy('type')}>
                    بر اساس نوع
                  </DropdownMenuItem>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem onClick={() => setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc')}>
                    {sortOrder === 'asc' ? 'صعودی' : 'نزولی'}
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>

              <div className="flex border rounded-md">
                <Button
                  variant={viewMode === 'grid' ? 'default' : 'ghost'}
                  size="sm"
                  onClick={() => setViewMode('grid')}
                  className="rounded-r-none"
                >
                  <Grid3X3 className="h-4 w-4" />
                </Button>
                <Button
                  variant={viewMode === 'list' ? 'default' : 'ghost'}
                  size="sm"
                  onClick={() => setViewMode('list')}
                  className="rounded-l-none"
                >
                  <List className="h-4 w-4" />
                </Button>
              </div>
            </div>

            <div className="flex items-center space-x-2 space-x-reverse">
              {selectedFiles.length > 0 && (
                <>
                  <Badge variant="secondary">
                    {selectedFiles.length} انتخاب شده
                  </Badge>
                  <Button
                    variant="destructive"
                    size="sm"
                    onClick={handleDeleteFiles}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </>
              )}
            </div>
          </div>
        </div>

        {/* File Display */}
        <ScrollArea className="flex-1 p-4">
          {loading ? (
            <div className="flex items-center justify-center h-64">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
            </div>
          ) : filteredAndSortedFiles.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-64 text-muted-foreground">
              <File className="h-12 w-12 mb-4" />
              <p>هیچ فایلی یافت نشد</p>
            </div>
          ) : viewMode === 'grid' ? (
            <FileGrid
              files={filteredAndSortedFiles}
              selectedFiles={selectedFiles}
              onFileSelect={setSelectedFiles}
              onFilePreview={setPreviewFile}
              formatFileSize={formatFileSize}
              getFileIcon={getFileIcon}
              onOpenInGoogleDocs={handleOpenInGoogleDocs}
            />
          ) : (
            <FileList
              files={filteredAndSortedFiles}
              selectedFiles={selectedFiles}
              onFileSelect={setSelectedFiles}
              onFilePreview={setPreviewFile}
              formatFileSize={formatFileSize}
              getFileIcon={getFileIcon}
              onOpenInGoogleDocs={handleOpenInGoogleDocs}
            />
          )}
        </ScrollArea>
      </div>

      {/* File Preview Dialog */}
      {previewFile && (
        <FilePreview
          file={previewFile}
          open={!!previewFile}
          onOpenChange={() => setPreviewFile(null)}
        />
      )}

      {/* Google Docs Import Dialog */}
      {showGoogleDocsDialog && (
        <GoogleDocsImport
          file={showGoogleDocsDialog}
          onClose={() => setShowGoogleDocsDialog(null)}
        />
      )}
    </div>
  )
}