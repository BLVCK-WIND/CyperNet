$loginBody = @{ phone = '0902222222'; password = 'staff123' } | ConvertTo-Json
$loginRes = Invoke-RestMethod -Uri 'http://localhost:8080/api/auth/login' -Method Post -Body $loginBody -ContentType 'application/json'
$token = $loginRes.accessToken

$endRes = Invoke-RestMethod -Uri "http://localhost:8080/api/sessions/553/end" -Method Patch -Headers @{ Authorization = "Bearer $token" }
Write-Host "Session 553 Ended: Status = $($endRes.status), Played = $($endRes.playedMinutes)p"
Write-Host "Account Remaining Minutes after endSession: $($endRes.accountRemainingMinutes)"

# Lấy lại account trực tiếp từ DB
$acc = Invoke-RestMethod -Uri 'http://localhost:8080/api/accounts/2' -Method Get -Headers @{ Authorization = "Bearer $token" }
Write-Host "Real DB Account Remaining Minutes: $($acc.remainingMinutes) Standard minutes"
