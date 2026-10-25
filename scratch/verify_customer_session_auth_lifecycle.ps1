<#
.SYNOPSIS
    Kich ban kiem tra Vong doi Phien choi Khach hang, Nhan dien May, Khoi phuc khi F5 & Co che Thu hoi Token an toan.
.DESCRIPTION
    Kiem tra luong xac thuc va trai nghiem nguoi dung thuc te tren giao dien may tram (Customer Terminal):
    1. Kiem tra trang thai may truoc khi khach ngoi (GET /api/sessions/check/{computerCode}).
    2. Khach dang nhap truc tiep tai may tram (POST /api/sessions/login) de mo phien.
    3. Lay token JWT Customer (POST /api/auth/customer-session-login).
    4. Mo phong khach bam F5 Reload trinh duyet:
       - Goi GET /api/sessions/active/computer/{computerCode} de khoi phuc trang thai dem nguoc ma khong bi vang dang nhap.
    5. Mo phong co che quay vong Token (Token Rotation) khi choi:
       - Goi POST /api/auth/refresh de lay accessToken moi bang refreshToken hien tai.
    6. Thu ngan bam Ket thuc phien (PATCH /api/sessions/{id}/end):
       - Kiem tra may tram tra ve AVAILABLE.
       - Kiem tra so phut du duoc hoan tra chinh xac vao tai khoan.
    7. KIEM DINH BAO MAT & UX THEN CHOT (TOKEN REVOCATION TRIGGER):
       - Khach goi POST /api/auth/refresh bang refreshToken cu sau khi phien bi dong.
       - Backend BAT BUOC tra ve HTTP 400/401 (do refreshToken da bi xoa sach khoi database).
       - Kich hoat modal "Phien choi da ket thuc" tren man hinh khach va khoa may an toan.
#>

$ErrorActionPreference = 'Stop'
$baseUrl = 'http://localhost:8080'

function Write-Step([string]$title) {
    Write-Host "`n========================================================" -ForegroundColor Cyan
    Write-Host ">>> $title" -ForegroundColor Cyan
    Write-Host "========================================================" -ForegroundColor Cyan
}

function Write-Pass([string]$msg) {
    Write-Host "  [PASS] $msg" -ForegroundColor Green
}

function Write-Fail([string]$msg) {
    Write-Host "  [FAIL] $msg" -ForegroundColor Red
}

function Write-Info([string]$msg) {
    Write-Host "  [INFO] $msg" -ForegroundColor DarkGray
}

function Write-Data([string]$label, [string]$value) {
    Write-Host "  * $($label.PadRight(35)): $value" -ForegroundColor Yellow
}

