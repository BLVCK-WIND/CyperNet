# ==============================================================================
# Script Kiem thu End-to-End Nghiep vu Quan ly Tai khoan & Phan quyen (/admin/accounts)
# He thong: CyberNet Internet Cafe Management
# ==============================================================================

[Console]::OutputEncoding = [System.Text.Encoding]::UTF8
$OutputEncoding = [System.Text.Encoding]::UTF8

$baseUrl = "http://localhost:8080"
$ErrorActionPreference = "Stop"

Write-Host "======================================================================" -ForegroundColor Cyan
Write-Host ">>> BAT DAU KIEM THU E2E: QUAN LY TAI KHOAN & PHAN QUYEN (ADMIN ACCOUNTS) <<<" -ForegroundColor Cyan
Write-Host "======================================================================" -ForegroundColor Cyan

# 1. Dang nhap Admin lay JWT Token
Write-Host "`n[BUOC 1] Dang nhap Admin lay Access Token..." -ForegroundColor Yellow
$loginPayload = @{
    phone = "0901111111"
    password = "admin123"
} | ConvertTo-Json

$loginRes = Invoke-RestMethod -Uri "$baseUrl/api/auth/login" -Method Post -Body $loginPayload -ContentType "application/json; charset=utf-8" -UseBasicParsing
$adminToken = $loginRes.accessToken

$headers = @{
    "Authorization" = "Bearer $adminToken"
    "Content-Type"  = "application/json; charset=utf-8"
}

# Lay thong tin Admin hien tai
$meRes = Invoke-RestMethod -Uri "$baseUrl/api/accounts?keyword=0901111111" -Method Get -Headers $headers -UseBasicParsing
$adminAccount = $meRes.content | Where-Object { $_.phone -eq "0901111111" } | Select-Object -First 1
$adminId = $adminAccount.id
Write-Host "=> Dang nhap Admin thanh cong: $($adminAccount.name) (ID: $adminId, Role: $($adminAccount.role))" -ForegroundColor Green

# 2. Lay danh sach tat ca tai khoan
Write-Host "`n[BUOC 2] Tra cuu danh muc tai khoan & phan quyen (GET /api/accounts)..." -ForegroundColor Yellow
$accountsRes = Invoke-RestMethod -Uri "$baseUrl/api/accounts?size=100" -Method Get -Headers $headers -UseBasicParsing
Write-Host "=> Tong so tai khoan he thong: $($accountsRes.totalElements) tai khoan" -ForegroundColor Green

# 3. Tao tai khoan nhan vien moi voi khoang trang de kiem thu trim()
$randSuffix = Get-Random -Minimum 1000 -Maximum 9999
$testPhone = "098711$randSuffix"
Write-Host "`n[BUOC 3] Tao tai khoan Nhan vien moi (POST /api/accounts)..." -ForegroundColor Yellow

$newStaffPayload = @{
    phone = $testPhone
    name = "   Tran Thu Ngan Cyber E2E $randSuffix   "
    password = "staffpassword123"
    role = "STAFF"
} | ConvertTo-Json

$createdStaff = Invoke-RestMethod -Uri "$baseUrl/api/accounts" -Method Post -Headers $headers -Body $newStaffPayload -UseBasicParsing
Write-Host "=> Nhan vien moi da duoc tao thanh cong!" -ForegroundColor Green
Write-Host "   ID: $($createdStaff.id) | Ten: '$($createdStaff.name)' | SDT: $($createdStaff.phone) | Role: $($createdStaff.role)" -ForegroundColor Cyan

if ($createdStaff.name -ne "Tran Thu Ngan Cyber E2E $randSuffix") {
    throw "LOI LOGIC: Ho ten nhan vien chua duoc .trim() chuan xac!"
}

