-- ===================================================================
-- Flyway Migration V8: Expand orders status column to VARCHAR(50)
-- ===================================================================

ALTER TABLE orders MODIFY COLUMN status VARCHAR(50) NOT NULL DEFAULT 'PENDING_PAYMENT';
