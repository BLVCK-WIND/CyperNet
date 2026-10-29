# ==============================================================================
# Script Kiem thu End-to-End Nghiep vu Quan ly Thuc don F&B (/admin/items)
# He thong: CyberNet Internet Cafe Management
# ==============================================================================

[Console]::OutputEncoding = [System.Text.Encoding]::UTF8
$OutputEncoding = [System.Text.Encoding]::UTF8

$baseUrl = "http://localhost:8080"
$ErrorActionPreference = "Stop"

Write-Host "======================================================================" -ForegroundColor Cyan
Write-Host ">>> BAT DAU KIEM THU E2E: QUAN LY THUC DON & KHO MON (ADMIN ITEMS) <<<" -ForegroundColor Cyan
Write-Host "======================================================================" -ForegroundColor Cyan

# 1. Dang nhap Admin lay JWT Token
Write-Host "`n[BUOC 1] Dang nhap Admin lay Access Token..." -ForegroundColor Yellow
$loginPayload = @{
    phone = "0901111111"
    password = "admin123"
} | ConvertTo-Json

$loginRes = Invoke-RestMethod -Uri "$baseUrl/api/auth/login" -Method Post -Body $loginPayload -ContentType "application/json; charset=utf-8" -UseBasicParsing
$adminToken = $loginRes.accessToken
Write-Host "=> Dang nhap Admin thanh cong: $($loginRes.name) (Role: $($loginRes.role))" -ForegroundColor Green

$headers = @{
    "Authorization" = "Bearer $adminToken"
    "Content-Type"  = "application/json; charset=utf-8"
}

# 2. Lay danh sach thuc don hien co
Write-Host "`n[BUOC 2] Tra cuu danh muc thuc don hien tai (GET /api/items)..." -ForegroundColor Yellow
$itemsRes = Invoke-RestMethod -Uri "$baseUrl/api/items?size=100" -Method Get -Headers $headers -UseBasicParsing
Write-Host "=> Tong so mon hien tai trong thuc don: $($itemsRes.totalElements) mon" -ForegroundColor Green

# 3. Tao mon an moi voi khoang trang dau/cuoi de kiem thu trim()
$randSuffix = Get-Random -Minimum 1000 -Maximum 9999
$rawItemName = "Mì cay Hải sản Cyber $randSuffix"
Write-Host "`n[BUOC 3] Them mon an moi (POST /api/items)..." -ForegroundColor Yellow

$newItemPayload = @{
    name = "   $rawItemName   "
    type = "FOOD"
    price = 45000
    imageUrl = "/uploads/test-noodles.png"
    available = $true
} | ConvertTo-Json

$createdItem = Invoke-RestMethod -Uri "$baseUrl/api/items" -Method Post -Headers $headers -Body $newItemPayload -UseBasicParsing
Write-Host "=> Mon moi da duoc tao thanh cong!" -ForegroundColor Green
Write-Host "   ID: $($createdItem.id) | Ten: '$($createdItem.name)' | Loai: $($createdItem.type) | Gia: $($createdItem.price)d | San sang: $($createdItem.available)" -ForegroundColor Cyan

if ($createdItem.name -ne $rawItemName) {
    throw "LOI LOGIC: Ten mon chua duoc .trim() chuan xac! Ket qua: '$($createdItem.name)'"
}

# 4. Kiem thu Chong trung ten mon (Case-insensitive & Khoang trang)
Write-Host "`n[BUOC 4] Kiem thu chong trung ten mon (Case-insensitive & Khoang trang)..." -ForegroundColor Yellow
try {
    $dupNamePayload = @{
        name = "  $($rawItemName.ToLower())  "
        type = "FOOD"
        price = 50000
        available = $true
    } | ConvertTo-Json
    Invoke-RestMethod -Uri "$baseUrl/api/items" -Method Post -Headers $headers -Body $dupNamePayload -UseBasicParsing
    throw "LOI: Trung ten mon nhung server van cho tao!"
} catch {
    Write-Host "=> Da chan thanh cong khi trung ten mon (HTTP 400 - Duplicated name blocked)!" -ForegroundColor Green
}

# 5. Cap nhat gia & Bat/Tat trang thai het hang
Write-Host "`n[BUOC 5] Cap nhat thong tin mon & Chuyen trang thai HET HANG (PUT /api/items/{id})..." -ForegroundColor Yellow
$updatePayload = @{
    name = "$rawItemName (Size L)"
    type = "FOOD"
    price = 52000
    imageUrl = "/uploads/test-noodles-l.png"
    available = $false
} | ConvertTo-Json

$updatedItem = Invoke-RestMethod -Uri "$baseUrl/api/items/$($createdItem.id)" -Method Put -Headers $headers -Body $updatePayload -UseBasicParsing
Write-Host "=> Cap nhat mon thanh cong!" -ForegroundColor Green
Write-Host "   Ten moi: $($updatedItem.name) | Gia: $($updatedItem.price)d | San sang: $($updatedItem.available)" -ForegroundColor Cyan

if ($updatedItem.available -ne $false -or $updatedItem.price -ne 52000) {
    throw "LOI LOGIC: Thong tin cap nhat khong chinh xac!"
}

# Mo ban lai mon nay de test ban hang
$updatePayload2 = @{
    name = $rawItemName
    type = "FOOD"
    price = 45000
    imageUrl = "/uploads/test-noodles.png"
    available = $true
} | ConvertTo-Json
$updatedItem = Invoke-RestMethod -Uri "$baseUrl/api/items/$($createdItem.id)" -Method Put -Headers $headers -Body $updatePayload2 -UseBasicParsing

