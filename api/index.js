import express from "express";
import "dotenv/config";
import cors from "cors";
import db from "../db/database.js";

import userRoutes from "./routes/users.js";
import sessionRoutes from "./routes/sessions.js";
import exerciseRoutes from "./routes/exercises.js";

const app = express();
const port = 5000;

app.use(cors());
app.use(express.json());

// Verify DB Connection
try {
  db.prepare("SELECT 1").run();
  console.log("Database connected.");
} catch (e) {
  console.error("Failed to connect to database:", e.message);
  process.exit(1);
}

// Establish Routes
app.use("/api/users", userRoutes);
app.use("/api/sessions", sessionRoutes);
app.use("/api/exercises", exerciseRoutes);

// 404 handler
app.use((req, res) => {
  res.status(404).json({ error: "Route not found" });
});

// Global error handler
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ error: err.message || "Internal server error" });
});

app.listen(port, () => {
  console.log(`Server started on port ${port}...`);
});
