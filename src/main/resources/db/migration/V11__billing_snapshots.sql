-- Legacy snapshots use values available at upgrade; earlier edits cannot be reconstructed.
ALTER TABLE order_items ADD COLUMN item_name_snapshot VARCHAR(255) NULL,
    ADD COLUMN item_type_snapshot VARCHAR(20) NULL,
    ADD COLUMN package_minutes_snapshot INT NULL;
ALTER TABLE sessions ADD COLUMN price_per_hour_snapshot DECIMAL(10,2) NULL;
UPDATE order_items oi JOIN items i ON oi.item_id = i.id
SET oi.item_name_snapshot = i.name, oi.item_type_snapshot = i.type;
UPDATE sessions s JOIN computers c ON s.computer_id = c.id
SET s.price_per_hour_snapshot = c.price_per_hour;
