# 📁 FileManager - Complete File Management System

یک فایل منیجر کامل و حرفه‌ای با پشتیبانی از Google Docs که به راحتی می‌توانید در پروژه‌های خود از آن استفاده کنید.

## ✨ **ویژگی‌ها**

### 🗂️ **مدیریت پوشه‌ها**
- ایجاد پوشه جدید
- نمایش ساختار درختی
- باز و بسته کردن پوشه‌ها
- حذف پوشه‌ها

### 📁 **مدیریت فایل‌ها**
- آپلود چندین فایل همزمان
- نمایش در دو حالت گرید و لیست
- پیش نمایش فایل‌ها (تصویر، ویدیو، صدا، PDF)
- دانلود فایل‌ها
- حذف فایل‌ها (تکی و گروهی)
- انتخاب چندین فایل

### 🔍 **جستجو و مرتب‌سازی**
- جستجوی فایل‌ها بر اساس نام
- مرتب‌سازی بر اساس نام، حجم، تاریخ و نوع
- مرتب‌سازی صعودی و نزولی
- فیلتر بر اساس نوع فایل

### 🌐 **Google Docs Integration**
- باز کردن فایل‌های Word در Google Docs
- باز کردن فایل‌های Excel در Google Sheets
- باز کردن فایل‌های PowerPoint در Google Slides
- باز کردن فایل‌های PDF در Google Docs Viewer

### 🎨 **رابط کاربری**
- طراحی مدرن و واکنش‌گرا
- پشتیبانی از حالت تاریک و روشن
- زبان فارسی و راست‌چین
- آیکون‌های مناسب برای هر نوع فایل

## 📦 **نصب و راه‌اندازی**

### ۱. کپی کردن کامپوننت‌ها
```bash
# کپی کردن پوشه FileManager به پروژه خود
cp -r src/components/FileManager /path/to/your/project/src/components/
```

### ۲. کپی کردن API Routes
```bash
# کپی کردن API routes
cp -r src/components/FileManager/api/file-manager /path/to/your/project/src/app/api/
```

### ۳. افزودن به پایگاه داده
به فایل `prisma/schema.prisma` اضافه کنید:
```prisma
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
```

### ۴. اجرای مهاجرت
```bash
npx prisma db push
```

### ۵. نصب پکیج‌های مورد نیاز
```bash
npm install uuid @types/uuid
```

## 🚀 **نحوه استفاده**

### استفاده اصلی
```tsx
import { FileManager } from '@/components/FileManager'

export default function YourPage() {
  return (
    <div className="min-h-screen bg-background">
      <FileManager />
    </div>
  )
}
```

### استفاده به صورت دیالوگ
```tsx
import { useState } from 'react'
import { Dialog, DialogContent } from '@/components/ui/dialog'
import { FileManager } from '@/components/FileManager'

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
}
```

### استفاده با تنظیمات سفارشی
```tsx
import { FileManager, createConfig } from '@/components/FileManager'

const customConfig = createConfig({
  maxFileSize: 50 * 1024 * 1024, // 50MB
  defaultViewMode: 'list',
  allowedFileTypes: ['image/*', 'application/pdf'],
  language: 'en'
})

export default function YourPage() {
  return (
    <FileManager config={customConfig} />
  )
}
```

## 📁 **ساختار پوشه**

```
FileManager/
├── components/           # کامپوننت‌های اصلی
│   ├── FileManager.tsx   # کامپوننت اصلی
│   ├── FolderTree.tsx    # درخت پوشه‌ها
│   ├── FileGrid.tsx      # نمایش گرید
│   ├── FileList.tsx      # نمایش لیست
│   ├── FilePreview.tsx    # پیش نمایش فایل
│   └── GoogleDocsImport.tsx # یکپارچه‌سازی Google Docs
├── api/                 # API routes برای Next.js
│   └── file-manager/
│       ├── folders/
│       ├── files/
│       ├── upload/
│       ├── preview/
│       ├── download/
│       └── public/
├── lib/                 # کتابخانه‌های کمکی
│   └── file-manager-config.ts
├── types/               # تعاریف TypeScript
│   └── file-manager.ts
├── index.ts            # فایل اصلی برای export
└── README.md           # این فایل
```

## 🎯 **API Endpoints**

