# CURO Medical Management System — System Sequence & Architecture Guide

## 🗺️ Master Project Sequence Map

This enterprise repository is structured in a clear, logical sequence from documentation and database definitions up through backend APIs and client-facing interfaces:

```
Medical Management system/
├── 01_docs/               # 1. System documentation, guides, workflows & demo media
│   ├── 01_ARCHITECTURE_AND_WORKFLOW.md
│   ├── 02_DEPLOYMENT.md
│   ├── CURO_Database_Building_Guide.pdf
│   └── CURO_SaaS_Explainer_Demo.mp4
│
├── 02_database/           # 2. Database schemas & seed data in operational sequence
│   ├── 01_schema.sql      # Schema definitions, DDL, constraints & automated triggers
│   └── 02_seed.sql        # Demo data, default admin, initial pharmaceutical catalog
│
├── 03_backend/            # 3. Node.js backend services, PostgreSQL connection & REST APIs
│   ├── server.js          # Core HTTP / Web server with MIME types and static serving
│   ├── api.js             # RESTful API routing and business logic controllers
│   └── db.js              # PostgreSQL connection pool with fallback handling
│
├── 04_frontend/           # 4. Multi-page web application, assets, styles & scripts
│   ├── index.html         # [Step 01] Authentication & RBAC Login Portal
│   ├── home.html          # [Step 02] Executive Dashboard & Live Telemetry
│   ├── medicines.html     # [Step 03] Master Medicine Catalog & EAN-13 Barcodes
│   ├── inventory.html     # [Step 04] FEFO Inventory, Batch Tracking & Adjustments
│   ├── purchases.html     # [Step 05] Procurement, Purchase Orders & Supplier Accounts
│   ├── prescriptions.html # [Step 06] Digital Prescriptions & Registered Doctors
│   ├── pos.html           # [Step 07] Point-of-Sale (POS) Cashier & Barcode Scanner
│   ├── customers.html     # [Step 08] Customer Profiles, Loyalty & Credit Ledgers
│   ├── invoices.html      # [Step 09] GST Tax Invoices & Automated Sales Returns
│   ├── alerts.html        # [Step 10] Smart Early-Warning Alerts & Stock Intelligence
│   ├── reports.html       # [Step 11] Business Intelligence Analytics & Demand Forecasting
│   ├── users.html         # [Step 12] Staff Administration, Role Hierarchy & Audit Trail
│   ├── explainer-video.html # SaaS 60 FPS Explainer Demo Motion Graphics Studio
│   │
│   ├── assets/            # Static image assets and branding
│   │   ├── curo-logo.png
│   │   ├── curo-symbol.png
│   │   ├── favicon.svg
│   │   └── login_card_photo.jpg
│   │
│   ├── css/               # Application stylesheets
│   │   ├── home.css       # Core design system, blue theme & dashboard layout
│   │   └── index.css      # Modern split-pane login styling & card layout
│   │
│   └── js/                # Modular client-side scripts
│       ├── core/          # Foundational platform modules
│       │   ├── aps-store.js       # Reactive state store & two-way PostgreSQL sync
│       │   ├── aps-common.js      # Global navigation, RBAC guard & UI toast system
│       │   └── html5-qrcode.min.js# Real-time camera barcode scanner engine
│       │
│       └── modules/       # Page controllers mapped to functional modules
│           ├── alerts.js
│           ├── customers.js
│           ├── home.js
│           ├── inventory.js
│           ├── invoices.js
│           ├── medicines.js
│           ├── pos.js
│           ├── prescriptions.js
│           ├── purchases.js
│           ├── reports.js
│           └── users.js
│
├── dist/                  # Vite production build artifacts
├── src/                   # React + TypeScript Dashboard components & telemetry
├── server.js              # Root server entrypoint (delegates to 03_backend/server.js)
├── index.html             # Root web redirect to 04_frontend/index.html
├── package.json           # Project manifest, scripts & dependencies
├── Dockerfile             # Production container definition
├── docker-compose.yml     # Multi-container orchestration (App + PostgreSQL 16)
└── README.md              # Project overview and quickstart guide
```

---

## 🔄 End-to-End Clinical & Operational Workflow Sequence

The healthcare management lifecycle flows through these ordered phases:

```
[01. Staff Login] ──────► [02. Executive Dashboard]
       │                            │
       ▼                            ▼
[03. Medicines Setup] ───► [04. Procurement & POs] ───► [05. Batch Receiving (FEFO)]
                                                                  │
                                                                  ▼
[06. Doctor Prescription] ──────────────────────────► [07. POS Cashier Dispensing]
                                                                  │
                                                                  ▼
[10. Staff Administration] ◄── [09. BI & Analytics] ◄── [08. GST Invoices & Ledgers]
```

1. **Authentication (`index.html`):** User authenticates with role-based permissions (Admin, Pharmacist, Cashier, Inventory Manager, Doctor).
2. **Dashboard (`home.html`):** High-level view of critical metrics, near-expiry alerts, daily sales, and quick actions.
3. **Master Catalog (`medicines.html`):** Register drugs with compositions, manufacturer, dosages, HSN codes, and barcode labels.
4. **Procurement (`purchases.html`):** Generate purchase orders to pharmaceutical suppliers (Square, Beximco, Incepta, etc.).
5. **Inventory Receiving (`inventory.html`):** Check in goods with batch numbers, manufacture & expiry dates, cost/selling rates, automatically indexed into the FEFO queue.
6. **Clinical Prescriptions (`prescriptions.html`):** Doctors register clinical diagnosis, dosages, and link patient profiles. 1-click dispensing forwards prescriptions directly to the POS terminal.
7. **Point of Sale (`pos.html`):** Cashier scans barcodes with real-time audio beep, applies loyalty discounts or customer credit, and computes change.
8. **Invoicing & Ledgers (`invoices.html`, `customers.html`):** Thermal receipts or GST invoices printed; returns automatically restock inventory.
9. **Intelligence & Forecasting (`alerts.html`, `reports.html`):** Visual demand charts, dead-stock warnings, and reorder triggers.
10. **Staff RBAC & Audit (`users.html`):** Complete immutable system audit trail with user designation management.
