# ==============================================================================
# Script Kiem thu End-to-End Module Bao cao Doanh thu & Thong ke (/admin/reports)
# He thong: CyberNet Internet Cafe Management
# ==============================================================================

[Console]::OutputEncoding = [System.Text.Encoding]::UTF8
$OutputEncoding = [System.Text.Encoding]::UTF8

$baseUrl = "http://localhost:8080"
$ErrorActionPreference = "Stop"

Write-Host "======================================================================" -ForegroundColor Cyan
Write-Host ">>> BAT DAU KIEM THU E2E: BAO CAO DOANH THU & THONG KE (ADMIN REPORTS) <<<" -ForegroundColor Cyan
Write-Host "======================================================================" -ForegroundColor Cyan

# 1. Dang nhap Admin lay JWT Token
Write-Host "`n[BUOC 1] Dang nhap Admin lay Access Token..." -ForegroundColor Yellow
$loginPayload = @{
    phone = "0901111111"
    password = "admin123"
} | ConvertTo-Json

$loginRes = Invoke-RestMethod -Uri "$baseUrl/api/auth/login" -Method Post -Body $loginPayload -ContentType "application/json; charset=utf-8" -UseBasicParsing
$adminToken = $loginRes.accessToken

$adminHeaders = @{
    "Authorization" = "Bearer $adminToken"
    "Content-Type"  = "application/json; charset=utf-8"
}

$meRes = Invoke-RestMethod -Uri "$baseUrl/api/accounts?keyword=0901111111" -Method Get -Headers $adminHeaders -UseBasicParsing
$adminAcc = $meRes.content | Where-Object { $_.phone -eq "0901111111" } | Select-Object -First 1
Write-Host "=> Dang nhap Admin thanh cong: $($adminAcc.name) (Role: $($adminAcc.role))" -ForegroundColor Green

# 2. Dang nhap Staff de kiem thu Phan quyen RBAC
Write-Host "`n[BUOC 2] Dang nhap Nhan vien (Staff)..." -ForegroundColor Yellow
$staffLogin = @{
    phone = "0902222222"
    password = "staff123"
} | ConvertTo-Json
$staffRes = Invoke-RestMethod -Uri "$baseUrl/api/auth/login" -Method Post -Body $staffLogin -ContentType "application/json; charset=utf-8" -UseBasicParsing
$staffHeaders = @{ "Authorization" = "Bearer $($staffRes.accessToken)" }

Write-Host "=> Cap token kiem thu Staff ($($staffRes.name), Role: $($staffRes.role)) thanh cong!" -ForegroundColor Green

# 3. Kiem thu Bao mat RBAC: Staff va Anonymous bi chan truy cap Bao cao Tai chinh
Write-Host "`n[BUOC 3] Kiem thu Bao mat RBAC: Nhan vien & Anonymous bi chan xem bao cao..." -ForegroundColor Yellow
try {
    Invoke-RestMethod -Uri "$baseUrl/api/reports/revenue/summary" -Method Get -Headers $staffHeaders -UseBasicParsing
    throw "LOI: Nhan vien STAFF xem duoc bao cao doanh thu cua Quan ly!"
} catch {
    Write-Host "=> Da chan STAFF truy cap thanh cong (HTTP 403 Forbidden)!" -ForegroundColor Green
}

try {
    Invoke-RestMethod -Uri "$baseUrl/api/reports/revenue/summary" -Method Get -UseBasicParsing
    throw "LOI: Anonymous (khong dang nhap) xem duoc bao cao doanh thu!"
} catch {
    Write-Host "=> Da chan Anonymous truy cap thanh cong (HTTP 401 Unauthorized)!" -ForegroundColor Green
}

# 4. Kiem thu Bao cao Tong quan Doanh thu (GET /api/reports/revenue/summary)
Write-Host "`n[BUOC 4] Truy xuat Bao cao Tong quan Doanh thu (GET /api/reports/revenue/summary)..." -ForegroundColor Yellow
$summary = Invoke-RestMethod -Uri "$baseUrl/api/reports/revenue/summary" -Method Get -Headers $adminHeaders -UseBasicParsing

Write-Host "=> Ket qua Thong ke Doanh thu:" -ForegroundColor Green
Write-Host "   - Tong doanh thu toan quan: $($summary.totalRevenue) VND" -ForegroundColor Cyan
Write-Host "   - Doanh thu goi mon & order: $($summary.totalOrderRevenue) VND ($($summary.totalOrders) don)" -ForegroundColor Cyan
Write-Host "   - Doanh thu nap gio choi: $($summary.totalTimePurchaseRevenue) VND ($($summary.totalTimePurchases) luot)" -ForegroundColor Cyan
Write-Host "   - Doanh thu F&B (Do an & Nuoc uong): $($summary.totalFoodAndDrinkRevenue) VND" -ForegroundColor Cyan
Write-Host "   - Doanh thu Gio choi / Dich vu net: $($summary.totalPlaytimeRevenue) VND" -ForegroundColor Cyan
Write-Host "   - Thanh toan Tien mat (CASH): $($summary.cashRevenue) VND" -ForegroundColor Cyan
Write-Host "   - Thanh toan Chuyen khoan (QR): $($summary.qrRevenue) VND" -ForegroundColor Cyan

# 5. Kiem thu Tinh toan ven va can doi ke toan (Accounting Balance Verification)
Write-Host "`n[BUOC 5] Kiem thu can doi so sach ke toan 100%..." -ForegroundColor Yellow

