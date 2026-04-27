import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import { connectDB } from './config/db.js';
import routes from './routes/index.js';

const app = express();
const PORT = process.env.PORT || 3000;

app.use(cors({
  origin: 'http://localhost:5173',
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS', 'PATCH'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.use('/api', routes);

// Fix schema constraint
app.post('/api/fix-schema', async (req, res) => {
  try {
    const pool = await connectDB();
    
    // Drop and recreate Orders CHECK constraint
    await pool.request().query(`
      ALTER TABLE Orders DROP CONSTRAINT CK__Orders__Status__02FC7413
    `);
    
    await pool.request().query(`
      ALTER TABLE Orders ADD CONSTRAINT CK_Orders_Status 
      CHECK (Status IN ('Pending', 'Confirmed', 'Shipped', 'Delivered', 'Cancelled', 'Returned', 'Completed'))
    `);
    
    res.json({ message: 'Schema fixed - Completed status now allowed' });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

connectDB().then(() => {
  app.listen(PORT, () => console.log(`🚀 Server running on http://localhost:${PORT}`));
});