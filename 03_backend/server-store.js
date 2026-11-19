/**
 * CURO Medical Management System — Persistent Server Data Store
 * Provides guaranteed atomic server-side persistence for all entities
 * (Medicines, Batches, Customers, Sales, Prescriptions, Doctors, Suppliers)
 * ensuring changes made by any user are immediately persisted on disk
 * and visible to all other users across devices and browser sessions.
 */

const fs = require("fs");
const path = require("path");

const DATA_DIR = path.resolve(__dirname, "data");
const DB_FILE = path.join(DATA_DIR, "curo_database.json");

let memoryDb = null;

function ensureDataDir() {
  if (!fs.existsSync(DATA_DIR)) {
    fs.mkdirSync(DATA_DIR, { recursive: true });
  }
}

function loadDatabase() {
  ensureDataDir();
  if (memoryDb) return memoryDb;

  if (fs.existsSync(DB_FILE)) {
    try {
      const raw = fs.readFileSync(DB_FILE, "utf8");
      memoryDb = JSON.parse(raw);
      ensureTables(memoryDb);
      return memoryDb;
    } catch (e) {
      console.error("Failed to parse curo_database.json, re-initializing:", e);
    }
  }

  // Initialize with blank schema if file missing
  memoryDb = {
    categories: [],
    manufacturers: [],
    suppliers: [],
    medicines: [],
    batches: [],
    customers: [],
    doctors: [],
    prescriptions: [],
    prescription_items: [],
    sales: [],
    sale_items: [],
    payments: [],
    inventory_movements: [],
    users: [
      {
        id: "usr-1",
        username: "admin",
        email: "admin@curo.health",
        password: "admin",
        name: "System Administrator",
        designation: "Chief Technology Officer",
        role: "admin",
        role_id: "admin",
        phone: "+880 1700-000001",
        is_active: true
      }
    ]
  };

  saveDatabase();
  return memoryDb;
}

function ensureTables(db) {
  const tables = [
    "categories", "manufacturers", "suppliers", "medicines",
    "batches", "customers", "doctors", "prescriptions",
    "prescription_items", "sales", "sale_items", "payments",
    "inventory_movements", "users"
  ];
  for (const t of tables) {
    if (!Array.isArray(db[t])) db[t] = [];
  }
}

function saveDatabase() {
  try {
    ensureDataDir();
    const tempFile = DB_FILE + ".tmp";
    fs.writeFileSync(tempFile, JSON.stringify(memoryDb, null, 2), "utf8");
    fs.renameSync(tempFile, DB_FILE);
  } catch (e) {
    console.error("Critical: Failed to save server database to disk:", e);
  }
}

function todayStr(offsetDays = 0) {
  const d = new Date();
  d.setDate(d.getDate() + offsetDays);
  return d.toISOString().split("T")[0];
}

// Recalculates totalStock on each medicine from available batches
function refreshMedicineStock(db) {
  const stockMap = {};
  for (const b of db.batches) {
    const medId = b.medicine_id || b.medicineId;
    const qty = Number(b.quantity_available ?? b.quantityAvailable ?? 0);
    stockMap[medId] = (stockMap[medId] || 0) + Math.max(0, qty);
  }

  for (const m of db.medicines) {
    m.total_stock = stockMap[m.id] ?? 0;
    m.totalStock = m.total_stock;
  }
}

/* ==========================================================================
   PUBLIC SERVER STORE API
   ========================================================================== */

