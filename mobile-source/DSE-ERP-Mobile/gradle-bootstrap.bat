@echo off
setlocal
set "VERSION=9.5.0"
set "CACHE_ROOT=%USERPROFILE%\.dse-erp-mobile\gradle\%VERSION%"
set "DIST_DIR=%CACHE_ROOT%\gradle-%VERSION%"
set "ZIP_FILE=%CACHE_ROOT%\gradle-%VERSION%-bin.zip"
set "URL=https://services.gradle.org/distributions/gradle-%VERSION%-bin.zip"

if not exist "%DIST_DIR%\bin\gradle.bat" (
  if not exist "%CACHE_ROOT%" mkdir "%CACHE_ROOT%"
  if not exist "%ZIP_FILE%" (
    echo Downloading Gradle %VERSION%...
    powershell -NoProfile -ExecutionPolicy Bypass -Command "Invoke-WebRequest -UseBasicParsing -Uri '%URL%' -OutFile '%ZIP_FILE%'"
    if errorlevel 1 exit /b 1
  )
  if exist "%DIST_DIR%" rmdir /s /q "%DIST_DIR%"
  powershell -NoProfile -ExecutionPolicy Bypass -Command "Expand-Archive -LiteralPath '%ZIP_FILE%' -DestinationPath '%CACHE_ROOT%' -Force"
  if errorlevel 1 exit /b 1
)

call "%DIST_DIR%\bin\gradle.bat" %*
exit /b %ERRORLEVEL%
