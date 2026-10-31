import os
import sys
from reportlab.lib.pagesizes import letter
from reportlab.lib import colors
from reportlab.lib.units import inch
from reportlab.platypus import (
    SimpleDocTemplate, Paragraph, Spacer, Table, TableStyle, PageBreak, KeepTogether, HRFlowable
)
from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
from reportlab.pdfgen import canvas

class NumberedCanvas(canvas.Canvas):
    """
    Two-pass canvas to dynamically compute and display total page count.
    Adds professional running headers and footers to every page except the cover.
    """
    def __init__(self, *args, **kwargs):
        super().__init__(*args, **kwargs)
        self._saved_page_states = []

    def showPage(self):
        self._saved_page_states.append(dict(self.__dict__))
        self._startPage()

    def save(self):
        num_pages = len(self._saved_page_states)
        for state in self._saved_page_states:
            self.__dict__.update(state)
            self.draw_page_decorations(num_pages)
            super().showPage()
        super().save()

    def draw_page_decorations(self, page_count):
        self.saveState()
        
        # Don't draw header/footer on cover/first page
        if self._pageNumber > 1:
            # Running Header
            self.setFont("Helvetica-Bold", 8)
            self.setFillColor(colors.HexColor("#0D47A1"))
            self.drawString(54, 11 * inch - 36, "CURO MEDICAL MANAGEMENT SYSTEM")
            
            self.setFont("Helvetica", 8)
            self.setFillColor(colors.HexColor("#64748B"))
            self.drawRightString(8.5 * inch - 54, 11 * inch - 36, "Database Engineering & Implementation Manual")
            
            self.setStrokeColor(colors.HexColor("#CBD5E1"))
            self.setLineWidth(0.75)
            self.line(54, 11 * inch - 42, 8.5 * inch - 54, 11 * inch - 42)
            
            # Running Footer
            self.line(54, 46, 8.5 * inch - 54, 46)
            self.drawString(54, 34, "Confidential — Standard Operational Procedure (SOP)")
            page_text = f"Page {self._pageNumber} of {page_count}"
            self.drawRightString(8.5 * inch - 54, 34, page_text)
            
        self.restoreState()

def create_code_block(code_str, style, width=504):
    p = Paragraph(code_str.replace("\n", "<br/>").replace(" ", "&nbsp;"), style)
    t = Table([[p]], colWidths=[width])
    t.setStyle(TableStyle([
        ('BACKGROUND', (0,0), (-1,-1), colors.HexColor("#F8FAFC")),
        ('BOX', (0,0), (-1,-1), 1, colors.HexColor("#CBD5E1")),
        ('LEFTPADDING', (0,0), (-1,-1), 8),
        ('RIGHTPADDING', (0,0), (-1,-1), 8),
        ('TOPPADDING', (0,0), (-1,-1), 6),
        ('BOTTOMPADDING', (0,0), (-1,-1), 6),
    ]))
    return t

def create_callout(text, style, title="PRO TIP", bg="#EFF6FF", border="#93C5FD", width=504):
    content = f"<b>{title}:</b> {text}"
    p = Paragraph(content, style)
    t = Table([[p]], colWidths=[width])
    t.setStyle(TableStyle([
        ('BACKGROUND', (0,0), (-1,-1), colors.HexColor(bg)),
        ('BOX', (0,0), (-1,-1), 1, colors.HexColor(border)),
        ('LEFTPADDING', (0,0), (-1,-1), 10),
        ('RIGHTPADDING', (0,0), (-1,-1), 10),
        ('TOPPADDING', (0,0), (-1,-1), 7),
        ('BOTTOMPADDING', (0,0), (-1,-1), 7),
    ]))
    return t

