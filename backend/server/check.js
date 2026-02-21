import dotenv from 'dotenv';
dotenv.config();
import pool from './config/db.js';

const { rows: users } = await pool.query('SELECT id, username, email, role, LEFT(password_hash,20) as pw_start FROM fleet_users');
console.log('USERS:\n', users);

const { rows: vehicles } = await pool.query('SELECT id, name_model, status FROM vehicles LIMIT 3');
console.log('VEHICLES:\n', vehicles);

const { rows: trips } = await pool.query('SELECT COUNT(*) as cnt, status FROM trips GROUP BY status');
console.log('TRIPS:\n', trips);

// Test bcrypt verify for admin_mgr / fleet123
import bcrypt from 'bcrypt';
const u = users.find(x => x.username === 'admin_mgr');
if (u) {
    const { rows: full } = await pool.query('SELECT password_hash FROM fleet_users WHERE username=$1', ['admin_mgr']);
    const match = await bcrypt.compare('fleet123', full[0].password_hash);
    console.log('\nPassword check for admin_mgr/fleet123:', match ? '✅ MATCH' : '❌ NO MATCH');
}

await pool.end();