const ServerStore = {
  init() {
    loadDatabase();
    refreshMedicineStock(memoryDb);
    saveDatabase();
    return memoryDb;
  },

  getRaw() {
    return loadDatabase();
  },

  getAllSyncData() {
    const db = loadDatabase();
    refreshMedicineStock(db);

    const catMap = Object.fromEntries((db.categories || []).map(c => [c.id, c.name]));
    const mfrMap = Object.fromEntries((db.manufacturers || []).map(m => [m.id, m.name]));
    const supMap = Object.fromEntries((db.suppliers || []).map(s => [s.id, s.name]));
    const medMap = Object.fromEntries((db.medicines || []).map(m => [m.id, m]));

    // Format medicines with category_name & manufacturer_name
    const medicines = (db.medicines || []).map(m => {
      const cName = m.category_name || m.categoryName || catMap[m.category_id || m.categoryId] || "General";
      const mName = m.manufacturer_name || m.manufacturerName || mfrMap[m.manufacturer_id || m.manufacturerId] || "Generic";
      return {
        ...m,
        id: m.id,
        name: m.name,
        generic: m.generic || m.generic_name || m.genericName || m.name,
        generic_name: m.generic || m.generic_name || m.genericName || m.name,
        genericName: m.generic || m.generic_name || m.genericName || m.name,
        category_id: m.category_id || m.categoryId || "cat-1",
        categoryId: m.category_id || m.categoryId || "cat-1",
        category_name: cName,
        categoryName: cName,
        manufacturer_id: m.manufacturer_id || m.manufacturerId || "mfr-1",
        manufacturerId: m.manufacturer_id || m.manufacturerId || "mfr-1",
        manufacturer_name: mName,
        manufacturerName: mName,
        composition: m.composition || "",
        dosage_form: m.dosage_form || m.dosageForm || m.unit || "Tablet",
        dosageForm: m.dosage_form || m.dosageForm || m.unit || "Tablet",
        unit: m.dosage_form || m.dosageForm || m.unit || "Tablet",
        strength: m.strength || "",
        barcode: m.barcode || "",
        hsn_code: m.hsn_code || m.hsnCode || m.hsn || "3004.90",
        hsnCode: m.hsn_code || m.hsnCode || m.hsn || "3004.90",
        hsn: m.hsn_code || m.hsnCode || m.hsn || "3004.90",
        requires_prescription: Boolean(m.requires_prescription || m.requiresPrescription),
        requiresPrescription: Boolean(m.requires_prescription || m.requiresPrescription),
        reorder_level: Number(m.reorder_level || m.reorderLevel || 50),
        reorderLevel: Number(m.reorder_level || m.reorderLevel || 50),
        reorder_quantity: Number(m.reorder_quantity || m.reorderQuantity || 100),
        reorderQuantity: Number(m.reorder_quantity || m.reorderQuantity || 100),
        rack_location: m.rack_location || m.rackLocation || "Rack A-1",
        rackLocation: m.rack_location || m.rackLocation || "Rack A-1",
        total_stock: Number(m.total_stock ?? m.totalStock ?? 0),
        totalStock: Number(m.total_stock ?? m.totalStock ?? 0),
        is_active: Boolean(m.is_active !== false && m.isActive !== false),
        isActive: Boolean(m.is_active !== false && m.isActive !== false)
      };
    });

    // Format batches
    const batches = (db.batches || []).map(b => {
      const med = medMap[b.medicine_id || b.medicineId] || {};
      const expDate = b.expiry_date || b.expiryDate || todayStr(365);
      const diffDays = Math.ceil((new Date(expDate) - new Date()) / (1000 * 60 * 60 * 24));
      return {
        ...b,
        id: b.id,
        medicine_id: b.medicine_id || b.medicineId,
        medicineId: b.medicine_id || b.medicineId,
        medicine_name: b.medicine_name || b.medicineName || med.name || "Unknown Medicine",
        medicineName: b.medicine_name || b.medicineName || med.name || "Unknown Medicine",
        generic_name: b.generic_name || b.genericName || med.generic || med.generic_name || "",
        genericName: b.generic_name || b.genericName || med.generic || med.generic_name || "",
        supplier_id: b.supplier_id || b.supplierId || "sup-1",
        supplierId: b.supplier_id || b.supplierId || "sup-1",
        supplier_name: b.supplier_name || b.supplierName || supMap[b.supplier_id || b.supplierId] || "Direct Purchase",
        supplierName: b.supplier_name || b.supplierName || supMap[b.supplier_id || b.supplierId] || "Direct Purchase",
        batch_number: b.batch_number || b.batchNumber,
        batchNumber: b.batch_number || b.batchNumber,
        manufacture_date: b.manufacture_date || b.manufactureDate || todayStr(),
        manufactureDate: b.manufacture_date || b.manufactureDate || todayStr(),
        expiry_date: expDate,
        expiryDate: expDate,
        cost_price: Number(b.cost_price ?? b.purchasePrice ?? 0),
        purchasePrice: Number(b.cost_price ?? b.purchasePrice ?? 0),
        selling_price: Number(b.selling_price ?? b.sellingPrice ?? 0),
        sellingPrice: Number(b.selling_price ?? b.sellingPrice ?? 0),
        mrp: Number(b.mrp ?? b.selling_price ?? b.sellingPrice ?? 0),
        quantity_received: Number(b.quantity_received ?? b.quantityReceived ?? 0),
        quantityReceived: Number(b.quantity_received ?? b.quantityReceived ?? 0),
        quantity_available: Number(b.quantity_available ?? b.quantityAvailable ?? 0),
        quantityAvailable: Number(b.quantity_available ?? b.quantityAvailable ?? 0),
        rack_location: b.rack_location || b.rackLocation || "Rack A-1",
        rackLocation: b.rack_location || b.rackLocation || "Rack A-1",
        daysToExpiry: diffDays
      };
    });

    // Format customers
    const customers = (db.customers || []).map(c => ({
      ...c,
      id: c.id,
      name: c.name,
      phone: c.phone,
      email: c.email || "",
      address: c.address || "",
      date_of_birth: c.date_of_birth || c.dateOfBirth || null,
      dateOfBirth: c.date_of_birth || c.dateOfBirth || "",
      credit_limit: Number(c.credit_limit ?? c.creditLimit ?? 5000),
      creditLimit: Number(c.credit_limit ?? c.creditLimit ?? 5000),
      outstanding_balance: Number(c.outstanding_balance ?? c.outstandingBalance ?? 0),
      outstandingBalance: Number(c.outstanding_balance ?? c.outstandingBalance ?? 0),
      loyalty_points: Number(c.loyalty_points ?? c.loyaltyPoints ?? 0),
      loyaltyPoints: Number(c.loyalty_points ?? c.loyaltyPoints ?? 0),
      created_at: c.created_at || c.createdAt || todayStr()
    }));

    // Format prescriptions with items
    const itemsByRx = {};
    for (const it of db.prescription_items || []) {
      const rxId = it.prescription_id || it.prescriptionId;
      if (!itemsByRx[rxId]) itemsByRx[rxId] = [];
      const med = medMap[it.medicine_id || it.medicineId] || {};
      itemsByRx[rxId].push({
        ...it,
        medicine_name: it.medicine_name || med.name || "Medicine"
      });
    }

    const prescriptions = (db.prescriptions || []).map(p => ({
      ...p,
      prescription_date: p.prescription_date || p.prescriptionDate || todayStr(),
      prescriptionDate: p.prescription_date || p.prescriptionDate || todayStr(),
      items: p.items || itemsByRx[p.id] || []
    }));

    return {
      categories: db.categories || [],
      manufacturers: db.manufacturers || [],
      suppliers: db.suppliers || [],
      medicines,
      batches,
      customers,
      doctors: db.doctors || [],
      prescriptions,
      sales: (db.sales || []).slice(0, 50),
      users: db.users || []
    };
  },

  // MEDICINES CRUD
  getMedicines() {
    return this.getAllSyncData().medicines;
  },

  getMedicineByBarcode(barcode) {
    if (!barcode) return null;
    const clean = String(barcode).trim().toLowerCase();
    const meds = this.getMedicines();
    return meds.find(m => m.barcode && String(m.barcode).trim().toLowerCase() === clean) || null;
  },

  saveMedicine(data) {
    const db = loadDatabase();
    const isNew = !data.id;
    const newId = data.id || `med_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`;

    const catMap = Object.fromEntries((db.categories || []).map(c => [c.id, c.name]));
    const mfrMap = Object.fromEntries((db.manufacturers || []).map(m => [m.id, m.name]));

    const gName = data.generic || data.genericName || data.generic_name || data.name;
    const catId = data.categoryId || data.category_id || "cat-1";
    const mfrId = data.manufacturerId || data.manufacturer_id || "mfr-1";
    const dForm = data.unit || data.dosageForm || data.dosage_form || "Tablet";
    const hCode = data.hsn || data.hsnCode || data.hsn_code || "3004.90";
    const rLvl = Number(data.reorderLevel || data.reorder_level || 50);
    const rQty = Number(data.reorderQuantity || data.reorder_quantity || 100);
    const rLoc = data.rackLocation || data.rack_location || "Rack A-1";
    const rxReq = Boolean(data.requiresPrescription || data.requires_prescription);

    const record = {
      id: newId,
      name: data.name,
      generic: gName,
      generic_name: gName,
      genericName: gName,
      category_id: catId,
      categoryId: catId,
      category_name: catMap[catId] || "General",
      categoryName: catMap[catId] || "General",
      manufacturer_id: mfrId,
      manufacturerId: mfrId,
      manufacturer_name: mfrMap[mfrId] || "Generic",
      manufacturerName: mfrMap[mfrId] || "Generic",
      composition: data.composition || "",
      dosage_form: dForm,
      dosageForm: dForm,
      unit: dForm,
      strength: data.strength || "",
      barcode: data.barcode || "",
      hsn_code: hCode,
      hsnCode: hCode,
      hsn: hCode,
      requires_prescription: rxReq,
      requiresPrescription: rxReq,
      reorder_level: rLvl,
      reorderLevel: rLvl,
      reorder_quantity: rQty,
      reorderQuantity: rQty,
      rack_location: rLoc,
      rackLocation: rLoc,
      is_active: Boolean(data.isActive !== false && data.is_active !== false),
      isActive: Boolean(data.isActive !== false && data.is_active !== false),
      total_stock: 0,
      totalStock: 0
    };

    const existingIdx = db.medicines.findIndex(m => m.id === newId);
    if (existingIdx !== -1) {
      db.medicines[existingIdx] = { ...db.medicines[existingIdx], ...record };
    } else {
      db.medicines.push(record);
    }

    // Auto-create initial stock batch if initialQuantity > 0
    const initQty = Number(data.initialQuantity || data.quantity || 0);
    if (initQty > 0) {
      const bId = data.initialBatchId || `bat_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`;
      const medInitials = (data.name || "BCH").replace(/[^a-zA-Z]/g, "").slice(0, 3).toUpperCase() || "MED";
      const bNum = data.initialBatch || `${medInitials}-${Date.now().toString().slice(-6)}`;
      const exp = data.initialExp || todayStr(365 * 2);
      const cost = Number(data.costPrice || data.cost_price || data.purchasePrice || 0);
      const sell = Number(data.sellingPrice || data.selling_price || (cost > 0 ? (cost * 1.3).toFixed(2) : 10.00));
      const mrpVal = Number(data.mrp || sell);
      const suppId = data.supplierId || data.supplier_id || "sup-1";

      const batchObj = {
        id: bId,
        medicine_id: newId,
        medicineId: newId,
        supplier_id: suppId,
        supplierId: suppId,
        batch_number: bNum,
        batchNumber: bNum,
        manufacture_date: todayStr(),
        manufactureDate: todayStr(),
        expiry_date: exp,
        expiryDate: exp,
        cost_price: cost,
        purchasePrice: cost,
        selling_price: sell,
        sellingPrice: sell,
        mrp: mrpVal,
        quantity_received: initQty,
        quantityReceived: initQty,
        quantity_available: initQty,
        quantityAvailable: initQty,
        rack_location: rLoc,
        rackLocation: rLoc
      };

      const bIdx = db.batches.findIndex(b => b.id === bId);
      if (bIdx !== -1) {
        db.batches[bIdx] = batchObj;
      } else {
        db.batches.push(batchObj);
      }

      // Add inventory movement
      db.inventory_movements.push({
        id: `mov_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
        medicine_id: newId,
        batch_id: bId,
        movement_type: "PURCHASE",
        quantity: initQty,
        balance_after: initQty,
        reference_type: "BATCH_ADD",
        reference_id: bNum,
        user_id: "usr-4",
        notes: "Initial batch registration"
      });
    }

    refreshMedicineStock(db);
    saveDatabase();
    return record;
  },

  // BATCHES CRUD
  getBatches(medicineId = null) {
    const all = this.getAllSyncData().batches;
    if (medicineId) {
      return all.filter(b => (b.medicine_id === medicineId || b.medicineId === medicineId));
    }
    return all;
  },

  saveBatch(data) {
    const db = loadDatabase();
    const newId = data.id || `bat_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`;
    const medId = data.medicineId || data.medicine_id;
    const suppId = data.supplierId || data.supplier_id || "sup-1";
    const bNum = data.batchNumber || data.batch_number || `BAT-${Date.now().toString().slice(-6)}`;
    const mDate = data.manufactureDate || data.manufacture_date || todayStr();
    const eDate = data.expiryDate || data.expiry_date || todayStr(365);
    const cPrice = Number(data.costPrice || data.cost_price || data.purchasePrice || 0);
    const sPrice = Number(data.sellingPrice || data.selling_price || 0);
    const mrpVal = Number(data.mrp || sPrice);
    const qRec = Number(data.quantityReceived || data.quantity_received || 0);
    const qAvail = Number(data.quantityAvailable ?? data.quantity_available ?? qRec);
    const rLoc = data.rackLocation || data.rack_location || "Rack A-1";

    const batchObj = {
      id: newId,
      medicine_id: medId,
      medicineId: medId,
      supplier_id: suppId,
      supplierId: suppId,
      batch_number: bNum,
      batchNumber: bNum,
      manufacture_date: mDate,
      manufactureDate: mDate,
      expiry_date: eDate,
      expiryDate: eDate,
      cost_price: cPrice,
      purchasePrice: cPrice,
      selling_price: sPrice,
      sellingPrice: sPrice,
      mrp: mrpVal,
      quantity_received: qRec,
      quantityReceived: qRec,
      quantity_available: qAvail,
      quantityAvailable: qAvail,
      rack_location: rLoc,
      rackLocation: rLoc
    };

    const idx = db.batches.findIndex(b => b.id === newId);
    if (idx !== -1) {
      db.batches[idx] = { ...db.batches[idx], ...batchObj };
    } else {
      db.batches.push(batchObj);
      db.inventory_movements.push({
        id: `mov_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
        medicine_id: medId,
        batch_id: newId,
        movement_type: "PURCHASE",
        quantity: qRec,
        balance_after: qAvail,
        reference_type: "BATCH_ADD",
        reference_id: bNum,
        user_id: "usr-4",
        notes: "Batch registered"
      });
    }

    refreshMedicineStock(db);
    saveDatabase();
    return batchObj;
  },

  adjustBatchStock({ batchId, adjustQty, reason, notes }) {
    const db = loadDatabase();
    const idx = db.batches.findIndex(b => b.id === batchId);
    if (idx === -1) throw new Error("Batch not found.");

    const batch = db.batches[idx];
    const prev = Number(batch.quantity_available ?? batch.quantityAvailable ?? 0);
    const delta = Number(adjustQty);
    const newQty = Math.max(0, prev + delta);

    batch.quantity_available = newQty;
    batch.quantityAvailable = newQty;

    db.inventory_movements.push({
      id: `mov_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
      medicine_id: batch.medicine_id || batch.medicineId,
      batch_id: batchId,
      movement_type: "ADJUSTMENT",
      quantity: delta,
      balance_after: newQty,
      reference_type: "MANUAL",
      reference_id: reason || "Stock Adjustment",
      user_id: "usr-2",
      notes: notes || reason || "Adjusted batch stock"
    });

    refreshMedicineStock(db);
    saveDatabase();
    return batch;
  },

  // CUSTOMERS CRUD
  getCustomers() {
    return this.getAllSyncData().customers;
  },

  saveCustomer(data) {
    const db = loadDatabase();
    const phone = String(data.phone || "").trim();
    const name = String(data.name || "").trim();
    if (!name || !phone) throw new Error("Name and Phone are required.");

    let existing = null;
    if (data.id) {
      existing = db.customers.find(c => c.id === data.id);
    }
    if (!existing && phone) {
      existing = db.customers.find(c => c.phone === phone);
    }

    const dob = data.dateOfBirth || data.date_of_birth || null;
    const limit = Number(data.creditLimit ?? data.credit_limit ?? 5000);
    const bal = Number(data.outstandingBalance ?? data.outstanding_balance ?? 0);
    const pts = Number(data.loyaltyPoints ?? data.loyalty_points ?? 0);

    const record = {
      id: existing ? existing.id : (data.id || `cust-${Date.now()}`),
      name,
      phone,
      email: data.email || "",
      address: data.address || "",
      date_of_birth: dob,
      dateOfBirth: dob,
      credit_limit: limit,
      creditLimit: limit,
      outstanding_balance: bal,
      outstandingBalance: bal,
      loyalty_points: pts,
      loyaltyPoints: pts,
      created_at: existing ? existing.created_at : todayStr()
    };

    if (existing) {
      const idx = db.customers.findIndex(c => c.id === existing.id);
      db.customers[idx] = { ...existing, ...record };
    } else {
      db.customers.push(record);
    }

    saveDatabase();
    return record;
  },

  settleCustomerCredit({ customerId, amount, paymentMode = "Cash", referenceNumber = "" }) {
    const db = loadDatabase();
    const idx = db.customers.findIndex(c => c.id === customerId);
    if (idx === -1) throw new Error("Customer not found.");

    const payVal = Number(amount);
    const cust = db.customers[idx];
    const prevBal = Number(cust.outstanding_balance ?? cust.outstandingBalance ?? 0);
    const newBal = Math.max(0, Number((prevBal - payVal).toFixed(2)));

    cust.outstanding_balance = newBal;
    cust.outstandingBalance = newBal;

    const payId = `pay_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`;
    db.payments.push({
      id: payId,
      customer_id: customerId,
      amount: payVal,
      method: paymentMode,
      transaction_ref: referenceNumber,
      payment_date: new Date().toISOString()
    });

    saveDatabase();
    return cust;
  },

  // DOCTORS CRUD
  saveDoctor(data) {
    const db = loadDatabase();
    const newId = data.id || `doc-${Date.now()}`;
    const lic = data.licenseNumber || data.license_number || `BMDC-${Date.now().toString().slice(-5)}`;

    const record = {
      id: newId,
      name: data.name,
      specialization: data.specialization || "General Medicine",
      license_number: lic,
      licenseNumber: lic,
      phone: data.phone || "",
      chamber: data.chamber || ""
    };

    const idx = db.doctors.findIndex(d => d.id === newId);
    if (idx !== -1) {
      db.doctors[idx] = { ...db.doctors[idx], ...record };
    } else {
      db.doctors.push(record);
    }

    saveDatabase();
    return record;
  },

  // SUPPLIERS CRUD
  saveSupplier(data) {
    const db = loadDatabase();
    const newId = data.id || `sup-${Date.now()}`;
    const record = {
      id: newId,
      name: data.name,
      contact_person: data.contactPerson || data.contact_person || "",
      contactPerson: data.contactPerson || data.contact_person || "",
      phone: data.phone || "",
      email: data.email || "",
      address: data.address || "",
      tax_number: data.gstin || data.tax_number || "",
      credit_period_days: Number(data.creditPeriodDays || data.credit_period_days || 30),
      outstanding_balance: Number(data.outstandingBalance || data.outstanding_balance || 0)
    };

    const idx = db.suppliers.findIndex(s => s.id === newId);
    if (idx !== -1) {
      db.suppliers[idx] = { ...db.suppliers[idx], ...record };
    } else {
      db.suppliers.push(record);
    }

    saveDatabase();
    return record;
  },

  // PRESCRIPTIONS CRUD
  savePrescription(data) {
    const db = loadDatabase();
    const newId = data.id || `rx-${Date.now()}`;
    const rxDate = data.prescriptionDate || data.prescription_date || todayStr();

    const record = {
      id: newId,
      customer_id: data.customerId || data.customer_id,
      customerId: data.customerId || data.customer_id,
      doctor_id: data.doctorId || data.doctor_id,
      doctorId: data.doctorId || data.doctor_id,
      prescription_date: rxDate,
      prescriptionDate: rxDate,
      notes: data.notes || "",
      status: data.status || "Pending",
      items: data.items || []
    };

    const idx = db.prescriptions.findIndex(p => p.id === newId);
    if (idx !== -1) {
      db.prescriptions[idx] = { ...db.prescriptions[idx], ...record };
    } else {
      db.prescriptions.unshift(record);
    }

    saveDatabase();
    return record;
  },

  // POS CHECKOUT (FEFO stock deduction + invoice record)
  processCheckout(payload) {
    const db = loadDatabase();
    const {
      customerId,
      prescriptionId,
      subtotal,
      discountAmount = 0,
      taxAmount = 0,
      totalAmount,
      paymentMode = "Cash",
      servedBy = "usr-3",
      items = []
    } = payload;

    const invNum = `INV-${Date.now().toString().slice(-6)}`;
    const saleId = `sale_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`;

    // Process items and deduct stock from batches
    for (const it of items) {
      const medId = it.medicineId || it.medicine_id;
      const bId = it.batchId || it.batch_id;
      const qty = Number(it.quantity || 1);

      let batch = null;
      if (bId) {
        batch = db.batches.find(b => b.id === bId);
      }
      if (!batch && medId) {
        // Find best unexpired batch via FEFO
        batch = db.batches
          .filter(b => (b.medicine_id === medId || b.medicineId === medId) && Number(b.quantity_available ?? b.quantityAvailable ?? 0) > 0)
          .sort((a, b) => new Date(a.expiry_date || a.expiryDate) - new Date(b.expiry_date || b.expiryDate))[0];
      }

      if (batch) {
        const cur = Number(batch.quantity_available ?? batch.quantityAvailable ?? 0);
        const rem = Math.max(0, cur - qty);
        batch.quantity_available = rem;
        batch.quantityAvailable = rem;

        db.inventory_movements.push({
          id: `mov_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
          medicine_id: medId,
          batch_id: batch.id,
          movement_type: "SALE",
          quantity: -qty,
          balance_after: rem,
          reference_type: "INV",
          reference_id: invNum,
          user_id: servedBy,
          notes: "POS counter sale"
        });
      }

      db.sale_items.push({
        id: `sitem_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
        sale_id: saleId,
        medicine_id: medId,
        batch_id: batch ? batch.id : null,
        quantity: qty,
        unit_price: Number(it.unitPrice || it.price || 0),
        subtotal: Number(it.unitPrice || it.price || 0) * qty
      });
    }

    const saleRecord = {
      id: saleId,
      invoice_number: invNum,
      invoiceNumber: invNum,
      customer_id: customerId || null,
      prescription_id: prescriptionId || null,
      subtotal: Number(subtotal),
      discount_amount: Number(discountAmount),
      tax_amount: Number(taxAmount),
      total_amount: Number(totalAmount),
      payment_mode: paymentMode,
      payment_status: paymentMode === "Credit" ? "Unpaid" : "Paid",
      served_by: servedBy,
      sale_date: new Date().toISOString()
    };

    db.sales.unshift(saleRecord);

    // Update customer debt if credit sale
    if (customerId && (paymentMode === "Credit" || paymentMode === "Due")) {
      const cIdx = db.customers.findIndex(c => c.id === customerId);
      if (cIdx !== -1) {
        const curDebt = Number(db.customers[cIdx].outstanding_balance ?? db.customers[cIdx].outstandingBalance ?? 0);
        const newDebt = Number((curDebt + Number(totalAmount)).toFixed(2));
        db.customers[cIdx].outstanding_balance = newDebt;
        db.customers[cIdx].outstandingBalance = newDebt;
      }
    }

    refreshMedicineStock(db);
    saveDatabase();
    return saleRecord;
  },

  // USERS CRUD
  getUsers() {
    return (loadDatabase().users || []).filter(u => u.is_active !== false);
  },

  saveUser(data) {
    const db = loadDatabase();
    const newId = data.id || `usr-${Date.now().toString(36)}`;
    const record = {
      id: newId,
      username: data.username,
      email: data.email,
      password: data.password || "admin123",
      name: data.name,
      designation: data.designation || "Staff Specialist",
      role: data.role || data.role_id || "admin",
      role_id: data.role || data.role_id || "admin",
      phone: data.phone || "",
      is_active: Boolean(data.is_active !== false)
    };

    const idx = db.users.findIndex(u => u.id === newId);
    if (idx !== -1) {
      db.users[idx] = { ...db.users[idx], ...record };
    } else {
      db.users.push(record);
    }

    saveDatabase();
    return record;
  },

  deleteUser(userId) {
    const db = loadDatabase();
    db.users = (db.users || []).filter(u => u.id !== userId);
    saveDatabase();
    return true;
  }
};

// Initialize on require
ServerStore.init();

module.exports = ServerStore;
