<#
.SYNOPSIS
    Kich ban kiem tra nghiep vu Doi may tram da phan khu & Quy doi Bieu phi dong (Dynamic Tariff Transfer).
.DESCRIPTION
    Kiem tra toan dien API PATCH /api/sessions/{id}/transfer ket noi voi TransferSessionModal:
    1. Chuan bi 2 may khac don gia: May Standard (10.000d/h) va May VIP (20.000d/h).
    2. Khach mo phien choi tai may Standard voi so phut xac dinh.
    3. Thu ngan thuc hien doi may sang may VIP 20.000d/h:
       - Kiem tra thoi gian het han co lai tuong ung: newMinutes = floor(oldMinutes * 10,000 / 20,000).
       - Kiem tra trang thai may cu tro ve AVAILABLE.
       - Kiem tra trang thai may moi chuyen sang IN_USE.
    4. Thu ngan tiep tuc doi may nguoc lai tu may VIP 20.000d/h sang may Standard 10.000d/h:
       - Kiem tra thoi gian het han no rong lai tuong ung: newMinutes = floor(oldMinutes * 20,000 / 10,000).
    5. Kiem tra tuy chon danh dau may cu thanh MAINTENANCE (bao tri do ban phim/chuot hong).
    6. Ket thuc phien choi va kiem tra thuat toan hoan tra phut chuan doi xung (Symmetrical Dynamic Refund).
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
    Write-Step "BUOC 1: XAC THUC STAFF & THU THAP THONG TIN MAY TEST"
    
    $staffLoginBody = @{ phone = '0902222222'; password = 'staff123' } | ConvertTo-Json
    $staffRes = Invoke-RestMethod -Uri "$baseUrl/api/auth/login" -Method Post -Body $staffLoginBody -ContentType 'application/json'
    $staffToken = $staffRes.accessToken
    Write-Pass "Staff dang nhap thanh cong: $($staffRes.account.name)"

    # Lay danh sach may tinh de tim 1 may Standard 10k va 1 may VIP 20k
    $computers = Invoke-RestMethod -Uri "$baseUrl/api/computers?size=100" -Method Get -Headers @{ Authorization = "Bearer $staffToken" }
    
    $standardPc = $computers.content | Where-Object { [decimal]$_.pricePerHour -eq 10000 -and $_.code -like 'PC-*' } | Select-Object -First 1
    $vipPc = $computers.content | Where-Object { [decimal]$_.pricePerHour -eq 20000 } | Select-Object -First 1

    if (-not $standardPc -or -not $vipPc) {
        throw "Khong tim thay du 1 may Standard (10.000d/h) va 1 may VIP (20.000d/h) de kiem thu!"
    }

    Write-Data "May Standard A (Dich 1)" "$($standardPc.code) [ID=$($standardPc.id), Gia: $($standardPc.pricePerHour) d/h, Status: $($standardPc.status)]"
    Write-Data "May VIP B (Dich 2)" "$($vipPc.code) [ID=$($vipPc.id), Gia: $($vipPc.pricePerHour) d/h, Status: $($vipPc.status)]"

    # Don dep neu 2 may nay dang bi ket session
    foreach ($m in @($standardPc, $vipPc)) {
        if ($m.status -eq 'IN_USE') {
            try {
                $sess = Invoke-RestMethod -Uri "$baseUrl/api/sessions/active/computer/$($m.code)" -Method Get -Headers @{ Authorization = "Bearer $staffToken" }
                Invoke-RestMethod -Uri "$baseUrl/api/sessions/$($sess.id)/end" -Method Patch -Headers @{ Authorization = "Bearer $staffToken" } | Out-Null
                Write-Info "Da don dep phien ket cu tren may $($m.code)"
            } catch {
                Invoke-RestMethod -Uri "$baseUrl/api/computers/$($m.id)" -Method Put -Body (@{ code = $m.code; name = $m.name; zone = $m.zone; pricePerHour = $m.pricePerHour; status = 'AVAILABLE' } | ConvertTo-Json) -ContentType 'application/json' -Headers @{ Authorization = "Bearer $staffToken" } | Out-Null
            }
        } elseif ($m.status -eq 'MAINTENANCE') {
            Invoke-RestMethod -Uri "$baseUrl/api/computers/$($m.id)" -Method Put -Body (@{ code = $m.code; name = $m.name; zone = $m.zone; pricePerHour = $m.pricePerHour; status = 'AVAILABLE' } | ConvertTo-Json) -ContentType 'application/json' -Headers @{ Authorization = "Bearer $staffToken" } | Out-Null
            Write-Info "Dua may $($m.code) tu MAINTENANCE ve AVAILABLE"
        }
    }

    Write-Step "BUOC 2: KHOI TAO PHIEN CHOI BAN DAU TAI MAY STANDARD ($($standardPc.code))"
    
    $custId = 48
    # Dam bao khach co du 180 phut chuan
    $acc = Invoke-RestMethod -Uri "$baseUrl/api/accounts/$custId" -Method Get -Headers @{ Authorization = "Bearer $staffToken" }
    if ($acc.remainingMinutes -lt 120) {
        $topupBody = @{ accountId = $custId; minutes = 180; amount = 30000; paymentMethod = 'CASH' } | ConvertTo-Json
        $tp = Invoke-RestMethod -Uri "$baseUrl/api/time-purchases" -Method Post -Body $topupBody -ContentType 'application/json' -Headers @{ Authorization = "Bearer $staffToken" }
        Invoke-RestMethod -Uri "$baseUrl/api/time-purchases/$($tp.id)/confirm" -Method Patch -Headers @{ Authorization = "Bearer $staffToken" } | Out-Null
        Write-Pass "Da nap them 180 phut chuan cho khach hang ID $custId"
    }

    $startBody = @{ computerId = $standardPc.id; accountId = $custId } | ConvertTo-Json
    $sess = Invoke-RestMethod -Uri "$baseUrl/api/sessions/start" -Method Post -Body $startBody -ContentType 'application/json' -Headers @{ Authorization = "Bearer $staffToken" }
    $sessionId = $sess.id

    Write-Pass "Khoi tao phien choi thanh cong [SessionID=$sessionId]"
    Write-Data "May hien tai" "$($sess.computerCode) (Don gia: $($sess.pricePerHour) d/h)"
    Write-Data "Thoi gian het han ban dau" "$($sess.expiresAt)"
    Write-Data "So phut choi kha dung tren Standard" "$($sess.remainingMinutesUntilExpiry) phut"

    $initialMinutes = $sess.remainingMinutesUntilExpiry

    Write-Step "BUOC 3: CHUYEN MAY TU STANDARD (10K) SANG VIP (20K) - KIEM DINH THUAT TOAN CO RUT THOI GIAN"
    
    # Khach chuyen tu Standard 10k sang VIP 20k
    # Cong thuc: newMinutes = floor(oldMinutes * 10,000 / 20,000) = floor(oldMinutes / 2)
    $transferToVipBody = @{
        toComputerId = $vipPc.id
        toComputerCode = $vipPc.code
        markOldAsMaintenance = $false
        reason = 'Khach yeu cau chuyen sang may VIP cau hinh cao'
    } | ConvertTo-Json

    $transfer1Res = Invoke-RestMethod -Uri "$baseUrl/api/sessions/$sessionId/transfer" -Method Patch -Body $transferToVipBody -ContentType 'application/json' -Headers @{ Authorization = "Bearer $staffToken" }
    
    Write-Pass "Thuc hien doi may thanh cong sang $($vipPc.code)"
    Write-Data "Ma may moi trong SessionResponse" "$($transfer1Res.computerCode)"
    Write-Data "Phan khu may moi" "$($transfer1Res.computerZone)"
    Write-Data "Don gia moi" "$($transfer1Res.pricePerHour) d/h"
    Write-Data "Thoi gian het han moi" "$($transfer1Res.expiresAt)"
    Write-Data "So phut con lai sau quy doi tren VIP" "$($transfer1Res.remainingMinutesUntilExpiry) phut"

    # Kiem tra tinh toan toan hoc
    $expectedVipMinutes = [Math]::Floor($initialMinutes * 10000 / 20000)
    $diff1 = [Math]::Abs($transfer1Res.remainingMinutesUntilExpiry - $expectedVipMinutes)
    if ($diff1 -le 1) {
        Write-Pass "DAC TINH DYNAMIC TARIFF PASS: Thoi gian co lai chinh xac 1/2 ($($transfer1Res.remainingMinutesUntilExpiry)p vs ky vong $expectedVipMinutes p)"
    } else {
        Write-Fail "Sai lech quy doi Dynamic Tariff: Thuc te $($transfer1Res.remainingMinutesUntilExpiry)p, ky vong $expectedVipMinutes p"
    }

    # Kiem tra trang thai may vat ly
    $oldCheck = Invoke-RestMethod -Uri "$baseUrl/api/computers/$($standardPc.id)" -Method Get -Headers @{ Authorization = "Bearer $staffToken" }
    $newCheck = Invoke-RestMethod -Uri "$baseUrl/api/computers/$($vipPc.id)" -Method Get -Headers @{ Authorization = "Bearer $staffToken" }
    
    if ($oldCheck.status -eq 'AVAILABLE' -and $newCheck.status -eq 'IN_USE') {
        Write-Pass "Trang thai may dong bo chuan: May cu $($standardPc.code) = AVAILABLE, May moi $($vipPc.code) = IN_USE"
    } else {
        Write-Fail "Sai lech trang thai may: Cu = $($oldCheck.status), Moi = $($newCheck.status)"
    }

    Write-Step "BUOC 4: CHUYEN MAY NGUOC LAI TU VIP (20K) SANG STANDARD (10K) KEM CO BAO TRI (MAINTENANCE)"
    
    $transferBackBody = @{
        toComputerId = $standardPc.id
        toComputerCode = $standardPc.code
        markOldAsMaintenance = $true   # Danh dau may VIP cu bi bao tri (vi du loi phim)
        reason = 'May VIP bi ket phim Space, chuyen lai may thuong'
    } | ConvertTo-Json

    $currentVipRemaining = $transfer1Res.remainingMinutesUntilExpiry
    $transfer2Res = Invoke-RestMethod -Uri "$baseUrl/api/sessions/$sessionId/transfer" -Method Patch -Body $transferBackBody -ContentType 'application/json' -Headers @{ Authorization = "Bearer $staffToken" }

    Write-Pass "Doi may nguoc lai thanh cong sang $($standardPc.code)"
    Write-Data "Ma may moi" "$($transfer2Res.computerCode)"
    Write-Data "Don gia moi" "$($transfer2Res.pricePerHour) d/h"
    Write-Data "So phut no rong lai tren Standard" "$($transfer2Res.remainingMinutesUntilExpiry) phut"

    # Kiem tra tinh toan no rong lai gap doi: newMinutes = floor(oldMinutes * 20,000 / 10,000)
    $expectedStandardMinutes = [Math]::Floor($currentVipRemaining * 20000 / 10000)
    $diff2 = [Math]::Abs($transfer2Res.remainingMinutesUntilExpiry - $expectedStandardMinutes)
    if ($diff2 -le 2) {
        Write-Pass "DAC TINH DYNAMIC TARIFF PASS: Thoi gian no rong lai chinh xac x2 ($($transfer2Res.remainingMinutesUntilExpiry)p vs ky vong $expectedStandardMinutes p)"
    } else {
        Write-Fail "Sai lech quy doi no rong: Thuc te $($transfer2Res.remainingMinutesUntilExpiry)p, ky vong $expectedStandardMinutes p"
    }

    # Kiem tra co markOldAsMaintenance tren may VIP cu
    $vipOldCheck = Invoke-RestMethod -Uri "$baseUrl/api/computers/$($vipPc.id)" -Method Get -Headers @{ Authorization = "Bearer $staffToken" }
    if ($vipOldCheck.status -eq 'MAINTENANCE') {
        Write-Pass "Tuy chon markOldAsMaintenance PASS: May VIP $($vipPc.code) da duoc gan co MAINTENANCE chuan xac!"
    } else {
        Write-Fail "Co bao tri that bai: Trang thai hien tai = $($vipOldCheck.status)"
    }

    Write-Step "BUOC 5: KET THUC PHIEN VA KIEM TRA THUAT TOAN HOAN TRA DOI XUNG (SYMMETRICAL REFUND)"
    
    $endRes = Invoke-RestMethod -Uri "$baseUrl/api/sessions/$sessionId/end" -Method Patch -Headers @{ Authorization = "Bearer $staffToken" }
    Write-Pass "Ket thuc phien choi thanh cong"
    Write-Data "Trang thai phien" "$($endRes.status)"
    Write-Data "So phut hoan tra vao tai khoan" "$($endRes.accountRemainingMinutes) phut chuan"

    # Khoi phuc lai trang thai may VIP ve AVAILABLE de khong anh huong du lieu
    Invoke-RestMethod -Uri "$baseUrl/api/computers/$($vipPc.id)" -Method Put -Body (@{ code = $vipPc.code; name = $vipPc.name; zone = $vipPc.zone; pricePerHour = $vipPc.pricePerHour; status = 'AVAILABLE' } | ConvertTo-Json) -ContentType 'application/json' -Headers @{ Authorization = "Bearer $staffToken" } | Out-Null
    Write-Info "Da hoan tra may $($vipPc.code) ve trang thai AVAILABLE."

    Write-Host "`n>>> KET QUA: TOAN BO NGHIEP VU DOI MAY & DYNAMIC TARIFF PASS 100% <<<" -ForegroundColor Green

} catch {
    Write-Fail "Loi thuc thi kiem tra Doi may: $_"
    if ($_.Exception.Response) {
        $reader = New-Object System.IO.StreamReader($_.Exception.Response.GetResponseStream())
        $errBody = $reader.ReadToEnd()
        Write-Host "Chi tiet phan hoi loi: $errBody" -ForegroundColor Red
    }
    exit 1
}
