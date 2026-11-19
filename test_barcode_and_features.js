/**
 * Automated Test Suite for CURO Medical Management System
 * Validates Barcode Scanning, Auto-Fill, Batch Tracking, FEFO, and POS Integration.
 */

const fs = require("fs");
const path = require("path");

// Mock browser environment for node execution
const storage = {};
global.localStorage = {
  getItem: (k) => storage[k] || null,
  setItem: (k, v) => { storage[k] = String(v); },
  removeItem: (k) => { delete storage[k]; },
  clear: () => { Object.keys(storage).forEach(k => delete storage[k]); }
};

global.window = {
  addEventListener: () => {},
  dispatchEvent: () => {}
};

global.fetch = async () => ({ ok: true, json: async () => ({}) });

// Load APSStore
require("./04_frontend/js/core/aps-store.js");
const store = global.window.APSStore;

let passed = 0;
let failed = 0;

function assert(condition, testName) {
  if (condition) {
    console.log(`[PASS] ${testName}`);
    passed++;
  } else {
    console.error(`[FAIL] ${testName}`);
    failed++;
  }
}

async function runTests() {
  console.log("=================================================");
  console.log("   RUNNING CURO MEDICAL SYSTEM AUTOMATED TESTS   ");
  console.log("=================================================\n");

  // Test 1: Initialize Database
  store.initDatabase(true);
  const meds = store.getMedicines();
  assert(meds.length >= 14, `Database initialized with seed medicines (found ${meds.length})`);

  // Test 2: Barcode Lookup for Seeded Drug (Napa Extra)
  const napaLookup = store.lookupBarcodeDrugCatalog("8901234500011");
  assert(napaLookup !== null, "Barcode 8901234500011 lookup succeeds");
  assert(napaLookup.name === "Napa Extra 500mg/65mg", `Lookup name is Napa Extra (got "${napaLookup.name}")`);
  assert(napaLookup.generic === "Paracetamol + Caffeine", "Lookup generic is Paracetamol + Caffeine");
  assert(napaLookup.costPrice > 0, `Cost price is defined (${napaLookup.costPrice})`);
  assert(napaLookup.sellingPrice > 0, `Selling price is defined (${napaLookup.sellingPrice})`);

  // Test 3: Barcode Lookup for Unseeded Catalog Drug (Ace Plus)
  const aceLookup = store.lookupBarcodeDrugCatalog("8901234500202");
  assert(aceLookup !== null, "Barcode 8901234500202 (Ace Plus) lookup succeeds");
  assert(aceLookup.name === "Ace Plus 500mg/65mg", `Lookup name is Ace Plus (got "${aceLookup.name}")`);
  assert(aceLookup.isCatalogMatch === true, "Marked as catalog match");

  // Test 4: Barcode Lookup for Another Unseeded Drug (Finix 20)
  const finixLookup = store.lookupBarcodeDrugCatalog("8901234500301");
  assert(finixLookup !== null, "Barcode 8901234500301 (Finix) lookup succeeds");
  assert(finixLookup.name === "Finix 20mg Tablet", `Lookup name is Finix (got "${finixLookup.name}")`);

  // Test 5: Barcode Lookup for Arbitrary/Unknown Barcode
  const unknownLookup = store.lookupBarcodeDrugCatalog("8909999888822");
  assert(unknownLookup !== null, "Arbitrary barcode lookup succeeds");
  assert(unknownLookup.name.length > 0, `Generated sensible drug name (${unknownLookup.name})`);
  assert(unknownLookup.generic.length > 0, `Generated active compound (${unknownLookup.generic})`);
  assert(unknownLookup.categoryId.length > 0, `Assigned category (${unknownLookup.categoryId})`);
  assert(unknownLookup.costPrice > 0, `Assigned cost price (${unknownLookup.costPrice})`);

  // Test 6: Adding Medicine by Scanning Barcode with Initial Stock
  // User Requirement: "when he scans the barcode all the informations from the barcode will automatically filled expect quatity"
  const newDrugBarcode = "8909999888822"; // Unseeded/new scanned drug barcode
  const drugDetails = store.lookupBarcodeDrugCatalog(newDrugBarcode);

  // User enters quantity 150 (all other fields auto-filled)
  const savedMed = store.saveMedicine({
    name: drugDetails.name,
    generic: drugDetails.generic,
    categoryId: drugDetails.categoryId,
    manufacturerId: drugDetails.manufacturerId,
    composition: drugDetails.composition,
    unit: drugDetails.unit,
    hsn: drugDetails.hsn,
    barcode: newDrugBarcode,
    reorderLevel: drugDetails.reorderLevel,
    reorderQuantity: drugDetails.reorderQuantity,
    requiresPrescription: drugDetails.requiresPrescription,
    // User-entered quantity:
    initialQuantity: 150,
    costPrice: drugDetails.costPrice,
    sellingPrice: drugDetails.sellingPrice,
    mrp: drugDetails.mrp,
    supplierId: drugDetails.supplierId
  });

  assert(savedMed && savedMed.id, `Medicine successfully saved with ID ${savedMed.id}`);

  // Test 7: Verify Stock was Automatically Created in Batches
  const medRecord = store.getMedicineById(savedMed.id);
  assert(medRecord !== null, "New medicine found in catalog by ID");
  assert(medRecord.totalStock === 150, `Initial stock registered correctly in batches (expected 150, got ${medRecord.totalStock})`);

  const batches = store.getBatches(savedMed.id);
  assert(batches.length === 1, `Batch created for new medicine (count: ${batches.length})`);
  assert(batches[0].quantityAvailable === 150, `Batch available quantity is 150 (got ${batches[0].quantityAvailable})`);

  // Test 8: Verify Inventory Movement Ledger
  const movements = store.getMovements().filter(m => m.medicineId === savedMed.id);
  assert(movements.length >= 1, `Inward movement recorded in inventory ledger (count: ${movements.length})`);
  assert(movements[0].quantity === 150, `Movement quantity is 150 (got ${movements[0].quantity})`);

  // Test 9: FEFO Batch Allocation and Stock Sale
  const napaBatches = store.getFEFOBatches("med-1");
  assert(napaBatches.length > 0, "FEFO returns valid unexpired batches sorted by expiry");
  for (let i = 0; i < napaBatches.length - 1; i++) {
    const d1 = new Date(napaBatches[i].expiryDate);
    const d2 = new Date(napaBatches[i + 1].expiryDate);
    assert(d1 <= d2, `FEFO sort order verified: ${napaBatches[i].expiryDate} <= ${napaBatches[i+1].expiryDate}`);
  }

  // Test 10: Process Sale with Stock Deduction
  const initialStock = store.getMedicineById("med-1").totalStock;
  const saleResult = store.processSale({
    customerId: "cust-1",
    customerName: "Walk-in Patient",
    customerPhone: "",
    items: [
      { medicineId: "med-1", quantity: 5, unitPrice: 3.00, mrp: 3.00 }
    ],
    subtotal: 15.00,
    discount: 0,
    taxRate: 0.05,
    paymentMode: "Cash"
  });

  assert(saleResult && saleResult.sale && saleResult.sale.id, `Sale completed with ID ${saleResult.sale && saleResult.sale.id}`);
  const postStock = store.getMedicineById("med-1").totalStock;
  assert(postStock === initialStock - 5, `Stock deducted correctly by FEFO: before=${initialStock}, after=${postStock}`);

  // Test 11: Barcode Search in Catalog
  const searchedMed = store.getMedicineByBarcode(newDrugBarcode);
  assert(searchedMed !== null && searchedMed.id === savedMed.id, "getMedicineByBarcode returns newly added medicine");

  console.log("\n=================================================");
  console.log(`TEST SUMMARY: ${passed} PASSED, ${failed} FAILED`);
  console.log("=================================================");

  if (failed > 0) {
    process.exit(1);
  }
}

runTests().catch(err => {
  console.error("Test execution exception:", err);
  process.exit(1);
});
