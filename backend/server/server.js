import dotenv from 'dotenv';
dotenv.config();

import express from 'express';
import pool from './config/db.js';

// ── Routes ──────────────────────────────────────────────────────
import authRoutes from './routes/authRoute.js';
import vehicleRoute from './routes/vehicleRoute.js';
import driverRoute from './routes/driverRoute.js';
import tripRoute from './routes/tripsRoute.js';
import maintenanceRoutes from './routes/maintenanceRoutes.js';
import analyticsRoute from './routes/analyticsRoute.js';
import exportRoute from './routes/exportRoute.js';

// ── Middleware ───────────────────────────────────────────────────
import { errorHandler } from './middleware/errorHandler.js';

// ── Background Jobs ──────────────────────────────────────────────
import { startScheduler } from './services/schedulerService.js';

// ─────────────────────────────────────────────────────────────────
const app = express();
const PORT = process.env.PORT || 5000;

// ── Security ─────────────────────────────────────────────────────
try {
  const { default: helmet } = await import('helmet');
  app.use(helmet());
} catch { console.warn('[server] helmet not installed — skipping.'); }

try {
  const { default: rateLimit } = await import('express-rate-limit');
  const limiter = rateLimit({
    windowMs: 15 * 60 * 1000,  // 15 minutes
    max: 100,                   // 100 req / IP
    standardHeaders: true,
    legacyHeaders: false,
    message: { success: false, code: 'RATE_LIMITED', reason: 'Too many requests.' },
  });
  app.use(limiter);
} catch { console.warn('[server] express-rate-limit not installed — skipping.'); }

// ── CORS ─────────────────────────────────────────────────────────
try {
  const { default: cors } = await import('cors');
  app.use(cors({ origin: process.env.CORS_ORIGIN ?? '*' }));
} catch { console.warn('[server] cors not installed — skipping.'); }

// ── Body Parser ───────────────────────────────────────────────────
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// ── Health Check ─────────────────────────────────────────────────
app.get('/health', async (req, res) => {
  try {
    const { rows } = await pool.query('SELECT current_database() AS db, NOW() AS server_time');
    res.json({ status: 'ok', database: rows[0].db, server_time: rows[0].server_time });
  } catch (e) {
    res.status(503).json({ status: 'error', reason: e.message });
  }
});

// ── API Routes ────────────────────────────────────────────────────
app.use('/users', authRoutes);
app.use('/vehicle', vehicleRoute);
app.use('/driver', driverRoute);
app.use('/api', tripRoute);
app.use('/maintenance', maintenanceRoutes);
app.use('/analytics', analyticsRoute);
app.use('/export', exportRoute);

// ── 404 fallback ─────────────────────────────────────────────────
app.use((req, res) => {
  res.status(404).json({ success: false, code: 'NOT_FOUND', reason: `${req.method} ${req.path} not found.` });
});

// ── Centralized Error Handler (must be last) ──────────────────────
app.use(errorHandler);

// ── Start Server ─────────────────────────────────────────────────
const server = app.listen(PORT, () => {
  console.log(`[server] Fleet Management API running on port ${PORT}`);
  startScheduler();
});

// ── Graceful Shutdown ─────────────────────────────────────────────
const shutdown = async (signal) => {
  console.log(`[server] ${signal} received — shutting down gracefully…`);
  server.close(async () => {
    await pool.end();
    console.log('[server] DB pool closed. Exiting.');
    process.exit(0);
  });
  setTimeout(() => { console.error('[server] Forced exit.'); process.exit(1); }, 10000);
};

process.on('SIGTERM', () => shutdown('SIGTERM'));
process.on('SIGINT', () => shutdown('SIGINT'));