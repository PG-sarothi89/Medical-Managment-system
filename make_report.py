import os
import sys
import win32com.client
from docx import Document
from docx.shared import Inches, Pt, RGBColor
from docx.enum.text import WD_ALIGN_PARAGRAPH
from docx.enum.table import WD_TABLE_ALIGNMENT

from builder_helpers import (
    sanitize, check_strict, add_styled_heading, add_body_p,
    add_bullet_p, add_image_figure, add_side_by_side_figures, add_styled_table
)

def build_full_report():
    doc = Document()
    
    # Page setup: Standard Letter, 0.65 inch margins to maximize usable area and reduce gaps
    for sec in doc.sections:
        sec.top_margin = Inches(0.65)
        sec.bottom_margin = Inches(0.65)
        sec.left_margin = Inches(0.65)
        sec.right_margin = Inches(0.65)
        sec.page_width = Inches(8.5)
        sec.page_height = Inches(11.0)
        
    print("Beginning report document generation with Black and White text and reduced gap spacing...")
    
    # --------------------------------------------------------------------------
    # COVER PAGE
    # --------------------------------------------------------------------------
    p_inst = doc.add_paragraph()
    p_inst.alignment = WD_ALIGN_PARAGRAPH.CENTER
    p_inst.paragraph_format.space_before = Pt(8)
    p_inst.paragraph_format.space_after = Pt(1.5)
    r = p_inst.add_run("BANGLADESH UNIVERSITY OF PROFESSIONALS (BUP)")
    r.font.name = 'Calibri'
    r.font.size = Pt(15)
    r.font.bold = True
    r.font.color.rgb = RGBColor(0, 0, 0)
    
    p_fac = doc.add_paragraph()
    p_fac.alignment = WD_ALIGN_PARAGRAPH.CENTER
    p_fac.paragraph_format.space_before = Pt(0)
    p_fac.paragraph_format.space_after = Pt(1.5)
    r = p_fac.add_run("Faculty of Science and Technology\nDepartment of Information and Communication Technology")
    r.font.name = 'Calibri'
    r.font.size = Pt(11)
    r.font.bold = True
    r.font.color.rgb = RGBColor(0, 0, 0)
    
    p_course = doc.add_paragraph()
    p_course.alignment = WD_ALIGN_PARAGRAPH.CENTER
    p_course.paragraph_format.space_before = Pt(2)
    p_course.paragraph_format.space_after = Pt(8)
    r = p_course.add_run("Course Title: Database Management Systems Laboratory\nCourse Code: ICE 2104")
    r.font.name = 'Calibri'
    r.font.size = Pt(10.5)
    r.font.color.rgb = RGBColor(0, 0, 0)
    
    logo_path = os.path.abspath("04_frontend/assets/curo-logo.png")
    if os.path.exists(logo_path):
        p_logo = doc.add_paragraph()
        p_logo.alignment = WD_ALIGN_PARAGRAPH.CENTER
        p_logo.paragraph_format.space_before = Pt(2)
        p_logo.paragraph_format.space_after = Pt(8)
        p_logo.add_run().add_picture(logo_path, width=Inches(1.6))
        
    p_rep = doc.add_paragraph()
    p_rep.alignment = WD_ALIGN_PARAGRAPH.CENTER
    p_rep.paragraph_format.space_before = Pt(2)
    p_rep.paragraph_format.space_after = Pt(1.5)
    r = p_rep.add_run("COMPREHENSIVE PROJECT REPORT")
    r.font.name = 'Calibri'
    r.font.size = Pt(12)
    r.font.bold = True
    r.font.color.rgb = RGBColor(0, 0, 0)
    
    p_title = doc.add_paragraph()
    p_title.alignment = WD_ALIGN_PARAGRAPH.CENTER
    p_title.paragraph_format.space_before = Pt(2)
    p_title.paragraph_format.space_after = Pt(3)
    r = p_title.add_run("CURO MEDICAL MANAGEMENT SYSTEM")
    r.font.name = 'Calibri'
    r.font.size = Pt(21)
    r.font.bold = True
    r.font.color.rgb = RGBColor(0, 0, 0)
    
    p_sub = doc.add_paragraph()
    p_sub.alignment = WD_ALIGN_PARAGRAPH.CENTER
    p_sub.paragraph_format.space_before = Pt(0)
    p_sub.paragraph_format.space_after = Pt(14)
    r = p_sub.add_run("A Production Grade Clinical Dispensary, Optical Point of Sale, and First Expired First Out Relational Database System")
    r.font.name = 'Calibri'
    r.font.size = Pt(10.5)
    r.font.italic = True
    r.font.color.rgb = RGBColor(0, 0, 0)
    
    p_sup = doc.add_paragraph()
    p_sup.paragraph_format.space_before = Pt(4)
    p_sup.paragraph_format.space_after = Pt(1)
    r = p_sup.add_run("Supervised By:")
    r.font.name = 'Calibri'
    r.font.size = Pt(10.5)
    r.font.bold = True
    r.font.color.rgb = RGBColor(0, 0, 0)
    
    add_body_p(doc, "Course Instructors and Laboratory Coordinators\nDepartment of Information and Communication Technology\nBangladesh University of Professionals (BUP)", space_after=8)
    
    p_sub_by = doc.add_paragraph()
    p_sub_by.paragraph_format.space_before = Pt(2)
    p_sub_by.paragraph_format.space_after = Pt(1)
    r = p_sub_by.add_run("Submitted By:")
    r.font.name = 'Calibri'
    r.font.size = Pt(10.5)
    r.font.bold = True
    r.font.color.rgb = RGBColor(0, 0, 0)
    
    students_data = [
        ["Partho Sarothi Ghosh", "ID: 24549010089", "Section: B", "Program: BICE 2025"],
        ["Rabeya Bashri Taposhi", "ID: 24549010096", "Section: B", "Program: BICE 2025"],
        ["Aritry Talukder", "ID: 24549010069", "Section: B", "Program: BICE 2025"]
    ]
    add_styled_table(doc, ["Student Name", "Student ID", "Section", "Academic Program"], students_data, [2.3, 1.7, 1.3, 1.9])
    
    p_date = doc.add_paragraph()
    p_date.alignment = WD_ALIGN_PARAGRAPH.CENTER
    p_date.paragraph_format.space_before = Pt(10)
    p_date.paragraph_format.space_after = Pt(0)
    r = p_date.add_run("Submission Date: November 18, 2026")
    r.font.name = 'Calibri'
    r.font.size = Pt(10)
    r.font.bold = True
    r.font.color.rgb = RGBColor(0, 0, 0)
    
    doc.add_page_break()
    
    # --------------------------------------------------------------------------
    # ABSTRACT
    # --------------------------------------------------------------------------
    add_styled_heading(doc, "Abstract", level=1)
    add_body_p(doc, "Modern healthcare facilities, pharmaceutical dispensaries, and clinical outpatient centers face severe operational challenges arising from disjointed record keeping, manual inventory accounting, pharmaceutical expiration losses, transcription errors in paper prescriptions, and uncoordinated patient credit ledgers. To resolve these vulnerabilities, this project presents the CURO Medical Management System, an enterprise grade, full stack healthcare management platform underpinned by a rigorous relational database management system (DBMS) architecture.")
    add_body_p(doc, "The relational schema of the CURO platform is architected in Third Normal Form (3NF) across six essential operational domains: Security and Role Based Access Control (RBAC), Pharmaceutical Master Data Catalog, First Expired First Out (FEFO) Inventory and Batch Auditing, Clinical Patient Prescriptions, Supply Chain Procurement, and Optical Point of Sale (POS) Invoicing with Financial Ledgers. Comprising twenty relational tables, composite primary keys, explicit foreign key constraints, check verifications, and composite B Tree speed indexes, the database guarantees complete Atomicity, Consistency, Isolation, and Durability (ACID) during multi item checkout transactions and inventory movements.")
    add_body_p(doc, "The software stack integrates a modular frontend user interface styled with contemporary healthcare design principles, camera based optical EAN 13 barcode scanning, acoustic cashier feedback, and real time telemetry dashboards. The backend services, developed on Node js and Express with PostgreSQL connection pooling, enforce role based security authorization, automated stock reorder algorithms, thirty day predictive demand forecasting, and an immutable real time system mutation audit trail. The complete platform provides healthcare administrators, clinical pharmacists, cashiers, inventory controllers, and physicians with a unified, dependable, and audit compliant digital operational environment.")
    add_body_p(doc, "Keywords: Relational Database Management System, Third Normal Form, PostgreSQL, First Expired First Out, Point of Sale, Barcode Scanner, Role Based Access Control, Clinical Prescriptions, System Audit Trail", bold_prefix="Keywords:", space_after=6)
    
    # --------------------------------------------------------------------------
    # TABLE OF CONTENTS
    # --------------------------------------------------------------------------
    add_styled_heading(doc, "Table of Contents", level=1)
    toc_items = [
        ("1. Introduction", "1"),
        ("    1.1 Overview of the Project", "1"),
        ("    1.2 Purpose and Significance of the Project", "1"),
        ("    1.3 Scope of the Project", "1"),
        ("    1.4 Key Contributions", "2"),
        ("2. Motivation", "2"),
        ("3. Objective", "3"),
        ("4. Methodology and System Design", "3"),
        ("    4.1 System Development Process and Lifecycle", "3"),
        ("    4.2 Use Case Modeling", "4"),
        ("    4.3 Data Flow Modeling", "4"),
        ("    4.4 Data Sequence Flow Modeling", "5"),
        ("    4.5 Relational Database Schema Design", "6"),
        ("    4.6 Entity Relationship (ER) Diagram", "7"),
        ("    4.7 Cloud Database Architecture and Physical Deployment", "8"),
        ("5. Technological Tools", "9"),
        ("    5.1 Frontend Architecture and Client Technologies", "9"),
        ("    5.2 Backend API Services and Server Architecture", "9"),
        ("    5.3 Relational Database Engine and Performance Optimization", "10"),
        ("    5.4 DevOps, Containerization, and Modeling Tools", "10"),
        ("6. Result and Implementation", "11"),
        ("    6.1 Authentication and Role Based Access Control", "11"),
        ("    6.2 Executive Dashboard and Operational Telemetry", "12"),
        ("    6.3 Pharmaceutical Master Catalog Management", "14"),
        ("    6.4 First Expired First Out (FEFO) Inventory and Batch Control", "15"),
        ("    6.5 Supply Chain Procurement and Supplier Accounts", "17"),
        ("    6.6 Clinical Prescriptions and Physician Registry", "19"),
        ("    6.7 Optical Point of Sale (POS) Cashier Terminal", "21"),
        ("    6.8 Patient Profiles and Credit Control Management", "23"),
        ("    6.9 Billing, Tax Invoices, and Sales Returns Restocking", "25"),
        ("    6.10 Early Warning Stock Intelligence and Alerts Center", "26"),
        ("    6.11 Business Intelligence Analytics and Demand Forecasting", "28"),
        ("    6.12 System Mutation Audit Trail and Security Ledger", "30"),
        ("7. Limitations", "31"),
        ("8. Conclusion", "31"),
        ("9. Future Work", "32"),
        ("10. References", "32")
    ]
    add_styled_table(doc, ["Section Title", "Page"], toc_items, [6.1, 1.1])
    
    # --------------------------------------------------------------------------
    # LIST OF FIGURES
    # --------------------------------------------------------------------------
    add_styled_heading(doc, "List of Figures", level=2)
    lof_items = [
        ("Figure 1", "Comprehensive Entity Relationship Diagram of CURO Medical Database Schema"),
        ("Figure 2", "System Use Case Diagram Across Clinical and Operational Roles"),
        ("Figure 3", "Functional Level 1 Data Flow Diagram of Enterprise Operations"),
        ("Figure 4", "Sequence Flow Diagram of Optical POS Dispensing and FEFO Stock Allocation"),
        ("Figure 5", "Cloud PostgreSQL Database Console Showing Production Relational Tables"),
        ("Figure 6", "Medical Portal Authentication and Role Based Access Control Login"),
        ("Figure 7", "Executive Dashboard Overview and Featured Clinical Medication Catalog"),
        ("Figure 8", "Operational Telemetry and Revenue Progression Analytics"),
        ("Figure 9", "Real Time POS Invoice Stream and Patient Order Audit"),
        ("Figure 10", "Point of Sale Terminal Cashier Interface and Product Selection Grid"),
        ("Figure 11", "Optical Barcode Scanner and Camera Capture Modal Dialog"),
        ("Figure 12", "Point of Sale Terminal Responsive Mobile Dispensing Layout"),
        ("Figure 13", "Point of Sale Checkout Cart with Patient Selection and Tax Summary"),
        ("Figure 14", "Official GST Compliant Invoice Receipt Modal Dialog"),
        ("Figure 15", "Pharmaceutical Master Data and Medicine Catalog Management Table"),
        ("Figure 16", "Add New Medicine Record Modal Dialog"),
        ("Figure 17", "Medicine Therapeutic Categories Configuration Modal Dialog"),
        ("Figure 18", "First Expired First Out Inventory Batch Tracking and Valuation"),
        ("Figure 19", "Immutable Stock Movement Ledger and Transaction Audit Trail"),
        ("Figure 20", "Register New Stock Batch Inward Modal Dialog"),
        ("Figure 21", "Inventory Stock Adjustment and Damaged Goods Disposal Dialog"),
        ("Figure 22", "Purchase Orders Registry and Goods Inward Receiving Management"),
        ("Figure 23", "Pharmaceutical Suppliers Directory and Credit Balance Ledger"),
        ("Figure 24", "Record Supplier Settlement Payment Modal Dialog"),
        ("Figure 25", "Register New Pharmaceutical Supplier Modal Dialog"),
        ("Figure 26", "Create Purchase Order Procurement Modal Dialog"),
        ("Figure 27", "Clinical Prescription Management and Dispensing Archive Table"),
        ("Figure 28", "Registered Physicians and Medical Practitioners Directory"),
        ("Figure 29", "Register Medical Practitioner Credential Modal Dialog"),
        ("Figure 30", "Digital Prescription Pad and Clinical Order Entry Dialog"),
        ("Figure 31", "Patient Directory and Customer Credit Control Management"),
        ("Figure 32", "Collect Patient Credit Settlement Modal Dialog"),
        ("Figure 33", "Register New Customer Patient Profile Modal Dialog"),
        ("Figure 34", "Edit Customer Information and Credit Limit Modal Dialog"),
        ("Figure 35", "Invoices and Billing Directory with Cashier Transaction History"),
        ("Figure 36", "Sales Returns History and Restock Audit Ledger"),
        ("Figure 37", "Business Intelligence Executive Dashboard and Revenue Trends"),
        ("Figure 38", "Predictive Thirty Day Sales Demand Forecast and Profit Margins"),
        ("Figure 39", "Fast Moving and Slow Moving Stock Analytics and Risk Detection"),
        ("Figure 40", "Low Stock Warnings and Inventory Alerts Center"),
        ("Figure 41", "Near Expiry and Expired Batches Early Warning Action Center"),
        ("Figure 42", "Dead Stock Detection and Tied Up Capital Analysis"),
        ("Figure 43", "Automated Replenishment Engine and Reorder Recommendations"),
        ("Figure 44", "Staff Directory and User Accounts Management"),
        ("Figure 45", "Role Based Access Control Authority Matrix Configuration"),
        ("Figure 46", "Immutable Real Time System Audit Trail and Database Mutations"),
        ("Figure 47", "Register System Staff User Account Modal Dialog")
    ]
    add_styled_table(doc, ["Figure Identifier", "Figure Description"], lof_items, [1.5, 5.7])
    
    # --------------------------------------------------------------------------
    # LIST OF TABLES
    # --------------------------------------------------------------------------
    add_styled_heading(doc, "List of Tables", level=2)
    lot_items = [
        ("Table 4.1", "Relational Database Tables and Functional Domain Allocations"),
        ("Table 4.2", "Relational Database Foreign Key Constraints and Referential Actions"),
        ("Table 4.3", "Composite B Tree Performance Speed Indexes in CURO Database"),
        ("Table 5.1", "Frontend, Backend, and Database Technology Stack Summary"),
        ("Table 6.1", "Role Based Access Control Operational Matrix")
    ]
    add_styled_table(doc, ["Table Identifier", "Table Description"], lot_items, [1.5, 5.7])
    
    doc.add_page_break()
    
    # --------------------------------------------------------------------------
    # CHAPTER 1: INTRODUCTION
    # --------------------------------------------------------------------------
    add_styled_heading(doc, "1. Introduction", level=1)
    
    add_styled_heading(doc, "1.1 Overview of the Project", level=2)
    add_body_p(doc, "The CURO Medical Management System is an enterprise grade clinical dispensary and healthcare operations platform developed to serve modern pharmacies, medical clinics, and hospital outpatient dispensaries. The application integrates pharmaceutical master cataloging, First Expired First Out (FEFO) batch inventory management, optical camera barcode scanning, digital prescription processing, patient credit control, Goods and Services Tax (GST) compliant invoicing, early warning intelligence, business analytics, and comprehensive role based access security into a unified, responsive software ecosystem.")
    add_body_p(doc, "At the heart of the CURO platform is a relational database management system designed to enforce high data integrity, transactional consistency, and strict referential accountability. By coupling a relational PostgreSQL database engine with an expressive Node js REST API and an interactive web presentation layer, CURO delivers high throughput retail dispensing while providing administrators with real time visibility over clinical, financial, and supply chain operations.")
    
    add_styled_heading(doc, "1.2 Purpose and Significance of the Project", level=2)
    add_body_p(doc, "Pharmaceutical dispensing and healthcare clinic administration are subject to stringent safety standards, financial accountability, and regulatory scrutiny. In traditional pharmacy environments, disparate manual ledgers and standalone spreadsheets frequently lead to disastrous stockouts of life saving drugs, dispensing of expired medications, billing discrepancies, and uncontrolled customer credit defaults. The purpose of the CURO Medical Management System is to eliminate these critical points of failure through a centralized relational database architecture.")
    add_body_p(doc, "The significance of the project is grounded in four foundational pillars:")
    add_bullet_p(doc, "Clinical Patient Safety:", "Enforces First Expired First Out (FEFO) batch allocation during dispensing, ensuring that medications with the earliest expiration dates are sold first, while expired drugs are automatically locked from point of sale terminals.")
    add_bullet_p(doc, "Operational Efficiency:", "Integrates camera and optical barcode scanning with simulated acoustic feedback, drastically accelerating dispensing throughput and eliminating manual typing errors.")
    add_bullet_p(doc, "Financial and Credit Control:", "Maintains accurate patient credit limits, tracks outstanding customer debts, logs supplier balances, and generates tax invoices in accordance with international billing standards.")
    add_bullet_p(doc, "Regulatory Auditability:", "Captures every system mutation in an append only, immutable audit log table, recording the timestamp, acting user, target table, record identifier, and specific modification details.")
    
    add_styled_heading(doc, "1.3 Scope of the Project", level=2)
    add_body_p(doc, "The operational scope of the CURO Medical Management System encompasses:")
    add_bullet_p(doc, "Role Based Security:", "Multi role authentication and granular permission management for Administrators, Pharmacists, Cashiers, Inventory Managers, and Physicians.")
    add_bullet_p(doc, "Drug Master Data:", "Comprehensive cataloging of pharmaceutical formulations, active chemical compositions, manufacturers, categories, dosages, strengths, and EAN 13 barcodes.")
    add_bullet_p(doc, "Inventory and Batches:", "Batch level cost and retail tracking, automated expiration calculation, warehouse rack locations, and manual stock adjustment logging.")
    add_bullet_p(doc, "Supply Chain Procurement:", "Generation of formal Purchase Orders, tracking supplier credit periods, receiving inward consignments, and processing supplier payments.")
    add_bullet_p(doc, "Clinical Prescriptions:", "Physician registry with official medical council licensing numbers, digital prescription creation with dosage directions, and one click dispatch to cashier carts.")
    add_bullet_p(doc, "Point of Sale (POS):", "Rapid dispensing terminal supporting optical barcode capture, customer credit ledgers, split payments, cash change calculation, and thermal receipt printing.")
    add_bullet_p(doc, "Intelligence and Analytics:", "Automated reorder triggers, dead stock detection, velocity analysis, thirty day predictive demand forecasting, and profit margin analysis.")
    add_body_p(doc, "Items outside the current scope include automated SMS dispatch gateways and hardware integration with automated robotic pill dispensing carousels, which are slated for future releases.")
    
    add_styled_heading(doc, "1.4 Key Contributions", level=2)
    add_body_p(doc, "This project delivers several significant contributions to academic database application engineering:")
    add_bullet_p(doc, "Robust 3NF Relational Architecture:", "A normalized database schema containing twenty interrelated tables, forty five foreign key constraints, and five specialized composite B Tree indexes.")
    add_bullet_p(doc, "ACID Transactional Checkout Controller:", "A database transaction flow ensuring that retail sales insertion, batch stock deduction, and inventory movement logging execute atomically with full rollback protection upon failure.")
    add_bullet_p(doc, "FEFO Automated Allocation Algorithm:", "A SQL query strategy that sorts active stock batches by expiration date and available quantity, ensuring optimal inventory turnover.")
    add_bullet_p(doc, "Dual Persistence and In Memory State Engine:", "A reactive client state store providing seamless offline fallback and synchronization with the live relational PostgreSQL backend.")
    add_bullet_p(doc, "Comprehensive Production UI Suite:", "A collection of twelve modular web interfaces and forty seven documented screens reflecting professional clinical workflows.")
    
    # --------------------------------------------------------------------------
    # CHAPTER 2: MOTIVATION
    # --------------------------------------------------------------------------
    add_styled_heading(doc, "2. Motivation", level=1)
    add_body_p(doc, "The healthcare distribution and pharmaceutical retail sector plays a life critical role in national public health. However, in many developing regions and independent hospital clinics, pharmacy operations continue to rely on manual ledger books, basic desktop spreadsheets, or fragmented point of sale programs that lack relational database foundations. This technological deficiency gives rise to severe operational vulnerabilities:")
    add_bullet_p(doc, "Severe Financial Expiration Losses:", "Without automated First Expired First Out (FEFO) scheduling, pharmacy staff inadvertently dispense newly received batches while older inventory sits on dispensary shelves until expiration. Across retail chains, expired medication write offs account for substantial financial losses and substantial capital traps.")
    add_bullet_p(doc, "Prescription Transcription Risks:", "Paper prescriptions are notoriously susceptible to illegible handwriting, dosage interpretation mistakes, and transcription errors during cashier billing. The lack of a digital link between prescribing physicians and dispensing terminals poses severe threats to patient safety.")
    add_bullet_p(doc, "Uncontrolled Credit Defaults:", "Pharmacies frequently extend short term credit to chronic patients. In the absence of automated credit limit checks, outstanding balances accumulate unnoticed, leading to bad debt and cash flow crises.")
    add_bullet_p(doc, "Inability to Forecast Demand:", "Stockouts of critical life saving antibiotics or diabetic medications occur unpredictably because managers lack real time sales velocity metrics and automated reorder alerts.")
    add_bullet_p(doc, "Regulatory and Compliance Failures:", "Health authorities and drug regulatory agencies mandate complete traceability for controlled substances and scheduled narcotics. Without an immutable chronological audit trail, verifying who received, modified, or dispensed a batch is impossible.")
    add_body_p(doc, "These pressing operational and clinical dilemmas motivated the conception, architecture, and realization of the CURO Medical Management System. By establishing an authoritative relational database schema that models drugs, batches, prescriptions, sales, and audit trails with mathematical rigor, CURO demonstrates how sound database engineering directly solves tangible healthcare and supply chain crises.")
    
    # --------------------------------------------------------------------------
    # CHAPTER 3: OBJECTIVE
    # --------------------------------------------------------------------------
    add_styled_heading(doc, "3. Objective", level=1)
    add_body_p(doc, "The primary objective of this project is to conceptualize, design, implement, and verify an enterprise grade, relational database management platform for healthcare facilities and pharmacies, named CURO Medical Management System.")
    add_body_p(doc, "To achieve this principal goal, the following specific technical and functional objectives were pursued:")
    add_bullet_p(doc, "Relational Schema Formulation:", "Design a normalized database schema in Third Normal Form (3NF) encompassing twenty entity tables spanning security, pharmaceutical catalogs, batches, clinical orders, procurement, and billing.")
    add_bullet_p(doc, "Referential Integrity Enforcement:", "Establish strict primary keys, foreign keys with appropriate cascade and restrict actions, unique constraints, and domain check constraints to guarantee database validity.")
    add_bullet_p(doc, "ACID Transaction Guarantees:", "Implement multi statement database transactions with Read Committed isolation level for point of sale checkouts, ensuring atomic stock deduction, invoice recording, and audit trail insertion.")
    add_bullet_p(doc, "First Expired First Out (FEFO) Engine:", "Develop SQL queries and algorithmic routines that dynamically prioritize batches with the nearest expiration date and isolate expired lots from sale.")
    add_bullet_p(doc, "Optical Barcode Scanning Integration:", "Integrate web camera optical recognition for EAN 13 pharmaceutical barcodes, supported by synthesized acoustic signals to maximize cashier throughput.")
    add_bullet_p(doc, "Role Based Security Architecture:", "Construct a hierarchical access control model segregating administrative, clinical, pharmaceutical, cashiering, and inventory privileges.")
    add_bullet_p(doc, "Predictive Business Intelligence:", "Formulate analytics queries that calculate gross revenue, operating profit margins, inventory valuations, dead stock capital traps, and thirty day replenishment forecasts.")
    add_bullet_p(doc, "System Auditability:", "Implement an append only audit logging mechanism that records all data insertion, update, and deletion operations with user attribution.")
    
    doc.add_page_break()
    
    # --------------------------------------------------------------------------
    # CHAPTER 4: METHODOLOGY AND SYSTEM DESIGN
    # --------------------------------------------------------------------------
    add_styled_heading(doc, "4. Methodology and System Design", level=1)
    
    add_styled_heading(doc, "4.1 System Development Process and Lifecycle", level=2)
    add_body_p(doc, "The CURO Medical Management System was engineered following an iterative and incremental software development lifecycle (SDLC), reinforced by strict database first design principles. The engineering methodology proceeded across seven distinct phases:")
    add_bullet_p(doc, "Phase 1: Domain Analysis and Clinical Requirements Gathering:", "Investigated standard pharmacy operating procedures, World Health Organization Good Pharmacy Practice (WHO GPP) recommendations, and tax invoicing guidelines to establish entity requirements and business constraints.")
    add_bullet_p(doc, "Phase 2: Conceptual and Relational Database Modeling:", "Constructed the conceptual Entity Relationship (ER) model, mapped entities to relational tables, applied normalization principles to reach Third Normal Form (3NF), and drafted Data Definition Language (DDL) scripts.")
    add_bullet_p(doc, "Phase 3: Backend API Architecture and Connection Pooling:", "Implemented the Node js and Express backend layer, established PostgreSQL connection pools with client borrowing and release protocols, and created transactional route controllers.")
    add_bullet_p(doc, "Phase 4: Client State Store and Offline Fallback Integration:", "Engineered the reactive state management store, enabling two way synchronization between frontend modules and the relational database with local fallback capabilities.")
    add_bullet_p(doc, "Phase 5: User Interface and Hardware Scanner Integration:", "Built twelve specialized web interface modules incorporating optical barcode detection, responsive grid layouts, and dynamic modal dialogs.")
    add_bullet_p(doc, "Phase 6: Comprehensive Security and Access Control Matrix:", "Implemented token verification, session tracking, password hashing, and role based authorization guards.")
    add_bullet_p(doc, "Phase 7: End to End Testing, Verification, and Deployment:", "Conducted relational data verification, SQL query performance tuning, Docker container packaging, and production cloud database deployment.")
    
    add_styled_heading(doc, "4.2 Use Case Modeling", level=2)
    add_body_p(doc, "The functional interactions of the CURO Medical Management System are formally modeled using a comprehensive Use Case Diagram. The system identifies six distinct operational actors:")
    add_bullet_p(doc, "Administrator:", "Maintains ultimate governance over the platform, provisions user accounts, assigns clinical designations, audits the system mutation ledger, and configures financial parameters.")
    add_bullet_p(doc, "Pharmacist:", "Oversees the pharmaceutical master catalog, verifies clinical prescriptions, reviews stock batch levels, and dispenses prescription medications.")
    add_bullet_p(doc, "Cashier:", "Operates the Point of Sale terminal, scans barcodes, processes retail customer payments, issues GST invoices, and executes approved sales returns.")
    add_bullet_p(doc, "Inventory Manager:", "Generates purchase orders to pharmaceutical suppliers, receives incoming batch shipments, conducts physical stock reconciliations, and logs damaged goods write offs.")
    add_bullet_p(doc, "Doctor / Physician:", "Registers clinical diagnosis notes, selects medications with dosage instructions, and issues electronically signed digital prescriptions.")
    add_bullet_p(doc, "Patient Customer:", "Presents prescriptions, receives dispensed formulations, utilizes customer credit privileges, and settles outstanding financial balances.")
    add_body_p(doc, "Figure 2 depicts the complete use case model, illustrating the interactions between external actors and core operational use cases encapsulated within the CURO system boundary.")
    
    add_image_figure(doc, "curo_use_case_diagram.png", "Figure 2", "System Use Case Diagram Across Clinical and Operational Roles", width_in=6.2)
    
    add_styled_heading(doc, "4.3 Data Flow Modeling", level=2)
    add_body_p(doc, "To trace the movement, transformation, and storage of information throughout the platform, a Level 1 Functional Data Flow Diagram (DFD) was engineered. The DFD decomposes the system into six central processing nodes and five persistent data stores:")
    add_bullet_p(doc, "Process 1.0 (Authentication and RBAC Verification):", "Accepts staff credentials, queries the Users and Roles data store (D1), validates hashed credentials, and issues an active authenticated session token.")
    add_bullet_p(doc, "Process 2.0 (Prescription Intake and Order Validation):", "Receives electronic prescription orders from physicians, checks formulation availability against the Master Medicines store (D2), and records validated orders into the Prescriptions store (D3).")
    add_bullet_p(doc, "Process 3.0 (Optical POS Dispensing and GST Calculation):", "Receives scanned barcode inputs and patient identifiers, requests batch allocation, calculates tax amounts and line item subtotals, and produces finalized invoice records in the Sales store (D4).")
    add_bullet_p(doc, "Process 4.0 (FEFO Inventory Allocation Engine):", "Evaluates batch expiration dates and available balances in the Medicines and Batches store (D2), decrementing inventory from the earliest expiring valid lot.")
    add_bullet_p(doc, "Process 5.0 (Procurement and Batch Receiving):", "Processes supplier purchase orders, receives new batch shipments, indexes manufacturing and expiry parameters, and writes new batch records into store D2.")
    add_bullet_p(doc, "Process 6.0 (BI Forecasting and Audit Logging):", "Continuously analyzes sales velocity, evaluates stock thresholds, generates reorder recommendations, and records all database mutation events into the Audit Trail store (D5).")
    
    add_image_figure(doc, "curo_data_flow_diagram.png", "Figure 3", "Functional Level 1 Data Flow Diagram of Enterprise Operations", width_in=6.2)
    
    add_styled_heading(doc, "4.4 Data Sequence Flow Modeling", level=2)
    add_body_p(doc, "The interaction sequence between user interface components, backend controller services, allocation engines, and the relational database is documented in Figure 4. The sequence diagram outlines the critical Point of Sale dispensing and checkout transaction:")
    add_bullet_p(doc, "Step 1 to 5 (Optical Barcode Lookup):", "The cashier scans a physical EAN 13 barcode using the camera scanner. The POS client sends an asynchronous query to the backend API, which queries the database for active formulations and available batches, populating the cashier cart.")
    add_bullet_p(doc, "Step 6 to 7 (Checkout Submission):", "The cashier selects the customer profile, verifies the payment mode (Cash, Card, Mobile Banking, or Credit), and submits the checkout payload.")
    add_bullet_p(doc, "Step 8 to 12 (ACID Database Transaction):", "The backend initiates an explicit database transaction (BEGIN). The FEFO allocation engine locks the candidate batch, deducts the requested quantity, inserts line items into the sale items table, records the invoice into the sales table, writes a stock decrement entry into the inventory movements table, and commits the transaction (COMMIT).")
    add_bullet_p(doc, "Step 13 to 14 (Invoice Confirmation):", "The database returns the generated invoice reference, prompting the client to render the official thermal tax invoice receipt on screen.")
    
    add_image_figure(doc, "curo_sequence_diagram.png", "Figure 4", "Sequence Flow Diagram of Optical POS Dispensing and FEFO Stock Allocation", width_in=6.2)
    
    add_styled_heading(doc, "4.5 Relational Database Schema Design", level=2)
    add_body_p(doc, "The relational database of the CURO Medical Management System was designed in Third Normal Form (3NF) to eliminate data redundancy, prevent update anomalies, and enforce atomic column values. The database comprises twenty relational tables distributed across six core operational domains, as summarized in Table 4.1.")
    
    table_domain_rows = [
        ["1. Security and RBAC", "roles, users", "Staff accounts, credential security, role authorization"],
        ["2. Drug Master Catalog", "categories, manufacturers, medicines", "Therapeutic classifications, chemical formulas, barcodes"],
        ["3. Inventory and FEFO Batches", "suppliers, batches, inventory movements", "Lot numbers, expiry tracking, shelf locations, audit ledger"],
        ["4. Clinical and Patients", "customers, doctors, prescriptions, prescription items", "Patient profiles, credit limits, doctor BMDC licensing, Rx orders"],
        ["5. Procurement and Orders", "purchase orders, purchase order items, purchases", "Supplier procurement, goods receipt, inward consignment auditing"],
        ["6. Point of Sale and Financials", "sales, sale items, payments, returns, audit logs", "Invoices, retail dispensing, credit settlement, system audit trail"]
    ]
    add_styled_table(doc, ["Core Domain", "Relational Tables Included", "Operational Responsibilities"], table_domain_rows, [1.9, 2.4, 2.9])
    
    add_body_p(doc, "To guarantee referential integrity across the enterprise, explicit Foreign Key constraints are defined on all inter entity relationships. Table 4.2 documents the primary foreign key dependencies and their associated referential integrity enforcement rules.")
    
    fk_rows = [
        ["users", "roleId", "roles", "id", "ON UPDATE CASCADE, ON DELETE RESTRICT"],
        ["medicines", "categoryId", "categories", "id", "ON UPDATE CASCADE, ON DELETE RESTRICT"],
        ["medicines", "manufacturerId", "manufacturers", "id", "ON UPDATE CASCADE, ON DELETE RESTRICT"],
        ["batches", "medicineId", "medicines", "id", "ON UPDATE CASCADE, ON DELETE RESTRICT"],
        ["batches", "supplierId", "suppliers", "id", "ON UPDATE CASCADE, ON DELETE RESTRICT"],
        ["inventory movements", "batchId", "batches", "id", "ON UPDATE CASCADE, ON DELETE RESTRICT"],
        ["prescriptions", "customerId", "customers", "id", "ON UPDATE CASCADE, ON DELETE SET NULL"],
        ["prescriptions", "doctorId", "doctors", "id", "ON UPDATE CASCADE, ON DELETE RESTRICT"],
        ["prescription items", "prescriptionId", "prescriptions", "id", "ON UPDATE CASCADE, ON DELETE CASCADE"],
        ["purchase order items", "poId", "purchase orders", "id", "ON UPDATE CASCADE, ON DELETE CASCADE"],
        ["sales", "customerId", "customers", "id", "ON UPDATE CASCADE, ON DELETE SET NULL"],
        ["sale items", "saleId", "sales", "id", "ON UPDATE CASCADE, ON DELETE CASCADE"],
        ["payments", "saleId", "sales", "id", "ON UPDATE CASCADE, ON DELETE RESTRICT"],
        ["returns", "saleId", "sales", "id", "ON UPDATE CASCADE, ON DELETE RESTRICT"],
        ["audit logs", "userId", "users", "id", "ON UPDATE CASCADE, ON DELETE SET NULL"]
    ]
    add_styled_table(doc, ["Source Table", "Foreign Key Column", "Referenced Table", "Target Key", "Referential Enforcement Rule"], fk_rows, [1.3, 1.3, 1.2, 1.0, 2.4])
    
    add_body_p(doc, "To achieve high performance during high volume retail barcode lookups and FEFO batch sorting, specialized composite B Tree indexes were created in the database schema, as detailed in Table 4.3.")
    
    index_rows = [
        ["idx med barcode", "medicines", "barcode", "Sub millisecond EAN 13 optical barcode scanning lookup"],
        ["idx batch fefo", "batches", "medicineId, expiryDate, quantityAvailable", "Rapid FEFO allocation of earliest expiring available stock"],
        ["idx sales inv", "sales", "invoiceNumber", "Instantaneous tax invoice retrieval and reprint querying"],
        ["idx cust phone", "customers", "phone", "Immediate patient profile lookup and credit ledger retrieval"],
        ["idx movements med", "inventory movements", "medicineId, batchId", "Accelerated chronological stock movement audit generation"]
    ]
    add_styled_table(doc, ["Index Identifier", "Target Table", "Indexed Columns", "Performance and Operational Benefit"], index_rows, [1.4, 1.3, 2.1, 2.4])
    
    add_styled_heading(doc, "4.6 Entity Relationship (ER) Diagram", level=2)
    add_body_p(doc, "The complete structural organization of the CURO database is represented in the comprehensive Entity Relationship (ER) Diagram shown in Figure 1. Modeled following standard Draw.io / diagrams.net visual conventions, each entity is represented as a structured relational table block containing its Primary Key (PK), Foreign Key (FK) attributes, and data fields with formal SQL data types.")
    add_body_p(doc, "Entities are logically color coded by domain to highlight architectural modularity: Navy Blue for Security and RBAC, Emerald Green for the Pharmaceutical Master Catalog, Royal Purple for Inventory and FEFO Batches, Cyan for Clinical Patients and Prescriptions, Warm Orange for Supply Chain Procurement, Sea Green for Point of Sale Invoicing and Financials, and Slate Gray for System Audit Ledgers.")
    
    add_image_figure(doc, "curo_er_diagram.png", "Figure 1", "Comprehensive Entity Relationship Diagram of CURO Medical Database Schema", width_in=6.4)
    
    add_styled_heading(doc, "4.7 Cloud Database Architecture and Physical Deployment", level=2)
    add_body_p(doc, "The CURO production database is hosted on a high availability managed PostgreSQL 16 cloud instance. Figure 5 presents a live screenshot of the cloud database console, validating the successful creation and physical instantiation of all production tables, indexes, triggers, and foreign key relations.")
    
    add_image_figure(doc, "Frontend - Copy/Database/Screenshot 2026-11-18 204911.png", "Figure 5", "Cloud PostgreSQL Database Console Showing Production Relational Tables", width_in=5.8)
    
    # --------------------------------------------------------------------------
    # CHAPTER 5: TECHNOLOGICAL TOOLS
    # --------------------------------------------------------------------------
    add_styled_heading(doc, "5. Technological Tools", level=1)
    add_body_p(doc, "The development of the CURO Medical Management System leveraged an enterprise grade software engineering stack chosen for reliability, execution performance, security, and standards compliance. Table 5.1 outlines the primary technologies utilized across all layers.")
    
    tech_stack_rows = [
        ["Frontend UI", "HTML5, Modern CSS3, Flexbox, CSS Grid", "Clean visual presentation, responsive mobile and desktop layout"],
        ["Client Scripting", "Vanilla JavaScript (ES6 Modules)", "Modular page controllers, asynchronous fetch requests, DOM reactivity"],
        ["Barcode Engine", "Html5 Qrcode Scanner Library", "Hardware camera optical EAN 13 barcode detection in browser"],
        ["Acoustic Feedback", "Web Audio API (Synthesized Oscillators)", "Real time laser scan beeps, success chimes, and alert tones"],
        ["Data Visualization", "Chart.js Library", "Dynamic revenue trend lines, doughnut share charts, margin bars"],
        ["Backend Runtime", "Node js (v20+ LTS)", "High throughput non blocking asynchronous server environment"],
        ["API Framework", "Express js", "RESTful endpoint routing, JSON payload parsing, HTTP status codes"],
        ["Database Driver", "Node Postgres (pg connection pool)", "Connection pooling, parameterized prepared statements, ACID blocks"],
        ["Database Engine", "PostgreSQL 16 (and MySQL 8.0 DDL)", "ACID relational persistence, foreign keys, triggers, B Tree indexes"],
        ["DevOps & Container", "Docker and Docker Compose", "Multi container application orchestration (App Server and Postgres DB)"],
        ["Data Modeling", "Draw.io / diagrams.net", "Standard relational ER modeling, XML schema serialization"]
    ]
    add_styled_table(doc, ["Architectural Layer", "Technology / Tool Utilized", "Engineering Purpose and Contribution"], tech_stack_rows, [1.6, 2.4, 3.2])
    
    add_styled_heading(doc, "5.1 Frontend Architecture and Client Technologies", level=2)
    add_body_p(doc, "The client application is architected as a modular multi page application (MPA) written in semantic HTML5 and styled with modern CSS3 using custom properties (CSS variables). A responsive healthcare design system was crafted using a clean slate and ocean blue palette (#0284C7, #0F172A, #10B981, #EF4444). Hardware camera optical barcode recognition is achieved using the Html5 Qrcode engine, allowing any standard smartphone or web camera to serve as an optical scanner. The Web Audio API provides synthesized acoustic feedback, mimicking industrial barcode scanners.")
    
    add_styled_heading(doc, "5.2 Backend API Services and Server Architecture", level=2)
    add_body_p(doc, "The backend server is implemented using Node js and Express js. The API architecture adheres to RESTful design conventions, exposing clean endpoints for authentication, medicine catalog operations, inventory adjustments, purchase order generation, prescription management, point of sale transactions, customer credit settlements, and business analytics. SQL injection vulnerabilities are eliminated by strictly utilizing parameterized queries across all database access operations.")
    
    add_styled_heading(doc, "5.3 Relational Database Engine and Performance Optimization", level=2)
    add_body_p(doc, "PostgreSQL 16 was selected as the primary relational database management system due to its robust support for ACID transactions, advanced indexing, foreign key enforcement, and check constraints. The database connection pool is configured with a maximum of twenty concurrent connections, ensuring high throughput under concurrent terminal loads while preventing database connection exhaustion.")
    
    doc.add_page_break()
    
    # --------------------------------------------------------------------------
    # CHAPTER 6: RESULT AND IMPLEMENTATION
    # --------------------------------------------------------------------------
    add_styled_heading(doc, "6. Result and Implementation", level=1)
    add_body_p(doc, "This chapter presents the concrete implementation results of the CURO Medical Management System. Every major operational module is systematically reviewed with accompanying user interface screenshots, database transaction details, and operational workflows.")
    
    # 6.1 Authentication and RBAC
    add_styled_heading(doc, "6.1 Authentication and Role Based Access Control", level=2)
    add_body_p(doc, "User authentication is implemented via a modern split pane login portal. The left pane showcases clinical branding and institutional accreditation, while the right pane presents the credential entry form. System accounts are protected by salted password hashing, and user sessions are governed by a granular Role Based Access Control (RBAC) matrix.")
    
    add_image_figure(doc, "Frontend - Copy/Screenshot 2026-11-16 195540.png", "Figure 6", "Medical Portal Authentication and Role Based Access Control Login", width_in=5.6)
    
    add_body_p(doc, "Table 6.1 details the operational authority granted to each organizational role within the CURO ecosystem.")
    
    rbac_rows = [
        ["Medicine Master CRUD", "Full Access", "Full Access", "Read Only", "Full Access", "Read Only"],
        ["Batch Registration & FEFO", "Full Access", "Full Access", "View Only", "Full Access", "No Access"],
        ["POS Cashiering & Billing", "Full Access", "Full Access", "Full Access", "View Only", "No Access"],
        ["Sales Return Authorization", "Full Access", "Full Access", "Approval Req", "No Access", "No Access"],
        ["Purchase Orders & Receipts", "Full Access", "Read Only", "No Access", "Full Access", "No Access"],
        ["Digital Prescriptions", "View / Dispense", "Dispense", "Dispense", "No Access", "Create & Sign"],
        ["Financial & BI Analytics", "Full Access", "Limited", "No Access", "Stock Only", "No Access"],
        ["User Admin & Audit Trail", "Full Access", "No Access", "No Access", "No Access", "No Access"]
    ]
    add_styled_table(doc, ["Operational Capability", "Administrator", "Pharmacist", "Cashier", "Inventory Mgr", "Doctor / Staff"], rbac_rows, [1.9, 1.0, 1.0, 1.0, 1.1, 1.2])
    
    add_body_p(doc, "User management functions are located within the Users and RBAC administration console. Administrators can review active staff profiles, inspect the authority matrix, and register new personnel with specific clinical designations.")
    
    add_image_figure(doc, "Frontend - Copy/Screenshot 2026-11-17 125005.png", "Figure 44", "Staff Directory and User Accounts Management", width_in=5.8)
    add_image_figure(doc, "Frontend - Copy/Screenshot 2026-11-17 125036.png", "Figure 45", "Role Based Access Control Authority Matrix Configuration", width_in=5.8)
    
    # 6.2 Executive Dashboard and Telemetry
    add_styled_heading(doc, "6.2 Executive Dashboard and Operational Telemetry", level=2)
    add_body_p(doc, "Upon authentication, staff members are directed to the Executive Dashboard. The dashboard aggregates operational telemetry, presenting active medicine counts, total batch tracked units, daily audited point of sale revenue, and active stock warnings. A live sales progression chart tracks financial inflow, while an inventory integrity bar visualizes overall stock health.")
    
    add_image_figure(doc, "Frontend - Copy/Screenshot 2026-11-17 122522.png", "Figure 7", "Executive Dashboard Overview and Featured Clinical Medication Catalog", width_in=5.8)
    add_image_figure(doc, "Frontend - Copy/Screenshot 2026-11-17 122616.png", "Figure 8", "Operational Telemetry and Revenue Progression Analytics", width_in=5.8)
    add_image_figure(doc, "Frontend - Copy/Screenshot 2026-11-17 122647.png", "Figure 9", "Real Time POS Invoice Stream and Patient Order Audit", width_in=5.8)
    
    # 6.3 Pharmaceutical Master Catalog
    add_styled_heading(doc, "6.3 Pharmaceutical Master Catalog Management", level=2)
    add_body_p(doc, "The Master Catalog module manages pharmaceutical products, categories, chemical compositions, dosage forms, and barcode identifiers. Each medicine is linked to an authorized manufacturer and therapeutic category. Configurable reorder thresholds enable the system to trigger early replenishment alerts automatically.")
    
    add_image_figure(doc, "Frontend - Copy/Screenshot 2026-11-17 123310.png", "Figure 15", "Pharmaceutical Master Data and Medicine Catalog Management Table", width_in=5.8)
    add_side_by_side_figures(
        doc,
        "Frontend - Copy/Screenshot 2026-11-17 123345.png", "Figure 16", "Add New Medicine Record Modal Dialog", 3.4,
        "Frontend - Copy/Screenshot 2026-11-17 123425.png", "Figure 17", "Medicine Therapeutic Categories Configuration Modal Dialog", 3.1
    )
    
    # 6.4 FEFO Inventory and Batch Control
    add_styled_heading(doc, "6.4 First Expired First Out (FEFO) Inventory and Batch Control", level=2)
    add_body_p(doc, "Inventory is tracked at the discrete batch level rather than aggregated counts. Each batch record stores manufacture date, expiration date, purchase cost, retail selling rate, maximum retail price (MRP), and warehouse rack coordinates. Batches are indexed in First Expired First Out (FEFO) sequence, guaranteeing that lots closest to expiration are allocated first during sales.")
    add_body_p(doc, "All adjustments for damaged goods or breakage require mandatory audit notes and are recorded in the immutable stock movement ledger, ensuring complete traceability.")
    
    add_image_figure(doc, "Frontend - Copy/Screenshot 2026-11-17 123547.png", "Figure 18", "First Expired First Out Inventory Batch Tracking and Valuation", width_in=5.8)
    add_image_figure(doc, "Frontend - Copy/Screenshot 2026-11-17 123624.png", "Figure 19", "Immutable Stock Movement Ledger and Transaction Audit Trail", width_in=5.8)
    add_side_by_side_figures(
        doc,
        "Frontend - Copy/Screenshot 2026-11-17 123651.png", "Figure 20", "Register New Stock Batch Inward Modal Dialog", 3.4,
        "Frontend - Copy/Screenshot 2026-11-17 123742.png", "Figure 21", "Inventory Stock Adjustment and Damaged Goods Disposal Dialog", 3.1
    )
    
    # 6.5 Supply Chain Procurement
    add_styled_heading(doc, "6.5 Supply Chain Procurement and Supplier Accounts", level=2)
    add_body_p(doc, "Procurement workflows handle supplier accounts, formal purchase orders, goods receipt verification, and credit payment settlements. When incoming shipments arrive, staff verify items against the purchase order, registering batch numbers directly into the FEFO queue. Supplier ledgers track credit period days and outstanding payables.")
    
    add_image_figure(doc, "Frontend - Copy/Screenshot 2026-11-17 123827.png", "Figure 22", "Purchase Orders Registry and Goods Inward Receiving Management", width_in=5.8)
    add_image_figure(doc, "Frontend - Copy/Screenshot 2026-11-17 123852.png", "Figure 23", "Pharmaceutical Suppliers Directory and Credit Balance Ledger", width_in=5.8)
    add_side_by_side_figures(
        doc,
        "Frontend - Copy/ds.png", "Figure 24", "Record Supplier Settlement Payment Modal Dialog", 3.1,
        "Frontend - Copy/Screenshot 2026-11-17 123951.png", "Figure 25", "Register New Pharmaceutical Supplier Modal Dialog", 3.1
    )
    add_image_figure(doc, "Frontend - Copy/Screenshot 2026-11-17 124014.png", "Figure 26", "Create Purchase Order Procurement Modal Dialog", width_in=4.4)
    
    # 6.6 Clinical Prescriptions
    add_styled_heading(doc, "6.6 Clinical Prescriptions and Physician Registry", level=2)
    add_body_p(doc, "The clinical prescription module bridges medical consultations with pharmaceutical dispensing. Licensed medical practitioners are registered with official licensing numbers and chamber locations. Physicians create digital prescriptions detailing diagnoses, prescribed medications, dosages, and duration in days. With one click, pharmacists can forward verified prescriptions into the POS cashier cart for immediate dispensing.")
    
    add_image_figure(doc, "Frontend - Copy/Screenshot 2026-11-17 124043.png", "Figure 27", "Clinical Prescription Management and Dispensing Archive Table", width_in=5.8)
    add_image_figure(doc, "Frontend - Copy/Screenshot 2026-11-17 124111.png", "Figure 28", "Registered Physicians and Medical Practitioners Directory", width_in=5.8)
    add_side_by_side_figures(
        doc,
        "Frontend - Copy/Screenshot 2026-11-17 124131.png", "Figure 29", "Register Medical Practitioner Credential Modal Dialog", 3.1,
        "Frontend - Copy/Screenshot 2026-11-17 124156.png", "Figure 30", "Digital Prescription Pad and Clinical Order Entry Dialog", 3.4
    )
    
    # 6.7 Optical POS Terminal
    add_styled_heading(doc, "6.7 Optical Point of Sale (POS) Cashier Terminal", level=2)
    add_body_p(doc, "The POS cashier terminal provides a high throughput retail dispensing interface. Cashiers can select medications visually from a categorized grid, search manually by brand or generic name, or scan physical EAN 13 barcodes using the integrated optical camera scanner. An acoustic synthesizer generates real time audio chimes upon successful scanning. The checkout modal computes 5% GST tax, applies loyalty discounts, handles split payments, and generates printable thermal tax invoices.")
    
    add_image_figure(doc, "Frontend - Copy/Screenshot 2026-11-17 122727.png", "Figure 10", "Point of Sale Terminal Cashier Interface and Product Selection Grid", width_in=5.8)
    add_side_by_side_figures(
        doc,
        "Frontend - Copy/Screenshot 2026-11-17 122825.png", "Figure 11", "Optical Barcode Scanner and Camera Capture Modal Dialog", 3.4,
        "Frontend - Copy/Screenshot 2026-11-17 122945.png", "Figure 12", "Point of Sale Terminal Responsive Mobile Dispensing Layout", 3.2
    )
    add_side_by_side_figures(
        doc,
        "Frontend - Copy/Screenshot 2026-11-17 123127.png", "Figure 13", "Point of Sale Checkout Cart with Patient Selection and Tax Summary", 3.1,
        "Frontend - Copy/Screenshot 2026-11-17 123221.png", "Figure 14", "Official GST Compliant Invoice Receipt Modal Dialog", 3.4
    )
    
    # 6.8 Patient Profiles and Credit Control
    add_styled_heading(doc, "6.8 Patient Profiles and Credit Control Management", level=2)
    add_body_p(doc, "Chronic patients and institutional clients are registered in the customer directory. The database enforces credit limits, preventing cashiers from extending credit beyond pre authorized thresholds. When patients make partial or full debt repayments, cashiers record the settlement, generating a settlement reference and instantly updating the customer credit ledger.")
    
    add_image_figure(doc, "Frontend - Copy/Screenshot 2026-11-17 124237.png", "Figure 31", "Patient Directory and Customer Credit Control Management", width_in=5.8)
    add_side_by_side_figures(
        doc,
        "Frontend - Copy/Screenshot 2026-11-17 124327.png", "Figure 32", "Collect Patient Credit Settlement Modal Dialog", 3.1,
        "Frontend - Copy/Screenshot 2026-11-17 124352.png", "Figure 33", "Register New Customer Patient Profile Modal Dialog", 3.1
    )
    add_side_by_side_figures(
        doc,
        "Frontend - Copy/Screenshot 2026-11-17 124417.png", "Figure 34", "Edit Customer Information and Credit Limit Modal Dialog", 3.1,
        "Frontend - Copy/Screenshot 2026-11-17 125139.png", "Figure 47", "Register System Staff User Account Modal Dialog", 3.1
    )
    
    # 6.9 Billing and Invoices
    add_styled_heading(doc, "6.9 Billing, Tax Invoices, and Sales Returns Restocking", level=2)
    add_body_p(doc, "The billing module maintains a searchable archive of all historical sales transactions and tax invoices. In the event of medication returns, authorized staff initiate a sales return with mandatory reason codes. The system automatically restocks the returned quantity back into its original batch and updates financial balances.")
    
    add_image_figure(doc, "Frontend - Copy/Screenshot 2026-11-17 124452.png", "Figure 35", "Invoices and Billing Directory with Cashier Transaction History", width_in=5.8)
    add_image_figure(doc, "Frontend - Copy/Screenshot 2026-11-17 124519.png", "Figure 36", "Sales Returns History and Restock Audit Ledger", width_in=5.8)
    
    # 6.10 Early Warning Alerts Center
    add_styled_heading(doc, "6.10 Early Warning Stock Intelligence and Alerts Center", level=2)
    add_body_p(doc, "The Alerts Center continuously evaluates inventory health against mathematical safety buffers. The system generates four categories of early warning intelligence:")
    add_bullet_p(doc, "Low Stock Warnings:", "Identifies active drugs where total batch inventory falls below the defined reorder threshold, calculating recommended order quantities.")
    add_bullet_p(doc, "Near Expiry Alerts:", "Highlights batches expiring within sixty days, allowing pharmacists to mark them for promotional clearance or return.")
    add_bullet_p(doc, "Dead Stock Detection:", "Identifies slow moving formulations with zero sales velocity over extended intervals, quantifying tied up capital value.")
    add_bullet_p(doc, "Automated Reorder Engine:", "Dynamically recommends purchase order volumes based on sales velocity run rates and lead times.")
    
    add_image_figure(doc, "Frontend - Copy/Screenshot 2026-11-17 124741.png", "Figure 40", "Low Stock Warnings and Inventory Alerts Center", width_in=5.8)
    add_image_figure(doc, "Frontend - Copy/Screenshot 2026-11-17 124807.png", "Figure 41", "Near Expiry and Expired Batches Early Warning Action Center", width_in=5.8)
    add_image_figure(doc, "Frontend - Copy/Screenshot 2026-11-17 124835.png", "Figure 42", "Dead Stock Detection and Tied Up Capital Analysis", width_in=5.8)
    add_image_figure(doc, "Frontend - Copy/Screenshot 2026-11-17 124904.png", "Figure 43", "Automated Replenishment Engine and Reorder Recommendations", width_in=5.8)
    
    # 6.11 Business Intelligence Analytics
    add_styled_heading(doc, "6.11 Business Intelligence Analytics and Demand Forecasting", level=2)
    add_body_p(doc, "The Business Intelligence module computes key financial metrics: gross sales revenue, gross profit, operating margin percentage, and total stock valuation at cost. Visual charts display continuous sales progressions and category market share distributions. A statistical forecasting engine predicts thirty day pharmaceutical replenishment demand based on historical run rates.")
    
    add_image_figure(doc, "Frontend - Copy/Screenshot 2026-11-17 124557.png", "Figure 37", "Business Intelligence Executive Dashboard and Revenue Trends", width_in=5.8)
    add_image_figure(doc, "Frontend - Copy/Screenshot 2026-11-17 124632.png", "Figure 38", "Predictive Thirty Day Sales Demand Forecast and Profit Margins", width_in=5.8)
    add_image_figure(doc, "Frontend - Copy/Screenshot 2026-11-17 124655.png", "Figure 39", "Fast Moving and Slow Moving Stock Analytics and Risk Detection", width_in=5.8)
    
    # 6.12 System Mutation Audit Trail
    add_styled_heading(doc, "6.12 System Mutation Audit Trail and Security Ledger", level=2)
    add_body_p(doc, "To comply with international healthcare governance standards and medical audit regulations, all database mutations (user logins, customer creations, credit settlements, supplier payments, batch adjustments, and POS checkouts) are permanently recorded in an append only audit ledger. Each log entry stores the timestamp, acting user name, action type, affected table, record identifier, and specific mutation details.")
    
    add_image_figure(doc, "Frontend - Copy/Screenshot 2026-11-17 125105.png", "Figure 46", "Immutable Real Time System Audit Trail and Database Mutations", width_in=5.8)
    
    # --------------------------------------------------------------------------
    # CHAPTER 7: LIMITATIONS
    # --------------------------------------------------------------------------
    add_styled_heading(doc, "7. Limitations", level=1)
    add_body_p(doc, "While the CURO Medical Management System successfully satisfies all primary technical and operational objectives, several technical limitations exist within the current implementation:")
    add_bullet_p(doc, "Single Region Database Deployment:", "The current database cluster operates within a single cloud availability zone. Although daily automated snapshots are configured, active active multi region database replication with automated geographic failover is not yet implemented.")
    add_bullet_p(doc, "Optical Camera Barcode Sensitivity:", "The in browser optical barcode recognition engine relies on device camera focus and ambient lighting conditions. In dimly lit dispensary settings or with damaged barcode labels, reading latency increases compared to dedicated industrial laser hardware scanners.")
    add_bullet_p(doc, "External Banking Gateway Boundaries:", "Customer credit settlements and supplier payments currently log transaction reference numbers and payment modes. Live integration with national banking clearing networks or automated credit card acquiring gateways has not been incorporated.")
    add_bullet_p(doc, "Absence of Automated SMS Gateway:", "Critical stock alerts and prescription ready notifications are currently presented through in application notification toasts and telemetry dashboards rather than outbound telecommunication SMS channels.")
    
    # --------------------------------------------------------------------------
    # CHAPTER 8: CONCLUSION
    # --------------------------------------------------------------------------
    add_styled_heading(doc, "8. Conclusion", level=1)
    add_body_p(doc, "The CURO Medical Management System demonstrates how modern relational database principles, disciplined software architecture, and user centric design can transform clinical dispensing and healthcare pharmacy operations. By replacing fragmented paper ledgers and disconnected spreadsheets with a unified Third Normal Form (3NF) relational database, the system effectively resolves the chronic challenges of pharmaceutical expiration losses, prescription billing errors, and unmonitored customer credit defaults.")
    add_body_p(doc, "Through its First Expired First Out (FEFO) batch allocation engine, camera optical barcode scanning, atomic ACID transaction processing, and immutable audit logging, CURO achieves a high level of operational efficiency and compliance with World Health Organization Good Pharmacy Practice standards. The successful implementation and verification of twenty relational tables and twelve interactive modules confirm that the platform is robust, scalable, and prepared for real world clinical deployment.")
    
    # --------------------------------------------------------------------------
    # CHAPTER 9: FUTURE WORK
    # --------------------------------------------------------------------------
    add_styled_heading(doc, "9. Future Work", level=1)
    add_body_p(doc, "Future enhancements planned for subsequent engineering iterations of the CURO platform include:")
    add_bullet_p(doc, "Machine Learning Enhanced Demand Forecasting:", "Upgrade the current statistical velocity run rate forecasting model to a deep learning time series model (e.g. LSTM or Prophet) incorporating seasonal epidemiology, weather patterns, and local disease outbreak telemetry.")
    add_bullet_p(doc, "HL7 and FHIR Health Record Interoperability:", "Implement standardized HL7 Fast Healthcare Interoperability Resources (FHIR) API connectors to enable seamless electronic health record exchange with hospital management systems and diagnostic laboratories.")
    add_bullet_p(doc, "Native Cross Platform Mobile Applications:", "Develop dedicated native mobile applications for iOS and Android using Flutter or React Native to empower community healthcare workers and visiting doctors in remote clinical settings.")
    add_bullet_p(doc, "Biometric Multi Factor Authentication:", "Integrate biometric fingerprint authentication and FIDO2 hardware security keys for cashier authorization and high value prescription sign off.")
    add_bullet_p(doc, "Automated SMS and WhatsApp Notification Dispatch:", "Integrate cloud telecommunication gateways (e.g. Twilio) to deliver automated prescription refilling reminders and payment confirmation receipts directly to patient mobile phones.")
    
    # --------------------------------------------------------------------------
    # CHAPTER 10: REFERENCES
    # --------------------------------------------------------------------------
    add_styled_heading(doc, "10. References", level=1)
    references = [
        "[1] R. Elmasri and S. B. Navathe, Fundamentals of Database Systems, 7th ed. Hoboken, NJ, USA: Pearson, 2016.",
        "[2] A. Silberschatz, H. F. Korth and S. Sudarshan, Database System Concepts, 7th ed. New York, NY, USA: McGraw Hill, 2019.",
        "[3] C. J. Date, An Introduction to Database Systems, 8th ed. Boston, MA, USA: Addison Wesley, 2004.",
        "[4] E. Gamma, R. Helm, R. Johnson and J. Vlissides, Design Patterns: Elements of Reusable Object Oriented Software. Reading, MA, USA: Addison Wesley, 1994.",
        "[5] I. Sommerville, Software Engineering, 10th ed. Harlow, UK: Pearson, 2015.",
        "[6] World Health Organization and International Pharmaceutical Federation, Joint FIP/WHO Guidelines on Good Pharmacy Practice: Standards for Quality of Pharmacy Services. WHO Technical Report Series, No. 961, Geneva, Switzerland: World Health Organization, 2011.",
        "[7] The PostgreSQL Global Development Group, PostgreSQL 16.0 Documentation. Available: https://www.postgresql.org/docs/16/index.html",
        "[8] Node.js Foundation, Node.js v20.x LTS API Documentation. Available: https://nodejs.org/api/",
        "[9] Express.js Project, Express Fast, Unopinionated, Minimalist Web Framework for Node.js. Available: https://expressjs.com/",
        "[10] GS1 Global Office, GS1 General Specifications: The Foundational GS1 Standard that Defines How Data is Encoded in Barcodes. Brussels, Belgium: GS1, 2023."
    ]
    for ref in references:
        add_body_p(doc, ref, space_after=4)
        
    # Save Document
    docx_file = os.path.abspath("CURO_DBMS_Project_Report.docx")
    pdf_file = os.path.abspath("CURO_DBMS_Project_Report.pdf")
    
    doc.save(docx_file)
    print(f"Word document saved successfully to: {docx_file}")
    
    # Convert to PDF via Word COM Automation
    print("Converting Word document to PDF using Microsoft Word COM Automation...")
    word = win32com.client.Dispatch("Word.Application")
    word.Visible = False
    try:
        wb = word.Documents.Open(docx_file)
        wb.SaveAs(pdf_file, FileFormat=17) # 17 = wdFormatPDF
        wb.Close()
        print(f"PDF document saved successfully to: {pdf_file}")
    except Exception as e:
        print(f"Error during Word PDF conversion: {e}")
    finally:
        word.Quit()
        
    print("Report generation complete!")

if __name__ == "__main__":
    build_full_report()
