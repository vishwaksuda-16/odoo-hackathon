import pool, { withTransaction } from '../config/db.js';
import { StateService } from '../services/stateService.js';

export const createVehicle = async (req, res) => {
  const { name_model, license_plate, max_load_kg, vehicle_class = 'van', region, service_due_km } = req.body;

  if (!name_model || !license_plate || !max_load_kg)
    return res.status(400).json({ success: false, message: 'name_model, license_plate, and max_load_kg are required.' });

  try {
    const result = await pool.query(
      `INSERT INTO vehicles (name_model, license_plate, max_load_kg, vehicle_class, region, service_due_km)
       VALUES ($1, $2, $3, $4, $5, COALESCE($6, 10000))
       RETURNING *`,
      [name_model, license_plate, max_load_kg, vehicle_class, region ?? null, service_due_km ?? null]
    );
    return res.status(201).json({ success: true, vehicle: result.rows[0] });
  } catch (error) {
    if (error.code === '23505')
      return res.status(409).json({ success: false, message: 'License plate already registered.' });
    return res.status(500).json({ success: false, error: error.message });
  }
};

export const getAllVehicles = async (req, res) => {
  const { status, vehicle_class, region, include_retired = 'false' } = req.query;

  const conditions = ['deleted_at IS NULL'];
  const params = [];

  if (include_retired !== 'true') {
    conditions.push(`status != 'retired'`);
  }
  if (status) {
    params.push(status);
    conditions.push(`status = $${params.length}`);
  }
  if (vehicle_class) {
    params.push(vehicle_class);
    conditions.push(`vehicle_class = $${params.length}`);
  }
  if (region) {
    params.push(region);
    conditions.push(`region = $${params.length}`);
  }

  const where = conditions.length ? `WHERE ${conditions.join(' AND ')}` : '';

  try {
    const result = await pool.query(
      `SELECT * FROM vehicles ${where} ORDER BY id`,
      params
    );
    return res.json({ success: true, count: result.rows.length, vehicles: result.rows });
  } catch (error) {
    return res.status(500).json({ success: false, error: error.message });
  }
};

export const getVehicleById = async (req, res) => {
  const { id } = req.params;
  try {
    const result = await pool.query(`SELECT * FROM vehicles WHERE id = $1`, [id]);
    if (result.rows.length === 0)
      return res.status(404).json({ success: false, message: 'Vehicle not found.' });
    return res.json({ success: true, vehicle: result.rows[0] });
  } catch (error) {
    return res.status(500).json({ success: false, error: error.message });
  }
};

export const updateVehicle = async (req, res) => {
  const { id } = req.params;
  const { name_model, max_load_kg, vehicle_class, region, service_due_km } = req.body;

  try {
    const result = await pool.query(
      `UPDATE vehicles
       SET name_model     = COALESCE($1, name_model),
           max_load_kg    = COALESCE($2, max_load_kg),
           vehicle_class  = COALESCE($3, vehicle_class),
           region         = COALESCE($4, region),
           service_due_km = COALESCE($5, service_due_km)
       WHERE id = $6 AND deleted_at IS NULL
       RETURNING *`,
      [name_model, max_load_kg, vehicle_class, region, service_due_km, id]
    );
    if (result.rows.length === 0)
      return res.status(404).json({ success: false, message: 'Vehicle not found.' });
    return res.json({ success: true, vehicle: result.rows[0] });
  } catch (error) {
    return res.status(500).json({ success: false, error: error.message });
  }
};

export const retireVehicle = async (req, res) => {
  const { id } = req.params;
  const performedBy = req.user?.id ?? null;

  try {
    await withTransaction(async (client) => {
      await StateService.retireVehicle(parseInt(id, 10), client, performedBy);
    });
    return res.json({ success: true, message: 'Vehicle retired successfully.' });
  } catch (error) {
    if (error.code === 'ILLEGAL_STATE_TRANSITION' || error.message?.startsWith('ILLEGAL_'))
      return res.status(409).json({ success: false, message: error.message });
    if (error.status === 404)
      return res.status(404).json({ success: false, message: error.message });
    return res.status(500).json({ success: false, error: error.message });
  }
};

export const softDeleteVehicle = async (req, res) => {
  const { id } = req.params;
  try {
    const result = await pool.query(
      `UPDATE vehicles SET deleted_at = NOW() WHERE id = $1 AND deleted_at IS NULL RETURNING id`,
      [id]
    );
    if (result.rows.length === 0)
      return res.status(404).json({ success: false, message: 'Vehicle not found.' });
    return res.json({ success: true, message: 'Vehicle removed from registry.' });
  } catch (error) {
    return res.status(500).json({ success: false, error: error.message });
  }
};