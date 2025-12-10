'use client'

import { useState, useEffect } from 'react'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Separator } from '@/components/ui/separator'
import { 
  Download, 
  ExternalLink, 
  FileText,
  Image as ImageIcon,
  Video,
  Music,
  Archive,
  File
} from 'lucide-react'
import { GoogleDocsImport } from './GoogleDocsImport'

interface FileItem {
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

interface FilePreviewProps {
  file: FileItem
  open: boolean
  onOpenChange: (open: boolean) => void
}

export function FilePreview({ file, open, onOpenChange }: FilePreviewProps) {
  const [loading, setLoading] = useState(false)
  const [origin, setOrigin] = useState('')
  const [showGoogleDocsDialog, setShowGoogleDocsDialog] = useState(false)

  useEffect(() => {
    if (typeof window !== 'undefined') {
      setOrigin(window.location.origin)
    }
  }, [])

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 Bytes'
    const k = 1024
    const sizes = ['Bytes', 'KB', 'MB', 'GB']
    const i = Math.floor(Math.log(bytes) / Math.log(k))
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i]
  }

  const getFileIcon = (mimeType: string) => {
    if (mimeType.startsWith('image/')) return <ImageIcon className="h-6 w-6" />
    if (mimeType.startsWith('video/')) return <Video className="h-6 w-6" />
    if (mimeType.startsWith('audio/')) return <Music className="h-6 w-6" />
    if (mimeType.includes('pdf') || mimeType.includes('document')) return <FileText className="h-6 w-6" />
    if (mimeType.includes('zip') || mimeType.includes('rar') || mimeType.includes('tar')) return <Archive className="h-6 w-6" />
    return <File className="h-6 w-6" />
  }

  const openInGoogleDocs = (file: FileItem) => {
    if (!origin) return
    
    // Use the public endpoint for Google Docs access
    const publicFileUrl = origin + `/api/file-manager/public/${file.id}`
    
    let googleDocsUrl = ''
    
    if (file.mimeType.includes('pdf')) {
      // For PDF, use Google Docs viewer
      googleDocsUrl = `https://docs.google.com/gview?embedded=1&url=${encodeURIComponent(publicFileUrl)}`
    } else if (file.mimeType.includes('word') || file.mimeType.includes('document')) {
      // For Word documents, use Google Docs import
      googleDocsUrl = `https://docs.google.com/document/u/0/?usp=docs_home&urld=${encodeURIComponent(publicFileUrl)}`
    } else if (file.mimeType.includes('excel') || file.mimeType.includes('spreadsheet')) {
      // For Excel files, use Google Sheets import
      googleDocsUrl = `https://docs.google.com/spreadsheets/u/0/?usp=sheets_home&urld=${encodeURIComponent(publicFileUrl)}`
    } else if (file.mimeType.includes('powerpoint') || file.mimeType.includes('presentation')) {
      // For PowerPoint files, use Google Slides import
      googleDocsUrl = `https://docs.google.com/presentation/u/0/?usp=slides_home&urld=${encodeURIComponent(publicFileUrl)}`
    }
    
    if (googleDocsUrl) {
      console.log('Opening Google Docs URL:', googleDocsUrl)
      window.open(googleDocsUrl, '_blank', 'noopener,noreferrer')
    }
  }

  const renderPreview = () => {
    if (file.mimeType.startsWith('image/')) {
      return (
        <div className="flex justify-center">
          <img
            src={`/api/file-manager/preview/${file.id}`}
            alt={file.originalName}
            className="max-w-full max-h-96 object-contain rounded-lg"
            onLoad={() => setLoading(false)}
            onError={() => setLoading(false)}
          />
        </div>
      )
    }

    if (file.mimeType.startsWith('video/')) {
      return (
        <div className="flex justify-center">
          <video
            src={`/api/file-manager/preview/${file.id}`}
            controls
            className="max-w-full max-h-96 rounded-lg"
            onLoadStart={() => setLoading(false)}
          />
        </div>
      )
    }

    if (file.mimeType.startsWith('audio/')) {
      return (
        <div className="flex justify-center">
          <audio
            src={`/api/file-manager/preview/${file.id}`}
            controls
            className="w-full max-w-md"
            onLoadStart={() => setLoading(false)}
          />
        </div>
      )
    }

    if (file.mimeType.includes('pdf') || 
        file.mimeType.includes('word') || 
        file.mimeType.includes('excel') || 
        file.mimeType.includes('powerpoint') ||
        file.mimeType.includes('document') ||
        file.mimeType.includes('spreadsheet') ||
        file.mimeType.includes('presentation')) {
      
      const isGoogleDocsCompatible = 
        file.mimeType.includes('pdf') ||
        file.mimeType.includes('word') ||
        file.mimeType.includes('excel') ||
        file.mimeType.includes('powerpoint') ||
        file.mimeType.includes('document') ||
        file.mimeType.includes('spreadsheet') ||
        file.mimeType.includes('presentation')

      return (
        <div className="flex flex-col items-center space-y-4">
          <div className="w-full max-w-4xl">
            {file.mimeType.includes('pdf') ? (
              <iframe
                src={`/api/file-manager/preview/${file.id}`}
                className="w-full h-96 border rounded-lg"
                title={`PDF Preview: ${file.originalName}`}
                onError={(e) => {
                  // Fallback if iframe fails
                  const target = e.target as HTMLIFrameElement;
                  target.style.display = 'none';
                  const fallback = document.getElementById(`pdf-fallback-${file.id}`);
                  if (fallback) {
                    fallback.style.display = 'flex';
                  }
                }}
              />
            ) : (
              <div className="flex flex-col items-center space-y-4 py-8">
                <div className="text-6xl">
                  {file.mimeType.includes('word') || file.mimeType.includes('document') ? '📝' :
                   file.mimeType.includes('excel') || file.mimeType.includes('spreadsheet') ? '📊' :
                   file.mimeType.includes('powerpoint') || file.mimeType.includes('presentation') ? '📈' : '📄'}
                </div>
                <p className="text-muted-foreground text-center">
                  {file.mimeType.includes('word') || file.mimeType.includes('document') ? 'فایل Word' :
                   file.mimeType.includes('excel') || file.mimeType.includes('spreadsheet') ? 'فایل Excel' :
                   file.mimeType.includes('powerpoint') || file.mimeType.includes('presentation') ? 'فایل PowerPoint' : 'سند'} برای پیش نمایش در دسترس نیست
                </p>
              </div>
            )}
            <div id={`pdf-fallback-${file.id}`} className="flex flex-col items-center space-y-4" style={{ display: file.mimeType.includes('pdf') ? 'none' : 'flex' }}>
              <div className="flex flex-col items-center space-y-4">
                <div className="text-6xl">
                  {file.mimeType.includes('word') || file.mimeType.includes('document') ? '📝' :
                   file.mimeType.includes('excel') || file.mimeType.includes('spreadsheet') ? '📊' :
                   file.mimeType.includes('powerpoint') || file.mimeType.includes('presentation') ? '📈' : '📄'}
                </div>
                <p className="text-muted-foreground text-center">
                  {file.mimeType.includes('pdf') ? 'پیش نمایش PDF در دسترس نیست' :
                   file.mimeType.includes('word') || file.mimeType.includes('document') ? 'پیش نمایش فایل Word در دسترس نیست' :
                   file.mimeType.includes('excel') || file.mimeType.includes('spreadsheet') ? 'پیش نمایش فایل Excel در دسترس نیست' :
                   file.mimeType.includes('powerpoint') || file.mimeType.includes('presentation') ? 'پیش نمایش فایل PowerPoint در دسترس نیست' :
                   'پیش نمایش سند در دسترس نیست'}
                </p>
                <div className="flex flex-col sm:flex-row gap-2">
                  <Button asChild>
                    <a href={`/api/file-manager/download/${file.id}`} download>
                      <Download className="h-4 w-4 ml-2" />
                      دانلود {file.mimeType.includes('word') || file.mimeType.includes('document') ? 'Word' :
                              file.mimeType.includes('excel') || file.mimeType.includes('spreadsheet') ? 'Excel' :
                              file.mimeType.includes('powerpoint') || file.mimeType.includes('presentation') ? 'PowerPoint' : 'سند'}
                    </a>
                  </Button>
                  {isGoogleDocsCompatible && origin && (
                    <Button variant="outline" onClick={() => setShowGoogleDocsDialog(true)}>
                      <ExternalLink className="h-4 w-4 ml-2" />
                      باز کردن در Google {file.mimeType.includes('excel') || file.mimeType.includes('spreadsheet') ? 'Sheets' : 
                                             file.mimeType.includes('powerpoint') || file.mimeType.includes('presentation') ? 'Slides' : 'Docs'}
                    </Button>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      )
    }

    if (file.mimeType.includes('text')) {
      return (
        <ScrollArea className="h-96 w-full border rounded-lg">
          <div className="p-4">
            <pre className="text-sm whitespace-pre-wrap">
              {file.originalName}
            </pre>
          </div>
        </ScrollArea>
      )
    }

    // Default preview for other file types
    return (
      <div className="flex flex-col items-center space-y-4">
        <div className="text-6xl">{getFileIcon(file.mimeType)}</div>
        <p className="text-muted-foreground">پیش نمایش برای این نوع فایل در دسترس نیست</p>
        <Button asChild>
          <a href={`/api/file-manager/download/${file.id}`} download>
            <Download className="h-4 w-4 ml-2" />
            دانلود فایل
          </a>
        </Button>
      </div>
    )
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[90vh]">
        <DialogHeader>
          <DialogTitle className="flex items-center space-x-2 space-x-reverse">
            {getFileIcon(file.mimeType)}
            <span>{file.originalName}</span>
          </DialogTitle>
        </DialogHeader>
        
        <div className="space-y-4">
          {/* File Info */}
          <div className="flex flex-wrap gap-2">
            <Badge variant="outline">{file.extension || 'unknown'}</Badge>
            <Badge variant="outline">{formatFileSize(file.size)}</Badge>
            <Badge variant="outline">{file.mimeType}</Badge>
          </div>

          <Separator />

          {/* Preview */}
          <div className="min-h-[200px] flex items-center justify-center">
            {loading ? (
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
            ) : (
              renderPreview()
            )}
          </div>

          <Separator />

          {/* Actions */}
          <div className="flex justify-between items-center">
            <div className="text-sm text-muted-foreground space-y-1">
              <p>ایجاد شده: {new Date(file.createdAt).toLocaleString('fa-IR')}</p>
              <p>ویرایش شده: {new Date(file.updatedAt).toLocaleString('fa-IR')}</p>
            </div>
            <div className="flex space-x-2 space-x-reverse">
              <Button variant="outline" asChild>
                <a href={`/api/file-manager/download/${file.id}`} download>
                  <Download className="h-4 w-4 ml-2" />
                  دانلود
                </a>
              </Button>
            </div>
          </div>
        </div>
      </DialogContent>
      
      {showGoogleDocsDialog && (
        <GoogleDocsImport
          file={file}
          onClose={() => setShowGoogleDocsDialog(false)}
        />
      )}
    </Dialog>
  )
}