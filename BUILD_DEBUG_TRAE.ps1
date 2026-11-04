$ErrorActionPreference = "Stop"
Set-Location $PSScriptRoot
Write-Host "Hesab Afghanistan V6 - TRAE Android Debug Builder" -ForegroundColor Cyan
if (-not (Get-Command node -ErrorAction SilentlyContinue)) { throw "Node.js 20+ را نصب کنید." }
if (-not (Get-Command npm -ErrorAction SilentlyContinue)) { throw "npm پیدا نشد." }
if (-not (Get-Command java -ErrorAction SilentlyContinue)) { throw "JDK 17 را نصب و JAVA_HOME را تنظیم کنید." }
if (-not $env:ANDROID_HOME -and -not $env:ANDROID_SDK_ROOT) { throw "ANDROID_HOME یا ANDROID_SDK_ROOT تنظیم نشده است." }
if (-not (Get-Command adb -ErrorAction SilentlyContinue)) { throw "Android SDK Platform Tools (adb) در PATH نیست." }
$major = [int]((node -p "process.versions.node").Split('.')[0])
if ($major -lt 20) { throw "Node.js 20 یا بالاتر لازم است." }
if (-not (Test-Path "node_modules")) { npm install }
npm run typecheck
if ($LASTEXITCODE -ne 0) { throw "TypeScript errors. Build متوقف شد." }
npx expo prebuild --platform android
if ($LASTEXITCODE -ne 0) { throw "Expo prebuild failed." }
Push-Location android
.\gradlew.bat assembleDebug
if ($LASTEXITCODE -ne 0) { Pop-Location; throw "Gradle build failed." }
Pop-Location
$apk = Join-Path $PSScriptRoot "android\app\build\outputs\apk\debug\app-debug.apk"
if (Test-Path $apk) { Write-Host "APK آماده است: $apk" -ForegroundColor Green } else { throw "APK پیدا نشد." }
