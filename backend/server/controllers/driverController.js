import pool from '../config/db.js';


// CREATE DRIVER
export const createDriver = async (req, res) => {
  const { name, license_expiry } = req.body;

  try {
    const result = await pool.query(
      `INSERT INTO drivers (name, license_expiry)
       VALUES ($1, $2)
       RETURNING *`,
      [name, license_expiry]
    );

    res.status(201).json(result.rows[0]);

  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};


// GET ALL DRIVERS
export const getAllDrivers = async (req, res) => {
  try {
    const result = await pool.query(
      `SELECT * FROM drivers ORDER BY id`
    );
    res.json(result.rows);

  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};


// GET DRIVER BY ID
export const getDriverById = async (req, res) => {
  const { id } = req.params;

  try {
    const result = await pool.query(
      `SELECT * FROM drivers WHERE id = $1`,
      [id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ message: "Driver not found" });
    }

    res.json(result.rows[0]);

  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};



export const updateDriver = async (req, res) => {
  const { id } = req.params;
  const { name, license_expiry, status, safety_score } = req.body;

  try {
    const result = await pool.query(
      `UPDATE drivers
       SET name = $1,
           license_expiry = $2,
           status = $3,
           safety_score = $4
       WHERE id = $5
       RETURNING *`,
      [name, license_expiry, status, safety_score, id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ message: "Driver not found" });
    }

    res.json(result.rows[0]);

  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};


// DELETE DRIVER
export const deleteDriver = async (req, res) => {
  const { id } = req.params;

  try {
    const result = await pool.query(
      `DELETE FROM drivers WHERE id = $1 RETURNING *`,
      [id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ message: "Driver not found" });
    }

    res.json({ message: "Driver deleted successfully" });

  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};