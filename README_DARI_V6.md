# حساب افغانستان V6 — طراحی مرجع تصویری

## هدف رابط
تمام صفحات از تصویر مرجع پیروی می‌کنند:
- زمینه مشکی بسیار تیره
- کارت‌های زیتونی با گوشه‌های بزرگ
- رنگ برجسته زرد لیمویی
- نشانگرهای آبی، بنفش و نارنجی برای دسته‌بندی
- صفحه فاکتور با سطح روشن زیتونی/خاکستری و جمع کل زرد
- چیدمان واکنش‌گرا با `useWindowDimensions` و کارت‌های چندستونه
- زبان دری و پشتو با راست‌چین، انگلیسی با چپ‌چین

## امکاناتی که در این نسخه پیاده شده
- جابه‌جایی داخلی میان لایت، پرو و بیزنس
- تغییر زبان دری، پشتو و انگلیسی
- داشبورد واکنش‌گرا
- فهرست مشتریان، جستجو و ثبت مشتری
- فهرست فاکتورها و فیلتر وضعیت
- ساخت فاکتور با مقدار، قیمت فی واحد و محاسبه اعشاری با Decimal.js
- صفحه جزئیات فاکتور
- نگهداری محلی مشتریان و فاکتورها با AsyncStorage

## محدودیت‌هایی که نباید با قابلیت تکمیل‌شده اشتباه شود
این نسخه UI و جریان اولیه مشتری/فاکتور را پیاده می‌کند. اتصال کامل فاکتور به دفترکل دوطرفه،
چاپ PDF، همگام‌سازی ابری عملیاتی، نقش‌های چندکاربره و انبارداری تراکنشی هنوز باید توسعه و
آزمایش شوند. ارقام داشبوردی که منبع ثبت واقعی ندارند، نمونه/صفر هستند؛ آن‌ها را گزارش مالی قطعی ندانید.

## پیش‌نیازهای سیستم
- Windows 10/11 64-bit
- Node.js 20 یا جدیدتر و npm
- JDK 17
- Android SDK Command-line Tools
- Android SDK Platform Tools (adb)
- Android SDK Platform و Build Tools سازگار با Expo SDK 54 / Gradle
- اینترنت برای دانلود نخستین بسته‌های npm و Gradle

Android Studio لازم نیست. Android SDK را می‌توان با Command-line Tools نصب کرد.

### نصب Android SDK بدون Android Studio
۱. Android SDK Command-line Tools for Windows را از صفحه رسمی Android Developers دریافت کنید.
۲. فایل‌ها را در مسیر نمونه `C:\Android\cmdline-tools\latest` بگذارید تا `bin\sdkmanager.bat` موجود باشد.
۳. متغیرهای محیطی را در PowerShell تنظیم کنید (مسیرها را مطابق نصب خود تغییر دهید):

```powershell
[Environment]::SetEnvironmentVariable("ANDROID_HOME","C:\Android","User")
[Environment]::SetEnvironmentVariable("ANDROID_SDK_ROOT","C:\Android","User")
[Environment]::SetEnvironmentVariable("JAVA_HOME","C:\Program Files\Java\jdk-17","User")
```

پس از بازکردن ترمینل تازه:
```powershell
$env:Path += ";$env:ANDROID_HOME\platform-tools;$env:ANDROID_HOME\cmdline-tools\latest\bin"
sdkmanager.bat --licenses
sdkmanager.bat "platform-tools" "platforms;android-36" "build-tools;36.0.0"
```
اگر Gradle نسخه دیگری از Android API یا Build Tools خواست، همان نسخه را از متن خطا نصب کنید.

## اجرا در TRAE IDE
پوشه استخراج‌شده را با Open Folder باز کنید. سپس:
```powershell
npm install
npm run typecheck
npm test
```
برای ساخت APK دیباگ:
```powershell
powershell -ExecutionPolicy Bypass -File .\BUILD_DEBUG_TRAE.ps1
```

فایل خروجی:
`android\app\build\outputs\apk\debug\app-debug.apk`

برای نصب روی موبایل:
```powershell
adb devices
adb install -r .\android\app\build\outputs\apk\debug\app-debug.apk
```
در موبایل Developer options و USB debugging را روشن و اجازه اتصال را تأیید کنید.

## نکته RTL
دری و پشتو راست‌چین‌اند و انگلیسی چپ‌چین. جهت ردیف‌ها و متن‌ها بر اساس زبان تنظیم می‌شود.
در صورت تغییر جهت سراسری سیستم عامل، ممکن است برای اعمال تنظیم RTL به بارگذاری دوباره برنامه نیاز باشد.

## امنیت
کلید Supabase `service_role` را هرگز در برنامه موبایل نگذارید. فقط کلید عمومی مجاز در کلاینت،
همراه با RLS فعال، استفاده شود. داده‌های این نسخه در دستگاه نگهداری می‌شوند.
