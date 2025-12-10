# فایل منیجر پیشرفته

یک فایل منیجر کامل و قدرتمند تحت وب با قابلیت مدیریت کامل فایل‌ها و پوشه‌ها که به راحتی می‌توانید در پروژه‌های خود از آن استفاده کنید.

## ویژگی‌ها

### 🗂️ مدیریت پوشه‌ها
- ایجاد پوشه جدید
- نمایش ساختار درختی پوشه‌ها
- قابلیت باز و بسته کردن پوشه‌ها
- حذف پوشه‌ها

### 📁 مدیریت فایل‌ها
- آپلود چندین فایل همزمان
- نمایش فایل‌ها در دو حالت گرید و لیست
- پیش نمایش فایل‌ها (تصاویر، ویدیو، صدا، PDF)
- دانلود فایل‌ها
- حذف فایل‌ها
- انتخاب چندین فایل برای عملیات گروهی

### 🔍 جستجو و فیلتر
- جستجوی فایل‌ها بر اساس نام
- مرتب‌سازی بر اساس نام، حجم، تاریخ و نوع فایل
- مرتب‌سازی صعودی و نزولی

### 🎨 رابط کاربری
- طراحی مدرن و واکنش‌گرا
- پشتیبانی از حالت تاریک و روشن
- استفاده از کامپوننت‌های shadcn/ui
- زبان فارسی و راست‌چین

### 💾 پایگاه داده
- استفاده از Prisma ORM
- پایگاه داده SQLite
- ساختار بهینه برای فایل‌ها و پوشه‌ها

## ساختار پروژه

```
src/
├── app/
│   ├── api/file-manager/          # API endpoints
│   │   ├── folders/              # مدیریت پوشه‌ها
│   │   ├── files/                # مدیریت فایل‌ها
│   │   ├── upload/               # آپلود فایل
│   │   ├── preview/[id]/         # پیش نمایش فایل
│   │   └── download/[id]/        # دانلود فایل
│   └── page.tsx                  # صفحه اصلی
├── components/
│   ├── file-manager/
│   │   ├── file-manager.tsx      # کامپوننت اصلی
│   │   ├── folder-tree.tsx       # درخت پوشه‌ها
│   │   ├── file-grid.tsx         # نمایش گرید فایل‌ها
│   │   ├── file-list.tsx         # نمایش لیستی فایل‌ها
│   │   └── file-preview.tsx      # پیش نمایش فایل
│   └── ui/                       # کامپوننت‌های UI
├── lib/
│   └── db.ts                     # اتصال به پایگاه داده
└── prisma/
    └── schema.prisma             # شمای پایگاه داده
```

## نحوه استفاده در پروژه‌های دیگر

### ۱. کپی کردن کامپوننت‌ها
کپوننت‌های فایل منیجر را به پروژه خود منتقل کنید:

```bash
# کپی کردن کامپوننت‌ها
cp -r src/components/file-manager /path/to/your/project/src/components/
cp -r src/app/api/file-manager /path/to/your/project/src/app/api/
```

### ۲. افزودن به شمای پایگاه داده
شمای مربوط به فایل منیجر را به فایل `prisma/schema.prisma` اضافه کنید:

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

### ۳. اجرای مهاجرت پایگاه داده
```bash
npx prisma db push
```

### ۴. استفاده در صفحه
```tsx
import { FileManager } from '@/components/file-manager/file-manager'

export default function YourPage() {
  return (
    <div className="min-h-screen bg-background">
      <FileManager />
    </div>
  )
}
```

## API Endpoints

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

## کامپوننت‌ها

### FileManager
کامپوننت اصلی که تمام قابلیت‌های فایل منیجر را مدیریت می‌کند.

```tsx
interface FileManagerProps {
  // هیچ props خاصی نیاز ندارد
}
```

### FolderTree
نمایش درختی پوشه‌ها با قابلیت باز و بسته کردن.

```tsx
interface FolderTreeProps {
  folders: FolderItem[]
  currentFolder: string | null
  onFolderSelect: (folderId: string | null) => void
}
```

### FileGrid و FileList
دو حالت نمایش مختلف برای فایل‌ها.

```tsx
interface FileGridProps {
  files: FileItem[]
  selectedFiles: string[]
  onFileSelect: (fileIds: string[]) => void
  onFilePreview: (file: FileItem) => void
  formatFileSize: (bytes: number) => string
  getFileIcon: (mimeType: string) => string
}
```

### FilePreview
پیش نمایش فایل‌های مختلف.

```tsx
interface FilePreviewProps {
  file: FileItem
  open: boolean
  onOpenChange: (open: boolean) => void
}
```

## سفارشی‌سازی

### تغییر زبان
برای تغییر زبان، می‌توانید متون در کامپوننت‌ها را ویرایش کنید.

### افزودن قابلیت‌های جدید
- کپی و جابجایی فایل‌ها
- تغییر نام فایل‌ها و پوشه‌ها
- به اشتراک‌گذاری فایل‌ها
- مدیریت دسترسی‌ها

### تغییر ظاهر
با استفاده از Tailwind CSS می‌توانید ظاهر را به سادگی تغییر دهید.

## نیازمندی‌ها

- Next.js 15 با App Router
- TypeScript
- Prisma
- SQLite
- shadcn/ui
- Tailwind CSS

## نصب

```bash
npm install
npm run db:push
npm run dev
```

## مجوز

این پروژه تحت مجوز MIT منتشر شده است.