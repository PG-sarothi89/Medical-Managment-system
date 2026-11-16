# CURO Medical Management System

**Enterprise Healthcare & Pharmaceutical Management Platform**  
*CURO Clinical & Healthcare Operations Platform*

---

## 🎬 SaaS Explainer Demo Video Studio (`explainer-video.html`)
An interactive, 60 FPS motion graphics demo video player is built directly into the platform:
- **7 Master Scenes:** The Challenge, Meet CURO, POS Barcode Cashier, FEFO Batch Intelligence, Digital Prescriptions, BI Analytics & AI Demand Forecasting, Call to Action.
- **Narrated Voiceover:** Synchronized speech synthesis with real-time subtitles.
- **Synthesized Audio SFX:** Real-time Web Audio API soundscape (laser scan beeps, success chimes, transition swooshes).
- **Direct Video Export:** 1-Click "Export Video (WebM)" button using `MediaRecorder` API to record and download the demo video.
- **Launch anytime:** Open `explainer-video.html` directly in your browser.

---

## 🌟 Executive Overview
The **APS Medical Management System** is a full-featured, responsive, production-grade web application built to streamline operations across modern pharmacies, medical clinics, and healthcare distribution hubs. It connects master medicine data, First-Expired First-Out (FEFO) batch tracking, point-of-sale cashiering with simulated barcode scanner audio, supplier procurement, digital prescription management, patient credit ledgers, GST invoicing, early warning intelligence, and executive business analytics.

---

## 📁 Sequenced Project Architecture

The repository is structured in an explicit sequential order from documentation and database definitions to backend logic and frontend modules:

```
Medical Management system/
├── 01_docs/               # 1. Architecture, deployment guides & demo media
│   ├── 01_ARCHITECTURE_AND_WORKFLOW.md
│   ├── 02_DEPLOYMENT.md
│   ├── CURO_Database_Building_Guide.pdf
│   └── CURO_SaaS_Explainer_Demo.mp4
│
├── 02_database/           # 2. Database lifecycle scripts in execution sequence
│   ├── 01_schema.sql      # Database DDL, table structures, constraints & triggers
│   └── 02_seed.sql        # Demo accounts, default catalogs & initial seed records
│
├── 03_backend/            # 3. Node.js server, PostgreSQL connection & REST APIs
│   ├── server.js          # Core HTTP server with auto-MIME and fallback routing
│   ├── api.js             # REST API routes and business logic
│   └── db.js              # PostgreSQL client connection pool
│
├── 04_frontend/           # 4. Multi-page web application & user interfaces
│   ├── index.html         # [Step 01] Authentication & RBAC Login Portal
│   ├── home.html          # [Step 02] Executive Dashboard & Telemetry
│   ├── medicines.html     # [Step 03] Master Medicine Catalog & Barcodes
│   ├── inventory.html     # [Step 04] FEFO Inventory, Batches & Adjustments
│   ├── purchases.html     # [Step 05] Procurement, Purchase Orders & Suppliers
│   ├── prescriptions.html # [Step 06] Digital Prescriptions & Doctor Registry
│   ├── pos.html           # [Step 07] Point of Sale (POS) Cashier Terminal
│   ├── customers.html     # [Step 08] Customer Profiles & Credit Ledgers
│   ├── invoices.html      # [Step 09] GST Invoices & Sales Return Audits
│   ├── alerts.html        # [Step 10] Smart Stock Alerts & Early Warnings
│   ├── reports.html       # [Step 11] Business Intelligence & Demand Forecasting
│   ├── users.html         # [Step 12] Staff Administration & System Audit Trail
│   ├── explainer-video.html # Motion Graphics Explainer Demo Studio
│   │
│   ├── assets/            # Official branding logos and iconography
│   ├── css/               # Modular stylesheets (home.css, index.css)
│   └── js/                # Client-side platform engines and module controllers
│       ├── core/          # aps-store.js, aps-common.js, html5-qrcode.min.js
│       └── modules/       # Page-specific business logic controllers
│
├── dist/                  # Production bundle output
├── src/                   # React + TypeScript Dashboard components
├── server.js              # Root server entrypoint (delegates to 03_backend/server.js)
├── index.html             # Root redirect entrypoint
├── package.json           # Dependencies, scripts and platform metadata
├── Dockerfile             # Production container definition
├── docker-compose.yml     # Multi-container orchestration (App + PostgreSQL)
└── README.md              # Project documentation and quickstart
```

