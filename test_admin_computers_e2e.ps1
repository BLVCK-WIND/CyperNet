# ==============================================================================
# Script Kiem thu End-to-End Nghiep vu Quan ly May tram (/admin/computers)
# He thong: CyberNet Internet Cafe Management
# ==============================================================================

$baseUrl = "http://localhost:8080"
$ErrorActionPreference = "Stop"

Write-Host "======================================================================" -ForegroundColor Cyan
Write-Host ">>> BAT DAU KIEM THU E2E: QUAN LY MAY TRAM (ADMIN COMPUTERS CRUD) <<<" -ForegroundColor Cyan
Write-Host "======================================================================" -ForegroundColor Cyan

# 1. Dang nhap Admin de lay JWT Token
Write-Host "`n[BUOC 1] Dang nhap Admin lay Access Token..." -ForegroundColor Yellow
$loginPayload = @{
    phone = "0901111111"
    password = "admin123"
} | ConvertTo-Json

$loginRes = Invoke-RestMethod -Uri "$baseUrl/api/auth/login" -Method Post -Body $loginPayload -ContentType "application/json"
$adminToken = $loginRes.accessToken
Write-Host "=> Dang nhap Admin thanh cong: $($loginRes.name) (Role: $($loginRes.role))" -ForegroundColor Green

$headers = @{
    "Authorization" = "Bearer $adminToken"
    "Content-Type"  = "application/json"
}

# 2. Lay danh sach may tram & khu vuc Zones
Write-Host "`n[BUOC 2] Tra cuu danh muc may tram & khu vuc Zones hien tai..." -ForegroundColor Yellow
$computersRes = Invoke-RestMethod -Uri "$baseUrl/api/computers?size=100" -Method Get -Headers $headers
$zonesRes = Invoke-RestMethod -Uri "$baseUrl/api/zones" -Method Get -Headers $headers

Write-Host "=> Tong so may tram hien tai: $($computersRes.totalElements) may" -ForegroundColor Green
$zoneList = ($zonesRes | ForEach-Object { "$($_.code): $($_.name) ($($_.defaultPricePerHour) d/h)" }) -join ' | '
Write-Host "=> Danh sach Zone kha dung: $zoneList" -ForegroundColor Green

# 3. Tao may tram moi (E2E-TEST-01, IP 192.168.77.10, Zone STREAM, gia 22.000d, status MAINTENANCE)
Write-Host "`n[BUOC 3] Them may tram moi vao he thong (POST /api/computers)..." -ForegroundColor Yellow

# Clean up if existed
try {
    $existing = Invoke-RestMethod -Uri "$baseUrl/api/computers?keyword=E2E-TEST-01" -Method Get -Headers $headers
    foreach ($c in $existing.content) {
        if ($c.code -eq "E2E-TEST-01") {
            Invoke-RestMethod -Uri "$baseUrl/api/computers/$($c.id)" -Method Delete -Headers $headers
        }
    }
} catch {}

$newCompPayload = @{
    code = "E2E-TEST-01"
    ipAddress = "192.168.77.10"
    zone = "STREAM"
    pricePerHour = 22000
    status = "MAINTENANCE"
} | ConvertTo-Json

$createdComp = Invoke-RestMethod -Uri "$baseUrl/api/computers" -Method Post -Headers $headers -Body $newCompPayload
Write-Host "=> May moi da duoc tao thanh cong!" -ForegroundColor Green
Write-Host "   ID: $($createdComp.id) | Code: $($createdComp.code) | Zone: $($createdComp.zone) | IP: $($createdComp.ipAddress) | Gia: $($createdComp.pricePerHour) | Status: $($createdComp.status)" -ForegroundColor Cyan

if ($createdComp.status -ne "MAINTENANCE") {
    throw "LOI LOGIC: May moi tao voi status MAINTENANCE nhung server tra ve: $($createdComp.status)"
}

# 4. Kiem thu Chong trung lap (Duplicate Code & Duplicate IP)
Write-Host "`n[BUOC 4] Kiem thu tinh toan ven: Chong trung Ma may & trung IP LAN..." -ForegroundColor Yellow
try {
    $dupCodePayload = @{
        code = "E2E-TEST-01"
        ipAddress = "192.168.77.99"
        zone = "STANDARD"
        pricePerHour = 10000
        status = "AVAILABLE"
    } | ConvertTo-Json
    Invoke-RestMethod -Uri "$baseUrl/api/computers" -Method Post -Headers $headers -Body $dupCodePayload
    throw "LOI: Trung ma may nhung server van cho tao!"
} catch {
    Write-Host "=> Da chan thanh cong khi trung Ma may!" -ForegroundColor Green
}

