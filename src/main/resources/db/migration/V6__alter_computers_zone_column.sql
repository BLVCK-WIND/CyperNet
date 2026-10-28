-- ===================================================================
-- Flyway Migration V6: Ensure computers.zone is VARCHAR(50) for Dynamic Zones
-- ===================================================================

ALTER TABLE computers MODIFY COLUMN zone VARCHAR(50) NOT NULL DEFAULT 'STANDARD';
