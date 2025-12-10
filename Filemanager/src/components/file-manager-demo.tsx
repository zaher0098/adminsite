'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { FileManager } from '@/components/file-manager/file-manager'
import { FolderOpen } from 'lucide-react'

/**
 * کامپوننت دمو برای نمایش نحوه استفاده از فایل منیجر در پروژه‌های دیگر
 * این کامپوننت نشان می‌دهد که چگونه می‌توان فایل منیجر را به عنوان یک دیالوگ یا صفحه کامل استفاده کرد
 */
export function FileManagerDemo() {
  const [isOpen, setIsOpen] = useState(false)
  const [viewMode, setViewMode] = useState<'dialog' | 'full'>('dialog')

  return (
    <div className="p-8 space-y-6">
      <div className="text-center space-y-4">
        <h1 className="text-3xl font-bold">دموی فایل منیجر</h1>
        <p className="text-muted-foreground max-w-2xl mx-auto">
          این دمو نشان می‌دهد که چگونه می‌توانید فایل منیجر را به راحتی در پروژه‌های خود intégrate کنید.
          فایل منیجر به صورت کامپوننت‌های ماژولار طراحی شده تا استفاده از آن آسان باشد.
        </p>
      </div>

      <div className="grid md:grid-cols-2 gap-6 max-w-4xl mx-auto">
        {/* Dialog Mode */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <FolderOpen className="h-5 w-5" />
              حالت دیالوگ
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <p className="text-sm text-muted-foreground">
              فایل منیجر را به صورت یک دیالوگ در صفحه خود باز کنید. این روش برای استفاده در صفحاتی که 
              نیاز به مدیریت فایل دارند مناسب است.
            </p>
            <Dialog open={isOpen && viewMode === 'dialog'} onOpenChange={setIsOpen}>
              <DialogTrigger asChild>
                <Button className="w-full">
                  <FolderOpen className="h-4 w-4 ml-2" />
                  باز کردن فایل منیجر
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-7xl max-h-[90vh] p-0">
                <div className="h-[80vh]">
                  <FileManager />
                </div>
              </DialogContent>
            </Dialog>
          </CardContent>
        </Card>

        {/* Full Page Mode */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <FolderOpen className="h-5 w-5" />
              حالت صفحه کامل
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <p className="text-sm text-muted-foreground">
              استفاده از فایل منیجر به صورت یک صفحه کامل. این روش برای صفحات اختصاصی مدیریت فایل مناسب است.
            </p>
            <Button 
              className="w-full" 
              variant="outline"
              onClick={() => window.open('/', '_blank')}
            >
              <FolderOpen className="h-4 w-4 ml-2" />
              باز کردن در صفحه جدید
            </Button>
          </CardContent>
        </Card>
      </div>

      {/* Integration Examples */}
      <div className="max-w-4xl mx-auto space-y-4">
        <h2 className="text-2xl font-semibold text-center">نحوه استفاده</h2>
        
        <Card>
          <CardHeader>
            <CardTitle>۱. نصب و راه‌اندازی</CardTitle>
          </CardHeader>
          <CardContent>
            <pre className="bg-muted p-4 rounded-lg text-sm overflow-x-auto">
{`# کپی کردن کامپوننت‌ها
cp -r src/components/file-manager /your-project/src/components/
cp -r src/app/api/file-manager /your-project/src/app/api/

# افزودن به شمای پایگاه داده
# به فایل prisma/schema.prisma اضافه کنید:
model Folder {
  id          String   @id @default(cuid())
  name        String
  path        String   @unique
  parentId    String?
  parent      Folder?  @relation("FolderHierarchy", fields: [parentId], references: [id], onDelete: Cascade)
  children    Folder[] @relation("FolderHierarchy")
  files       File[]
  createdAt   DateTime @default(now())
  updatedAt   DateTime @updatedAt
}

model File {
  id           String      @id @default(cuid())
  name         String
  originalName String
  path         String      @unique
  size         Int
  mimeType     String
  extension    String?
  folderId     String
  folder       Folder      @relation(fields: [folderId], references: [id], onDelete: Cascade)
  createdAt    DateTime    @default(now())
  updatedAt    DateTime    @updatedAt
}

# اجرای مهاجرت
npx prisma db push`}
            </pre>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>۲. استفاده در کامپوننت</CardTitle>
          </CardHeader>
          <CardContent>
            <pre className="bg-muted p-4 rounded-lg text-sm overflow-x-auto">
{`import { FileManager } from '@/components/file-manager/file-manager'

export default function YourPage() {
  return (
    <div className="min-h-screen bg-background">
      <FileManager />
    </div>
  )
}

// یا به صورت دیالوگ
import { Dialog, DialogContent } from '@/components/ui/dialog'

export function YourComponent() {
  const [open, setOpen] = useState(false)
  
  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogContent className="max-w-7xl max-h-[90vh] p-0">
        <div className="h-[80vh]">
          <FileManager />
        </div>
      </DialogContent>
    </Dialog>
  )
}`}
            </pre>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}