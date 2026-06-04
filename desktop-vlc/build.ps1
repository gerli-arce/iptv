$ErrorActionPreference = "Stop"

$AppDir = $PSScriptRoot
$RuntimeDir = Join-Path $AppDir "vlc-runtime"
$InstallerVersion = "3.0.23"
$InstallerPageUrl = "https://get.videolan.org/vlc/$InstallerVersion/win64/vlc-$InstallerVersion-win64.zip"
$InstallerFile = Join-Path $env:TEMP "vlc-$InstallerVersion-win64.zip"
$AppEntry = Join-Path $AppDir "app.py"
$runtimeSource = $RuntimeDir

if (-not (Test-Path (Join-Path $RuntimeDir "libvlc.dll"))) {
    if (Test-Path $RuntimeDir) {
        Remove-Item -Recurse -Force $RuntimeDir
    }

    Write-Host "Resolviendo mirror oficial de VideoLAN..."
    $page = Invoke-WebRequest -Uri $InstallerPageUrl -UseBasicParsing
    $mirrorUrl = if ($page.Content -match "URL='([^']+)'") { $Matches[1] } elseif ($page.Content -match 'URL="([^"]+)"') { $Matches[1] } else { $null }
    if (-not $mirrorUrl) {
        throw "No se pudo resolver el enlace del instalador oficial de VLC."
    }

    Write-Host "Descargando VLC x64 oficial desde $mirrorUrl"
    Invoke-WebRequest -Uri $mirrorUrl -OutFile $InstallerFile

    Write-Host "Extrayendo VLC en carpeta temporal..."
    $extractDir = Join-Path $env:TEMP "vlc-$InstallerVersion-extract"
    if (Test-Path $extractDir) {
        Remove-Item -Recurse -Force $extractDir
    }
    New-Item -ItemType Directory -Force -Path $extractDir | Out-Null
    Expand-Archive -Path $InstallerFile -DestinationPath $extractDir -Force

    $libvlc = Get-ChildItem -Path $extractDir -Recurse -Filter libvlc.dll | Select-Object -First 1
    if (-not $libvlc) {
        throw "No se encontro libvlc.dll dentro del paquete extraido."
    }

    $runtimeSource = $libvlc.Directory.FullName
    Write-Host "Runtime de VLC encontrado en $runtimeSource"
}

Write-Host "Construyendo exe con VLC embebido..."
python -m PyInstaller --noconfirm --clean --onefile --windowed --name FastnetPlayerDesktop --add-data "$runtimeSource;vlc" $AppEntry

Write-Host "Build listo en dist\FastnetPlayerDesktop.exe"
