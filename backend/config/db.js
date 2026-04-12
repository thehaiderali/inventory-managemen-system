import sql from "mssql";
import dotenv from "dotenv";
dotenv.config();

const dbConfig = {
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  server: process.env.DB_SERVER,
  database: process.env.DB_NAME,
  port: parseInt(process.env.DB_PORT),
  options: {
    encrypt: false,
    trustServerCertificate: true,
  },
  pool: {
    max: 10,
    min: 0,
    idleTimeoutMillis: 30000,
  },
};


let pool;


const connectDB = async () => {
  try {
    if (pool) {
      console.log("Reusing existing database connection pool.");
      return pool;
    }
    console.log("Connecting to database...");
    pool = await sql.connect(dbConfig);
    console.log("✅ Database connected successfully!");
    return pool;
  } catch (err) {
    console.error("❌ Database connection failed:", err.message);
    process.exit(1);
  }
};


export { connectDB, sql };