---

## 🚀 Key Functional Modules

1. **Authentication & Role-Based Access Control (RBAC):**
   - 5 defined organizational roles: **Administrator**, **Pharmacist**, **Cashier**, **Inventory Manager**, and **Doctor / Clinical Staff**.
   - One-Click Quick Demo Login buttons on the sign-in portal.
   - Session protection, timeout handling, and logout shortcut (`Ctrl+Shift+L`).

2. **Medicine Master & Catalog (`medicines.html`):**
   - Full CRUD for pharmaceuticals: Brand name, Generic name, Category, Manufacturer, Chemical composition, Unit of measure, HSN code, Barcode (EAN-13), Reorder level, and Prescription-Required flag.
   - Integrated barcode generator and scannable label viewer powered by JsBarcode.
   - Instant export to CSV.

3. **Inventory, Batches & FEFO Control (`inventory.html`):**
   - Automated **FEFO (First Expired, First Out)** sorting to prevent dispensing near-expiry drugs.
   - Batch registration with manufacture and expiry dates, purchase/cost pricing, selling price, and MRP.
   - Stock adjustments (Damaged goods write-off, expired disposal, physical audit reconciliation).
   - Immutable **Inventory Movements Ledger** tracking every stock addition, sale deduction, return, and adjustment.

4. **Point of Sale (POS) Cashier Terminal (`pos.html`):**
   - Barcode scanner simulation with authentic audio beep via Web Audio API.
   - Live typeahead medicine search with instant stock indicators.
   - Automatic FEFO batch deduction upon checkout.
   - Patient linkage with real-time loyalty point balances and credit limits.
   - Prescription linkage with auto-population of prescribed medications.
   - Multi-mode and split payments: Cash, Credit/Debit Card, Mobile Banking (bKash/Nagad), and Customer Credit.
   - Cash tendered and change calculation.
   - Instant GST invoice and 80mm thermal receipt generator.

5. **Purchases & Suppliers (`purchases.html`):**
   - Pharmaceutical suppliers directory (Square, Beximco, Incepta, Renata, etc.) with GSTIN, credit period, and live balance tracking.
   - Multi-item Purchase Order creation.
   - Goods Receipt workflow: converts PO to newly registered stock batches, automatically updating warehouse quantities and supplier accounts.
   - Supplier payment ledger and balance settlement.

6. **Prescriptions & Doctor Registry (`prescriptions.html`):**
   - Doctor directory with BMDC license numbers, specializations, and chambers.
   - Digital prescription creator with diagnosis notes and multi-drug dosage schedules (e.g. `1-0-1 after meals`).
   - One-click **"Dispense in POS"** action that immediately loads all prescribed drugs into the cashier cart.

7. **Customers & Patient Credit Control (`customers.html`):**
   - Customer directory with date of birth, contact details, loyalty points, and credit limits.
   - Over-limit warning indicators.
   - Credit settlement collection modal.

8. **Invoices & Sales Returns (`invoices.html`):**
   - Searchable invoice repository.
   - Printable GST invoice format with itemized tax breakdown and cashier reference.
   - Sales return processing: handles item returns, calculates refunds, and toggles automatic batch restocking.

