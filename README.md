# Telegram Channel to GitHub Pages (normal.txt + sub.txt)

این ریپو خروجی ۱۰۰ پیام آخر کانال تلگرام را از نسخه‌ی عمومی (`t.me/s/...`) استخراج می‌کند، لینک‌های کانفیگ را جدا می‌کند و دو فایل می‌سازد: `normal.txt` (لینک‌ها) و `sub.txt` (Base64 استاندارد V2Ray subscription). به‌روزرسانی خودکار هر ۱۵ دقیقه انجام می‌شود.

## ساختار فایل‌ها
- `scripts/fetch.js` : اسکریپت اسکرپ و تولید `normal.txt` و `sub.txt`
- `normal.txt` : خروجی خوانا (هر لینک یک خط)
- `sub.txt` : خروجی Base64 از محتوای `normal.txt`
- `.github/workflows/update.yml` : اجرای زمان‌بندی شده + دستی

## پیش‌نیازها
- Node.js 20+
- دسترسی به اینترنت برای دریافت HTML کانال

## راه‌اندازی قدم‌به‌قدم
1. ریپو را بسازید و این فایل‌ها را اضافه کنید.
2. در ریشه ریپو دستور زیر را اجرا کنید تا `normal.txt` و `sub.txt` تولید شود:
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

فرمت لینک سابسکریپشن:
```
sub://https://<username>.github.io/<repo>/sub.txt
```

لینک سابسکریپشن برای این ریپو:
```
sub://https://skybow044.github.io/dalghaksub/sub.txt
```

## تست با curl
```bash
curl -L https://<username>.github.io/<repo>/sub.txt
```

## اجرای دستی Workflow
از تب Actions، workflow با نام **Update Telegram feed** را انتخاب کرده و **Run workflow** را بزنید.

## نکات
- اگر محتوای `normal.txt` و `sub.txt` تغییری نکند، workflow کامیت جدید ایجاد نمی‌کند.
- در صورت شکست دریافت HTML یا نبود لینک معتبر، workflow با خطا متوقف می‌شود.

## دریافت آخرین پیام کانال (متنی)
برای گرفتن متن آخرین پیام کانال (پابلیک) اسکریپت زیر را اجرا کنید:

```bash
node scripts/get-last-message.js --channel v2ray_dalghak
```

اگر ارتباط با `t.me` در محیط فعلی ممکن نباشد، اسکریپت به‌صورت fallback اولین خط `normal.txt` را به‌عنوان آخرین داده‌ی ذخیره‌شده چاپ می‌کند.
