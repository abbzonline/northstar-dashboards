# Finishes the deck in PowerPoint (Windows): embeds the Inter fonts so the .pptx renders as designed on machines
# without Inter, and exports the PDF with PowerPoint's own renderer.
#
#   node build_ebr.js build\Northstar_EBR_Oct2026.pptx
#   powershell -ExecutionPolicy Bypass -File finish.ps1 build\Northstar_EBR_Oct2026.pptx
#
# Requires PowerPoint and the fonts in ../fonts installed. Writes send/ebr/Northstar_EBR_Oct2026.pptx and .pdf,
# then fails if any Inter face did not embed.
#
# Never overwrites a deck that was edited by hand: the published .pptx must match what this script last wrote
# (or, on a fresh clone, the committed version). Carry any edits into build_ebr.js first, or pass -Force once
# they are safe elsewhere.
param([Parameter(Mandatory = $true)][string]$Built, [switch]$Force)

$ErrorActionPreference = 'Stop'
$src = (Resolve-Path $Built).Path
$ebr = Join-Path (Split-Path (Split-Path (Split-Path $PSScriptRoot -Parent) -Parent) -Parent) 'send\ebr'
$pptx = Join-Path $ebr 'Northstar_EBR_Oct2026.pptx'
$pdf = Join-Path $ebr 'Northstar_EBR_Oct2026.pdf'
$stamp = Join-Path $PSScriptRoot 'build\last-finished.sha256'

if ((Test-Path $pptx) -and -not $Force) {
  try { $current = (Get-FileHash $pptx -Algorithm SHA256).Hash }
  catch { throw "Can't read $pptx (open in PowerPoint?). Close it and rerun." }
  if (Test-Path $stamp) {
    $edited = $current -ne (Get-Content $stamp -Raw).Trim()
  } else {
    & git -C $ebr diff --quiet -- 'Northstar_EBR_Oct2026.pptx'
    $edited = $LASTEXITCODE -ne 0
  }
  if ($edited) {
    throw "$pptx has changed since it was last built (edited by hand?). Carry the edits into build_ebr.js or move the file, then rerun; -Force overwrites."
  }
}

$pp = New-Object -ComObject PowerPoint.Application
try {
  $p = $pp.Presentations.Open($src, -1, 0, 0)  # read-only, no window
  $p.SaveAs($pptx, 24, -1)  # ppSaveAsOpenXMLPresentation, EmbedTrueTypeFonts
  $p.SaveAs($pdf, 32)       # ppSaveAsPDF
  $p.Close()
} finally {
  $pp.Quit()
  [System.Runtime.InteropServices.Marshal]::ReleaseComObject($pp) | Out-Null
}

# Check the saved package itself (PowerPoint's Font.Embedded flag is unreliable through COM).
Add-Type -AssemblyName System.IO.Compression.FileSystem
$zip = [System.IO.Compression.ZipFile]::OpenRead($pptx)
try {
  $reader = New-Object System.IO.StreamReader($zip.GetEntry('ppt/presentation.xml').Open())
  $xml = $reader.ReadToEnd(); $reader.Close()
} finally { $zip.Dispose() }
$embedded = [regex]::Matches($xml, '<p:embeddedFont><p:font typeface="([^"]+)"') | ForEach-Object { $_.Groups[1].Value }
Write-Output "embedded fonts: $($embedded -join ', ')"
$missing = @('Inter', 'Inter Medium') | Where-Object { $embedded -notcontains $_ }
if ($missing) { throw "Not embedded: $($missing -join ', '). Install ../fonts/*.ttf and rerun." }

New-Item -ItemType Directory -Force (Split-Path $stamp) | Out-Null
(Get-FileHash $pptx -Algorithm SHA256).Hash | Set-Content $stamp
Write-Output "wrote $pptx"
Write-Output "wrote $pdf"
