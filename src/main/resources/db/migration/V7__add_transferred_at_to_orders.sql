-- ===================================================================
-- Flyway Migration V7: Add/Modify transferred_at on orders table
-- ===================================================================

ALTER TABLE orders MODIFY COLUMN transferred_at DATETIME NULL;