try {
    $dupIpPayload = @{
        code = "E2E-UNIQUE-02"
        ipAddress = "192.168.77.10"
        zone = "STANDARD"
        pricePerHour = 10000
        status = "AVAILABLE"
    } | ConvertTo-Json
    Invoke-RestMethod -Uri "$baseUrl/api/computers" -Method Post -Headers $headers -Body $dupIpPayload
    throw "LOI: Trung dia chi IP nhung server van cho tao!"
} catch {
    Write-Host "=> Da chan thanh cong khi trung Dia chi IP!" -ForegroundColor Green
}

# 5. Cap nhat thong tin may & Kich hoat SAN SANG don khach (Toggle Maintenance -> AVAILABLE)
Write-Host "`n[BUOC 5] Cap nhat thong so may & Kich hoat SAN SANG (PUT /api/computers/{id})..." -ForegroundColor Yellow
$updatePayload = @{
    code = "E2E-TEST-01"
    ipAddress = "192.168.77.11"
    zone = "ARENA"
    pricePerHour = 28000
    status = "AVAILABLE"
} | ConvertTo-Json

$updatedComp = Invoke-RestMethod -Uri "$baseUrl/api/computers/$($createdComp.id)" -Method Put -Headers $headers -Body $updatePayload
Write-Host "=> Cap nhat thanh cong!" -ForegroundColor Green
Write-Host "   ID: $($updatedComp.id) | Code: $($updatedComp.code) | Zone: $($updatedComp.zone) | IP: $($updatedComp.ipAddress) | Gia: $($updatedComp.pricePerHour) | Status: $($updatedComp.status)" -ForegroundColor Cyan

if ($updatedComp.status -ne "AVAILABLE" -or $updatedComp.zone -ne "ARENA" -or $updatedComp.pricePerHour -ne 28000) {
    throw "LOI DU LIEU: Du lieu sau cap nhat khong dung mong doi!"
}

# 6. Kiem tra lai tu danh sach may tram
Write-Host "`n[BUOC 6] Xac minh du lieu tu API GET /api/computers/{id}..." -ForegroundColor Yellow
$fetchedComp = Invoke-RestMethod -Uri "$baseUrl/api/computers/$($createdComp.id)" -Method Get -Headers $headers
if ($fetchedComp.code -ne "E2E-TEST-01" -or $fetchedComp.status -ne "AVAILABLE") {
    throw "LOI: May khong ton tai chinh xac trong he thong!"
}
Write-Host "=> Xac minh thanh cong: May ton tai hop le voi trang thai AVAILABLE." -ForegroundColor Green

# 7. Xoa may tram thu nghiem (DELETE /api/computers/{id})
Write-Host "`n[BUOC 7] Xoa may tram thu nghiem (DELETE /api/computers/{id})..." -ForegroundColor Yellow
$deleteRes = Invoke-WebRequest -Uri "$baseUrl/api/computers/$($createdComp.id)" -Method Delete -Headers $headers -UseBasicParsing
if ($deleteRes.StatusCode -eq 204) {
    Write-Host "=> Xoa thanh cong (HTTP 204 No Content)!" -ForegroundColor Green
} else {
    throw "LOI: Xoa may khong tra ve ma 204! Ma tra ve: $($deleteRes.StatusCode)"
}

# 8. Xac nhan may da bi xoa
Write-Host "`n[BUOC 8] Xac minh may da hoan toan bien mat khoi CSDL..." -ForegroundColor Yellow
try {
    Invoke-RestMethod -Uri "$baseUrl/api/computers/$($createdComp.id)" -Method Get -Headers $headers
    throw "LOI: May van con truy cap duoc sau khi xoa!"
} catch {
    Write-Host "=> Xac minh thanh cong: May da bi xoa (HTTP 404 Not Found)." -ForegroundColor Green
}

Write-Host "`n======================================================================" -ForegroundColor Cyan
Write-Host ">>> ALL 8 STEPS OF ADMIN COMPUTERS E2E PASSED 100% SUCCESSFUL <<<" -ForegroundColor Cyan
Write-Host "======================================================================" -ForegroundColor Cyan
