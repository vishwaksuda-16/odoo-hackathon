import pkg from 'pg';
const { Pool } = pkg;
import dotenv from 'dotenv';
dotenv.config();

const pool = new Pool({
  user: process.env.DB_USER,
  host: process.env.DB_HOST ?? 'localhost',
  database: process.env.DB_DATABASE ?? process.env.DB_NAME,
  password: process.env.DB_PASSWORD,
  port: Number(process.env.DB_PORT ?? 5432),

  max: Number(process.env.DB_POOL_MAX ?? 20),
  min: Number(process.env.DB_POOL_MIN ?? 2),
  idleTimeoutMillis: Number(process.env.DB_IDLE_TIMEOUT ?? 30_000),
  connectionTimeoutMillis: Number(process.env.DB_CONN_TIMEOUT ?? 5_000),

  statement_timeout: Number(process.env.DB_STMT_TIMEOUT ?? 30_000),
  query_timeout: Number(process.env.DB_QUERY_TIMEOUT ?? 30_000),
  application_name: 'fleet_management_api',

  ...(process.env.DB_SSL === 'true' ? {
    ssl: { rejectUnauthorized: process.env.DB_SSL_REJECT_UNAUTH !== 'false' }
  } : {}),
});

pool.on('connect', (client) => {
  client.query(`SET statement_timeout = ${process.env.DB_STMT_TIMEOUT ?? 30000}`);
});

pool.on('error', (err, client) => {
  console.error('[DB Pool] Unexpected client error:', err.message);
});

pool.on('remove', () => {
  if (process.env.NODE_ENV === 'development') {
    console.debug(`[DB Pool] Connection removed. Pool size: ${pool.totalCount}`);
  }
});

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

export async function withSerializableTransaction(fn) {
  return withTransaction(fn, 'SERIALIZABLE');
}

export default pool;