-- ==========================================================
-- CURO MEDICAL MANAGEMENT SYSTEM — PRODUCTION SEED DATA
-- Populates demo records for PostgreSQL 18
-- ==========================================================

BEGIN;

-- 1. Roles
INSERT INTO roles (id, name, description) VALUES
('admin', 'Administrator', 'Full system control, financials, user management'),
('pharmacist', 'Pharmacist', 'Dispense medicines, verify prescriptions, manage inventory'),
('cashier', 'Cashier', 'Process POS sales, invoices, customer credit collection'),
('inventory_manager', 'Inventory Manager', 'Purchase orders, goods receipt, batch control'),
('doctor', 'Doctor / Staff', 'Write prescriptions, view clinical medicine catalog')
ON CONFLICT (id) DO NOTHING;

-- 2. Users (Single Production Administrator)
INSERT INTO users (id, username, email, password_hash, name, designation, role_id, phone, is_active) VALUES
('usr-admin', 'admin', 'admin@curo.health', 'admin123', 'System Administrator', 'Chief Administrator', 'admin', '+880 1700-000000', TRUE)
ON CONFLICT (id) DO NOTHING;

-- 3. Categories
INSERT INTO categories (id, name, parent_id, description) VALUES
('cat-1', 'Analgesics & Pain Relief', NULL, 'Pain relievers and antipyretics'),
('cat-2', 'Antibiotics & Antimicrobials', NULL, 'Bacterial infection treatments'),
('cat-3', 'Antacids & Gastrointestinal', NULL, 'Heartburn, ulcer and digestive care'),
('cat-4', 'Vitamins & Supplements', NULL, 'Nutritional supplements and minerals'),
('cat-5', 'Antihistamines & Allergy', NULL, 'Allergic rhinitis and urticaria'),
('cat-6', 'Diabetic Care', NULL, 'Blood glucose management and insulin'),
('cat-7', 'Cardiovascular & Hypertension', NULL, 'Blood pressure and lipid-lowering'),
('cat-8', 'Respiratory & Cough', NULL, 'Bronchodilators and cough syrups')
ON CONFLICT (id) DO NOTHING;

-- 4. Manufacturers
INSERT INTO manufacturers (id, name, contact_info) VALUES
('mfr-1', 'Square Pharmaceuticals PLC', 'dhaka@squarepharma.com.bd | +880-2-8833047'),
('mfr-2', 'Beximco Pharmaceuticals Ltd', 'info@bpl.net | +880-2-58611001'),
('mfr-3', 'Incepta Pharmaceuticals Ltd', 'info@inceptapharma.com | +880-2-8891688'),
('mfr-4', 'Renata Limited', 'corporate@renata-ltd.com | +880-2-9004592'),
('mfr-5', 'ACI Healthcare Limited', 'info@aci-bd.com | +880-2-8878600'),
('mfr-6', 'Novo Nordisk Bangladesh', 'bd-info@novonordisk.com | +880-2-9883344')
ON CONFLICT (id) DO NOTHING;

-- 5. Suppliers
INSERT INTO suppliers (id, name, contact_person, phone, email, address, tax_number, credit_period_days, outstanding_balance) VALUES
('sup-1', 'Square Distribution Logistics', 'Asif Iqbal', '+880 1711-223344', 'dist@square.com', 'Tejgaon I/A, Dhaka', 'GST-BD-0091823', 30, 45200.00),
('sup-2', 'Beximco Prime Distributors', 'Tanvir Ahmed', '+880 1819-334455', 'supply@beximco.com', 'Tongi, Gazipur', 'GST-BD-0082736', 45, 32000.00),
('sup-3', 'Incepta Med Supply Ltd', 'Kazi Nurul', '+880 1912-778899', 'orders@incepta.com', 'Savar, Dhaka', 'GST-BD-0073625', 30, 18500.00),
('sup-4', 'Renata Direct Healthcare', 'Morshed Alam', '+880 1618-556677', 'supply@renata.com', 'Mirpur, Dhaka', 'GST-BD-0064514', 60, 0.00)
ON CONFLICT (id) DO NOTHING;

