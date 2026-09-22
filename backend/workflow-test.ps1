$ErrorActionPreference = 'Stop'
$base = 'http://localhost:5000/api'
$results = [System.Collections.ArrayList]::new()

function Log($msg) { Write-Host "[TEST] $msg" }

function Login($email, $password) {
  $body = @{ email = $email; password = $password } | ConvertTo-Json
  $resp = Invoke-RestMethod -Uri "$base/auth/login" -Method Post -ContentType 'application/json' -Body $body
  return $resp
}

$headersLani = @{}
$headersArun = @{}

try {
  # 1. Login both
  $lani = Login 'lani@borrowbox.com' 'Lani@123'
  $arun = Login 'arun@borrowbox.com' 'Arun@123'
  $headersLani = @{ Authorization = "Bearer $($lani.token)" }
  $headersArun = @{ Authorization = "Bearer $($arun.token)" }
  Log "1. Logged in Lani + Arun"

  # 2. Discover scientific calculator
  $items = Invoke-RestMethod -Uri "$base/items?search=calculator" -Method Get
  $calc = $items.items | Where-Object { $_.name -eq 'Scientific Calculator' } | Select-Object -First 1
  if (-not $calc) { throw 'Calculator not found in discover' }
  Log "2. Found: $($calc.name) (id=$($calc._id))"

  # 3. Lani requests to borrow
  $reqBody = @{ itemId = $calc._id; reason = "I need it for tomorrow's mathematics exam."; requestedDuration = '1 day' } | ConvertTo-Json
  $createdReq = Invoke-RestMethod -Uri "$base/borrow-requests" -Method Post -ContentType 'application/json' -Body $reqBody -Headers $headersLani
  if ($createdReq.request.status -ne 'PENDING') { throw "Expected PENDING, got $($createdReq.request.status)" }
  Log "3. Lani sent request -> $($createdReq.request.status)"

  # 4. Duplicate protection
  $dupBlocked = $false
  try {
    Invoke-RestMethod -Uri "$base/borrow-requests" -Method Post -ContentType 'application/json' -Body $reqBody -Headers $headersLani | Out-Null
  } catch { $dupBlocked = $true }
  if (-not $dupBlocked) { throw 'Duplicate request was not blocked' }
  Log "3b. Duplicate request blocked"

  # 5. Arun sees received request
  $received = Invoke-RestMethod -Uri "$base/borrow-requests/received" -Method Get -Headers $headersArun
  $laniReq = $received.requests | Where-Object { $_.borrowerId.name -eq 'Lani' -and $_.itemId.name -eq 'Scientific Calculator' } | Select-Object -First 1
  if (-not $laniReq) { throw 'Arun cannot see Lanis request' }
  Log "5. Arun received request from $($laniReq.borrowerId.name)"
  $requestId = $laniReq._id

  # 6. Arun accepts
  $accepted = Invoke-RestMethod -Uri "$base/borrow-requests/$requestId/accept" -Method Put -Headers $headersArun
  if ($accepted.request.status -ne 'ACCEPTED') { throw "Expected ACCEPTED, got $($accepted.request.status)" }
  Log "6. Arun accepted -> $($accepted.request.status)"

  # verify item now RESERVED
  $itemAfterAccept = Invoke-RestMethod -Uri "$base/items/$($calc._id)" -Method Get
  if ($itemAfterAccept.item.status -ne 'RESERVED') { throw "Expected item RESERVED, got $($itemAfterAccept.item.status)" }
  Log "6b. Item now RESERVED"

  # 7. Think we also need to verify that the item no longer shows in discover.
  $discoverAgain = Invoke-RestMethod -Uri "$base/items?search=calculator" -Method Get
  $visible = $discoverAgain.items | Where-Object { $_.name -eq 'Scientific Calculator' }
  if ($visible) { throw 'Reserved item should not appear in discover' }
  Log "7. Reserved item hidden from Discover"

  # 8. Arun generates handover QR
  $handover = Invoke-RestMethod -Uri "$base/transactions/handover/$requestId/generate" -Method Post -Headers $headersArun
  if (-not $handover.qr -or -not $handover.code) { throw 'QR or code missing' }
  Log "8. Handover QR generated, code=$($handover.code)"

  # 9. Lani verifies handover (scans/enters code)
  $verifyBody = @{ code = $handover.code } | ConvertTo-Json
  $verified = Invoke-RestMethod -Uri "$base/transactions/handover/$requestId/verify" -Method Post -ContentType 'application/json' -Body $verifyBody -Headers $headersLani
  if ($verified.transaction.status -ne 'BORROWED') { throw "Expected BORROWED, got $($verified.transaction.status)" }
  $transactionId = $verified.transaction._id
  Log "9. Handover verified -> BORROWED (txn=$transactionId)"

  # 10. Lani sees active borrowing
  $myTransactions = Invoke-RestMethod -Uri "$base/transactions/my" -Method Get -Headers $headersLani
  Log "10. Lani transactions: $($myTransactions.transactions.Count)"

  # 11. Lani requests return
  $ret = Invoke-RestMethod -Uri "$base/transactions/$transactionId/request-return" -Method Post -Headers $headersLani
  if ($ret.transaction.status -ne 'RETURN_REQUESTED') { throw "Expected RETURN_REQUESTED, got $($ret.transaction.status)" }
  Log "11. Lani requested return -> $($ret.transaction.status)"

  # 12. Arun sees and confirms return
  $owned = Invoke-RestMethod -Uri "$base/transactions/owned" -Method Get -Headers $headersArun
  $rr = $owned.transactions | Where-Object { $_._id -eq $transactionId } | Select-Object -First 1
  if ($rr.status -ne 'RETURN_REQUESTED') { throw 'Arun should see RETURN_REQUESTED' }
  $confirmed = Invoke-RestMethod -Uri "$base/transactions/$transactionId/confirm-return" -Method Put -Headers $headersArun
  if ($confirmed.transaction.status -ne 'RETURNED') { throw "Expected RETURNED got $($confirmed.transaction.status)" }
  Log "12. Arun confirmed return -> $($confirmed.transaction.status)"

  # 13. Item back to AVAILABLE
  $itemEnd = Invoke-RestMethod -Uri "$base/items/$($calc._id)" -Method Get
  if ($itemEnd.item.status -ne 'AVAILABLE') { throw "Expected AVAILABLE, got $($itemEnd.item.status)" }
  Log "13. Item back to AVAILABLE"

  # 14. Both review
  $revLani = @{ transactionId = $transactionId; rating = 5; comment = 'Perfect item, exactly as described!' } | ConvertTo-Json
  $revArun = @{ transactionId = $transactionId; rating = 5; comment = 'Lani returned it on time and in great condition.' } | ConvertTo-Json
  $r1 = Invoke-RestMethod -Uri "$base/reviews" -Method Post -ContentType 'application/json' -Body $revLani -Headers $headersLani
  $r2 = Invoke-RestMethod -Uri "$base/reviews" -Method Post -ContentType 'application/json' -Body $revArun -Headers $headersArun
  Log "14. Both reviews submitted -> ratings $($r1.review.rating) + $($r2.review.rating)" 

  # 15. Reputation reflects ratings
  $repArun = Invoke-RestMethod -Uri "$base/users/$($arun.user.id)/reputation" -Method Get
  $repLani = Invoke-RestMethod -Uri "$base/users/$($lani.user.id)/reputation" -Method Get
  Log "15. Arun reputation: rating=$($repArun.reputation.rating) trust=$($repArun.reputation.trustScore) lent=$($repArun.reputation.itemsLent) borrowed=$($repArun.reputation.itemsBorrowed)"
  Log "15b. Lani reputation: rating=$($repLani.reputation.rating) trust=$($repLani.reputation.trustScore) borrowed=$($repLani.reputation.itemsBorrowed)"

  # 16. Notifications created
  $notifsLani = Invoke-RestMethod -Uri "$base/notifications?limit=20" -Method Get -Headers $headersLani
  $notifsArun = Invoke-RestMethod -Uri "$base/notifications?limit=20" -Method Get -Headers $headersArun
  Log "16. Lani notifications: $($notifsLani.notifications.Count) unread=$($notifsLani.unreadCount)"
  Log "16b. Arun notifications: $($notifsArun.notifications.Count) unread=$($notifsArun.unreadCount)"

  Write-Host "`n=========================================="
  Write-Host "ALL WORKFLOW TESTS PASSED"
  Write-Host "=========================================="

} catch {
  Write-Host "`n[FAIL] $($_.Exception.Message)" -ForegroundColor Red
  exit 1
}