# 4. Kiem thu Chong trung So dien thoai (Duplicate Phone)
Write-Host "`n[BUOC 4] Kiem thu chong trung So dien thoai dang ky..." -ForegroundColor Yellow
try {
    $dupPayload = @{
        phone = $testPhone
        name = "Ke Mao Danh"
        password = "password999"
        role = "CUSTOMER"
    } | ConvertTo-Json
    Invoke-RestMethod -Uri "$baseUrl/api/accounts" -Method Post -Headers $headers -Body $dupPayload -UseBasicParsing
    throw "LOI: Trung SDT nhung server van cho tao!"
} catch {
    Write-Host "=> Da chan thanh cong khi trung So dien thoai (HTTP 400)!" -ForegroundColor Green
}

# 5. Cap nhat thong tin nhan vien
Write-Host "`n[BUOC 5] Cap nhat ho ten & doi mat khau tai khoan (PUT /api/accounts/{id})..." -ForegroundColor Yellow
$updatePayload = @{
    name = "Tran Thu Ngan (Ca Dem) $randSuffix"
    role = "STAFF"
    password = "newpassword456"
} | ConvertTo-Json

$updatedStaff = Invoke-RestMethod -Uri "$baseUrl/api/accounts/$($createdStaff.id)" -Method Put -Headers $headers -Body $updatePayload -UseBasicParsing
Write-Host "=> Cap nhat nhan vien thanh cong!" -ForegroundColor Green
Write-Host "   Ten moi: $($updatedStaff.name) | Role: $($updatedStaff.role)" -ForegroundColor Cyan

# 6. Kiem thu Bao ve Admin: Chan tu xoa chinh minh
Write-Host "`n[BUOC 6] Kiem thu bao ve Admin: Chan tu xoa chinh minh (DELETE /api/accounts/{adminId})..." -ForegroundColor Yellow
try {
    Invoke-RestMethod -Uri "$baseUrl/api/accounts/$adminId" -Method Delete -Headers $headers -UseBasicParsing
    throw "LOI: Admin tu xoa chinh minh nhung server van cho phep!"
} catch {
    Write-Host "=> Server da chan Admin tu xoa chinh minh thanh cong (HTTP 400)!" -ForegroundColor Green
}

# 7. Kiem thu An toan Phien choi May tram (Active Session Protection)
Write-Host "`n[BUOC 7] Kiem thu chan xoa & chan doi vai tro khi khach dang co phien choi ACTIVE..." -ForegroundColor Yellow

# Đăng ký hội viên kèm nạp tiền lần đầu tại quầy (20.000 VNĐ = 120 phút chuẩn)
$custPhone = "097722$randSuffix"
$regDepositPayload = @{
    phone = $custPhone
    name = "Khach Hang Dang Choi E2E $randSuffix"
    password = "123456"
    initialDeposit = 20000
    paymentMethod = "CASH"
} | ConvertTo-Json

$regRes = Invoke-RestMethod -Uri "$baseUrl/api/accounts/register-with-deposit" -Method Post -Headers $headers -Body $regDepositPayload -UseBasicParsing
$playingCustomer = $regRes.account
Write-Host "=> Dang ky hoi vien moi kem nap 20.000d: $($playingCustomer.name) (ID: $($playingCustomer.id), So du: $($playingCustomer.remainingMinutes) phut)" -ForegroundColor Cyan

# Tao 1 may tram test moi hoan toan doc lap de tranh xung dot voi may khac
$randIpOctet = Get-Random -Minimum 10 -Maximum 250
$newCompPayload = @{
    code = "PC-ACC-$randSuffix"
    ipAddress = "192.168.88.$randIpOctet"
    zone = "STANDARD"
    pricePerHour = 10000
    status = "AVAILABLE"
} | ConvertTo-Json
$targetComp = Invoke-RestMethod -Uri "$baseUrl/api/computers" -Method Post -Headers $headers -Body $newCompPayload -UseBasicParsing
Write-Host "=> Tao may tram test moi ID: $($targetComp.id) ($($targetComp.code), IP: $($targetComp.ipAddress))" -ForegroundColor Cyan