-- 6. Medicines
INSERT INTO medicines (id, name, generic_name, category_id, manufacturer_id, composition, dosage_form, strength, barcode, hsn_code, requires_prescription, reorder_level, reorder_quantity, rack_location, is_active) VALUES
('med-1', 'Napa Extra 500mg/65mg', 'Paracetamol + Caffeine', 'cat-1', 'mfr-1', 'Paracetamol 500mg, Caffeine 65mg', 'Tablet', '500mg/65mg', '8901234500011', '3004.90', FALSE, 100, 300, 'Rack A-1', TRUE),
('med-2', 'Moxacil 500mg Capsule', 'Amoxicillin Trihydrate', 'cat-2', 'mfr-1', 'Amoxicillin 500mg', 'Capsule', '500mg', '8901234500028', '3004.10', TRUE, 60, 150, 'Rack B-3', TRUE),
('med-3', 'Seclo 20mg Capsule', 'Omeprazole', 'cat-3', 'mfr-1', 'Omeprazole 20mg pellet', 'Capsule', '20mg', '8901234500035', '3004.90', FALSE, 80, 200, 'Rack A-2', TRUE),
('med-4', 'Alatrol 10mg Tablet', 'Cetirizine Dihydrochloride', 'cat-5', 'mfr-1', 'Cetirizine 10mg', 'Tablet', '10mg', '8901234500042', '3004.90', FALSE, 40, 120, 'Rack C-1', TRUE),
('med-5', 'Comet 500mg Tablet', 'Metformin Hydrochloride', 'cat-6', 'mfr-1', 'Metformin HCl 500mg', 'Tablet', '500mg', '8901234500059', '3004.90', TRUE, 90, 250, 'Rack D-2', TRUE),
('med-6', 'Atova 10mg Tablet', 'Atorvastatin Calcium', 'cat-7', 'mfr-2', 'Atorvastatin 10mg', 'Tablet', '10mg', '8901234500066', '3004.90', TRUE, 50, 150, 'Rack D-4', TRUE),
('med-7', 'D-Rise 20000 IU Capsule', 'Cholecalciferol (Vitamin D3)', 'cat-4', 'mfr-3', 'Cholecalciferol 20,000 IU', 'Capsule', '20000 IU', '8901234500073', '2936.29', FALSE, 30, 100, 'Rack E-1', TRUE),
('med-8', 'Zimax 500mg Tablet', 'Azithromycin Dihydrate', 'cat-2', 'mfr-2', 'Azithromycin 500mg', 'Tablet', '500mg', '8901234500080', '3004.20', TRUE, 45, 120, 'Rack B-1', TRUE),
('med-9', 'Flamyd 400mg Tablet', 'Metronidazole', 'cat-2', 'mfr-5', 'Metronidazole 400mg', 'Tablet', '400mg', '8901234500097', '3004.90', TRUE, 40, 100, 'Rack B-2', TRUE),
('med-10', 'Ventolin Evohaler 100mcg', 'Salbutamol Sulphate', 'cat-8', 'mfr-6', 'Salbutamol 100mcg/actuation', 'Inhaler', '100mcg', '8901234500103', '3004.90', TRUE, 15, 40, 'Rack F-1', TRUE),
('med-11', 'Entacyd Plus Suspension 200ml', 'Aluminium Hydroxide + Magnesium', 'cat-3', 'mfr-1', 'Al(OH)3 200mg + Mg(OH)2 200mg/5ml', 'Suspension', '200ml', '8901234500110', '3004.90', FALSE, 25, 60, 'Rack A-3', TRUE),
('med-12', 'Mixtard 30 HM 100 IU/ml', 'Biphasic Isophane Insulin', 'cat-6', 'mfr-6', 'Soluble Insulin 30% + Isophane 70%', 'Vial', '100 IU/ml', '8901234500127', '3004.31', TRUE, 20, 50, 'Cold Storage C-2', TRUE),
('med-13', 'Rivotril 0.5mg Tablet', 'Clonazepam', 'cat-7', 'mfr-4', 'Clonazepam 0.5mg', 'Tablet', '0.5mg', '8901234500134', '3004.90', TRUE, 35, 100, 'Lock Safe S-1', TRUE),
('med-14', 'Tofen 100ml Syrup', 'Ketotifen Fumarate', 'cat-8', 'mfr-2', 'Ketotifen 1mg/5ml', 'Syrup', '100ml', '8901234500141', '3004.90', FALSE, 20, 50, 'Rack F-2', TRUE)
ON CONFLICT (id) DO NOTHING;

