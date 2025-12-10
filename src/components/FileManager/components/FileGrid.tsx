'use client'

import { useState } from 'react'
import { Card, CardContent } from '@/components/ui/card'
import { Checkbox } from '@/components/ui/checkbox'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { 
  MoreHorizontal,
  Download,
  Eye,
  Trash2,
  Copy,
  Move,
  ExternalLink
} from 'lucide-react'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'

interface FileGridProps {
  files: FileItem[]
  selectedFiles: string[]
  onFileSelect: (fileIds: string[]) => void
  onFilePreview: (file: FileItem) => void
  formatFileSize: (bytes: number) => string
  getFileIcon: (mimeType: string) => string
  onOpenInGoogleDocs?: (file: FileItem) => void
}

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

export function FileGrid({ 
  files, 
  selectedFiles, 
  onFileSelect, 
  onFilePreview,
  formatFileSize,
  getFileIcon,
  onOpenInGoogleDocs
}: FileGridProps) {
  const handleFileCheck = (fileId: string, checked: boolean) => {
    if (checked) {
      onFileSelect([...selectedFiles, fileId])
    } else {
      onFileSelect(selectedFiles.filter(id => id !== fileId))
    }
  }

  const handleSelectAll = (checked: boolean) => {
    if (checked) {
      onFileSelect(files.map(file => file.id))
    } else {
      onFileSelect([])
    }
  }

  const isAllSelected = files.length > 0 && selectedFiles.length === files.length
  const isIndeterminate = selectedFiles.length > 0 && selectedFiles.length < files.length

  return (
    <div className="space-y-4">
      {/* Select All */}
      <div className="flex items-center space-x-2 space-x-reverse">
        <Checkbox
          checked={isAllSelected}
          onCheckedChange={handleSelectAll}
          ref={(ref) => {
            if (ref) {
              ref.indeterminate = isIndeterminate
            }
          }}
        />
        <span className="text-sm text-muted-foreground">
          انتخاب همه ({files.length})
        </span>
      </div>

      {/* Grid */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-6 gap-4">
        {files.map((file) => (
          <Card 
            key={file.id} 
            className={`group hover:shadow-md transition-shadow cursor-pointer ${
              selectedFiles.includes(file.id) ? 'ring-2 ring-primary' : ''
            }`}
            onClick={() => onFilePreview(file)}
          >
            <CardContent className="p-4">
              <div className="space-y-3">
                {/* Checkbox and Actions */}
                <div className="flex items-start justify-between">
                  <Checkbox
                    checked={selectedFiles.includes(file.id)}
                    onCheckedChange={(checked) => handleFileCheck(file.id, checked as boolean)}
                    onClick={(e) => e.stopPropagation()}
                  />
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button
                        variant="ghost"
                        size="sm"
                        className="h-6 w-6 p-0 opacity-0 group-hover:opacity-100 transition-opacity"
                        onClick={(e) => e.stopPropagation()}
                      >
                        <MoreHorizontal className="h-3 w-3" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent>
                      <DropdownMenuItem onClick={(e) => e.stopPropagation()}>
                        <Eye className="h-4 w-4 ml-2" />
                        پیش نمایش
                      </DropdownMenuItem>
                      <DropdownMenuItem onClick={(e) => e.stopPropagation()}>
                        <Download className="h-4 w-4 ml-2" />
                        دانلود
                      </DropdownMenuItem>
                      {onOpenInGoogleDocs && (
                        <>
                          <DropdownMenuSeparator />
                          <DropdownMenuItem onClick={(e) => {
                            e.stopPropagation()
                            onOpenInGoogleDocs(file)
                          }}>
                            <ExternalLink className="h-4 w-4 ml-2" />
                            باز کردن در Google Docs
                          </DropdownMenuItem>
                        </>
                      )}
                      <DropdownMenuSeparator />
                      <DropdownMenuItem onClick={(e) => e.stopPropagation()}>
                        <Copy className="h-4 w-4 ml-2" />
                        کپی
                      </DropdownMenuItem>
                      <DropdownMenuItem onClick={(e) => e.stopPropagation()}>
                        <Move className="h-4 w-4 ml-2" />
                        جابجایی
                      </DropdownMenuItem>
                      <DropdownMenuSeparator />
                      <DropdownMenuItem 
                        className="text-destructive"
                        onClick={(e) => e.stopPropagation()}
                      >
                        <Trash2 className="h-4 w-4 ml-2" />
                        حذف
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>

                {/* File Icon */}
                <div className="flex justify-center">
                  <div className="text-4xl">
                    {getFileIcon(file.mimeType)}
                  </div>
                </div>

                {/* File Info */}
                <div className="space-y-1">
                  <p className="text-sm font-medium truncate" title={file.originalName}>
                    {file.originalName}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    {formatFileSize(file.size)}
                  </p>
                  <div className="flex items-center justify-between">
                    <Badge variant="outline" className="text-xs">
                      {file.extension || 'file'}
                    </Badge>
                    <span className="text-xs text-muted-foreground">
                      {new Date(file.createdAt).toLocaleDateString('fa-IR')}
                    </span>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  )
}