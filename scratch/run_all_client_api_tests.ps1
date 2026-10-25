<#
.SYNOPSIS
    Bo dieu khien thuc thi toan dien (Master Runner) cho cac kich ban kiem thu API Client & Trai nghiem Nguoi dung CyberNet.
.DESCRIPTION
    Tap hop va dieu phoi thuc thi 4 kich ban kiem thu API trong yeu:
    1. verify_order_fnb_flow.ps1: Chu trinh Dat mon F&B, Snapshot gia, Tu dong cong gio PLAYTIME.
    2. verify_transfer_session_tariff.ps1: Nghiep vu Doi may tram da phan khu & Quy doi Bieu phi dong.
    3. verify_floormap_client_data_contract.ps1: Hop dong du lieu So do may (Floor Map) & Bo dem Realtime.
    4. verify_customer_session_auth_lifecycle.ps1: Vong doi phien choi khach, F5 recovery & Thu hoi token.
#>

param(
    [ValidateSet('ALL', 'FNB', 'TRANSFER', 'FLOORMAP', 'AUTH')]
    [string]$Target = 'ALL'
)

$scriptDir = $PSScriptRoot
$tests = @(
    @{ Key = 'FNB'; Name = 'Chu trinh Dat mon F&B, Snapshot gia & Mon PLAYTIME'; Script = "$scriptDir\verify_order_fnb_flow.ps1" }
    @{ Key = 'TRANSFER'; Name = 'Doi may tram da phan khu & Bieu phi dong (Dynamic Tariff)'; Script = "$scriptDir\verify_transfer_session_tariff.ps1" }
    @{ Key = 'FLOORMAP'; Name = 'Hop dong du lieu So do may & Quick Stats Counters'; Script = "$scriptDir\verify_floormap_client_data_contract.ps1" }
    @{ Key = 'AUTH'; Name = 'Vong doi Phien choi Khach, F5 Recovery & Thu hoi Token'; Script = "$scriptDir\verify_customer_session_auth_lifecycle.ps1" }
)

Write-Host "================================================================================" -ForegroundColor Cyan
Write-Host "   CYBERNET CLIENT API & USER EXPERIENCE TEST SUITE RUNNER                      " -ForegroundColor Cyan
Write-Host "================================================================================" -ForegroundColor Cyan

$results = @()

foreach ($t in $tests) {
    if ($Target -ne 'ALL' -and $t.Key -ne $Target) {
        continue
    }

    Write-Host "`n>>> Dang thuc thi kich ban: $($t.Name)..." -ForegroundColor Yellow
    $startTime = Get-Date

    try {
        & powershell.exe -ExecutionPolicy Bypass -File $t.Script
        $exitCode = $LASTEXITCODE
    } catch {
        $exitCode = 1
    }

    $elapsed = ((Get-Date) - $startTime).TotalSeconds

    if ($exitCode -eq 0) {
        $status = "PASS"
        Write-Host "`n[KET QUA: PASS] $($t.Name) ($([Math]::Round($elapsed, 2))s)" -ForegroundColor Green
    } else {
        $status = "FAIL"
        Write-Host "`n[KET QUA: FAIL] $($t.Name) ($([Math]::Round($elapsed, 2))s)" -ForegroundColor Red
    }

    $results += [PSCustomObject]@{
        TestName = $t.Name
        Status = $status
        Duration = "$([Math]::Round($elapsed, 2))s"
    }
}

Write-Host "`n================================================================================" -ForegroundColor Cyan
Write-Host "                           BANG TONG HOP KIEM THU                               " -ForegroundColor Cyan
Write-Host "================================================================================" -ForegroundColor Cyan
$results | Format-Table -AutoSize | Out-String | Write-Host

$allPass = ($results | Where-Object { $_.Status -ne 'PASS' }).Count -eq 0
if ($allPass) {
    Write-Host ">>> TAT CA CAC KICH BAN DEU DAT CHUAN 100% (READY FOR ACCEPTANCE) <<<" -ForegroundColor Green
} else {
    Write-Host ">>> CO KICH BAN CHUA DAT! VUI LONG KIEM TRA LAI CHI TIET LOG O TREN <<<" -ForegroundColor Red
}
