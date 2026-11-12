# Ownership and billing safety — 2026-11-09

## Late playtime approval — 2026-11-13

An order keeps the session recorded when the customer placed it. If payment is approved after that session ends, the purchased minutes go to the customer's current active session at its recorded tariff. When no session is active, the minutes stay in the account for the next visit. Order approval and counter top-ups use the same credit operation. It locks the account before reading the current session with a row lock and commits the credit with payment confirmation.

On the old build, a confirmed 60-minute order increased the demo balance from 1 to 61 while the new session's expiry stayed fixed. The expiry job then set the balance to 0. On the fixed build, the expiry advanced by 60 minutes at the standard tariff and the session stayed active past its original deadline. Chrome showed the customer countdown update without a reload.

Four regression cases cover a replacement session at a different tariff, approval after expiry, an order placed before any session opened, and concurrent expiry and approval. The existing repeated-confirmation cases also passed. The complete Maven verification passed 190 tests with zero failures, errors or skips on disposable databases.

## Implemented behavior

- Mobile ordering remains phone-only for existing customer accounts. Customer tokens grant access only to that account's session/order resources; this does not introduce a password or OTP.
- Both order selectors (sessionId and computerCode) share a fail-closed ownership rule. Customer cancellation, transfer notification, session-order history and active-session lookup enforce the same rule. Staff/Admin retain operational access.
- Confirmation/cancellation/transfer-notification commands acquire the order or time-purchase row lock before checking state. Repeated terminal commands reject without reapplying credit.
- Balance/lifecycle changes serialize on the customer account, then the session, then affected computers. Starting a session locks the account before checking for an existing active session. Native FOR UPDATE SQL avoids dialect-specific FOR UPDATE OF syntax on the local MariaDB server.
- Scheduler candidates are reloaded under these locks and expiry is rechecked. A session extended after the scan is not closed. Extensions of an expired-but-not-yet-closed session start from the later of now and its previous expiry.
- Order lines snapshot name, item type and standard package minutes at creation. Confirmation and historical item reports use those snapshots. Monetary snapshots remain unitPrice/subtotal/totalAmount.
- Sessions snapshot their current segment's tariff. Top-ups, early-close refunds and transfer conversion use that tariff. A transfer captures the destination tariff for its new segment. Later machine-price edits affect future sessions, not existing purchased time.
- Top-customer reporting includes sessionless orders using order.account with a legacy session-account fallback. Cancelled orders remain excluded from confirmed revenue.
- Flyway explicitly precedes Hibernate initialization, allowing clean-schema validation without ddl-auto=update hiding missing schema.

## Schema and compatibility

V11 adds order-line and session tariff snapshots. V11.1 is a Java migration that freezes legacy package minutes. Existing historical values are reconstructed from data available at upgrade; prices/names/types changed before that point cannot be recovered. Back up before upgrading and inspect active-session tariffs and pending package orders before applying the new snapshots. Public request shapes are unchanged. SessionResponse.pricePerHour now denotes the purchased session tariff; order item names/types reflect the order snapshot.

## Verification

Run isolated checks with the Maven properties:

```
-Dcybernet.isolatedMysql=true -Dtest=IsolatedBillingIntegrationTest,OwnershipAndBillingSafetyTest,MobileCustomerAccessTest,DynamicZoneServiceTest,ErrorClassificationTest
```

The isolated database test reads the development JDBC connection settings without printing credentials, creates UUID-named cybernet_safety_* databases, and removes only its own databases in cleanup. It does not run against the configured application schema.

Coverage includes cross-account actions; sequential replay rejection; simultaneous order confirmation; confirm-versus-cancel; simultaneous time-purchase confirmation; same-account starts on two machines; top-up-versus-expiry; catalog mutation after purchase; fixed session tariffs after machine edits; transfer conversion; sessionless spending; clean migration/validation; V10-to-V11.1 upgrade with historical records; and repeated migration startup.

These targeted checks alone do not establish browser QA. The complete legacy backend suite has since been verified; see backend-suite-verification.md. No production migration or deployment is performed.

### Recorded results

28 targeted tests passed with zero failures/errors/skips: 10 local MariaDB integration tests and 18 isolated service/regression tests. The clean schema migrated to V11.1 under Hibernate validate; the historical V10 fixture upgraded successfully and a second migrate made no changes. Parallel requests produced exactly one confirmation/transition where required. Test-owned schemas were removed by cleanup. Java main/test compilation and git diff --check passed. The cafe database was not migrated.

### Full-suite follow-up

The full backend suite subsequently passed all 144 tests across 27 classes, without skips. Test isolation is now the default and no opt-in property is required. A read-only check confirmed zero remaining schemas from the 24 databases created in that final run. See backend-suite-verification.md for details.