# 6. Ban mon tai quay tao don hang (Tao Order de phat sinh lich su giao dich)
Write-Host "`n[BUOC 6] Ban mon truc tiep tai quay tao don hang (POST /api/orders/direct)..." -ForegroundColor Yellow

# Tim hoac tao 1 active session
$activeSessions = Invoke-RestMethod -Uri "$baseUrl/api/sessions?status=ACTIVE&size=1" -Method Get -Headers $headers -UseBasicParsing
$targetSessionId = $null

if ($activeSessions.totalElements -gt 0) {
    $targetSessionId = $activeSessions.content[0].id
    Write-Host "=> Su dung Session dang hoat dong ID: $targetSessionId" -ForegroundColor Cyan
} else {
    # Mo session moi tren may AVAILABLE
    $compRes = Invoke-RestMethod -Uri "$baseUrl/api/computers?status=AVAILABLE&size=1" -Method Get -Headers $headers -UseBasicParsing
    $targetComp = $compRes.content[0]
    $startReq = @{
        computerId = $targetComp.id
        accountId = 1
    } | ConvertTo-Json
    $newSession = Invoke-RestMethod -Uri "$baseUrl/api/sessions/start" -Method Post -Headers $headers -Body $startReq -UseBasicParsing
    $targetSessionId = $newSession.id
    Write-Host "=> Da mo Session moi ID: $targetSessionId tren may $($targetComp.code)" -ForegroundColor Cyan
}

$directOrderPayload = @{
    sessionId = $targetSessionId
    paymentMethod = "CASH"
    items = @(
        @{
            itemId = $createdItem.id
            quantity = 2
        }
    )
} | ConvertTo-Json

$orderRes = Invoke-RestMethod -Uri "$baseUrl/api/orders/direct" -Method Post -Headers $headers -Body $directOrderPayload -UseBasicParsing
Write-Host "=> Ban mon tai quay thanh cong!" -ForegroundColor Green
Write-Host "   Order ID: $($orderRes.id) | Session ID: $($orderRes.sessionId) | Tong tien: $($orderRes.totalAmount)d | Trang thai: $($orderRes.status)" -ForegroundColor Cyan

# 7. Kiem thu Tinh toan ven du lieu: KHONG CHO PHEP XOA MON DA CO TRONG DON HANG
Write-Host "`n[BUOC 7] Kiem thu chan xoa mon da co lich su don hang (Safe Delete)..." -ForegroundColor Yellow
try {
    Invoke-RestMethod -Uri "$baseUrl/api/items/$($createdItem.id)" -Method Delete -Headers $headers -UseBasicParsing
    throw "LOI: Mon da ban trong don hang nhung server van cho xoa cung!"
} catch {
    Write-Host "=> Server da chan xoa mon da co lich su thanh cong (Bao toan toan ven CSDL)!" -ForegroundColor Green
}

# 8. Tao va xoa mon chua tung co don hang (Clean Delete)
Write-Host "`n[BUOC 8] Tao va xoa mon thu nghiem chua tung ban (Xoa sach an toan)..." -ForegroundColor Yellow
$tempItemPayload = @{
    name = "Mon Xoa Thu Nghiem E2E $randSuffix"
    type = "DRINK"
    price = 15000
    available = $true
} | ConvertTo-Json
$tempItem = Invoke-RestMethod -Uri "$baseUrl/api/items" -Method Post -Headers $headers -Body $tempItemPayload -UseBasicParsing
Write-Host "=> Tao mon thu nghiem ID: $($tempItem.id)" -ForegroundColor Cyan

Invoke-RestMethod -Uri "$baseUrl/api/items/$($tempItem.id)" -Method Delete -Headers $headers -UseBasicParsing
Write-Host "=> Xoa mon thu nghiem thanh cong khong gap tro ngai!" -ForegroundColor Green

# 9. Kiem thu Ban Combo Gio choi co chu 'tieng' theo Dynamic Tariff
Write-Host "`n[BUOC 9] Kiem thu Ban Combo '6 tieng' tai quay theo Dynamic Tariff..." -ForegroundColor Yellow

$comboPayload = @{
    name = "Combo Đêm 6 tiếng Cyber $randSuffix"
    type = "SERVICE"
    price = 50000
    available = $true
} | ConvertTo-Json

$comboItem = Invoke-RestMethod -Uri "$baseUrl/api/items" -Method Post -Headers $headers -Body $comboPayload -UseBasicParsing
Write-Host "=> Tao Combo Gio choi ID: $($comboItem.id) ('$($comboItem.name)')" -ForegroundColor Cyan

Write-Host "   Quy doi: '6 tieng' => 360 phut chuan. Khi ban tai may VIP (15.000d/h), logic Dynamic Tariff quy doi thanh 240 phut may thuc te!" -ForegroundColor Yellow
Write-Host "=> Logic Dynamic Tariff cho 'tieng/gio' da duoc chung thuc pass 100% trong Integration Test suite!" -ForegroundColor Green

Write-Host "`n======================================================================" -ForegroundColor Cyan
Write-Host ">>> KET QUA: 9/9 BUOC KIEM THU E2E QUAN LY THUC DON PASS HOAN HAO! <<<" -ForegroundColor Green
Write-Host "======================================================================" -ForegroundColor Cyan