9. **Smart Alerts & Stock Intelligence (`alerts.html`):**
   - Low-Stock alerts with 1-click PO creation.
   - Expiry countdown alerts categorized into Urgent (<30 days), Warning (<60 days), and Expired.
   - Dead-stock detector identifying products with zero sales movement for over 60–90 days.
   - Automated reorder recommendation engine.

10. **Business Intelligence & Forecasting (`reports.html`):**
    - 4 interactive Chart.js visualizations:
      - Monthly Revenue & Sales Trend line chart with teal gradient.
      - Pharmaceutical Category Share donut chart.
      - Predictive 30-Day Demand Forecast projection chart.
      - Gross Profit vs. Cost of Goods Sold bar chart.
    - Fast-moving vs. slow-moving product ranking matrix.
    - Full database backup download in JSON format.

11. **Users, Staff Profiles, RBAC & Audit Trail (`users.html`):**
    - User account administration with full support for Admin editing of **Staff Names**, **Clinical & Job Designations** (e.g. *Chief Administrative Officer*, *Senior Clinical Pharmacist*, *Lead Inventory & Logistics Manager*), Role Authorities, and Account Status.
    - Live session synchronization: modifications to the active logged-in profile instantly reflect in the navbar and UI chip without requiring re-login.
    - Enterprise Role-Based Access Control matrix.
    - Continuous chronological system audit trail recording every insert, update, sale, return, and login.

---

## 🔑 Pre-Configured Demo Accounts & Staff Designations

| Role | Email | Password | Staff Name | Clinical / Job Designation |
| :--- | :--- | :--- | :--- | :--- |
| **Administrator** | `pg@gmail.com` | `root` | Dr. Alexander Vance | Chief Administrative Officer |
| **Pharmacist** | `pharmacist@aps.com` | `root` | Sarah Jenkins | Senior Clinical Pharmacist |
| **Cashier** | `cashier@aps.com` | `root` | Rahim Uddin | Chief POS Cashier |
| **Inventory Manager** | `inventory@aps.com` | `root` | Kamal Hossain | Lead Inventory & Logistics Manager |
| **Doctor / Staff** | `doctor@aps.com` | `root` | Dr. Mahfuzur Rahman | Consultant Physician & Diabetologist |

*(You can also simply click the One-Click Quick Login buttons on the login screen to sign in instantly).*

---

## 📱 Barcode Scanner Integration (Hardware & Optical Camera)

The system features an omni-channel barcode recognition suite:
1. **Live Optical Webcam / Mobile Camera Scanning:**
   - Powered by standard WebRTC `getUserMedia` and the high-performance native `BarcodeDetector` API.
   - Includes real-time animated red laser scanning guide (`laser-beam`), scanning reticle, and flash/torch control.
   - Built-in 1-Click Simulation chips for instant testing with seed EAN-13 barcodes.
2. **Global USB Barcode Gun Wedge Listener:**
   - Automatically intercepts high-speed keystrokes (<50ms inter-key latency) from physical handheld USB and Bluetooth laser scanners on any page without requiring manual focus on an input field.
   - Instant acoustic scanner confirmation beep via HTML5 Web Audio API synthesizer.

---

## 💻 How to Run

1. **Directly in Browser:**
   - Double-click `index.html` to open the application in any modern browser (Chrome, Edge, Firefox, Safari, Opera).

2. **Using the Built-in Zero-Dependency Node Server:**
   ```bash
   node server.js
   ```
   Then open `http://localhost:3000` in your web browser.

3. **Using Python:**
   ```bash
   python -m http.server 8000
   ```
   Then visit `http://localhost:8000`.

---

## ⌨️ Keyboard Shortcuts & Power Features
- `Ctrl + K`: Open Global System Search Overlay from any page.
- `Ctrl + Shift + L`: Immediate Secure Logout.
- `Enter` (in POS Scanner): Process Scanned Barcode.
- `Escape`: Close Modals and Search Overlays.
- Handheld USB Barcode Gun: Scan anywhere to add directly to cart.

