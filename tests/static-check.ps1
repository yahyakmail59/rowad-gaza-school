param(
  [string]$ProjectRoot = (Split-Path -Parent $PSScriptRoot)
)

$ErrorActionPreference = 'Stop'
$failures = [System.Collections.Generic.List[string]]::new()

function Assert-True {
  param([bool]$Condition, [string]$Message)
  if (-not $Condition) { $failures.Add($Message) }
}

$indexPath = Join-Path $ProjectRoot 'index.html'
$cssPath = Join-Path $ProjectRoot 'assets\styles.css'
$jsPath = Join-Path $ProjectRoot 'src\app.js'
$progressPath = Join-Path $ProjectRoot 'PROJECT_PROGRESS.md'
$fontDir = Join-Path $ProjectRoot 'assets\fonts\amiri'
$logoPath = Join-Path $ProjectRoot 'assets\images\ruwad-gaza-school-logo.jpg'
$pythonAnywhereConfigPath = Join-Path $ProjectRoot 'deployment\pythonanywhere.json'
$deploymentGuidePath = Join-Path $ProjectRoot 'PYTHONANYWHERE_DEPLOYMENT.md'
$workflowGuidePath = Join-Path $ProjectRoot 'USER_WORKFLOWS.md'
$functionalAuditPath = Join-Path $ProjectRoot 'FUNCTIONAL_AUDIT.md'

Assert-True (Test-Path $indexPath) 'index.html is missing.'
Assert-True (Test-Path $cssPath) 'assets/styles.css is missing.'
Assert-True (Test-Path $jsPath) 'src/app.js is missing.'
Assert-True (Test-Path $progressPath) 'PROJECT_PROGRESS.md is missing.'
Assert-True (Test-Path $logoPath) 'Ruwad Gaza school logo is missing.'
Assert-True (Test-Path $pythonAnywhereConfigPath) 'PythonAnywhere deployment config is missing.'
Assert-True (Test-Path $deploymentGuidePath) 'Deployment guide is missing.'
Assert-True (Test-Path $workflowGuidePath) 'User workflow guide is missing.'
Assert-True (Test-Path $functionalAuditPath) 'Functional audit report is missing.'
Assert-True (Test-Path (Join-Path $fontDir 'Amiri-Regular.ttf')) 'Amiri regular font is missing.'
Assert-True (Test-Path (Join-Path $fontDir 'Amiri-Bold.ttf')) 'Amiri bold font is missing.'
Assert-True (Test-Path (Join-Path $fontDir 'Amiri-Italic.ttf')) 'Amiri italic font is missing.'
Assert-True (Test-Path (Join-Path $fontDir 'Amiri-BoldItalic.ttf')) 'Amiri bold italic font is missing.'
Assert-True (Test-Path (Join-Path $fontDir 'OFL.txt')) 'Amiri font license is missing.'

