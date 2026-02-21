import pool, { withTransaction } from '../config/db.js';
import { StateService } from '../services/stateService.js';

export const createDriver = async (req, res) => {
  const { name, license_expiry, license_category = 'van' } = req.body;

  if (!name || !license_expiry)
    return res.status(400).json({ success: false, message: 'name and license_expiry are required.' });

  try {
    const result = await pool.query(
      `INSERT INTO drivers (name, license_expiry, license_category)
       VALUES ($1, $2, $3)
       RETURNING *`,
      [name, license_expiry, license_category]
    );
    return res.status(201).json({ success: true, driver: result.rows[0] });
  } catch (error) {
    return res.status(500).json({ success: false, error: error.message });
  }
};

export const getAllDrivers = async (req, res) => {
  const { status, include_deleted = 'false' } = req.query;
  const conditions = [];
  const params = [];

  if (include_deleted !== 'true') {
    conditions.push('deleted_at IS NULL');
  }
  if (status) {
    params.push(status);
    conditions.push(`status = $${params.length}`);
  }

  const where = conditions.length ? `WHERE ${conditions.join(' AND ')}` : '';

  try {
    const result = await pool.query(
      `SELECT * FROM drivers ${where} ORDER BY id`,
      params
    );
    return res.json({ success: true, count: result.rows.length, drivers: result.rows });
  } catch (error) {
    return res.status(500).json({ success: false, error: error.message });
  }
};

export const getDriverById = async (req, res) => {
  const { id } = req.params;
  try {
    const result = await pool.query(`SELECT * FROM drivers WHERE id = $1`, [id]);
    if (result.rows.length === 0)
      return res.status(404).json({ success: false, message: 'Driver not found.' });
    return res.json({ success: true, driver: result.rows[0] });
  } catch (error) {
    return res.status(500).json({ success: false, error: error.message });
  }
};

export const updateDriver = async (req, res) => {
  const { id } = req.params;
  const { name, license_expiry, license_category, safety_score } = req.body;

  try {
    const result = await pool.query(
      `UPDATE drivers
       SET name              = COALESCE($1, name),
           license_expiry    = COALESCE($2, license_expiry),
           license_category  = COALESCE($3, license_category),
           safety_score      = COALESCE($4, safety_score)
       WHERE id = $5 AND deleted_at IS NULL
       RETURNING *`,
      [name, license_expiry, license_category, safety_score, id]
    );
    if (result.rows.length === 0)
      return res.status(404).json({ success: false, message: 'Driver not found.' });
    return res.json({ success: true, driver: result.rows[0] });
  } catch (error) {
    return res.status(500).json({ success: false, error: error.message });
  }
};

export const patchDriverStatus = async (req, res) => {
  const { id } = req.params;
  const { status } = req.body;
  const performedBy = req.user?.id ?? null;

  if (!status)
    return res.status(400).json({ success: false, message: 'status is required.' });

  const VALID_STATUSES = ['on_duty', 'off_duty', 'suspended'];
  if (!VALID_STATUSES.includes(status))
    return res.status(400).json({
      success: false,
      message: `Invalid status. Must be one of: ${VALID_STATUSES.join(', ')}.`,
    });

  try {
    await withTransaction(async (client) => {
      await StateService.transitionDriver(parseInt(id, 10), status, client, performedBy);
    });

    const { rows } = await pool.query('SELECT * FROM drivers WHERE id = $1', [id]);
    return res.json({ success: true, driver: rows[0] });
  } catch (error) {
    if (error.code === 'ILLEGAL_STATE_TRANSITION' || error.message?.startsWith('ILLEGAL_'))
      return res.status(409).json({ success: false, message: error.message });
    if (error.status === 404)
      return res.status(404).json({ success: false, message: error.message });
    return res.status(500).json({ success: false, error: error.message });
  }
};

export const deleteDriver = async (req, res) => {
  const { id } = req.params;
  try {
    const result = await pool.query(
      `UPDATE drivers SET deleted_at = NOW() WHERE id = $1 AND deleted_at IS NULL RETURNING id`,
      [id]
    );
    if (result.rows.length === 0)
      return res.status(404).json({ success: false, message: 'Driver not found.' });
    return res.json({ success: true, message: 'Driver removed from registry.' });
  } catch (error) {
    return res.status(500).json({ success: false, error: error.message });
  }
};