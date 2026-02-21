import express from 'express';
import pool from './config/db.js';

const app = express();
app.use(express.json());
const PORT = process.env.PORT || 5000;

app.get('/', async (req, res) => {
  try {
    const result = await pool.query("SELECT current_database()");
    res.json({
      msg: "Welcome to Hotel DB",
      database: result.rows[0].current_database
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.listen(PORT, () => {
  console.log(`Server running  on port ${PORT}`);
});