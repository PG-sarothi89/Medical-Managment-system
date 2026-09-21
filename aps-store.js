/**
 * APS Medical Management System — Unified Data & State Engine
 * Robust localStorage-backed relational store with FEFO batch management,
 * transactional sales, inventory ledger, audit logging, and seed database.
 */

window.APSStore = (() => {
  "use strict";

  const STORAGE_PREFIX = "aps_db_";

  const KEYS = {
    INITIALIZED: STORAGE_PREFIX + "initialized_v2",
    USERS: STORAGE_PREFIX + "users",
    ROLES: STORAGE_PREFIX + "roles",
    CATEGORIES: STORAGE_PREFIX + "categories",
    MANUFACTURERS: STORAGE_PREFIX + "manufacturers",
    MEDICINES: STORAGE_PREFIX + "medicines",
    BATCHES: STORAGE_PREFIX + "batches",
    MOVEMENTS: STORAGE_PREFIX + "inventory_movements",
    SUPPLIERS: STORAGE_PREFIX + "suppliers",
    PURCHASE_ORDERS: STORAGE_PREFIX + "purchase_orders",
    PURCHASES: STORAGE_PREFIX + "purchases",
    CUSTOMERS: STORAGE_PREFIX + "customers",
    DOCTORS: STORAGE_PREFIX + "doctors",
    PRESCRIPTIONS: STORAGE_PREFIX + "prescriptions",
    SALES: STORAGE_PREFIX + "sales",
    INVOICES: STORAGE_PREFIX + "invoices",
    PAYMENTS: STORAGE_PREFIX + "payments",
    RETURNS: STORAGE_PREFIX + "returns",
    AUDIT_LOGS: STORAGE_PREFIX + "audit_logs"
  };

  // Safe JSON loaders
  function load(key, fallback) {
    try {
      const data = localStorage.getItem(key);
      return data ? JSON.parse(data) : fallback;
    } catch (e) {
      console.error("APSStore load error on " + key, e);
      return fallback;
    }
  }

  function save(key, data) {
    try {
      localStorage.setItem(key, JSON.stringify(data));
    } catch (e) {
      console.error("APSStore save error on " + key, e);
    }
  }

  function uid(prefix = "id") {
    return `${prefix}_${Date.now().toString(36)}_${Math.random().toString(36).substring(2, 6)}`;
  }

  function todayStr(offsetDays = 0) {
    const d = new Date();
    d.setDate(d.getDate() + offsetDays);
    return d.toISOString().split("T")[0];
  }

  /* =========================================================
     SEED DATABASE INITIALIZATION
  ========================================================== */

  function initDatabase(force = false) {
    if (!force && localStorage.getItem(KEYS.INITIALIZED) === "true") {
      return;
    }

    // 1. Roles & Permissions
    const roles = [
      { id: "admin", name: "Administrator", description: "Full system control, financials, user management" },
      { id: "pharmacist", name: "Pharmacist", description: "Dispense medicines, verify prescriptions, manage inventory" },
      { id: "cashier", name: "Cashier", description: "Process POS sales, invoices, customer credit collection" },
      { id: "inventory_manager", name: "Inventory Manager", description: "Purchase orders, goods receipt, batch control" },
      { id: "doctor", name: "Doctor / Staff", description: "Write prescriptions, view clinical medicine catalog" }
    ];

    // 2. Users (with distinct clinical and operational designations)
    const users = [
      { id: "usr-1", username: "admin", email: "pg@gmail.com", password: "root", name: "Partho Ghosh", designation: "Chief Administrative Officer", role: "admin", roleTitle: "Administrator", phone: "+880 1711-000111", isActive: true },
      { id: "usr-2", username: "pharmacist", email: "pharmacist@aps.com", password: "root", name: "Aritry Talukdar", designation: "Senior Clinical Pharmacist", role: "pharmacist", roleTitle: "Pharmacist", phone: "+880 1812-222333", isActive: true },
      { id: "usr-3", username: "cashier", email: "cashier@aps.com", password: "root", name: "Rahim Uddin", designation: "Chief POS Cashier", role: "cashier", roleTitle: "Cashier", phone: "+880 1913-444555", isActive: true },
      { id: "usr-4", username: "inventory", email: "inventory@aps.com", password: "root", name: "Kamal Hossain", designation: "Lead Inventory & Logistics Manager", role: "inventory_manager", roleTitle: "Inventory Manager", phone: "+880 1614-666777", isActive: true },
      { id: "usr-5", username: "doctor", email: "doctor@aps.com", password: "root", name: "Dr. Mahfuzur Rahman", designation: "Consultant Physician & Diabetologist", role: "doctor", roleTitle: "Doctor / Staff", phone: "+880 1515-888999", isActive: true }
    ];

    // 3. Categories
    const categories = [
      { id: "cat-1", name: "Analgesics & Pain Relief", parentId: null, description: "Pain relievers and antipyretics" },
      { id: "cat-2", name: "Antibiotics & Antimicrobials", parentId: null, description: "Bacterial infection treatments" },
      { id: "cat-3", name: "Antacids & Gastrointestinal", parentId: null, description: "Heartburn, ulcer and digestive care" },
      { id: "cat-4", name: "Vitamins & Supplements", parentId: null, description: "Nutritional supplements and minerals" },
      { id: "cat-5", name: "Antihistamines & Allergy", parentId: null, description: "Allergic rhinitis and urticaria" },
      { id: "cat-6", name: "Diabetic Care", parentId: null, description: "Blood glucose management and insulin" },
      { id: "cat-7", name: "Cardiovascular & Hypertension", parentId: null, description: "Blood pressure and lipid-lowering" },
      { id: "cat-8", name: "Respiratory & Cough", parentId: null, description: "Bronchodilators and cough syrups" }
    ];

    // 4. Manufacturers
    const manufacturers = [
      { id: "mfr-1", name: "Square Pharmaceuticals PLC", contact: "dhaka@squarepharma.com.bd | +880-2-8833047" },
      { id: "mfr-2", name: "Beximco Pharmaceuticals Ltd", contact: "info@bpl.net | +880-2-58611001" },
      { id: "mfr-3", name: "Incepta Pharmaceuticals Ltd", contact: "info@inceptapharma.com | +880-2-8891688" },
      { id: "mfr-4", name: "Renata Limited", contact: "corporate@renata-ltd.com | +880-2-9004592" },
      { id: "mfr-5", name: "ACI Healthcare Limited", contact: "info@aci-bd.com | +880-2-8878600" },
      { id: "mfr-6", name: "Novo Nordisk Bangladesh", contact: "bd-info@novonordisk.com | +880-2-9883344" }
    ];

    // 5. Suppliers
    const suppliers = [
      { id: "sup-1", name: "Square Distribution Logistics", contactPerson: "Asif Iqbal", phone: "+880 1711-223344", email: "dist@square.com", address: "Tejgaon I/A, Dhaka", gstin: "GST-BD-0091823", creditPeriodDays: 30, outstandingBalance: 45200 },
      { id: "sup-2", name: "Beximco Prime Distributors", contactPerson: "Tanvir Ahmed", phone: "+880 1819-334455", email: "supply@beximco.com", address: "Tongi, Gazipur", gstin: "GST-BD-0082736", creditPeriodDays: 45, outstandingBalance: 32000 },
      { id: "sup-3", name: "Incepta Med Supply Ltd", contactPerson: "Kazi Nurul", phone: "+880 1912-778899", email: "orders@incepta.com", address: "Savar, Dhaka", gstin: "GST-BD-0073625", creditPeriodDays: 30, outstandingBalance: 18500 },
      { id: "sup-4", name: "Renata Direct Healthcare", contactPerson: "Morshed Alam", phone: "+880 1618-556677", email: "supply@renata.com", address: "Mirpur, Dhaka", gstin: "GST-BD-0064514", creditPeriodDays: 60, outstandingBalance: 0 }
    ];

    // 6. Medicines (Master)
    const medicines = [
      { id: "med-1", name: "Napa Extra 500mg/65mg", generic: "Paracetamol + Caffeine", categoryId: "cat-1", manufacturerId: "mfr-1", composition: "Paracetamol 500mg, Caffeine 65mg", unit: "Tablet", hsn: "3004.90", barcode: "8901234500011", requiresPrescription: false, reorderLevel: 100, reorderQuantity: 300, isActive: true },
      { id: "med-2", name: "Moxacil 500mg Capsule", generic: "Amoxicillin Trihydrate", categoryId: "cat-2", manufacturerId: "mfr-1", composition: "Amoxicillin 500mg", unit: "Capsule", hsn: "3004.10", barcode: "8901234500028", requiresPrescription: true, reorderLevel: 60, reorderQuantity: 150, isActive: true },
      { id: "med-3", name: "Seclo 20mg Capsule", generic: "Omeprazole", categoryId: "cat-3", manufacturerId: "mfr-1", composition: "Omeprazole 20mg pellet", unit: "Capsule", hsn: "3004.90", barcode: "8901234500035", requiresPrescription: false, reorderLevel: 80, reorderQuantity: 200, isActive: true },
      { id: "med-4", name: "Alatrol 10mg Tablet", generic: "Cetirizine Dihydrochloride", categoryId: "cat-5", manufacturerId: "mfr-1", composition: "Cetirizine 10mg", unit: "Tablet", hsn: "3004.90", barcode: "8901234500042", requiresPrescription: false, reorderLevel: 40, reorderQuantity: 120, isActive: true },
      { id: "med-5", name: "Comet 500mg Tablet", generic: "Metformin Hydrochloride", categoryId: "cat-6", manufacturerId: "mfr-1", composition: "Metformin HCl 500mg", unit: "Tablet", hsn: "3004.90", barcode: "8901234500059", requiresPrescription: true, reorderLevel: 90, reorderQuantity: 250, isActive: true },
      { id: "med-6", name: "Atova 10mg Tablet", generic: "Atorvastatin Calcium", categoryId: "cat-7", manufacturerId: "mfr-2", composition: "Atorvastatin 10mg", unit: "Tablet", hsn: "3004.90", barcode: "8901234500066", requiresPrescription: true, reorderLevel: 50, reorderQuantity: 150, isActive: true },
      { id: "med-7", name: "D-Rise 20000 IU Capsule", generic: "Cholecalciferol (Vitamin D3)", categoryId: "cat-4", manufacturerId: "mfr-3", composition: "Cholecalciferol 20,000 IU", unit: "Capsule", hsn: "2936.29", barcode: "8901234500073", requiresPrescription: false, reorderLevel: 30, reorderQuantity: 100, isActive: true },
      { id: "med-8", name: "Zimax 500mg Tablet", generic: "Azithromycin Dihydrate", categoryId: "cat-2", manufacturerId: "mfr-2", composition: "Azithromycin 500mg", unit: "Tablet", hsn: "3004.20", barcode: "8901234500080", requiresPrescription: true, reorderLevel: 45, reorderQuantity: 120, isActive: true },
      { id: "med-9", name: "Flamyd 400mg Tablet", generic: "Metronidazole", categoryId: "cat-2", manufacturerId: "mfr-5", composition: "Metronidazole 400mg", unit: "Tablet", hsn: "3004.90", barcode: "8901234500097", requiresPrescription: true, reorderLevel: 40, reorderQuantity: 100, isActive: true },
      { id: "med-10", name: "Ventolin Evohaler 100mcg", generic: "Salbutamol Sulphate", categoryId: "cat-8", manufacturerId: "mfr-6", composition: "Salbutamol 100mcg/actuation", unit: "Inhaler", hsn: "3004.90", barcode: "8901234500103", requiresPrescription: true, reorderLevel: 15, reorderQuantity: 40, isActive: true },
      { id: "med-11", name: "Entacyd Plus Suspension 200ml", generic: "Aluminium Hydroxide + Magnesium", categoryId: "cat-3", manufacturerId: "mfr-1", composition: "Al(OH)3 200mg + Mg(OH)2 200mg/5ml", unit: "Bottle", hsn: "3004.90", barcode: "8901234500110", requiresPrescription: false, reorderLevel: 25, reorderQuantity: 60, isActive: true },
      { id: "med-12", name: "Mixtard 30 HM 100 IU/ml", generic: "Biphasic Isophane Insulin", categoryId: "cat-6", manufacturerId: "mfr-6", composition: "Soluble Insulin 30% + Isophane 70%", unit: "Vial", hsn: "3004.31", barcode: "8901234500127", requiresPrescription: true, reorderLevel: 20, reorderQuantity: 50, isActive: true },
      { id: "med-13", name: "Rivotril 0.5mg Tablet", generic: "Clonazepam", categoryId: "cat-7", manufacturerId: "mfr-4", composition: "Clonazepam 0.5mg", unit: "Tablet", hsn: "3004.90", barcode: "8901234500134", requiresPrescription: true, reorderLevel: 35, reorderQuantity: 100, isActive: true },
      { id: "med-14", name: "Tofen 100ml Syrup", generic: "Ketotifen Fumarate", categoryId: "cat-8", manufacturerId: "mfr-2", composition: "Ketotifen 1mg/5ml", unit: "Bottle", hsn: "3004.90", barcode: "8901234500141", requiresPrescription: false, reorderLevel: 20, reorderQuantity: 50, isActive: true }
    ];

    // 7. Batches (FEFO Tracked!)
    // Note dates: some fresh, some near expiry (<45 days), some expired for testing alert modules!
    const batches = [
      // med-1 Napa Extra
      { id: "bat-101", medicineId: "med-1", batchNumber: "NE-2024A", manufactureDate: "2024-03-10", expiryDate: todayStr(22), purchasePrice: 2.10, sellingPrice: 3.00, mrp: 3.00, quantityReceived: 300, quantityAvailable: 45, supplierId: "sup-1" },
      { id: "bat-102", medicineId: "med-1", batchNumber: "NE-2024B", manufactureDate: "2024-06-15", expiryDate: todayStr(240), purchasePrice: 2.10, sellingPrice: 3.00, mrp: 3.00, quantityReceived: 500, quantityAvailable: 380, supplierId: "sup-1" },
      
      // med-2 Moxacil
      { id: "bat-103", medicineId: "med-2", batchNumber: "MX-2401", manufactureDate: "2024-01-20", expiryDate: todayStr(180), purchasePrice: 5.50, sellingPrice: 7.50, mrp: 8.00, quantityReceived: 200, quantityAvailable: 48, supplierId: "sup-1" },

      // med-3 Seclo 20
      { id: "bat-104", medicineId: "med-3", batchNumber: "SC-9821", manufactureDate: "2024-04-10", expiryDate: todayStr(310), purchasePrice: 4.80, sellingPrice: 6.50, mrp: 7.00, quantityReceived: 400, quantityAvailable: 260, supplierId: "sup-1" },

      // med-4 Alatrol 10 (Critical Low Stock & Near Expiry)
      { id: "bat-105", medicineId: "med-4", batchNumber: "AL-1109", manufactureDate: "2023-11-01", expiryDate: todayStr(18), purchasePrice: 2.20, sellingPrice: 3.50, mrp: 3.50, quantityReceived: 150, quantityAvailable: 12, supplierId: "sup-1" },

      // med-5 Comet 500
      { id: "bat-106", medicineId: "med-5", batchNumber: "CM-5510", manufactureDate: "2024-02-14", expiryDate: todayStr(400), purchasePrice: 3.00, sellingPrice: 4.50, mrp: 5.00, quantityReceived: 400, quantityAvailable: 310, supplierId: "sup-1" },

      // med-6 Atova 10 (Critical Low Stock)
      { id: "bat-107", medicineId: "med-6", batchNumber: "AT-7741", manufactureDate: "2024-03-01", expiryDate: todayStr(360), purchasePrice: 8.50, sellingPrice: 12.00, mrp: 13.00, quantityReceived: 100, quantityAvailable: 8, supplierId: "sup-2" },

      // med-7 D-Rise 20000
      { id: "bat-108", medicineId: "med-7", batchNumber: "DR-4002", manufactureDate: "2024-05-10", expiryDate: todayStr(420), purchasePrice: 32.00, sellingPrice: 45.00, mrp: 50.00, quantityReceived: 150, quantityAvailable: 110, supplierId: "sup-3" },

      // med-8 Zimax 500 (Near Expiry)
      { id: "bat-109", medicineId: "med-8", batchNumber: "ZX-8820", manufactureDate: "2023-12-10", expiryDate: todayStr(35), purchasePrice: 28.00, sellingPrice: 35.00, mrp: 40.00, quantityReceived: 100, quantityAvailable: 28, supplierId: "sup-2" },

      // med-9 Flamyd 400
      { id: "bat-110", medicineId: "med-9", batchNumber: "FL-3301", manufactureDate: "2024-01-05", expiryDate: todayStr(290), purchasePrice: 1.80, sellingPrice: 2.50, mrp: 2.50, quantityReceived: 300, quantityAvailable: 185, supplierId: "sup-4" },

      // med-10 Ventolin Evohaler (Critical stock)
      { id: "bat-111", medicineId: "med-10", batchNumber: "VT-9021", manufactureDate: "2024-02-18", expiryDate: todayStr(320), purchasePrice: 195.00, sellingPrice: 250.00, mrp: 260.00, quantityReceived: 30, quantityAvailable: 4, supplierId: "sup-2" },

      // med-11 Entacyd Plus
      { id: "bat-112", medicineId: "med-11", batchNumber: "EP-6019", manufactureDate: "2024-03-25", expiryDate: todayStr(260), purchasePrice: 65.00, sellingPrice: 85.00, mrp: 90.00, quantityReceived: 80, quantityAvailable: 42, supplierId: "sup-1" },

      // med-12 Mixtard 30 HM
      { id: "bat-113", medicineId: "med-12", batchNumber: "MXT-409", manufactureDate: "2024-04-05", expiryDate: todayStr(210), purchasePrice: 380.00, sellingPrice: 460.00, mrp: 480.00, quantityReceived: 40, quantityAvailable: 22, supplierId: "sup-2" },

      // med-13 Rivotril 0.5 (Expired Batch for testing Expiry Alert!)
      { id: "bat-114", medicineId: "med-13", batchNumber: "RV-1022", manufactureDate: "2023-01-10", expiryDate: todayStr(-12), purchasePrice: 5.00, sellingPrice: 7.00, mrp: 7.00, quantityReceived: 100, quantityAvailable: 15, supplierId: "sup-4" },
      { id: "bat-115", medicineId: "med-13", batchNumber: "RV-2024", manufactureDate: "2024-05-01", expiryDate: todayStr(380), purchasePrice: 5.00, sellingPrice: 7.00, mrp: 7.00, quantityReceived: 200, quantityAvailable: 190, supplierId: "sup-4" },

      // med-14 Tofen Syrup (Dead stock simulation: no sales for 120 days)
      { id: "bat-116", medicineId: "med-14", batchNumber: "TF-8811", manufactureDate: "2023-10-01", expiryDate: todayStr(150), purchasePrice: 48.00, sellingPrice: 65.00, mrp: 70.00, quantityReceived: 50, quantityAvailable: 48, supplierId: "sup-2" }
    ];

    // 8. Customers
    const customers = [
      { id: "cust-1", name: "Anisur Rahman", phone: "+880 1712-345678", email: "anis@gmail.com", address: "Dhanmondi, Dhaka", dateOfBirth: "1982-05-14", creditLimit: 10000, outstandingBalance: 2450, loyaltyPoints: 340, createdAt: todayStr(-180) },
      { id: "cust-2", name: "Farhana Yasmin", phone: "+880 1819-456789", email: "farhana@yahoo.com", address: "Uttara Sector 7, Dhaka", dateOfBirth: "1991-09-22", creditLimit: 15000, outstandingBalance: 0, loyaltyPoints: 620, createdAt: todayStr(-120) },
      { id: "cust-3", name: "Md. Rafiqul Islam", phone: "+880 1911-567890", email: "rafiq.islam@hotmail.com", address: "Mirpur 10, Dhaka", dateOfBirth: "1975-11-03", creditLimit: 8000, outstandingBalance: 4120, loyaltyPoints: 190, createdAt: todayStr(-90) },
      { id: "cust-4", name: "Dr. Shahida Parveen", phone: "+880 1617-678901", email: "shahida@med.org", address: "Gulshan 2, Dhaka", dateOfBirth: "1986-03-30", creditLimit: 25000, outstandingBalance: 0, loyaltyPoints: 1150, createdAt: todayStr(-250) }
    ];

    // 9. Doctors
    const doctors = [
      { id: "doc-1", name: "Prof. Dr. M. A. Hasan", specialization: "Internal Medicine & Cardiology", licenseNumber: "BMDC-A28910", phone: "+880 1711-998877", chamber: "Square Hospital, Dhaka" },
      { id: "doc-2", name: "Dr. Nazneen Akhter", specialization: "Endocrinology & Diabetology", licenseNumber: "BMDC-A34120", phone: "+880 1812-887766", chamber: "BIRDEM General Hospital" },
      { id: "doc-3", name: "Dr. Tariqul Islam", specialization: "Pulmonology & Chest Diseases", licenseNumber: "BMDC-A41509", phone: "+880 1913-776655", chamber: "National Institute of Diseases of Chest" },
      { id: "doc-4", name: "Dr. Rezwana Chowdhury", specialization: "General Physician", licenseNumber: "BMDC-A52881", phone: "+880 1614-665544", chamber: "APS Health Clinic" }
    ];

    // 10. Prescriptions
    const prescriptions = [
      {
        id: "rx-1001",
        customerId: "cust-1",
        customerName: "Anisur Rahman",
        doctorId: "doc-2",
        doctorName: "Dr. Nazneen Akhter",
        prescriptionDate: todayStr(-3),
        notes: "Type-2 Diabetes mellitus review. Routine blood sugar monitoring required.",
        status: "Dispensed",
        items: [
          { medicineId: "med-5", medicineName: "Comet 500mg Tablet", dosage: "1-0-1 after meals", durationDays: 30, quantityPrescribed: 60 },
          { medicineId: "med-3", medicineName: "Seclo 20mg Capsule", dosage: "1-0-0 before breakfast", durationDays: 30, quantityPrescribed: 30 }
        ]
      },
      {
        id: "rx-1002",
        customerId: "cust-3",
        customerName: "Md. Rafiqul Islam",
        doctorId: "doc-3",
        doctorName: "Dr. Tariqul Islam",
        prescriptionDate: todayStr(-1),
        notes: "Acute bronchial asthma exacerbation. Inhaler technique demonstrated.",
        status: "Pending",
        items: [
          { medicineId: "med-10", medicineName: "Ventolin Evohaler 100mcg", dosage: "2 puffs SOS / prn", durationDays: 14, quantityPrescribed: 1 },
          { medicineId: "med-4", medicineName: "Alatrol 10mg Tablet", dosage: "0-0-1 at bedtime", durationDays: 10, quantityPrescribed: 10 }
        ]
      }
    ];

    // 11. Initial Purchase Orders & Purchases
    const purchaseOrders = [
      {
        id: "po-101",
        poNumber: "PO-2026-001",
        supplierId: "sup-1",
        supplierName: "Square Distribution Logistics",
        orderDate: todayStr(-15),
        expectedDate: todayStr(-10),
        status: "Received",
        totalAmount: 18400,
        createdBy: "Kamal Hossain",
        items: [
          { medicineId: "med-1", medicineName: "Napa Extra 500mg/65mg", orderedQty: 500, unitPrice: 2.10, subtotal: 1050 },
          { medicineId: "med-3", medicineName: "Seclo 20mg Capsule", orderedQty: 400, unitPrice: 4.80, subtotal: 1920 }
        ]
      },
      {
        id: "po-102",
        poNumber: "PO-2026-002",
        supplierId: "sup-2",
        supplierName: "Beximco Prime Distributors",
        orderDate: todayStr(-2),
        expectedDate: todayStr(3),
        status: "Ordered",
        totalAmount: 24500,
        createdBy: "Kamal Hossain",
        items: [
          { medicineId: "med-6", medicineName: "Atova 10mg Tablet", orderedQty: 200, unitPrice: 8.50, subtotal: 1700 },
          { medicineId: "med-10", medicineName: "Ventolin Evohaler 100mcg", orderedQty: 50, unitPrice: 195.00, subtotal: 9750 }
        ]
      }
    ];

    const purchases = [
      {
        id: "pur-101",
        poId: "po-101",
        invoiceNumber: "SQ-INV-99812",
        supplierId: "sup-1",
        supplierName: "Square Distribution Logistics",
        purchaseDate: todayStr(-10),
        totalAmount: 18400,
        paymentStatus: "Partial",
        createdBy: "Kamal Hossain"
      }
    ];

    // 12. Seed Sales & Invoices
    const sales = [
      {
        id: "sale-5001",
        invoiceNumber: "INV-2026-001",
        customerId: "cust-1",
        customerName: "Anisur Rahman",
        prescriptionId: "rx-1001",
        saleDate: todayStr(-3) + " 11:32:00",
        subtotal: 465.00,
        discount: 25.00,
        taxAmount: 22.00,
        totalAmount: 462.00,
        paymentMode: "Cash",
        paymentStatus: "Paid",
        servedBy: "Rahim Uddin",
        items: [
          { medicineId: "med-5", medicineName: "Comet 500mg Tablet", batchId: "bat-106", batchNumber: "CM-5510", quantity: 60, unitPrice: 4.50, subtotal: 270.00 },
          { medicineId: "med-3", medicineName: "Seclo 20mg Capsule", batchId: "bat-104", batchNumber: "SC-9821", quantity: 30, unitPrice: 6.50, subtotal: 195.00 }
        ]
      },
      {
        id: "sale-5002",
        invoiceNumber: "INV-2026-002",
        customerId: "cust-2",
        customerName: "Farhana Yasmin",
        prescriptionId: null,
        saleDate: todayStr(-1) + " 15:14:00",
        subtotal: 540.00,
        discount: 40.00,
        taxAmount: 25.00,
        totalAmount: 525.00,
        paymentMode: "Card",
        paymentStatus: "Paid",
        servedBy: "Rahim Uddin",
        items: [
          { medicineId: "med-7", medicineName: "D-Rise 20000 IU Capsule", batchId: "bat-108", batchNumber: "DR-4002", quantity: 12, unitPrice: 45.00, subtotal: 540.00 }
        ]
      },
      {
        id: "sale-5003",
        invoiceNumber: "INV-2026-003",
        customerId: "cust-3",
        customerName: "Md. Rafiqul Islam",
        prescriptionId: null,
        saleDate: todayStr(0) + " 09:45:00",
        subtotal: 180.00,
        discount: 0.00,
        taxAmount: 9.00,
        totalAmount: 189.00,
        paymentMode: "Credit",
        paymentStatus: "Unpaid",
        servedBy: "Rahim Uddin",
        items: [
          { medicineId: "med-1", medicineName: "Napa Extra 500mg/65mg", batchId: "bat-101", batchNumber: "NE-2024A", quantity: 60, unitPrice: 3.00, subtotal: 180.00 }
        ]
      }
    ];

    const invoices = sales.map(s => ({
      id: "inv-" + s.id,
      saleId: s.id,
      invoiceNumber: s.invoiceNumber,
      invoiceDate: s.saleDate,
      customerId: s.customerId,
      customerName: s.customerName,
      subtotal: s.subtotal,
      discount: s.discount,
      gstAmount: s.taxAmount,
      totalAmount: s.totalAmount,
      paymentMode: s.paymentMode,
      paymentStatus: s.paymentStatus,
      servedBy: s.servedBy,
      items: s.items
    }));

    // 13. Inventory Movement Ledger
    const movements = [
      { id: "mov-1", medicineId: "med-1", medicineName: "Napa Extra 500mg/65mg", batchId: "bat-101", batchNumber: "NE-2024A", movementType: "PURCHASE", quantity: 300, referenceType: "PO", referenceId: "PO-2026-001", balanceAfter: 300, createdBy: "Kamal Hossain", createdAt: todayStr(-15) + " 10:00:00", notes: "Initial stock receipt" },
      { id: "mov-2", medicineId: "med-1", medicineName: "Napa Extra 500mg/65mg", batchId: "bat-101", batchNumber: "NE-2024A", movementType: "SALE", quantity: -60, referenceType: "INV", referenceId: "INV-2026-003", balanceAfter: 240, createdBy: "Rahim Uddin", createdAt: todayStr(0) + " 09:45:00", notes: "POS Sale" },
      { id: "mov-3", medicineId: "med-5", medicineName: "Comet 500mg Tablet", batchId: "bat-106", batchNumber: "CM-5510", movementType: "SALE", quantity: -60, referenceType: "INV", referenceId: "INV-2026-001", balanceAfter: 340, createdBy: "Rahim Uddin", createdAt: todayStr(-3) + " 11:32:00", notes: "POS Sale" },
      { id: "mov-4", medicineId: "med-3", medicineName: "Seclo 20mg Capsule", batchId: "bat-104", batchNumber: "SC-9821", movementType: "SALE", quantity: -30, referenceType: "INV", referenceId: "INV-2026-001", balanceAfter: 260, createdBy: "Rahim Uddin", createdAt: todayStr(-3) + " 11:32:00", notes: "POS Sale" }
    ];

    // 14. Audit Logs
    const auditLogs = [
      { id: "aud-1", userName: "System", action: "SYSTEM_INIT", tableName: "all", recordId: "0", details: "APS Medical Management Database initialized with enterprise seed data", timestamp: todayStr(-15) + " 08:00:00" },
      { id: "aud-2", userName: "Kamal Hossain", action: "PURCHASE_RECEIPT", tableName: "batches", recordId: "bat-101", details: "Goods received for PO-2026-001 from Square Distribution", timestamp: todayStr(-15) + " 10:15:00" },
      { id: "aud-3", userName: "Rahim Uddin", action: "POS_SALE", tableName: "sales", recordId: "sale-5001", details: "Processed sale INV-2026-001 for Anisur Rahman (৳462.00)", timestamp: todayStr(-3) + " 11:32:00" },
      { id: "aud-4", userName: "Rahim Uddin", action: "POS_SALE", tableName: "sales", recordId: "sale-5002", details: "Processed sale INV-2026-002 for Farhana Yasmin (৳525.00)", timestamp: todayStr(-1) + " 15:14:00" },
      { id: "aud-5", userName: "Rahim Uddin", action: "POS_SALE", tableName: "sales", recordId: "sale-5003", details: "Processed credit sale INV-2026-003 for Md. Rafiqul Islam (৳189.00)", timestamp: todayStr(0) + " 09:45:00" }
    ];

    // Persist all
    save(KEYS.ROLES, roles);
    save(KEYS.USERS, users);
    save(KEYS.CATEGORIES, categories);
    save(KEYS.MANUFACTURERS, manufacturers);
    save(KEYS.SUPPLIERS, suppliers);
    save(KEYS.MEDICINES, medicines);
    save(KEYS.BATCHES, batches);
    save(KEYS.CUSTOMERS, customers);
    save(KEYS.DOCTORS, doctors);
    save(KEYS.PRESCRIPTIONS, prescriptions);
    save(KEYS.PURCHASE_ORDERS, purchaseOrders);
    save(KEYS.PURCHASES, purchases);
    save(KEYS.SALES, sales);
    save(KEYS.INVOICES, invoices);
    save(KEYS.MOVEMENTS, movements);
    save(KEYS.AUDIT_LOGS, auditLogs);
    save(KEYS.RETURNS, []);
    save(KEYS.PAYMENTS, []);

    localStorage.setItem(KEYS.INITIALIZED, "true");
    console.log("APSStore: Enterprise database initialized successfully.");
  }

  // Ensure initialization runs
  initDatabase(false);

  /* =========================================================
     AUDIT LOG HELPER
  ========================================================== */

  function logAudit(action, tableName, recordId, details) {
    const logs = load(KEYS.AUDIT_LOGS, []);
    const currentUser = sessionStorage.getItem("apsUserName") || "Current User";
    const newLog = {
      id: uid("aud"),
      userName: currentUser,
      action: action.toUpperCase(),
      tableName: tableName,
      recordId: String(recordId),
      details: details,
      timestamp: new Date().toLocaleString()
    };
    logs.unshift(newLog);
    if (logs.length > 500) logs.pop(); // keep recent 500 logs
    save(KEYS.AUDIT_LOGS, logs);
    return newLog;
  }

  /* =========================================================
     MEDICINE & BATCH GETTERS & SETTERS (WITH FEFO)
  ========================================================== */

  function getMedicines() {
    const meds = load(KEYS.MEDICINES, []);
    const batches = load(KEYS.BATCHES, []);
    const cats = load(KEYS.CATEGORIES, []);
    const mfrs = load(KEYS.MANUFACTURERS, []);

    const catMap = Object.fromEntries(cats.map(c => [c.id, c.name]));
    const mfrMap = Object.fromEntries(mfrs.map(m => [m.id, m.name]));

    return meds.map(med => {
      // Calculate real stock from available batches
      const medBatches = batches.filter(b => b.medicineId === med.id);
      const totalStock = medBatches.reduce((acc, b) => acc + Number(b.quantityAvailable || 0), 0);
      
      // Determine nearest price from active batches
      const activeBatch = medBatches.find(b => b.quantityAvailable > 0) || medBatches[0];
      const sellingPrice = activeBatch ? activeBatch.sellingPrice : 0;
      const mrp = activeBatch ? activeBatch.mrp : 0;

      return {
        ...med,
        categoryName: catMap[med.categoryId] || "Unassigned",
        manufacturerName: mfrMap[med.manufacturerId] || "Unassigned",
        totalStock,
        sellingPrice,
        mrp,
        batchCount: medBatches.length
      };
    });
  }

  function getMedicineById(id) {
    return getMedicines().find(m => m.id === id) || null;
  }

  function saveMedicine(medicineData) {
    const meds = load(KEYS.MEDICINES, []);
    const isNew = !medicineData.id;
    let savedRecord = null;

    if (isNew) {
      medicineData.id = uid("med");
      medicineData.isActive = medicineData.isActive !== false;
      medicineData.reorderLevel = Number(medicineData.reorderLevel || 50);
      medicineData.reorderQuantity = Number(medicineData.reorderQuantity || 100);
      meds.push(medicineData);
      savedRecord = medicineData;
      logAudit("INSERT", "medicines", medicineData.id, `Created medicine ${medicineData.name}`);
    } else {
      const idx = meds.findIndex(m => m.id === medicineData.id);
      if (idx !== -1) {
        meds[idx] = { ...meds[idx], ...medicineData };
        savedRecord = meds[idx];
        logAudit("UPDATE", "medicines", medicineData.id, `Updated medicine ${medicineData.name}`);
      }
    }
    save(KEYS.MEDICINES, meds);
    return savedRecord;
  }

  function deleteMedicine(id) {
    const meds = load(KEYS.MEDICINES, []);
    const med = meds.find(m => m.id === id);
    if (!med) return false;
    const remaining = meds.filter(m => m.id !== id);
    save(KEYS.MEDICINES, remaining);
    logAudit("DELETE", "medicines", id, `Deleted medicine ${med.name}`);
    return true;
  }

  /* =========================================================
     BATCHES & FEFO ENGINE
  ========================================================== */

  function getBatches(medicineId = null) {
    let batches = load(KEYS.BATCHES, []);
    const meds = load(KEYS.MEDICINES, []);
    const sups = load(KEYS.SUPPLIERS, []);
    const medMap = Object.fromEntries(meds.map(m => [m.id, m]));
    const supMap = Object.fromEntries(sups.map(s => [s.id, s.name]));

    if (medicineId) {
      batches = batches.filter(b => b.medicineId === medicineId);
    }

    return batches.map(b => {
      const med = medMap[b.medicineId] || {};
      const expDate = new Date(b.expiryDate);
      const today = new Date();
      const diffTime = expDate - today;
      const daysToExpiry = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

      let expiryStatus = "valid";
      if (daysToExpiry < 0) expiryStatus = "expired";
      else if (daysToExpiry <= 30) expiryStatus = "urgent";
      else if (daysToExpiry <= 60) expiryStatus = "warning";

      return {
        ...b,
        medicineName: med.name || "Unknown Medicine",
        unit: med.unit || "Unit",
        supplierName: supMap[b.supplierId] || "Direct Purchase",
        daysToExpiry,
        expiryStatus
      };
    });
  }

  // FEFO: First Expired, First Out
  // Sort available batches for a medicine by expiryDate ascending
  function getFEFOBatches(medicineId) {
    return getBatches(medicineId)
      .filter(b => b.quantityAvailable > 0 && b.expiryStatus !== "expired")
      .sort((a, b) => new Date(a.expiryDate) - new Date(b.expiryDate));
  }

  function saveBatch(batchData) {
    const batches = load(KEYS.BATCHES, []);
    const isNew = !batchData.id;
    let saved = null;

    if (isNew) {
      batchData.id = uid("bat");
      batchData.quantityAvailable = Number(batchData.quantityAvailable ?? batchData.quantityReceived);
      batches.push(batchData);
      saved = batchData;

      // Add movement ledger entry
      addMovement({
        medicineId: batchData.medicineId,
        batchId: batchData.id,
        batchNumber: batchData.batchNumber,
        movementType: "IN",
        quantity: Number(batchData.quantityReceived),
        referenceType: "BATCH_ADD",
        referenceId: batchData.batchNumber,
        notes: "New batch registered"
      });

      logAudit("INSERT", "batches", batchData.id, `Added batch ${batchData.batchNumber} with qty ${batchData.quantityReceived}`);
    } else {
      const idx = batches.findIndex(b => b.id === batchData.id);
      if (idx !== -1) {
        batches[idx] = { ...batches[idx], ...batchData };
        saved = batches[idx];
        logAudit("UPDATE", "batches", batchData.id, `Updated batch ${batchData.batchNumber}`);
      }
    }
    save(KEYS.BATCHES, batches);
    return saved;
  }

  function adjustBatchStock(batchId, adjustQty, reason, notes = "") {
    const batches = load(KEYS.BATCHES, []);
    const idx = batches.findIndex(b => b.id === batchId);
    if (idx === -1) throw new Error("Batch not found.");

    const batch = batches[idx];
    const prevQty = Number(batch.quantityAvailable);
    const newQty = prevQty + Number(adjustQty);

    if (newQty < 0) throw new Error("Stock cannot be negative.");
    batch.quantityAvailable = newQty;
    save(KEYS.BATCHES, batches);

    addMovement({
      medicineId: batch.medicineId,
      batchId: batch.id,
      batchNumber: batch.batchNumber,
      movementType: "ADJUSTMENT",
      quantity: Number(adjustQty),
      referenceType: "REASON: " + reason,
      referenceId: batch.batchNumber,
      notes: notes || reason
    });

    logAudit("STOCK_ADJUST", "batches", batchId, `Adjusted stock by ${adjustQty} (Reason: ${reason})`);
    return batch;
  }

  /* =========================================================
     INVENTORY MOVEMENTS
  ========================================================== */

  function getMovements(medicineId = null) {
    const list = load(KEYS.MOVEMENTS, []);
    if (medicineId) return list.filter(m => m.medicineId === medicineId);
    return list;
  }

  function addMovement({ medicineId, batchId, batchNumber, movementType, quantity, referenceType, referenceId, notes }) {
    const movements = load(KEYS.MOVEMENTS, []);
    const meds = load(KEYS.MEDICINES, []);
    const med = meds.find(m => m.id === medicineId) || {};
    const batches = load(KEYS.BATCHES, []);
    const currentTotal = batches
      .filter(b => b.medicineId === medicineId)
      .reduce((acc, b) => acc + Number(b.quantityAvailable || 0), 0);

    const record = {
      id: uid("mov"),
      medicineId,
      medicineName: med.name || "Medicine",
      batchId: batchId || "N/A",
      batchNumber: batchNumber || "N/A",
      movementType: movementType.toUpperCase(),
      quantity: Number(quantity),
      referenceType: referenceType || "MANUAL",
      referenceId: referenceId || "N/A",
      balanceAfter: currentTotal,
      createdBy: sessionStorage.getItem("apsUserName") || "Staff",
      createdAt: new Date().toLocaleString(),
      notes: notes || ""
    };

    movements.unshift(record);
    if (movements.length > 800) movements.pop();
    save(KEYS.MOVEMENTS, movements);
    return record;
  }

  /* =========================================================
     POINT OF SALE (POS) & TRANSACTION PROCESSING
  ========================================================== */

  /**
   * Process POS Checkout
   * Automatically deducts stock using FEFO across batches,
   * creates sale record, GST invoice, movements, updates customer points/balance,
   * and creates audit log.
   */
  function processSale({ customerId, customerName, prescriptionId, items, subtotal, discount, taxRate = 0.05, paymentMode, paymentStatus = "Paid" }) {
    if (!items || !items.length) throw new Error("Sale cart cannot be empty.");

    const batches = load(KEYS.BATCHES, []);
    const meds = load(KEYS.MEDICINES, []);
    const customers = load(KEYS.CUSTOMERS, []);
    const currentUser = sessionStorage.getItem("apsUserName") || "Cashier";

    const saleId = uid("sale");
    const invNumber = "INV-" + new Date().getFullYear() + "-" + Math.floor(1000 + Math.random() * 9000);

    const allocatedItems = [];
    const taxAmount = Number(((subtotal - discount) * taxRate).toFixed(2));
    const totalAmount = Number(((subtotal - discount) + taxAmount).toFixed(2));

    // Iterate items and deduct inventory using FEFO
    items.forEach(cartItem => {
      let remainingToDeduct = Number(cartItem.quantity);
      const medBatches = batches
        .filter(b => b.medicineId === cartItem.medicineId && b.quantityAvailable > 0)
        .sort((a, b) => new Date(a.expiryDate) - new Date(b.expiryDate)); // FEFO

      const totalAvail = medBatches.reduce((sum, b) => sum + b.quantityAvailable, 0);
      if (totalAvail < remainingToDeduct) {
        throw new Error(`Insufficient stock for ${cartItem.medicineName}. Available: ${totalAvail}, Requested: ${remainingToDeduct}`);
      }

      for (const b of medBatches) {
        if (remainingToDeduct <= 0) break;
        const deductFromBatch = Math.min(b.quantityAvailable, remainingToDeduct);
        b.quantityAvailable -= deductFromBatch;
        remainingToDeduct -= deductFromBatch;

        allocatedItems.push({
          medicineId: cartItem.medicineId,
          medicineName: cartItem.medicineName,
          batchId: b.id,
          batchNumber: b.batchNumber,
          unit: cartItem.unit || "Unit",
          quantity: deductFromBatch,
          unitPrice: cartItem.unitPrice,
          mrp: cartItem.mrp || cartItem.unitPrice,
          subtotal: Number((deductFromBatch * cartItem.unitPrice).toFixed(2))
        });

        // Record stock movement
        addMovement({
          medicineId: cartItem.medicineId,
          batchId: b.id,
          batchNumber: b.batchNumber,
          movementType: "SALE",
          quantity: -deductFromBatch,
          referenceType: "INVOICE",
          referenceId: invNumber,
          notes: `POS Sale to ${customerName || "Walk-in"}`
        });
      }
    });

    save(KEYS.BATCHES, batches);

    // Save Sale Record
    const saleRecord = {
      id: saleId,
      invoiceNumber: invNumber,
      customerId: customerId || null,
      customerName: customerName || "Walk-in Customer",
      prescriptionId: prescriptionId || null,
      saleDate: new Date().toLocaleString(),
      subtotal: Number(subtotal),
      discount: Number(discount || 0),
      taxAmount: taxAmount,
      totalAmount: totalAmount,
      paymentMode: paymentMode || "Cash",
      paymentStatus: paymentStatus,
      servedBy: currentUser,
      items: allocatedItems
    };

    const sales = load(KEYS.SALES, []);
    sales.unshift(saleRecord);
    save(KEYS.SALES, sales);

    // Save GST Invoice
    const invoiceRecord = {
      id: "inv_" + saleId,
      saleId: saleId,
      invoiceNumber: invNumber,
      invoiceDate: saleRecord.saleDate,
      customerId: saleRecord.customerId,
      customerName: saleRecord.customerName,
      subtotal: saleRecord.subtotal,
      discount: saleRecord.discount,
      gstAmount: saleRecord.taxAmount,
      totalAmount: saleRecord.totalAmount,
      paymentMode: saleRecord.paymentMode,
      paymentStatus: saleRecord.paymentStatus,
      servedBy: currentUser,
      items: allocatedItems
    };

    const invoices = load(KEYS.INVOICES, []);
    invoices.unshift(invoiceRecord);
    save(KEYS.INVOICES, invoices);

    // Customer loyalty & credit adjustment
    if (customerId) {
      const custIdx = customers.findIndex(c => c.id === customerId);
      if (custIdx !== -1) {
        // Loyalty: 1 pt for every ৳50 spent
        const ptsEarned = Math.floor(totalAmount / 50);
        customers[custIdx].loyaltyPoints = (customers[custIdx].loyaltyPoints || 0) + ptsEarned;

        // If Credit sale, add to outstanding balance
        if (paymentMode === "Credit" || paymentStatus === "Unpaid") {
          customers[custIdx].outstandingBalance = Number((customers[custIdx].outstandingBalance + totalAmount).toFixed(2));
        }
        save(KEYS.CUSTOMERS, customers);
      }
    }

    // Mark prescription as Dispensed if connected
    if (prescriptionId) {
      const prescriptions = load(KEYS.PRESCRIPTIONS, []);
      const rx = prescriptions.find(r => r.id === prescriptionId);
      if (rx) {
        rx.status = "Dispensed";
        save(KEYS.PRESCRIPTIONS, prescriptions);
      }
    }

    logAudit("POS_CHECKOUT", "sales", saleId, `Generated ${invNumber} for ৳${totalAmount} (${paymentMode})`);

    return { sale: saleRecord, invoice: invoiceRecord };
  }

  /* =========================================================
     SALES RETURNS & RESTOCKING
  ========================================================== */

  function processReturn({ saleId, invoiceNumber, itemsToReturn, reason, restockInventory = true }) {
    const sales = load(KEYS.SALES, []);
    const batches = load(KEYS.BATCHES, []);
    const sale = sales.find(s => s.id === saleId || s.invoiceNumber === invoiceNumber);
    if (!sale) throw new Error("Original sale invoice not found.");

    let totalRefund = 0;
    const returnId = uid("ret");
    const processedBy = sessionStorage.getItem("apsUserName") || "Staff";

    itemsToReturn.forEach(item => {
      const returnQty = Number(item.quantity);
      const refundSubtotal = returnQty * Number(item.unitPrice);
      totalRefund += refundSubtotal;

      if (restockInventory && item.batchId) {
        const batch = batches.find(b => b.id === item.batchId);
        if (batch) {
          batch.quantityAvailable += returnQty;
          addMovement({
            medicineId: item.medicineId,
            batchId: batch.id,
            batchNumber: batch.batchNumber,
            movementType: "RETURN",
            quantity: returnQty,
            referenceType: "RETURN_INV",
            referenceId: sale.invoiceNumber,
            notes: `Return: ${reason}`
          });
        }
      }
    });

    if (restockInventory) {
      save(KEYS.BATCHES, batches);
    }

    const returnRecord = {
      id: returnId,
      saleId: sale.id,
      invoiceNumber: sale.invoiceNumber,
      customerName: sale.customerName,
      returnDate: new Date().toLocaleString(),
      reason: reason,
      items: itemsToReturn,
      totalRefundAmount: Number(totalRefund.toFixed(2)),
      restocked: restockInventory,
      processedBy: processedBy
    };

    const returns = load(KEYS.RETURNS, []);
    returns.unshift(returnRecord);
    save(KEYS.RETURNS, returns);

    logAudit("SALES_RETURN", "returns", returnId, `Processed return for ${sale.invoiceNumber}, refund ৳${totalRefund}`);
    return returnRecord;
  }

  /* =========================================================
     PURCHASE ORDERS & GOODS RECEIPT
  ========================================================== */

  function getPurchaseOrders() {
    return load(KEYS.PURCHASE_ORDERS, []);
  }

  function createPurchaseOrder({ supplierId, items, expectedDate }) {
    const sups = load(KEYS.SUPPLIERS, []);
    const sup = sups.find(s => s.id === supplierId);
    if (!sup) throw new Error("Supplier not found.");

    const poNumber = "PO-" + new Date().getFullYear() + "-" + Math.floor(100 + Math.random() * 900);
    const totalAmount = items.reduce((sum, item) => sum + (Number(item.orderedQty) * Number(item.unitPrice)), 0);

    const newPO = {
      id: uid("po"),
      poNumber,
      supplierId,
      supplierName: sup.name,
      orderDate: todayStr(0),
      expectedDate: expectedDate || todayStr(7),
      status: "Ordered",
      totalAmount: Number(totalAmount.toFixed(2)),
      createdBy: sessionStorage.getItem("apsUserName") || "Inventory Manager",
      items
    };

    const list = load(KEYS.PURCHASE_ORDERS, []);
    list.unshift(newPO);
    save(KEYS.PURCHASE_ORDERS, list);

    logAudit("PURCHASE_ORDER", "purchase_orders", newPO.id, `Created ${poNumber} for supplier ${sup.name}`);
    return newPO;
  }

  function receiveGoods({ poId, invoiceNumber, receivedBatches }) {
    const poList = load(KEYS.PURCHASE_ORDERS, []);
    const po = poList.find(p => p.id === poId);
    if (!po) throw new Error("Purchase Order not found.");

    // Create batches and movements
    receivedBatches.forEach(b => {
      saveBatch({
        medicineId: b.medicineId,
        batchNumber: b.batchNumber,
        manufactureDate: b.manufactureDate || todayStr(-30),
        expiryDate: b.expiryDate,
        purchasePrice: Number(b.purchasePrice),
        sellingPrice: Number(b.sellingPrice),
        mrp: Number(b.mrp || b.sellingPrice),
        quantityReceived: Number(b.quantityReceived),
        quantityAvailable: Number(b.quantityReceived),
        supplierId: po.supplierId
      });
    });

    // Update PO status
    po.status = "Received";
    save(KEYS.PURCHASE_ORDERS, poList);

    // Update Supplier outstanding balance
    const sups = load(KEYS.SUPPLIERS, []);
    const sup = sups.find(s => s.id === po.supplierId);
    if (sup) {
      sup.outstandingBalance = Number((sup.outstandingBalance + po.totalAmount).toFixed(2));
      save(KEYS.SUPPLIERS, sups);
    }

    logAudit("GOODS_RECEIPT", "purchase_orders", po.id, `Received items for ${po.poNumber}, supplier balance updated`);
    return po;
  }

  /* =========================================================
     SUPPLIERS & PAYMENTS
  ========================================================== */

  function getSuppliers() {
    return load(KEYS.SUPPLIERS, []);
  }

  function saveSupplier(data) {
    const list = load(KEYS.SUPPLIERS, []);
    if (!data.id) {
      data.id = uid("sup");
      data.outstandingBalance = Number(data.outstandingBalance || 0);
      list.push(data);
      logAudit("INSERT", "suppliers", data.id, `Created supplier ${data.name}`);
    } else {
      const idx = list.findIndex(s => s.id === data.id);
      if (idx !== -1) {
        list[idx] = { ...list[idx], ...data };
        logAudit("UPDATE", "suppliers", data.id, `Updated supplier ${data.name}`);
      }
    }
    save(KEYS.SUPPLIERS, list);
    return data;
  }

  function recordSupplierPayment({ supplierId, amount, paymentMode, referenceNumber, notes }) {
    const sups = load(KEYS.SUPPLIERS, []);
    const sup = sups.find(s => s.id === supplierId);
    if (!sup) throw new Error("Supplier not found.");

    const payAmount = Number(amount);
    sup.outstandingBalance = Math.max(0, Number((sup.outstandingBalance - payAmount).toFixed(2)));
    save(KEYS.SUPPLIERS, sups);

    const payments = load(KEYS.PAYMENTS, []);
    payments.unshift({
      id: uid("pay"),
      supplierId,
      supplierName: sup.name,
      amount: payAmount,
      paymentMode,
      referenceNumber: referenceNumber || "N/A",
      paymentDate: new Date().toLocaleString(),
      notes: notes || "",
      processedBy: sessionStorage.getItem("apsUserName") || "Staff"
    });
    save(KEYS.PAYMENTS, payments);

    logAudit("SUPPLIER_PAYMENT", "suppliers", supplierId, `Paid ৳${payAmount} to ${sup.name} via ${paymentMode}`);
    return sup;
  }

  /* =========================================================
     CUSTOMERS & CREDIT SETTLEMENT
  ========================================================== */

  function getCustomers() {
    return load(KEYS.CUSTOMERS, []);
  }

  function saveCustomer(data) {
    const list = load(KEYS.CUSTOMERS, []);
    if (!data.id) {
      data.id = uid("cust");
      data.creditLimit = Number(data.creditLimit || 5000);
      data.outstandingBalance = Number(data.outstandingBalance || 0);
      data.loyaltyPoints = Number(data.loyaltyPoints || 0);
      data.createdAt = todayStr(0);
      list.push(data);
      logAudit("INSERT", "customers", data.id, `Created customer ${data.name}`);
    } else {
      const idx = list.findIndex(c => c.id === data.id);
      if (idx !== -1) {
        list[idx] = { ...list[idx], ...data };
        logAudit("UPDATE", "customers", data.id, `Updated customer ${data.name}`);
      }
    }
    save(KEYS.CUSTOMERS, list);
    return data;
  }

  function settleCustomerCredit({ customerId, amount, paymentMode, referenceNumber }) {
    const custs = load(KEYS.CUSTOMERS, []);
    const cust = custs.find(c => c.id === customerId);
    if (!cust) throw new Error("Customer not found.");

    const payAmount = Number(amount);
    cust.outstandingBalance = Math.max(0, Number((cust.outstandingBalance - payAmount).toFixed(2)));
    save(KEYS.CUSTOMERS, custs);

    logAudit("CREDIT_SETTLEMENT", "customers", customerId, `Collected ৳${payAmount} credit from ${cust.name}`);
    return cust;
  }

  /* =========================================================
     PRESCRIPTIONS & DOCTORS
  ========================================================== */

  function getDoctors() {
    return load(KEYS.DOCTORS, []);
  }

  function saveDoctor(data) {
    const list = load(KEYS.DOCTORS, []);
    if (!data.id) {
      data.id = uid("doc");
      list.push(data);
      logAudit("INSERT", "doctors", data.id, `Registered doctor ${data.name}`);
    } else {
      const idx = list.findIndex(d => d.id === data.id);
      if (idx !== -1) list[idx] = { ...list[idx], ...data };
    }
    save(KEYS.DOCTORS, list);
    return data;
  }

  function getPrescriptions() {
    return load(KEYS.PRESCRIPTIONS, []);
  }

  function savePrescription(data) {
    const list = load(KEYS.PRESCRIPTIONS, []);
    if (!data.id) {
      data.id = "rx-" + Math.floor(1000 + Math.random() * 9000);
      data.prescriptionDate = todayStr(0);
      data.status = data.status || "Pending";
      list.unshift(data);
      logAudit("INSERT", "prescriptions", data.id, `Created prescription for ${data.customerName}`);
    } else {
      const idx = list.findIndex(r => r.id === data.id);
      if (idx !== -1) list[idx] = { ...list[idx], ...data };
    }
    save(KEYS.PRESCRIPTIONS, list);
    return data;
  }

  /* =========================================================
     CATEGORIES & MANUFACTURERS
  ========================================================== */

  function getCategories() {
    return load(KEYS.CATEGORIES, []);
  }

  function saveCategory(data) {
    const list = load(KEYS.CATEGORIES, []);
    if (!data.id) {
      data.id = uid("cat");
      list.push(data);
    } else {
      const idx = list.findIndex(c => c.id === data.id);
      if (idx !== -1) list[idx] = { ...list[idx], ...data };
    }
    save(KEYS.CATEGORIES, list);
    return data;
  }

  function getManufacturers() {
    return load(KEYS.MANUFACTURERS, []);
  }

  /* =========================================================
     INVOICES & RETURNS GETTERS
  ========================================================== */

  function getInvoices() {
    return load(KEYS.INVOICES, []);
  }

  function getReturns() {
    return load(KEYS.RETURNS, []);
  }

  /* =========================================================
     SMART ALERTS & RECOMMENDATIONS ENGINE
  ========================================================== */

  function getAlerts() {
    const meds = getMedicines();
    const batches = getBatches();
    const sales = load(KEYS.SALES, []);

    // 1. Low Stock Alerts
    const lowStock = meds.filter(m => m.totalStock <= m.reorderLevel).map(m => ({
      medicineId: m.id,
      medicineName: m.name,
      currentStock: m.totalStock,
      reorderLevel: m.reorderLevel,
      recommendedOrderQty: m.reorderQuantity,
      unit: m.unit,
      severity: m.totalStock === 0 ? "danger" : "warning"
    }));

    // 2. Expiry Alerts
    const expiringBatches = batches.filter(b => b.quantityAvailable > 0 && b.daysToExpiry <= 60).map(b => ({
      batchId: b.id,
      batchNumber: b.batchNumber,
      medicineId: b.medicineId,
      medicineName: b.medicineName,
      expiryDate: b.expiryDate,
      daysToExpiry: b.daysToExpiry,
      quantityAvailable: b.quantityAvailable,
      unit: b.unit,
      severity: b.daysToExpiry <= 0 ? "danger" : b.daysToExpiry <= 30 ? "urgent" : "warning"
    }));

    // 3. Dead Stock (Items with stock but 0 sales in last 60+ days)
    const deadStock = batches.filter(b => {
      if (b.quantityAvailable <= 0) return false;
      // Check if this batch has any sale in sales history
      const hasRecentSale = sales.some(s => s.items.some(i => i.batchId === b.id));
      return !hasRecentSale && new Date(b.manufactureDate) < new Date(Date.now() - 60 * 24 * 60 * 60 * 1000);
    }).map(b => ({
      batchId: b.id,
      batchNumber: b.batchNumber,
      medicineName: b.medicineName,
      quantityStuck: b.quantityAvailable,
      capitalTiedUp: Number((b.quantityAvailable * b.purchasePrice).toFixed(2)),
      daysSinceMfg: Math.floor((Date.now() - new Date(b.manufactureDate).getTime()) / (1000 * 60 * 60 * 24))
    }));

    // 4. Auto-Reorder Recommendations
    const reorders = lowStock.map(ls => ({
      medicineId: ls.medicineId,
      medicineName: ls.medicineName,
      currentStock: ls.currentStock,
      reorderLevel: ls.reorderLevel,
      recommendedQty: ls.recommendedOrderQty,
      avgDailySales: 5 // based on velocity estimate
    }));

    return {
      lowStock,
      expiringBatches,
      deadStock,
      reorders,
      totalCount: lowStock.length + expiringBatches.length + deadStock.length
    };
  }

  /* =========================================================
     BUSINESS INTELLIGENCE & ANALYTICS
  ========================================================== */

  function getAnalytics() {
    const sales = load(KEYS.SALES, []);
    const meds = getMedicines();
    const batches = load(KEYS.BATCHES, []);
    const batchMap = Object.fromEntries(batches.map(b => [b.id, b]));

    // Total gross sales & gross profit
    let totalRevenue = 0;
    let totalCost = 0;
    const medSalesCount = {};
    const categoryRevenue = {};

    sales.forEach(sale => {
      totalRevenue += Number(sale.totalAmount || 0);
      sale.items.forEach(item => {
        const batch = batchMap[item.batchId];
        const costPrice = batch ? batch.purchasePrice : (item.unitPrice * 0.7);
        totalCost += (costPrice * item.quantity);

        medSalesCount[item.medicineName] = (medSalesCount[item.medicineName] || 0) + item.quantity;
      });
    });

    const grossProfit = Math.max(0, totalRevenue - totalCost);
    const profitMargin = totalRevenue > 0 ? ((grossProfit / totalRevenue) * 100).toFixed(1) : "0";

    // Fast & slow moving items
    const velocityList = Object.entries(medSalesCount)
      .map(([name, qty]) => ({ name, qty }))
      .sort((a, b) => b.qty - a.qty);

    const fastMoving = velocityList.slice(0, 5);
    const slowMoving = meds.filter(m => !medSalesCount[m.name]).slice(0, 5);

    return {
      totalRevenue: Number(totalRevenue.toFixed(2)),
      grossProfit: Number(grossProfit.toFixed(2)),
      profitMargin: profitMargin + "%",
      totalSalesCount: sales.length,
      fastMoving,
      slowMoving,
      inventoryValuation: batches.reduce((sum, b) => sum + (b.quantityAvailable * b.purchasePrice), 0).toFixed(2)
    };
  }

  /* =========================================================
     AUDIT LOGS & USERS
  ========================================================== */

  function getAuditLogs() {
    return load(KEYS.AUDIT_LOGS, []);
  }

  function getUsers() {
    return load(KEYS.USERS, []);
  }

  function getRoles() {
    return load(KEYS.ROLES, []);
  }

  function saveUser(userData) {
    const list = load(KEYS.USERS, []);
    let saved = null;
    if (!userData.id) {
      userData.id = uid("usr");
      userData.designation = userData.designation || userData.roleTitle || "Staff Specialist";
      userData.isActive = userData.isActive !== false;
      list.push(userData);
      saved = userData;
      logAudit("INSERT", "users", userData.id, `Created staff member ${userData.name} (${userData.designation})`);
    } else {
      let idx = list.findIndex(u => u.id === userData.id);
      if (idx === -1 && userData.username) {
        idx = list.findIndex(u => u.username === userData.username);
      }
      if (idx !== -1) {
        list[idx] = { ...list[idx], ...userData };
        saved = list[idx];
        logAudit("UPDATE", "users", saved.id, `Updated staff member ${userData.name} (${userData.designation})`);
      } else {
        userData.designation = userData.designation || userData.roleTitle || "Staff Specialist";
        userData.isActive = userData.isActive !== false;
        list.push(userData);
        saved = userData;
        logAudit("INSERT", "users", userData.id, `Saved staff member ${userData.name} (${userData.designation})`);
      }
    }
    save(KEYS.USERS, list);
    return saved;
  }

  function deleteUser(id) {
    const list = load(KEYS.USERS, []);
    const user = list.find(u => u.id === id);
    if (!user) return false;
    if (user.role === "admin" && list.filter(u => u.role === "admin").length <= 1) {
      throw new Error("Cannot delete the only remaining Administrator account.");
    }
    const remaining = list.filter(u => u.id !== id);
    save(KEYS.USERS, remaining);
    logAudit("DELETE", "users", id, `Removed staff member ${user.name}`);
    return true;
  }

  /* =========================================================
     BACKUP & RESTORE
  ========================================================== */

  function exportBackupJSON() {
    const dump = {};
    Object.entries(KEYS).forEach(([keyName, storageKey]) => {
      dump[keyName] = load(storageKey, null);
    });
    return JSON.stringify(dump, null, 2);
  }

  function importBackupJSON(jsonString) {
    try {
      const dump = JSON.parse(jsonString);
      Object.entries(KEYS).forEach(([keyName, storageKey]) => {
        if (dump[keyName] !== undefined) {
          save(storageKey, dump[keyName]);
        }
      });
      logAudit("SYSTEM_RESTORE", "all", "0", "Database backup restored");
      return true;
    } catch (e) {
      console.error("APSStore: Restore failed", e);
      return false;
    }
  }

  function resetToSeed() {
    localStorage.removeItem(KEYS.INITIALIZED);
    initDatabase(true);
    return true;
  }

  // Public API
  return {
    initDatabase,
    resetToSeed,
    exportBackupJSON,
    importBackupJSON,
    logAudit,

    // Medicines & Batches
    getMedicines,
    getMedicineById,
    saveMedicine,
    deleteMedicine,
    getBatches,
    getFEFOBatches,
    saveBatch,
    adjustBatchStock,

    // Movements
    getMovements,
    addMovement,

    // POS & Sales
    processSale,
    processReturn,

    // Purchase Orders & Suppliers
    getPurchaseOrders,
    createPurchaseOrder,
    receiveGoods,
    getSuppliers,
    saveSupplier,
    recordSupplierPayment,

    // Customers
    getCustomers,
    saveCustomer,
    settleCustomerCredit,

    // Prescriptions & Doctors
    getDoctors,
    saveDoctor,
    getPrescriptions,
    savePrescription,

    // Invoices & Analytics
    getInvoices,
    getReturns,
    getAlerts,
    getAnalytics,

    // Categories & Manufacturers
    getCategories,
    saveCategory,
    getManufacturers,

    // Admin & Audit
    getAuditLogs,
    getUsers,
    getRoles,
    saveUser,
    deleteUser
  };
})();
