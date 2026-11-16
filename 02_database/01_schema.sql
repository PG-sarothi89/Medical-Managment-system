-- ==========================================================
-- CURO MEDICAL MANAGEMENT SYSTEM — PRODUCTION DATABASE SCHEMA
-- Compatible with PostgreSQL 14+, MySQL 8.0+, SQLite 3
-- ==========================================================

-- ----------------------------------------------------------
-- 1. SECURITY & ACCESS CONTROL (RBAC)
-- ----------------------------------------------------------

CREATE TABLE IF NOT EXISTS roles (
    id VARCHAR(32) PRIMARY KEY,
    name VARCHAR(64) NOT NULL,
    description VARCHAR(255),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS users (
    id VARCHAR(36) PRIMARY KEY,
    username VARCHAR(64) NOT NULL UNIQUE,
    email VARCHAR(128) NOT NULL UNIQUE,
    password_hash VARCHAR(255) NOT NULL,
    name VARCHAR(128) NOT NULL,
    designation VARCHAR(128) NOT NULL,
    role_id VARCHAR(32) NOT NULL REFERENCES roles(id) ON UPDATE CASCADE,
    phone VARCHAR(32),
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- ----------------------------------------------------------
-- 2. PHARMACEUTICAL MASTER CATALOG
-- ----------------------------------------------------------

CREATE TABLE IF NOT EXISTS categories (
    id VARCHAR(36) PRIMARY KEY,
    name VARCHAR(128) NOT NULL UNIQUE,
    parent_id VARCHAR(36) REFERENCES categories(id) ON DELETE SET NULL,
    description TEXT
);

CREATE TABLE IF NOT EXISTS manufacturers (
    id VARCHAR(36) PRIMARY KEY,
    name VARCHAR(150) NOT NULL UNIQUE,
    contact_info TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS suppliers (
    id VARCHAR(36) PRIMARY KEY,
    name VARCHAR(150) NOT NULL,
    contact_person VARCHAR(100),
    phone VARCHAR(32) NOT NULL,
    email VARCHAR(128),
    address TEXT,
    tax_number VARCHAR(64),
    credit_period_days INT DEFAULT 30,
    outstanding_balance DECIMAL(12,2) DEFAULT 0.00,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS medicines (
    id VARCHAR(36) PRIMARY KEY,
    name VARCHAR(150) NOT NULL,
    generic_name VARCHAR(150) NOT NULL,
    category_id VARCHAR(36) NOT NULL REFERENCES categories(id),
    manufacturer_id VARCHAR(36) NOT NULL REFERENCES manufacturers(id),
    composition VARCHAR(255),
    dosage_form VARCHAR(50) NOT NULL,
    strength VARCHAR(50),
    barcode VARCHAR(64) UNIQUE,
    hsn_code VARCHAR(32),
    requires_prescription BOOLEAN DEFAULT FALSE,
    reorder_level INT DEFAULT 50,
    reorder_quantity INT DEFAULT 100,
    rack_location VARCHAR(64),
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- ----------------------------------------------------------
-- 3. INVENTORY & FEFO BATCH TRACKING
-- ----------------------------------------------------------

CREATE TABLE IF NOT EXISTS batches (
    id VARCHAR(36) PRIMARY KEY,
    medicine_id VARCHAR(36) NOT NULL REFERENCES medicines(id),
    supplier_id VARCHAR(36) NOT NULL REFERENCES suppliers(id),
    batch_number VARCHAR(64) NOT NULL,
    manufacture_date DATE NOT NULL,
    expiry_date DATE NOT NULL,
    cost_price DECIMAL(10,2) NOT NULL CHECK (cost_price >= 0),
    selling_price DECIMAL(10,2) NOT NULL CHECK (selling_price >= 0),
    mrp DECIMAL(10,2) NOT NULL CHECK (mrp >= selling_price),
    quantity_received INT NOT NULL CHECK (quantity_received >= 0),
    quantity_available INT NOT NULL CHECK (quantity_available >= 0),
    rack_location VARCHAR(64),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS inventory_movements (
    id VARCHAR(36) PRIMARY KEY,
    medicine_id VARCHAR(36) NOT NULL REFERENCES medicines(id),
    batch_id VARCHAR(36) NOT NULL REFERENCES batches(id),
    movement_type VARCHAR(32) NOT NULL, -- PURCHASE, SALE, RETURN, ADJUSTMENT, EXPIRED
    quantity INT NOT NULL,
    balance_after INT NOT NULL,
    reference_type VARCHAR(32) NOT NULL, -- PO, INV, MANUAL
    reference_id VARCHAR(64) NOT NULL,
    user_id VARCHAR(36) REFERENCES users(id),
    notes VARCHAR(255),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- ----------------------------------------------------------
-- 4. PATIENTS, DOCTORS & PRESCRIPTIONS
-- ----------------------------------------------------------

CREATE TABLE IF NOT EXISTS customers (
    id VARCHAR(36) PRIMARY KEY,
    name VARCHAR(128) NOT NULL,
    phone VARCHAR(32) NOT NULL UNIQUE,
    email VARCHAR(128),
    address TEXT,
    date_of_birth DATE,
    credit_limit DECIMAL(10,2) DEFAULT 0.00,
    outstanding_balance DECIMAL(10,2) DEFAULT 0.00,
    loyalty_points INT DEFAULT 0,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS doctors (
    id VARCHAR(36) PRIMARY KEY,
    name VARCHAR(128) NOT NULL,
    specialization VARCHAR(128) NOT NULL,
    license_number VARCHAR(64) NOT NULL UNIQUE,
    phone VARCHAR(32),
    chamber VARCHAR(255),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS prescriptions (
    id VARCHAR(36) PRIMARY KEY,
    customer_id VARCHAR(36) NOT NULL REFERENCES customers(id),
    doctor_id VARCHAR(36) NOT NULL REFERENCES doctors(id),
    prescription_date DATE NOT NULL,
    notes TEXT,
    status VARCHAR(32) DEFAULT 'Pending',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS prescription_items (
    id VARCHAR(36) PRIMARY KEY,
    prescription_id VARCHAR(36) NOT NULL REFERENCES prescriptions(id) ON DELETE CASCADE,
    medicine_id VARCHAR(36) NOT NULL REFERENCES medicines(id),
    dosage VARCHAR(64) NOT NULL,
    duration_days INT NOT NULL,
    quantity_prescribed INT NOT NULL
);

-- ----------------------------------------------------------
-- 5. PURCHASES & PROCUREMENT
-- ----------------------------------------------------------

CREATE TABLE IF NOT EXISTS purchase_orders (
    id VARCHAR(36) PRIMARY KEY,
    po_number VARCHAR(64) NOT NULL UNIQUE,
    supplier_id VARCHAR(36) NOT NULL REFERENCES suppliers(id),
    order_date DATE NOT NULL,
    expected_date DATE,
    total_amount DECIMAL(12,2) NOT NULL,
    status VARCHAR(32) DEFAULT 'Ordered',
    created_by VARCHAR(36) NOT NULL REFERENCES users(id),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS purchase_order_items (
    id VARCHAR(36) PRIMARY KEY,
    po_id VARCHAR(36) NOT NULL REFERENCES purchase_orders(id) ON DELETE CASCADE,
    medicine_id VARCHAR(36) NOT NULL REFERENCES medicines(id),
    ordered_qty INT NOT NULL,
    received_qty INT DEFAULT 0,
    unit_price DECIMAL(10,2) NOT NULL,
    subtotal DECIMAL(12,2) NOT NULL
);

CREATE TABLE IF NOT EXISTS purchases (
    id VARCHAR(36) PRIMARY KEY,
    po_id VARCHAR(36) REFERENCES purchase_orders(id) ON DELETE SET NULL,
    supplier_id VARCHAR(36) NOT NULL REFERENCES suppliers(id),
    invoice_number VARCHAR(64) NOT NULL,
    purchase_date DATE NOT NULL,
    total_amount DECIMAL(12,2) NOT NULL,
    payment_status VARCHAR(32) DEFAULT 'Unpaid',
    created_by VARCHAR(36) NOT NULL REFERENCES users(id),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- ----------------------------------------------------------
-- 6. POINT OF SALE (POS), INVOICING & FINANCIALS
-- ----------------------------------------------------------

CREATE TABLE IF NOT EXISTS sales (
    id VARCHAR(36) PRIMARY KEY,
    invoice_number VARCHAR(64) NOT NULL UNIQUE,
    customer_id VARCHAR(36) REFERENCES customers(id),
    prescription_id VARCHAR(36) REFERENCES prescriptions(id),
    subtotal DECIMAL(10,2) NOT NULL,
    discount_amount DECIMAL(10,2) DEFAULT 0.00,
    tax_amount DECIMAL(10,2) DEFAULT 0.00,
    total_amount DECIMAL(10,2) NOT NULL,
    payment_mode VARCHAR(32) NOT NULL,
    payment_status VARCHAR(32) NOT NULL,
    served_by VARCHAR(36) NOT NULL REFERENCES users(id),
    sale_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS sale_items (
    id VARCHAR(36) PRIMARY KEY,
    sale_id VARCHAR(36) NOT NULL REFERENCES sales(id) ON DELETE CASCADE,
    medicine_id VARCHAR(36) NOT NULL REFERENCES medicines(id),
    batch_id VARCHAR(36) NOT NULL REFERENCES batches(id),
    quantity INT NOT NULL CHECK (quantity > 0),
    unit_price DECIMAL(10,2) NOT NULL,
    subtotal DECIMAL(10,2) NOT NULL
);

CREATE TABLE IF NOT EXISTS payments (
    id VARCHAR(36) PRIMARY KEY,
    sale_id VARCHAR(36) NOT NULL REFERENCES sales(id),
    customer_id VARCHAR(36) REFERENCES customers(id),
    amount DECIMAL(10,2) NOT NULL,
    method VARCHAR(32) NOT NULL,
    transaction_ref VARCHAR(128),
    received_by VARCHAR(36) NOT NULL REFERENCES users(id),
    payment_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS returns (
    id VARCHAR(36) PRIMARY KEY,
    sale_id VARCHAR(36) NOT NULL REFERENCES sales(id),
    medicine_id VARCHAR(36) NOT NULL REFERENCES medicines(id),
    batch_id VARCHAR(36) NOT NULL REFERENCES batches(id),
    quantity INT NOT NULL,
    refund_amount DECIMAL(10,2) NOT NULL,
    reason VARCHAR(255),
    processed_by VARCHAR(36) NOT NULL REFERENCES users(id),
    return_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS audit_logs (
    id VARCHAR(36) PRIMARY KEY,
    user_id VARCHAR(36) REFERENCES users(id),
    user_name VARCHAR(128) NOT NULL,
    action VARCHAR(64) NOT NULL,
    table_name VARCHAR(64) NOT NULL,
    record_id VARCHAR(64) NOT NULL,
    details TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- ----------------------------------------------------------
-- 7. PERFORMANCE SPEED INDEXES
-- ----------------------------------------------------------

CREATE INDEX IF NOT EXISTS idx_med_barcode ON medicines(barcode);
CREATE INDEX IF NOT EXISTS idx_batch_fefo ON batches(medicine_id, expiry_date, quantity_available);
CREATE INDEX IF NOT EXISTS idx_sales_inv ON sales(invoice_number);
CREATE INDEX IF NOT EXISTS idx_cust_phone ON customers(phone);
CREATE INDEX IF NOT EXISTS idx_movements_med ON inventory_movements(medicine_id, batch_id);
