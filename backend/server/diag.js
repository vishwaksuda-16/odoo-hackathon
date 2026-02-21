import dotenv from 'dotenv';
dotenv.config();
import pool from './config/db.js';
import { getMonthlyFinancials, getMaintenanceFrequency, getVehicleROI, getFuelEfficiency, getCostPerKm } from './utils/analytics.js';

// Test /analytics/financial/monthly
console.log('\n── Testing getMonthlyFinancials(2026) ──');
try {
    const r = await getMonthlyFinancials(2026);
    console.log('✅ monthly rows:', r.length, r.slice(0, 2));
} catch (e) { console.error('❌ monthly error:', e.message); }

// Test the broken YTD query from getMonthlyFinancialReport
console.log('\n── Testing YTD query ──');
try {
    const { rows } = await pool.query(`
    SELECT
      COALESCE(SUM(f.fuel_cost), 0) AS ytd_fuel_cost,
      COALESCE(SUM(m.cost), 0)      AS ytd_maint_cost
    FROM fuel_logs f
    FULL OUTER JOIN maintenance_logs m ON TRUE
    WHERE EXTRACT(YEAR FROM COALESCE(f.log_date, m.service_date)) = $1
  `, [2026]);
    console.log('✅ YTD result:', rows[0]);
} catch (e) { console.error('❌ YTD query error:', e.message); }

// Test /analytics/report
console.log('\n── Testing getFuelEfficiency ──');
try {
    const r = await getFuelEfficiency();
    console.log('✅ fuel rows:', r.length);
} catch (e) { console.error('❌ fuel error:', e.message); }

console.log('\n── Testing getCostPerKm ──');
try {
    const r = await getCostPerKm();
    console.log('✅ cost rows:', r.length);
} catch (e) { console.error('❌ cost error:', e.message); }

console.log('\n── Testing getVehicleROI ──');
try {
    const r = await getVehicleROI();
    console.log('✅ roi rows:', r.length);
} catch (e) { console.error('❌ roi error:', e.message); }

await pool.end();
