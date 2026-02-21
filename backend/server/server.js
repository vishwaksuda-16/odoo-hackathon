import dotenv from 'dotenv'
dotenv.config();
import express from 'express';
import pool from './config/db.js';
import maintenanceRoutes from './routes/maintenanceRoutes.js';
import authRoutes from './routes/authRoute.js';
import vehicleRoute from './routes/vehicleRoute.js'
import driverRoute from './routes/driverRoute.js'
import tripRoute from './routes/tripsRoute.js'

const app = express();
app.use(express.json());
const PORT = process.env.PORT || 5000;

app.get('/', async (req, res) => {
  try {
    const result = await pool.query("SELECT current_database()");
    const dbName = result.rows[0].current_database;
    
    res.json({ 
      msg: `Welcome to ${dbName}`, 
      database: dbName 
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});


app.use('/',maintenanceRoutes)
app.use('/users',authRoutes);
app.use('/vehicle',vehicleRoute)
app.use('/driver',driverRoute)
app.use('/api',tripRoute)
app.listen(PORT, () => {
  console.log(`Server running  on port ${PORT}`);
});