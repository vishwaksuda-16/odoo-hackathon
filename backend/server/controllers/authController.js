import pool from '../config/db.js';
import bcrypt from 'bcrypt';
import { signAccessToken, signRefreshToken, revokeRefreshToken } from '../middleware/authMiddleware.js';

// REGISTER
export const register = async (req, res) => {
  const { email, password, role } = req.body;
  try {
    const existing = await pool.query('SELECT id FROM fleet_users WHERE email = $1', [email]);
    if (existing.rows.length > 0)
      return res.status(400).json({ success: false, message: 'User already exists.' });

    const hashedPassword = await bcrypt.hash(password, 10);

    const result = await pool.query(
      `INSERT INTO fleet_users (email, password_hash, role)
             VALUES ($1, $2, $3) RETURNING id, email, role`,
      [email, hashedPassword, role]
    );

    return res.status(201).json({ success: true, user: result.rows[0] });
  } catch (error) {
    return res.status(500).json({ success: false, error: error.message });
  }
};

// LOGIN — returns short-lived access token + refresh token
export const login = async (req, res) => {
  const { email, password } = req.body;
  try {
    const result = await pool.query(
      'SELECT * FROM fleet_users WHERE email = $1', [email]
    );
    if (result.rows.length === 0)
      return res.status(400).json({ success: false, message: 'Invalid credentials.' });

    const user = result.rows[0];
    const isMatch = await bcrypt.compare(password, user.password_hash);
    if (!isMatch)
      return res.status(400).json({ success: false, message: 'Invalid credentials.' });

    const payload = { id: user.id, role: user.role };
    const accessToken = signAccessToken(payload);
    const refreshToken = signRefreshToken(payload);

    // Persist refresh token for rotation validation
    await pool.query(
      'UPDATE fleet_users SET refresh_token = $1 WHERE id = $2',
      [refreshToken, user.id]
    );

    return res.json({
      success: true,
      accessToken,
      refreshToken,
      user: { id: user.id, email: user.email, role: user.role },
    });
  } catch (error) {
    return res.status(500).json({ success: false, error: error.message });
  }
};

// LOGOUT — revoke refresh token
export const logout = async (req, res) => {
  const userId = req.user?.id;
  if (!userId) return res.status(400).json({ success: false, message: 'Not authenticated.' });
  await revokeRefreshToken(userId);
  return res.json({ success: true, message: 'Logged out.' });
};