if ($failures.Count -eq 0) {
  $html = Get-Content -Raw -Encoding UTF8 $indexPath
  $css = Get-Content -Raw -Encoding UTF8 $cssPath
  $js = Get-Content -Raw -Encoding UTF8 $jsPath

  Assert-True ($html.Contains('dir="rtl"')) 'HTML must use RTL.'
  Assert-True ($html.Contains('src/app.js')) 'Application script is not linked.'
  Assert-True ($html.Contains('assets/styles.css')) 'Stylesheet is not linked.'
  Assert-True ($html.Contains('assets/images/ruwad-gaza-school-logo.jpg')) 'School logo is not linked in HTML.'
  Assert-True ($css.Contains('font-family: "Amiri"')) 'Amiri font face is not declared.'
  Assert-True ($css.Contains('--font: "Amiri"')) 'Amiri is not the primary application font.'
  Assert-True ($css.Contains('--text-xs: 14px')) 'Minimum typography token must remain at least 14px.'
  Assert-True ($css.Contains('--text-md: 18px')) 'Base typography token must remain 18px.'
  Assert-True (-not ($css -match 'font-size:\s*(8|9|10|11|12)px')) 'Unreadably small fixed font size detected.'
  Assert-True (-not ($html + $css + $js -match 'https?://')) 'External HTTP dependency detected.'
  Assert-True (-not ($html + $js -match 'onclick=')) 'Inline onclick handler detected.'
  Assert-True ($js.Contains("const DB_NAME = 'AlSalamSchoolDB'")) 'IndexedDB name is incorrect or missing.'
  Assert-True ($js.Contains("const APP_VERSION = '1.5.0'")) 'Application version is incorrect.'
  Assert-True ($js.Contains('PBKDF2')) 'PBKDF2 password derivation is missing.'
  Assert-True ($js.Contains('stableStringify')) 'Canonical backup checksum support is missing.'
  Assert-True ($js.Contains('getScopedStudentIds')) 'Role-scoped student access is missing.'
  Assert-True ($js.Contains('renderAttendance')) 'Attendance module is missing.'
  Assert-True ($js.Contains('renderGrades')) 'Grading module is missing.'
  Assert-True ($js.Contains('renderFinance')) 'Finance module is missing.'
  Assert-True ($js.Contains('const SCHOOL_NAME =')) 'School identity constant is missing.'
  Assert-True ($js.Contains('certificate-logo')) 'School logo is not included in certificates.'
  Assert-True ($js.Contains('BRAND_IDENTITY_UPDATED')) 'Brand migration support is missing.'
  Assert-True ($js.Contains('applySchoolBrand')) 'Dynamic school branding is missing.'
  Assert-True ($js.Contains('prepareSchoolLogo')) 'Custom school logo upload is missing.'
  Assert-True ($js.Contains('SCHOOL_PROFILE_UPDATED')) 'School profile audit support is missing.'
  Assert-True ($js.Contains('certificatePrefix')) 'Configurable certificate numbering prefix is missing.'
  Assert-True ($html.Contains('data-school-logo')) 'Dynamic school logo targets are missing.'
  Assert-True ($js.Contains('openTeachingAssignmentForm')) 'Teaching assignment management is missing.'
  Assert-True ($js.Contains('openGuardianForm')) 'Guardian management is missing.'
  Assert-True ($js.Contains('createLinkedUser')) 'Linked account creation is missing.'
  Assert-True ($js.Contains('openPasswordReset')) 'Password reset support is missing.'
  Assert-True ($js.Contains("route: 'guardians'")) 'Guardian route is missing.'
  Assert-True ($js.Contains('name="assignmentId"')) 'Timetable must be created from a teaching assignment.'
  Assert-True ($js.Contains('occupiedSeats >= Number(targetSection.capacity')) 'Section capacity validation is missing.'
  Assert-True (-not ($js -match 'font-size:\s*(8|9|10|11|12)px')) 'Unreadably small inline font size detected in application JavaScript.'

  $pythonAnywhereConfig = Get-Content -LiteralPath $pythonAnywhereConfigPath -Raw -Encoding UTF8 | ConvertFrom-Json
  Assert-True ($pythonAnywhereConfig.username -eq 'RowadGaza') 'PythonAnywhere username is incorrect.'
  Assert-True ($pythonAnywhereConfig.domain -eq 'RowadGaza.pythonanywhere.com') 'PythonAnywhere domain is incorrect.'
  Assert-True ($pythonAnywhereConfig.staticFilesMapping.url -eq '/') 'PythonAnywhere static URL mapping is incorrect.'
  Assert-True ($pythonAnywhereConfig.staticFilesMapping.path -eq '/home/RowadGaza/rowad-gaza-school') 'PythonAnywhere static path is incorrect.'

  $ids = [regex]::Matches($html, 'id="([^"]+)"') | ForEach-Object { $_.Groups[1].Value }
  $duplicateIds = $ids | Group-Object | Where-Object Count -gt 1
  Assert-True ($duplicateIds.Count -eq 0) "Duplicate HTML ids: $($duplicateIds.Name -join ', ')"
}

if ($failures.Count -gt 0) {
  Write-Host 'STATIC CHECK FAILED' -ForegroundColor Red
  $failures | ForEach-Object { Write-Host "- $_" -ForegroundColor Red }
  exit 1
}

Write-Host 'STATIC CHECK PASSED' -ForegroundColor Green
Write-Host 'Verified: files, RTL, local dependencies, ids, security primitives, core modules.'
