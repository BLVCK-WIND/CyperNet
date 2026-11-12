# Restored-copy migration rehearsal — 2026-11-09

## Result

The configured local cafe database was read through a read-only JDBC connection and copied into a disposable `cybernet_rehearsal_<uuid>` schema. All 11 source tables used InnoDB; data reads used a repeatable-read transaction. This was a temporary schema/data copy, not a retained recovery backup or a verification of a production backup tool. No migration, repair or business write was issued to the source database.

The source migration history was at V9, with baseline 0 and V1–V9 recorded successfully. Flyway validated existing checksums and applied V6.1 out of order, V10, V11 and V11.1 to the copy. No repair was needed.

## Acceptance checks

- Preserved business-table row counts before application startup: accounts 27, audit_logs 456, computers 10, items 10, order_items 32, orders 26, refresh_tokens 69, sessions 9, time_purchases 6, zones 3. Migration-history rows increased as expected.
- No orphaned order account/computer/session references.
- Item name/type and session tariff snapshots were populated; package snapshots were non-null and playtime benefits positive.
- `orders.session_id` remained nullable for table orders.
- After removing out-of-order mode, Flyway validation and a second migration call passed with zero pending migrations.
- The application started against the migrated copy with Hibernate `ddl-auto=validate` and out-of-order disabled.
- The scheduler closed four already-expired sessions in the copy during startup/shutdown. Counts above were checked before startup; these runtime changes were confined to the disposable copy.
- The temporary application stopped and the schema was dropped; removal was checked through schema metadata.

Local ignored evidence: `target/migration-rehearsal.log` and `target/MigrationRehearsal.java`. No application source changes were required in this stage.

## Deployment sequence

1. Take and verify a recoverable deployment backup covering schema, data and Flyway history; pause application writes for the deployment window.
2. Use out-of-order=true only for the controlled upgrade, with Hibernate validation enabled. Expect V6.1, V10, V11 and V11.1 when upgrading this V9 installation.
3. Verify row counts, references, snapshot values and current migration version; remove out-of-order and restart.
4. Check login, cash/QR orders, staff confirmation and idle/active top-ups. Roll back by restoring the verified backup if acceptance fails.

Historical snapshots preserve values available at upgrade time; older catalog/tariff edits cannot be reconstructed. This rehearsal does not authorize or perform a live upgrade.

## Physical-phone acceptance still pending

Use an isolated staging environment with synthetic accounts and access from the phone on the same trusted network. Do not point test payments at real settlement accounts.

- On Android Chrome and iPhone Safari, scan the table QR with the phone camera and verify the intended PC code.
- Enter an existing customer phone without a password. Unknown phones must show registration guidance; Staff/Admin phones must be rejected.
- Check menu, cart, keyboard, scrolling and bottom navigation in portrait/landscape; verify labels and controls remain reachable.
- Submit cash and QR orders; staff approval must update order status. Failed/duplicate transfer notification must remain visibly rejected.
- Confirm idle top-up refreshes the balance within 15 seconds without starting gaming; confirm active top-up extends the countdown.
- Test background/resume, lost network and retry, logout, and the device reduced-motion setting.

Record device/OS/browser and any failure. Desktop responsive emulation cannot complete this gate; real bank reconciliation also remains a separate acceptance check.
