import Database from "better-sqlite3";
import { readFileSync } from "fs";
import { fileURLToPath } from "url";
import { dirname, join } from "path";

const __dirname = dirname(fileURLToPath(import.meta.url));

const db = new Database(join(__dirname, "workout.db"));

// Enable foreign keys (SQLite has them off by default)
db.pragma("foreign_keys = ON");

// Run schema
const schema = readFileSync(join(__dirname, "schema.sql"), "utf8");
db.exec(schema);

export default db;

// Replace the above code with this to switch to a real MySQL Database
// import mysql from "mysql2/promise";

// const db = mysql.createPool({
//   host: process.env.DB_HOST,
//   user: process.env.DB_USER,
//   password: process.env.DB_PASSWORD,
//   database: process.env.DB_NAME,
//   port: process.env.DB_PORT || 3306,
// });

// // Verify connection
// try {
//   const conn = await db.getConnection();
//   console.log("Database connected.");
//   conn.release();
// } catch (err) {
//   console.error("Failed to connect to database:", err.message);
//   process.exit(1);
// }

// export default db;
