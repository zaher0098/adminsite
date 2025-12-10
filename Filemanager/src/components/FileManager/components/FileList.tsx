'use client'

import { useState } from 'react'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
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
  ArrowUpDown,
  ExternalLink
} from 'lucide-react'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'

interface FileListProps {
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

export function FileList({ 
  files, 
  selectedFiles, 
  onFileSelect, 
  onFilePreview,
  formatFileSize,
  getFileIcon,
  onOpenInGoogleDocs
}: FileListProps) {
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
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead className="w-12">
              <Checkbox
                checked={isAllSelected}
                onCheckedChange={handleSelectAll}
                ref={(ref) => {
                  if (ref) {
                    ref.indeterminate = isIndeterminate
                  }
                }}
              />
            </TableHead>
            <TableHead>نام فایل</TableHead>
            <TableHead>نوع</TableHead>
            <TableHead>حجم</TableHead>
            <TableHead>تاریخ ایجاد</TableHead>
            <TableHead>تاریخ ویرایش</TableHead>
            <TableHead className="w-12"></TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {files.map((file) => (
            <TableRow 
              key={file.id}
              className={`cursor-pointer hover:bg-muted/50 ${
                selectedFiles.includes(file.id) ? 'bg-muted' : ''
              }`}
              onClick={() => onFilePreview(file)}
            >
              <TableCell onClick={(e) => e.stopPropagation()}>
                <Checkbox
                  checked={selectedFiles.includes(file.id)}
                  onCheckedChange={(checked) => handleFileCheck(file.id, checked as boolean)}
                />
              </TableCell>
              <TableCell>
                <div className="flex items-center space-x-3 space-x-reverse">
                  <span className="text-2xl">{getFileIcon(file.mimeType)}</span>
                  <div>
                    <p className="font-medium">{file.originalName}</p>
                    <p className="text-sm text-muted-foreground">{file.name}</p>
                  </div>
                </div>
              </TableCell>
              <TableCell>
                <Badge variant="outline">
                  {file.extension || file.mimeType.split('/')[0]}
                </Badge>
              </TableCell>
              <TableCell>{formatFileSize(file.size)}</TableCell>
              <TableCell>
                {new Date(file.createdAt).toLocaleDateString('fa-IR')}
              </TableCell>
              <TableCell>
                {new Date(file.updatedAt).toLocaleDateString('fa-IR')}
              </TableCell>
              <TableCell onClick={(e) => e.stopPropagation()}>
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="ghost" size="sm">
                      <MoreHorizontal className="h-4 w-4" />
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
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  )
}