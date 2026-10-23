-- =============================================================================
-- V4__add_image_url_to_items.sql: Bổ sung cột image_url và ảnh mẫu cho bảng items
-- =============================================================================

SET @col_exists = (
    SELECT COUNT(*) 
    FROM INFORMATION_SCHEMA.COLUMNS 
    WHERE TABLE_SCHEMA = DATABASE() 
      AND TABLE_NAME = 'items' 
      AND COLUMN_NAME = 'image_url'
);

SET @stmt = IF(@col_exists = 0, 
    'ALTER TABLE items ADD COLUMN image_url VARCHAR(500) NULL', 
    'SELECT 1'
);

PREPARE add_col_stmt FROM @stmt;
EXECUTE add_col_stmt;
DEALLOCATE PREPARE add_col_stmt;

-- Cập nhật ảnh mẫu cho các món có sẵn từ V2__initial_seed_data.sql hoặc dữ liệu hiện có
UPDATE items 
SET image_url = 'https://images.unsplash.com/photo-1569718212165-3a8278d5f624?w=500&auto=format&fit=crop&q=80'
WHERE (id = 1 OR name LIKE '%Mì tôm%' OR name LIKE '%mì%') AND (image_url IS NULL OR image_url = '');

UPDATE items 
SET image_url = 'https://images.unsplash.com/photo-1603133872878-684f208fb84b?w=500&auto=format&fit=crop&q=80'
WHERE (id = 2 OR name LIKE '%Cơm%') AND (image_url IS NULL OR image_url = '');

UPDATE items 
SET image_url = 'https://images.unsplash.com/photo-1622483767028-3f66f32aef97?w=500&auto=format&fit=crop&q=80'
WHERE (id = 3 OR name LIKE '%Sting%') AND (image_url IS NULL OR image_url = '');

UPDATE items 
SET image_url = 'https://images.unsplash.com/photo-1556679343-c7306c1976bc?w=500&auto=format&fit=crop&q=80'
WHERE (id = 4 OR name LIKE '%Trà tắc%') AND (image_url IS NULL OR image_url = '');

UPDATE items 
SET image_url = 'https://images.unsplash.com/photo-1517701550927-30cf4ba1dba5?w=500&auto=format&fit=crop&q=80'
WHERE (id = 5 OR name LIKE '%Cà phê%') AND (image_url IS NULL OR image_url = '');

UPDATE items 
SET image_url = 'https://images.unsplash.com/photo-1538481199705-c710c4e965fc?w=500&auto=format&fit=crop&q=80'
WHERE (id = 6 OR id = 7 OR type = 'PLAYTIME' OR name LIKE '%giờ%') AND (image_url IS NULL OR image_url = '');

UPDATE items 
SET image_url = 'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?w=500&auto=format&fit=crop&q=80'
WHERE type = 'FOOD' AND (image_url IS NULL OR image_url = '');

UPDATE items 
SET image_url = 'https://images.unsplash.com/photo-1513558161293-cdaf765ed2fd?w=500&auto=format&fit=crop&q=80'
WHERE type = 'DRINK' AND (image_url IS NULL OR image_url = '');
