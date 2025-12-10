# راهنمای نصب و اجرا روی Raspberry Pi با Docker

## پیش‌نیازها

1. **Raspberry Pi با OS نصب شده** (توصیه: Raspberry Pi OS 64-bit)
2. **Docker نصب شده** روی Raspberry Pi
3. **Git نصب شده** (برای کلون کردن پروژه)

## مراحل نصب Docker روی Raspberry Pi

```bash
# به‌روزرسانی سیستم
sudo apt update && sudo apt upgrade -y

# نصب Docker
curl -fsSL https://get.docker.com -o get-docker.sh
sudo sh get-docker.sh

# اضافه کردن کاربر به گروه docker (تا بدون sudo بتوانید از docker استفاده کنید)
sudo usermod -aG docker $USER

# نصب Docker Compose
sudo apt install docker-compose -y

# ریستارت برای اعمال تغییرات
sudo reboot
```

## دانلود و آماده‌سازی پروژه

```bash
# کلون کردن پروژه
git clone https://github.com/zaherrezai/canvas_editor.git
cd canvas_editor

# یا اگر پروژه را از کامپیوتر خود منتقل می‌کنید:
# از طریق SCP یا SFTP فایل‌ها را به Raspberry Pi انتقال دهید
```

## تنظیمات قبل از اجرا

1. **فایل .env را ایجاد کنید:**

```bash
cat > .env << EOF
DATABASE_URL="file:./dev.db"
NODE_ENV=production
EOF
```

2. **دیتابیس را آماده کنید:**

```bash
# اگر فایل دیتابیس وجود ندارد، ایجاد کنید
docker run --rm -v $(pwd)/prisma:/app/prisma -w /app node:20-alpine sh -c "npm install prisma && npx prisma migrate deploy"
```

## ساخت و اجرای Docker Container

### روش 1: استفاده از Docker Compose (توصیه می‌شود)

```bash
# ساخت و اجرا با یک دستور
docker-compose up -d

# مشاهده لاگ‌ها
docker-compose logs -f

# توقف سرویس
docker-compose down

# ریستارت سرویس
docker-compose restart
```

### روش 2: استفاده مستقیم از Docker

```bash
# ساخت image
docker build -t admintab-app .

# اجرای container
docker run -d \
  --name admintab \
  -p 3001:3001 \
  -v $(pwd)/prisma:/app/prisma \
  --restart unless-stopped \
  admintab-app

# مشاهده لاگ‌ها
docker logs -f admintab

# توقف container
docker stop admintab

# حذف container
docker rm admintab
```

## دسترسی به برنامه

بعد از اجرای موفق، می‌توانید از طریق مرورگر به برنامه دسترسی پیدا کنید:

- **روی خود Raspberry Pi:** http://localhost:3001
- **از کامپیوتر دیگر در شبکه:** http://[IP-RASPBERRY-PI]:3001

## یافتن IP آدرس Raspberry Pi

```bash
hostname -I
```

## مدیریت Container

```bash
# مشاهده containerهای در حال اجرا
docker ps

# مشاهده تمام containerها
docker ps -a

# مشاهده استفاده از منابع
docker stats admintab

# اجرای دستور داخل container
docker exec -it admintab sh

# پاک کردن imageهای استفاده نشده
docker image prune -a

# پاک کردن volumeهای استفاده نشده
docker volume prune
```

## به‌روزرسانی برنامه

```bash
# گرفتن آخرین تغییرات از Git
git pull

# ریبیلد و اجرای مجدد با Docker Compose
docker-compose down
docker-compose build --no-cache
docker-compose up -d

# یا با Docker مستقیم
docker stop admintab
docker rm admintab
docker rmi admintab-app
docker build -t admintab-app .
docker run -d --name admintab -p 3001:3001 -v $(pwd)/prisma:/app/prisma --restart unless-stopped admintab-app
```

## عیب‌یابی

### مشکل: Container شروع نمی‌شود

```bash
# چک کردن لاگ‌ها
docker logs admintab

# چک کردن وضعیت
docker ps -a
```

### مشکل: دیتابیس خطا می‌دهد

```bash
# ایجاد مجدد دیتابیس
docker exec -it admintab npx prisma migrate reset --force
docker exec -it admintab npx prisma migrate deploy
```

### مشکل: پورت در حال استفاده است

```bash
# پیدا کردن پروسس‌ای که از پورت 3001 استفاده می‌کند
sudo lsof -i :3001

# یا تغییر پورت در docker-compose.yml:
# ports:
#   - "8080:3001"  # حالا از پورت 8080 استفاده می‌کند
```

### مشکل: حافظه کم است

برای Raspberry Pi با RAM کم، می‌توانید memory limit تنظیم کنید:

```yaml
# در docker-compose.yml:
services:
  app:
    # ... سایر تنظیمات
    deploy:
      resources:
        limits:
          memory: 1G
        reservations:
          memory: 512M
```

## اجرای خودکار در استارتاپ

Docker Compose با `restart: unless-stopped` به صورت خودکار container را در استارتاپ اجرا می‌کند.

اگر می‌خواهید مطمئن شوید:

```bash
# فعال کردن Docker service در استارتاپ
sudo systemctl enable docker

# چک کردن وضعیت
sudo systemctl status docker
```

## پشتیبان‌گیری از دیتابیس

```bash
# ایجاد پشتیبان
cp ./prisma/dev.db ./prisma/backup-$(date +%Y%m%d-%H%M%S).db

# یا با Docker
docker exec admintab cp /app/prisma/dev.db /app/prisma/backup.db
docker cp admintab:/app/prisma/backup.db ./backup.db
```

## بهینه‌سازی برای Raspberry Pi

1. **استفاده از Alpine Linux** (قبلاً در Dockerfile اعمال شده)
2. **Multi-stage build برای کاهش حجم image:**

```dockerfile
# اگر نیاز به بهینه‌سازی بیشتر دارید:
FROM node:20-alpine AS builder
WORKDIR /app
COPY package*.json ./
RUN npm ci
COPY . .
RUN npm run build

FROM node:20-alpine
WORKDIR /app
COPY --from=builder /app/.next ./.next
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/package*.json ./
CMD ["npm", "start"]
```

## نکات امنیتی

1. **تغییر پورت پیش‌فرض** در محیط production
2. **استفاده از HTTPS** با Nginx Reverse Proxy
3. **محدود کردن دسترسی** به IP های مشخص
4. **به‌روزرسانی منظم** Docker و سیستم عامل

```bash
# نصب و راه‌اندازی Nginx Reverse Proxy با SSL
sudo apt install nginx certbot python3-certbot-nginx
sudo certbot --nginx -d yourdomain.com
```

## منابع مفید

- Docker Documentation: https://docs.docker.com
- Raspberry Pi Documentation: https://www.raspberrypi.org/documentation
- Next.js Deployment: https://nextjs.org/docs/deployment
