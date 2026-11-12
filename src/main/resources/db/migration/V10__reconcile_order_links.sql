-- Idempotent prerequisites: preserve applied migrations and existing data.
SET @ddl = IF((SELECT COUNT(*) FROM information_schema.columns WHERE table_schema = DATABASE() AND table_name = 'orders' AND column_name = 'transferred_at') = 0, 'ALTER TABLE orders ADD COLUMN transferred_at DATETIME NULL', 'SELECT 1');
PREPARE schema_stmt FROM @ddl;
EXECUTE schema_stmt;
DEALLOCATE PREPARE schema_stmt;
SET @ddl = IF((SELECT COUNT(*) FROM information_schema.columns WHERE table_schema = DATABASE() AND table_name = 'orders' AND column_name = 'computer_id') = 0, 'ALTER TABLE orders ADD COLUMN computer_id BIGINT NULL', 'SELECT 1');
PREPARE schema_stmt FROM @ddl;
EXECUTE schema_stmt;
DEALLOCATE PREPARE schema_stmt;
SET @ddl = IF((SELECT COUNT(*) FROM information_schema.columns WHERE table_schema = DATABASE() AND table_name = 'orders' AND column_name = 'account_id') = 0, 'ALTER TABLE orders ADD COLUMN account_id BIGINT NULL', 'SELECT 1');
PREPARE schema_stmt FROM @ddl;
EXECUTE schema_stmt;
DEALLOCATE PREPARE schema_stmt;
ALTER TABLE orders MODIFY COLUMN session_id BIGINT NULL;
SET @ddl = IF((SELECT COUNT(*) FROM information_schema.key_column_usage WHERE table_schema = DATABASE() AND table_name = 'orders' AND column_name = 'computer_id' AND referenced_table_name = 'computers') = 0, 'ALTER TABLE orders ADD CONSTRAINT fk_orders_computers FOREIGN KEY (computer_id) REFERENCES computers(id)', 'SELECT 1');
PREPARE schema_stmt FROM @ddl;
EXECUTE schema_stmt;
DEALLOCATE PREPARE schema_stmt;
SET @ddl = IF((SELECT COUNT(*) FROM information_schema.key_column_usage WHERE table_schema = DATABASE() AND table_name = 'orders' AND column_name = 'account_id' AND referenced_table_name = 'accounts') = 0, 'ALTER TABLE orders ADD CONSTRAINT fk_orders_accounts FOREIGN KEY (account_id) REFERENCES accounts(id)', 'SELECT 1');
PREPARE schema_stmt FROM @ddl;
EXECUTE schema_stmt;
DEALLOCATE PREPARE schema_stmt;
UPDATE orders o JOIN sessions s ON o.session_id = s.id
SET o.computer_id = COALESCE(o.computer_id, s.computer_id),
    o.account_id = COALESCE(o.account_id, s.account_id);