-- 7. Batches (FEFO Tracked)
INSERT INTO batches (id, medicine_id, supplier_id, batch_number, manufacture_date, expiry_date, cost_price, selling_price, mrp, quantity_received, quantity_available, rack_location) VALUES
('bat-101', 'med-1', 'sup-1', 'NE-2024A', '2024-03-10', CURRENT_DATE + INTERVAL '22 days', 2.10, 3.00, 3.00, 300, 45, 'Rack A-1'),
('bat-102', 'med-1', 'sup-1', 'NE-2024B', '2024-06-15', CURRENT_DATE + INTERVAL '240 days', 2.10, 3.00, 3.00, 500, 380, 'Rack A-1'),
('bat-103', 'med-2', 'sup-1', 'MX-2401', '2024-01-20', CURRENT_DATE + INTERVAL '180 days', 5.50, 7.50, 8.00, 200, 48, 'Rack B-3'),
('bat-104', 'med-3', 'sup-1', 'SC-9821', '2024-04-10', CURRENT_DATE + INTERVAL '310 days', 4.80, 6.50, 7.00, 400, 260, 'Rack A-2'),
('bat-105', 'med-4', 'sup-1', 'AL-1109', '2023-11-01', CURRENT_DATE + INTERVAL '18 days', 2.20, 3.50, 3.50, 150, 12, 'Rack C-1'),
('bat-106', 'med-5', 'sup-1', 'CM-5510', '2024-02-14', CURRENT_DATE + INTERVAL '400 days', 3.00, 4.50, 5.00, 400, 310, 'Rack D-2'),
('bat-107', 'med-6', 'sup-2', 'AT-7741', '2024-03-01', CURRENT_DATE + INTERVAL '360 days', 8.50, 12.00, 13.00, 100, 8, 'Rack D-4'),
('bat-108', 'med-7', 'sup-3', 'DR-4002', '2024-05-10', CURRENT_DATE + INTERVAL '420 days', 32.00, 45.00, 50.00, 150, 110, 'Rack E-1'),
('bat-109', 'med-8', 'sup-2', 'ZX-8820', '2023-12-10', CURRENT_DATE + INTERVAL '35 days', 28.00, 35.00, 40.00, 100, 28, 'Rack B-1'),
('bat-110', 'med-9', 'sup-4', 'FL-3301', '2024-01-05', CURRENT_DATE + INTERVAL '290 days', 1.80, 2.50, 2.50, 300, 185, 'Rack B-2'),
('bat-111', 'med-10', 'sup-2', 'VT-9021', '2024-02-18', CURRENT_DATE + INTERVAL '320 days', 195.00, 250.00, 260.00, 30, 4, 'Rack F-1'),
('bat-112', 'med-11', 'sup-1', 'EP-6019', '2024-03-25', CURRENT_DATE + INTERVAL '260 days', 65.00, 85.00, 90.00, 80, 42, 'Rack A-3'),
('bat-113', 'med-12', 'sup-2', 'MXT-409', '2024-04-05', CURRENT_DATE + INTERVAL '210 days', 380.00, 460.00, 480.00, 40, 22, 'Cold Storage C-2'),
('bat-114', 'med-13', 'sup-4', 'RV-1022', '2023-01-10', CURRENT_DATE - INTERVAL '12 days', 5.00, 7.00, 7.00, 100, 15, 'Lock Safe S-1'),
('bat-115', 'med-13', 'sup-4', 'RV-2024', '2024-05-01', CURRENT_DATE + INTERVAL '380 days', 5.00, 7.00, 7.00, 200, 190, 'Lock Safe S-1'),
('bat-116', 'med-14', 'sup-2', 'TF-8811', '2023-10-01', CURRENT_DATE + INTERVAL '150 days', 48.00, 65.00, 70.00, 50, 48, 'Rack F-2')
ON CONFLICT (id) DO NOTHING;

