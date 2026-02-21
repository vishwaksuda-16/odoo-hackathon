import jwt from 'jsonwebtoken';
import pool from '../config/db.js';

const ACCESS_SECRET = process.env.JWT_SECRET;
const REFRESH_SECRET = process.env.JWT_REFRESH_SECRET ?? process.env.JWT_SECRET + '_refresh';

/** Short-lived access token (15m) */
export function signAccessToken(payload) {
  return jwt.sign(payload, ACCESS_SECRET, { expiresIn: '15m' });
}

/** Long-lived refresh token (7d) */
export function signRefreshToken(payload) {
  return jwt.sign(payload, REFRESH_SECRET, { expiresIn: '7d' });
}

// ─────────────────────────────────────────────────────────────────
//  AUTHENTICATE middleware — verifies the short-lived access token
// ─────────────────────────────────────────────────────────────────
export const authenticate = (req, res, next) => {
  const authHeader = req.headers.authorization;
  if (!authHeader?.startsWith('Bearer ')) {
    return res.status(401).json({ success: false, message: 'Unauthorized: missing token.' });
  }

  const token = authHeader.split(' ')[1];
  try {
    req.user = jwt.verify(token, ACCESS_SECRET);
    next();
  } catch (err) {
    const msg = err.name === 'TokenExpiredError'
      ? 'Token expired — refresh required.'
      : 'Invalid token.';
    return res.status(401).json({ success: false, message: msg });
  }
};

// ─────────────────────────────────────────────────────────────────
//  REFRESH TOKEN handler — issues new access + refresh token pair
// ─────────────────────────────────────────────────────────────────
export const refreshAccessToken = async (req, res) => {
  const { refreshToken } = req.body;
  if (!refreshToken)
    return res.status(400).json({ success: false, message: 'Refresh token required.' });

  try {
    const payload = jwt.verify(refreshToken, REFRESH_SECRET);

    // Validate token is stored in DB (rotation check)
    const { rows } = await pool.query(
      'SELECT id, role FROM fleet_users WHERE id = $1 AND refresh_token = $2',
      [payload.id, refreshToken]
    );
    if (rows.length === 0)
      return res.status(401).json({ success: false, message: 'Refresh token revoked.' });

    const user = rows[0];
    const newAccessToken = signAccessToken({ id: user.id, role: user.role });
    const newRefreshToken = signRefreshToken({ id: user.id, role: user.role });

    // Rotate: store new refresh token
    await pool.query(
      'UPDATE fleet_users SET refresh_token = $1 WHERE id = $2',
      [newRefreshToken, user.id]
    );

    return res.json({ success: true, accessToken: newAccessToken, refreshToken: newRefreshToken });
  } catch (err) {
    return res.status(401).json({ success: false, message: 'Invalid or expired refresh token.' });
  }
};

/**
 * Revoke a refresh token on logout.
 */
export const revokeRefreshToken = async (userId) => {
  await pool.query('UPDATE fleet_users SET refresh_token = NULL WHERE id = $1', [userId]);
};