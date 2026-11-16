/**
 * CURO Medical Management System — PostgreSQL 18 REST API Handler
 * Full two-way read/write sync for all enterprise modules.
 */
const db = require("./db");

function sendJson(res, statusCode, data) {
  res.writeHead(statusCode, {
    "Content-Type": "application/json; charset=utf-8",
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type, Authorization"
  });
  res.end(JSON.stringify(data));
}

function parseJsonBody(req) {
  return new Promise((resolve, reject) => {
    let body = "";
    req.on("data", chunk => { body += chunk; });
    req.on("end", () => {
      try {
        resolve(body ? JSON.parse(body) : {});
      } catch (e) {
        reject(e);
      }
    });
    req.on("error", reject);
  });
}

async function handleApiRequest(req, res) {
  const url = new URL(req.url, `http://${req.headers.host || "localhost"}`);
  const pathname = url.pathname;
  const method = req.method;

  if (method === "OPTIONS") {
    return sendJson(res, 204, {});
  }

  try {
    // 1. Health & Database Status
    if (pathname === "/api/status" && method === "GET") {
      const conn = await db.testConnection();
      if (!conn.success) {
        return sendJson(res, 500, { ok: false, error: conn.error });
      }

      const countsQuery = `
        SELECT
          (SELECT COUNT(*) FROM medicines) as medicines_count,
          (SELECT COUNT(*) FROM batches) as batches_count,
          (SELECT COUNT(*) FROM customers) as customers_count,
          (SELECT COUNT(*) FROM doctors) as doctors_count,
          (SELECT COUNT(*) FROM suppliers) as suppliers_count,
          (SELECT COUNT(*) FROM sales) as sales_count;
      `;
      const counts = await db.query(countsQuery);

      return sendJson(res, 200, {
        ok: true,
        database: "PostgreSQL 18 (curo_db)",
        host: process.env.PGHOST || "localhost",
        port: process.env.PGPORT || 8000,
        serverTime: new Date().toISOString(),
        info: conn.info,
        metrics: counts.rows[0]
      });
    }

    // 2. Full System Sync (Synchronizes all master tables in one fast call)
    if (pathname === "/api/sync" && method === "GET") {
      const [cats, mfrs, supps, meds, batches, custs, docs, rxs, rxItems, sales, usersRes] = await Promise.all([
        db.query("SELECT * FROM categories ORDER BY name ASC"),
        db.query("SELECT * FROM manufacturers ORDER BY name ASC"),
        db.query("SELECT * FROM suppliers ORDER BY name ASC"),
        db.query(`
          SELECT m.*, 
                 c.name as category_name, 
                 mf.name as manufacturer_name,
                 COALESCE(SUM(b.quantity_available), 0) as total_stock
          FROM medicines m
          LEFT JOIN categories c ON m.category_id = c.id
          LEFT JOIN manufacturers mf ON m.manufacturer_id = mf.id
          LEFT JOIN batches b ON m.id = b.medicine_id
          WHERE m.is_active = TRUE
          GROUP BY m.id, c.name, mf.name
          ORDER BY m.name ASC;
        `),
        db.query(`
          SELECT b.*, m.name as medicine_name, m.generic_name, s.name as supplier_name
          FROM batches b
          JOIN medicines m ON b.medicine_id = m.id
          LEFT JOIN suppliers s ON b.supplier_id = s.id
          ORDER BY b.expiry_date ASC;
        `),
        db.query("SELECT * FROM customers ORDER BY name ASC"),
        db.query("SELECT * FROM doctors ORDER BY name ASC"),
        db.query("SELECT * FROM prescriptions ORDER BY prescription_date DESC LIMIT 50"),
        db.query("SELECT * FROM prescription_items"),
        db.query("SELECT * FROM sales ORDER BY sale_date DESC LIMIT 50"),
        db.query(`
          SELECT u.id, u.username, u.email, u.password_hash as password, u.name, u.designation, u.phone, u.is_active,
                 r.id as role, r.name as role_title
          FROM users u
          JOIN roles r ON u.role_id = r.id
          WHERE u.is_active = TRUE
          ORDER BY u.name ASC;
        `)
      ]);

      const itemsByRx = {};
      rxItems.rows.forEach(item => {
        if (!itemsByRx[item.prescription_id]) itemsByRx[item.prescription_id] = [];
        itemsByRx[item.prescription_id].push(item);
      });

      const prescriptions = rxs.rows.map(rx => ({
        ...rx,
        items: itemsByRx[rx.id] || []
      }));

      return sendJson(res, 200, {
        ok: true,
        data: {
          categories: cats.rows,
          manufacturers: mfrs.rows,
          suppliers: supps.rows,
          medicines: meds.rows,
          batches: batches.rows,
          customers: custs.rows,
          doctors: docs.rows,
          prescriptions,
          sales: sales.rows,
          users: usersRes.rows
        }
      });
    }

    // 3. Customers - Read & Write
    if (pathname === "/api/customers" && method === "GET") {
      const result = await db.query("SELECT * FROM customers ORDER BY name ASC;");
      return sendJson(res, 200, { ok: true, data: result.rows });
    }

    if (pathname === "/api/customers" && method === "POST") {
      const body = await parseJsonBody(req);
      const {
        id,
        name,
        phone,
        email = null,
        address = null,
        dateOfBirth = null,
        date_of_birth = null,
        creditLimit = 5000,
        credit_limit = 5000,
        outstandingBalance = 0,
        outstanding_balance = 0,
        loyaltyPoints = 0,
        loyalty_points = 0
      } = body;

      if (!name || !phone) {
        return sendJson(res, 400, { ok: false, error: "Name and Phone number are required." });
      }

      const dob = dateOfBirth || date_of_birth || null;
      const limit = Number(creditLimit || credit_limit || 5000);
      const balance = Number(outstandingBalance || outstanding_balance || 0);
      const points = Number(loyaltyPoints || loyalty_points || 0);

      // Check if customer already exists by ID or by Phone
      let existing = null;
      if (id) {
        const byId = await db.query("SELECT * FROM customers WHERE id = $1", [id]);
        if (byId.rows.length > 0) existing = byId.rows[0];
      }
      if (!existing && phone) {
        const byPhone = await db.query("SELECT * FROM customers WHERE phone = $1", [phone]);
        if (byPhone.rows.length > 0) existing = byPhone.rows[0];
      }

      let saved = null;
      if (existing) {
        const updateQuery = `
          UPDATE customers
          SET name = $1, phone = $2, email = $3, address = $4,
              date_of_birth = $5, credit_limit = $6, outstanding_balance = $7, loyalty_points = $8
          WHERE id = $9
          RETURNING *;
        `;
        const resUp = await db.query(updateQuery, [
          name, phone, email, address, dob, limit, balance, points, existing.id
        ]);
        saved = resUp.rows[0];
      } else {
        const newId = id || `cust-${Date.now()}`;
        const insertQuery = `
          INSERT INTO customers (
            id, name, phone, email, address, date_of_birth, credit_limit, outstanding_balance, loyalty_points
          ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
          RETURNING *;
        `;
        const resIn = await db.query(insertQuery, [
          newId, name, phone, email, address, dob, limit, balance, points
        ]);
        saved = resIn.rows[0];
      }

      return sendJson(res, 201, { ok: true, data: saved });
    }

    // 4. Customer Debt Settlement
    if (pathname === "/api/customers/settle" && method === "POST") {
      const { customerId, amount, paymentMode = "Cash", referenceNumber = "" } = await parseJsonBody(req);
      if (!customerId || !amount) {
        return sendJson(res, 400, { ok: false, error: "Customer ID and Amount are required." });
      }

      const client = await db.pool.connect();
      try {
        await client.query("BEGIN");
        const updRes = await client.query(`
          UPDATE customers
          SET outstanding_balance = GREATEST(0, outstanding_balance - $1)
          WHERE id = $2
          RETURNING *;
        `, [Number(amount), customerId]);

        const payId = `pay_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`;
        await client.query(`
          INSERT INTO payments (id, sale_id, customer_id, amount, method, transaction_ref, received_by)
          VALUES ($1, NULL, $2, $3, $4, $5, 'usr-3')
        `, [payId, customerId, Number(amount), paymentMode, referenceNumber]);

        await client.query("COMMIT");
        return sendJson(res, 200, { ok: true, data: updRes.rows[0] });
      } catch (err) {
        await client.query("ROLLBACK");
        return sendJson(res, 400, { ok: false, error: err.message });
      } finally {
        client.release();
      }
    }

    // 5. Medicines Catalog - Read & Write
    if (pathname === "/api/medicines" && method === "GET") {
      const q = `
        SELECT m.*, 
               c.name as category_name, 
               mf.name as manufacturer_name,
               COALESCE(SUM(b.quantity_available), 0) as total_stock
        FROM medicines m
        LEFT JOIN categories c ON m.category_id = c.id
        LEFT JOIN manufacturers mf ON m.manufacturer_id = mf.id
        LEFT JOIN batches b ON m.id = b.medicine_id
        WHERE m.is_active = TRUE
        GROUP BY m.id, c.name, mf.name
        ORDER BY m.name ASC;
      `;
      const result = await db.query(q);
      return sendJson(res, 200, { ok: true, data: result.rows });
    }

    if (pathname === "/api/medicines" && method === "POST") {
      const body = await parseJsonBody(req);
      const {
        id,
        name,
        genericName,
        generic_name,
        categoryId,
        category_id,
        manufacturerId,
        manufacturer_id,
        composition = "",
        dosageForm = "Tablet",
        dosage_form = "Tablet",
        strength = "",
        barcode = null,
        hsnCode = "3004.90",
        hsn_code = "3004.90",
        requiresPrescription = false,
        requires_prescription = false,
        reorderLevel = 50,
        reorder_level = 50,
        reorderQuantity = 100,
        reorder_quantity = 100,
        rackLocation = "Rack A-1",
        rack_location = "Rack A-1"
      } = body;

      const gName = genericName || generic_name || name;
      const catId = categoryId || category_id || "cat-1";
      const mfrId = manufacturerId || manufacturer_id || "mfr-1";
      const dForm = dosageForm || dosage_form || "Tablet";
      const rxReq = Boolean(requiresPrescription || requires_prescription);
      const rLvl = Number(reorderLevel || reorder_level || 50);
      const rQty = Number(reorderQuantity || reorder_quantity || 100);
      const rLoc = rackLocation || rack_location || "Rack A-1";
      const hCode = hsnCode || hsn_code || "3004.90";

      let existing = null;
      if (id) {
        const byId = await db.query("SELECT * FROM medicines WHERE id = $1", [id]);
        if (byId.rows.length > 0) existing = byId.rows[0];
      }

      let saved = null;
      if (existing) {
        const resUp = await db.query(`
          UPDATE medicines
          SET name = $1, generic_name = $2, category_id = $3, manufacturer_id = $4,
              composition = $5, dosage_form = $6, strength = $7, barcode = $8,
              hsn_code = $9, requires_prescription = $10, reorder_level = $11,
              reorder_quantity = $12, rack_location = $13
          WHERE id = $14
          RETURNING *;
        `, [
          name, gName, catId, mfrId, composition, dForm, strength, barcode || null,
          hCode, rxReq, rLvl, rQty, rLoc, existing.id
        ]);
        saved = resUp.rows[0];
      } else {
        const newId = id || `med-${Date.now()}`;
        const resIn = await db.query(`
          INSERT INTO medicines (
            id, name, generic_name, category_id, manufacturer_id, composition,
            dosage_form, strength, barcode, hsn_code, requires_prescription,
            reorder_level, reorder_quantity, rack_location
          ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14)
          RETURNING *;
        `, [
          newId, name, gName, catId, mfrId, composition, dForm, strength,
          barcode || null, hCode, rxReq, rLvl, rQty, rLoc
        ]);
        saved = resIn.rows[0];
      }

      return sendJson(res, 201, { ok: true, data: saved });
    }

    // 6. Batches - Read & Add
    if (pathname === "/api/batches" && method === "GET") {
      const medId = url.searchParams.get("medicine_id");
      let q = `
        SELECT b.*, m.name as medicine_name, m.generic_name, s.name as supplier_name
        FROM batches b
        JOIN medicines m ON b.medicine_id = m.id
        LEFT JOIN suppliers s ON b.supplier_id = s.id
      `;
      const params = [];
      if (medId) {
        q += ` WHERE b.medicine_id = $1 `;
        params.push(medId);
      }
      q += ` ORDER BY b.expiry_date ASC;`;

      const result = await db.query(q, params);
      return sendJson(res, 200, { ok: true, data: result.rows });
    }

    if (pathname === "/api/batches" && method === "POST") {
      const body = await parseJsonBody(req);
      const {
        id,
        medicineId,
        medicine_id,
        supplierId,
        supplier_id,
        batchNumber,
        batch_number,
        manufactureDate,
        manufacture_date,
        expiryDate,
        expiry_date,
        costPrice,
        cost_price,
        purchasePrice,
        sellingPrice,
        selling_price,
        mrp,
        quantityReceived,
        quantity_received,
        quantityAvailable,
        quantity_available,
        rackLocation,
        rack_location
      } = body;

      const medId = medicineId || medicine_id;
      const suppId = supplierId || supplier_id || "sup-1";
      const bNum = batchNumber || batch_number;
      const mDate = manufactureDate || manufacture_date || new Date().toISOString().split("T")[0];
      const eDate = expiryDate || expiry_date;
      const cPrice = Number(costPrice || cost_price || purchasePrice || 0);
      const sPrice = Number(sellingPrice || selling_price || 0);
      const mrpVal = Number(mrp || sPrice);
      const qRec = Number(quantityReceived || quantity_received || 0);
      const qAvail = Number(quantityAvailable ?? quantity_available ?? qRec);
      const rLoc = rackLocation || rack_location || "Rack A-1";

      const newId = id || `bat-${Date.now()}`;

      const resIn = await db.query(`
        INSERT INTO batches (
          id, medicine_id, supplier_id, batch_number, manufacture_date,
          expiry_date, cost_price, selling_price, mrp, quantity_received,
          quantity_available, rack_location
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12)
        ON CONFLICT (id) DO UPDATE SET
          quantity_available = EXCLUDED.quantity_available,
          selling_price = EXCLUDED.selling_price,
          mrp = EXCLUDED.mrp
        RETURNING *;
      `, [newId, medId, suppId, bNum, mDate, eDate, cPrice, sPrice, mrpVal, qRec, qAvail, rLoc]);

      // Add movement entry
      const movId = `mov_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`;
      await db.query(`
        INSERT INTO inventory_movements (
          id, medicine_id, batch_id, movement_type, quantity, balance_after,
          reference_type, reference_id, user_id, notes
        ) VALUES ($1, $2, $3, 'PURCHASE', $4, $5, 'MANUAL', $6, 'usr-4', 'Batch added / received')
      `, [movId, medId, newId, qRec, qAvail, bNum]);

      return sendJson(res, 201, { ok: true, data: resIn.rows[0] });
    }

    // 7. Doctors
    if (pathname === "/api/doctors" && method === "GET") {
      const result = await db.query("SELECT * FROM doctors ORDER BY name ASC;");
      return sendJson(res, 200, { ok: true, data: result.rows });
    }

    if (pathname === "/api/doctors" && method === "POST") {
      const body = await parseJsonBody(req);
      const {
        id,
        name,
        specialization,
        licenseNumber,
        license_number,
        phone = "",
        chamber = ""
      } = body;

      const lic = licenseNumber || license_number || `BMDC-${Date.now().toString().slice(-5)}`;
      const newId = id || `doc-${Date.now()}`;

      const result = await db.query(`
        INSERT INTO doctors (id, name, specialization, license_number, phone, chamber)
        VALUES ($1, $2, $3, $4, $5, $6)
        ON CONFLICT (id) DO UPDATE SET
          name = EXCLUDED.name,
          specialization = EXCLUDED.specialization,
          phone = EXCLUDED.phone,
          chamber = EXCLUDED.chamber
        RETURNING *;
      `, [newId, name, specialization, lic, phone, chamber]);

      return sendJson(res, 201, { ok: true, data: result.rows[0] });
    }

    // 8. Suppliers
    if (pathname === "/api/suppliers" && method === "GET") {
      const result = await db.query("SELECT * FROM suppliers ORDER BY name ASC;");
      return sendJson(res, 200, { ok: true, data: result.rows });
    }

    if (pathname === "/api/suppliers" && method === "POST") {
      const body = await parseJsonBody(req);
      const {
        id,
        name,
        contactPerson,
        contact_person,
        phone,
        email = "",
        address = "",
        gstin = "",
        tax_number = "",
        creditPeriodDays = 30,
        credit_period_days = 30,
        outstandingBalance = 0,
        outstanding_balance = 0
      } = body;

      const newId = id || `sup-${Date.now()}`;
      const cp = contactPerson || contact_person || "";
      const tax = gstin || tax_number || "";
      const cred = Number(creditPeriodDays || credit_period_days || 30);
      const bal = Number(outstandingBalance || outstanding_balance || 0);

      const result = await db.query(`
        INSERT INTO suppliers (
          id, name, contact_person, phone, email, address, tax_number, credit_period_days, outstanding_balance
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
        ON CONFLICT (id) DO UPDATE SET
          name = EXCLUDED.name,
          contact_person = EXCLUDED.contact_person,
          phone = EXCLUDED.phone,
          email = EXCLUDED.email,
          address = EXCLUDED.address,
          tax_number = EXCLUDED.tax_number,
          credit_period_days = EXCLUDED.credit_period_days,
          outstanding_balance = EXCLUDED.outstanding_balance
        RETURNING *;
      `, [newId, name, cp, phone, email, address, tax, cred, bal]);

      return sendJson(res, 201, { ok: true, data: result.rows[0] });
    }

    // 9. Users - Read & Write
    if (pathname === "/api/users" && method === "GET") {
      const result = await db.query(`
        SELECT u.id, u.username, u.email, u.password_hash as password, u.name, u.designation, u.phone, u.is_active, u.created_at,
               r.id as role_id, r.name as role_name
        FROM users u
        JOIN roles r ON u.role_id = r.id
        WHERE u.is_active = TRUE
        ORDER BY u.name ASC;
      `);
      return sendJson(res, 200, { ok: true, data: result.rows });
    }

    if (pathname === "/api/users" && method === "POST") {
      const body = await parseJsonBody(req);
      const {
        id,
        username,
        email,
        password = "admin",
        password_hash,
        name,
        designation = "Staff Specialist",
        role = "admin",
        role_id,
        phone = "",
        is_active = true
      } = body;
      const newId = id || `usr-${Date.now().toString(36)}`;
      const roleId = role_id || role || "admin";
      const pass = password || password_hash || "admin123";

      const result = await db.query(`
        INSERT INTO users (id, username, email, password_hash, name, designation, role_id, phone, is_active)
        VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
        ON CONFLICT (id) DO UPDATE SET
          username = EXCLUDED.username,
          email = EXCLUDED.email,
          password_hash = EXCLUDED.password_hash,
          name = EXCLUDED.name,
          designation = EXCLUDED.designation,
          role_id = EXCLUDED.role_id,
          phone = EXCLUDED.phone,
          is_active = EXCLUDED.is_active
        RETURNING *;
      `, [newId, username, email, pass, name, designation, roleId, phone, is_active]);

      return sendJson(res, 201, { ok: true, data: result.rows[0] });
    }

    if (pathname.startsWith("/api/users/") && method === "DELETE") {
      const userId = pathname.split("/")[3];
      await db.query("DELETE FROM users WHERE id = $1", [userId]);
      return sendJson(res, 200, { ok: true, message: "User deleted" });
    }

    // 10. Prescriptions with Items
    if (pathname === "/api/prescriptions" && method === "GET") {
      const rxResult = await db.query(`
        SELECT p.*, c.name as customer_name, c.phone as customer_phone, d.name as doctor_name
        FROM prescriptions p
        JOIN customers c ON p.customer_id = c.id
        JOIN doctors d ON p.doctor_id = d.id
        ORDER BY p.prescription_date DESC;
      `);
      const itemsResult = await db.query(`
        SELECT pi.*, m.name as medicine_name
        FROM prescription_items pi
        JOIN medicines m ON pi.medicine_id = m.id;
      `);

      const itemsByRx = {};
      itemsResult.rows.forEach(item => {
        if (!itemsByRx[item.prescription_id]) itemsByRx[item.prescription_id] = [];
        itemsByRx[item.prescription_id].push(item);
      });

      const prescriptions = rxResult.rows.map(rx => ({
        ...rx,
        items: itemsByRx[rx.id] || []
      }));

      return sendJson(res, 200, { ok: true, data: prescriptions });
    }

    if (pathname === "/api/prescriptions" && method === "POST") {
      const body = await parseJsonBody(req);
      const {
        id,
        customerId,
        customer_id,
        doctorId,
        doctor_id,
        prescriptionDate,
        prescription_date,
        notes = "",
        status = "Pending",
        items = []
      } = body;

      const newRxId = id || `rx-${Date.now()}`;
      const cId = customerId || customer_id;
      const dId = doctorId || doctor_id;
      const rxDate = prescriptionDate || prescription_date || new Date().toISOString().split("T")[0];

      const client = await db.pool.connect();
      try {
        await client.query("BEGIN");
        await client.query(`
          INSERT INTO prescriptions (id, customer_id, doctor_id, prescription_date, notes, status)
          VALUES ($1, $2, $3, $4, $5, $6)
          ON CONFLICT (id) DO UPDATE SET
            customer_id = EXCLUDED.customer_id,
            doctor_id = EXCLUDED.doctor_id,
            prescription_date = EXCLUDED.prescription_date,
            notes = EXCLUDED.notes,
            status = EXCLUDED.status;
        `, [newRxId, cId, dId, rxDate, notes, status]);

        if (items && items.length > 0) {
          await client.query("DELETE FROM prescription_items WHERE prescription_id = $1", [newRxId]);
          for (const it of items) {
            const piId = `rxi_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`;
            await client.query(`
              INSERT INTO prescription_items (id, prescription_id, medicine_id, dosage, duration_days, quantity_prescribed)
              VALUES ($1, $2, $3, $4, $5, $6)
            `, [piId, newRxId, it.medicineId || it.medicine_id, it.dosage || "1-0-1", Number(it.durationDays || it.duration_days || 7), Number(it.quantityPrescribed || it.quantity_prescribed || 10)]);
          }
        }

        await client.query("COMMIT");
        return sendJson(res, 201, { ok: true, id: newRxId });
      } catch (e) {
        await client.query("ROLLBACK");
        return sendJson(res, 400, { ok: false, error: e.message });
      } finally {
        client.release();
      }
    }

    // 11. Atomic POS Checkout (FEFO batch deduction & invoice creation)
    if (pathname === "/api/pos/checkout" && method === "POST") {
      const payload = await parseJsonBody(req);
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

      if (!items || items.length === 0) {
        return sendJson(res, 400, { ok: false, error: "Cart is empty" });
      }

      const client = await db.pool.connect();
      try {
        await client.query("BEGIN");

        const invNum = `INV-${Date.now().toString().slice(-6)}`;
        const saleId = `sale_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`;

        // Create sale record
        await client.query(`
          INSERT INTO sales (
            id, invoice_number, customer_id, prescription_id, subtotal, discount_amount,
            tax_amount, total_amount, payment_mode, payment_status, served_by
          ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)
        `, [
          saleId, invNum, customerId || null, prescriptionId || null,
          subtotal, discountAmount, taxAmount, totalAmount, paymentMode, "Paid", servedBy
        ]);

        // Process each item and deduct from batch using FEFO lock
        for (const it of items) {
          const { medicineId, batchId, quantity, unitPrice } = it;
          const itemSubtotal = (quantity * unitPrice);
          const saleItemId = `sitem_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`;

          // Find batch if batchId exists
          if (batchId) {
            const batchRes = await client.query(`
              SELECT quantity_available FROM batches WHERE id = $1 FOR UPDATE
            `, [batchId]);

            if (batchRes.rows.length > 0) {
              const currentStock = batchRes.rows[0].quantity_available;
              const newStock = Math.max(0, currentStock - quantity);

              await client.query(`
                INSERT INTO sale_items (id, sale_id, medicine_id, batch_id, quantity, unit_price, subtotal)
                VALUES ($1, $2, $3, $4, $5, $6, $7)
              `, [saleItemId, saleId, medicineId, batchId, quantity, unitPrice, itemSubtotal]);

              await client.query(`
                UPDATE batches SET quantity_available = $1 WHERE id = $2
              `, [newStock, batchId]);

              const movId = `mov_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`;
              await client.query(`
                INSERT INTO inventory_movements (
                  id, medicine_id, batch_id, movement_type, quantity, balance_after,
                  reference_type, reference_id, user_id, notes
                ) VALUES ($1, $2, $3, 'SALE', $4, $5, 'INV', $6, $7, 'POS Dispensed')
              `, [movId, medicineId, batchId, -quantity, newStock, invNum, servedBy]);
            }
          }
        }

        // Record payment
        const payId = `pay_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`;
        await client.query(`
          INSERT INTO payments (id, sale_id, customer_id, amount, method, received_by)
          VALUES ($1, $2, $3, $4, $5, $6)
        `, [payId, saleId, customerId || null, totalAmount, paymentMode, servedBy]);

        // If prescription provided, update status
        if (prescriptionId) {
          await client.query(`UPDATE prescriptions SET status = 'Dispensed' WHERE id = $1`, [prescriptionId]);
        }

        await client.query("COMMIT");

        return sendJson(res, 201, {
          ok: true,
          saleId,
          invoiceNumber: invNum,
          totalAmount,
          message: "Transaction completed and stock deducted successfully"
        });
      } catch (err) {
        await client.query("ROLLBACK");
        return sendJson(res, 400, { ok: false, error: err.message });
      } finally {
        client.release();
      }
    }

    // 404 for unknown api routes
    return sendJson(res, 404, { ok: false, error: `Route ${pathname} not found` });
  } catch (err) {
    console.error("API Error:", err);
    return sendJson(res, 500, { ok: false, error: err.message });
  }
}

module.exports = { handleApiRequest };