-- 8. Customers
INSERT INTO customers (id, name, phone, email, address, date_of_birth, credit_limit, outstanding_balance, loyalty_points) VALUES
('cust-1', 'Anisur Rahman', '+880 1712-345678', 'anis@gmail.com', 'Dhanmondi, Dhaka', '1982-05-14', 10000.00, 2450.00, 340),
('cust-2', 'Farhana Yasmin', '+880 1819-456789', 'farhana@yahoo.com', 'Uttara Sector 7, Dhaka', '1991-09-22', 15000.00, 0.00, 620),
('cust-3', 'Md. Rafiqul Islam', '+880 1911-567890', 'rafiq.islam@hotmail.com', 'Mirpur 10, Dhaka', '1975-11-03', 8000.00, 4120.00, 190),
('cust-4', 'Dr. Shahida Parveen', '+880 1617-678901', 'shahida@med.org', 'Gulshan 2, Dhaka', '1986-03-30', 25000.00, 0.00, 1150)
ON CONFLICT (id) DO NOTHING;

-- 9. Doctors
INSERT INTO doctors (id, name, specialization, license_number, phone, chamber) VALUES
('doc-1', 'Prof. Dr. M. A. Hasan', 'Internal Medicine & Cardiology', 'BMDC-A28910', '+880 1711-998877', 'Square Hospital, Dhaka'),
('doc-2', 'Dr. Nazneen Akhter', 'Endocrinology & Diabetology', 'BMDC-A34120', '+880 1812-887766', 'BIRDEM General Hospital'),
('doc-3', 'Dr. Tariqul Islam', 'Pulmonology & Chest Diseases', 'BMDC-A41509', '+880 1913-776655', 'National Institute of Diseases of Chest'),
('doc-4', 'Dr. Rezwana Chowdhury', 'General Physician', 'BMDC-A52881', '+880 1614-665544', 'APS Health Clinic')
ON CONFLICT (id) DO NOTHING;

-- 10. Prescriptions
INSERT INTO prescriptions (id, customer_id, doctor_id, prescription_date, notes, status) VALUES
('rx-1001', 'cust-1', 'doc-2', CURRENT_DATE - INTERVAL '3 days', 'Type-2 Diabetes mellitus review. Routine blood sugar monitoring required.', 'Dispensed'),
('rx-1002', 'cust-3', 'doc-3', CURRENT_DATE - INTERVAL '1 day', 'Acute bronchial asthma exacerbation. Inhaler technique demonstrated.', 'Pending')
ON CONFLICT (id) DO NOTHING;

-- 11. Prescription Items
INSERT INTO prescription_items (id, prescription_id, medicine_id, dosage, duration_days, quantity_prescribed) VALUES
('rxi-1', 'rx-1001', 'med-5', '1-0-1 after meals', 30, 60),
('rxi-2', 'rx-1001', 'med-3', '1-0-0 before breakfast', 30, 30),
('rxi-3', 'rx-1002', 'med-10', '2 puffs SOS / prn', 14, 1),
('rxi-4', 'rx-1002', 'med-4', '0-0-1 at bedtime', 10, 10)
ON CONFLICT (id) DO NOTHING;

-- 12. Initial Inventory Movements
INSERT INTO inventory_movements (id, medicine_id, batch_id, movement_type, quantity, balance_after, reference_type, reference_id, user_id, notes) VALUES
('mov-1', 'med-1', 'bat-101', 'PURCHASE', 300, 300, 'PO', 'PO-2026-001', 'usr-4', 'Initial batch receipt'),
('mov-2', 'med-1', 'bat-101', 'SALE', -255, 45, 'INV', 'INV-2026-001', 'usr-3', 'POS counter dispensing'),
('mov-3', 'med-2', 'bat-103', 'PURCHASE', 200, 200, 'PO', 'PO-2026-001', 'usr-4', 'Opening balance purchase'),
('mov-4', 'med-13', 'bat-114', 'EXPIRED', 0, 15, 'MANUAL', 'AUD-001', 'usr-2', 'Batch flagged for safe disposal')
ON CONFLICT (id) DO NOTHING;

COMMIT;
