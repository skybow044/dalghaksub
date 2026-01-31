# Telegram Channel to GitHub Pages (sub.txt)

این ریپو خروجی ۱۰ پیام آخر کانال تلگرام را از نسخه‌ی عمومی (`t.me/s/...`) استخراج می‌کند و به صورت `text/plain` در GitHub Pages منتشر می‌کند. به‌روزرسانی خودکار هر ۱ ساعت انجام می‌شود.

## ساختار فایل‌ها
- `scripts/fetch.js` : اسکریپت اسکرپ و تولید `sub.txt`
- `sub.txt` : خروجی نهایی برای GitHub Pages
- `.github/workflows/update.yml` : اجرای زمان‌بندی شده + دستی

## پیش‌نیازها
- Node.js 20+
- دسترسی به اینترنت برای دریافت HTML کانال

## راه‌اندازی قدم‌به‌قدم
1. ریپو را بسازید و این فایل‌ها را اضافه کنید.
2. در ریشه ریپو دستور زیر را اجرا کنید تا `sub.txt` تولید شود:
   ```bash
   npm install
   node scripts/fetch.js
   ```
3. تغییرات را commit و push کنید.
4. GitHub Pages را فعال کنید:
   - Settings → Pages
   - Build and deployment → Source: **Deploy from a branch**
   - Branch: **main** و Folder: **/** (root)

## لینک خروجی نهایی
فرمت لینک:
```
https://<username>.github.io/<repo>/sub.txt
```

## تست با curl
```bash
curl -L https://<username>.github.io/<repo>/sub.txt
```

## اجرای دستی Workflow
از تب Actions، workflow با نام **Update Telegram feed** را انتخاب کرده و **Run workflow** را بزنید.

## نکات
- اگر محتوای `sub.txt` تغییری نکند، workflow کامیت جدید ایجاد نمی‌کند.
- در صورت شکست دریافت HTML یا استخراج پیام‌ها، workflow با خطا متوقف می‌شود.
- برای هر IP یافت‌شده، پرچم کشور مربوطه به همان IP اضافه می‌شود.
