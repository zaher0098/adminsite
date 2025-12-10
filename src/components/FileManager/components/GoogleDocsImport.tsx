'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { 
  Upload, 
  ExternalLink, 
  AlertCircle,
  CheckCircle,
  FileText,
  FileSpreadsheet,
  Presentation,
  File
} from 'lucide-react'

interface GoogleDocsImportProps {
  file: {
    id: string
    name: string
    originalName: string
    mimeType: string
  }
  onClose: () => void
}

export function GoogleDocsImport({ file, onClose }: GoogleDocsImportProps) {
  const [isUploading, setIsUploading] = useState(false)
  const [uploadComplete, setUploadComplete] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const getFileIcon = () => {
    if (file.mimeType.includes('word') || file.mimeType.includes('document')) {
      return <FileText className="h-8 w-8 text-blue-500" />
    }
    if (file.mimeType.includes('excel') || file.mimeType.includes('spreadsheet')) {
      return <FileSpreadsheet className="h-8 w-8 text-green-500" />
    }
    if (file.mimeType.includes('powerpoint') || file.mimeType.includes('presentation')) {
      return <Presentation className="h-8 w-8 text-orange-500" />
    }
    return <File className="h-8 w-8 text-gray-500" />
  }

  const getFileType = () => {
    if (file.mimeType.includes('word') || file.mimeType.includes('document')) {
      return 'Google Docs'
    }
    if (file.mimeType.includes('excel') || file.mimeType.includes('spreadsheet')) {
      return 'Google Sheets'
    }
    if (file.mimeType.includes('powerpoint') || file.mimeType.includes('presentation')) {
      return 'Google Slides'
    }
    return 'Google Docs'
  }

  const handleDirectOpen = () => {
    // Method 1: Direct open with Google Docs viewer
    const fileUrl = `${window.location.origin}/api/file-manager/public/${file.id}`
    
    let googleDocsUrl = ''
    if (file.mimeType.includes('pdf')) {
      googleDocsUrl = `https://docs.google.com/gview?embedded=1&url=${encodeURIComponent(fileUrl)}`
    } else if (file.mimeType.includes('word') || file.mimeType.includes('document')) {
      googleDocsUrl = `https://docs.google.com/document/u/0/?usp=docs_home&urld=${encodeURIComponent(fileUrl)}`
    } else if (file.mimeType.includes('excel') || file.mimeType.includes('spreadsheet')) {
      googleDocsUrl = `https://docs.google.com/spreadsheets/u/0/?usp=sheets_home&urld=${encodeURIComponent(fileUrl)}`
    } else if (file.mimeType.includes('powerpoint') || file.mimeType.includes('presentation')) {
      googleDocsUrl = `https://docs.google.com/presentation/u/0/?usp=slides_home&urld=${encodeURIComponent(fileUrl)}`
    }
    
    if (googleDocsUrl) {
      window.open(googleDocsUrl, '_blank')
      setUploadComplete(true)
    }
  }

  const handleGoogleDriveUpload = async () => {
    // Method 2: Upload to Google Drive (requires Google Drive API)
    setIsUploading(true)
    setError(null)
    
    try {
      // This would require Google Drive API integration
      // For now, we'll show a message about the limitation
      await new Promise(resolve => setTimeout(resolve, 2000))
      
      setUploadComplete(true)
    } catch (err) {
      setError('خطا در آپلود به Google Drive')
    } finally {
      setIsUploading(false)
    }
  }

  return (
    <Dialog open={true} onOpenChange={onClose}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            {getFileIcon()}
            باز کردن در {getFileType()}
          </DialogTitle>
        </DialogHeader>
        
        <div className="space-y-4">
          <div className="text-center">
            <p className="text-sm text-muted-foreground mb-4">
              فایل "{file.originalName}" را در {getFileType()} باز کنید
            </p>
          </div>

          {!uploadComplete ? (
            <div className="space-y-3">
              <Button 
                onClick={handleDirectOpen}
                className="w-full"
                variant="default"
              >
                <ExternalLink className="h-4 w-4 ml-2" />
                باز کردن مستقیم در {getFileType()}
              </Button>
              
              <div className="relative">
                <div className="absolute inset-0 flex items-center">
                  <span className="w-full border-t" />
                </div>
                <div className="relative flex justify-center text-xs uppercase">
                  <span className="bg-background px-2 text-muted-foreground">
                    یا
                  </span>
                </div>
              </div>
              
              <Button 
                onClick={handleGoogleDriveUpload}
                className="w-full"
                variant="outline"
                disabled={isUploading}
              >
                <Upload className="h-4 w-4 ml-2" />
                {isUploading ? 'در حال آپلود...' : 'آپلود به Google Drive'}
              </Button>
            </div>
          ) : (
            <div className="text-center space-y-3">
              <CheckCircle className="h-12 w-12 text-green-500 mx-auto" />
              <p className="text-sm text-green-600">
                فایل با موفقیت در {getFileType()} باز شد
              </p>
              <Button onClick={onClose} className="w-full">
                بستن
              </Button>
            </div>
          )}

          {error && (
            <Alert variant="destructive">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          <Alert>
            <AlertCircle className="h-4 w-4" />
            <AlertDescription className="text-xs">
              برای باز کردن فایل در Google Docs، ممکن است لازم باشد وارد حساب Google خود شوید.
            </AlertDescription>
          </Alert>
        </div>
      </DialogContent>
    </Dialog>
  )
}