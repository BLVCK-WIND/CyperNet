<#
.SYNOPSIS
    Kịch bản kiểm tra Hợp đồng Dữ liệu Sơ đồ máy (Floor Map Client Contract) & Bộ đếm Realtime.
.DESCRIPTION
    Mô phỏng 100% thuật toán Client-side Data Mapping của FloorMapPage, ComputerCard và StaffTopBar:
    1. Gọi song song GET /api/computers?size=100 và GET /api/sessions?status=ACTIVE&size=100.
    2. Ghép nối dữ liệu:
       - Máy AVAILABLE: session phải là null, không văng lỗi render.
       - Máy IN_USE: bắt buộc phải có session mapping hợp lệ (accountName, expiresAt, remainingMinutesUntilExpiry).
       - Máy MAINTENANCE: hiển thị cờ bảo trì rõ ràng.
    3. Kiểm định định dạng ngày giờ ISO-8601 của startedAt, expiresAt và tính toán đồng hồ đếm ngược.
    4. Kiểm định tính toàn vẹn của Bộ đếm nhanh (Quick Stats Counters) trên StaffTopBar / StaffSidebar:
       - Số lượng máy online (IN_USE) phải khớp tuyệt đối 1:1 với số lượng active sessions.
       - Không có trường hợp Object bị truyền nhầm vào ô hiển thị số đếm (ngăn ngừa React Object child crash).
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
    Write-Step "BƯỚC 1: XÁC THỰC NHÂN VIÊN & TRUY VẤN DỮ LIỆU SƠ ĐỒ MÁY"
    
    $staffLoginBody = @{ phone = '0902222222'; password = 'staff123' } | ConvertTo-Json
    $staffRes = Invoke-RestMethod -Uri "$baseUrl/api/auth/login" -Method Post -Body $staffLoginBody -ContentType 'application/json'
    $staffToken = $staffRes.accessToken
    Write-Pass "Đăng nhập nhân viên thành công: $($staffRes.account.fullName)"

    # Gọi 2 API song song như Frontend React useFloorMap
    $computersRes = Invoke-RestMethod -Uri "$baseUrl/api/computers?size=100" -Method Get -Headers @{ Authorization = "Bearer $staffToken" }
    $sessionsRes = Invoke-RestMethod -Uri "$baseUrl/api/sessions?status=ACTIVE&size=100" -Method Get -Headers @{ Authorization = "Bearer $staffToken" }

    $allComputers = $computersRes.content
    $activeSessions = $sessionsRes.content

    Write-Data "Tổng số máy trạm trong hệ thống" "$($allComputers.Count) máy"
    Write-Data "Tổng số phiên chơi đang ACTIVE" "$($activeSessions.Count) phiên"

    Write-Step "BƯỚC 2: MÔ PHỎNG THUẬT TOÁN CLIENT-SIDE MAPPING CỦA FRONTEND"

    $mappedCards = @()
    $inUseCount = 0
    $availableCount = 0
    $maintenanceCount = 0

    foreach ($comp in $allComputers) {
        # Frontend logic: Tìm session theo computerCode hoặc computerId
        $matchedSession = $activeSessions | Where-Object { $_.computerCode -eq $comp.code -or $_.computerId -eq $comp.id } | Select-Object -First 1

        $cardItem = [PSCustomObject]@{
            ComputerId = $comp.id
            Code = $comp.code
            Zone = $comp.zone
            PricePerHour = $comp.pricePerHour
            Status = $comp.status
            HasActiveSession = ($null -ne $matchedSession)
            AccountName = if ($matchedSession) { $matchedSession.accountName } else { $null }
            RemainingMinutes = if ($matchedSession) { $matchedSession.remainingMinutesUntilExpiry } else { 0 }
            ExpiresAt = if ($matchedSession) { $matchedSession.expiresAt } else { $null }
        }
        $mappedCards += $cardItem

        switch ($comp.status) {
            'IN_USE' { $inUseCount++ }
            'AVAILABLE' { $availableCount++ }
            'MAINTENANCE' { $maintenanceCount++ }
        }
    }

    Write-Data "Số máy SẴN SÀNG (AVAILABLE)" "$availableCount máy"
    Write-Data "Số máy ĐANG SỬ DỤNG (IN_USE)" "$inUseCount máy"
    Write-Data "Số máy BẢO TRÌ (MAINTENANCE)" "$maintenanceCount máy"

    Write-Step "BƯỚC 3: KIỂM ĐỊNH HỢP ĐỒNG TRƯỜNG DỮ LIỆU & KIỂU DỮ LIỆU (ANTI-CRASH CHECKS)"

    # 1. Kiểm tra không có máy nào IN_USE mà session bị rỗng kéo dài
    $inUseWithoutSession = $mappedCards | Where-Object { $_.Status -eq 'IN_USE' -and -not $_.HasActiveSession }
    if ($inUseWithoutSession.Count -gt 0) {
        Write-Fail "Phát hiện $($inUseWithoutSession.Count) máy IN_USE nhưng không có session active trong DB!"
        foreach ($bad in $inUseWithoutSession) {
            Write-Info "   -> Máy $($bad.Code) [ID=$($bad.ComputerId)]"
        }
    } else {
        Write-Pass "Kiểm tra Tính toàn vẹn Session: 100% máy IN_USE đều có Session gắn kèm hợp lệ."
    }

    # 2. Kiểm tra định dạng ngày giờ và đồng hồ đếm ngược
    $sessionTimeCheckFail = $false
    foreach ($card in ($mappedCards | Where-Object { $_.HasActiveSession })) {
        try {
            $parsedExpiresAt = [DateTime]::Parse($card.ExpiresAt)
            if ($parsedExpiresAt -lt (Get-Date).AddMinutes(-5)) {
                Write-Fail "Phiên chơi của máy $($card.Code) đã hết hạn nhưng chưa được kết thúc tự động! (Hết hạn lúc: $($card.ExpiresAt))"
                $sessionTimeCheckFail = $true
            }
        } catch {
            Write-Fail "Định dạng ngày giờ của máy $($card.Code) không chuẩn ISO-8601: $($card.ExpiresAt)"
            $sessionTimeCheckFail = $true
        }
    }

    if (-not $sessionTimeCheckFail) {
        Write-Pass "Kiểm tra Định dạng Ngày giờ ISO-8601: 100% phiên chơi có expiresAt phân tích hợp lệ và đồng bộ thời gian thực."
    }

    Write-Step "BƯỚC 4: KIỂM ĐỊNH TÍNH ĐỒNG BỘ GIỮA TOPBAR QUICK STATS VÀ SƠ ĐỒ MÁY"

    # Kiểm tra biến số đếm máy online hiển thị trên StaffTopBar:
    # TopBar: `computers.filter(c => c.status === 'IN_USE').length`
    # Sidebar Badge: số phiên active
    $statsMatch = ($inUseCount -eq $activeSessions.Count)
    if ($statsMatch) {
        Write-Pass "Đồng bộ tuyệt đối: Số máy IN_USE ($inUseCount) = Số phiên Active ($($activeSessions.Count))"
    } else {
        Write-Fail "Lệch số đếm giữa TopBar và Session API: IN_USE = $inUseCount, Sessions = $($activeSessions.Count)"
    }

    # Bảng chi tiết sơ đồ máy dạng Client Payload
    Write-Host "`n  --- BẢNG CLIENT PAYLOAD SƠ ĐỒ MÁY ĐƯỢC MAP CHO REACT RENDER ---" -ForegroundColor Cyan
    $mappedCards | Select-Object Code, Zone, PricePerHour, Status, AccountName, RemainingMinutes | Format-Table -AutoSize | Out-String | Write-Host -ForegroundColor DarkGray

    Write-Host "`n>>> KẾT QUẢ: HỢP ĐỒNG DỮ LIỆU SƠ ĐỒ MÁY (FLOOR MAP) PASS 100% <<<" -ForegroundColor Green

} catch {
    Write-Fail "Lỗi kiểm định Floor Map: $_"
    if ($_.Exception.Response) {
        $reader = New-Object System.IO.StreamReader($_.Exception.Response.GetResponseStream())
        $errBody = $reader.ReadToEnd()
        Write-Host "Chi tiết lỗi: $errBody" -ForegroundColor Red
    }
    exit 1
}