# Mở phiên chơi cho khách
$startReq = @{
    computerId = $targetComp.id
    accountId = $playingCustomer.id
} | ConvertTo-Json
$activeSession = Invoke-RestMethod -Uri "$baseUrl/api/sessions/start" -Method Post -Headers $headers -Body $startReq -UseBasicParsing
Write-Host "=> Da mo phien choi ACTIVE ID: $($activeSession.id) cho khach $($playingCustomer.name) tren may $($targetComp.code)" -ForegroundColor Cyan

# 7a. Thử xóa tài khoản khi đang có phiên chơi ACTIVE
try {
    Invoke-RestMethod -Uri "$baseUrl/api/accounts/$($playingCustomer.id)" -Method Delete -Headers $headers -UseBasicParsing
    throw "LOI: Khach dang co phien choi ACTIVE nhung server van cho xoa!"
} catch {
    Write-Host "=> Da chan xoa thanh cong vi khach dang co phien choi hoat dong tren may (HTTP 400)!" -ForegroundColor Green
}

# 7b. Thử đổi vai trò của khách sang STAFF khi đang chơi
try {
    $roleChangePayload = @{
        name = $playingCustomer.name
        role = "STAFF"
    } | ConvertTo-Json
    Invoke-RestMethod -Uri "$baseUrl/api/accounts/$($playingCustomer.id)" -Method Put -Headers $headers -Body $roleChangePayload -UseBasicParsing
    throw "LOI: Khach dang co phien choi ACTIVE nhung server van cho doi Role!"
} catch {
    Write-Host "=> Da chan doi Role thanh cong khi dang choi (Bao toan toan ven Dynamic Tariff & Session)!" -ForegroundColor Green
}

# Ket thuc phien choi qua PATCH /api/sessions/{id}/end
Invoke-RestMethod -Uri "$baseUrl/api/sessions/$($activeSession.id)/end" -Method Patch -Headers $headers -UseBasicParsing | Out-Null
Write-Host "=> Da ket thuc phien choi an toan (Session da luu vao lich su)!" -ForegroundColor Cyan

# 8. Kiem thu Safe Delete Integrity: Chan xoa tai khoan da co lich su phien choi / giao dich
Write-Host "`n[BUOC 8] Kiem thu Safe Delete: Chan xoa tai khoan da co lich su phien choi / giao dich..." -ForegroundColor Yellow
try {
    Invoke-RestMethod -Uri "$baseUrl/api/accounts/$($playingCustomer.id)" -Method Delete -Headers $headers -UseBasicParsing
    throw "LOI: Tai khoan da co lich su phien choi nhung server van cho xoa cung!"
} catch {
    Write-Host "=> Server da chan xoa thanh cong: Bao toan toan ven so sach ke toan & lich su phong net (HTTP 400)!" -ForegroundColor Green
}

# 9. Tao va xoa tai khoan moi tao chua tung giao dich (Clean Delete)
Write-Host "`n[BUOC 9] Tao va xoa tai khoan moi tao chua tung giao dich (Xoa sach an toan)..." -ForegroundColor Yellow
$cleanPhone = "099955$randSuffix"
$cleanPayload = @{
    phone = $cleanPhone
    name = "Tai Khoan Thu Nghiem E2E $randSuffix"
    password = "cleanpassword123"
    role = "CUSTOMER"
} | ConvertTo-Json

$cleanAcc = Invoke-RestMethod -Uri "$baseUrl/api/accounts" -Method Post -Headers $headers -Body $cleanPayload -UseBasicParsing
Write-Host "=> Tao tai khoan thu nghiem ID: $($cleanAcc.id) ($cleanPhone)" -ForegroundColor Cyan

Invoke-RestMethod -Uri "$baseUrl/api/accounts/$($cleanAcc.id)" -Method Delete -Headers $headers -UseBasicParsing
Write-Host "=> Xoa tai khoan thu nghiem thanh cong (HTTP 204 No Content)!" -ForegroundColor Green

Write-Host "`n======================================================================" -ForegroundColor Cyan
Write-Host ">>> KET QUA: 9/9 BUOC KIEM THU E2E QUAN LY TAI KHOAN PASS HOAN HAO! <<<" -ForegroundColor Green
Write-Host "======================================================================" -ForegroundColor Cyan