### مدیریت پوشه‌ها
- `GET /api/file-manager/folders` - دریافت لیست پوشه‌ها
- `POST /api/file-manager/folders` - ایجاد پوشه جدید

### مدیریت فایل‌ها
- `GET /api/file-manager/files?folderId={id}` - دریافت فایل‌های یک پوشه
- `DELETE /api/file-manager/files` - حذف فایل‌ها

### آپلود و دانلود
- `POST /api/file-manager/upload` - آپلود فایل
- `GET /api/file-manager/preview/{id}` - پیش نمایش فایل
- `GET /api/file-manager/download/{id}` - دانلود فایل
- `GET /api/file-manager/public/{id}` - دسترسی عمومی برای Google Docs

## 🔧 **کامپوننت‌ها**

### FileManager
کامپوننت اصلی که تمام قابلیت‌ها را مدیریت می‌کند.

```tsx
interface FileManagerProps {
  config?: Partial<FileManagerConfig>
  onFileSelect?: (files: FileItem[]) => void
  onFolderSelect?: (folder: FolderItem | null) => void
  onFileUpload?: (files: FileItem[]) => void
  onFileDelete?: (files: FileItem[]) => void
  onFolderCreate?: (folder: FolderItem) => void
  onFolderDelete?: (folder: FolderItem) => void
}
```

### کامپوننت‌های فرعی
برای استفاده پیشرفته می‌توانید از کامپوننت‌های فرعی استفاده کنید:

- `FolderTree` - نمایش درختی پوشه‌ها
- `FileGrid` - نمایش گرید فایل‌ها
- `FileList` - نمایش لیستی فایل‌ها
- `FilePreview` - پیش نمایش فایل‌ها
- `GoogleDocsImport` - یکپارچه‌سازی با Google Docs

## 🎨 **شخصی‌سازی**

### تنظیمات
```tsx
import { createConfig } from '@/components/FileManager'

const config = createConfig({
  language: 'fa',              // زبان
  theme: 'system',             // تم
  maxFileSize: 100 * 1024 * 1024, // حداکثر حجم فایل
  allowedFileTypes: ['*'],     // انواع فایل مجاز
  maxFilesPerUpload: 10,       // حداکثر تعداد فایل همزمان
  defaultViewMode: 'grid',     // حالت نمایش پیش‌فرض
  enableImagePreview: true,     // پیش نمایش تصاویر
  enableVideoPreview: true,     // پیش نمایش ویدیوها
  enableAudioPreview: true,     // پیش نمایش صداها
})
```

### استایل‌دهی
کامپوننت‌ها با استفاده از Tailwind CSS و shadcn/ui ساخته شده‌اند و به راحتی قابل شخصی‌سازی هستند.

## 🌐 **Google Docs Integration**

### فرمت‌های پشتیبانی شده
- **Word** → Google Docs: `.doc`, `.docx`, `.odt`
- **Excel** → Google Sheets: `.xls`, `.xlsx`, `.ods`, `.csv`
- **PowerPoint** → Google Slides: `.ppt`, `.pptx`, `.odp`
- **PDF** → Google Docs Viewer: `.pdf`

### نحوه فعال‌سازی
فایل‌ها به صورت خودکار دکمه "باز کردن در Google Docs" را در منوی فایل نمایش می‌دهند.

## 🔒 **ملاحظات امنیتی**

- فایل‌ها در پوشه `uploads` ذخیره می‌شوند
- دسترسی به فایل‌ها از طریق API کنترل می‌شود
- Google Docs به دسترسی عمومی به فایل‌ها نیاز دارد
- پیشنهاد می‌شود برای محیط پروداکشن از CDN استفاده کنید

## 📱 **پشتیبانی از مرورگرها**

- Chrome 90+
- Firefox 88+
- Safari 14+
- Edge 90+

## 🤝 **مشارکت**

برای مشارکت و بهبود این کامپوننت:
1. یک Issue ایجاد کنید
2. یک Pull Request ارسال کنید
3. از Code of Usage پیروی کنید

## 📄 **مجوز**

این پروژه تحت مجوز MIT منتشر شده است.

## 🙏 **تشکر**

از تمام توسعه‌دهندگانی که در ساخت این پروژه کمک کرده‌اند سپاسگزاریم.