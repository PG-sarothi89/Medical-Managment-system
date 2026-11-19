/**
 * CURO Medical Management System - PostgreSQL 18 Connection Pool
 * Supports standard DATABASE_URL strings, individual environment parameters,
 * and seamless fallback state detection.
 */
require("dotenv").config();
const { Pool } = require("pg");

let pgAvailable = false;
let lastCheckTime = 0;

const poolConfig = process.env.DATABASE_URL
  ? {
      connectionString: process.env.DATABASE_URL,
      ssl: process.env.PGSSL === "true" ? { rejectUnauthorized: false } : false
    }
  : {
      host: process.env.PGHOST || "localhost",
      port: parseInt(process.env.PGPORT || "5432", 10),
      database: process.env.PGDATABASE || "curo_db",
      user: process.env.PGUSER || "postgres",
      password: process.env.PGPASSWORD || "root1234",
      ssl: process.env.PGSSL === "true" ? { rejectUnauthorized: false } : false
    };

const pool = new Pool({
  ...poolConfig,
  max: 20,
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: 2000,
});

pool.on("error", (err) => {
  pgAvailable = false;
  // Prevent unhandled exception logs from taking down the Node process
});

async function checkConnection(force = false) {
  const now = Date.now();
  if (!force && lastCheckTime && (now - lastCheckTime < 10000)) {
    return pgAvailable;
  }
  lastCheckTime = now;
  try {
    const res = await pool.query("SELECT 1;");
    pgAvailable = Boolean(res && res.rowCount);
  } catch (e) {
    pgAvailable = false;
  }
  return pgAvailable;
}

// Initial probe
checkConnection(true).catch(() => {});

module.exports = {
  query: (text, params) => pool.query(text, params),
  pool,
  isPgAvailable: () => pgAvailable,
  checkConnection,
  testConnection: async () => {
    try {
      const res = await pool.query("SELECT version(), current_database(), current_user;");
      pgAvailable = true;
      return { success: true, info: res.rows[0] };
    } catch (err) {
      pgAvailable = false;
      return { success: false, error: err.message || "Connection refused" };
    }
  }
};