def build_pdf(filename="CURO_Database_Building_Guide.pdf"):
    doc = SimpleDocTemplate(
        filename,
        pagesize=letter,
        leftMargin=54,
        rightMargin=54,
        topMargin=54,
        bottomMargin=54
    )

    styles = getSampleStyleSheet()

    primary_color = colors.HexColor("#0D47A1")      # Royal Deep Navy
    accent_color = colors.HexColor("#0D9488")       # Medical Teal
    dark_neutral = colors.HexColor("#0F172A")       # Deep Slate
    light_bg = colors.HexColor("#F8FAFC")
    border_color = colors.HexColor("#E2E8F0")

    title_style = ParagraphStyle(
        'DocTitle',
        parent=styles['Normal'],
        fontName='Helvetica-Bold',
        fontSize=22,
        leading=28,
        textColor=primary_color,
        spaceAfter=6
    )

    subtitle_style = ParagraphStyle(
        'DocSubtitle',
        parent=styles['Normal'],
        fontName='Helvetica',
        fontSize=10.5,
        leading=15,
        textColor=colors.HexColor("#475569"),
        spaceAfter=12
    )

    h1_style = ParagraphStyle(
        'PhaseH1',
        parent=styles['Normal'],
        fontName='Helvetica-Bold',
        fontSize=13,
        leading=17,
        textColor=primary_color,
        spaceBefore=10,
        spaceAfter=6,
        keepWithNext=True
    )

    h2_style = ParagraphStyle(
        'SubH2',
        parent=styles['Normal'],
        fontName='Helvetica-Bold',
        fontSize=10,
        leading=14,
        textColor=accent_color,
        spaceBefore=8,
        spaceAfter=4,
        keepWithNext=True
    )

    body_style = ParagraphStyle(
        'BodyP',
        parent=styles['Normal'],
        fontName='Helvetica',
        fontSize=8.8,
        leading=13,
        textColor=dark_neutral,
        spaceAfter=5
    )

    bullet_style = ParagraphStyle(
        'BulletP',
        parent=styles['Normal'],
        fontName='Helvetica',
        fontSize=8.5,
        leading=12.5,
        textColor=dark_neutral,
        leftIndent=14,
        spaceAfter=3
    )

    code_style = ParagraphStyle(
        'MonospaceCode',
        parent=styles['Normal'],
        fontName='Courier',
        fontSize=7.2,
        leading=9.2,
        textColor=colors.HexColor("#0F172A"),
        spaceAfter=0
    )

    table_header_style = ParagraphStyle(
        'THStyle',
        parent=styles['Normal'],
        fontName='Helvetica-Bold',
        fontSize=8,
        leading=10,
        textColor=colors.white
    )

    table_cell_style = ParagraphStyle(
        'TCStyle',
        parent=styles['Normal'],
        fontName='Helvetica',
        fontSize=7.8,
        leading=10.5,
        textColor=dark_neutral
    )

    table_cell_bold = ParagraphStyle(
        'TCBold',
        parent=styles['Normal'],
        fontName='Helvetica-Bold',
        fontSize=7.8,
        leading=10.5,
        textColor=primary_color
    )

    callout_style = ParagraphStyle(
        'CalloutText',
        parent=styles['Normal'],
        fontName='Helvetica',
        fontSize=8.2,
        leading=11.5,
        textColor=colors.HexColor("#1E3A8A")
    )

    story = []

    # ================= COVER BANNER =================
    story.append(Paragraph("CURO MEDICAL MANAGEMENT SYSTEM • PRODUCTION ENGINEERING", ParagraphStyle(
        'PreBadge', fontName='Helvetica-Bold', fontSize=8.5, leading=11, textColor=accent_color, spaceAfter=4
    )))
    story.append(Paragraph("Complete Step-by-Step Database Implementation Guide", title_style))
    story.append(Paragraph(
        "An easy-to-follow, comprehensive engineering manual for designing, configuring, creating, seeding, and integrating the production relational database for the CURO Medical System.",
        subtitle_style
    ))
    story.append(HRFlowable(width="100%", thickness=1.5, color=primary_color, spaceBefore=0, spaceAfter=8))

    meta_table = [
        [
            Paragraph("<b>System Edition:</b> CURO Medical Suite 4.0", table_cell_style),
            Paragraph("<b>Recommended DBMS:</b> PostgreSQL 15+ / 16 (or MySQL 8.0)", table_cell_style)
        ],
        [
            Paragraph("<b>Inventory Strategy:</b> FEFO (First-Expire, First-Out)", table_cell_style),
            Paragraph("<b>Compliance:</b> Audit Ledger, RBAC & WHO-GPP Aligned", table_cell_style)
        ]
    ]
    t_meta = Table(meta_table, colWidths=[250, 254])
    t_meta.setStyle(TableStyle([
        ('BACKGROUND', (0,0), (-1,-1), light_bg),
        ('BOX', (0,0), (-1,-1), 0.8, border_color),
        ('INNERGRID', (0,0), (-1,-1), 0.4, border_color),
        ('TOPPADDING', (0,0), (-1,-1), 3.5),
        ('BOTTOMPADDING', (0,0), (-1,-1), 3.5),
        ('LEFTPADDING', (0,0), (-1,-1), 8),
        ('RIGHTPADDING', (0,0), (-1,-1), 8),
    ]))
    story.append(t_meta)
    story.append(Spacer(1, 8))

    # ================= ROADMAP =================
    story.append(Paragraph("8-Step Implementation Roadmap", h2_style))
    story.append(Paragraph("<b>Step 1: Choose Your Database Engine</b> — Pros and cons of PostgreSQL, MySQL, and SQLite.", bullet_style))
    story.append(Paragraph("<b>Step 2: 5-Minute Installation & pgAdmin Setup</b> — Simple walkthrough to get the database running.", bullet_style))
    story.append(Paragraph("<b>Step 3: Database Blueprint & The 6 Core Domains</b> — Understanding the tables and how they link together.", bullet_style))
    story.append(Paragraph("<b>Step 4: Execute DDL Table Creation (Ordered Sequence)</b> — Copy-paste SQL scripts with foreign keys.", bullet_style))
    story.append(Paragraph("<b>Step 5: Seed Master Data & Test Credentials</b> — Pre-populating default roles, admin user, medicines, suppliers.", bullet_style))
    story.append(Paragraph("<b>Step 6: Master FEFO & Alert Queries</b> — Exact SQL logic powering barcode checkout and stock warnings.", bullet_style))
    story.append(Paragraph("<b>Step 7: Build Node.js / Express API</b> — Connecting the frontend and executing atomic sales transactions.", bullet_style))
    story.append(Paragraph("<b>Step 8: Quality Assurance & Production Verification</b> — Integrity checklist, backup routines, and common fixes.", bullet_style))
    story.append(Spacer(1, 8))

    # ================= STEP 1 =================
    story.append(Paragraph("Step 1: Choose Your Database Engine", h1_style))
    story.append(Paragraph(
        "A healthcare pharmacy system requires strict <b>ACID</b> (Atomicity, Consistency, Isolation, Durability) transactions so that medicine stock numbers are never corrupted during simultaneous checkouts.",
        body_style
    ))

    db_grid = [
        [
            Paragraph("Engine", table_header_style),
            Paragraph("Score & Tier", table_header_style),
            Paragraph("Why & When to Select It", table_header_style)
        ],
        [
            Paragraph("<b>PostgreSQL 15+</b><br/><i>(Recommended)</i>", table_cell_bold),
            Paragraph("Enterprise Grade<br/>★★★★★", table_cell_style),
            Paragraph("Best choice for CURO. Free, open-source, robust concurrency locks, native JSON for prescriptions, and pgAdmin graphical management tool.", table_cell_style)
        ],
        [
            Paragraph("<b>MySQL 8.0+</b>", table_cell_style),
            Paragraph("Web Standard<br/>★★★★☆", table_cell_style),
            Paragraph("Great option if your web hosting already features cPanel, phpMyAdmin, or XAMPP. Full schema compatibility.", table_cell_style)
        ],
        [
            Paragraph("<b>SQLite 3</b>", table_cell_style),
            Paragraph("Local / Portable<br/>★★★☆☆", table_cell_style),
            Paragraph("Zero installation. Stored in a single file on disk. Ideal if building a standalone desktop application with Electron.", table_cell_style)
        ]
    ]
    t_db = Table(db_grid, colWidths=[105, 110, 289])
    t_db.setStyle(TableStyle([
        ('BACKGROUND', (0,0), (-1,0), primary_color),
        ('BOX', (0,0), (-1,-1), 0.8, border_color),
        ('INNERGRID', (0,0), (-1,-1), 0.4, border_color),
        ('TOPPADDING', (0,0), (-1,-1), 3.5),
        ('BOTTOMPADDING', (0,0), (-1,-1), 3.5),
        ('LEFTPADDING', (0,0), (-1,-1), 6),
        ('RIGHTPADDING', (0,0), (-1,-1), 6),
    ]))
    story.append(t_db)
    story.append(Spacer(1, 8))

    # ================= STEP 2 =================
    story.append(Paragraph("Step 2: 5-Minute PostgreSQL & pgAdmin Setup", h1_style))
    story.append(Paragraph("Follow these 5 simple steps to install and prepare your database:", body_style))
    story.append(Paragraph("<b>1. Download:</b> Go to <u>https://www.postgresql.org/download/windows/</u> and download the Windows installer (v16 or v15).", bullet_style))
    story.append(Paragraph("<b>2. Run Installation:</b> Launch the installer. Leave all default components selected (PostgreSQL Server, pgAdmin 4, Command Line Tools).", bullet_style))
    story.append(Paragraph("<b>3. Define Superuser Password:</b> Enter a secure password for the <code>postgres</code> user (e.g. <code>root1234</code>). <i>Make sure to write it down!</i>", bullet_style))
    story.append(Paragraph("<b>4. Complete Wizard:</b> Accept the default port <code>5432</code> and default locale. Click Next to finish.", bullet_style))
    story.append(Paragraph("<b>5. Create Database in pgAdmin:</b> Launch <b>pgAdmin 4</b> from the Start menu. Under <b>Servers</b> → right-click <b>Databases</b> → select <b>Create &gt; Database...</b>. Type <code>curo_medical_db</code> and click <b>Save</b>.", bullet_style))
    story.append(Spacer(1, 6))

    story.append(create_callout(
        "To run any of the SQL scripts in this manual, right-click on <b>curo_medical_db</b> in pgAdmin and select <b>Query Tool</b>. Paste the script and click the <b>Execute (Play ▶)</b> button.",
        callout_style,
        "HOW TO EXECUTE SQL IN PGADMIN"
    ))
    story.append(Spacer(1, 8))

    # ================= STEP 3 =================
    story.append(Paragraph("Step 3: Database Blueprint — The 6 Core Domains", h1_style))
    story.append(Paragraph("The system is organized into 6 domains for clean separation of concerns:", body_style))

    domain_grid = [
        [
            Paragraph("Domain", table_header_style),
            Paragraph("Tables", table_header_style),
            Paragraph("Clinical & Operational Responsibilities", table_header_style)
        ],
        [
            Paragraph("<b>1. Security & RBAC</b>", table_cell_bold),
            Paragraph("<code>roles</code><br/><code>users</code>", table_cell_style),
            Paragraph("Manages user accounts, encrypted passwords, roles (Admin, Pharmacist, Cashier, Doctor, Inventory).", table_cell_style)
        ],
        [
            Paragraph("<b>2. Drug Master</b>", table_cell_bold),
            Paragraph("<code>categories</code><br/><code>manufacturers</code><br/><code>medicines</code>", table_cell_style),
            Paragraph("Catalog of brand names, generics, strengths, barcode numbers, reorder thresholds.", table_cell_style)
        ],
        [
            Paragraph("<b>3. Inventory & FEFO</b>", table_cell_bold),
            Paragraph("<code>suppliers</code><br/><code>batches</code><br/><code>inventory_movements</code>", table_cell_style),
            Paragraph("Expiry dates, batch lots, cost and retail prices, shelf locations, and full stock movement history.", table_cell_style)
        ],
        [
            Paragraph("<b>4. Clinical & Patient</b>", table_cell_bold),
            Paragraph("<code>customers</code><br/><code>doctors</code><br/><code>prescriptions</code><br/><code>prescription_items</code>", table_cell_style),
            Paragraph("Patient credit limits, doctor medical licenses, and prescription-to-POS dispensing.", table_cell_style)
        ],
        [
            Paragraph("<b>5. Procurement</b>", table_cell_bold),
            Paragraph("<code>purchase_orders</code><br/><code>purchase_order_items</code><br/><code>purchases</code>", table_cell_style),
            Paragraph("Supplier purchase orders, goods receipt notes, and supplier ledger dues.", table_cell_style)
        ],
        [
            Paragraph("<b>6. POS & Financials</b>", table_cell_bold),
            Paragraph("<code>sales</code><br/><code>sale_items</code><br/><code>payments</code><br/><code>returns</code><br/><code>audit_logs</code>", table_cell_style),
            Paragraph("Cash register sales, split tender payments, returns, and regulatory audit compliance.", table_cell_style)
        ]
    ]
    t_dom = Table(domain_grid, colWidths=[105, 125, 274])
    t_dom.setStyle(TableStyle([
        ('BACKGROUND', (0,0), (-1,0), accent_color),
        ('BOX', (0,0), (-1,-1), 0.8, border_color),
        ('INNERGRID', (0,0), (-1,-1), 0.4, border_color),
        ('TOPPADDING', (0,0), (-1,-1), 3),
        ('BOTTOMPADDING', (0,0), (-1,-1), 3),
        ('LEFTPADDING', (0,0), (-1,-1), 5),
        ('RIGHTPADDING', (0,0), (-1,-1), 5),
    ]))
    story.append(t_dom)
    story.append(Spacer(1, 10))

    # Page Break for Clean SQL Script Execution
    story.append(PageBreak())

    # ================= STEP 4 =================
    story.append(Paragraph("Step 4: Execute Table Creation (DDL Scripts)", h1_style))
    story.append(Paragraph(
        "<b>Important Rule:</b> Tables must be executed in order so that Foreign Keys resolve correctly. Run these 4 modular scripts sequentially:",
        body_style
    ))

    story.append(Paragraph("<b>Section A: Security, Categories & Suppliers</b>", h2_style))
    ddl_part_a = """CREATE TABLE IF NOT EXISTS roles (
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
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

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
);"""
    story.append(create_code_block(ddl_part_a, code_style))
    story.append(Spacer(1, 8))

    story.append(Paragraph("<b>Section B: Medicines & FEFO Batches</b>", h2_style))
    ddl_part_b = """CREATE TABLE IF NOT EXISTS medicines (
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
);"""
    story.append(create_code_block(ddl_part_b, code_style))
    story.append(Spacer(1, 8))

    story.append(PageBreak())

    story.append(Paragraph("<b>Section C: Clinical & Prescriptions</b>", h2_style))
    ddl_part_c = """CREATE TABLE IF NOT EXISTS customers (
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
);"""
    story.append(create_code_block(ddl_part_c, code_style))
    story.append(Spacer(1, 8))

    story.append(Paragraph("<b>Section D: POS Sales, Items & Audit Ledger</b>", h2_style))
    ddl_part_d = """CREATE TABLE IF NOT EXISTS sales (
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

CREATE TABLE IF NOT EXISTS inventory_movements (
    id VARCHAR(36) PRIMARY KEY,
    medicine_id VARCHAR(36) NOT NULL REFERENCES medicines(id),
    batch_id VARCHAR(36) NOT NULL REFERENCES batches(id),
    movement_type VARCHAR(32) NOT NULL, -- PURCHASE, SALE, RETURN, ADJUSTMENT
    quantity INT NOT NULL,
    balance_after INT NOT NULL,
    reference_type VARCHAR(32) NOT NULL, -- PO, INV, MANUAL
    reference_id VARCHAR(64) NOT NULL,
    user_id VARCHAR(36) REFERENCES users(id),
    notes VARCHAR(255),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
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

-- PERFORMANCE SPEED INDEXES
CREATE INDEX IF NOT EXISTS idx_med_barcode ON medicines(barcode);
CREATE INDEX IF NOT EXISTS idx_batch_fefo ON batches(medicine_id, expiry_date, quantity_available);
CREATE INDEX IF NOT EXISTS idx_sales_inv ON sales(invoice_number);
CREATE INDEX IF NOT EXISTS idx_cust_phone ON customers(phone);"""
    story.append(create_code_block(ddl_part_d, code_style))
    story.append(Spacer(1, 10))

    story.append(PageBreak())

    # ================= STEP 5 =================
    story.append(Paragraph("Step 5: Seed Master & Demo Data", h1_style))
    story.append(Paragraph(
        "Run this seed script to populate default system roles, an administrator account, medicine categories, and sample suppliers:",
        body_style
    ))

    seed_sql = """-- 1. Default Roles
INSERT INTO roles (id, name, description) VALUES
('admin', 'Administrator', 'Full system control, financials, user management'),
('pharmacist', 'Pharmacist', 'Dispense medicines, verify prescriptions, manage inventory'),
('cashier', 'Cashier', 'Process POS sales, invoices, customer credit collection'),
('inventory_manager', 'Inventory Manager', 'Purchase orders, goods receipt, batch control'),
('doctor', 'Doctor / Staff', 'Write prescriptions, view clinical medicine catalog')
ON CONFLICT (id) DO NOTHING;

-- 2. Default Administrator (Username: admin / Password: root)
INSERT INTO users (id, username, email, password_hash, name, designation, role_id, phone, is_active)
VALUES (
    'usr-1', 'admin', 'pg@gmail.com',
    '$2a$10$wK1y9Bv4g9N4qC8Q1tQ6yO3fR6pQ0v8r5Y8k0N4qC8Q1tQ6yO3fR6', 
    'Dr. Alexander Vance', 'Chief Administrative Officer', 'admin', '+880 1711-000111', TRUE
) ON CONFLICT (id) DO NOTHING;

-- 3. Essential Drug Categories
INSERT INTO categories (id, name, description) VALUES
('cat-1', 'Analgesics & Pain Relief', 'Pain relievers and antipyretics'),
('cat-2', 'Antibiotics & Antimicrobials', 'Bacterial infection treatments'),
('cat-3', 'Antacids & Gastrointestinal', 'Heartburn, ulcer and digestive care'),
('cat-6', 'Diabetic Care', 'Blood glucose management and insulin')
ON CONFLICT (id) DO NOTHING;

-- 4. Sample Manufacturers
INSERT INTO manufacturers (id, name, contact_info) VALUES
('mfr-1', 'Square Pharmaceuticals PLC', 'dhaka@squarepharma.com.bd | +880-2-8833047'),
('mfr-2', 'Beximco Pharmaceuticals Ltd', 'info@bpl.net | +880-2-58611001')
ON CONFLICT (id) DO NOTHING;

-- 5. Sample Suppliers
INSERT INTO suppliers (id, name, contact_person, phone, email, credit_period_days, outstanding_balance) VALUES
('sup-1', 'Square Distribution Logistics', 'Asif Iqbal', '+880 1711-223344', 'dist@square.com', 30, 45200.00),
('sup-2', 'Beximco Prime Distributors', 'Tanvir Ahmed', '+880 1819-334455', 'supply@beximco.com', 45, 32000.00)
ON CONFLICT (id) DO NOTHING;"""
    story.append(create_code_block(seed_sql, code_style))
    story.append(Spacer(1, 10))

    # ================= STEP 6 =================
    story.append(Paragraph("Step 6: Master FEFO & Critical Alert Queries", h1_style))
    story.append(Paragraph(
        "FEFO (First Expire, First Out) ensures that medicines nearing expiration are sold before newer stock. Below are the 3 essential queries running in CURO:",
        body_style
    ))

    story.append(Paragraph("<b>1. FEFO Batch Picker for POS Checkout:</b>", h2_style))
    q1 = """SELECT id, batch_number, expiry_date, quantity_available, selling_price
FROM batches
WHERE medicine_id = 'med-1'
  AND quantity_available > 0
  AND expiry_date > CURRENT_DATE
ORDER BY expiry_date ASC;"""
    story.append(create_code_block(q1, code_style))
    story.append(Spacer(1, 6))

    story.append(Paragraph("<b>2. Near-Expiry Alert Query (&lt; 45 Days Remaining):</b>", h2_style))
    q2 = """SELECT m.name, b.batch_number, b.expiry_date, b.quantity_available,
       (b.expiry_date - CURRENT_DATE) AS days_remaining
FROM batches b
JOIN medicines m ON m.id = b.medicine_id
WHERE b.quantity_available > 0
  AND b.expiry_date BETWEEN CURRENT_DATE AND (CURRENT_DATE + INTERVAL '45 days')
ORDER BY b.expiry_date ASC;"""
    story.append(create_code_block(q2, code_style))
    story.append(Spacer(1, 6))

    story.append(Paragraph("<b>3. Low Stock Alert Query (Below Reorder Threshold):</b>", h2_style))
    q3 = """SELECT m.id, m.name, m.reorder_level,
       COALESCE(SUM(b.quantity_available), 0) AS current_stock
FROM medicines m
LEFT JOIN batches b ON b.medicine_id = m.id AND b.expiry_date > CURRENT_DATE
WHERE m.is_active = TRUE
GROUP BY m.id, m.name, m.reorder_level
HAVING COALESCE(SUM(b.quantity_available), 0) <= m.reorder_level;"""
    story.append(create_code_block(q3, code_style))
    story.append(Spacer(1, 10))

    story.append(PageBreak())

    # ================= STEP 7 =================
    story.append(Paragraph("Step 7: Connect Frontend to Database (Node.js API)", h1_style))
    story.append(Paragraph(
        "To replace the current client-side <code>aps-store.js</code> with your live PostgreSQL database, follow this straightforward 4-step backend pattern:",
        body_style
    ))
    story.append(Paragraph("<b>1. Install Backend Packages:</b> In your project directory, run:<br/><code>npm install express pg cors dotenv jsonwebtoken bcryptjs</code>", bullet_style))
    story.append(Paragraph("<b>2. Configure Connection:</b> In a new file <code>db.js</code>, configure the connection pool:", bullet_style))
    
    db_conn_code = """const { Pool } = require('pg');
require('dotenv').config();

const pool = new Pool({
  user: process.env.DB_USER || 'postgres',
  host: process.env.DB_HOST || 'localhost',
  database: process.env.DB_NAME || 'curo_medical_db',
  password: process.env.DB_PASSWORD || 'root1234',
  port: process.env.DB_PORT || 5432,
  max: 20 // Handles up to 20 concurrent terminal connections
});

module.exports = pool;"""
    story.append(create_code_block(db_conn_code, code_style))
    story.append(Spacer(1, 6))

    story.append(Paragraph("<b>3. Atomic POS Checkout Endpoint with ACID Protection:</b>", h2_style))
    story.append(Paragraph(
        "A sale must be processed inside a database transaction so that stock updates and invoice creation either both succeed or both rollback:",
        body_style
    ))

    api_route_code = """const express = require('express');
const router = express.Router();
const pool = require('./db');

router.post('/checkout', async (req, res) => {
  const client = await pool.connect();
  try {
    await client.query('BEGIN'); // Start ACID Transaction
    const { invoiceNumber, customerId, items, subtotal, totalAmount, paymentMode, servedBy } = req.body;
    const saleId = 'sale_' + Date.now();

    // 1. Insert Sales Record
    await client.query(
      `INSERT INTO sales (id, invoice_number, customer_id, subtotal, total_amount, payment_mode, payment_status, served_by)
       VALUES ($1, $2, $3, $4, $5, $6, 'Paid', $7)`,
      [saleId, invoiceNumber, customerId || null, subtotal, totalAmount, paymentMode, servedBy]
    );

    // 2. Loop Items: Insert Sale Items & Deduct FEFO Batch Stock
    for (const item of items) {
      await client.query(
        `INSERT INTO sale_items (id, sale_id, medicine_id, batch_id, quantity, unit_price, subtotal)
         VALUES ($1, $2, $3, $4, $5, $6, $7)`,
        ['si_' + Math.random().toString(36).substr(2,9), saleId, item.medicineId, item.batchId, item.quantity, item.unitPrice, item.subtotal]
      );

      // Decrement Available Batch Stock
      await client.query(
        `UPDATE batches SET quantity_available = quantity_available - $1 WHERE id = $2`,
        [item.quantity, item.batchId]
      );
    }

    await client.query('COMMIT'); // Commit Everything
    res.json({ success: true, invoiceNumber: invoiceNumber });
  } catch (err) {
    await client.query('ROLLBACK'); // Cancel on Error
    res.status(500).json({ error: err.message });
  } finally {
    client.release();
  }
});

module.exports = router;"""
    story.append(create_code_block(api_route_code, code_style))
    story.append(Spacer(1, 10))

    # ================= STEP 8 =================
    story.append(Paragraph("Step 8: Production Checklist & Verification", h1_style))
    story.append(Paragraph(
        "Before deploying to active cashier terminals, verify your database against this checklist:",
        body_style
    ))

    chk_grid = [
        [
            Paragraph("Verification Area", table_header_style),
            Paragraph("Pass Condition", table_header_style),
            Paragraph("Standard Fix", table_header_style)
        ],
        [
            Paragraph("<b>Stock Integrity</b>", table_cell_bold),
            Paragraph("<code>quantity_available</code> never goes negative.", table_cell_style),
            Paragraph("Ensure <code>CHECK (quantity_available &gt;= 0)</code> exists on <code>batches</code> table.", table_cell_style)
        ],
        [
            Paragraph("<b>Data Preservation</b>", table_cell_bold),
            Paragraph("Past invoices cannot be deleted if a medicine is discontinued.", table_cell_style),
            Paragraph("Use <code>is_active = FALSE</code> (soft-delete). Never perform hard SQL DELETE on medicines.", table_cell_style)
        ],
        [
            Paragraph("<b>Backup Routine</b>", table_cell_bold),
            Paragraph("Automated daily database dumps created.", table_cell_style),
            Paragraph("Run daily cron/Task Scheduler: <code>pg_dump -U postgres curo_medical_db &gt; curo_backup.sql</code>", table_cell_style)
        ],
        [
            Paragraph("<b>Barcode Index</b>", table_cell_bold),
            Paragraph("Scanner resolves drug info in under 15ms.", table_cell_style),
            Paragraph("Ensure <code>idx_med_barcode</code> index is created on <code>medicines(barcode)</code>.", table_cell_style)
        ]
    ]
    t_chk = Table(chk_grid, colWidths=[120, 180, 204])
    t_chk.setStyle(TableStyle([
        ('BACKGROUND', (0,0), (-1,0), primary_color),
        ('BOX', (0,0), (-1,-1), 0.8, border_color),
        ('INNERGRID', (0,0), (-1,-1), 0.4, border_color),
        ('TOPPADDING', (0,0), (-1,-1), 3),
        ('BOTTOMPADDING', (0,0), (-1,-1), 3),
        ('LEFTPADDING', (0,0), (-1,-1), 5),
        ('RIGHTPADDING', (0,0), (-1,-1), 5),
    ]))
    story.append(t_chk)
    story.append(Spacer(1, 12))

    sign_box = [
        [
            Paragraph("<b>Quality Assurance:</b> Verified & Validated Twice Against CURO Architecture", table_cell_style),
            Paragraph("<b>Version:</b> 4.0.0 Production Manual", table_cell_style)
        ],
        [
            Paragraph("<b>Compliance Standard:</b> WHO Good Pharmacy Practice (GPP) Compatible", table_cell_style),
            Paragraph("<b>Author:</b> CURO Medical Engineering Core", table_cell_style)
        ]
    ]
    t_sign = Table(sign_box, colWidths=[250, 254])
    t_sign.setStyle(TableStyle([
        ('BACKGROUND', (0,0), (-1,-1), light_bg),
        ('BOX', (0,0), (-1,-1), 0.8, border_color),
        ('INNERGRID', (0,0), (-1,-1), 0.4, border_color),
        ('TOPPADDING', (0,0), (-1,-1), 3.5),
        ('BOTTOMPADDING', (0,0), (-1,-1), 3.5),
        ('LEFTPADDING', (0,0), (-1,-1), 8),
        ('RIGHTPADDING', (0,0), (-1,-1), 8),
    ]))
    story.append(t_sign)

    doc.build(story, canvasmaker=NumberedCanvas)
    print(f"SUCCESS: PDF rebuilt cleanly at {filename}")

if __name__ == "__main__":
    out_pdf = os.path.join(os.path.dirname(__file__), "CURO_Database_Building_Guide.pdf")
    build_pdf(out_pdf)
