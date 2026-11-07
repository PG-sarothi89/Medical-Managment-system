/**
 * CURO Medical Management System — PostgreSQL 18 REST API Handler
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

    // 2. Medicines Catalog
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

    // 3. Batches (FEFO Order: earliest expiry first)
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

    // 4. Customers
    if (pathname === "/api/customers" && method === "GET") {
      const result = await db.query("SELECT * FROM customers ORDER BY name ASC;");
      return sendJson(res, 200, { ok: true, data: result.rows });
    }

    // 5. Doctors
    if (pathname === "/api/doctors" && method === "GET") {
      const result = await db.query("SELECT * FROM doctors ORDER BY name ASC;");
      return sendJson(res, 200, { ok: true, data: result.rows });
    }

    // 6. Suppliers
    if (pathname === "/api/suppliers" && method === "GET") {
      const result = await db.query("SELECT * FROM suppliers ORDER BY name ASC;");
      return sendJson(res, 200, { ok: true, data: result.rows });
    }

    // 7. Users
    if (pathname === "/api/users" && method === "GET") {
      const result = await db.query(`
        SELECT u.id, u.username, u.email, u.name, u.designation, u.phone, u.is_active, u.created_at,
               r.id as role_id, r.name as role_name
        FROM users u
        JOIN roles r ON u.role_id = r.id
        WHERE u.is_active = TRUE
        ORDER BY u.name ASC;
      `);
      return sendJson(res, 200, { ok: true, data: result.rows });
    }

    // 8. Prescriptions with Items
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

    // 9. Atomic POS Checkout (FEFO batch deduction & invoice creation)
    if (pathname === "/api/pos/checkout" && method === "POST") {
      const payload = await parseJsonBody(req);
      const {
        customerId,
        prescriptionId,
        subtotal,
        discountAmount = 0,
        taxAmount = 0,
        totalAmount,
        paymentMode,
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

          // Lock batch row
          const batchRes = await client.query(`
            SELECT quantity_available FROM batches WHERE id = $1 FOR UPDATE
          `, [batchId]);

          if (batchRes.rows.length === 0) {
            throw new Error(`Batch ${batchId} not found`);
          }

          const currentStock = batchRes.rows[0].quantity_available;
          if (currentStock < quantity) {
            throw new Error(`Insufficient stock for batch ${batchId}. Available: ${currentStock}, Requested: ${quantity}`);
          }

          const newStock = currentStock - quantity;

          // Record sale item
          await client.query(`
            INSERT INTO sale_items (id, sale_id, medicine_id, batch_id, quantity, unit_price, subtotal)
            VALUES ($1, $2, $3, $4, $5, $6, $7)
          `, [saleItemId, saleId, medicineId, batchId, quantity, unitPrice, itemSubtotal]);

          // Update batch stock
          await client.query(`
            UPDATE batches SET quantity_available = $1 WHERE id = $2
          `, [newStock, batchId]);

          // Record immutable movement
          const movId = `mov_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`;
          await client.query(`
            INSERT INTO inventory_movements (
              id, medicine_id, batch_id, movement_type, quantity, balance_after,
              reference_type, reference_id, user_id, notes
            ) VALUES ($1, $2, $3, 'SALE', $4, $5, 'INV', $6, $7, 'POS Dispensed')
          `, [movId, medicineId, batchId, -quantity, newStock, invNum, servedBy]);
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
