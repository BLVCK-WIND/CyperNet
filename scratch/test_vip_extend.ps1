$loginBody = @{ phone = '0902222222'; password = 'staff123' } | ConvertTo-Json
$loginRes = Invoke-RestMethod -Uri 'http://localhost:8080/api/auth/login' -Method Post -Body $loginBody -ContentType 'application/json'
$computers = Invoke-RestMethod -Uri 'http://localhost:8080/api/computers?size=100' -Method Get -Headers @{ Authorization = "Bearer $($loginRes.accessToken)" }

foreach ($c in $computers.content) {
    Write-Host "ID: $($c.id) | Code: $($c.code) | Zone: $($c.zone) | Price: $($c.pricePerHour) | Status: $($c.status)"
}
