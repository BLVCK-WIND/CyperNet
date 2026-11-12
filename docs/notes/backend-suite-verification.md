# Full backend suite verification — 2026-11-09

## Result

The complete Maven test run passed: **144 tests across 27 classes; 0 failures, 0 errors, 0 skipped**. This includes legacy backend integration tests and the ownership/billing regression tests. A separate read-only metadata check confirmed all **24 databases recorded in the final run were removed**. The configured cafe database was not used or migrated.

## Changes made during this verification

- Added a Spring test context customizer that gives each legacy integration-test class its own UUID-named database, migrated through Flyway and validated by Hibernate. This is the default for ordinary `mvn test`; the billing-specific integration class retains its own isolated setup.
- Limited test connection pools to four connections with no minimum idle pool, preventing retained test contexts from exhausting the local server.
- Created the menu-test customer explicitly instead of assuming it existed in a developer database.
- Separated existing-but-wrong customer phone tests from unknown-phone tests. Added an explicit unknown-phone 404 check that verifies no account is created.
- Compared migration versions using Flyway's version API, allowing versions such as 11.1.
- Gave rate-limit tests their own login account instead of depending on a seeded administrator password. Success and HTTP 429 assertions remain intact.
- Supplied a valid IP address in the invalid-price test, ensuring only the intended validation rule fails rather than relying on constraint-error ordering.

No application production code was changed during this verification stage. No tests were disabled or skipped to obtain the result.

## Reproducing

Run `mvn test` from the repository root using the installed Maven binary. The test harness reads the local connection credentials from application-dev.properties, requires permission to create/drop test schemas, and uses only UUID-named test databases. Credentials are not printed by the harness. Reports are generated under target/surefire-reports. Test cleanup is restricted to schemas created by the harness.

## Remaining work

Browser/mobile QA and rehearsal against a restored copy of the actual cafe database remain separate deployment gates. This result verifies the backend suite on the local MariaDB server; it is not a production migration or a claim of browser verification.
