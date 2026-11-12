# Database migration rollout

## Changes

V6.1 adds missing orders.transferred_at, computer_id and account_id, foreign keys, and nullable session_id before existing V7/V9 execute. V10 reconciles databases that already passed V9 and backfills missing links. Both scripts inspect schema metadata before adding columns/foreign keys. Previously applied migration files are unchanged.

## Fresh installation

Use an empty disposable MySQL schema with the normal migration locations and `spring.jpa.hibernate.ddl-auto=validate`. Flyway must reach V12 before application use. Verify session-linked and sessionless orders. Repeat startup and confirm no pending migrations.

## Existing installation

1. Back up schema, data and flyway_schema_history; restore to a disposable schema first.
2. Inspect applied versions, checksums, existing columns, foreign keys and orphaned references. Resolve unexpected drift rather than automatically repairing history.
3. For the single controlled upgrade, set `SPRING_FLYWAY_OUT_OF_ORDER=true` and `SPRING_JPA_HIBERNATE_DDL_AUTO=validate`. This permits V6.1 to run on databases already beyond V6, followed by V10.
4. Verify preserved row counts, nullability, FK integrity and backfilled links; exercise both ordering modes.
5. Remove the out-of-order override and restart with validation. Repeat the verified procedure for the real deployment after backup.

A missing historical zone catalog entry must be reconciled before assigning that zone to a machine. Inactive historical zones can remain assigned.

## Recovery and evidence

MySQL DDL can leave partial schema changes. Before retrying a failed migration, inspect the schema and Flyway history. V6.1 and V10 have metadata guards. V12 runs two separate CREATE INDEX statements, so check which indexes exist before retrying. Repair only the failed history entry after checking the cause. Restore the verified backup for rollback.

Fresh-install and synthetic-upgrade checks passed in the backend suite. A restored copy of the configured local V9 cafe database also passed migration to V11.1, row-count/snapshot/link checks, repeat Flyway validation and Hibernate startup. See `docs/notes/migration-rehearsal.md` for evidence and limits. The live database has not been upgraded.

## Billing snapshot rollout (V11 / V11.1)

Flyway now runs before Hibernate validation. V11 adds immutable billing snapshots; V11.1 backfills legacy package benefits. Java migration classes under src/main/java/db/migration must be included in the packaged application. Review active-session tariffs and pending package names before upgrading: past edits cannot be reconstructed automatically. Back up first. New snapshots reflect the legacy values available at migration time.

The ownership/billing test suite now includes disposable local MariaDB databases accessed via JDBC, covering clean installation and V10-to-V11.1 upgrade with historical records, validation, repeat startup and concurrent billing requests. This supersedes the earlier statement that no disposable database testing was possible. The subsequent local cafe database copy rehearsal is recorded in `docs/notes/migration-rehearsal.md`.

## Revenue report indexes (V12)

V12 adds `(status, confirmed_at)` indexes to `orders` and `time_purchases`. It applies in normal order from V11.1. The application writes timestamps in Vietnam wall time after startup. V12 leaves historical timestamp values as stored, so review any periods previously written by a JVM running in another time zone before relying on daily totals.
