# Browser and mobile QA — 2026-11-09

Completed against separate localhost servers (8081/5174), synthetic accounts and two disposable UUID-named databases. No cafe database was migrated and no real bank payment was made. QA servers and browser databases were removed after verification.

## Verified workflows

- Customer QR login on active PC-01: existing customer phone only, no password, live countdown and menu. Staff phone rejected with the server's customer-only explanation.
- Cash food order: customer submits, staff reviews the cash warning and approves, customer sees completion.
- QR playtime: staff cannot approve before transfer notification; staff approval extends the active session. Repeated transfer notification is rejected with an error while the QR modal stays open.
- Idle PC-02: customer can order without opening a session. A confirmed two-hour package updates the mobile balance from 120 to 240 standard minutes; PC-02 stays available and minutes are not deducted.
- Staff operational dashboard loads without Admin report access. F&B queue revenue excludes playtime packages.
- Admin dashboard and revenue report load. An 18,000 VND playtime order appears as playtime in the financial breakdown, and as order revenue in the order-versus-POS chart.
- Customer layout inspected at 375px and 390px; final 375px dashboard has readable action labels and no horizontal overflow. Desktop staff/Admin inspected at 1440px. Screenshot evidence: target/qa-customer-mobile.png and target/qa-admin-revenue.png (local ignored artifacts).

## Fixes made during QA

- Failed transfer notifications no longer close the QR modal or invoke the success callback.
- Added authenticated GET /api/accounts/me, returning only the principal's AccountResponse. Idle customer dashboards refresh their own balance every 15 seconds and on window focus. Three integration tests cover ownership, current balance and unauthenticated access.
- Preserved server login errors; added the logout accessible name and fitted idle-table action labels on narrow screens.
- Corrected Staff F&B aggregation and Admin revenue category fields/labels to match the existing report contract.
- Replaced deprecated Ant Design Tag, Modal, Select, Progress and queue Notification props encountered during QA.

## Validation and remaining gates

- Full backend suite: **147 tests / 28 classes; zero failures, errors or skips**.
- Frontend TypeScript/production build passes. Lint exits successfully with existing React hook warnings; the build retains its large-chunk warning.
- Testing used a desktop browser with responsive viewports. Physical Android/iOS Safari, actual QR scanning/camera behavior, real bank settlement, OS reduced-motion behavior and a restored cafe database migration rehearsal remain unverified. Session transfer/end were covered by backend regressions, not exercised again in this browser pass.
- Next: rehearse migrations on a restored cafe database copy, then physical-device acceptance testing before deployment.
