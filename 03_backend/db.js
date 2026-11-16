/**
 * CURO Medical Management System - PostgreSQL 18 Connection Pool
 * Supports both individual environment parameters and standard DATABASE_URL strings.
 */
require("dotenv").config();
const { Pool } = require("pg");

const poolConfig = process.env.DATABASE_URL
  ? {
      connectionString: process.env.DATABASE_URL,
      ssl: process.env.PGSSL === "true" ? { rejectUnauthorized: false } : false
    }
  : {
      host: process.env.PGHOST || "localhost",
      port: parseInt(process.env.PGPORT || "8000", 10),
      database: process.env.PGDATABASE || "curo_db",
      user: process.env.PGUSER || "postgres",
      password: process.env.PGPASSWORD || "root1234",
      ssl: process.env.PGSSL === "true" ? { rejectUnauthorized: false } : false
    };

const pool = new Pool({
  ...poolConfig,
  max: 20,
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: 5000,
});

pool.on("error", (err) => {
  console.error("Unexpected error on idle PostgreSQL client:", err);
});

module.exports = {
  query: (text, params) => pool.query(text, params),
  pool,
  testConnection: async () => {
    try {
      const res = await pool.query("SELECT version(), current_database(), current_user;");
      return { success: true, info: res.rows[0] };
    } catch (err) {
      return { success: false, error: err.message };
    }
  }
};
