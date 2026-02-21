import pool from '../config/db.js';
import bcrypt from 'bcrypt';
import { signAccessToken, signRefreshToken, revokeRefreshToken } from '../middleware/authMiddleware.js';

export const register = async (req, res) => {
  const { username, email, password, confirmPassword, role } = req.body;

  if (!username || !email || !password || !confirmPassword || !role)
    return res.status(400).json({ success: false, message: 'All fields are required.' });

  if (password !== confirmPassword)
    return res.status(400).json({ success: false, message: 'Passwords do not match.' });

  if (password.length < 6)
    return res.status(400).json({ success: false, message: 'Password must be at least 6 characters.' });

  const VALID_ROLES = ['manager', 'dispatcher', 'safety_officer', 'analyst'];
  if (!VALID_ROLES.includes(role))
    return res.status(400).json({ success: false, message: `Invalid role. Must be one of: ${VALID_ROLES.join(', ')}.` });

  try {
    const byUsername = await pool.query('SELECT id FROM fleet_users WHERE username = $1', [username]);
    if (byUsername.rows.length > 0)
      return res.status(400).json({ success: false, message: 'Username already taken.' });

    const byEmail = await pool.query('SELECT id FROM fleet_users WHERE email = $1', [email]);
    if (byEmail.rows.length > 0)
      return res.status(400).json({ success: false, message: 'Email already registered.' });

    const hashedPassword = await bcrypt.hash(password, 10);

    const result = await pool.query(
      `INSERT INTO fleet_users (username, email, password_hash, role)
       VALUES ($1, $2, $3, $4)
       RETURNING id, username, email, role`,
      [username, email, hashedPassword, role]
    );

    return res.status(201).json({ success: true, user: result.rows[0] });
  } catch (error) {
    return res.status(500).json({ success: false, error: error.message });
  }
};

export const login = async (req, res) => {
  const { login: loginInput, password } = req.body;

  if (!loginInput || !password)
    return res.status(400).json({ success: false, message: 'Username/email and password are required.' });

  try {
    const result = await pool.query(
      `SELECT * FROM fleet_users WHERE username = $1 OR email = $1`,
      [loginInput]
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

    await pool.query(
      'UPDATE fleet_users SET refresh_token = $1 WHERE id = $2',
      [refreshToken, user.id]
    );

    return res.json({
      success: true,
      accessToken,
      refreshToken,
      user: { id: user.id, username: user.username, email: user.email, role: user.role },
    });
  } catch (error) {
    return res.status(500).json({ success: false, error: error.message });
  }
};

export const logout = async (req, res) => {
  const userId = req.user?.id;
  if (!userId) return res.status(400).json({ success: false, message: 'Not authenticated.' });
  await revokeRefreshToken(userId);
  return res.json({ success: true, message: 'Logged out.' });
};