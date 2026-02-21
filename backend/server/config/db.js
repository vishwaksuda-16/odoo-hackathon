import pkg from 'pg';
const { Pool } = pkg;
import dotenv from 'dotenv';
dotenv.config();

// ─────────────────────────────────────────────────────────────────
//  CONNECTION POOL — tuned for 10,000+ vehicles / high concurrency
//
//  Key formula: pool_size ≈ ((core_count * 2) + effective_spindle_count)
//  For a typical 4-core app server: ~10 connections is optimal.
//  We set max=20 to support burst traffic with 2 replicas.
// ─────────────────────────────────────────────────────────────────
const pool = new Pool({
  user: process.env.DB_USER,
  host: process.env.DB_HOST ?? 'localhost',
  database: process.env.DB_DATABASE ?? process.env.DB_NAME,
  password: process.env.DB_PASSWORD,
  port: Number(process.env.DB_PORT ?? 5432),

  // Pool sizing
  max: Number(process.env.DB_POOL_MAX ?? 20),    // max open connections
  min: Number(process.env.DB_POOL_MIN ?? 2),     // keep-alive connections
  idleTimeoutMillis: Number(process.env.DB_IDLE_TIMEOUT ?? 30_000),   // 30s idle eviction
  connectionTimeoutMillis: Number(process.env.DB_CONN_TIMEOUT ?? 5_000), // 5s wait for conn

  // Prevents hung connections from blocking the pool
  statement_timeout: Number(process.env.DB_STMT_TIMEOUT ?? 30_000),  // 30s per query
  query_timeout: Number(process.env.DB_QUERY_TIMEOUT ?? 30_000),
  application_name: 'fleet_management_api',

  // SSL (required in cloud environments like Render/RDS)
  ...(process.env.DB_SSL === 'true' ? {
    ssl: { rejectUnauthorized: process.env.DB_SSL_REJECT_UNAUTH !== 'false' }
  } : {}),
});

// ─────────────────────────────────────────────────────────────────
//  POOL EVENT MONITORING
// ─────────────────────────────────────────────────────────────────
pool.on('connect', (client) => {
  // Set per-connection statement timeout (defence in depth)
  client.query(`SET statement_timeout = ${process.env.DB_STMT_TIMEOUT ?? 30000}`);
});

pool.on('error', (err, client) => {
  console.error('[DB Pool] Unexpected client error:', err.message);
  // Don't exit — pool will recover the connection automatically
});

pool.on('remove', () => {
  if (process.env.NODE_ENV === 'development') {
    console.debug(`[DB Pool] Connection removed. Pool size: ${pool.totalCount}`);
  }
});

// ─────────────────────────────────────────────────────────────────
//  STARTUP PROBE — fail fast if DB is unreachable
// ─────────────────────────────────────────────────────────────────
(async () => {
  try {
    const client = await pool.connect();
    const { rows } = await client.query(
      'SELECT current_database() AS db, version() AS pg_version'
    );
    console.log(`[DB] Connected to '${rows[0].db}' (${rows[0].pg_version.split(',')[0]})`);
    client.release();
  } catch (err) {
    console.error('[DB] FATAL: Cannot connect to PostgreSQL:', err.message);
    process.exit(1);
  }
})();

// ─────────────────────────────────────────────────────────────────
//  HELPER: withTransaction
//  Use this wrapper for any operation that needs ACID guarantees.
//  Automatically handles BEGIN, COMMIT, ROLLBACK, and client release.
//
//  Usage:
//    const result = await withTransaction(async (client) => {
//        await client.query(...);
//        return someValue;
//    });
// ─────────────────────────────────────────────────────────────────
export async function withTransaction(fn, isolationLevel = 'READ COMMITTED') {
  const client = await pool.connect();
  try {
    await client.query(`BEGIN ISOLATION LEVEL ${isolationLevel}`);
    const result = await fn(client);
    await client.query('COMMIT');
    return result;
  } catch (err) {
    await client.query('ROLLBACK');
    throw err;
  } finally {
    client.release();
  }
}

// ─────────────────────────────────────────────────────────────────
//  HELPER: withSerializableTransaction
//  Use for dispatch operations where double-booking prevention is critical.
//  SERIALIZABLE is the highest PostgreSQL isolation — serializes all
//  concurrent transactions that touch the same rows.
// ─────────────────────────────────────────────────────────────────
export async function withSerializableTransaction(fn) {
  return withTransaction(fn, 'SERIALIZABLE');
}

export default pool;