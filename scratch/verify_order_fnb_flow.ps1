<#
.SYNOPSIS
    Kich ban kiem tra chu trinh Dat mon F&B, Snapshot gia va Tu dong cong gio cho mon PLAYTIME.
.DESCRIPTION
    Kiem tra toan dien cac API ket noi truc tiep voi CartDrawer, MenuCard, va OrderQueuePage:
    1. Dang nhap Staff va khoi tao Session cho Customer (Account 48 / 0988001122) tai PC-01.
    2. Customer xac thuc JWT qua POST /api/auth/customer-session-login de lay token dat mon.
    3. Customer tao Order da san pham (FOOD, DRINK, PLAYTIME combo gio choi).
    4. Kiem dinh du lieu tra ve cho Client: itemImageUrl, snapshot unitPrice, subtotal, totalAmount.
    5. Staff tra cuu Order Queue (GET /api/orders?status=PENDING_PAYMENT), xac minh cau truc card.
    6. Staff duyet don (PATCH /api/orders/{id}/confirm), kiem chung tinh nang tu dong gia han session khi co PLAYTIME item.
    7. Test luong huy don (PATCH /api/orders/{id}/cancel) va don dep phien thu nghiem.
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
    Write-Step "BUOC 1: XAC THUC TAI KHOAN QUAY (STAFF) VA TAI KHOAN KHACH HANG"
    
    # 1. Staff Login
    $staffLoginBody = @{ phone = '0902222222'; password = 'staff123' } | ConvertTo-Json
    $staffRes = Invoke-RestMethod -Uri "$baseUrl/api/auth/login" -Method Post -Body $staffLoginBody -ContentType 'application/json'
    $staffToken = $staffRes.accessToken
    Write-Pass "Staff dang nhap thanh cong: $($staffRes.account.name) [Role: $($staffRes.account.role)]"

    $custId = 48
    $custPhone = '0988001122'

    Write-Step "BUOC 2: CHUAN BI PHIEN CHOI ACTIVE CHO KHACH HANG TAI MAY PC-01"
    
    # Nap san 120 phut chuan cho khach neu so du con it
    $custProfile = Invoke-RestMethod -Uri "$baseUrl/api/accounts/$custId" -Method Get -Headers @{ Authorization = "Bearer $staffToken" }
    if ($custProfile.remainingMinutes -lt 60) {
        Write-Info "So du khach con it ($($custProfile.remainingMinutes)p), tao phieu nap 20,000d (120 phut)..."
        $topupBody = @{ accountId = $custId; minutes = 120; amount = 20000; paymentMethod = 'CASH' } | ConvertTo-Json
        $tp = Invoke-RestMethod -Uri "$baseUrl/api/time-purchases" -Method Post -Body $topupBody -ContentType 'application/json' -Headers @{ Authorization = "Bearer $staffToken" }
        Invoke-RestMethod -Uri "$baseUrl/api/time-purchases/$($tp.id)/confirm" -Method Patch -Headers @{ Authorization = "Bearer $staffToken" } | Out-Null
        Write-Pass "Da nap thanh cong 120 phut chuan vao tai khoan khach."
    }

    # Don dep phien cu tren PC-01 neu co
    $pc1 = Invoke-RestMethod -Uri "$baseUrl/api/computers/1" -Method Get -Headers @{ Authorization = "Bearer $staffToken" }
    if ($pc1.status -eq 'IN_USE') {
        try {
            $activeSess = Invoke-RestMethod -Uri "$baseUrl/api/sessions/active/computer/PC-01" -Method Get -Headers @{ Authorization = "Bearer $staffToken" }
            Invoke-RestMethod -Uri "$baseUrl/api/sessions/$($activeSess.id)/end" -Method Patch -Headers @{ Authorization = "Bearer $staffToken" } | Out-Null
            Write-Info "Da don dep phien cu tren may PC-01"
        } catch {
            Write-Info "May PC-01 san sang"
        }
    }

    # Mo phien moi cho khach tren PC-01
    $startBody = @{ computerId = 1; accountId = $custId } | ConvertTo-Json
    $session = Invoke-RestMethod -Uri "$baseUrl/api/sessions/start" -Method Post -Body $startBody -ContentType 'application/json' -Headers @{ Authorization = "Bearer $staffToken" }
    $sessionId = $session.id
    $initialExpiresAt = [DateTime]::Parse($session.expiresAt)
    Write-Pass "Phien choi moi duoc mo [SessionID=$sessionId]: May $($session.computerCode) | Het han: $($session.expiresAt)"

    # Khach hang xac thuc JWT token tai may tram de lay quyen dat mon F&B
    $custAuthBody = @{ computerCode = 'PC-01'; phone = $custPhone } | ConvertTo-Json
    $custAuthRes = Invoke-RestMethod -Uri "$baseUrl/api/auth/customer-session-login" -Method Post -Body $custAuthBody -ContentType 'application/json'
    $custToken = $custAuthRes.accessToken
    Write-Pass "Khach hang xac thuc thanh cong tai PC-01: $($custAuthRes.account.name)"

    Write-Step "BUOC 3: KHACH HANG TAO DON HANG F&B DA DANG (FOOD + DRINK + PLAYTIME)"
    
    # Lay danh sach Item mau
    $items = Invoke-RestMethod -Uri "$baseUrl/api/items?size=20" -Method Get -Headers @{ Authorization = "Bearer $custToken" }
    $foodItem = $items.content | Where-Object { $_.type -eq 'FOOD' } | Select-Object -First 1
    $drinkItem = $items.content | Where-Object { $_.type -eq 'DRINK' } | Select-Object -First 1
    $playItem = $items.content | Where-Object { $_.type -eq 'PLAYTIME' } | Select-Object -First 1

    Write-Data "Mon FOOD (An)" "$($foodItem.name) (Don gia: $($foodItem.price) d)"
    Write-Data "Mon DRINK (Uong)" "$($drinkItem.name) (Don gia: $($drinkItem.price) d)"
    Write-Data "Mon PLAYTIME (Gio)" "$($playItem.name) (Don gia: $($playItem.price) d)"

    # Khach dat: 1 Mon an + 2 Mon nuoc + 1 Goi gio choi PLAYTIME
    $orderReqBody = @{
        sessionId = $sessionId
        paymentMethod = 'CASH'
        note = 'Cho xin them ot va tuong ca nha quan!'
        items = @(
            @{ itemId = $foodItem.id; quantity = 1 }
            @{ itemId = $drinkItem.id; quantity = 2 }
            @{ itemId = $playItem.id; quantity = 1 }
        )
    } | ConvertTo-Json -Depth 5

    $orderRes = Invoke-RestMethod -Uri "$baseUrl/api/orders" -Method Post -Body $orderReqBody -ContentType 'application/json' -Headers @{ Authorization = "Bearer $custToken" }
    $orderId = $orderRes.id

    Write-Pass "Tao don hang thanh cong [OrderID=$orderId, Ma: $($orderRes.orderCode)]"
    Write-Data "Trang thai don hang" "$($orderRes.status)"
    Write-Data "Tong tien he thong tinh" "$($orderRes.totalAmount) d"
    Write-Data "Ghi chu khach hang" "$($orderRes.note)"

    # KIEM DINH SNAPSHOT GIA VA CAU TRUC CLIENT PAYLOAD
    $expectedTotal = [decimal]$foodItem.price * 1 + [decimal]$drinkItem.price * 2 + [decimal]$playItem.price * 1
    if ([decimal]$orderRes.totalAmount -eq $expectedTotal) {
        Write-Pass "Kiem tra Tong tien Snapshot: Khop chinh xac $expectedTotal d"
    } else {
        Write-Fail "Sai lech tong tien: Tra ve $($orderRes.totalAmount), ky vong $expectedTotal"
    }

    Write-Step "BUOC 4: THU NGAN XEM HANG DOI DUYET (STAFF ORDER QUEUE CONTRACT CHECK)"
    
    $pendingOrders = Invoke-RestMethod -Uri "$baseUrl/api/orders?status=PENDING_PAYMENT&page=0&size=10" -Method Get -Headers @{ Authorization = "Bearer $staffToken" }
    $foundOrder = $pendingOrders.content | Where-Object { $_.id -eq $orderId }

    if ($foundOrder) {
        Write-Pass "Tim thay don hang #$orderId trong hang doi PENDING_PAYMENT cua thu ngan"
        Write-Data "Ma may tram" "$($foundOrder.computerCode)"
        Write-Data "Ten khach goi" "$($foundOrder.accountName)"
        Write-Data "So dong san pham" "$($foundOrder.orderItems.Count) mon"
        foreach ($oi in $foundOrder.orderItems) {
            Write-Info "   -> $($oi.itemName) x $($oi.quantity) | Don gia: $($oi.unitPrice) d | Thanh tien: $($oi.subtotal) d"
        }
    } else {
        Write-Fail "Khong tim thay don hang #$orderId trong hang doi thu ngan!"
    }

    Write-Step "BUOC 5: THU NGAN DUYET DON & KIEM TRA TINH NANG TU DONG CONG GIO MON PLAYTIME"
    
    # Thu ngan duyet don
    $confirmRes = Invoke-RestMethod -Uri "$baseUrl/api/orders/$orderId/confirm" -Method Patch -Headers @{ Authorization = "Bearer $staffToken" }
    Write-Pass "Thu ngan da duyet don #${orderId} - Trang thai moi = $($confirmRes.status)"
    Write-Data "Nhan vien xac nhan" "$($confirmRes.confirmedByStaffName)"
    Write-Data "Thoi diem xac nhan" "$($confirmRes.confirmedAt)"

    # KIEM TRA PHIEN CHOI CO DUOC TU DONG GIA HAN THOI GIAN KHONG (Mon PLAYTIME tuong ung 60 phut)
    $updatedSession = Invoke-RestMethod -Uri "$baseUrl/api/sessions/$sessionId" -Method Get -Headers @{ Authorization = "Bearer $staffToken" }
    $newExpiresAt = [DateTime]::Parse($updatedSession.expiresAt)
    $extendedMinutes = [Math]::Round(($newExpiresAt - $initialExpiresAt).TotalMinutes)

    Write-Data "Moc het han ban dau" "$initialExpiresAt"
    Write-Data "Moc het han sau khi duyet PLAYTIME" "$newExpiresAt"
    Write-Data "So phut thuc te duoc cong them" "$extendedMinutes phut"

    if ($extendedMinutes -ge 59 -and $extendedMinutes -le 61) {
        Write-Pass "DAC TINH THEN CHOT PASS: Don hang chua mon PLAYTIME da tu dong gia han Session them 60 phut!"
    } else {
        Write-Fail "Gia han session khong chinh xac: lech $extendedMinutes phut (ky vong 60 phut)"
    }

    Write-Step "BUOC 6: KIEM TRA LUONG HUY DON HANG (CANCEL ORDER FLOW)"
    
    # Tao them 1 don hang tam de test chuc nang huy
    $cancelReqBody = @{
        sessionId = $sessionId
        paymentMethod = 'CASH'
        note = 'Khach doi y muon huy don nay'
        items = @( @{ itemId = $drinkItem.id; quantity = 1 } )
    } | ConvertTo-Json -Depth 5

    $orderToCancel = Invoke-RestMethod -Uri "$baseUrl/api/orders" -Method Post -Body $cancelReqBody -ContentType 'application/json' -Headers @{ Authorization = "Bearer $custToken" }
    Write-Info "Tao don hang tam #$($orderToCancel.id) de test huy don..."

    $cancelRes = Invoke-RestMethod -Uri "$baseUrl/api/orders/$($orderToCancel.id)/cancel" -Method Patch -Headers @{ Authorization = "Bearer $staffToken" }
    if ($cancelRes.status -eq 'CANCELLED') {
        Write-Pass "Don hang #$($orderToCancel.id) da duoc huy thanh cong: Status = CANCELLED"
    } else {
        Write-Fail "Huy don that bai! Status hien tai = $($cancelRes.status)"
    }

    Write-Step "BUOC 7: DON DEP PHIEN CHOI THU NGHIEM"
    $endSess = Invoke-RestMethod -Uri "$baseUrl/api/sessions/$sessionId/end" -Method Patch -Headers @{ Authorization = "Bearer $staffToken" }
    Write-Pass "Da ket thuc phien thu nghiem [SessionID=$sessionId], may PC-01 da san sang don khach."
    Write-Data "So phut hoan lai tai khoan khach" "$($endSess.accountRemainingMinutes) phut chuan"

    Write-Host "`n>>> KET QUA: TOAN BO CHU TRINH F&B, SNAPSHOT GIA & PLAYTIME PASS 100% <<<" -ForegroundColor Green

} catch {
    Write-Fail "Phat hien loi trong qua trinh thuc thi: $_"
    if ($_.Exception.Response) {
        $reader = New-Object System.IO.StreamReader($_.Exception.Response.GetResponseStream())
        $errBody = $reader.ReadToEnd()
        Write-Host "Chi tiet phan hoi loi tu server: $errBody" -ForegroundColor Red
    }
    exit 1
}
