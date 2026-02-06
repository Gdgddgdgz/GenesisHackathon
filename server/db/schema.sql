CREATE TABLE IF NOT EXISTS products (
  id SERIAL PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  sku VARCHAR(50) UNIQUE NOT NULL,
  category VARCHAR(100),
  unit_price DECIMAL(10, 2) NOT NULL,
  current_stock INTEGER DEFAULT 0,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS thresholds (
  product_id INTEGER REFERENCES products(id) ON DELETE CASCADE,
  min_level INTEGER DEFAULT 50,
  max_level INTEGER DEFAULT 200,
  auto_adjust_enabled BOOLEAN DEFAULT TRUE,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (product_id)
);

CREATE TABLE IF NOT EXISTS inventory_transactions (
  id SERIAL PRIMARY KEY,
  product_id INTEGER REFERENCES products(id) ON DELETE CASCADE,
  type VARCHAR(20) CHECK (type IN ('IN', 'OUT', 'ADJUST')),
  quantity INTEGER NOT NULL,
  reason VARCHAR(255),
  timestamp TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Index for faster queries
CREATE INDEX idx_products_sku ON products(sku);
CREATE INDEX idx_transactions_product_id ON inventory_transactions(product_id);

CREATE TABLE IF NOT EXISTS vendors (
  id SERIAL PRIMARY KEY,
  user_id INTEGER, -- Not explicitly referenced for mock flexibility, but used in logic
  name VARCHAR(255) NOT NULL,
  phone VARCHAR(20),
  categories TEXT[], -- Array of product categories they supply
  trust_score INTEGER DEFAULT 80, -- 0 to 100
  last_delivery_time TIMESTAMP,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
