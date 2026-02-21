import pool from '../config/db.js';


// CREATE VEHICLE
export const createVehicle = async (req, res) => {
  const { name_model, license_plate, max_load_kg } = req.body;

  try {
    const result = await pool.query(
      `INSERT INTO vehicles (name_model, license_plate, max_load_kg)
       VALUES ($1, $2, $3)
       RETURNING *`,
      [name_model, license_plate, max_load_kg]
    );

    res.status(201).json(result.rows[0]);

  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};


// GET ALL VEHICLES
export const getAllVehicles = async (req, res) => {
  try {
    const result = await pool.query(
      `SELECT * FROM vehicles ORDER BY id`
    );
    res.json(result.rows);

  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};


// GET VEHICLE BY ID
export const getVehicleById = async (req, res) => {
  const { id } = req.params;

  try {
    const result = await pool.query(
      `SELECT * FROM vehicles WHERE id = $1`,
      [id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ message: "Vehicle not found" });
    }

    res.json(result.rows[0]);

  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};


// UPDATE VEHICLE
export const updateVehicle = async (req, res) => {
  const { id } = req.params;
  const { name_model, max_load_kg, odometer, status } = req.body;

  try {
    const result = await pool.query(
      `UPDATE vehicles
       SET name_model = $1,
           max_load_kg = $2,
           odometer = $3,
           status = $4
       WHERE id = $5
       RETURNING *`,
      [name_model, max_load_kg, odometer, status, id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ message: "Vehicle not found" });
    }

    res.json(result.rows[0]);

  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};


// DELETE VEHICLE
export const deleteVehicle = async (req, res) => {
  const { id } = req.params;

  try {
    const result = await pool.query(
      `DELETE FROM vehicles WHERE id = $1 RETURNING *`,
      [id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ message: "Vehicle not found" });
    }

    res.json({ message: "Vehicle deleted successfully" });

  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};