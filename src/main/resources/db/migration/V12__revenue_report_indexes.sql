CREATE INDEX idx_orders_status_confirmed_at ON orders (status, confirmed_at);
CREATE INDEX idx_time_purchases_status_confirmed_at ON time_purchases (status, confirmed_at);
