# Capture Android logcat filtered for React Native and save to upload_logs.txt
# Usage: Open PowerShell as Administrator (or with adb on PATH), cd into mobile, then run:
#   .\scripts\capture_upload_logs.ps1

$adb = Get-Command adb -ErrorAction SilentlyContinue
if (-not $adb) {
    Write-Host "adb not found in PATH. Please ensure Android SDK platform-tools are installed and adb is on PATH." -ForegroundColor Yellow
    Write-Host "Example PATH: C:\Users\<you>\AppData\Local\Android\Sdk\platform-tools" -ForegroundColor Yellow
    exit 1
}

Write-Host "Listing connected devices..."
adb devices

Write-Host "\nIf your device/emulator is listed, press Enter to start capturing logs. Press Ctrl+C in this window to stop and save."
Read-Host "Press Enter to continue"

$logFile = Join-Path -Path (Get-Location) -ChildPath "upload_logs.txt"
Write-Host "Starting adb logcat -> $logFile"
Write-Host "Run the upload in your app now. Press Ctrl+C here when done."

# Run logcat with timestamp and filters; this will run until Ctrl+C
& adb logcat "*:S" "ReactNative:V" "ReactNativeJS:V" -v time > $logFile

Write-Host "\nLog capture stopped. Saved to: $logFile" -ForegroundColor Green
Write-Host "You can open the file with: notepad $logFile"