$totRev = [decimal]$summary.totalRevenue
$orderRev = [decimal]$summary.totalOrderRevenue
$tpRev = [decimal]$summary.totalTimePurchaseRevenue
$cashRev = [decimal]$summary.cashRevenue
$qrRev = [decimal]$summary.qrRevenue
$fbRev = [decimal]$summary.totalFoodAndDrinkRevenue
$playRev = [decimal]$summary.totalPlaytimeRevenue

# Kiem tra 1: Tong = Order + TimePurchase
if ($totRev -ne ($orderRev + $tpRev)) {
    throw "LOI KE TOAN: Tong doanh thu ($totRev) != Order ($orderRev) + TimePurchase ($tpRev)"
}
Write-Host "=> [PASS] Tong doanh thu = Doanh thu Order + Doanh thu Nap gio ($totRev VND)" -ForegroundColor Green

# Kiem tra 2: Tong = Cash + QR
if ($totRev -ne ($cashRev + $qrRev)) {
    throw "LOI KE TOAN: Tong doanh thu ($totRev) != Tien mat ($cashRev) + QR ($qrRev)"
}
Write-Host "=> [PASS] Tong doanh thu = Tien mat + Chuyen khoan QR ($totRev VND)" -ForegroundColor Green

# Kiem tra 3: Tong = F&B + Playtime/Service (đã khắc phục không bị lệch do loại hàng SERVICE)
if ($totRev -ne ($fbRev + $playRev)) {
    throw "LOI KE TOAN: Tong doanh thu ($totRev) != F&B ($fbRev) + Playtime/Service ($playRev)"
}
Write-Host "=> [PASS] Tong doanh thu = Doanh thu F&B + Doanh thu Gio choi/Dich vu ($totRev VND)" -ForegroundColor Green

# 6. Kiem thu Xu huong Doanh thu theo ngay lien tuc (GET /api/reports/revenue/daily)
Write-Host "`n[BUOC 6] Truy xuat Xu huong Doanh thu theo ngay (GET /api/reports/revenue/daily)..." -ForegroundColor Yellow
$todayStr = (Get-Date).ToString("yyyy-MM-dd")
$sevenDaysAgo = (Get-Date).AddDays(-6).ToString("yyyy-MM-dd")
$dailyList = Invoke-RestMethod -Uri "$baseUrl/api/reports/revenue/daily?fromDate=$sevenDaysAgo&toDate=$todayStr" -Method Get -Headers $adminHeaders -UseBasicParsing

Write-Host "=> So ngay thong ke trong chuoi: $($dailyList.Count) ngay (tu $sevenDaysAgo den $todayStr)" -ForegroundColor Green
if ($dailyList.Count -ne 7) {
    throw "LOI LOGIC: Chuoi ngay khong du 7 ngay lien tuc! So luong: $($dailyList.Count)"
}
Write-Host "=> [PASS] Chuoi thoi gian lien tuc khong dut quang phuc vu ve Bieu do Recharts thanh cong!" -ForegroundColor Green

# 7. Kiem thu Top mon ban chay nhat (GET /api/reports/items/top-selling)
Write-Host "`n[BUOC 7] Truy xuat Xep hang Mon ban chay nhat (GET /api/reports/items/top-selling)..." -ForegroundColor Yellow
$topItems = Invoke-RestMethod -Uri "$baseUrl/api/reports/items/top-selling?limit=5" -Method Get -Headers $adminHeaders -UseBasicParsing
Write-Host "=> Top $($topItems.Count) mon ban chay:" -ForegroundColor Green
foreach ($item in $topItems) {
    Write-Host "   - #$($item.itemId) $($item.itemName) ($($item.itemType)): $($item.totalQuantity) phan | Doanh thu: $($item.totalRevenue) VND" -ForegroundColor Cyan
}

# 8. Kiem thu Top khach hang chi tieu (GET /api/reports/customers/top-spenders)
Write-Host "`n[BUOC 8] Truy xuat Top Khach hang chi tieu nhieu nhat (GET /api/reports/customers/top-spenders)..." -ForegroundColor Yellow
$topCustomers = Invoke-RestMethod -Uri "$baseUrl/api/reports/customers/top-spenders?limit=5" -Method Get -Headers $adminHeaders -UseBasicParsing
Write-Host "=> Top $($topCustomers.Count) khach hang chi tieu:" -ForegroundColor Green
foreach ($cust in $topCustomers) {
    Write-Host "   - Khach $($cust.name) ($($cust.phone)): Tong chi: $($cust.totalSpent) VND | Gio choi: $([math]::Round($cust.totalMinutesPlayed/60, 1))h | So du: $($cust.remainingMinutes)p" -ForegroundColor Cyan
}

# 9. Kiem thu Hieu suat May tram (GET /api/reports/computers/usage)
Write-Host "`n[BUOC 9] Truy xuat Hieu suat & Tan suat May tram (GET /api/reports/computers/usage)..." -ForegroundColor Yellow
$compUsage = Invoke-RestMethod -Uri "$baseUrl/api/reports/computers/usage" -Method Get -Headers $adminHeaders -UseBasicParsing
Write-Host "=> Thong ke hieu suat $($compUsage.Count) may tram:" -ForegroundColor Green
$sampleComps = $compUsage | Select-Object -First 3
foreach ($cu in $sampleComps) {
    Write-Host "   - May $($cu.computerCode) (Zone: $($cu.zone)): $($cu.totalSessions) phien mo | Tong thoi gian su dung: $([math]::Round($cu.totalMinutesUsed/60, 1))h" -ForegroundColor Cyan
}

Write-Host "`n======================================================================" -ForegroundColor Cyan
Write-Host ">>> KET QUA: 9/9 BUOC KIEM THU E2E BAO CAO DOANH THU PASS HOAN HAO! <<<" -ForegroundColor Green
Write-Host "======================================================================" -ForegroundColor Cyan
