import mysql from "mysql2/promise";
import { config } from "dotenv";

config();

const pool = mysql.createPool({
  connectionLimit: process.env.DB_CONNECTION_LIMIT, // Bạn có thể đặt giá trị cố định nếu không cần cấu hình từ .env
  host: process.env.DB_HOST,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME,
});

export default pool;