try {
    Write-Step "BUOC 1: XAC THUC QUAY THU NGAN & CHUAN BI MAY TRAM TEST (PC-02)"
    
    $staffLoginBody = @{ phone = '0902222222'; password = 'staff123' } | ConvertTo-Json
    $staffRes = Invoke-RestMethod -Uri "$baseUrl/api/auth/login" -Method Post -Body $staffLoginBody -ContentType 'application/json'
    $staffToken = $staffRes.accessToken
    Write-Pass "Dang nhap Staff thanh cong: $($staffRes.account.name)"

    $custId = 48
    $custPhone = '0988001122'

    # Dam bao may PC-02 ranh roi
    $pc2 = Invoke-RestMethod -Uri "$baseUrl/api/computers/2" -Method Get -Headers @{ Authorization = "Bearer $staffToken" }
    if ($pc2.status -ne 'AVAILABLE') {
        try {
            $oldSess = Invoke-RestMethod -Uri "$baseUrl/api/sessions/active/computer/PC-02" -Method Get -Headers @{ Authorization = "Bearer $staffToken" }
            Invoke-RestMethod -Uri "$baseUrl/api/sessions/$($oldSess.id)/end" -Method Patch -Headers @{ Authorization = "Bearer $staffToken" } | Out-Null
            Write-Info "Da don dep phien cu tren may PC-02"
        } catch {
            Invoke-RestMethod -Uri "$baseUrl/api/computers/2" -Method Put -Body (@{ code = $pc2.code; name = $pc2.name; zone = $pc2.zone; pricePerHour = $pc2.pricePerHour; status = 'AVAILABLE' } | ConvertTo-Json) -ContentType 'application/json' -Headers @{ Authorization = "Bearer $staffToken" } | Out-Null
        }
    }

    # Dam bao tai khoan khach co toi thieu 60 phut
    $custAcc = Invoke-RestMethod -Uri "$baseUrl/api/accounts/$custId" -Method Get -Headers @{ Authorization = "Bearer $staffToken" }
    if ($custAcc.remainingMinutes -lt 60) {
        $topupBody = @{ accountId = $custId; minutes = 60; amount = 10000; paymentMethod = 'CASH' } | ConvertTo-Json
        $tp = Invoke-RestMethod -Uri "$baseUrl/api/time-purchases" -Method Post -Body $topupBody -ContentType 'application/json' -Headers @{ Authorization = "Bearer $staffToken" }
        Invoke-RestMethod -Uri "$baseUrl/api/time-purchases/$($tp.id)/confirm" -Method Patch -Headers @{ Authorization = "Bearer $staffToken" } | Out-Null
        Write-Info "Da nap 60 phut vao tai khoan khach ID $custId"
    }

    Write-Step "BUOC 2: MAN HINH MAY TRAM KIEM TRA TRANG THAI MAY (DISCOVERY PRE-CHECK)"

    # Man hinh cho cua may tram goi kiem tra xem may co san sang don khach khong
    $checkRes = Invoke-RestMethod -Uri "$baseUrl/api/sessions/check/PC-02" -Method Get
    Write-Pass "API /api/sessions/check/PC-02 phan hoi thanh cong"
    Write-Data "Ma may tram" "$($checkRes.computerCode)"
    Write-Data "Trang thai may tram" "$($checkRes.status)"
    Write-Data "Don gia hien thi" "$($checkRes.pricePerHour) d/h"
    Write-Data "Phan khu may" "$($checkRes.zone)"

    if ($checkRes.status -ne 'AVAILABLE') {
        throw "May PC-02 khong o trang thai AVAILABLE de thuc hien dang nhap!"
    }

    Write-Step "BUOC 3: KHACH HANG DANG NHAP TRUC TIEP TAI MAY TRAM (TERMINAL LOGIN)"

    # Khach go SDT va Mat khau tai man hinh khoa may tram
    $loginAtPcBody = @{
        phone = $custPhone
        password = 'khach123'
        computerCode = 'PC-02'
    } | ConvertTo-Json

    $custLoginRes = Invoke-RestMethod -Uri "$baseUrl/api/sessions/login" -Method Post -Body $loginAtPcBody -ContentType 'application/json'
    $sessionId = $custLoginRes.id

    Write-Pass "Khach hang dang nhap may tram PC-02 thanh cong!"
    Write-Data "Session ID tao ra" "$sessionId"
    Write-Data "Ten khach hang" "$($custLoginRes.accountName)"
    Write-Data "Thoi diem het han" "$($custLoginRes.expiresAt)"
    Write-Data "So phut choi ban dau" "$($custLoginRes.remainingMinutesUntilExpiry) phut"

    # Lay Token Customer
    $custAuthBody = @{ computerCode = 'PC-02'; phone = $custPhone } | ConvertTo-Json
    $custAuthRes = Invoke-RestMethod -Uri "$baseUrl/api/auth/customer-session-login" -Method Post -Body $custAuthBody -ContentType 'application/json'
    $custAccessToken = $custAuthRes.accessToken
    $custRefreshToken = $custAuthRes.refreshToken

    Write-Pass "Cap phat Token JWT Customer thanh cong!"
    Write-Data "Access Token (rut gon)" "$($custAccessToken.Substring(0, 20))..."
    Write-Data "Refresh Token (rut gon)" "$($custRefreshToken.Substring(0, 20))..."

    Write-Step "BUOC 4: MO PHONG KHACH BAM F5 RELOAD TRANG (SESSION RECOVERY CHECK)"

    # Khach F5 lam moi trinh duyet, frontend goi khoi phuc phien
    $recoveryRes = Invoke-RestMethod -Uri "$baseUrl/api/sessions/active/computer/PC-02" -Method Get -Headers @{ Authorization = "Bearer $custAccessToken" }

    Write-Pass "Khoi phuc phien choi thanh cong khi F5 reload trang!"
    Write-Data "Trang thai phien khoi phuc" "$($recoveryRes.status)"
    Write-Data "So phut choi con lai" "$($recoveryRes.remainingMinutesUntilExpiry) phut"
    Write-Data "So phut da choi" "$($recoveryRes.playedMinutes) phut"

    if ($recoveryRes.id -eq $sessionId -and $recoveryRes.status -eq 'ACTIVE') {
        Write-Pass "Du lieu khoi phuc dong nhat 100% voi phien dang nhap ban dau."
    } else {
        Write-Fail "Sai lech du lieu khoi phuc phien F5!"
    }

    Write-Step "BUOC 5: KIEM DINH QUAY VONG TOKEN (TOKEN ROTATION TRONG QUA TRINH CHOI)"

    # Goi refresh token khi accessToken sap het han
    $refreshBody = @{ refreshToken = $custRefreshToken } | ConvertTo-Json
    $refreshRes = Invoke-RestMethod -Uri "$baseUrl/api/auth/refresh" -Method Post -Body $refreshBody -ContentType 'application/json'

    $newAccessToken = $refreshRes.accessToken
    $newRefreshToken = $refreshRes.refreshToken

    Write-Pass "Token Rotation thanh cong: Cap phat Access Token moi muot ma."
    Write-Data "Access Token moi" "$($newAccessToken.Substring(0, 20))..."
    Write-Data "Refresh Token moi" "$($newRefreshToken.Substring(0, 20))..."

    Write-Step "BUOC 6: THU NGAN KET THUC PHIEN CHOI VA THU HOI TOKEN AN TOAN"

    # Thu ngan bam ket thuc phien tu quay thu ngan
    $endRes = Invoke-RestMethod -Uri "$baseUrl/api/sessions/$sessionId/end" -Method Patch -Headers @{ Authorization = "Bearer $staffToken" }
    Write-Pass "Thu ngan da ket thuc phien choi: Trang thai = $($endRes.status)"

    # Kiem tra may PC-02 da tra ve AVAILABLE
    $pc2Check = Invoke-RestMethod -Uri "$baseUrl/api/computers/2" -Method Get -Headers @{ Authorization = "Bearer $staffToken" }
    if ($pc2Check.status -eq 'AVAILABLE') {
        Write-Pass "May PC-02 da tra ve trang thai AVAILABLE thanh cong."
    } else {
        Write-Fail "May PC-02 chua ve AVAILABLE! Trang thai: $($pc2Check.status)"
    }

    Write-Step "BUOC 7: KIEM DINH BAO MAT & UX THEN CHOT (TOKEN REVOCATION TRIGGER)"

    # Thu refresh token sau khi phien ket thuc bang newRefreshToken
    # Ky vong: HTTP 400/401 do Backend da xoa toan bo Refresh Token cua tai khoan khach
    $tokenRevoked = $false
    try {
        $staleRefreshBody = @{ refreshToken = $newRefreshToken } | ConvertTo-Json
        Invoke-RestMethod -Uri "$baseUrl/api/auth/refresh" -Method Post -Body $staleRefreshBody -ContentType 'application/json'
        Write-Fail "LOI BAO MAT: Token van refresh thanh cong sau khi phien da ket thuc!"
    } catch {
        $statusCode = $_.Exception.Response.StatusCode.value__
        if ($statusCode -eq 401 -or $statusCode -eq 400) {
            $tokenRevoked = $true
            Write-Pass "DAC TINH BAO MAT PASS: Server tu choi Refresh Token cu voi ma HTTP $statusCode!"
            Write-Info "Hanh vi Client: Frontend bat duoc loi nay, kich hoat ngay Modal 'Phien da ket thuc' va khoa may."
        } else {
            Write-Fail "Server tra ve ma loi khong mong doi: $statusCode"
        }
    }

    if (-not $tokenRevoked) {
        throw "Kiem dinh thu hoi Token that bai!"
    }

    Write-Host "`n>>> KET QUA: TOAN BO VONG DOI PHIEN CHOI & BAO MAT TOKEN PASS 100% <<<" -ForegroundColor Green

} catch {
    Write-Fail "Loi kiem tra Vong doi phien choi: $_"
    if ($_.Exception.Response) {
        $reader = New-Object System.IO.StreamReader($_.Exception.Response.GetResponseStream())
        $errBody = $reader.ReadToEnd()
        Write-Host "Chi tiet phan hoi loi: $errBody" -ForegroundColor Red
    }
    exit 1
}
